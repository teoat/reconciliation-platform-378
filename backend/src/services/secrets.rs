//! Secrets Service - Environment Variable Reader
//!
//! Provides simple access to secrets stored in environment variables.
//! Follows 12-Factor App principles for configuration management.

use crate::errors::{AppError, AppResult};

/// Secrets service for reading environment variables
/// 
/// This service provides a simple, standard way to access application secrets
/// from environment variables. All secrets should be set in .env files (git-ignored).
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
                "Secret '{}' not found in environment variables. Please set it in your .env file.",
                name
            ))
        })
    }

    /// Get JWT secret from environment
    /// 
    /// In production, JWT_SECRET must be set or the application will fail to start.
    pub fn get_jwt_secret() -> AppResult<String> {
        Self::get_secret("JWT_SECRET")
    }

    /// Get JWT refresh secret from environment
    pub fn get_jwt_refresh_secret() -> AppResult<String> {
        Self::get_secret("JWT_REFRESH_SECRET")
    }

    /// Get database URL from environment
    /// 
    /// In production, DATABASE_URL must be set or the application will fail to start.
    pub fn get_database_url() -> AppResult<String> {
        Self::get_secret("DATABASE_URL")
    }

    /// Get database password from environment (if not in DATABASE_URL)
    pub fn get_database_password() -> AppResult<String> {
        Self::get_secret("DB_PASSWORD")
    }

    /// Get Redis password from environment
    pub fn get_redis_password() -> AppResult<String> {
        Self::get_secret("REDIS_PASSWORD")
    }

    /// Get CSRF secret from environment
    pub fn get_csrf_secret() -> AppResult<String> {
        Self::get_secret("CSRF_SECRET")
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
    /// In production, JWT_SECRET must be set or the application will fail to start
    pub fn get_jwt_secret(&self) -> String {
        // In production, fail if JWT_SECRET is not set
        #[cfg(not(debug_assertions))]
        {
            SecretsService::get_jwt_secret().unwrap_or_else(|_| {
                panic!("JWT_SECRET environment variable must be set in production");
            })
        }

        // In development, allow fallback
        #[cfg(debug_assertions)]
        {
            self.get_secret("JWT_SECRET", "development-secret-key-only")
        }
    }

    /// Get database URL
    pub fn get_database_url(&self) -> String {
        #[cfg(not(debug_assertions))]
        {
            SecretsService::get_database_url().unwrap_or_else(|_| {
                panic!("DATABASE_URL environment variable must be set in production");
            })
        }

        #[cfg(debug_assertions)]
        {
            self.get_secret("DATABASE_URL", "postgresql://reconciliation_user:reconciliation_pass@localhost:5432/reconciliation_app")
        }
    }
}
