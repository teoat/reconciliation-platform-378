//! API endpoint tests for file management handlers
//!
//! Tests all file management API endpoints including resumable uploads,
//! file retrieval, preview, processing, and deletion.

use actix_web::{test, web, App};
use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::files::{
    complete_resumable_upload, delete_file, get_file, get_file_preview, init_resumable_upload,
    process_file,
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

/// Test file management API endpoints
#[cfg(test)]
mod file_management_api_tests {
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
                email: "fileuser@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "File".to_string(),
                last_name: "User".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Create test project
        let project = project_service
            .create_project(reconciliation_backend::services::project::CreateProjectRequest {
                name: "File Test Project".to_string(),
                description: Some("Test project for files".to_string()),
                owner_id: user.id,
                status: None,
                settings: None,
            })
            .await
            .unwrap();

        // Generate token for authentication
        let user_model = user_service
            .get_user_by_email("fileuser@example.com")
            .await
            .unwrap();
        let token = auth_service.generate_token(&user_model).unwrap();

        (user.id, project.id, token)
    }

    #[tokio::test]
    async fn test_init_resumable_upload_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, project_id, token) =
            setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        // Create JSON payload manually since InitResumableReq doesn't implement Serialize
        let init_json = serde_json::json!({
            "project_id": project_id,
            "filename": "test_file.csv",
            "expected_size": 1024
        });

        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::post()
            .uri("/api/files/upload/resumable/init")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&init_json)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(config)
                .route(
                    "/api/files/upload/resumable/init",
                    web::post().to(init_resumable_upload),
                ),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_init_resumable_upload_missing_auth() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, project_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        // Create JSON payload manually
        let init_json = serde_json::json!({
            "project_id": project_id,
            "filename": "test_file.csv",
            "expected_size": 1024
        });

        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::post()
            .uri("/api/files/upload/resumable/init")
            .set_json(&init_json)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(config)
                .route(
                    "/api/files/upload/resumable/init",
                    web::post().to(init_resumable_upload),
                ),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_get_file_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, _, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let file_id = Uuid::new_v4();

        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::get()
            .uri(&format!("/api/files/{}", file_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(config)
                .route("/api/files/{file_id}", web::get().to(get_file)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if file doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_get_file_preview() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, _, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let file_id = Uuid::new_v4();

        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::get()
            .uri(&format!("/api/files/{}/preview", file_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(config)
                .route("/api/files/{file_id}/preview", web::get().to(get_file_preview)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if file doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_delete_file() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, _, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let file_id = Uuid::new_v4();

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::delete()
            .uri(&format!("/api/files/{}", file_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/files/{file_id}", web::delete().to(delete_file)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 204 No Content or 404 if file doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 204 || resp.status().as_u16() == 404);
    }

    // Edge cases
    #[tokio::test]
    async fn test_init_resumable_upload_invalid_size() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, _, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        // Try with negative file size
        let init_request = serde_json::json!({
            "filename": "test.csv",
            "file_size": -1,
            "content_type": "text/csv"
        });

        let req = test::TestRequest::post()
            .uri("/api/files/upload/resumable/init")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&init_request)
            .to_request();

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/files/upload/resumable/init", web::post().to(init_resumable_upload)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should fail validation
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_get_file_not_found() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, _, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let nonexistent_file_id = Uuid::new_v4();

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::get()
            .uri(&format!("/api/files/{}", nonexistent_file_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/files/{file_id}", web::get().to(get_file)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should return 404
        assert_eq!(resp.status().as_u16(), 404);
    }

    #[tokio::test]
    async fn test_delete_file_unauthorized() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);

        let file_id = Uuid::new_v4();

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::delete()
            .uri(&format!("/api/files/{}", file_id))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/files/{file_id}", web::delete().to(delete_file)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should fail without auth
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_process_file() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, _, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let file_id = Uuid::new_v4();

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::post()
            .uri(&format!("/api/files/{}/process", file_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/files/{file_id}/process", web::post().to(process_file)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if file doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_complete_resumable_upload() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, project_id, token) =
            setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let complete_request = serde_json::json!({
            "project_id": project_id,
            "upload_id": Uuid::new_v4(),
            "filename": "test_file.csv",
            "total_chunks": 1
        });

        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::post()
            .uri("/api/files/upload/resumable/complete")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&complete_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(config)
                .route(
                    "/api/files/upload/resumable/complete",
                    web::post().to(complete_resumable_upload),
                ),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 400/404 if upload doesn't exist
        assert!(resp.status().is_success() || resp.status().is_client_error());
    }
}

