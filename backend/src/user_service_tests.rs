//! Unit tests for UserService
//!
//! This module contains comprehensive tests for the user service functionality.

use crate::services::user::UserService;
use crate::database::Database;
use crate::test_utils::database::setup_test_database;
use uuid::Uuid;

#[cfg(test)]
mod user_service_tests {
    use super::*;

    /// Test user service integration
    #[tokio::test]
    async fn test_user_service_integration() {
        let (db, _) = setup_test_database().await;
        let service = UserService::new(db);

        // Test user creation
        let user_id = Uuid::new_v4();
        let create_result = service.create_user(
            "test@example.com".to_string(),
            "TestPassword123!".to_string(),
            Some("Test".to_string()),
            Some("User".to_string()),
            "user".to_string(),
        ).await;

        assert!(create_result.is_ok());
        let user = create_result.unwrap();
        assert_eq!(user.email, "test@example.com");
        assert_eq!(user.first_name, Some("Test".to_string()));
        assert_eq!(user.last_name, Some("User".to_string()));
        assert_eq!(user.role, "user");

        // Test user retrieval
        let get_result = service.get_user_by_id(user.id).await;
        assert!(get_result.is_ok());
        let retrieved_user = get_result.unwrap();
        assert_eq!(retrieved_user.id, user.id);

        // Test user update
        let update_result = service.update_user(
            user.id,
            Some("Updated Name".to_string()),
            Some("Updated Last".to_string()),
            Some("manager".to_string()),
        ).await;

        assert!(update_result.is_ok());
        let updated_user = update_result.unwrap();
        assert_eq!(updated_user.first_name, Some("Updated Name".to_string()));
        assert_eq!(updated_user.role, "manager");
    }

    /// Test user service edge cases
    #[tokio::test]
    async fn test_user_service_edge_cases() {
        let (db, _) = setup_test_database().await;
        let service = UserService::new(db);

        // Test duplicate email
        let create1 = service.create_user(
            "duplicate@example.com".to_string(),
            "Password123!".to_string(),
            None,
            None,
            "user".to_string(),
        ).await;
        assert!(create1.is_ok());

        let create2 = service.create_user(
            "duplicate@example.com".to_string(),
            "Password123!".to_string(),
            None,
            None,
            "user".to_string(),
        ).await;
        assert!(create2.is_err()); // Should fail due to duplicate email

        // Test invalid email
        let invalid_email = service.create_user(
            "invalid-email".to_string(),
            "Password123!".to_string(),
            None,
            None,
            "user".to_string(),
        ).await;
        assert!(invalid_email.is_err());

        // Test weak password
        let weak_password = service.create_user(
            "weak@example.com".to_string(),
            "weak".to_string(),
            None,
            None,
            "user".to_string(),
        ).await;
        assert!(weak_password.is_err());
    }
}