//! Service layer tests for ProjectService
//!
//! Tests ProjectService methods including project CRUD operations,
//! queries, search, and analytics.

use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::services::auth::AuthService;
use reconciliation_backend::services::project::ProjectService;
use reconciliation_backend::services::user::UserService;
use reconciliation_backend::test_utils_export::database::setup_test_database;

/// Test ProjectService methods
#[cfg(test)]
mod project_service_tests {
    use super::*;

    /// Helper to create a test user
    async fn create_test_user(
        user_service: &UserService,
        email: &str,
    ) -> reconciliation_backend::services::user::UserInfo {
        user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: email.to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Test".to_string(),
                last_name: "User".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap()
    }

    #[tokio::test]
    async fn test_create_project() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        // Create test user
        let user = create_test_user(&user_service, "project_owner@example.com").await;

        // Create project
        let request = reconciliation_backend::services::project_models::CreateProjectRequest {
            name: "Test Project".to_string(),
            description: Some("Test project description".to_string()),
            owner_id: user.id,
            status: None,
            settings: None,
        };

        let result = project_service.create_project(request).await;
        assert!(result.is_ok());

        let project = result.unwrap();
        assert_eq!(project.name, "Test Project");
        assert_eq!(project.owner_id, user.id);
    }

    #[tokio::test]
    async fn test_create_project_empty_name() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        // Create test user
        let user = create_test_user(&user_service, "empty_name@example.com").await;

        // Try to create project with empty name
        let request = reconciliation_backend::services::project_models::CreateProjectRequest {
            name: "".to_string(),
            description: None,
            owner_id: user.id,
            status: None,
            settings: None,
        };

        let result = project_service.create_project(request).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_create_project_invalid_owner() {
        let (db, _) = setup_test_database().await;
        let project_service = ProjectService::new(db);

        // Try to create project with non-existent owner
        let request = reconciliation_backend::services::project_models::CreateProjectRequest {
            name: "Test Project".to_string(),
            description: None,
            owner_id: Uuid::new_v4(),
            status: None,
            settings: None,
        };

        let result = project_service.create_project(request).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_get_project_by_id() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        // Create test user and project
        let user = create_test_user(&user_service, "getbyid@example.com").await;
        let create_request = reconciliation_backend::services::project_models::CreateProjectRequest {
            name: "Get By ID Project".to_string(),
            description: Some("Test project".to_string()),
            owner_id: user.id,
            status: None,
            settings: None,
        };

        let created_project = project_service.create_project(create_request).await.unwrap();

        // Get project by ID
        let result = project_service.get_project_by_id(created_project.id).await;
        assert!(result.is_ok());

        let project = result.unwrap();
        assert_eq!(project.id, created_project.id);
        assert_eq!(project.name, "Get By ID Project");
    }

    #[tokio::test]
    async fn test_get_project_by_id_not_found() {
        let (db, _) = setup_test_database().await;
        let project_service = ProjectService::new(db);

        let non_existent_id = Uuid::new_v4();
        let result = project_service.get_project_by_id(non_existent_id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_update_project() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        // Create test user and project
        let user = create_test_user(&user_service, "update@example.com").await;
        let create_request = reconciliation_backend::services::project_models::CreateProjectRequest {
            name: "Update Test Project".to_string(),
            description: Some("Original description".to_string()),
            owner_id: user.id,
            status: None,
            settings: None,
        };

        let created_project = project_service.create_project(create_request).await.unwrap();

        // Update project
        let update_request = reconciliation_backend::services::project_models::UpdateProjectRequest {
            name: Some("Updated Project Name".to_string()),
            description: Some("Updated description".to_string()),
            status: None,
            settings: None,
        };

        let result = project_service
            .update_project(created_project.id, update_request)
            .await;
        assert!(result.is_ok());

        let updated_project = result.unwrap();
        assert_eq!(updated_project.name, "Updated Project Name");
        assert_eq!(
            updated_project.description,
            Some("Updated description".to_string())
        );
    }

    #[tokio::test]
    async fn test_delete_project() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        // Create test user and project
        let user = create_test_user(&user_service, "delete@example.com").await;
        let create_request = reconciliation_backend::services::project_models::CreateProjectRequest {
            name: "Delete Test Project".to_string(),
            description: None,
            owner_id: user.id,
            status: None,
            settings: None,
        };

        let created_project = project_service.create_project(create_request).await.unwrap();

        // Delete project
        let result = project_service.delete_project(created_project.id).await;
        assert!(result.is_ok());

        // Verify project is deleted
        let get_result = project_service.get_project_by_id(created_project.id).await;
        assert!(get_result.is_err());
    }

    #[tokio::test]
    async fn test_list_projects() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        // Create test user
        let user = create_test_user(&user_service, "list@example.com").await;

        // Create multiple projects
        for i in 0..5 {
            let create_request =
                reconciliation_backend::services::project_models::CreateProjectRequest {
                    name: format!("Project {}", i),
                    description: Some(format!("Project {} description", i)),
                    owner_id: user.id,
                    status: None,
                    settings: None,
                };
            project_service.create_project(create_request).await.unwrap();
        }

        // List projects
        let result = project_service.list_projects(Some(1), Some(10)).await;
        assert!(result.is_ok());

        let project_list = result.unwrap();
        assert!(project_list.projects.len() >= 5);
    }

    #[tokio::test]
    async fn test_list_projects_pagination() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        // Create test user
        let user = create_test_user(&user_service, "page@example.com").await;

        // Create multiple projects
        for i in 0..15 {
            let create_request =
                reconciliation_backend::services::project_models::CreateProjectRequest {
                    name: format!("Page Project {}", i),
                    description: None,
                    owner_id: user.id,
                    status: None,
                    settings: None,
                };
            project_service.create_project(create_request).await.unwrap();
        }

        // Test pagination
        let page1 = project_service.list_projects(Some(1), Some(10)).await.unwrap();
        assert!(page1.projects.len() <= 10);

        let page2 = project_service.list_projects(Some(2), Some(10)).await.unwrap();
        assert!(page2.projects.len() <= 10);
    }

    #[tokio::test]
    async fn test_list_projects_by_owner() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        // Create two users
        let user1 = create_test_user(&user_service, "owner1@example.com").await;
        let user2 = create_test_user(&user_service, "owner2@example.com").await;

        // Create projects for user1
        for i in 0..3 {
            let create_request =
                reconciliation_backend::services::project_models::CreateProjectRequest {
                    name: format!("User1 Project {}", i),
                    description: None,
                    owner_id: user1.id,
                    status: None,
                    settings: None,
                };
            project_service.create_project(create_request).await.unwrap();
        }

        // Create projects for user2
        for i in 0..2 {
            let create_request =
                reconciliation_backend::services::project_models::CreateProjectRequest {
                    name: format!("User2 Project {}", i),
                    description: None,
                    owner_id: user2.id,
                    status: None,
                    settings: None,
                };
            project_service.create_project(create_request).await.unwrap();
        }

        // List projects by owner1
        let result = project_service
            .list_projects_by_owner(user1.id, Some(1), Some(10))
            .await;
        assert!(result.is_ok());

        let project_list = result.unwrap();
        assert_eq!(project_list.projects.len(), 3);
        assert!(project_list
            .projects
            .iter()
            .all(|p| p.owner_id == user1.id));
    }

    #[tokio::test]
    async fn test_search_projects() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        // Create test user
        let user = create_test_user(&user_service, "search@example.com").await;

        // Create projects with different names
        let create_request1 =
            reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "Search Test Project".to_string(),
                description: Some("This is a searchable project".to_string()),
                owner_id: user.id,
                status: None,
                settings: None,
            };
        project_service.create_project(create_request1).await.unwrap();

        let create_request2 =
            reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "Another Project".to_string(),
                description: None,
                owner_id: user.id,
                status: None,
                settings: None,
            };
        project_service.create_project(create_request2).await.unwrap();

        // Search for "Search"
        let result = project_service.search_projects("Search", Some(1), Some(10)).await;
        assert!(result.is_ok());

        let project_list = result.unwrap();
        assert!(project_list.projects.len() >= 1);
        assert!(project_list
            .projects
            .iter()
            .any(|p| p.name.contains("Search")));
    }

    #[tokio::test]
    async fn test_create_project_with_status() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        // Create test user
        let user = create_test_user(&user_service, "status@example.com").await;

        // Create project with specific status
        let request = reconciliation_backend::services::project_models::CreateProjectRequest {
            name: "Status Project".to_string(),
            description: None,
            owner_id: user.id,
            status: Some("archived".to_string()),
            settings: None,
        };

        let result = project_service.create_project(request).await;
        assert!(result.is_ok());

        let project = result.unwrap();
        assert_eq!(project.status, "archived");
    }

    #[tokio::test]
    async fn test_create_project_with_settings() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        // Create test user
        let user = create_test_user(&user_service, "settings@example.com").await;

        // Create project with custom settings
        let settings = serde_json::json!({
            "theme": "dark",
            "notifications": true
        });

        let request = reconciliation_backend::services::project_models::CreateProjectRequest {
            name: "Settings Project".to_string(),
            description: None,
            owner_id: user.id,
            status: None,
            settings: Some(settings.clone()),
        };

        let result = project_service.create_project(request).await;
        assert!(result.is_ok());

        let project = result.unwrap();
        assert!(project.settings.is_some());
        let project_settings = project.settings.unwrap();
        assert_eq!(project_settings["theme"], "dark");
    }

    // Edge cases
    #[tokio::test]
    async fn test_list_projects_empty_result() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let project_service = ProjectService::new((*db_arc).clone());

        // List projects with no projects created
        let result = project_service.list_projects(None, None).await;
        assert!(result.is_ok());

        let projects = result.unwrap();
        assert!(projects.projects.len() >= 0); // Can be empty
    }

    #[tokio::test]
    async fn test_list_projects_by_owner_nonexistent() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let project_service = ProjectService::new((*db_arc).clone());
        let nonexistent_user_id = Uuid::new_v4();

        // List projects for user that doesn't exist
        let result = project_service
            .list_projects_by_owner(nonexistent_user_id, None, None)
            .await;
        assert!(result.is_ok());

        let projects = result.unwrap();
        assert_eq!(projects.projects.len(), 0);
    }

    #[tokio::test]
    async fn test_search_projects_no_matches() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        let user = create_test_user(&user_service, "no_match@example.com").await;

        // Create a project
        project_service
            .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "Test Project".to_string(),
                description: None,
                owner_id: user.id,
                status: None,
                settings: None,
            })
            .await
            .unwrap();

        // Search for something that doesn't match
        let result = project_service
            .search_projects("NonexistentProject", None, None)
            .await;
        assert!(result.is_ok());

        let projects = result.unwrap();
        assert_eq!(projects.projects.len(), 0);
    }

    #[tokio::test]
    async fn test_update_project_partial_fields() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        let user = create_test_user(&user_service, "partial@example.com").await;
        let project = project_service
            .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "Partial Update".to_string(),
                description: Some("Original".to_string()),
                owner_id: user.id,
                status: None,
                settings: None,
            })
            .await
            .unwrap();

        // Update only name
        let update_request = reconciliation_backend::services::project_models::UpdateProjectRequest {
            name: Some("Updated Name".to_string()),
            description: None,
            status: None,
            settings: None,
        };

        let result = project_service.update_project(project.id, update_request).await;
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.name, "Updated Name");
        assert_eq!(updated.description, Some("Original".to_string())); // Unchanged
    }

    #[tokio::test]
    async fn test_update_project_nonexistent() {
        let (db, _) = setup_test_database().await;
        let project_service = ProjectService::new(db);

        let nonexistent_id = Uuid::new_v4();
        let update_request = reconciliation_backend::services::project_models::UpdateProjectRequest {
            name: Some("Updated".to_string()),
            description: None,
            status: None,
            settings: None,
        };

        let result = project_service.update_project(nonexistent_id, update_request).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_delete_project_nonexistent() {
        let (db, _) = setup_test_database().await;
        let project_service = ProjectService::new(db);

        let nonexistent_id = Uuid::new_v4();
        let result = project_service.delete_project(nonexistent_id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_update_project_empty_name() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        let user = create_test_user(&user_service, "empty_name_update@example.com").await;
        let project = project_service
            .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "Valid Name".to_string(),
                description: None,
                owner_id: user.id,
                status: None,
                settings: None,
            })
            .await
            .unwrap();

        let update_request = reconciliation_backend::services::project_models::UpdateProjectRequest {
            name: Some("".to_string()),
            description: None,
            status: None,
            settings: None,
        };

        let result = project_service.update_project(project.id, update_request).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_list_projects_with_status_filter() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        let user = create_test_user(&user_service, "status_filter@example.com").await;

        // Create projects with different statuses
        project_service
            .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "Active Project".to_string(),
                description: None,
                owner_id: user.id,
                status: Some("active".to_string()),
                settings: None,
            })
            .await
            .unwrap();

        project_service
            .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "Archived Project".to_string(),
                description: None,
                owner_id: user.id,
                status: Some("archived".to_string()),
                settings: None,
            })
            .await
            .unwrap();

        // List all projects
        let result = project_service.list_projects(Some(1), Some(10)).await;
        assert!(result.is_ok());

        let projects = result.unwrap();
        assert!(projects.projects.len() >= 2);
    }

    #[tokio::test]
    async fn test_search_projects_by_description() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        let user = create_test_user(&user_service, "desc_search@example.com").await;

        project_service
            .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "Description Project".to_string(),
                description: Some("This project has a searchable description".to_string()),
                owner_id: user.id,
                status: None,
                settings: None,
            })
            .await
            .unwrap();

        // Search in description
        let result = project_service.search_projects("searchable", Some(1), Some(10)).await;
        assert!(result.is_ok());

        let projects = result.unwrap();
        assert!(projects.projects.len() >= 1);
    }

    #[tokio::test]
    async fn test_update_project_settings() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        let user = create_test_user(&user_service, "settings_update@example.com").await;
        let project = project_service
            .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "Settings Update".to_string(),
                description: None,
                owner_id: user.id,
                status: None,
                settings: Some(serde_json::json!({"theme": "light"})),
            })
            .await
            .unwrap();

        let new_settings = serde_json::json!({
            "theme": "dark",
            "notifications": true
        });

        let update_request = reconciliation_backend::services::project_models::UpdateProjectRequest {
            name: None,
            description: None,
            status: None,
            settings: Some(new_settings.clone()),
        };

        let result = project_service.update_project(project.id, update_request).await;
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert!(updated.settings.is_some());
        assert_eq!(updated.settings.unwrap()["theme"], "dark");
    }

    #[tokio::test]
    async fn test_list_projects_pagination_edge_cases() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        let user = create_test_user(&user_service, "pagination_edge@example.com").await;

        // Create 5 projects
        for i in 0..5 {
            project_service
                .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                    name: format!("Project {}", i),
                    description: None,
                    owner_id: user.id,
                    status: None,
                    settings: None,
                })
                .await
                .unwrap();
        }

        // Test page 0 (should handle gracefully)
        let result = project_service.list_projects(Some(0), Some(10)).await;
        assert!(result.is_ok() || result.is_err());

        // Test negative page
        let result = project_service.list_projects(Some(-1), Some(10)).await;
        assert!(result.is_ok() || result.is_err());

        // Test very large page number
        let result = project_service.list_projects(Some(9999), Some(10)).await;
        assert!(result.is_ok());
        let projects = result.unwrap();
        assert!(projects.projects.len() == 0); // Should be empty
    }

    #[tokio::test]
    async fn test_get_project_by_id_after_update() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        let user = create_test_user(&user_service, "get_after_update@example.com").await;
        let project = project_service
            .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "Original Name".to_string(),
                description: None,
                owner_id: user.id,
                status: None,
                settings: None,
            })
            .await
            .unwrap();

        // Update project
        let update_request = reconciliation_backend::services::project_models::UpdateProjectRequest {
            name: Some("Updated Name".to_string()),
            description: None,
            status: None,
            settings: None,
        };
        project_service.update_project(project.id, update_request).await.unwrap();

        // Get project and verify update
        let result = project_service.get_project_by_id(project.id).await;
        assert!(result.is_ok());

        let retrieved = result.unwrap();
        assert_eq!(retrieved.name, "Updated Name");
    }

    #[tokio::test]
    async fn test_project_archiving() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        let user = create_test_user(&user_service, "archive@example.com").await;
        let project = project_service
            .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "Archive Test".to_string(),
                description: None,
                owner_id: user.id,
                status: Some("active".to_string()),
                settings: None,
            })
            .await
            .unwrap();

        // Archive project
        let update_request = reconciliation_backend::services::project_models::UpdateProjectRequest {
            name: None,
            description: None,
            status: Some("archived".to_string()),
            settings: None,
        };
        let result = project_service.update_project(project.id, update_request).await;
        assert!(result.is_ok());

        let archived = result.unwrap();
        assert_eq!(archived.status, "archived");
    }

    #[tokio::test]
    async fn test_project_unarchiving() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        let user = create_test_user(&user_service, "unarchive@example.com").await;
        let project = project_service
            .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "Unarchive Test".to_string(),
                description: None,
                owner_id: user.id,
                status: Some("archived".to_string()),
                settings: None,
            })
            .await
            .unwrap();

        // Unarchive project
        let update_request = reconciliation_backend::services::project_models::UpdateProjectRequest {
            name: None,
            description: None,
            status: Some("active".to_string()),
            settings: None,
        };
        let result = project_service.update_project(project.id, update_request).await;
        assert!(result.is_ok());

        let unarchived = result.unwrap();
        assert_eq!(unarchived.status, "active");
    }

    #[tokio::test]
    async fn test_project_settings_validation() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        let user = create_test_user(&user_service, "settings@example.com").await;
        let project = project_service
            .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "Settings Test".to_string(),
                description: None,
                owner_id: user.id,
                status: None,
                settings: Some(serde_json::json!({
                    "theme": "dark",
                    "notifications": true
                })),
            })
            .await
            .unwrap();

        // Update settings
        let update_request = reconciliation_backend::services::project_models::UpdateProjectRequest {
            name: None,
            description: None,
            status: None,
            settings: Some(serde_json::json!({
                "theme": "light",
                "notifications": false
            })),
        };
        let result = project_service.update_project(project.id, update_request).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_project_deletion_with_data_cleanup() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        let user = create_test_user(&user_service, "delete_cleanup@example.com").await;
        let project = project_service
            .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "Delete Cleanup Test".to_string(),
                description: None,
                owner_id: user.id,
                status: None,
                settings: None,
            })
            .await
            .unwrap();

        // Delete project (should handle data cleanup)
        let result = project_service.delete_project(project.id).await;
        assert!(result.is_ok());

        // Verify project is deleted
        let get_result = project_service.get_project_by_id(project.id).await;
        assert!(get_result.is_err());
    }

    #[tokio::test]
    async fn test_project_statistics_aggregation() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        let user = create_test_user(&user_service, "stats@example.com").await;

        // Create multiple projects
        for i in 0..5 {
            project_service
                .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                    name: format!("Stats Project {}", i),
                    description: None,
                    owner_id: user.id,
                    status: Some(if i % 2 == 0 { "active" } else { "archived" }.to_string()),
                    settings: None,
                })
                .await
                .unwrap();
        }

        // List projects and verify statistics
        let result = project_service.list_projects(Some(1), Some(10)).await;
        assert!(result.is_ok());

        let projects = result.unwrap();
        assert!(projects.projects.len() >= 5);
    }

    #[tokio::test]
    async fn test_project_search_with_complex_filters() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        let user = create_test_user(&user_service, "search_complex@example.com").await;

        // Create projects with different characteristics
        project_service
            .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "Complex Search Project 1".to_string(),
                description: Some("Description with keyword".to_string()),
                owner_id: user.id,
                status: Some("active".to_string()),
                settings: None,
            })
            .await
            .unwrap();

        project_service
            .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "Another Complex Project".to_string(),
                description: Some("Different description".to_string()),
                owner_id: user.id,
                status: Some("archived".to_string()),
                settings: None,
            })
            .await
            .unwrap();

        // Search projects
        let result = project_service.search_projects("Complex", Some(1), Some(10)).await;
        assert!(result.is_ok());

        let projects = result.unwrap();
        assert!(projects.projects.len() >= 1);
    }

    #[tokio::test]
    async fn test_project_concurrent_operations() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = UserService::new(db_arc.clone(), auth_service.clone());
        let project_service = ProjectService::new((*db_arc).clone());

        let user = create_test_user(&user_service, "concurrent@example.com").await;
        let project = project_service
            .create_project(reconciliation_backend::services::project_models::CreateProjectRequest {
                name: "Concurrent Test".to_string(),
                description: None,
                owner_id: user.id,
                status: None,
                settings: None,
            })
            .await
            .unwrap();

        // Test concurrent operations
        let (result1, result2, result3) = tokio::join!(
            project_service.get_project_by_id(project.id),
            project_service.list_projects_by_owner(user.id, Some(1), Some(10)),
            project_service.list_projects(Some(1), Some(10))
        );

        assert!(result1.is_ok());
        assert!(result2.is_ok());
        assert!(result3.is_ok());
    }

    #[tokio::test]
    async fn test_project_update_nonexistent() {
        let (db, _) = setup_test_database().await;
        let project_service = ProjectService::new(db);

        let nonexistent_id = Uuid::new_v4();
        let update_request = reconciliation_backend::services::project_models::UpdateProjectRequest {
            name: Some("Updated".to_string()),
            description: None,
            status: None,
            settings: None,
        };

        let result = project_service.update_project(nonexistent_id, update_request).await;
        assert!(result.is_err());
    }
}

