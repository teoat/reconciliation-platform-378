//! System handler tests
//!
//! Comprehensive tests for system endpoints

use actix_web::{test, web, App};

use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::system;
use reconciliation_backend::test_utils_export::database::setup_test_database;

#[tokio::test]
async fn test_system_status() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/system").configure(system::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/system/status")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["status"], "operational");
    assert!(body.get("version").is_some());
    assert!(body.get("uptime").is_some());
}

#[tokio::test]
async fn test_get_metrics() {
    let db = setup_test_database().await;
    let config = reconciliation_backend::config::Config::from_env()
        .unwrap_or_default();

    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(db))
            .app_data(web::Data::new(config))
            .service(web::scope("/system").configure(system::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/system/metrics")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: reconciliation_backend::handlers::types::ApiResponse<serde_json::Value> = 
        test::read_body_json(resp).await;
    assert!(body.success);
    assert!(body.data.is_some());
}

