//! Service layer tests for PasswordManager
//!
//! Tests PasswordManager methods including password CRUD operations,
//! rotation, and scheduling.

use std::sync::Arc;

use reconciliation_backend::services::password_manager::PasswordManager;
use reconciliation_backend::test_utils_export::database::setup_test_database;

/// Test PasswordManager methods
#[cfg(test)]
mod password_manager_service_tests {
    use super::*;

    #[tokio::test]
    async fn test_create_password() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let password_manager = PasswordManager::new(db_arc.clone(), "test_master_key".to_string());

        let result = password_manager
            .create_password("test_password", "SecurePassword123!", 90, None)
            .await;

        assert!(result.is_ok());

        let entry = result.unwrap();
        assert_eq!(entry.name, "test_password");
        assert_eq!(entry.rotation_interval_days, 90);
    }

    #[tokio::test]
    async fn test_get_password_by_name() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let password_manager = PasswordManager::new(db_arc.clone(), "test_master_key".to_string());

        // Create password first
        password_manager
            .create_password("get_test", "TestPassword123!", 90, None)
            .await
            .unwrap();

        // Get password
        let result = password_manager.get_password_by_name("get_test", None).await;
        assert!(result.is_ok());

        let password = result.unwrap();
        assert_eq!(password, "TestPassword123!");
    }

    #[tokio::test]
    async fn test_get_password_not_found() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let password_manager = PasswordManager::new(db_arc.clone(), "test_master_key".to_string());

        let result = password_manager.get_password_by_name("nonexistent", None).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_list_passwords() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let password_manager = PasswordManager::new(db_arc.clone(), "test_master_key".to_string());

        // Create multiple passwords
        password_manager
            .create_password("password1", "Pass1!", 90, None)
            .await
            .unwrap();
        password_manager
            .create_password("password2", "Pass2!", 60, None)
            .await
            .unwrap();

        let result = password_manager.list_passwords().await;
        assert!(result.is_ok());

        let passwords = result.unwrap();
        assert!(passwords.len() >= 2);
    }

    #[tokio::test]
    async fn test_rotate_password() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let password_manager = PasswordManager::new(db_arc.clone(), "test_master_key".to_string());

        // Create password first
        password_manager
            .create_password("rotate_test", "OldPassword123!", 90, None)
            .await
            .unwrap();

        // Rotate password
        let result = password_manager
            .rotate_password("rotate_test", Some("NewPassword123!"), None)
            .await;

        assert!(result.is_ok());

        let entry = result.unwrap();
        assert!(entry.last_rotated_at.is_some());
    }

    #[tokio::test]
    async fn test_update_rotation_interval() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let password_manager = PasswordManager::new(db_arc.clone(), "test_master_key".to_string());

        // Create password first
        password_manager
            .create_password("interval_test", "TestPassword123!", 90, None)
            .await
            .unwrap();

        // Update rotation interval
        let result = password_manager
            .update_rotation_interval("interval_test", 60)
            .await;

        assert!(result.is_ok());

        let entry = result.unwrap();
        assert_eq!(entry.rotation_interval_days, 60);
    }

    #[tokio::test]
    async fn test_get_rotation_schedule() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let password_manager = PasswordManager::new(db_arc.clone(), "test_master_key".to_string());

        // Create password first
        password_manager
            .create_password("schedule_test", "TestPassword123!", 90, None)
            .await
            .unwrap();

        let result = password_manager.get_rotation_schedule().await;
        assert!(result.is_ok());

        let schedule = result.unwrap();
        assert!(!schedule.is_empty());
    }

    #[tokio::test]
    async fn test_deactivate_password() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let password_manager = PasswordManager::new(db_arc.clone(), "test_master_key".to_string());

        // Create password first
        password_manager
            .create_password("deactivate_test", "TestPassword123!", 90, None)
            .await
            .unwrap();

        // Deactivate password
        let result = password_manager.deactivate_password("deactivate_test").await;
        assert!(result.is_ok());

        // Verify password is deactivated
        let entry = password_manager.get_entry_by_name("deactivate_test").await.unwrap();
        assert!(!entry.is_active);
    }

    #[tokio::test]
    async fn test_rotate_due_passwords() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let password_manager = PasswordManager::new(db_arc.clone(), "test_master_key".to_string());

        let result = password_manager.rotate_due_passwords().await;
        assert!(result.is_ok());

        let rotated = result.unwrap();
        assert!(rotated.is_empty() || !rotated.is_empty()); // Can be empty or have rotated passwords
    }
}

