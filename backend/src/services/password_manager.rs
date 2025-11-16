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
}

impl PasswordManager {
    /// Create a new password manager
    pub fn new(db: Arc<Database>, master_key: String) -> Self {
        Self {
            db,
            master_key: Arc::new(RwLock::new(master_key)),
            user_master_keys: Arc::new(RwLock::new(std::collections::HashMap::new())),
        }
    }

    /// Set master key for a specific user (derived from their login password)
    pub async fn set_user_master_key(&self, user_id: uuid::Uuid, user_password: &str) {
        let mut keys = self.user_master_keys.write().await;
        // Use the user's password directly as their master key
        keys.insert(user_id, user_password.to_string());
    }

    /// Clear master key for a specific user (called on logout)
    pub async fn clear_user_master_key(&self, user_id: uuid::Uuid) {
        let mut keys = self.user_master_keys.write().await;
        keys.remove(&user_id);
        log::debug!("Cleared master key for user: {}", user_id);
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

    /// Initialize with default passwords
    pub async fn initialize_default_passwords(&self) -> AppResult<()> {
        let default_passwords = vec![
            ("AldiBabi", "AldiBabi"),
            ("AldiAnjing", "AldiAnjing"),
            ("YantoAnjing", "YantoAnjing"),
            ("YantoBabi", "YantoBabi"),
        ];

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
                    log::error!("{}", error_msg);
                    errors.push(error_msg);
                    // Continue with other passwords even if one fails
                }
            }
        }

        if !errors.is_empty() {
            return Err(AppError::Internal(format!("Failed to initialize some default passwords: {}", errors.join("; "))));
        }

        Ok(())
    }

    /// Initialize all application passwords from environment variables
    /// This migrates existing passwords to the password manager
    pub async fn initialize_application_passwords(&self) -> AppResult<()> {
        use std::env;
        
        // List of all passwords to migrate
        let passwords_to_migrate = vec![
            ("DB_PASSWORD", 180), // Database password - rotate every 6 months
            ("JWT_SECRET", 90),   // JWT secret - rotate every 3 months
            ("JWT_REFRESH_SECRET", 90),
            ("REDIS_PASSWORD", 180), // Redis password - rotate every 6 months
            ("CSRF_SECRET", 90),  // CSRF secret - rotate every 3 months
            ("SMTP_PASSWORD", 90), // SMTP password - rotate every 3 months
            ("STRIPE_SECRET_KEY", 90), // Stripe secret - rotate every 3 months
            ("STRIPE_WEBHOOK_SECRET", 90),
            ("API_KEY", 180), // API key - rotate every 6 months
            ("GRAFANA_PASSWORD", 180), // Grafana password - rotate every 6 months
        ];

        let mut errors = Vec::new();
        for (env_var, rotation_days) in passwords_to_migrate {
            // Skip if already in password manager (system passwords use None for user_id)
            // Use get_entry_by_name to avoid decryption overhead
            match self.get_entry_by_name(env_var).await {
                Ok(_) => {
                    log::debug!("Password '{}' already exists in password manager, skipping", env_var);
                    continue;
                }
                Err(AppError::NotFound(_)) => {
                    // Entry doesn't exist, try to migrate it
                    log::debug!("Password '{}' not found, attempting migration", env_var);
                }
                Err(e) => {
                    // Database error - log and continue
                    log::warn!("Error checking password '{}': {:?}, attempting migration anyway", env_var, e);
                }
            }

            // Try to get from environment
            if let Ok(password) = env::var(env_var) {
                if !password.is_empty() {
                    match self.create_password(env_var, &password, rotation_days, None).await {
                        Ok(_) => {
                            log::info!("Migrated password '{}' to password manager", env_var);
                        }
                        Err(e) => {
                            let error_msg = format!("Failed to migrate password '{}': {:?}", env_var, e);
                            log::error!("{}", error_msg);
                            errors.push(error_msg);
                            // Continue with other passwords even if one fails
                        }
                    }
                } else {
                    log::warn!("Password '{}' is empty in environment, skipping", env_var);
                }
            } else {
                log::debug!("Password '{}' not found in environment, skipping", env_var);
            }
        }

        if !errors.is_empty() {
            return Err(AppError::Internal(format!("Failed to migrate some application passwords: {}", errors.join("; "))));
        }

        Ok(())
    }

    /// Create a new password entry
    pub async fn create_password(
        &self,
        name: &str,
        password: &str,
        rotation_interval_days: i32,
        user_id: Option<uuid::Uuid>,
    ) -> AppResult<PasswordEntry> {
        let encrypted = self.encrypt_password(password, user_id).await?;
        let now = Utc::now();
        let next_rotation = now + chrono::Duration::days(rotation_interval_days as i64);

        let entry = PasswordEntry {
            id: uuid::Uuid::new_v4().to_string(),
            name: name.to_string(),
            encrypted_password: encrypted,
            created_at: now,
            updated_at: now,
            last_rotated_at: None,
            rotation_interval_days,
            next_rotation_due: next_rotation,
            is_active: true,
            created_by: user_id.map(|id| id.to_string()),
            metadata: None,
        };

        // Store in database (simplified - in production, use proper DB schema)
        self.store_password_entry(&entry).await?;

        Ok(entry)
    }

    /// Get password by name
    pub async fn get_password_by_name(&self, name: &str, user_id: Option<uuid::Uuid>) -> AppResult<String> {
        let entry = self.load_password_entry(name).await?;
        self.decrypt_password(&entry.encrypted_password, user_id).await
    }

    /// Get password entry by name
    pub async fn get_entry_by_name(&self, name: &str) -> AppResult<PasswordEntry> {
        self.load_password_entry(name).await
    }

    /// Rotate a password
    pub async fn rotate_password(&self, name: &str, new_password: Option<&str>, user_id: Option<uuid::Uuid>) -> AppResult<PasswordEntry> {
        let mut entry = self.load_password_entry(name).await?;

        // Generate new password if not provided
        let new_pass = match new_password {
            Some(p) => p.to_string(),
            None => self.generate_secure_password(16).await?,
        };

        // Encrypt new password with user's master key
        entry.encrypted_password = self.encrypt_password(&new_pass, user_id).await?;
        entry.last_rotated_at = Some(Utc::now());
        entry.updated_at = Utc::now();
        entry.next_rotation_due = Utc::now() + chrono::Duration::days(entry.rotation_interval_days as i64);

        // Update in database
        self.store_password_entry(&entry).await?;

        Ok(entry)
    }

    /// Rotate all passwords due for rotation
    pub async fn rotate_due_passwords(&self) -> AppResult<Vec<String>> {
        let now = Utc::now();
        let entries = self.get_all_entries().await?;
        let mut rotated = Vec::new();

        for entry in entries {
            if entry.next_rotation_due <= now && entry.is_active {
                self.rotate_password(&entry.name, None, None).await?;
                rotated.push(entry.name);
            }
        }

        Ok(rotated)
    }

    /// Get all password entries (metadata only, no passwords)
    pub async fn list_passwords(&self) -> AppResult<Vec<PasswordEntry>> {
        let entries = self.get_all_entries().await?;
        
        // Return entries with masked passwords
        Ok(entries.into_iter().map(|mut e| {
            e.encrypted_password = "***ENCRYPTED***".to_string();
            e
        }).collect())
    }

    /// Update rotation interval
    pub async fn update_rotation_interval(
        &self,
        name: &str,
        interval_days: i32,
    ) -> AppResult<PasswordEntry> {
        let mut entry = self.load_password_entry(name).await?;
        entry.rotation_interval_days = interval_days;
        entry.next_rotation_due = Utc::now() + chrono::Duration::days(interval_days as i64);
        entry.updated_at = Utc::now();

        self.store_password_entry(&entry).await?;
        Ok(entry)
    }

    /// Deactivate a password entry
    pub async fn deactivate_password(&self, name: &str) -> AppResult<()> {
        let mut entry = self.load_password_entry(name).await?;
        entry.is_active = false;
        entry.updated_at = Utc::now();

        self.store_password_entry(&entry).await?;
        Ok(())
    }

    /// Get rotation schedule for all passwords
    pub async fn get_rotation_schedule(&self) -> AppResult<Vec<RotationSchedule>> {
        let entries = self.get_all_entries().await?;
        
        Ok(entries.into_iter().map(|e| RotationSchedule {
            entry_id: e.id.clone(),
            rotation_interval_days: e.rotation_interval_days,
            last_rotated: e.last_rotated_at,
            next_rotation: e.next_rotation_due,
        }).collect())
    }

    // Private helper methods

    /// Encrypt password with optional user-specific master key
    async fn encrypt_password(&self, password: &str, user_id: Option<uuid::Uuid>) -> AppResult<String> {
        use aes_gcm::{
            aead::{Aead, AeadCore, KeyInit},
            Aes256Gcm,
        };
        use base64::engine::{general_purpose, Engine};
        use sha2::{Digest, Sha256};
        
        let master_key = self.get_master_key_for_user(user_id).await;
        
        // Derive 256-bit key from master key using SHA-256
        let mut hasher = Sha256::new();
        hasher.update(master_key.as_bytes());
        let key_bytes = hasher.finalize();
        
        // Initialize AES-GCM cipher
        let cipher = Aes256Gcm::new_from_slice(&key_bytes)
            .map_err(|e| AppError::InternalServerError(format!("Failed to initialize cipher: {}", e)))?;
        
        // Generate random nonce (12 bytes for GCM)
        let nonce = Aes256Gcm::generate_nonce(&mut rand::thread_rng());
        
        // Encrypt password
        let ciphertext = cipher
            .encrypt(&nonce, password.as_bytes())
            .map_err(|e| AppError::InternalServerError(format!("Failed to encrypt password: {}", e)))?;
        
        // Combine nonce and ciphertext, then encode to base64
        let mut combined = nonce.to_vec();
        combined.extend_from_slice(&ciphertext);
        let encoded = general_purpose::STANDARD.encode(&combined);
        
        Ok(encoded)
    }

    /// Decrypt password with optional user-specific master key
    async fn decrypt_password(&self, encrypted: &str, user_id: Option<uuid::Uuid>) -> AppResult<String> {
        use aes_gcm::{
            aead::{Aead, KeyInit},
            Aes256Gcm, Nonce,
        };
        use base64::engine::{general_purpose, Engine};
        use sha2::{Digest, Sha256};
        
        let master_key = self.get_master_key_for_user(user_id).await;
        
        // Decode from base64
        let combined = general_purpose::STANDARD
            .decode(encrypted)
            .map_err(|e| AppError::InternalServerError(format!("Failed to decode password: {}", e)))?;
        
        if combined.len() < 12 {
            return Err(AppError::InternalServerError("Invalid encrypted data format".to_string()));
        }
        
        // Extract nonce (first 12 bytes) and ciphertext (rest)
        let nonce = Nonce::from_slice(&combined[..12]);
        let ciphertext = &combined[12..];
        
        // Derive key from master key
        let mut hasher = Sha256::new();
        hasher.update(master_key.as_bytes());
        let key_bytes = hasher.finalize();
        
        // Initialize AES-GCM cipher
        let cipher = Aes256Gcm::new_from_slice(&key_bytes)
            .map_err(|e| AppError::InternalServerError(format!("Failed to initialize cipher: {}", e)))?;
        
        // Decrypt password
        let plaintext = cipher
            .decrypt(nonce, ciphertext.as_ref())
            .map_err(|e| AppError::InternalServerError(format!("Failed to decrypt password: {}", e)))?;
        
        let password = String::from_utf8(plaintext)
            .map_err(|e| AppError::InternalServerError(format!("Invalid password encoding: {}", e)))?;
        
        Ok(password)
    }

    async fn generate_secure_password(&self, length: usize) -> AppResult<String> {
        use rand::Rng;
        const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        
        let mut rng = rand::thread_rng();
        let password: String = (0..length)
            .map(|_| {
                let idx = rng.gen_range(0..CHARSET.len());
                CHARSET[idx] as char
            })
            .collect();
        
        Ok(password)
    }

    // Database operations - using database storage
    async fn store_password_entry(&self, entry: &PasswordEntry) -> AppResult<()> {
        use crate::models::schema::password_entries;
        use diesel::prelude::*;
        
        let mut conn = self.db.get_connection()?;
        
        // Check if entry exists
        let exists = password_entries::table
            .filter(password_entries::name.eq(&entry.name))
            .first::<PasswordEntry>(&mut conn)
            .optional()
            .map_err(|e| {
                log::error!("Database error checking password entry '{}': {} (Error kind: {:?})", entry.name, e, e);
                // Log additional context for database errors
                match &e {
                    diesel::result::Error::DatabaseError(kind, info) => {
                        log::error!("Database constraint/error details: {:?}, {:?}", kind, info);
                    }
                    diesel::result::Error::NotFound => {
                        // This is expected when checking existence - not an error
                        log::debug!("Password entry '{}' not found (expected for new entries)", entry.name);
                    }
                    _ => {
                        log::error!("Unexpected database error type: {:?}", e);
                    }
                }
                AppError::Database(e)
            })?;
        
        if let Some(_existing) = exists {
            // Update existing entry
            diesel::update(password_entries::table.filter(password_entries::name.eq(&entry.name)))
                .set((
                    password_entries::encrypted_password.eq(&entry.encrypted_password),
                    password_entries::updated_at.eq(&entry.updated_at),
                    password_entries::last_rotated_at.eq(&entry.last_rotated_at),
                    password_entries::rotation_interval_days.eq(&entry.rotation_interval_days),
                    password_entries::next_rotation_due.eq(&entry.next_rotation_due),
                    password_entries::is_active.eq(&entry.is_active),
                ))
                .execute(&mut conn)
                .map_err(|e| {
                    log::error!("Database error updating password entry '{}': {} (Error kind: {:?})", entry.name, e, e);
                    AppError::Database(e)
                })?;
        } else {
            // Insert new entry
            diesel::insert_into(password_entries::table)
                .values(entry)
                .execute(&mut conn)
                .map_err(|e| {
                    log::error!("Database error inserting password entry '{}': {} (Error kind: {:?})", 
                        entry.name, e, e);
                    // Provide more context for debugging
                    match &e {
                        diesel::result::Error::DatabaseError(kind, info) => {
                            log::error!("Database constraint/error details: {:?}, {:?}", kind, info);
                        }
                        _ => {}
                    }
                    AppError::Database(e)
                })?;
        }
        
        Ok(())
    }

    async fn load_password_entry(&self, name: &str) -> AppResult<PasswordEntry> {
        use crate::models::schema::password_entries;
        use diesel::prelude::*;
        
        let mut conn = self.db.get_connection()?;
        
        let entry = password_entries::table
            .filter(password_entries::name.eq(name))
            .first::<PasswordEntry>(&mut conn)
            .optional()
            .map_err(|e| {
                log::error!("Database error loading password entry '{}': {}", name, e);
                AppError::Database(e)
            })?
            .ok_or_else(|| AppError::NotFound(format!("Password entry '{}' not found", name)))?;
        
        Ok(entry)
    }

    async fn get_all_entries(&self) -> AppResult<Vec<PasswordEntry>> {
        use crate::models::schema::password_entries;
        use diesel::prelude::*;
        
        let mut conn = self.db.get_connection()?;
        
        let entries = password_entries::table
            .order_by(password_entries::name)
            .load::<PasswordEntry>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        Ok(entries)
    }
    
    /// Log audit event for password access
    pub async fn log_audit(
        &self,
        password_entry_id: &str,
        action: &str,
        user_id: Option<&str>,
        ip_address: Option<&str>,
        user_agent: Option<&str>,
    ) -> AppResult<()> {
        use diesel::prelude::*;
        
        // Use raw SQL for INSERT since we don't have a model for audit log
        let mut conn = self.db.get_connection()?;
        
        // Insert audit log entry using raw SQL with string interpolation (safe since values are controlled)
        // In production, consider creating a proper Diesel model for audit_log
        let query = format!(
            r#"
            INSERT INTO password_audit_log 
            (password_entry_id, action, user_id, ip_address, user_agent, timestamp)
            VALUES ('{}', '{}', {}, {}, {}, NOW())
            "#,
            password_entry_id.replace("'", "''"), // Escape single quotes
            action.replace("'", "''"),
            user_id.map(|id| format!("'{}'", id.replace("'", "''"))).unwrap_or_else(|| "NULL".to_string()),
            ip_address.map(|ip| format!("'{}'", ip.replace("'", "''"))).unwrap_or_else(|| "NULL".to_string()),
            user_agent.map(|ua| format!("'{}'", ua.replace("'", "''"))).unwrap_or_else(|| "NULL".to_string()),
        );
        
        diesel::sql_query(&query)
            .execute(&mut conn)
            .map_err(|e| {
                // Log error but don't fail the operation - audit logging should be non-blocking
                log::warn!("Failed to log password audit to database: {}", e);
            })
            .ok();
        
        // Always log to application logs for redundancy
        log::info!(
            "Password audit: entry_id={}, action={}, user_id={:?}, ip={:?}, user_agent={:?}",
            password_entry_id,
            action,
            user_id,
            ip_address,
            user_agent
        );
        
        Ok(())
    }
}

/// Password rotation scheduler
pub struct PasswordRotationScheduler {
    password_manager: Arc<PasswordManager>,
    interval_seconds: u64,
}

impl PasswordRotationScheduler {
    pub fn new(password_manager: Arc<PasswordManager>, interval_seconds: u64) -> Self {
        Self {
            password_manager,
            interval_seconds,
        }
    }

    /// Start the rotation scheduler
    pub async fn start(&self) {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(self.interval_seconds));
        
        loop {
            interval.tick().await;
            
            if let Err(e) = self.password_manager.rotate_due_passwords().await {
                eprintln!("Error rotating passwords: {:?}", e);
            }
        }
    }
}

