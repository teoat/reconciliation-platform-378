//! Helpers handler tests
//!
//! Comprehensive tests for helper functions

use actix_web::{test, App, HttpRequest};
use reconciliation_backend::handlers::helpers;

#[test]
fn test_mask_email_normal() {
    let email = "user@example.com";
    let masked = helpers::mask_email(email);
    assert_eq!(masked, "us***@example.com");
}

#[test]
fn test_mask_email_short_local() {
    let email = "ab@example.com";
    let masked = helpers::mask_email(email);
    assert_eq!(masked, "***@example.com");
}

#[test]
fn test_mask_email_no_at() {
    let email = "invalid-email";
    let masked = helpers::mask_email(email);
    assert_eq!(masked, "***@***");
}

#[test]
fn test_mask_email_single_char() {
    let email = "a@example.com";
    let masked = helpers::mask_email(email);
    assert_eq!(masked, "***@example.com");
}

#[tokio::test]
async fn test_get_client_ip_x_forwarded_for() {
    let app = test::init_service(App::new()).await;
    
    let req = test::TestRequest::get()
        .uri("/")
        .insert_header(("X-Forwarded-For", "192.168.1.1, 10.0.0.1"))
        .to_request();

    let ip = helpers::get_client_ip(req.request());
    assert_eq!(ip, "192.168.1.1");
}

#[tokio::test]
async fn test_get_client_ip_x_real_ip() {
    let app = test::init_service(App::new()).await;
    
    let req = test::TestRequest::get()
        .uri("/")
        .insert_header(("X-Real-IP", "10.0.0.1"))
        .to_request();

    let ip = helpers::get_client_ip(req.request());
    assert_eq!(ip, "10.0.0.1");
}

#[tokio::test]
async fn test_get_client_ip_fallback() {
    let app = test::init_service(App::new()).await;
    
    let req = test::TestRequest::get()
        .uri("/")
        .to_request();

    let ip = helpers::get_client_ip(req.request());
    // Should not panic, may be "unknown" or actual IP
    assert!(!ip.is_empty());
}

#[tokio::test]
async fn test_get_user_agent() {
    let app = test::init_service(App::new()).await;
    
    let req = test::TestRequest::get()
        .uri("/")
        .insert_header(("User-Agent", "Mozilla/5.0"))
        .to_request();

    let ua = helpers::get_user_agent(req.request());
    assert_eq!(ua, "Mozilla/5.0");
}

#[tokio::test]
async fn test_get_user_agent_missing() {
    let app = test::init_service(App::new()).await;
    
    let req = test::TestRequest::get()
        .uri("/")
        .to_request();

    let ua = helpers::get_user_agent(req.request());
    assert_eq!(ua, "unknown");
}

#[test]
fn test_get_memory_usage() {
    let usage = helpers::get_memory_usage();
    assert!(usage >= 0.0);
    assert!(usage <= 100.0);
}

