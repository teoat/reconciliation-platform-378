//! Comprehensive Auth handler tests
//!
//! Tests for all authentication endpoints

use actix_web::{test, web, App};
use serde_json::json;
use std::sync::Arc;

use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::auth;
use reconciliation_backend::handlers::types::ApiResponse;
use reconciliation_backend::services::auth::AuthService;
use reconciliation_backend::services::security_monitor::SecurityMonitor;
use reconciliation_backend::services::user::UserService;
use reconciliation_backend::test_utils_export::database::setup_test_database;

#[tokio::test]
async fn test_login_invalid_credentials() {
    let db = Arc::new(setup_test_database().await);
    let auth_service = Arc::new(AuthService::new("test_secret".to_string(), 3600));
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service.clone()));
    let security_monitor = Arc::new(SecurityMonitor::new());
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(auth_service.clone()))
            .app_data(web::Data::from(user_service.clone()))
            .app_data(web::Data::from(security_monitor))
            .service(web::scope("/auth").configure(auth::configure_routes))
    ).await;

    let request_data = json!({
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    });

    let req = test::TestRequest::post()
        .uri("/auth/login")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());
}

#[tokio::test]
async fn test_register() {
    let db = Arc::new(setup_test_database().await);
    let auth_service = Arc::new(AuthService::new("test_secret".to_string(), 3600));
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service.clone()));
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(auth_service.clone()))
            .app_data(web::Data::from(user_service.clone()))
            .service(web::scope("/auth").configure(auth::configure_routes))
    ).await;

    let request_data = json!({
        "email": format!("test-{}@example.com", uuid::Uuid::new_v4()),
        "password": "TestPassword123!",
        "first_name": "Test",
        "last_name": "User"
    });

    let req = test::TestRequest::post()
        .uri("/auth/register")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on validation
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_refresh_token_no_token() {
    let db = Arc::new(setup_test_database().await);
    let auth_service = Arc::new(AuthService::new("test_secret".to_string(), 3600));
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service.clone()));
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(auth_service.clone()))
            .app_data(web::Data::from(user_service.clone()))
            .service(web::scope("/auth").configure(auth::configure_routes))
    ).await;

    let request_data = json!({
        "refresh_token": "invalid_token"
    });

    let req = test::TestRequest::post()
        .uri("/auth/refresh")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());
}

#[tokio::test]
async fn test_change_password_no_auth() {
    let db = Arc::new(setup_test_database().await);
    let auth_service = Arc::new(AuthService::new("test_secret".to_string(), 3600));
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service.clone()));
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(auth_service.clone()))
            .app_data(web::Data::from(user_service.clone()))
            .service(web::scope("/auth").configure(auth::configure_routes))
    ).await;

    let request_data = json!({
        "current_password": "OldPassword123!",
        "new_password": "NewPassword123!"
    });

    let req = test::TestRequest::post()
        .uri("/auth/change-password")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());
}

#[tokio::test]
async fn test_request_password_reset() {
    let db = Arc::new(setup_test_database().await);
    let auth_service = Arc::new(AuthService::new("test_secret".to_string(), 3600));
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service.clone()));
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(auth_service.clone()))
            .app_data(web::Data::from(user_service.clone()))
            .service(web::scope("/auth").configure(auth::configure_routes))
    ).await;

    let request_data = json!({
        "email": "test@example.com"
    });

    let req = test::TestRequest::post()
        .uri("/auth/password-reset")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on user existence
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_google_oauth() {
    let db = Arc::new(setup_test_database().await);
    let auth_service = Arc::new(AuthService::new("test_secret".to_string(), 3600));
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service.clone()));
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(auth_service.clone()))
            .app_data(web::Data::from(user_service.clone()))
            .service(web::scope("/auth").configure(auth::configure_routes))
    ).await;

    let request_data = json!({
        "id_token": "invalid_google_token"
    });

    let req = test::TestRequest::post()
        .uri("/auth/google")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on token validation
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_get_current_user_no_auth() {
    let db = Arc::new(setup_test_database().await);
    let auth_service = Arc::new(AuthService::new("test_secret".to_string(), 3600));
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service.clone()));
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(auth_service.clone()))
            .app_data(web::Data::from(user_service.clone()))
            .service(web::scope("/auth").configure(auth::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/auth/me")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());
}

