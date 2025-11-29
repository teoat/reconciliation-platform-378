//! Health handler tests
//!
//! Comprehensive tests for health check endpoints

use actix_web::{test, web, App};
use std::sync::Arc;

use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::health;
use reconciliation_backend::handlers::types::ApiResponse;
use reconciliation_backend::services::cache::MultiLevelCache;
use reconciliation_backend::services::resilience::ResilienceManager;
use reconciliation_backend::test_utils_export::database::setup_test_database;

#[tokio::test]
async fn test_health_check_success() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/health").configure(health::configure_health_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/health/health")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
    assert!(body.success);
    assert!(body.data.is_some());
    
    let data = body.data.unwrap();
    assert_eq!(data["status"], "healthy");
    assert!(data.get("timestamp").is_some());
    assert!(data.get("version").is_some());
}

#[tokio::test]
async fn test_get_resilience_status() {
    let db = setup_test_database().await;
    let cache = Arc::new(MultiLevelCache::new());
    let resilience = Arc::new(ResilienceManager::new());

    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(resilience.clone()))
            .service(web::scope("/health").configure(health::configure_health_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/health/resilience")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
    assert!(body.success);
    assert!(body.data.is_some());
    
    let data = body.data.unwrap();
    assert!(data.get("database").is_some());
    assert!(data.get("cache").is_some());
    assert!(data.get("api").is_some());
}

#[tokio::test]
async fn test_get_dependencies_status_healthy() {
    let db = setup_test_database().await;
    let cache = Arc::new(MultiLevelCache::new());

    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(db))
            .app_data(web::Data::from(cache.clone()))
            .service(web::scope("/health").configure(health::configure_health_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/health/dependencies")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
    assert!(body.success);
    assert!(body.data.is_some());
    
    let data = body.data.unwrap();
    assert!(data.get("database").is_some());
    assert!(data.get("cache").is_some());
}

#[tokio::test]
async fn test_get_metrics_endpoint() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/health").configure(health::configure_health_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/health/metrics")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
    assert_eq!(resp.headers().get("content-type").unwrap(), "text/plain; version=0.0.4");
}

