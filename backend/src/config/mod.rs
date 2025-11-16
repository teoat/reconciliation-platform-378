pub mod billing_config;
pub mod email_config;
pub mod monitoring;
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
    pub fn from_env() -> Result<Self, crate::errors::AppError> {
        dotenvy::dotenv().ok();

        Ok(Config {
            database_url: env::var("DATABASE_URL")
                .map_err(|_| crate::errors::AppError::Config("DATABASE_URL not set".to_string()))?,
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "2000".to_string())
                .parse()
                .map_err(|_| crate::errors::AppError::Config("Invalid PORT value".to_string()))?,

            redis_url: env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            jwt_secret: env::var("JWT_SECRET")
                .map_err(|_| crate::errors::AppError::Config("JWT_SECRET not set".to_string()))?,
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
}

pub use billing_config::BillingConfig;
pub use email_config::EmailConfig;
pub use monitoring::MonitoringConfig;
