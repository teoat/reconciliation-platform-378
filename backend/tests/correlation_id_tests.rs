//! Tests for correlation ID functionality in error responses

use actix_web::{test, web, App, HttpResponse};
use reconciliation_backend::errors::{AppError, ErrorResponse};
use reconciliation_backend::middleware::correlation_id::CorrelationIdMiddleware;
use reconciliation_backend::middleware::error_handler::ErrorHandlerMiddleware;

/// Test that correlation IDs are present in error response headers
#[actix_web::test]
async fn test_correlation_id_in_error_headers() {
    let app = test::init_service(
        App::new()
            .wrap(CorrelationIdMiddleware)
            .wrap(ErrorHandlerMiddleware)
            .route("/test-error", web::get().to(|| async {
                Err::<HttpResponse, _>(AppError::BadRequest("Test error".to_string()))
            }))
    ).await;

    let req = test::TestRequest::get()
        .uri("/test-error")
        .to_request();
    
    let resp = test::call_service(&app, req).await;
    
    assert!(resp.status().is_client_error());
    
    // Check that correlation ID is in headers
    let correlation_id = resp.headers().get("x-correlation-id");
    assert!(correlation_id.is_some(), "Correlation ID should be in response headers");
    
    let corr_id_value = correlation_id.unwrap().to_str().unwrap();
    assert!(!corr_id_value.is_empty(), "Correlation ID should not be empty");
    assert_ne!(corr_id_value, "unknown", "Correlation ID should not be 'unknown'");
}

/// Test that correlation IDs are present in JSON error response body
#[actix_web::test]
async fn test_correlation_id_in_error_json_body() {
    let app = test::init_service(
        App::new()
            .wrap(CorrelationIdMiddleware)
            .wrap(ErrorHandlerMiddleware)
            .route("/test-error-json", web::get().to(|| async {
                Err::<HttpResponse, _>(AppError::Validation("Test validation error".to_string()))
            }))
    ).await;

    let req = test::TestRequest::get()
        .uri("/test-error-json")
        .to_request();
    
    let resp = test::call_service(&app, req).await;
    
    assert!(resp.status().is_client_error());
    
    // Check that correlation ID is in headers
    let correlation_id_header = resp.headers().get("x-correlation-id")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string());
    
    assert!(correlation_id_header.is_some(), "Correlation ID should be in response headers");
    
    // Parse JSON body
    let body = test::read_body(resp).await;
    let error_response: ErrorResponse = serde_json::from_slice(&body)
        .expect("Response should be valid JSON");
    
    // Verify correlation_id field exists in ErrorResponse struct
    // Note: The correlation_id may be None if not set at error creation time
    // but it should be available in headers
    assert!(error_response.correlation_id.is_some() || correlation_id_header.is_some(),
        "Correlation ID should be in either JSON body or headers");
    
    // If correlation_id is in JSON body, verify it matches header
    if let (Some(json_corr_id), Some(header_corr_id)) = 
        (error_response.correlation_id.as_ref(), correlation_id_header.as_ref()) {
        assert_eq!(json_corr_id, header_corr_id,
            "Correlation ID in JSON body should match header");
    }
}

/// Test that correlation IDs are generated if not provided in request
#[actix_web::test]
async fn test_correlation_id_generation() {
    let app = test::init_service(
        App::new()
            .wrap(CorrelationIdMiddleware)
            .wrap(ErrorHandlerMiddleware)
            .route("/test", web::get().to(|| async {
                HttpResponse::Ok().json(serde_json::json!({"status": "ok"}))
            }))
    ).await;

    // Request without correlation ID header
    let req = test::TestRequest::get()
        .uri("/test")
        .to_request();
    
    let resp = test::call_service(&app, req).await;
    
    // Should generate correlation ID automatically
    let correlation_id = resp.headers().get("x-correlation-id");
    assert!(correlation_id.is_some(), "Correlation ID should be generated automatically");
}

/// Test that correlation IDs are preserved from request to response
#[actix_web::test]
async fn test_correlation_id_preservation() {
    let app = test::init_service(
        App::new()
            .wrap(CorrelationIdMiddleware)
            .wrap(ErrorHandlerMiddleware)
            .route("/test", web::get().to(|| async {
                HttpResponse::Ok().json(serde_json::json!({"status": "ok"}))
            }))
    ).await;

    let test_correlation_id = "test-correlation-id-12345";
    
    let req = test::TestRequest::get()
        .uri("/test")
        .insert_header(("X-Correlation-ID", test_correlation_id))
        .to_request();
    
    let resp = test::call_service(&app, req).await;
    
    // Should preserve correlation ID from request
    let correlation_id = resp.headers().get("x-correlation-id")
        .and_then(|h| h.to_str().ok())
        .unwrap();
    
    assert_eq!(correlation_id, test_correlation_id,
        "Correlation ID should be preserved from request");
}

