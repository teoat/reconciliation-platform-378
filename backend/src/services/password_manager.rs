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
}

impl PasswordManager {
    /// Create a new password manager
    pub fn new(db: Arc<Database>, master_key: String) -> Self {
        Self {
            db,
            master_key: Arc::new(RwLock::new(master_key)),
        }
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
            // Check if already exists
            if self.get_password_by_name(name).await.is_ok() {
                continue;
            }

            // Create new entry
            self.create_password(name, password, 90).await?;
        }

        Ok(())
    }

    /// Create a new password entry
    pub async fn create_password(
        &self,
        name: &str,
        password: &str,
        rotation_interval_days: i32,
    ) -> AppResult<PasswordEntry> {
        let encrypted = self.encrypt_password(password).await?;
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
    pub async fn get_password_by_name(&self, name: &str) -> AppResult<String> {
        let entry = self.load_password_entry(name).await?;
        self.decrypt_password(&entry.encrypted_password).await
    }

    /// Get password entry by name
    pub async fn get_entry_by_name(&self, name: &str) -> AppResult<PasswordEntry> {
        self.load_password_entry(name).await
    }

    /// Rotate a password
    pub async fn rotate_password(&self, name: &str, new_password: Option<&str>) -> AppResult<PasswordEntry> {
        let mut entry = self.load_password_entry(name).await?;

        // Generate new password if not provided
        let new_pass = match new_password {
            Some(p) => p.to_string(),
            None => self.generate_secure_password(16).await?,
        };

        // Encrypt new password
        entry.encrypted_password = self.encrypt_password(&new_pass).await?;
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
                self.rotate_password(&entry.name, None).await?;
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

    async fn encrypt_password(&self, password: &str) -> AppResult<String> {
        use base64::engine::{general_purpose, Engine};
        
        let master_key = self.master_key.read().await;
        
        // Simple XOR encryption with master key (for development)
        // In production, use proper AES-GCM or ChaCha20-Poly1305
        let key_bytes = master_key.as_bytes();
        let password_bytes = password.as_bytes();
        
        let encrypted: Vec<u8> = password_bytes
            .iter()
            .enumerate()
            .map(|(i, &byte)| byte ^ key_bytes[i % key_bytes.len()])
            .collect();
        
        // Encode to base64 for storage
        let encoded = general_purpose::STANDARD.encode(&encrypted);
        Ok(encoded)
    }

    async fn decrypt_password(&self, encrypted: &str) -> AppResult<String> {
        use base64::engine::{general_purpose, Engine};
        
        let master_key = self.master_key.read().await;
        
        // Decode from base64
        let encrypted_bytes = general_purpose::STANDARD
            .decode(encrypted)
            .map_err(|e| AppError::InternalServerError(format!("Failed to decode password: {}", e)))?;
        
        // XOR decrypt with master key
        let key_bytes = master_key.as_bytes();
        let decrypted: Vec<u8> = encrypted_bytes
            .iter()
            .enumerate()
            .map(|(i, &byte)| byte ^ key_bytes[i % key_bytes.len()])
            .collect();
        
        let password = String::from_utf8(decrypted)
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

