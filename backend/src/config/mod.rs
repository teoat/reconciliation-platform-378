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

    /// Load configuration from password manager
    /// This is the preferred method for production environments
    pub async fn from_password_manager(
        password_manager: std::sync::Arc<crate::services::password_manager::PasswordManager>,
    ) -> Result<Self, crate::errors::AppError> {
        dotenvy::dotenv().ok();

        // Helper function to get password from password manager with fallback to env
        async fn get_password_or_env(
            pm: &crate::services::password_manager::PasswordManager,
            name: &str,
            env_var: &str,
        ) -> Result<String, crate::errors::AppError> {
            match pm.get_password_by_name(name, None).await {
                Ok(password) => {
                    log::info!("Loaded password '{}' from password manager", name);
                    Ok(password)
                }
                Err(crate::errors::AppError::NotFound(_)) => {
                    // Fallback to environment variable
                    log::warn!("Password '{}' not found in password manager, falling back to env var '{}'", name, env_var);
                    env::var(env_var).map_err(|_| {
                        crate::errors::AppError::Config(format!(
                            "Neither password manager entry '{}' nor env var '{}' is set",
                            name, env_var
                        ))
                    })
                }
                Err(e) => Err(e),
            }
        }

        // Load passwords from password manager
        let jwt_secret = get_password_or_env(&password_manager, "JWT_SECRET", "JWT_SECRET").await?;
        let _jwt_refresh_secret = get_password_or_env(&password_manager, "JWT_REFRESH_SECRET", "JWT_REFRESH_SECRET").await
            .unwrap_or_else(|_| jwt_secret.clone()); // Fallback to JWT_SECRET if not set
        // Note: jwt_refresh_secret is reserved for future use

        // For database URL, we need to extract password and rebuild URL
        let database_url = if let Ok(db_password) = password_manager.get_password_by_name("DB_PASSWORD", None).await {
            // Rebuild DATABASE_URL with password from password manager
            let base_url = env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgresql://reconciliation_user:PLACEHOLDER@localhost:5432/reconciliation_app".to_string());
            
            // Replace password in URL
            // Format: postgresql://user:password@host:port/db
            if let Some(at_pos) = base_url.rfind('@') {
                if let Some(colon_pos) = base_url[..at_pos].rfind(':') {
                    let mut new_url = base_url[..colon_pos + 1].to_string();
                    new_url.push_str(&db_password);
                    new_url.push_str(&base_url[at_pos..]);
                    log::info!("Loaded DB_PASSWORD from password manager");
                    new_url
                } else {
                    base_url
                }
            } else {
                base_url
            }
        } else {
            // Fallback to environment variable
            env::var("DATABASE_URL")
                .map_err(|_| crate::errors::AppError::Config("DATABASE_URL not set".to_string()))?
        };

        // For Redis URL, check for REDIS_PASSWORD
        let redis_url = if let Ok(redis_password) = password_manager.get_password_by_name("REDIS_PASSWORD", None).await {
            // Rebuild REDIS_URL with password
            let base_url = env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string());
            
            // Format: redis://:password@host:port
            if base_url.starts_with("redis://") {
                if let Some(host_start) = base_url.find("://") {
                    let host_part = &base_url[host_start + 3..];
                    let new_url = format!("redis://:{}@{}", redis_password, host_part);
                    log::info!("Loaded REDIS_PASSWORD from password manager");
                    new_url
                } else {
                    base_url
                }
            } else {
                base_url
            }
        } else {
            env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string())
        };

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
    /// This allows us to use password manager without circular dependency
    pub async fn update_from_password_manager(
        &mut self,
        password_manager: std::sync::Arc<crate::services::password_manager::PasswordManager>,
    ) -> Result<(), crate::errors::AppError> {
        // Helper function to get password from password manager with fallback
        async fn get_password_or_keep(
            pm: &crate::services::password_manager::PasswordManager,
            name: &str,
            current: &str,
        ) -> String {
            match pm.get_password_by_name(name, None).await {
                Ok(password) => {
                    log::info!("Updated config value '{}' from password manager", name);
                    password
                }
                Err(_) => {
                    log::debug!("Password '{}' not found in password manager, keeping current value", name);
                    current.to_string()
                }
            }
        }

        // Update JWT secret
        self.jwt_secret = get_password_or_keep(&password_manager, "JWT_SECRET", &self.jwt_secret).await;

        // Update database URL if DB_PASSWORD is in password manager
        if let Ok(db_password) = password_manager.get_password_by_name("DB_PASSWORD", None).await {
            // Rebuild DATABASE_URL with password from password manager
            if let Some(at_pos) = self.database_url.rfind('@') {
                if let Some(colon_pos) = self.database_url[..at_pos].rfind(':') {
                    let mut new_url = self.database_url[..colon_pos + 1].to_string();
                    new_url.push_str(&db_password);
                    new_url.push_str(&self.database_url[at_pos..]);
                    self.database_url = new_url;
                    log::info!("Updated DATABASE_URL with password from password manager");
                }
            }
        }

        // Update Redis URL if REDIS_PASSWORD is in password manager
        if let Ok(redis_password) = password_manager.get_password_by_name("REDIS_PASSWORD", None).await {
            if self.redis_url.starts_with("redis://") {
                if let Some(host_start) = self.redis_url.find("://") {
                    let host_part = &self.redis_url[host_start + 3..];
                    self.redis_url = format!("redis://:{}@{}", redis_password, host_part);
                    log::info!("Updated REDIS_URL with password from password manager");
                }
            }
        }

        Ok(())
    }
}

pub use billing_config::BillingConfig;
pub use email_config::EmailConfig;
pub use monitoring::MonitoringConfig;
