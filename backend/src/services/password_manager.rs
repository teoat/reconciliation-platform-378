//! Password Manager Service
//! 
//! Provides secure password storage, retrieval, and rotation functionality

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::database::Database;
use crate::errors::{AppError, AppResult};

/// Password entry with metadata
#[derive(Debug, Clone, Serialize, Deserialize, diesel::Queryable, diesel::Selectable, diesel::Insertable, diesel::AsChangeset)]
#[diesel(table_name = crate::models::schema::password_entries)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct PasswordEntry {
    pub id: String,
    pub name: String,
    pub encrypted_password: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_rotated_at: Option<DateTime<Utc>>,
    pub rotation_interval_days: i32,
    pub next_rotation_due: DateTime<Utc>,
    pub is_active: bool,
    pub created_by: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

/// Password rotation schedule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RotationSchedule {
    pub entry_id: String,
    pub rotation_interval_days: i32,
    pub last_rotated: Option<DateTime<Utc>>,
    pub next_rotation: DateTime<Utc>,
}

/// Password manager service
pub struct PasswordManager {
    db: Arc<Database>,
    master_key: Arc<RwLock<String>>,
    // Per-user master keys (derived from user's login password)
    user_master_keys: Arc<RwLock<std::collections::HashMap<uuid::Uuid, String>>>,
    // Cache table existence check
    table_exists: Arc<RwLock<Option<bool>>>,
}

impl PasswordManager {
    /// Create a new password manager
    pub fn new(db: Arc<Database>, master_key: String) -> Self {
        Self {
            db,
            master_key: Arc::new(RwLock::new(master_key)),
            user_master_keys: Arc::new(RwLock::new(std::collections::HashMap::new())),
            table_exists: Arc::new(RwLock::new(None)),
        }
    }

    /// Verify that password_entries table exists
    /// Returns Ok(()) if table exists, Err if it doesn't
    pub async fn verify_table_exists(&self) -> AppResult<()> {
        // Check cache first
        {
            let cached = self.table_exists.read().await;
            if let Some(exists) = *cached {
                if exists {
                    return Ok(());
                } else {
                    return Err(AppError::Internal(
                        "password_entries table does not exist. Please run migrations: diesel migration run"
                    ));
                }
            }
        }

        // Check database
        let mut conn = self.db.get_connection()?;
        let table_exists: bool = diesel::sql_query(
            "SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'password_entries'
            )"
        )
        .get_result::<(bool,)>(&mut conn)
        .map(|(exists,)| exists)
        .map_err(|e| AppError::Database(format!("Failed to check table existence: {}", e)))?;

        // Cache result
        {
            let mut cache = self.table_exists.write().await;
            *cache = Some(table_exists);
        }

        if table_exists {
            Ok(())
        } else {
            Err(AppError::Internal(
                "password_entries table does not exist. Please run migrations: diesel migration run"
            ))
        }
    }

    /// Set master key for a specific user (derived from their login password)
    /// 
    /// ⚠️ DEPRECATED: Master keys should be separate from login passwords.
    /// This method is kept for backward compatibility but should not be used.
    /// Users should set a separate master password for password manager.
    #[deprecated(note = "Master keys should be separate from login passwords. Use set_master_password() instead.")]
    pub async fn set_user_master_key(&self, user_id: uuid::Uuid, user_password: &str) {
        let mut keys = self.user_master_keys.write().await;
        // Derive master key from password using PBKDF2 for better security
        // This avoids storing plaintext password in memory
        use pbkdf2::pbkdf2_hmac;
        use sha2::Sha256;
        use base64::engine::{general_purpose, Engine};
        
        let mut master_key = [0u8; 32];
        pbkdf2_hmac::<Sha256>(
            user_password.as_bytes(),
            user_id.to_string().as_bytes(), // Salt with user ID
            100000, // Iterations
            &mut master_key,
        );
        
        let encoded_key = general_purpose::STANDARD.encode(master_key);
        keys.insert(user_id, encoded_key);
        log::debug!("Set derived master key for user: {}", user_id);
    }
    
    /// Get or create OAuth master key for a user
    /// 
    /// ⚠️ DEPRECATED: OAuth users don't need password manager integration.
    /// This method is kept for backward compatibility but should not be used.
    /// OAuth users can set a master password separately if they want password manager.
    #[deprecated(note = "OAuth users don't need password manager. This method is no longer needed.")]
    pub async fn get_or_create_oauth_master_key(
        &self,
        user_id: uuid::Uuid,
        _email: &str,
    ) -> AppResult<String> {
        // Check if OAuth master key exists
        let key_name = format!("oauth_master_key_{}", user_id);
        match self.get_password_by_name(&key_name, None).await {
            Ok(key) => {
                log::debug!("Retrieved existing OAuth master key for user: {}", user_id);
                Ok(key)
            }
            Err(AppError::NotFound(_)) => {
                // Create new OAuth master key
                use rand::Rng;
                let mut rng = rand::thread_rng();
                let key_bytes: [u8; 32] = rng.gen();
                use base64::engine::{general_purpose, Engine};
                let new_key = general_purpose::STANDARD.encode(key_bytes);
                
                // Store in password manager (system passwords use None for user_id)
                self.create_password(&key_name, &new_key, 365, None).await?;
                log::info!("Created new OAuth master key for user: {}", user_id);
                Ok(new_key)
            }
            Err(e) => Err(e),
        }
    }

    /// Get master key for a specific user, or fall back to global master key
    async fn get_master_key_for_user(&self, user_id: Option<uuid::Uuid>) -> String {
        if let Some(uid) = user_id {
            let keys = self.user_master_keys.read().await;
            if let Some(key) = keys.get(&uid) {
                return key.clone();
            }
        }
        // Fall back to global master key
        self.master_key.read().await.clone()
    }
    
    /// Check and rotate user passwords that have expired
    pub async fn check_and_rotate_user_passwords(&self, db: Arc<crate::database::Database>) -> AppResult<Vec<uuid::Uuid>> {
        use crate::models::schema::users;
        use diesel::prelude::*;
        
        let mut conn = db.get_connection()?;
        let now = chrono::Utc::now();
        
        // Get users with expired passwords
        let expired_users: Vec<(uuid::Uuid, String)> = users::table
            .filter(users::password_expires_at.is_not_null())
            .filter(users::password_expires_at.lt(now))
            .filter(users::status.eq("active"))
            .select((users::id, users::email))
            .load::<(uuid::Uuid, String)>(&mut conn)
            .map_err(AppError::Database)?;
        
        let mut expired_user_ids = Vec::new();
        for (user_id, email) in expired_users {
            log::warn!("User {} ({}) has expired password", user_id, email);
            expired_user_ids.push(user_id);
            // In production, send password reset email here
        }
        
        Ok(expired_user_ids)
    }

    /// Initialize with default passwords
    /// 
    /// ⚠️ SECURITY NOTE: This method is for development/testing only.
    /// In production, passwords should be managed through environment variables
    /// or secure secret management systems, not hardcoded defaults.
    /// 
    /// Default passwords are only created if they don't already exist.
    /// This method gracefully handles missing table by returning early.
    pub async fn initialize_default_passwords(&self) -> AppResult<()> {
        // First, verify table exists
        if self.verify_table_exists().await.is_err() {
            log::info!("password_entries table does not exist - skipping default password initialization");
            log::info!("To enable password manager, run: diesel migration run");
            return Ok(()); // Non-fatal - return Ok to allow app to continue
        }

        // ⚠️ SECURITY: Default passwords should only be used in development
        // In production, use environment variables or secure secret management
        let default_passwords: Vec<(&str, &str)> = if std::env::var("ENVIRONMENT")
            .unwrap_or_else(|_| "development".to_string())
            .to_lowercase() == "production"
        {
            // In production, don't initialize default passwords
            log::warn!("Skipping default password initialization in production environment");
            return Ok(());
        } else {
            // Development/testing defaults - these should be changed in production
            vec![
                ("AldiBabi", "AldiBabi"),
                ("AldiAnjing", "AldiAnjing"),
                ("YantoAnjing", "YantoAnjing"),
                ("YantoBabi", "YantoBabi"),
            ]
        };

        let mut errors = Vec::new();
        for (name, password) in default_passwords {
            // Check if already exists using get_entry_by_name (no decryption needed)
            match self.get_entry_by_name(name).await {
                Ok(_) => {
                    log::debug!("Default password '{}' already exists, skipping", name);
                    continue;
                }
                Err(AppError::NotFound(_)) => {
                    // Entry doesn't exist, create it
                    log::debug!("Creating default password entry: {}", name);
                }
                Err(e) => {
                    // Database error - log and continue
                    log::warn!("Error checking password '{}': {:?}, attempting to create anyway", name, e);
                }
            }

            // Create new entry (system passwords use None for user_id)
            match self.create_password(name, password, 90, None).await {
                Ok(_) => {
                    log::info!("Created default password entry: {}", name);
                }
                Err(e) => {
                    let error_msg = format!("Failed to create default password '{}': {:?}", name, e);
                    log::warn!("{}", error_msg); // Changed from error to warn
                    errors.push(error_msg);
                    // Continue with other passwords even if one fails
                }
            }
        }

        if !errors.is_empty() {
            // Log warnings but don't fail - app can continue without default passwords
            log::warn!("Some default passwords could not be initialized: {}", errors.join("; "));
            log::info!("Password manager is still functional - default passwords are optional");
        }

        Ok(())
    }
