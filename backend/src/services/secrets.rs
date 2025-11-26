//! Comprehensive Secrets Service
//!
//! Provides secure access to application secrets with validation, rotation support,
//! and Kubernetes integration. Follows 12-Factor App principles.

use crate::errors::{AppError, AppResult};
use std::collections::HashMap;

/// Secret metadata for validation and rotation
#[derive(Debug, Clone)]
pub struct SecretMetadata {
    pub name: String,
    pub min_length: usize,
    pub required: bool,
    pub rotation_interval_days: Option<u32>,
    pub description: String,
}

/// Comprehensive secrets service with validation and management
pub struct SecretsService;

impl SecretsService {
    /// Get a secret value from environment variable
    /// 
    /// # Arguments
    /// * `name` - The name of the environment variable
    /// 
    /// # Returns
    /// * `Ok(String)` - The secret value if found
    /// * `Err(AppError::NotFound)` - If the environment variable is not set
    pub fn get_secret(name: &str) -> AppResult<String> {
        std::env::var(name).map_err(|_| {
            AppError::NotFound(format!(
                "Secret '{}' not found in environment variables. Please set it in your .env file or Kubernetes secrets.",
                name
            ))
        })
    }

    /// Get secret with validation
    /// 
    /// Validates the secret meets minimum requirements before returning.
    pub fn get_secret_validated(name: &str, min_length: usize) -> AppResult<String> {
        let secret = Self::get_secret(name)?;
        
        if secret.len() < min_length {
            return Err(AppError::Config(format!(
                "Secret '{}' must be at least {} characters long (found {} characters)",
                name, min_length, secret.len()
            )));
        }

        // Log warning in production if secret is too short
        #[cfg(not(debug_assertions))]
        if secret.len() < 32 {
            log::warn!("Secret '{}' is shorter than recommended 32 characters", name);
        }

        Ok(secret)
    }

    /// Get secret with fallback
    pub fn get_secret_or_default(name: &str, default: &str) -> String {
        Self::get_secret(name).unwrap_or_else(|_| {
            log::warn!("Secret '{}' not found, using default value", name);
            default.to_string()
        })
    }

    /// Validate all required secrets are present
    pub fn validate_required_secrets() -> AppResult<()> {
        let required = Self::get_secret_metadata()
            .into_iter()
            .filter(|meta| meta.required)
            .collect::<Vec<_>>();

        let mut missing = Vec::new();
        let mut invalid = Vec::new();

        for meta in required {
            match Self::get_secret(&meta.name) {
                Ok(value) => {
                    if value.len() < meta.min_length {
                        invalid.push(format!(
                            "{}: must be at least {} characters (found {})",
                            meta.name, meta.min_length, value.len()
                        ));
                    }
                }
                Err(_) => {
                    missing.push(meta.name.clone());
                }
            }
        }

        if !missing.is_empty() || !invalid.is_empty() {
            let mut error_msg = String::from("Secret validation failed:\n");
            if !missing.is_empty() {
                error_msg.push_str(&format!("Missing secrets: {}\n", missing.join(", ")));
            }
            if !invalid.is_empty() {
                error_msg.push_str(&format!("Invalid secrets: {}", invalid.join(", ")));
            }
            return Err(AppError::Config(error_msg));
        }

        Ok(())
    }

    /// Get all secret metadata
    pub fn get_secret_metadata() -> Vec<SecretMetadata> {
        vec![
            SecretMetadata {
                name: "JWT_SECRET".to_string(),
                min_length: 32,
                required: true,
                rotation_interval_days: Some(90),
                description: "JWT token signing secret".to_string(),
            },
            SecretMetadata {
                name: "JWT_REFRESH_SECRET".to_string(),
                min_length: 32,
                required: false,
                rotation_interval_days: Some(90),
                description: "JWT refresh token signing secret".to_string(),
            },
            SecretMetadata {
                name: "DATABASE_URL".to_string(),
                min_length: 10,
                required: true,
                rotation_interval_days: Some(180),
                description: "PostgreSQL database connection URL".to_string(),
            },
            SecretMetadata {
                name: "DB_PASSWORD".to_string(),
                min_length: 16,
                required: false,
                rotation_interval_days: Some(180),
                description: "PostgreSQL database password (if not in DATABASE_URL)".to_string(),
            },
            SecretMetadata {
                name: "REDIS_URL".to_string(),
                min_length: 10,
                required: false,
                rotation_interval_days: Some(180),
                description: "Redis connection URL".to_string(),
            },
            SecretMetadata {
                name: "REDIS_PASSWORD".to_string(),
                min_length: 16,
                required: false,
                rotation_interval_days: Some(180),
                description: "Redis authentication password".to_string(),
            },
            SecretMetadata {
                name: "CSRF_SECRET".to_string(),
                min_length: 32,
                required: true,
                rotation_interval_days: Some(180),
                description: "CSRF protection secret".to_string(),
            },
            SecretMetadata {
                name: "SMTP_PASSWORD".to_string(),
                min_length: 8,
                required: false,
                rotation_interval_days: Some(90),
                description: "SMTP server password for email sending".to_string(),
            },
            SecretMetadata {
                name: "STRIPE_SECRET_KEY".to_string(),
                min_length: 32,
                required: false,
                rotation_interval_days: None,
                description: "Stripe payment integration secret key".to_string(),
            },
            SecretMetadata {
                name: "STRIPE_WEBHOOK_SECRET".to_string(),
                min_length: 32,
                required: false,
                rotation_interval_days: None,
                description: "Stripe webhook signature secret".to_string(),
            },
            SecretMetadata {
                name: "API_KEY".to_string(),
                min_length: 32,
                required: false,
                rotation_interval_days: Some(90),
                description: "API authentication key".to_string(),
            },
            SecretMetadata {
                name: "GRAFANA_PASSWORD".to_string(),
                min_length: 16,
                required: false,
                rotation_interval_days: Some(180),
                description: "Grafana admin password".to_string(),
            },
            SecretMetadata {
                name: "GOOGLE_CLIENT_ID".to_string(),
                min_length: 20,
                required: false,
                rotation_interval_days: None,
                description: "Google OAuth client ID".to_string(),
            },
            SecretMetadata {
                name: "GOOGLE_CLIENT_SECRET".to_string(),
                min_length: 20,
                required: false,
                rotation_interval_days: None,
                description: "Google OAuth client secret".to_string(),
            },
            SecretMetadata {
                name: "VITE_GOOGLE_CLIENT_ID".to_string(),
                min_length: 20,
                required: false,
                rotation_interval_days: None,
                description: "Google OAuth client ID for frontend".to_string(),
            },
            SecretMetadata {
                name: "BACKUP_ENCRYPTION_KEY".to_string(),
                min_length: 32,
                required: false,
                rotation_interval_days: Some(365),
                description: "Backup encryption key for S3 backups".to_string(),
            },
            SecretMetadata {
                name: "AWS_ACCESS_KEY_ID".to_string(),
                min_length: 16,
                required: false,
                rotation_interval_days: Some(90),
                description: "AWS access key for S3 backups".to_string(),
            },
            SecretMetadata {
                name: "AWS_SECRET_ACCESS_KEY".to_string(),
                min_length: 32,
                required: false,
                rotation_interval_days: Some(90),
                description: "AWS secret access key for S3 backups".to_string(),
            },
            SecretMetadata {
                name: "SENTRY_DSN".to_string(),
                min_length: 20,
                required: false,
                rotation_interval_days: None,
                description: "Sentry error tracking DSN".to_string(),
            },
            SecretMetadata {
                name: "PASSWORD_MASTER_KEY".to_string(),
                min_length: 32,
                required: true,
                rotation_interval_days: Some(365),
                description: "Master key for password manager encryption".to_string(),
            },
        ]
    }

    /// Get secret metadata by name
    pub fn get_metadata(name: &str) -> Option<SecretMetadata> {
        Self::get_secret_metadata()
            .into_iter()
            .find(|meta| meta.name == name)
    }

    // Convenience methods for common secrets

    /// Get JWT secret from environment (validated)
    pub fn get_jwt_secret() -> AppResult<String> {
        Self::get_secret_validated("JWT_SECRET", 32)
    }

    /// Get JWT refresh secret from environment
    pub fn get_jwt_refresh_secret() -> AppResult<String> {
        Self::get_secret("JWT_REFRESH_SECRET")
            .or_else(|_| Self::get_jwt_secret()) // Fallback to JWT_SECRET
    }

    /// Get database URL from environment
    pub fn get_database_url() -> AppResult<String> {
        Self::get_secret("DATABASE_URL")
    }

    /// Get database password from environment (if not in DATABASE_URL)
    pub fn get_database_password() -> AppResult<String> {
        Self::get_secret("DB_PASSWORD")
    }

    /// Get Redis URL from environment
    pub fn get_redis_url() -> AppResult<String> {
        Self::get_secret("REDIS_URL")
    }

    /// Get Redis password from environment
    pub fn get_redis_password() -> AppResult<String> {
        Self::get_secret("REDIS_PASSWORD")
    }

    /// Get CSRF secret from environment (validated)
    pub fn get_csrf_secret() -> AppResult<String> {
        Self::get_secret_validated("CSRF_SECRET", 32)
    }

    /// Get SMTP password from environment
    pub fn get_smtp_password() -> AppResult<String> {
        Self::get_secret("SMTP_PASSWORD")
    }

    /// Get Stripe secret key from environment
    pub fn get_stripe_secret_key() -> AppResult<String> {
        Self::get_secret("STRIPE_SECRET_KEY")
    }

    /// Get Stripe webhook secret from environment
    pub fn get_stripe_webhook_secret() -> AppResult<String> {
        Self::get_secret("STRIPE_WEBHOOK_SECRET")
    }

    /// Get API key from environment
    pub fn get_api_key() -> AppResult<String> {
        Self::get_secret("API_KEY")
    }

    /// Get Grafana password from environment
    pub fn get_grafana_password() -> AppResult<String> {
        Self::get_secret("GRAFANA_PASSWORD")
    }

    /// Get Google OAuth client ID from environment
    pub fn get_google_client_id() -> AppResult<String> {
        Self::get_secret("GOOGLE_CLIENT_ID")
    }

    /// Get Google OAuth client secret from environment
    pub fn get_google_client_secret() -> AppResult<String> {
        Self::get_secret("GOOGLE_CLIENT_SECRET")
    }

    /// Get Google OAuth client ID for frontend
    pub fn get_vite_google_client_id() -> AppResult<String> {
        Self::get_secret("VITE_GOOGLE_CLIENT_ID")
    }

    /// Get backup encryption key
    pub fn get_backup_encryption_key() -> AppResult<String> {
        Self::get_secret_validated("BACKUP_ENCRYPTION_KEY", 32)
    }

    /// Get AWS access key ID
    pub fn get_aws_access_key_id() -> AppResult<String> {
        Self::get_secret("AWS_ACCESS_KEY_ID")
    }

    /// Get AWS secret access key
    pub fn get_aws_secret_access_key() -> AppResult<String> {
        Self::get_secret("AWS_SECRET_ACCESS_KEY")
    }

    /// Get Sentry DSN
    pub fn get_sentry_dsn() -> AppResult<String> {
        Self::get_secret("SENTRY_DSN")
    }

    /// Get password master key (validated)
    pub fn get_password_master_key() -> AppResult<String> {
        Self::get_secret_validated("PASSWORD_MASTER_KEY", 32)
    }

    /// List all available secrets (for debugging, masks values)
    pub fn list_secrets() -> HashMap<String, String> {
        let mut secrets = HashMap::new();
        let metadata = Self::get_secret_metadata();

        for meta in metadata {
            match Self::get_secret(&meta.name) {
                Ok(value) => {
                    // Mask secret value (show first 4 and last 4 chars)
                    let masked = if value.len() > 8 {
                        format!("{}...{}", &value[..4], &value[value.len()-4..])
                    } else {
                        "***".to_string()
                    };
                    secrets.insert(meta.name, masked);
                }
                Err(_) => {
                    secrets.insert(meta.name, "NOT SET".to_string());
                }
            }
        }

        secrets
    }
}

/// Legacy compatibility: DefaultSecretsManager
/// 
/// This is kept for backward compatibility but delegates to SecretsService.
/// New code should use SecretsService directly.
pub struct DefaultSecretsManager;

impl DefaultSecretsManager {
    /// Get secret from environment variable with fallback
    pub fn get_secret(&self, secret_name: &str, fallback: impl Into<String>) -> String {
        SecretsService::get_secret(secret_name).unwrap_or_else(|_| fallback.into())
    }

    /// Get JWT secret
    /// In production, JWT_SECRET must be set or the application will return an error
    pub fn get_jwt_secret(&self) -> AppResult<String> {
        // In production, return an error if JWT_SECRET is not set
        #[cfg(not(debug_assertions))]
        {
            SecretsService::get_jwt_secret()
        }

        // In development, allow fallback
        #[cfg(debug_assertions)]
        {
            Ok(self.get_secret("JWT_SECRET", "development-secret-key-only"))
        }
    }

    /// Get database URL
    pub fn get_database_url(&self) -> AppResult<String> {
        #[cfg(not(debug_assertions))]
        {
            SecretsService::get_database_url()
        }

        #[cfg(debug_assertions)]
        {
            Ok(self.get_secret("DATABASE_URL", "postgresql://reconciliation_user:reconciliation_pass@localhost:5432/reconciliation_app"))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_default_secrets_manager_production_error() {
        let manager = DefaultSecretsManager;

        // Store original environment variables to restore them later
        let original_jwt_secret = env::var("JWT_SECRET").ok();
        let original_database_url = env::var("DATABASE_URL").ok();

        // Unset JWT_SECRET and DATABASE_URL
        env::remove_var("JWT_SECRET");
        env::remove_var("DATABASE_URL");

        // Test get_jwt_secret in a production-like scenario (debug_assertions off)
        // Since get_jwt_secret calls SecretsService::get_secret_validated, which calls SecretsService::get_secret
        // and that returns AppError::NotFound, we expect AppError::Config due to length validation.
        // However, the current code in DefaultSecretsManager simply calls SecretsService::get_jwt_secret() which returns
        // AppError::NotFound on missing env var.
        let jwt_result = manager.get_jwt_secret();
        assert!(jwt_result.is_err());
        if let Err(AppError::NotFound(msg)) = jwt_result {
            assert!(msg.contains("Secret 'JWT_SECRET' not found"), "Unexpected error message for JWT_SECRET: {}", msg);
        } else {
            panic!("Expected AppError::NotFound for missing JWT_SECRET, but got: {:?}", jwt_result);
        }

        // Test get_database_url in a production-like scenario (debug_assertions off)
        let db_result = manager.get_database_url();
        assert!(db_result.is_err());
        if let Err(AppError::NotFound(msg)) = db_result {
            assert!(msg.contains("Secret 'DATABASE_URL' not found"), "Unexpected error message for DATABASE_URL: {}", msg);
        } else {
            panic!("Expected AppError::NotFound for missing DATABASE_URL, but got: {:?}", db_result);
        }

        // Restore original environment variables
        if let Some(val) = original_jwt_secret {
            env::set_var("JWT_SECRET", val);
        }
        if let Some(val) = original_database_url {
            env::set_var("DATABASE_URL", val);
        }
    }
}

