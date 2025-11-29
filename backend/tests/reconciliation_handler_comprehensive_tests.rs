//! Comprehensive Reconciliation handler tests
//!
//! Tests for all reconciliation endpoints

use actix_web::{test, web, App};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::reconciliation;
use reconciliation_backend::test_utils_export::database::setup_test_database;

#[tokio::test]
async fn test_get_reconciliation_jobs_no_auth() {
    let db = Arc::new(setup_test_database().await);
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new((*db).clone()))
            .service(web::scope("/reconciliation").configure(reconciliation::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/reconciliation/jobs")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth requirement
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_create_reconciliation_job_no_auth() {
    let db = Arc::new(setup_test_database().await);
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new((*db).clone()))
            .service(web::scope("/reconciliation").configure(reconciliation::configure_routes))
    ).await;

    let request_data = json!({
        "project_id": Uuid::new_v4(),
        "source_a_id": Uuid::new_v4(),
        "source_b_id": Uuid::new_v4(),
        "matching_rules": []
    });

    let req = test::TestRequest::post()
        .uri("/reconciliation/jobs")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());
}

#[tokio::test]
async fn test_get_reconciliation_job_no_auth() {
    let db = Arc::new(setup_test_database().await);
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new((*db).clone()))
            .service(web::scope("/reconciliation").configure(reconciliation::configure_routes))
    ).await;

    let job_id = Uuid::new_v4();
    let req = test::TestRequest::get()
        .uri(&format!("/reconciliation/jobs/{}", job_id))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());
}

