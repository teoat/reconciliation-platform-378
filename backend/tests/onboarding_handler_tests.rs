//! Onboarding handler tests
//!
//! Comprehensive tests for onboarding endpoints

use actix_web::{test, web, App};
use serde_json::json;
use uuid::Uuid;

use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::onboarding;
use reconciliation_backend::handlers::types::ApiResponse;
use reconciliation_backend::test_utils_export::database::setup_test_database;

#[tokio::test]
async fn test_get_onboarding_progress_no_auth() {
    let db = setup_test_database().await;
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(db))
            .service(web::scope("/onboarding").configure(onboarding::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/onboarding/progress")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // Should fail without auth
    assert!(resp.status().is_client_error());
}

#[tokio::test]
async fn test_sync_onboarding_progress_no_auth() {
    let db = setup_test_database().await;
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(db))
            .service(web::scope("/onboarding").configure(onboarding::configure_routes))
    ).await;

    let request_data = json!({
        "onboarding_type": "initial",
        "completed_onboarding": false,
        "completed_steps": []
    });

    let req = test::TestRequest::post()
        .uri("/onboarding/progress")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    // Should fail without auth
    assert!(resp.status().is_client_error());
}

#[tokio::test]
async fn test_register_device_no_auth() {
    let db = setup_test_database().await;
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(db))
            .service(web::scope("/onboarding").configure(onboarding::configure_routes))
    ).await;

    let request_data = json!({
        "device_id": "test-device-123",
        "device_name": "Test Device",
        "device_type": "web"
    });

    let req = test::TestRequest::post()
        .uri("/onboarding/devices")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    // Should fail without auth
    assert!(resp.status().is_client_error());
}

#[tokio::test]
async fn test_get_user_devices_no_auth() {
    let db = setup_test_database().await;
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(db))
            .service(web::scope("/onboarding").configure(onboarding::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/onboarding/devices")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // Should fail without auth
    assert!(resp.status().is_client_error());
}

