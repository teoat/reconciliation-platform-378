//! Security events handler tests
//!
//! Comprehensive tests for security events endpoints

use actix_web::{test, web, App};

use reconciliation_backend::handlers::security_events;
use reconciliation_backend::handlers::types::ApiResponse;
use reconciliation_backend::services::security_event_logging::SecurityEventLoggingService;

#[tokio::test]
async fn test_get_security_events() {
    let service = SecurityEventLoggingService::new();
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(service))
            .service(web::scope("/security").configure(security_events::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/security/events")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
    assert!(body.success);
    assert!(body.data.is_some());
}

#[tokio::test]
async fn test_get_security_events_with_filters() {
    let service = SecurityEventLoggingService::new();
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(service))
            .service(web::scope("/security").configure(security_events::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/security/events?event_type=LoginAttempt&severity=High&limit=10")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
    assert!(body.success);
    assert!(body.data.is_some());
}

#[tokio::test]
async fn test_get_security_statistics() {
    let service = SecurityEventLoggingService::new();
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(service))
            .service(web::scope("/security").configure(security_events::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/security/events/statistics")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
    assert!(body.success);
    assert!(body.data.is_some());
}

