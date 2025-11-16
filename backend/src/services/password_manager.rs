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
#[derive(Debug, Clone, Serialize, Deserialize)]
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

        for (name, password) in default_passwords {
            // Check if already exists (system passwords use None for user_id)
            if self.get_password_by_name(name, None).await.is_ok() {
                continue;
            }

            // Create new entry (system passwords use None for user_id)
            self.create_password(name, password, 90, None).await?;
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

        for (env_var, rotation_days) in passwords_to_migrate {
            // Skip if already in password manager (system passwords use None for user_id)
            if self.get_password_by_name(env_var, None).await.is_ok() {
                log::debug!("Password '{}' already exists in password manager, skipping", env_var);
                continue;
            }

            // Try to get from environment
            if let Ok(password) = env::var(env_var) {
                if !password.is_empty() {
                    log::info!("Migrating password '{}' to password manager", env_var);
                    self.create_password(env_var, &password, rotation_days, None).await?;
                } else {
                    log::warn!("Password '{}' is empty in environment, skipping", env_var);
                }
            } else {
                log::debug!("Password '{}' not found in environment, skipping", env_var);
            }
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

    // Database operations - using file-based storage for simplicity
    // In production, migrate to proper database schema
    async fn store_password_entry(&self, entry: &PasswordEntry) -> AppResult<()> {
        use std::fs;
        use std::path::Path;
        
        let storage_dir = Path::new("data/passwords");
        if !storage_dir.exists() {
            fs::create_dir_all(storage_dir)
                .map_err(|e| AppError::InternalServerError(format!("Failed to create storage dir: {}", e)))?;
        }
        
        let file_path = storage_dir.join(format!("{}.json", entry.name));
        let json = serde_json::to_string_pretty(entry)
            .map_err(|e| AppError::InternalServerError(format!("Failed to serialize entry: {}", e)))?;
        
        fs::write(&file_path, json)
            .map_err(|e| AppError::InternalServerError(format!("Failed to write entry: {}", e)))?;
        
        Ok(())
    }

    async fn load_password_entry(&self, name: &str) -> AppResult<PasswordEntry> {
        use std::fs;
        use std::path::Path;
        
        let file_path = Path::new("data/passwords").join(format!("{}.json", name));
        
        if !file_path.exists() {
            return Err(AppError::NotFound(format!("Password entry '{}' not found", name)));
        }
        
        let json = fs::read_to_string(&file_path)
            .map_err(|e| AppError::InternalServerError(format!("Failed to read entry: {}", e)))?;
        
        let entry: PasswordEntry = serde_json::from_str(&json)
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse entry: {}", e)))?;
        
        Ok(entry)
    }

    async fn get_all_entries(&self) -> AppResult<Vec<PasswordEntry>> {
        use std::fs;
        use std::path::Path;
        
        let storage_dir = Path::new("data/passwords");
        if !storage_dir.exists() {
            return Ok(Vec::new());
        }
        
        let mut entries = Vec::new();
        
        let dir = fs::read_dir(storage_dir)
            .map_err(|e| AppError::InternalServerError(format!("Failed to read storage dir: {}", e)))?;
        
        for file in dir {
            let file = file
                .map_err(|e| AppError::InternalServerError(format!("Failed to read file: {}", e)))?;
            
            if file.path().extension().and_then(|s| s.to_str()) == Some("json") {
                let json = fs::read_to_string(file.path())
                    .map_err(|e| AppError::InternalServerError(format!("Failed to read file: {}", e)))?;
                
                if let Ok(entry) = serde_json::from_str::<PasswordEntry>(&json) {
                    entries.push(entry);
                }
            }
        }
        
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
        // Try database first using SQLx (if available)
        // For now, use application logging
        // In production, implement proper database audit logging
        
        // Log to application logs (always works)
        log::info!(
            "Password audit: entry_id={}, action={}, user_id={:?}, ip={:?}, user_agent={:?}",
            password_entry_id,
            action,
            user_id,
            ip_address,
            user_agent
        );
        
        // TODO: Implement database audit logging when migration is applied
        // For now, audit logs are written to application logs
        // Database audit table will be populated after migration runs
        
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

