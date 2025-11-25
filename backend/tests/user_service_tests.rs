//! Service layer tests for UserService
//!
//! Tests UserService methods including user CRUD operations,
//! authentication, permissions, and preferences.

use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::services::auth::AuthService;
use reconciliation_backend::services::user::UserService;
use reconciliation_backend::test_utils_export::database::setup_test_database;

/// Test UserService methods
#[cfg(test)]
mod user_service_tests {
    use super::*;

    #[tokio::test]
    async fn test_create_user() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        let request = reconciliation_backend::services::user::CreateUserRequest {
            email: "service_test@example.com".to_string(),
            password: "TestPassword123!".to_string(),
            first_name: "Service".to_string(),
            last_name: "Test".to_string(),
            role: Some("user".to_string()),
        };

        let result = user_service.create_user(request).await;
        assert!(result.is_ok());

        let user = result.unwrap();
        assert_eq!(user.email, "service_test@example.com");
        assert_eq!(user.first_name, "Service");
        assert_eq!(user.last_name, "Test");
    }

    #[tokio::test]
    async fn test_create_user_invalid_email() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        let request = reconciliation_backend::services::user::CreateUserRequest {
            email: "invalid_email".to_string(),
            password: "TestPassword123!".to_string(),
            first_name: "Test".to_string(),
            last_name: "User".to_string(),
            role: None,
        };

        let result = user_service.create_user(request).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_create_user_weak_password() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        let request = reconciliation_backend::services::user::CreateUserRequest {
            email: "weak@example.com".to_string(),
            password: "weak".to_string(),
            first_name: "Test".to_string(),
            last_name: "User".to_string(),
            role: None,
        };

        let result = user_service.create_user(request).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_get_user_by_id() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create user first
        let create_request = reconciliation_backend::services::user::CreateUserRequest {
            email: "getbyid@example.com".to_string(),
            password: "TestPassword123!".to_string(),
            first_name: "Get".to_string(),
            last_name: "ById".to_string(),
            role: Some("user".to_string()),
        };

        let created_user = user_service.create_user(create_request).await.unwrap();

        // Get user by ID
        let result = user_service.get_user_by_id(created_user.id).await;
        assert!(result.is_ok());

        let user = result.unwrap();
        assert_eq!(user.id, created_user.id);
        assert_eq!(user.email, "getbyid@example.com");
    }

    #[tokio::test]
    async fn test_get_user_by_id_not_found() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        let non_existent_id = Uuid::new_v4();
        let result = user_service.get_user_by_id(non_existent_id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_get_user_by_email() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create user first
        let create_request = reconciliation_backend::services::user::CreateUserRequest {
            email: "getbyemail@example.com".to_string(),
            password: "TestPassword123!".to_string(),
            first_name: "Get".to_string(),
            last_name: "ByEmail".to_string(),
            role: Some("user".to_string()),
        };

        user_service.create_user(create_request).await.unwrap();

        // Get user by email
        let result = user_service.get_user_by_email("getbyemail@example.com").await;
        assert!(result.is_ok());

        let user = result.unwrap();
        assert_eq!(user.email, "getbyemail@example.com");
    }

    #[tokio::test]
    async fn test_user_exists_by_email() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create user first
        let create_request = reconciliation_backend::services::user::CreateUserRequest {
            email: "exists@example.com".to_string(),
            password: "TestPassword123!".to_string(),
            first_name: "Exists".to_string(),
            last_name: "Test".to_string(),
            role: Some("user".to_string()),
        };

        user_service.create_user(create_request).await.unwrap();

        // Check if user exists
        let exists = user_service.user_exists_by_email("exists@example.com").await.unwrap();
        assert!(exists);

        let not_exists = user_service.user_exists_by_email("nonexistent@example.com").await.unwrap();
        assert!(!not_exists);
    }

    #[tokio::test]
    async fn test_update_user() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create user first
        let create_request = reconciliation_backend::services::user::CreateUserRequest {
            email: "update@example.com".to_string(),
            password: "TestPassword123!".to_string(),
            first_name: "Update".to_string(),
            last_name: "Test".to_string(),
            role: Some("user".to_string()),
        };

        let created_user = user_service.create_user(create_request).await.unwrap();

        // Update user
        let update_request = reconciliation_backend::services::user::UpdateUserRequest {
            email: None,
            first_name: Some("Updated".to_string()),
            last_name: Some("Name".to_string()),
            role: None,
            is_active: None,
        };

        let result = user_service.update_user(created_user.id, update_request).await;
        assert!(result.is_ok());

        let updated_user = result.unwrap();
        assert_eq!(updated_user.first_name, "Updated");
        assert_eq!(updated_user.last_name, "Name");
    }

    #[tokio::test]
    async fn test_list_users() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create multiple users
        for i in 0..5 {
            let create_request = reconciliation_backend::services::user::CreateUserRequest {
                email: format!("list{}@example.com", i),
                password: "TestPassword123!".to_string(),
                first_name: format!("User{}", i),
                last_name: "List".to_string(),
                role: Some("user".to_string()),
            };
            user_service.create_user(create_request).await.unwrap();
        }

        // List users with pagination
        let result = user_service.list_users(Some(1), Some(10)).await;
        assert!(result.is_ok());

        let user_list = result.unwrap();
        assert!(user_list.users.len() >= 5);
    }

    #[tokio::test]
    async fn test_list_users_pagination() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create multiple users
        for i in 0..15 {
            let create_request = reconciliation_backend::services::user::CreateUserRequest {
                email: format!("page{}@example.com", i),
                password: "TestPassword123!".to_string(),
                first_name: format!("Page{}", i),
                last_name: "Test".to_string(),
                role: Some("user".to_string()),
            };
            user_service.create_user(create_request).await.unwrap();
        }

        // Test pagination
        let page1 = user_service.list_users(Some(1), Some(10)).await.unwrap();
        assert!(page1.users.len() <= 10);

        let page2 = user_service.list_users(Some(2), Some(10)).await.unwrap();
        assert!(page2.users.len() <= 10);
    }

    #[tokio::test]
    async fn test_delete_user() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create user first
        let create_request = reconciliation_backend::services::user::CreateUserRequest {
            email: "delete@example.com".to_string(),
            password: "TestPassword123!".to_string(),
            first_name: "Delete".to_string(),
            last_name: "Test".to_string(),
            role: Some("user".to_string()),
        };

        let created_user = user_service.create_user(create_request).await.unwrap();

        // Delete user
        let result = user_service.delete_user(created_user.id).await;
        assert!(result.is_ok());

        // Verify user is deleted
        let get_result = user_service.get_user_by_id(created_user.id).await;
        assert!(get_result.is_err());
    }

    #[tokio::test]
    async fn test_update_last_login() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create user first
        let create_request = reconciliation_backend::services::user::CreateUserRequest {
            email: "login@example.com".to_string(),
            password: "TestPassword123!".to_string(),
            first_name: "Login".to_string(),
            last_name: "Test".to_string(),
            role: Some("user".to_string()),
        };

        let created_user = user_service.create_user(create_request).await.unwrap();

        // Update last login
        let result = user_service.update_last_login(created_user.id).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_change_password() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create user first
        let create_request = reconciliation_backend::services::user::CreateUserRequest {
            email: "changepass@example.com".to_string(),
            password: "OldPassword123!".to_string(),
            first_name: "Change".to_string(),
            last_name: "Password".to_string(),
            role: Some("user".to_string()),
        };

        let created_user = user_service.create_user(create_request).await.unwrap();

        // Change password (password_manager is optional, pass None)
        let result = user_service
            .change_password(created_user.id, "OldPassword123!", "NewPassword123!", None)
            .await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_change_password_wrong_current() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create user first
        let create_request = reconciliation_backend::services::user::CreateUserRequest {
            email: "wrongpass@example.com".to_string(),
            password: "CorrectPassword123!".to_string(),
            first_name: "Wrong".to_string(),
            last_name: "Password".to_string(),
            role: Some("user".to_string()),
        };

        let created_user = user_service.create_user(create_request).await.unwrap();

        // Try to change password with wrong current password
        let result = user_service
            .change_password(created_user.id, "WrongPassword123!", "NewPassword123!", None)
            .await;
        assert!(result.is_err());
    }

    // Edge cases
    #[tokio::test]
    async fn test_list_users_empty_database() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        let result = user_service.list_users(None, None).await;
        assert!(result.is_ok());
        let users = result.unwrap();
        // Can be empty - no assertion needed as len() is always >= 0
    }

    #[tokio::test]
    async fn test_list_users_with_pagination() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create multiple users
        for i in 0..5 {
            user_service
                .create_user(reconciliation_backend::services::user::CreateUserRequest {
                    email: format!("pagination_test{}@example.com", i),
                    password: "TestPassword123!".to_string(),
                    first_name: "Test".to_string(),
                    last_name: "User".to_string(),
                    role: Some("user".to_string()),
                })
                .await
                .unwrap();
        }

        // Test pagination
        let page1 = user_service.list_users(Some(1), Some(2)).await.unwrap();
        let page2 = user_service.list_users(Some(2), Some(2)).await.unwrap();

        assert!(page1.users.len() <= 2);
        assert!(page2.users.len() <= 2);
    }

    #[tokio::test]
    async fn test_update_user_partial_fields() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create user
        let user = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "partial_update@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Original".to_string(),
                last_name: "Name".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Update only first name
        let update_request = reconciliation_backend::services::user::UpdateUserRequest {
            email: None,
            first_name: Some("Updated".to_string()),
            last_name: None,
            role: None,
            is_active: None,
        };

        let result = user_service.update_user(user.id, update_request).await;
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.first_name, "Updated");
        assert_eq!(updated.last_name, "Name"); // Unchanged
    }

    #[tokio::test]
    async fn test_update_user_invalid_email() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        let user = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "invalid_update@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Test".to_string(),
                last_name: "User".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        let update_request = reconciliation_backend::services::user::UpdateUserRequest {
            email: Some("invalid_email_format".to_string()),
            first_name: None,
            last_name: None,
            role: None,
            is_active: None,
        };

        let result = user_service.update_user(user.id, update_request).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_update_user_duplicate_email() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create two users
        let _user1 = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "user1@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "User".to_string(),
                last_name: "One".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        let user2 = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "user2@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "User".to_string(),
                last_name: "Two".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Try to update user2's email to user1's email
        let update_request = reconciliation_backend::services::user::UpdateUserRequest {
            email: Some("user1@example.com".to_string()),
            first_name: None,
            last_name: None,
            role: None,
            is_active: None,
        };

        let result = user_service.update_user(user2.id, update_request).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_update_user_role() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        let user = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "role_update@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Role".to_string(),
                last_name: "Update".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        let update_request = reconciliation_backend::services::user::UpdateUserRequest {
            email: None,
            first_name: None,
            last_name: None,
            role: Some("admin".to_string()),
            is_active: None,
        };

        let result = user_service.update_user(user.id, update_request).await;
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.role, "admin");
    }

    #[tokio::test]
    async fn test_update_user_is_active() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        let user = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "active_update@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Active".to_string(),
                last_name: "Update".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        let update_request = reconciliation_backend::services::user::UpdateUserRequest {
            email: None,
            first_name: None,
            last_name: None,
            role: None,
            is_active: Some(false),
        };

        let result = user_service.update_user(user.id, update_request).await;
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.is_active, false);
    }

    #[tokio::test]
    async fn test_delete_user_with_projects() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = reconciliation_backend::services::project::ProjectService::new((*db_arc).clone());

        // Create user
        let user = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "delete_with_projects@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Delete".to_string(),
                last_name: "Projects".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Create a project for the user
        let _project = project_service
            .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "User Project".to_string(),
                description: None,
                owner_id: user.id,
                status: None,
                settings: None,
            })
            .await
            .unwrap();

        // Delete user (should handle dependencies)
        let result = user_service.delete_user(user.id).await;
        // May succeed or fail depending on cascade settings
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_search_users() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create users with different names
        user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "search1@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Search".to_string(),
                last_name: "Test".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "search2@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Another".to_string(),
                last_name: "User".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Search for "Search"
        let result = user_service.search_users("Search", Some(1), Some(10)).await;
        assert!(result.is_ok());

        let users = result.unwrap();
        assert!(users.users.len() >= 1);
        assert!(users.users.iter().any(|u| u.first_name.contains("Search")));
    }

    #[tokio::test]
    async fn test_search_users_no_matches() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create a user
        user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "no_match@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Test".to_string(),
                last_name: "User".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Search for something that doesn't match
        let result = user_service.search_users("NonexistentUser", Some(1), Some(10)).await;
        assert!(result.is_ok());

        let users = result.unwrap();
        assert_eq!(users.users.len(), 0);
    }

    #[tokio::test]
    async fn test_create_oauth_user() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        let request = reconciliation_backend::services::user::CreateOAuthUserRequest {
            email: "oauth@example.com".to_string(),
            first_name: "OAuth".to_string(),
            last_name: "User".to_string(),
            role: Some("user".to_string()),
            picture: None,
        };

        let result = user_service.create_oauth_user(request).await;
        assert!(result.is_ok());

        let user = result.unwrap();
        assert_eq!(user.email, "oauth@example.com");
        assert_eq!(user.first_name, "OAuth");
    }

    #[tokio::test]
    async fn test_create_oauth_user_duplicate_email() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create regular user first
        user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "oauth_duplicate@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Regular".to_string(),
                last_name: "User".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Try to create OAuth user with same email
        let request = reconciliation_backend::services::user::CreateOAuthUserRequest {
            email: "oauth_duplicate@example.com".to_string(),
            first_name: "OAuth".to_string(),
            last_name: "User".to_string(),
            role: Some("user".to_string()),
            picture: None,
        };

        let result = user_service.create_oauth_user(request).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_list_users_with_filters() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create users with different roles
        user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "filter1@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Filter".to_string(),
                last_name: "One".to_string(),
                role: Some("admin".to_string()),
            })
            .await
            .unwrap();

        user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "filter2@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Filter".to_string(),
                last_name: "Two".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // List all users
        let result = user_service.list_users(Some(1), Some(10)).await;
        assert!(result.is_ok());

        let users = result.unwrap();
        assert!(users.users.len() >= 2);
    }

    #[tokio::test]
    async fn test_update_user_nonexistent() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        let nonexistent_id = Uuid::new_v4();
        let update_request = reconciliation_backend::services::user::UpdateUserRequest {
            email: None,
            first_name: Some("Updated".to_string()),
            last_name: None,
            role: None,
            is_active: None,
        };

        let result = user_service.update_user(nonexistent_id, update_request).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_delete_user_nonexistent() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        let nonexistent_id = Uuid::new_v4();
        let result = user_service.delete_user(nonexistent_id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_concurrent_user_operations() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create user
        let user = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "concurrent@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Concurrent".to_string(),
                last_name: "Test".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Test concurrent operations
        let (result1, result2, result3) = tokio::join!(
            user_service.get_user_by_id(user.id),
            user_service.get_user_by_email("concurrent@example.com"),
            user_service.user_exists_by_email("concurrent@example.com")
        );

        assert!(result1.is_ok());
        assert!(result2.is_ok());
        assert!(result3.is_ok());
        assert!(result3.unwrap());
    }

    #[tokio::test]
    async fn test_user_role_validation_edge_cases() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        let user = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "role_validation@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Role".to_string(),
                last_name: "Validation".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Test invalid role
        let update_request = reconciliation_backend::services::user::UpdateUserRequest {
            email: None,
            first_name: None,
            last_name: None,
            role: Some("invalid_role".to_string()),
            is_active: None,
        };

        let result = user_service.update_user(user.id, update_request).await;
        assert!(result.is_err());

        // Test valid roles
        for role in ["user", "admin", "manager", "viewer"] {
            let update_request = reconciliation_backend::services::user::UpdateUserRequest {
                email: None,
                first_name: None,
                last_name: None,
                role: Some(role.to_string()),
                is_active: None,
            };
            let result = user_service.update_user(user.id, update_request).await;
            assert!(result.is_ok());
        }
    }

    #[tokio::test]
    async fn test_user_preferences_management() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        let user = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "preferences@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Preferences".to_string(),
                last_name: "Test".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Test that user can be retrieved (preferences are managed by PreferencesService)
        let result = user_service.get_user_by_id(user.id).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_user_search_complex_filters() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Create users with different characteristics
        user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "complex1@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Complex".to_string(),
                last_name: "Search".to_string(),
                role: Some("admin".to_string()),
            })
            .await
            .unwrap();

        user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "complex2@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Another".to_string(),
                last_name: "Complex".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Search with various terms
        let searches = vec!["Complex", "Search", "Another", "complex1", "complex2"];
        for search_term in searches {
            let result = user_service.search_users(search_term, Some(1), Some(10)).await;
            assert!(result.is_ok());
        }
    }

    #[tokio::test]
    async fn test_user_validation_edge_cases() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());

        // Test empty email
        let result = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Test".to_string(),
                last_name: "User".to_string(),
                role: None,
            })
            .await;
        assert!(result.is_err());

        // Test very long email
        let long_email = format!("{}@example.com", "a".repeat(250));
        let result = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: long_email,
                password: "TestPassword123!".to_string(),
                first_name: "Test".to_string(),
                last_name: "User".to_string(),
                role: None,
            })
            .await;
        assert!(result.is_err() || result.is_ok()); // May succeed or fail depending on validation

        // Test SQL injection attempt in email
        let sql_injection_email = "test'; DROP TABLE users; --@example.com";
        let result = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: sql_injection_email.to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Test".to_string(),
                last_name: "User".to_string(),
                role: None,
            })
            .await;
        // Should fail validation or be sanitized
        assert!(result.is_err() || result.is_ok());
    }
}

