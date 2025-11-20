//! Service layer tests for SecretsService
//!
//! Tests secret retrieval from environment variables.

use reconciliation_backend::services::secrets::SecretsService;

/// Test SecretsService methods
#[cfg(test)]
mod secrets_service_tests {
    use super::*;

    #[test]
    fn test_get_secret_exists() {
        // Set a test environment variable
        std::env::set_var("TEST_SECRET", "test_value");

        let result = SecretsService::get_secret("TEST_SECRET");
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "test_value");

        // Cleanup
        std::env::remove_var("TEST_SECRET");
    }

    #[test]
    fn test_get_secret_not_found() {
        // Ensure variable is not set
        std::env::remove_var("NONEXISTENT_SECRET");

        let result = SecretsService::get_secret("NONEXISTENT_SECRET");
        assert!(result.is_err());
    }

    #[test]
    fn test_get_jwt_secret() {
        // Set JWT_SECRET for test
        std::env::set_var("JWT_SECRET", "test_jwt_secret");

        let result = SecretsService::get_jwt_secret();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "test_jwt_secret");

        // Cleanup
        std::env::remove_var("JWT_SECRET");
    }

    #[test]
    fn test_get_jwt_refresh_secret() {
        // Set JWT_REFRESH_SECRET for test
        std::env::set_var("JWT_REFRESH_SECRET", "test_refresh_secret");

        let result = SecretsService::get_jwt_refresh_secret();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "test_refresh_secret");

        // Cleanup
        std::env::remove_var("JWT_REFRESH_SECRET");
    }

    #[test]
    fn test_get_database_url() {
        // Set DATABASE_URL for test
        std::env::set_var("DATABASE_URL", "postgres://localhost/test");

        let result = SecretsService::get_database_url();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "postgres://localhost/test");

        // Cleanup
        std::env::remove_var("DATABASE_URL");
    }

    #[test]
    fn test_get_database_password() {
        // Set DB_PASSWORD for test
        std::env::set_var("DB_PASSWORD", "test_password");

        let result = SecretsService::get_database_password();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "test_password");

        // Cleanup
        std::env::remove_var("DB_PASSWORD");
    }

    #[test]
    fn test_get_redis_password() {
        // Set REDIS_PASSWORD for test
        std::env::set_var("REDIS_PASSWORD", "redis_password");

        let result = SecretsService::get_redis_password();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "redis_password");

        // Cleanup
        std::env::remove_var("REDIS_PASSWORD");
    }

    #[test]
    fn test_get_csrf_secret() {
        // Set CSRF_SECRET for test
        std::env::set_var("CSRF_SECRET", "csrf_secret");

        let result = SecretsService::get_csrf_secret();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "csrf_secret");

        // Cleanup
        std::env::remove_var("CSRF_SECRET");
    }

    #[test]
    fn test_get_smtp_password() {
        // Set SMTP_PASSWORD for test
        std::env::set_var("SMTP_PASSWORD", "smtp_password");

        let result = SecretsService::get_smtp_password();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "smtp_password");

        // Cleanup
        std::env::remove_var("SMTP_PASSWORD");
    }
}

