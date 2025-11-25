//! Automatic Secret Manager Service
//!
//! Automatically generates, stores, and rotates application secrets.
//! Secrets are tied to master user login and managed transparently.

use chrono::{DateTime, Utc};
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::services::secrets::{SecretsService, SecretMetadata};

/// Automatic secret manager that generates and rotates secrets
pub struct SecretManager {
    db: Arc<Database>,
    master_user_id: Arc<RwLock<Option<Uuid>>>,
}

impl SecretManager {
    /// Create a new secret manager
    pub fn new(db: Arc<Database>) -> Self {
        Self {
            db,
            master_user_id: Arc::new(RwLock::new(None)),
        }
    }

    /// Set the master user (first user to login becomes master)
    pub async fn set_master_user(&self, user_id: Uuid) {
        let mut master = self.master_user_id.write().await;
        if master.is_none() {
            *master = Some(user_id);
            log::info!("Master user set: {}", user_id);
        }
    }

    /// Get the master user ID
    pub async fn get_master_user(&self) -> Option<Uuid> {
        *self.master_user_id.read().await
    }

    /// Initialize all required secrets automatically
    /// Called on master user login
    pub async fn initialize_secrets(&self, user_id: Uuid) -> AppResult<()> {
        log::info!("Initializing automatic secrets for master user: {}", user_id);
        
        // Set as master user if not already set
        self.set_master_user(user_id).await;

        let metadata = SecretsService::get_secret_metadata();
        let mut initialized = 0;
        let mut errors = Vec::new();

        for meta in metadata {
            if !meta.required {
                continue;
            }

            // Check if secret exists in environment
            match SecretsService::get_secret(&meta.name) {
                Ok(_) => {
                    log::debug!("Secret '{}' already exists in environment", meta.name);
                    continue;
                }
                Err(_) => {
                    // Generate and store secret
                    match self.generate_and_store_secret(&meta.name, &meta, user_id).await {
                        Ok(_) => {
                            initialized += 1;
                            log::info!("Auto-generated secret: {}", meta.name);
                        }
                        Err(e) => {
                            errors.push(format!("{}: {}", meta.name, e));
                        }
                    }
                }
            }
        }

        if !errors.is_empty() {
            log::warn!("Some secrets failed to initialize: {:?}", errors);
        }

        if initialized > 0 {
            log::info!("Initialized {} secrets automatically", initialized);
        }

        Ok(())
    }

    /// Generate and store a secret
    async fn generate_and_store_secret(
        &self,
        name: &str,
        metadata: &SecretMetadata,
        user_id: Uuid,
    ) -> AppResult<String> {
        // Generate secure secret
        let secret = self.generate_secure_secret(metadata.min_length)?;

        // Store in database (encrypted)
        self.store_secret_in_db(name, &secret, metadata, user_id).await?;

        // Also set in environment for immediate use
        std::env::set_var(name, &secret);

        log::info!("Generated and stored secret: {} (length: {})", name, secret.len());

        Ok(secret)
    }

    /// Generate a cryptographically secure secret
    fn generate_secure_secret(&self, min_length: usize) -> AppResult<String> {
        use rand::Rng;
        use rand::rngs::OsRng;
        use base64::engine::{general_purpose, Engine};

        // Generate bytes (use 1.5x min_length for base64 encoding)
        let bytes_needed = (min_length as f64 * 1.5) as usize;
        let mut bytes = vec![0u8; bytes_needed];
        OsRng.fill(&mut bytes[..]);

        // Encode to base64
        let secret = general_purpose::STANDARD.encode(&bytes);

        // Ensure minimum length
        if secret.len() < min_length {
            return Err(AppError::Internal(format!(
                "Generated secret too short: {} < {}",
                secret.len(),
                min_length
            )));
        }

        Ok(secret)
    }

    /// Store secret in database (encrypted)
    async fn store_secret_in_db(
        &self,
        name: &str,
        secret: &str,
        metadata: &SecretMetadata,
        user_id: Uuid,
    ) -> AppResult<()> {
        use crate::models::schema::application_secrets;
        use diesel::prelude::*;

        let conn = &mut self.db.get_connection_async().await?;

        // Encrypt secret before storing
        let encrypted = self.encrypt_secret(secret)?;

        let rotation_days = metadata.rotation_interval_days.unwrap_or(90) as i32;
        let next_rotation = Utc::now() + chrono::Duration::days(rotation_days as i64);

        // Check if secret already exists
        use diesel::OptionalExtension;
        let existing = application_secrets::table
            .filter(application_secrets::name.eq(name))
            .first::<ApplicationSecret>(conn)
            .optional()?;

        if let Some(existing_secret) = existing {
            // Update existing secret
            diesel::update(application_secrets::table.find(&existing_secret.id))
                .set((
                    application_secrets::encrypted_value.eq(&encrypted),
                    application_secrets::updated_at.eq(Utc::now()),
                ))
                .execute(conn)?;
        } else {
            // Insert new secret
            use uuid::Uuid as UuidGen;
            let secret_id = UuidGen::new_v4().to_string();
            
            diesel::insert_into(application_secrets::table)
                .values((
                    application_secrets::id.eq(&secret_id),
                    application_secrets::name.eq(name),
                    application_secrets::encrypted_value.eq(&encrypted),
                    application_secrets::min_length.eq(metadata.min_length as i32),
                    application_secrets::rotation_interval_days.eq(rotation_days),
                    application_secrets::next_rotation_due.eq(next_rotation),
                    application_secrets::created_by.eq(user_id.to_string()),
                    application_secrets::is_active.eq(true),
                    application_secrets::created_at.eq(Utc::now()),
                    application_secrets::updated_at.eq(Utc::now()),
                ))
                .execute(conn)?;
        }

        log::debug!("Stored secret '{}' in database", name);

        Ok(())
    }

    /// Encrypt secret using master key
    fn encrypt_secret(&self, secret: &str) -> AppResult<String> {
        use aes_gcm::{
            aead::{Aead, AeadCore, KeyInit},
            Aes256Gcm,
        };
        use sha2::{Sha256, Digest};

        // Derive encryption key from master key
        let master_key = SecretsService::get_password_master_key()
            .map_err(|_| AppError::Config("PASSWORD_MASTER_KEY not set".to_string()))?;

        let mut hasher = Sha256::new();
        hasher.update(master_key.as_bytes());
        let key_bytes = hasher.finalize();

        let cipher = Aes256Gcm::new_from_slice(&key_bytes)
            .map_err(|e| AppError::Internal(format!("Failed to create cipher: {}", e)))?;

        // Generate nonce
        let nonce = Aes256Gcm::generate_nonce(&mut rand::rngs::OsRng);

        let ciphertext = cipher
            .encrypt(&nonce, secret.as_bytes())
            .map_err(|e| AppError::Internal(format!("Encryption failed: {}", e)))?;

        // Combine nonce and ciphertext
        let mut result = nonce.to_vec();
        result.extend_from_slice(&ciphertext);

        use base64::engine::{general_purpose, Engine};
        Ok(general_purpose::STANDARD.encode(&result))
    }

    /// Decrypt secret from database
    fn decrypt_secret(&self, encrypted: &str) -> AppResult<String> {
        use aes_gcm::{
            aead::{Aead, KeyInit},
            Aes256Gcm,
        };
        use sha2::{Sha256, Digest};

        let master_key = SecretsService::get_password_master_key()
            .map_err(|_| AppError::Config("PASSWORD_MASTER_KEY not set".to_string()))?;

        let mut hasher = Sha256::new();
        hasher.update(master_key.as_bytes());
        let key_bytes = hasher.finalize();

        let cipher = Aes256Gcm::new_from_slice(&key_bytes)
            .map_err(|e| AppError::Internal(format!("Failed to create cipher: {}", e)))?;

        use base64::engine::{general_purpose, Engine};
        let data = general_purpose::STANDARD
            .decode(encrypted)
            .map_err(|e| AppError::Internal(format!("Decode failed: {}", e)))?;

        if data.len() < 12 {
            return Err(AppError::Internal("Invalid encrypted data".to_string()));
        }

        use aes_gcm::aead::generic_array::GenericArray;
        let nonce = GenericArray::from_slice(&data[..12]);
        let ciphertext = &data[12..];

        let plaintext = cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| AppError::Internal(format!("Decryption failed: {}", e)))?;

        String::from_utf8(plaintext)
            .map_err(|e| AppError::Internal(format!("UTF-8 decode failed: {}", e)))
    }

    /// Load secrets from database into environment
    pub async fn load_secrets_from_db(&self) -> AppResult<()> {
        use crate::models::schema::application_secrets;
        use diesel::prelude::*;

        let conn = &mut self.db.get_connection_async().await?;
        let secrets = application_secrets::table
            .filter(application_secrets::is_active.eq(true))
            .load::<ApplicationSecret>(conn)?;

        let mut loaded = 0;
        for secret in secrets {
            // Check if already in environment
            if std::env::var(&secret.name).is_ok() {
                continue;
            }

            // Decrypt and set in environment
            match self.decrypt_secret(&secret.encrypted_value) {
                Ok(value) => {
                    std::env::set_var(&secret.name, &value);
                    loaded += 1;
                    log::debug!("Loaded secret from database: {}", secret.name);
                }
                Err(e) => {
                    log::warn!("Failed to decrypt secret '{}': {}", secret.name, e);
                }
            }
        }

        if loaded > 0 {
            log::info!("Loaded {} secrets from database", loaded);
        }

        Ok(())
    }

    /// Rotate secrets that are due for rotation
    pub async fn rotate_due_secrets(&self) -> AppResult<Vec<String>> {
        use crate::models::schema::application_secrets;
        use diesel::prelude::*;

        let conn = &mut self.db.get_connection_async().await?;
        let now = Utc::now();

        let due_secrets = application_secrets::table
            .filter(application_secrets::is_active.eq(true))
            .filter(application_secrets::next_rotation_due.le(now))
            .load::<ApplicationSecret>(conn)?;

        let mut rotated = Vec::new();

        for secret in due_secrets {
            log::info!("Rotating secret: {}", secret.name);

            // Get metadata
            let metadata = SecretsService::get_metadata(&secret.name)
                .ok_or_else(|| AppError::NotFound(format!("Metadata for {}", secret.name)))?;

            // Generate new secret
            let new_secret = self.generate_secure_secret(metadata.min_length)?;

            // Update in database
            let rotation_days = secret.rotation_interval_days;
            let next_rotation = Utc::now() + chrono::Duration::days(rotation_days as i64);

            let encrypted = self.encrypt_secret(&new_secret)?;

            diesel::update(application_secrets::table.find(&secret.id))
                .set((
                    application_secrets::encrypted_value.eq(&encrypted),
                    application_secrets::last_rotated_at.eq(Some(Utc::now())),
                    application_secrets::next_rotation_due.eq(next_rotation),
                    application_secrets::updated_at.eq(Utc::now()),
                ))
                .execute(conn)?;

            // Update environment
            std::env::set_var(&secret.name, &new_secret);

            let secret_name = secret.name.clone();
            rotated.push(secret_name.clone());
            log::info!("Rotated secret: {}", secret_name);
        }

        Ok(rotated)
    }

    /// Start background rotation scheduler
    pub async fn start_rotation_scheduler(&self) {
        let manager = Arc::new(self.clone());

        // Use Handle::current() to ensure we spawn on the correct runtime
        let handle = tokio::runtime::Handle::current();
        handle.spawn(async move {
            // Wait a bit before starting to avoid startup issues
            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(3600)); // Check every hour
            interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);

            loop {
                interval.tick().await;

                match manager.rotate_due_secrets().await {
                    Ok(rotated) => {
                        if !rotated.is_empty() {
                            log::info!("Auto-rotated {} secrets: {:?}", rotated.len(), rotated);
                        }
                    }
                    Err(e) => {
                        log::error!("Secret rotation error: {}", e);
                    }
                }
            }
        });

        log::info!("Secret rotation scheduler started");
    }
}

// Clone implementation for Arc
impl Clone for SecretManager {
    fn clone(&self) -> Self {
        Self {
            db: Arc::clone(&self.db),
            master_user_id: Arc::new(RwLock::new(None)),
        }
    }
}

/// Application secret stored in database
#[derive(Debug, Clone, diesel::Queryable, diesel::Selectable)]
#[diesel(table_name = crate::models::schema::application_secrets)]
pub struct ApplicationSecret {
    pub id: String,
    pub name: String,
    pub encrypted_value: String,
    pub min_length: i32,
    pub rotation_interval_days: i32,
    pub last_rotated_at: Option<DateTime<Utc>>,
    pub next_rotation_due: DateTime<Utc>,
    pub created_by: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

