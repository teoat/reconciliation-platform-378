pub mod better_auth;
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
    // OAuth2/OIDC Configuration (Google)
    pub google_oauth_client_id: Option<String>,
    pub google_oauth_client_secret: Option<String>,
    pub google_oauth_redirect_url: Option<String>,
    // OAuth2/OIDC Configuration (GitHub)
    pub github_oauth_client_id: Option<String>,
    pub github_oauth_client_secret: Option<String>,
    pub github_oauth_redirect_url: Option<String>,
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
            google_oauth_client_id: env::var("GOOGLE_OAUTH_CLIENT_ID").ok(),
            google_oauth_client_secret: env::var("GOOGLE_OAUTH_CLIENT_SECRET").ok(),
            google_oauth_redirect_url: env::var("GOOGLE_OAUTH_REDIRECT_URL").ok(),
            github_oauth_client_id: env::var("GITHUB_OAUTH_CLIENT_ID").ok(),
            github_oauth_client_secret: env::var("GITHUB_OAUTH_CLIENT_SECRET").ok(),
            github_oauth_redirect_url: env::var("GITHUB_OAUTH_REDIRECT_URL").ok(),
        })
    }
}

pub use billing_config::BillingConfig;
pub use email_config::EmailConfig;
pub use monitoring::MonitoringConfig;
pub use password_config::{PasswordConfig, PasswordStrength};
