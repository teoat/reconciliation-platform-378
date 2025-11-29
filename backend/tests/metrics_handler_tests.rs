//! Metrics handler tests
//!
//! Comprehensive tests for metrics endpoints

use actix_web::{test, web, App};
use std::sync::Arc;

use reconciliation_backend::handlers::metrics;
use reconciliation_backend::services::metrics::MetricsService;

#[tokio::test]
async fn test_get_metrics() {
    let metrics_service = Arc::new(MetricsService::new());
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(metrics_service.clone()))
            .service(web::scope("/metrics").configure(metrics::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/metrics")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
}

#[tokio::test]
async fn test_get_metrics_summary() {
    let metrics_service = Arc::new(MetricsService::new());
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(metrics_service.clone()))
            .service(web::scope("/metrics").configure(metrics::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/metrics/summary")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
}

#[tokio::test]
async fn test_get_metric() {
    let metrics_service = Arc::new(MetricsService::new());
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(metrics_service.clone()))
            .service(web::scope("/metrics").configure(metrics::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/metrics/cqrs_command_count")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May return 200 or 404 depending on metric existence
    assert!(resp.status().is_success() || resp.status().as_u16() == 404);
}

#[tokio::test]
async fn test_health_with_metrics() {
    let metrics_service = Arc::new(MetricsService::new());
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(metrics_service.clone()))
            .service(web::scope("/metrics").configure(metrics::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/metrics/health")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["status"], "healthy");
    assert!(body.get("metrics").is_some());
}

