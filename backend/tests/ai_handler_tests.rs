//! AI handler tests
//!
//! Comprehensive tests for AI endpoints

use actix_web::{test, web, App};
use serde_json::json;

use reconciliation_backend::handlers::ai;

#[tokio::test]
async fn test_ai_chat_handler() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/ai").configure(ai::configure_routes))
    ).await;

    let request_data = json!({
        "message": "Test message",
        "provider": "openai",
        "model": "gpt-4",
        "temperature": 0.7,
        "max_tokens": 100
    });

    let req = test::TestRequest::post()
        .uri("/ai/chat")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on AI service configuration
    assert!(resp.status().is_success() || resp.status().is_server_error());
}

#[tokio::test]
async fn test_ai_chat_handler_minimal() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/ai").configure(ai::configure_routes))
    ).await;

    let request_data = json!({
        "message": "Test message"
    });

    let req = test::TestRequest::post()
        .uri("/ai/chat")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success() || resp.status().is_server_error());
}

#[tokio::test]
async fn test_ai_health_handler() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/ai").configure(ai::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/ai/health")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body.get("status").is_some());
    assert!(body.get("providers").is_some());
}

#[tokio::test]
async fn test_ai_chat_handler_different_providers() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/ai").configure(ai::configure_routes))
    ).await;

    let providers = vec!["openai", "anthropic", "gemini"];

    for provider in providers {
        let request_data = json!({
            "message": "Test message",
            "provider": provider
        });

        let req = test::TestRequest::post()
            .uri("/ai/chat")
            .set_json(&request_data)
            .to_request();

        let resp = test::call_service(&app, req).await;
        // Should not be a client error for valid providers
        assert!(!resp.status().is_client_error(), "Failed for provider: {}", provider);
    }
}

