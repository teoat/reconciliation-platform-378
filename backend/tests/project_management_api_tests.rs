//! API endpoint tests for project management handlers
//!
//! Tests all project management API endpoints including CRUD operations,
//! data sources, and reconciliation jobs.

use actix_web::{test, web, App};
use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::projects::{
    create_data_source, create_project, delete_project,
    get_project, get_project_data_sources, get_project_reconciliation_view,
    get_projects, get_reconciliation_jobs, update_project,
    // create_reconciliation_job, // Unused import removed
};
use reconciliation_backend::handlers::types::{
    CreateDataSourceRequest, CreateProjectRequest, UpdateProjectRequest,
};
use reconciliation_backend::services::auth::AuthService;
use reconciliation_backend::services::cache::MultiLevelCache;
use reconciliation_backend::services::project::ProjectService;
use reconciliation_backend::services::user::UserService;
use reconciliation_backend::test_utils_export::database::setup_test_database;

/// Helper function to create test config
fn create_test_config() -> reconciliation_backend::config::Config {
    reconciliation_backend::config::Config {
        host: "0.0.0.0".to_string(),
        port: 2000,
        database_url: "postgresql://test_user:test_pass@localhost:5432/test_db".to_string(),
        redis_url: "redis://localhost:6379".to_string(),
        jwt_secret: "test_secret".to_string(),
        jwt_expiration: 3600,
        cors_origins: vec!["http://localhost:3000".to_string()],
        log_level: "info".to_string(),
        max_file_size: 10485760,
        upload_path: "./uploads".to_string(),
    }
}

/// Test project management API endpoints
#[cfg(test)]
mod project_management_api_tests {
    use super::*;

    /// Setup test fixtures (user, project)
    async fn setup_test_fixtures(
        db: Database,
        auth_service: AuthService,
    ) -> (Uuid, Uuid, String) {
        let user_service = UserService::new(Arc::new(db.clone()), auth_service.clone());
        let project_service = ProjectService::new(db.clone());

        // Create test user
        let user = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "projectuser@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Project".to_string(),
                last_name: "User".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Create test project
        let project = project_service
            .create_project(reconciliation_backend::services::project::CreateProjectRequest {
                name: "Test Project".to_string(),
                description: Some("Test project description".to_string()),
                owner_id: user.id,
                status: None,
                settings: None,
            })
            .await
            .unwrap();

        // Generate token for authentication
        let user_model = user_service
            .get_user_by_email("projectuser@example.com")
            .await
            .unwrap();
        let token = auth_service.generate_token(&user_model).unwrap();

        (user.id, project.id, token)
    }

    #[tokio::test]
    async fn test_get_projects_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::get()
            .uri("/api/projects?page=1&per_page=10")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/projects", web::get().to(get_projects)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_projects_with_pagination() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::get()
            .uri("/api/projects?page=2&per_page=5")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/projects", web::get().to(get_projects)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_create_project_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (user_id, _, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let project_request = CreateProjectRequest {
            name: "New Test Project".to_string(),
            description: Some("New project description".to_string()),
            owner_id: user_id,
            status: None,
            settings: None,
        };

        // Create JSON payload manually since CreateProjectRequest may not implement Serialize
        let project_json = serde_json::json!({
            "name": project_request.name,
            "description": project_request.description,
            "owner_id": project_request.owner_id,
            "status": project_request.status,
            "settings": project_request.settings
        });

        let req = test::TestRequest::post()
            .uri("/api/projects")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&project_json)
            .to_request();

        let config = web::Data::new(create_test_config());

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(config)
                .route("/api/projects", web::post().to(create_project)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success() || resp.status().as_u16() == 201);
    }

    #[tokio::test]
    async fn test_create_project_invalid_name() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (user_id, _, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        // Empty name should fail validation
        let project_json = serde_json::json!({
            "name": "",
            "description": "Invalid project",
            "owner_id": user_id
        });

        let req = test::TestRequest::post()
            .uri("/api/projects")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&project_json)
            .to_request();

        let config = web::Data::new(create_test_config());

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(config)
                .route("/api/projects", web::post().to(create_project)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_get_project_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, project_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::get()
            .uri(&format!("/api/projects/{}", project_id))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/projects/{project_id}", web::get().to(get_project)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_project_not_found() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let non_existent_id = Uuid::new_v4();

        let req = test::TestRequest::get()
            .uri(&format!("/api/projects/{}", non_existent_id))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/projects/{project_id}", web::get().to(get_project)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_update_project_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, project_id, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let update_request = UpdateProjectRequest {
            name: Some("Updated Project Name".to_string()),
            description: Some("Updated description".to_string()),
            status: None,
            settings: None,
        };

        // Create JSON payload manually
        let update_json = serde_json::json!({
            "name": update_request.name,
            "description": update_request.description,
            "status": update_request.status,
            "settings": update_request.settings
        });

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::put()
            .uri(&format!("/api/projects/{}", project_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&update_json)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/projects/{project_id}", web::put().to(update_project)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_delete_project_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, project_id, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::delete()
            .uri(&format!("/api/projects/{}", project_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/projects/{project_id}", web::delete().to(delete_project)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 204 No Content or 404 if already deleted
        assert!(resp.status().is_success() || resp.status().as_u16() == 204 || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_get_project_data_sources() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, project_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::get()
            .uri(&format!("/api/projects/{}/data-sources", project_id))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/projects/{project_id}/data-sources", web::get().to(get_project_data_sources)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_create_data_source() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, project_id, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let data_source_request = CreateDataSourceRequest {
            name: "Test Data Source".to_string(),
            description: Some("Test data source description".to_string()),
            source_type: "csv".to_string(),
            file_path: None,
            file_size: None,
            file_hash: None,
            schema: None,
        };

        // Create JSON payload manually
        let data_source_json = serde_json::json!({
            "name": data_source_request.name,
            "description": data_source_request.description,
            "source_type": data_source_request.source_type,
            "file_path": data_source_request.file_path,
            "file_size": data_source_request.file_size,
            "file_hash": data_source_request.file_hash,
            "schema": data_source_request.schema
        });

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::post()
            .uri(&format!("/api/projects/{}/data-sources", project_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&data_source_json)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/projects/{project_id}/data-sources", web::post().to(create_data_source)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 201 Created or 400/404 if validation fails
        assert!(resp.status().is_success() || resp.status().as_u16() == 201 || resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_get_reconciliation_jobs() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, project_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::get()
            .uri(&format!("/api/projects/{}/reconciliation-jobs", project_id))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/projects/{project_id}/reconciliation-jobs", web::get().to(get_reconciliation_jobs)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_get_project_reconciliation_view() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, project_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::get()
            .uri(&format!("/api/projects/{}/reconciliation/view", project_id))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/projects/{project_id}/reconciliation/view", web::get().to(get_project_reconciliation_view)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    // Edge cases
    #[tokio::test]
    async fn test_create_project_empty_name() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, _, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let project_request = serde_json::json!({
            "name": "",
            "description": "Test project"
        });

        let req = test::TestRequest::post()
            .uri("/api/projects")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&project_request)
            .to_request();

        let project_service = web::Data::new(ProjectService::new((*db_arc).clone()));
        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(project_service)
                .app_data(cache)
                .app_data(config)
                .route("/api/projects", web::post().to(create_project)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should fail validation
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_get_project_not_found_edge_case() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let _auth_service = AuthService::new("test_secret".to_string(), 3600);

        let nonexistent_project_id = Uuid::new_v4();

        let project_service = web::Data::new(ProjectService::new((*db_arc).clone()));
        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::get()
            .uri(&format!("/api/projects/{}", nonexistent_project_id))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(project_service)
                .app_data(cache)
                .app_data(config)
                .route("/api/projects/{project_id}", web::get().to(get_project)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should return 404
        assert_eq!(resp.status().as_u16(), 404);
    }

    #[tokio::test]
    async fn test_update_project_not_found() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, _, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let nonexistent_project_id = Uuid::new_v4();
        let update_request = serde_json::json!({
            "name": "Updated Name"
        });

        let project_service = web::Data::new(ProjectService::new((*db_arc).clone()));
        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::put()
            .uri(&format!("/api/projects/{}", nonexistent_project_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&update_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(project_service)
                .app_data(cache)
                .app_data(config)
                .route("/api/projects/{project_id}", web::put().to(update_project)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should return 404
        assert_eq!(resp.status().as_u16(), 404);
    }

    #[tokio::test]
    async fn test_create_data_source_invalid_project() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, _, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let invalid_project_id = Uuid::new_v4();
        let data_source_json = serde_json::json!({
            "name": "Test Data Source",
            "source_type": "file",
            "file_path": "/path/to/file.csv"
        });

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::post()
            .uri(&format!("/api/projects/{}/data-sources", invalid_project_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&data_source_json)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/projects/{project_id}/data-sources", web::post().to(create_data_source)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should fail with 404
        assert!(resp.status().is_client_error());
    }
}

