//! Monitoring handler tests
//!
//! Comprehensive tests for monitoring endpoints

use actix_web::{test, web, App};

use reconciliation_backend::handlers::monitoring;
use reconciliation_backend::handlers::types::ApiResponse;

#[tokio::test]
async fn test_get_health() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/monitoring").configure(monitoring::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/monitoring/health")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
    assert!(body.success);
    assert!(body.data.is_some());
    
    let data = body.data.unwrap();
    assert_eq!(data["status"], "operational");
    assert!(data.get("uptime_seconds").is_some());
}

#[tokio::test]
async fn test_get_metrics() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/monitoring").configure(monitoring::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/monitoring/metrics")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
    assert!(body.success);
    assert!(body.data.is_some());
}

#[tokio::test]
async fn test_get_alerts() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/monitoring").configure(monitoring::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/monitoring/alerts")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
    assert!(body.success);
    assert!(body.data.is_some());
}

#[tokio::test]
async fn test_get_system_metrics() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/monitoring").configure(monitoring::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/monitoring/system")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
    assert!(body.success);
    assert!(body.data.is_some());
}

