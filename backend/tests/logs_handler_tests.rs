//! Logs handler tests
//!
//! Comprehensive tests for logging endpoints

use actix_web::{test, web, App};
use serde_json::json;

use reconciliation_backend::handlers::logs;
use reconciliation_backend::handlers::types::ApiResponse;

#[tokio::test]
async fn test_post_logs_success() {
    let app = test::init_service(
        App::new()
            .route("/api/logs", web::post().to(logs::post_logs))
    ).await;

    let logs_data = json!({
        "logs": [
            {
                "level": "info",
                "message": "Test log message",
                "timestamp": "2024-01-01T00:00:00Z"
            }
        ]
    });

    let req = test::TestRequest::post()
        .uri("/api/logs")
        .set_json(&logs_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
    assert!(body.success);
    assert!(body.data.is_some());
    
    let data = body.data.unwrap();
    assert_eq!(data["received"], 1);
    assert_eq!(data["processed"], 1);
}

#[tokio::test]
async fn test_post_logs_multiple_entries() {
    let app = test::init_service(
        App::new()
            .route("/api/logs", web::post().to(logs::post_logs))
    ).await;

    let logs_data = json!({
        "logs": [
            {
                "level": "error",
                "message": "Error log 1"
            },
            {
                "level": "warn",
                "message": "Warning log 2"
            },
            {
                "level": "info",
                "message": "Info log 3"
            }
        ]
    });

    let req = test::TestRequest::post()
        .uri("/api/logs")
        .set_json(&logs_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
    assert!(body.success);
    assert_eq!(body.data.unwrap()["received"], 3);
}

#[tokio::test]
async fn test_post_logs_empty_array() {
    let app = test::init_service(
        App::new()
            .route("/api/logs", web::post().to(logs::post_logs))
    ).await;

    let logs_data = json!({
        "logs": []
    });

    let req = test::TestRequest::post()
        .uri("/api/logs")
        .set_json(&logs_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status().as_u16(), 422); // Validation error
}

#[tokio::test]
async fn test_post_logs_too_many_entries() {
    let app = test::init_service(
        App::new()
            .route("/api/logs", web::post().to(logs::post_logs))
    ).await;

    let logs: Vec<serde_json::Value> = (0..101).map(|i| {
        json!({
            "level": "info",
            "message": format!("Log message {}", i)
        })
    }).collect();

    let logs_data = json!({
        "logs": logs
    });

    let req = test::TestRequest::post()
        .uri("/api/logs")
        .set_json(&logs_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status().as_u16(), 422); // Validation error
}

#[tokio::test]
async fn test_post_logs_with_metadata() {
    let app = test::init_service(
        App::new()
            .route("/api/logs", web::post().to(logs::post_logs))
    ).await;

    let logs_data = json!({
        "logs": [
            {
                "level": "error",
                "message": "Error with metadata",
                "metadata": {
                    "userId": "123",
                    "action": "login",
                    "ip": "192.168.1.1"
                }
            }
        ]
    });

    let req = test::TestRequest::post()
        .uri("/api/logs")
        .set_json(&logs_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
}

#[tokio::test]
async fn test_post_logs_different_levels() {
    let app = test::init_service(
        App::new()
            .route("/api/logs", web::post().to(logs::post_logs))
    ).await;

    let levels = vec!["error", "warn", "info", "debug", "trace", "critical", "warning"];
    
    for level in levels {
        let logs_data = json!({
            "logs": [
                {
                    "level": level,
                    "message": format!("Test {} log", level)
                }
            ]
        });

        let req = test::TestRequest::post()
            .uri("/api/logs")
            .set_json(&logs_data)
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success(), "Failed for level: {}", level);
    }
}

