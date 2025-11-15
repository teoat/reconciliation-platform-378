//! Handler tests for authentication endpoints
//! 
//! Tests the authentication handlers including login, register, and token refresh.

use actix_web::{test, web, App, HttpResponse};
use std::sync::Arc;
use serde_json::json;

use reconciliation_backend::handlers::auth::{login, register, refresh_token};
use reconciliation_backend::services::auth::{AuthService, LoginRequest, RegisterRequest};
use reconciliation_backend::services::user::UserService;
use reconciliation_backend::services::security_monitor::{SecurityMonitor, AnomalyDetectionConfig};
use reconciliation_backend::database::Database;
use reconciliation_backend::test_utils::setup_test_database;

/// Test authentication handlers
#[cfg(test)]
mod auth_handler_tests {
    use super::*;

    #[tokio::test]
    async fn test_login_handler_success() {
        let (db, _temp_dir) = setup_test_database().await;
        let auth_service = Arc::new(AuthService::new("test_secret".to_string(), 3600));
        let user_service = web::Data::new(Arc::new(UserService::new(Arc::clone(&db), auth_service.clone())));
        
        // Create test user first
        let create_request = reconciliation_backend::services::user::CreateUserRequest {
            email: "test@example.com".to_string(),
            password: "TestPassword123!".to_string(),
            first_name: "Test".to_string(),
            last_name: "User".to_string(),
            role: Some("user".to_string()),
        };
        
        user_service.create_user(create_request).await.unwrap();

        // Test login
        let login_request = LoginRequest {
            email: "test@example.com".to_string(),
            password: "TestPassword123!".to_string(),
        };

        let req = test::TestRequest::post()
            .uri("/api/auth/login")
            .set_json(&login_request)
            .to_request();

        // Create app with handlers
        let app = test::init_service(
            App::new()
                .app_data(auth_service.clone())
                .app_data(user_service.clone())
                .route("/api/auth/login", web::post().to(login))
        ).await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
        
        let body: serde_json::Value = test::read_body_json(resp).await;
        assert!(body["token"].is_string());
        assert_eq!(body["user"]["email"], "test@example.com");
    }

    #[tokio::test]
    async fn test_login_handler_invalid_credentials() {
        let (db, _temp_dir) = setup_test_database().await;
        let auth_service = Arc::new(AuthService::new("test_secret".to_string(), 3600));
        let user_service = web::Data::new(Arc::new(UserService::new(Arc::clone(&db), auth_service.clone())));
        
        // Create test user
        let create_request = reconciliation_backend::services::user::CreateUserRequest {
            email: "test@example.com".to_string(),
            password: "TestPassword123!".to_string(),
            first_name: "Test".to_string(),
            last_name: "User".to_string(),
            role: Some("user".to_string()),
        };
        
        user_service.create_user(create_request).await.unwrap();

        // Test login with wrong password
        let login_request = LoginRequest {
            email: "test@example.com".to_string(),
            password: "WrongPassword".to_string(),
        };

        let req = test::TestRequest::post()
            .uri("/api/auth/login")
            .set_json(&login_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(auth_service.clone())
                .app_data(user_service.clone())
                .route("/api/auth/login", web::post().to(login))
        ).await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_login_handler_with_security_monitoring() {
        let (db, _temp_dir) = setup_test_database().await;
        let auth_service = Arc::new(AuthService::new("test_secret".to_string(), 3600));
        let user_service = web::Data::new(Arc::new(UserService::new(Arc::clone(&db), auth_service.clone())));
        let security_monitor = web::Data::new(Arc::new(SecurityMonitor::new(AnomalyDetectionConfig::default())));

        // Test login with security monitoring
        let login_request = LoginRequest {
            email: "nonexistent@example.com".to_string(),
            password: "TestPassword123!".to_string(),
        };

        let req = test::TestRequest::post()
            .uri("/api/auth/login")
            .set_json(&login_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(auth_service.clone())
                .app_data(user_service.clone())
                .app_data(security_monitor.clone())
                .route("/api/auth/login", web::post().to(login))
        ).await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error());

        // Verify security event was recorded
        let events = security_monitor.get_recent_events(10).await;
        assert!(!events.is_empty());
    }

    #[tokio::test]
    async fn test_register_handler_success() {
        let (db, _temp_dir) = setup_test_database().await;
        let auth_service = web::Data::new(Arc::new(AuthService::new("test_secret".to_string(), 3600)));
        let user_service = web::Data::new(Arc::new(UserService::new(Arc::clone(&db), auth_service.as_ref().clone())));

        let register_request = RegisterRequest {
            email: "newuser@example.com".to_string(),
            password: "NewPassword123!".to_string(),
            first_name: "New".to_string(),
            last_name: "User".to_string(),
            role: Some("user".to_string()),
        };

        let req = test::TestRequest::post()
            .uri("/api/auth/register")
            .set_json(&register_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(auth_service.clone())
                .app_data(user_service.clone())
                .route("/api/auth/register", web::post().to(register))
        ).await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success() || resp.status().as_u16() == 201);
        
        let body: serde_json::Value = test::read_body_json(resp).await;
        assert!(body["token"].is_string());
        assert_eq!(body["user"]["email"], "newuser@example.com");
    }

    #[tokio::test]
    async fn test_register_handler_duplicate_email() {
        let (db, _temp_dir) = setup_test_database().await;
        let auth_service = web::Data::new(Arc::new(AuthService::new("test_secret".to_string(), 3600)));
        let user_service = web::Data::new(Arc::new(UserService::new(Arc::clone(&db), auth_service.as_ref().clone())));

        // Create user first
        let create_request = reconciliation_backend::services::user::CreateUserRequest {
            email: "existing@example.com".to_string(),
            password: "TestPassword123!".to_string(),
            first_name: "Existing".to_string(),
            last_name: "User".to_string(),
            role: Some("user".to_string()),
        };
        
        user_service.create_user(create_request).await.unwrap();

        // Try to register with same email
        let register_request = RegisterRequest {
            email: "existing@example.com".to_string(),
            password: "NewPassword123!".to_string(),
            first_name: "New".to_string(),
            last_name: "User".to_string(),
            role: Some("user".to_string()),
        };

        let req = test::TestRequest::post()
            .uri("/api/auth/register")
            .set_json(&register_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(auth_service.clone())
                .app_data(user_service.clone())
                .route("/api/auth/register", web::post().to(register))
        ).await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error());
    }
}

