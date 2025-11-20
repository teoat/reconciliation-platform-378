//! API endpoint tests for sync and onboarding handlers
//!
//! Tests all sync and onboarding API endpoints including data synchronization,
//! onboarding progress, and device management.

use actix_web::{test, web, App};
use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::onboarding::{
    get_onboarding_progress, get_user_devices, register_device, sync_onboarding_progress,
};
use reconciliation_backend::handlers::sync::{
    get_synced_data, get_sync_status, get_unsynced_data, recover_unsynced, sync_data,
};
use reconciliation_backend::services::auth::AuthService;
use reconciliation_backend::services::user::UserService;
use reconciliation_backend::test_utils_export::database::setup_test_database;

/// Test sync and onboarding API endpoints
#[cfg(test)]
mod sync_onboarding_api_tests {
    use super::*;

    /// Setup test fixtures (user)
    async fn setup_test_fixtures(
        db: Database,
        auth_service: AuthService,
    ) -> (Uuid, String) {
        let user_service = UserService::new(Arc::new(db.clone()), auth_service.clone());

        // Create test user
        let user = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "syncuser@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Sync".to_string(),
                last_name: "User".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Generate token for authentication
        let user_model = user_service
            .get_user_by_email("syncuser@example.com")
            .await
            .unwrap();
        let token = auth_service.generate_token(&user_model).unwrap();

        (user.id, token)
    }

    #[tokio::test]
    async fn test_get_sync_status() {
        let req = test::TestRequest::get()
            .uri("/api/sync/status")
            .to_request();

        let app = test::init_service(
            App::new()
                .route("/api/sync/status", web::get().to(get_sync_status)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_sync_data() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let sync_request = serde_json::json!({
            "key": "test_key",
            "data": {"test": "data"},
            "data_type": "test_type",
            "project_id": null
        });

        let req = test::TestRequest::post()
            .uri("/api/sync/data")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&sync_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .route("/api/sync/data", web::post().to(sync_data)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_synced_data() {
        let key = "test_key";

        let req = test::TestRequest::get()
            .uri(&format!("/api/sync/data/{}", key))
            .to_request();

        let app = test::init_service(
            App::new()
                .route("/api/sync/data/{key}", web::get().to(get_synced_data)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if data doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_get_unsynced_data() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let req = test::TestRequest::get()
            .uri("/api/sync/unsynced")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .route("/api/sync/unsynced", web::get().to(get_unsynced_data)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_onboarding_progress() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let req = test::TestRequest::get()
            .uri("/api/onboarding/progress")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .route("/api/onboarding/progress", web::get().to(get_onboarding_progress)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_sync_onboarding_progress() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let progress_request = serde_json::json!({
            "onboarding_type": "initial",
            "completed_onboarding": false,
            "completed_steps": ["step1", "step2"],
            "current_step": "step3"
        });

        let req = test::TestRequest::post()
            .uri("/api/onboarding/progress")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&progress_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .route("/api/onboarding/progress", web::post().to(sync_onboarding_progress)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_register_device() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let device_request = serde_json::json!({
            "device_id": "test_device_123",
            "device_name": "Test Device",
            "device_type": "web",
            "user_agent": "Mozilla/5.0"
        });

        let req = test::TestRequest::post()
            .uri("/api/onboarding/devices")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&device_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .route("/api/onboarding/devices", web::post().to(register_device)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success() || resp.status().as_u16() == 201);
    }

    #[tokio::test]
    async fn test_get_user_devices() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let req = test::TestRequest::get()
            .uri("/api/onboarding/devices")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .route("/api/onboarding/devices", web::get().to(get_user_devices)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_recover_unsynced() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let req = test::TestRequest::post()
            .uri("/api/sync/recover")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .route("/api/sync/recover", web::post().to(recover_unsynced)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    // Edge cases
    #[tokio::test]
    async fn test_sync_status_unauthorized() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);

        let req = test::TestRequest::get()
            .uri("/api/sync/status")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .route("/api/sync/status", web::get().to(get_sync_status)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should fail without auth
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_register_device_missing_fields() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        // Missing required fields
        let device_request = serde_json::json!({
            "device_id": "test_device_123"
        });

        let req = test::TestRequest::post()
            .uri("/api/onboarding/devices")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&device_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .route("/api/onboarding/devices", web::post().to(register_device)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should fail validation
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_get_onboarding_progress_not_found() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let nonexistent_user_id = Uuid::new_v4();

        let req = test::TestRequest::get()
            .uri(&format!("/api/onboarding/progress/{}", nonexistent_user_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .route("/api/onboarding/progress/{user_id}", web::get().to(get_onboarding_progress)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should return 404 or handle gracefully
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_sync_data_invalid_payload() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        // Invalid payload structure
        let sync_request = serde_json::json!({
            "invalid": "data"
        });

        let req = test::TestRequest::post()
            .uri("/api/sync/data")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&sync_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .route("/api/sync/data", web::post().to(sync_data)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should fail validation
        assert!(resp.status().is_client_error());
    }
}

