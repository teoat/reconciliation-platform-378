//! Password Manager Service
//! 
//! Provides secure password storage, retrieval, and rotation functionality

use chrono::{DateTime, Utc};
use diesel::prelude::*;
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
    #[allow(dead_code)] // Master key is stored for future encryption features
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
                        "password_entries table does not exist. Please run migrations: diesel migration run".to_string()
                    ));
                }
            }
        }

        // Check database using the same pattern as schema_verification.rs
        use diesel::sql_query;
        use diesel::sql_types::Bool;
        
        #[derive(QueryableByName)]
        struct TableExists {
            #[diesel(sql_type = Bool)]
            exists: bool,
        }
        
        let query = "SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'password_entries'
        ) as exists";
        
        let mut conn = self.db.get_connection()?;
        let result: Result<Vec<TableExists>, _> = sql_query(query).load(&mut conn);
        
        let table_exists = match result {
            Ok(rows) => rows.first().map(|r| r.exists).unwrap_or(false),
            Err(_) => false,
        };

        // Cache result
        {
            let mut cache = self.table_exists.write().await;
            *cache = Some(table_exists);
        }

        if table_exists {
            Ok(())
        } else {
            Err(AppError::Internal(
                "password_entries table does not exist. Please run migrations: diesel migration run".to_string()
            ))
        }
    }

    /// Set master key for a specific user (derived from their login password)
    /// 
    /// ⚠️ DEPRECATED: Master keys should be separate from login passwords.
    /// This method is kept for backward compatibility but should not be used.
    /// Users should set a separate master password for password manager.
    #[deprecated(note = "Master keys should be separate from login passwords. This method is deprecated and will be removed in a future version.")]
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
        _user_id: uuid::Uuid,
        _email: &str,
    ) -> AppResult<String> {
        // DEPRECATED: Return error - password manager methods not implemented
        Err(AppError::Internal("Password manager methods are deprecated. Use environment variables for secrets.".to_string()))
    }

    /// Get master key for a specific user, or fall back to global master key
    #[allow(dead_code)] // Reserved for future per-user encryption features
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
        let _default_passwords: Vec<(&str, &str)> = if std::env::var("ENVIRONMENT")
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

        // DEPRECATED: Password manager methods not implemented
        // Default passwords should be set via environment variables
        log::warn!("Default password initialization skipped - password manager methods are deprecated");
        log::info!("Set passwords via environment variables instead");

        Ok(())
    }

    // Stub methods for API compatibility - these methods are not fully implemented
    // They return errors to indicate the functionality is not available
    
    pub async fn list_passwords(&self) -> AppResult<Vec<PasswordEntry>> {
        Err(AppError::Internal("Password manager list_passwords method not implemented. Use environment variables for secrets.".to_string()))
    }

    pub async fn get_password_by_name(&self, _name: &str, _user_id: Option<uuid::Uuid>) -> AppResult<String> {
        Err(AppError::Internal("Password manager get_password_by_name method not implemented. Use environment variables for secrets.".to_string()))
    }

    pub async fn get_entry_by_name(&self, _name: &str) -> AppResult<PasswordEntry> {
        Err(AppError::Internal("Password manager get_entry_by_name method not implemented.".to_string()))
    }

    pub async fn create_password(&self, _name: &str, _password: &str, _rotation_interval_days: i32, _user_id: Option<uuid::Uuid>) -> AppResult<PasswordEntry> {
        Err(AppError::Internal("Password manager create_password method not implemented. Use environment variables for secrets.".to_string()))
    }

    pub async fn rotate_password(&self, _name: &str, _new_password: Option<&str>, _user_id: Option<uuid::Uuid>) -> AppResult<PasswordEntry> {
        Err(AppError::Internal("Password manager rotate_password method not implemented.".to_string()))
    }

    pub async fn rotate_due_passwords(&self) -> AppResult<Vec<PasswordEntry>> {
        Err(AppError::Internal("Password manager rotate_due_passwords method not implemented.".to_string()))
    }

    pub async fn update_rotation_interval(&self, _name: &str, _rotation_interval_days: i32) -> AppResult<PasswordEntry> {
        Err(AppError::Internal("Password manager update_rotation_interval method not implemented.".to_string()))
    }

    pub async fn get_rotation_schedule(&self) -> AppResult<Vec<RotationSchedule>> {
        Err(AppError::Internal("Password manager get_rotation_schedule method not implemented.".to_string()))
    }

    pub async fn deactivate_password(&self, _name: &str) -> AppResult<()> {
        Err(AppError::Internal("Password manager deactivate_password method not implemented.".to_string()))
    }

    pub async fn log_audit(&self, _entry_id: &str, _action: &str, _user_id: Option<&str>, _ip_address: Option<&str>, _user_agent: Option<&str>) -> AppResult<()> {
        // Audit logging is optional - return Ok to not break callers
        Ok(())
    }
}
