//! Security handler tests
//!
//! Comprehensive tests for security endpoints

use actix_web::{test, web, App};
use serde_json::json;

use reconciliation_backend::handlers::security;

#[tokio::test]
async fn test_post_csp_report() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/security").configure(security::configure_routes))
    ).await;

    let request_data = json!({
        "csp-report": {
            "document-uri": "https://example.com/page",
            "violated-directive": "script-src",
            "blocked-uri": "https://evil.com/script.js",
            "line-number": 42,
            "column-number": 10
        }
    });

    let req = test::TestRequest::post()
        .uri("/security/csp-report")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    // CSP reports should return 204 No Content
    assert_eq!(resp.status().as_u16(), 204);
}

#[tokio::test]
async fn test_post_csp_report_minimal() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/security").configure(security::configure_routes))
    ).await;

    let request_data = json!({
        "csp-report": {
            "violated-directive": "script-src"
        }
    });

    let req = test::TestRequest::post()
        .uri("/security/csp-report")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status().as_u16(), 204);
}

