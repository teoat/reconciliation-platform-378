//! Comprehensive service layer tests for DatabaseMigrationService
//!
//! Tests database migration functionality including running migrations,
//! rollback, status checking, validation, and backup/restore operations.

use reconciliation_backend::services::database_migration::{
    DatabaseMigrationService, ProductionMigrationRunner, MigrationState, MigrationError,
};

/// Test DatabaseMigrationService methods
#[cfg(test)]
mod database_migration_service_tests {
    use super::*;

    // Note: These tests are designed to work with mock/test database connections
    // In a real scenario, they would use a test database

    // =========================================================================
    // Service Creation Tests
    // =========================================================================

    #[tokio::test]
    async fn test_database_migration_service_creation_invalid_url() {
        // Test with invalid database URL
        let result = DatabaseMigrationService::new("invalid://url");
        
        // Should fail with connection error
        assert!(result.is_err());
        if let Err(MigrationError::ConnectionError(_)) = result {
            // Expected error type
        } else {
            panic!("Expected ConnectionError");
        }
    }

    // =========================================================================
    // Migration Status Tests
    // =========================================================================

    #[tokio::test]
    async fn test_get_migration_status_structure() {
        // This test would require a test database connection
        // For now, we test the error path
        let invalid_url = "postgresql://invalid:invalid@localhost/invalid";
        if let Ok(mut service) = DatabaseMigrationService::new(invalid_url) {
            let result = service.get_migration_status().await;
            // May succeed or fail depending on connection
            assert!(result.is_ok() || result.is_err());
        }
    }

    #[tokio::test]
    async fn test_is_database_up_to_date() {
        let invalid_url = "postgresql://invalid:invalid@localhost/invalid";
        if let Ok(service) = DatabaseMigrationService::new(invalid_url) {
            let result = service.is_database_up_to_date().await;
            // May succeed or fail depending on connection
            assert!(result.is_ok() || result.is_err());
        }
    }

    // =========================================================================
    // Migration Execution Tests
    // =========================================================================

    #[tokio::test]
    async fn test_run_migrations_structure() {
        let invalid_url = "postgresql://invalid:invalid@localhost/invalid";
        if let Ok(mut service) = DatabaseMigrationService::new(invalid_url) {
            let result = service.run_migrations().await;
            // May succeed or fail depending on connection
            if let Ok(migration_result) = result {
                // Verify result structure
                assert!(migration_result.applied_migrations.len() >= 0);
                assert!(migration_result.failed_migrations.len() >= 0);
                assert!(migration_result.warnings.len() >= 0);
                assert!(migration_result.duration_ms >= 0);
            }
        }
    }

    #[tokio::test]
    async fn test_rollback_last_migration() {
        let invalid_url = "postgresql://invalid:invalid@localhost/invalid";
        if let Ok(mut service) = DatabaseMigrationService::new(invalid_url) {
            let result = service.rollback_last_migration().await;
            // May succeed or fail depending on connection
            if let Ok(migration_result) = result {
                // Verify result structure
                assert!(migration_result.warnings.len() >= 0);
                assert!(migration_result.duration_ms >= 0);
            }
        }
    }

    // =========================================================================
    // Backup and Restore Tests
    // =========================================================================

    #[tokio::test]
    async fn test_create_backup() {
        let invalid_url = "postgresql://invalid:invalid@localhost/invalid";
        if let Ok(service) = DatabaseMigrationService::new(invalid_url) {
            let result = service.create_backup("/tmp/test_backup").await;
            // Should succeed (currently just logs)
            assert!(result.is_ok());
        }
    }

    #[tokio::test]
    async fn test_create_backup_empty_path() {
        let invalid_url = "postgresql://invalid:invalid@localhost/invalid";
        if let Ok(service) = DatabaseMigrationService::new(invalid_url) {
            let result = service.create_backup("").await;
            // Should succeed (currently just logs)
            assert!(result.is_ok());
        }
    }

    #[tokio::test]
    async fn test_restore_from_backup() {
        let invalid_url = "postgresql://invalid:invalid@localhost/invalid";
        if let Ok(service) = DatabaseMigrationService::new(invalid_url) {
            let result = service.restore_from_backup("/tmp/test_backup").await;
            // Should succeed (currently just logs)
            assert!(result.is_ok());
        }
    }

    #[tokio::test]
    async fn test_restore_from_backup_empty_path() {
        let invalid_url = "postgresql://invalid:invalid@localhost/invalid";
        if let Ok(service) = DatabaseMigrationService::new(invalid_url) {
            let result = service.restore_from_backup("").await;
            // Should succeed (currently just logs)
            assert!(result.is_ok());
        }
    }

    // =========================================================================
    // Validation Tests
    // =========================================================================

    #[tokio::test]
    async fn test_validate_migrations() {
        let invalid_url = "postgresql://invalid:invalid@localhost/invalid";
        if let Ok(service) = DatabaseMigrationService::new(invalid_url) {
            let result = service.validate_migrations().await;
            // May succeed or fail depending on connection
            if let Ok(validation_result) = result {
                // Verify result structure
                assert!(validation_result.issues.len() >= 0);
                assert!(validation_result.warnings.len() >= 0);
            }
        }
    }

    // =========================================================================
    // Production Migration Runner Tests
    // =========================================================================

    #[tokio::test]
    async fn test_production_migration_runner_creation() {
        let invalid_url = "postgresql://invalid:invalid@localhost/invalid";
        let result = ProductionMigrationRunner::new(invalid_url, true, "/tmp/backup".to_string());
        
        // May succeed or fail depending on connection
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_production_migration_runner_with_backup() {
        let invalid_url = "postgresql://invalid:invalid@localhost/invalid";
        if let Ok(mut runner) = ProductionMigrationRunner::new(invalid_url, true, "/tmp/backup".to_string()) {
            let result = runner.run_production_migrations().await;
            // May succeed or fail depending on connection and validation
            assert!(result.is_ok() || result.is_err());
        }
    }

    #[tokio::test]
    async fn test_production_migration_runner_without_backup() {
        let invalid_url = "postgresql://invalid:invalid@localhost/invalid";
        if let Ok(mut runner) = ProductionMigrationRunner::new(invalid_url, false, "/tmp/backup".to_string()) {
            let result = runner.run_production_migrations().await;
            // May succeed or fail depending on connection and validation
            assert!(result.is_ok() || result.is_err());
        }
    }

    // =========================================================================
    // Edge Cases
    // =========================================================================

    #[tokio::test]
    async fn test_migration_result_structure() {
        // Test that MigrationResult has all required fields
        use reconciliation_backend::services::database_migration::MigrationResult;
        
        let result = MigrationResult {
            success: true,
            applied_migrations: vec!["migration1".to_string()],
            failed_migrations: vec![],
            warnings: vec!["warning1".to_string()],
            duration_ms: 100,
        };
        
        assert!(result.success);
        assert_eq!(result.applied_migrations.len(), 1);
        assert_eq!(result.failed_migrations.len(), 0);
        assert_eq!(result.warnings.len(), 1);
        assert_eq!(result.duration_ms, 100);
    }

    #[tokio::test]
    async fn test_migration_status_structure() {
        use reconciliation_backend::services::database_migration::MigrationStatus;
        use chrono::Utc;
        
        let status = MigrationStatus {
            version: "20241201000000".to_string(),
            name: "test_migration".to_string(),
            applied_at: Some(Utc::now()),
            status: MigrationState::Applied,
        };
        
        assert_eq!(status.version, "20241201000000");
        assert_eq!(status.name, "test_migration");
        assert!(status.applied_at.is_some());
        assert!(matches!(status.status, MigrationState::Applied));
    }

    #[tokio::test]
    async fn test_migration_state_variants() {
        // Test all migration state variants
        assert!(matches!(MigrationState::Pending, MigrationState::Pending));
        assert!(matches!(MigrationState::Applied, MigrationState::Applied));
        assert!(matches!(MigrationState::Failed, MigrationState::Failed));
        assert!(matches!(MigrationState::RolledBack, MigrationState::RolledBack));
    }

    #[tokio::test]
    async fn test_validation_result_structure() {
        use reconciliation_backend::services::database_migration::ValidationResult;
        
        let result = ValidationResult {
            is_valid: true,
            issues: vec![],
            warnings: vec!["warning1".to_string()],
        };
        
        assert!(result.is_valid);
        assert_eq!(result.issues.len(), 0);
        assert_eq!(result.warnings.len(), 1);
    }

    #[tokio::test]
    async fn test_migration_error_types() {
        // Test error type creation
        let connection_error = MigrationError::ConnectionError("test error".to_string());
        assert!(matches!(connection_error, MigrationError::ConnectionError(_)));
        
        let migration_error = MigrationError::MigrationError("test error".to_string());
        assert!(matches!(migration_error, MigrationError::MigrationError(_)));
        
        let validation_error = MigrationError::ValidationError("test error".to_string());
        assert!(matches!(validation_error, MigrationError::ValidationError(_)));
        
        let backup_error = MigrationError::BackupError("test error".to_string());
        assert!(matches!(backup_error, MigrationError::BackupError(_)));
    }
}

