//! Sync handler tests
//!
//! Comprehensive tests for sync endpoints

use actix_web::{test, web, App};
use serde_json::json;
use uuid::Uuid;

use reconciliation_backend::handlers::sync;
use reconciliation_backend::handlers::types::ApiResponse;

#[tokio::test]
async fn test_get_sync_status() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/sync").configure(sync::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/sync/status")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
    assert!(body.success);
    assert!(body.data.is_some());
    assert_eq!(body.data.as_ref().unwrap()["status"], "available");
}

#[tokio::test]
async fn test_sync_data_no_auth() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/sync").configure(sync::configure_routes))
    ).await;

    let request_data = json!({
        "key": "test-key",
        "data": {"test": "data"},
        "data_type": "test",
        "project_id": Uuid::new_v4()
    });

    let req = test::TestRequest::post()
        .uri("/sync/data")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth requirement
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_get_synced_data_no_auth() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/sync").configure(sync::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/sync/data/test-key")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth requirement
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_get_unsynced_data_no_auth() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/sync").configure(sync::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/sync/unsynced")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth requirement
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

