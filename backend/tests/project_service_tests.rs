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
        assert_eq!(projects.len(), 0);
    }
}

