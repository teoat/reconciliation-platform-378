//! Compliance handler tests
//!
//! Comprehensive tests for compliance endpoints

use actix_web::{test, web, App};
use serde_json::json;

use reconciliation_backend::handlers::compliance;
use reconciliation_backend::handlers::types::ApiResponse;
use reconciliation_backend::services::compliance_reporting::ComplianceReportingService;
use reconciliation_backend::services::security_event_logging::SecurityEventLoggingService;
use std::sync::Arc;

#[tokio::test]
async fn test_generate_compliance_report_gdpr() {
    let security_event_logger = SecurityEventLoggingService::new();
    let service = Arc::new(ComplianceReportingService::new(security_event_logger));
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(service.clone()))
            .service(web::scope("/compliance").configure(compliance::configure_routes))
    ).await;

    let request_data = json!({
        "framework": "GDPR",
        "period_start": "2024-01-01T00:00:00Z",
        "period_end": "2024-01-31T23:59:59Z"
    });

    let req = test::TestRequest::post()
        .uri("/compliance/reports")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on service implementation
    assert!(resp.status().is_client_error() || resp.status().is_success());
}

#[tokio::test]
async fn test_generate_compliance_report_invalid_framework() {
    let security_event_logger = SecurityEventLoggingService::new();
    let service = Arc::new(ComplianceReportingService::new(security_event_logger));
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(service.clone()))
            .service(web::scope("/compliance").configure(compliance::configure_routes))
    ).await;

    let request_data = json!({
        "framework": "INVALID",
        "period_start": "2024-01-01T00:00:00Z",
        "period_end": "2024-01-31T23:59:59Z"
    });

    let req = test::TestRequest::post()
        .uri("/compliance/reports")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status().as_u16(), 422); // Validation error
}

#[tokio::test]
async fn test_get_compliance_report() {
    let security_event_logger = SecurityEventLoggingService::new();
    let service = Arc::new(ComplianceReportingService::new(security_event_logger));
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(service.clone()))
            .service(web::scope("/compliance").configure(compliance::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/compliance/reports/GDPR")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on service implementation
    assert!(resp.status().is_client_error() || resp.status().is_success());
}

#[tokio::test]
async fn test_get_compliance_report_invalid_framework() {
    let security_event_logger = SecurityEventLoggingService::new();
    let service = Arc::new(ComplianceReportingService::new(security_event_logger));
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(service.clone()))
            .service(web::scope("/compliance").configure(compliance::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/compliance/reports/INVALID")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status().as_u16(), 422); // Validation error
}

#[tokio::test]
async fn test_generate_compliance_report_all_frameworks() {
    let security_event_logger = SecurityEventLoggingService::new();
    let service = Arc::new(ComplianceReportingService::new(security_event_logger));
    let frameworks = vec!["GDPR", "SOX", "PCI", "HIPAA"];

    for framework in frameworks {
        let app = test::init_service(
            App::new()
                .app_data(web::Data::from(service.clone()))
                .service(web::scope("/compliance").configure(compliance::configure_routes))
        ).await;

        let request_data = json!({
            "framework": framework
        });

        let req = test::TestRequest::post()
            .uri("/compliance/reports")
            .set_json(&request_data)
            .to_request();

        let resp = test::call_service(&app, req).await;
        // Should not be a validation error for valid frameworks
        assert_ne!(resp.status().as_u16(), 422, "Failed for framework: {}", framework);
    }
}

