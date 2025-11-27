pub mod billing_config;
pub mod email_config;
pub mod monitoring;
pub mod password_config;
pub mod shard_config;

use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub database_url: String,
    pub redis_url: String,
    pub jwt_secret: String,
    pub jwt_expiration: i64,
    pub cors_origins: Vec<String>,
    pub log_level: String,
    pub max_file_size: usize,
    pub upload_path: String,
}

impl Config {
    /// Load configuration from environment variables
    /// 
    /// Validates required configuration values and fails fast if missing.
    /// Use SecretsService for accessing secrets.
    pub fn from_env() -> Result<Self, crate::errors::AppError> {
        dotenvy::dotenv().ok();

        // Validate all required secrets on startup
        crate::services::secrets::SecretsService::validate_required_secrets()
            .map_err(|e| crate::errors::AppError::Config(format!("Secret validation failed: {}", e)))?;
        
        // Get required secrets (already validated)
        let jwt_secret = crate::services::secrets::SecretsService::get_jwt_secret()
            .map_err(|e| crate::errors::AppError::Config(format!("JWT_SECRET: {}", e)))?;
        
        let database_url = crate::services::secrets::SecretsService::get_database_url()
            .map_err(|e| crate::errors::AppError::Config(format!("DATABASE_URL: {}", e)))?;

        Ok(Config {
            database_url,
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "2000".to_string())
                .parse()
                .map_err(|_| crate::errors::AppError::Config("Invalid PORT value".to_string()))?,

            redis_url: env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            jwt_secret,
            jwt_expiration: env::var("JWT_EXPIRATION")
                .unwrap_or_else(|_| "86400".to_string())
                .parse()
                .map_err(|_| {
                    crate::errors::AppError::Config("Invalid JWT_EXPIRATION value".to_string())
                })?,
            cors_origins: env::var("CORS_ORIGINS")
                .unwrap_or_else(|_| {
                    "http://localhost:1000,http://localhost:3000,http://localhost:5173".to_string()
                })
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
            log_level: env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
            max_file_size: env::var("MAX_FILE_SIZE")
                .unwrap_or_else(|_| "10485760".to_string())
                .parse()
                .map_err(|_| {
                    crate::errors::AppError::Config("Invalid MAX_FILE_SIZE value".to_string())
                })?, // 10MB
            upload_path: env::var("UPLOAD_PATH").unwrap_or_else(|_| "./uploads".to_string()),
        })
    }

    /// Load configuration from password manager
    /// 
    /// ⚠️ DEPRECATED: Application secrets should now use environment variables.
    /// This method is kept for backward compatibility but should not be used for new code.
    /// Use `Config::from_env()` instead.
    #[deprecated(note = "Use Config::from_env() instead. Application secrets should be in environment variables.")]
    pub async fn from_password_manager(
        password_manager: std::sync::Arc<crate::services::password_manager::PasswordManager>,
    ) -> Result<Self, crate::errors::AppError> {
        dotenvy::dotenv().ok();

        // DEPRECATED: This method now uses environment variables directly
        // Password manager integration has been removed
        log::warn!("Config::from_password_manager is deprecated - using environment variables directly");
        
        let jwt_secret = env::var("JWT_SECRET")
            .map_err(|_| crate::errors::AppError::Config("JWT_SECRET not set".to_string()))?;
        let _jwt_refresh_secret = env::var("JWT_REFRESH_SECRET")
            .unwrap_or_else(|_| jwt_secret.clone());
        
        let database_url = env::var("DATABASE_URL")
            .map_err(|_| crate::errors::AppError::Config("DATABASE_URL not set".to_string()))?;
        
        let redis_url = env::var("REDIS_URL")
            .unwrap_or_else(|_| "redis://localhost:6379".to_string());

        Ok(Config {
            database_url,
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "2000".to_string())
                .parse()
                .map_err(|_| crate::errors::AppError::Config("Invalid PORT value".to_string()))?,
            redis_url,
            jwt_secret,
            jwt_expiration: env::var("JWT_EXPIRATION")
                .unwrap_or_else(|_| "86400".to_string())
                .parse()
                .map_err(|_| {
                    crate::errors::AppError::Config("Invalid JWT_EXPIRATION value".to_string())
                })?,
            cors_origins: env::var("CORS_ORIGINS")
                .unwrap_or_else(|_| {
                    "http://localhost:1000,http://localhost:3000,http://localhost:5173".to_string()
                })
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
            log_level: env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
            max_file_size: env::var("MAX_FILE_SIZE")
                .unwrap_or_else(|_| "10485760".to_string())
                .parse()
                .map_err(|_| {
                    crate::errors::AppError::Config("Invalid MAX_FILE_SIZE value".to_string())
                })?,
            upload_path: env::var("UPLOAD_PATH").unwrap_or_else(|_| "./uploads".to_string()),
        })
    }

    /// Update config values from password manager (called after password manager is initialized)
    /// 
    /// ⚠️ DEPRECATED: Application secrets should now use environment variables.
    /// This method is kept for backward compatibility but should not be used.
    /// Configuration now reads directly from environment variables.
    #[deprecated(note = "Application secrets should be in environment variables. This method is no longer needed.")]
    pub async fn update_from_password_manager(
        &mut self,
        password_manager: std::sync::Arc<crate::services::password_manager::PasswordManager>,
    ) -> Result<(), crate::errors::AppError> {
        // DEPRECATED: This method is a no-op - configuration now uses environment variables directly
        log::warn!("Config::update_from_password_manager is deprecated - configuration uses environment variables");
        // No-op - keep current values

        Ok(())
    }
}

pub use billing_config::BillingConfig;
pub use email_config::EmailConfig;
pub use monitoring::MonitoringConfig;
pub use password_config::{PasswordConfig, PasswordStrength};
