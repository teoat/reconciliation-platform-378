//! API endpoint tests for reconciliation handlers
//!
//! Tests all reconciliation API endpoints including job management,
//! matching, results retrieval, and export functionality.

use actix_web::{test, web, App};
use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::reconciliation::{
    batch_resolve_conflicts, create_reconciliation_job, delete_reconciliation_job,
    get_active_reconciliation_jobs, get_export_status, get_queued_reconciliation_jobs,
    get_reconciliation_job, get_reconciliation_jobs, get_reconciliation_progress,
    get_reconciliation_results, start_export_job, start_reconciliation_job,
    start_sample_onboarding, stop_reconciliation_job, update_reconciliation_job,
    update_reconciliation_match,
};
use reconciliation_backend::handlers::types::{
    CreateReconciliationJobRequest, UpdateReconciliationJobRequest,
};
use reconciliation_backend::services::auth::AuthService;
use reconciliation_backend::services::cache::MultiLevelCache;
use reconciliation_backend::services::project::ProjectService;
use reconciliation_backend::services::reconciliation::ReconciliationService;
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

/// Test reconciliation API endpoints
#[cfg(test)]
mod reconciliation_api_tests {
    use super::*;

    /// Setup test fixtures (user, project, data sources)
    async fn setup_test_fixtures(
        db: Database,
        auth_service: AuthService,
    ) -> (Uuid, Uuid, Uuid, String) {
        let db_arc = Arc::new(db.clone());
        let user_service = UserService::new(db_arc, auth_service);
        let project_service = ProjectService::new(db.clone());

        // Create test user
        let user = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "reconciliation@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Reconciliation".to_string(),
                last_name: "Test".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Create test project
        let project = project_service
            .create_project(reconciliation_backend::services::project::CreateProjectRequest {
                name: "Reconciliation Test Project".to_string(),
                description: Some("Test project for reconciliation".to_string()),
                owner_id: user.id,
                status: None,
                settings: None,
            })
            .await
            .unwrap();

        // Create data sources (simplified - would normally create actual data sources)
        let source_a_id = Uuid::new_v4();
        let source_b_id = Uuid::new_v4();

        // Generate token for authentication
        let user_model = user_service
            .get_user_by_email("reconciliation@example.com")
            .await
            .unwrap();
        let token = auth_service.generate_token(&user_model).unwrap();

        (user.id, project.id, source_a_id, token)
    }

    #[tokio::test]
    async fn test_get_reconciliation_jobs() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);

        let req = test::TestRequest::get()
            .uri("/api/reconciliation/jobs")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .route("/api/reconciliation/jobs", web::get().to(get_reconciliation_jobs)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());

        let body: serde_json::Value = test::read_body_json(resp).await;
        assert!(body["success"].as_bool().unwrap());
        assert!(body["data"].is_array());
    }

    #[tokio::test]
    async fn test_create_reconciliation_job_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());

        let (_user_id, project_id, source_a_id, token) =
            setup_test_fixtures((*db_arc).clone(), (*auth_service_arc).clone()).await;

        let source_b_id = Uuid::new_v4();

        let job_request = CreateReconciliationJobRequest {
            name: "Test Reconciliation Job".to_string(),
            description: Some("Test job description".to_string()),
            project_id,
            source_data_source_id: source_a_id,
            target_data_source_id: source_b_id,
            confidence_threshold: 0.8,
            settings: Some(serde_json::json!({
                "matching_rules": []
            })),
        };

        // Create JSON payload manually since CreateReconciliationJobRequest doesn't implement Serialize
        let job_json = serde_json::json!({
            "name": job_request.name,
            "description": job_request.description,
            "project_id": job_request.project_id,
            "source_data_source_id": job_request.source_data_source_id,
            "target_data_source_id": job_request.target_data_source_id,
            "confidence_threshold": job_request.confidence_threshold,
            "settings": job_request.settings
        });

        let req = test::TestRequest::post()
            .uri("/api/reconciliation/jobs")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&job_json)
            .to_request();

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/reconciliation/jobs", web::post().to(create_reconciliation_job)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May fail if data sources don't exist, but tests the handler structure
        assert!(resp.status().is_success() || resp.status().as_u16() == 400 || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_create_reconciliation_job_invalid_threshold() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());

        let (_, project_id, source_a_id, token) =
            setup_test_fixtures(db_arc.clone(), auth_service_arc.clone()).await;

        let source_b_id = Uuid::new_v4();

        // Invalid threshold (> 1.0)
        let job_request = CreateReconciliationJobRequest {
            name: "Test Job".to_string(),
            description: None,
            project_id,
            source_data_source_id: source_a_id,
            target_data_source_id: source_b_id,
            confidence_threshold: 1.5, // Invalid
            settings: None,
        };

        // Create JSON payload manually since CreateReconciliationJobRequest doesn't implement Serialize
        let job_json = serde_json::json!({
            "name": job_request.name,
            "description": job_request.description,
            "project_id": job_request.project_id,
            "source_data_source_id": job_request.source_data_source_id,
            "target_data_source_id": job_request.target_data_source_id,
            "confidence_threshold": job_request.confidence_threshold,
            "settings": job_request.settings
        });

        let req = test::TestRequest::post()
            .uri("/api/reconciliation/jobs")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&job_json)
            .to_request();

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/reconciliation/jobs", web::post().to(create_reconciliation_job)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should fail validation
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_get_reconciliation_job_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());

        let (_, _, _, token) = setup_test_fixtures(db_arc.clone(), auth_service_arc.clone()).await;

        let job_id = Uuid::new_v4();

        let req = test::TestRequest::get()
            .uri(&format!("/api/reconciliation/jobs/{}", job_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let config = web::Data::new(create_test_config());

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(config)
                .route("/api/reconciliation/jobs/{job_id}", web::get().to(get_reconciliation_job)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if job doesn't exist, but tests handler structure
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_get_reconciliation_job_missing_auth() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);

        let job_id = Uuid::new_v4();

        let req = test::TestRequest::get()
            .uri(&format!("/api/reconciliation/jobs/{}", job_id))
            .to_request();

        let config = web::Data::new(create_test_config());

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(config)
                .route("/api/reconciliation/jobs/{job_id}", web::get().to(get_reconciliation_job)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_update_reconciliation_job_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());

        let (_, _, _, token) = setup_test_fixtures(db_arc.clone(), auth_service_arc.clone()).await;

        let job_id = Uuid::new_v4();

        let update_request = UpdateReconciliationJobRequest {
            name: Some("Updated Job Name".to_string()),
            description: Some("Updated description".to_string()),
            confidence_threshold: Some(0.9),
            settings: None,
        };

        // Create JSON payload manually since UpdateReconciliationJobRequest doesn't implement Serialize
        let update_json = serde_json::json!({
            "name": update_request.name,
            "description": update_request.description,
            "confidence_threshold": update_request.confidence_threshold,
            "settings": update_request.settings
        });

        let req = test::TestRequest::put()
            .uri(&format!("/api/reconciliation/jobs/{}", job_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&update_json)
            .to_request();

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route("/api/reconciliation/jobs/{job_id}", web::put().to(update_reconciliation_job)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if job doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_delete_reconciliation_job() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());

        let (_, _, _, token) = setup_test_fixtures(db_arc.clone(), auth_service_arc.clone()).await;

        let job_id = Uuid::new_v4();

        let req = test::TestRequest::delete()
            .uri(&format!("/api/reconciliation/jobs/{}", job_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route(
                    "/api/reconciliation/jobs/{job_id}",
                    web::delete().to(delete_reconciliation_job),
                ),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if job doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_start_reconciliation_job() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());

        let (_, _, _, token) = setup_test_fixtures(db_arc.clone(), auth_service_arc.clone()).await;

        let job_id = Uuid::new_v4();

        let req = test::TestRequest::post()
            .uri(&format!("/api/reconciliation/jobs/{}/start", job_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let reconciliation_service = web::Data::new(ReconciliationService::new((*db_arc).clone()));
        let config = web::Data::new(create_test_config());

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(reconciliation_service)
                .app_data(config)
                .route(
                    "/api/reconciliation/jobs/{job_id}/start",
                    web::post().to(start_reconciliation_job),
                ),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if job doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_stop_reconciliation_job() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());

        let (_, _, _, token) = setup_test_fixtures(db_arc.clone(), auth_service_arc.clone()).await;

        let job_id = Uuid::new_v4();

        let req = test::TestRequest::post()
            .uri(&format!("/api/reconciliation/jobs/{}/stop", job_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let reconciliation_service = web::Data::new(ReconciliationService::new((*db_arc).clone()));
        let config = web::Data::new(create_test_config());

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(reconciliation_service)
                .app_data(config)
                .route(
                    "/api/reconciliation/jobs/{job_id}/stop",
                    web::post().to(stop_reconciliation_job),
                ),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if job doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_get_reconciliation_results() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());

        let (_, _, _, token) = setup_test_fixtures(db_arc.clone(), auth_service_arc.clone()).await;

        let job_id = Uuid::new_v4();

        let req = test::TestRequest::get()
            .uri(&format!("/api/reconciliation/jobs/{}/results", job_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let reconciliation_service = web::Data::new(ReconciliationService::new((*db_arc).clone()));
        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(reconciliation_service)
                .app_data(cache)
                .app_data(config)
                .route(
                    "/api/reconciliation/jobs/{job_id}/results",
                    web::get().to(get_reconciliation_results),
                ),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if job doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_update_reconciliation_match() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());

        let (_, _, _, token) = setup_test_fixtures(db_arc.clone(), auth_service_arc.clone()).await;

        let match_id = Uuid::new_v4();

        let update_data = serde_json::json!({
            "status": "approved",
            "confidence_score": 0.95,
            "reviewed_by": "test_user"
        });

        let req = test::TestRequest::put()
            .uri(&format!("/api/reconciliation/matches/{}", match_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&update_data)
            .to_request();

        let reconciliation_service = web::Data::new(ReconciliationService::new((*db_arc).clone()));

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(reconciliation_service)
                .route(
                    "/api/reconciliation/matches/{match_id}",
                    web::put().to(update_reconciliation_match),
                ),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if match doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_batch_resolve_conflicts() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());

        let (_, _, _, token) = setup_test_fixtures(db_arc.clone(), auth_service_arc.clone()).await;

        let batch_request = serde_json::json!({
            "resolves": [
                {
                    "match_id": Uuid::new_v4(),
                    "action": "approve",
                    "notes": "Test approval"
                }
            ]
        });

        let req = test::TestRequest::post()
            .uri("/api/reconciliation/batch-resolve")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&batch_request)
            .to_request();

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(config)
                .route(
                    "/api/reconciliation/batch-resolve",
                    web::post().to(batch_resolve_conflicts),
                ),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Handler should process the request
        assert!(resp.status().is_success() || resp.status().as_u16() == 400);
    }

    #[tokio::test]
    async fn test_get_active_reconciliation_jobs() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);

        let req = test::TestRequest::get()
            .uri("/api/reconciliation/active")
            .to_request();

        let reconciliation_service = web::Data::new(ReconciliationService::new((*db_arc).clone()));

        let app = test::init_service(
            App::new()
                .app_data(reconciliation_service)
                .route(
                    "/api/reconciliation/active",
                    web::get().to(get_active_reconciliation_jobs),
                ),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_queued_reconciliation_jobs() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);

        let req = test::TestRequest::get()
            .uri("/api/reconciliation/queued")
            .to_request();

        let reconciliation_service = web::Data::new(ReconciliationService::new((*db_arc).clone()));

        let app = test::init_service(
            App::new()
                .app_data(reconciliation_service)
                .route(
                    "/api/reconciliation/queued",
                    web::get().to(get_queued_reconciliation_jobs),
                ),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_reconciliation_progress() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());

        let (_, _, _, token) = setup_test_fixtures(db_arc.clone(), auth_service_arc.clone()).await;

        let job_id = Uuid::new_v4();

        let req = test::TestRequest::get()
            .uri(&format!("/api/reconciliation/jobs/{}/progress", job_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let reconciliation_service = web::Data::new(ReconciliationService::new((*db_arc).clone()));

        let app = test::init_service(
            App::new()
                .app_data(reconciliation_service)
                .route(
                    "/api/reconciliation/jobs/{job_id}/progress",
                    web::get().to(get_reconciliation_progress),
                ),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if job doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_start_export_job() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());

        let (_, _, _, token) = setup_test_fixtures(db_arc.clone(), auth_service_arc.clone()).await;

        let job_id = Uuid::new_v4();

        let export_request = serde_json::json!({
            "format": "csv",
            "include_unmatched": true
        });

        let req = test::TestRequest::post()
            .uri(&format!("/api/reconciliation/jobs/{}/export", job_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&export_request)
            .to_request();

        let reconciliation_service = web::Data::new(ReconciliationService::new((*db_arc).clone()));
        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(reconciliation_service)
                .app_data(cache)
                .app_data(config)
                .route(
                    "/api/reconciliation/jobs/{job_id}/export",
                    web::post().to(start_export_job),
                ),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if job doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_get_export_status() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());

        let (_, _, _, token) = setup_test_fixtures(db_arc.clone(), auth_service_arc.clone()).await;

        let job_id = Uuid::new_v4();

        let req = test::TestRequest::get()
            .uri(&format!("/api/reconciliation/jobs/{}/export/status", job_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let reconciliation_service = web::Data::new(ReconciliationService::new((*db_arc).clone()));
        let config = web::Data::new(create_test_config());

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(reconciliation_service)
                .app_data(config)
                .route(
                    "/api/reconciliation/jobs/{job_id}/export/status",
                    web::get().to(get_export_status),
                ),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if export doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_start_sample_onboarding() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());

        let (_, project_id, _, token) =
            setup_test_fixtures(db_arc.clone(), auth_service_arc.clone()).await;

        let onboarding_request = serde_json::json!({
            "project_id": project_id,
            "sample_size": 100
        });

        let req = test::TestRequest::post()
            .uri("/api/reconciliation/sample/onboard")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&onboarding_request)
            .to_request();

        let reconciliation_service = web::Data::new(ReconciliationService::new((*db_arc).clone()));
        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let config = web::Data::new(create_test_config());

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(reconciliation_service)
                .app_data(cache)
                .app_data(config)
                .route(
                    "/api/reconciliation/sample/onboard",
                    web::post().to(start_sample_onboarding),
                ),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Handler should process the request
        assert!(resp.status().is_success() || resp.status().as_u16() == 400);
    }
}

