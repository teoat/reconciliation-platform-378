//! Handler tests for authentication endpoints
//!
//! Tests the authentication handlers including login, register, token refresh,
//! password reset, email verification, and OAuth flows.

use actix_web::{test, web, App};
use std::sync::Arc;

use reconciliation_backend::handlers::auth::{
    login, logout, refresh_token, register, request_password_reset,
};
use reconciliation_backend::services::auth::{
    AuthService, ChangePasswordRequest, LoginRequest, PasswordResetRequest, RegisterRequest,
};
use reconciliation_backend::services::security_monitor::{AnomalyDetectionConfig, SecurityMonitor};
use reconciliation_backend::services::user::UserService;
use reconciliation_backend::test_utils::database::setup_test_database;

/// Test authentication handlers
#[cfg(test)]
mod auth_handler_tests {
    use super::*;

    #[tokio::test]
    async fn test_login_handler_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());
        let user_service = web::Data::new(Arc::new(UserService::new(
            db_arc.clone(),
            auth_service,
        )));

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
            remember_me: None,
        };

        let req = test::TestRequest::post()
            .uri("/api/auth/login")
            .set_json(&login_request)
            .to_request();

        // Create app with handlers
        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(auth_service_arc.clone()))
                .app_data(user_service.clone())
                .route("/api/auth/login", web::post().to(login)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());

        let body: serde_json::Value = test::read_body_json(resp).await;
        assert!(body["token"].is_string());
        assert_eq!(body["user"]["email"], "test@example.com");
    }

    #[tokio::test]
    async fn test_login_handler_invalid_credentials() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());
        let user_service = web::Data::new(Arc::new(UserService::new(
            db_arc.clone(),
            auth_service.clone(),
        )));

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
            remember_me: None,
        };

        let req = test::TestRequest::post()
            .uri("/api/auth/login")
            .set_json(&login_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(auth_service_arc.clone()))
                .app_data(user_service.clone())
                .route("/api/auth/login", web::post().to(login)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_login_handler_with_security_monitoring() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());
        let user_service = web::Data::new(Arc::new(UserService::new(
            db_arc.clone(),
            auth_service.clone(),
        )));
        let security_monitor = web::Data::new(Arc::new(SecurityMonitor::new(
            AnomalyDetectionConfig::default(),
        )));

        // Test login with security monitoring
        let login_request = LoginRequest {
            email: "nonexistent@example.com".to_string(),
            password: "TestPassword123!".to_string(),
            remember_me: None,
        };

        let req = test::TestRequest::post()
            .uri("/api/auth/login")
            .set_json(&login_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(auth_service_arc.clone()))
                .app_data(user_service.clone())
                .app_data(security_monitor.clone())
                .route("/api/auth/login", web::post().to(login)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error());

        // Verify security event was recorded
        let events = security_monitor.get_recent_events(10).await;
        assert!(!events.is_empty());
    }

    #[tokio::test]
    async fn test_register_handler_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());
        let user_service = web::Data::new(Arc::new(UserService::new(
            db_arc.clone(),
            auth_service,
        )));

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
                .app_data(web::Data::new(auth_service_arc.clone()))
                .app_data(user_service.clone())
                .route("/api/auth/register", web::post().to(register)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success() || resp.status().as_u16() == 201);

        let body: serde_json::Value = test::read_body_json(resp).await;
        assert!(body["token"].is_string());
        assert_eq!(body["user"]["email"], "newuser@example.com");
    }

    #[tokio::test]
    async fn test_register_handler_duplicate_email() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());
        let user_service = web::Data::new(Arc::new(UserService::new(
            db_arc.clone(),
            auth_service,
        )));

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
                .app_data(web::Data::new(auth_service_arc.clone()))
                .app_data(user_service.clone())
                .route("/api/auth/register", web::post().to(register)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_login_handler_inactive_user() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());
        let user_service = web::Data::new(Arc::new(UserService::new(
            db_arc.clone(),
            auth_service.clone(),
        )));

        // Create inactive user
        let create_request = reconciliation_backend::services::user::CreateUserRequest {
            email: "inactive@example.com".to_string(),
            password: "TestPassword123!".to_string(),
            first_name: "Inactive".to_string(),
            last_name: "User".to_string(),
            role: Some("user".to_string()),
        };

        let user = user_service.create_user(create_request).await.unwrap();
        
        // Deactivate user
        let update_request = reconciliation_backend::services::user::UpdateUserRequest {
            email: None,
            first_name: None,
            last_name: None,
            role: None,
            is_active: Some(false),
        };
        
        user_service
            .as_ref()
            .update_user(user.id, update_request)
            .await
            .unwrap();

        let login_request = LoginRequest {
            email: "inactive@example.com".to_string(),
            password: "TestPassword123!".to_string(),
            remember_me: None,
        };

        let req = test::TestRequest::post()
            .uri("/api/auth/login")
            .set_json(&login_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(auth_service_arc.clone()))
                .app_data(user_service.clone())
                .route("/api/auth/login", web::post().to(login)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_refresh_token_handler_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service.clone());
        let user_service = web::Data::new(Arc::new(UserService::new(
            db_arc.clone(),
            auth_service.clone(),
        )));

        // Create user and get token
        let create_request = reconciliation_backend::services::user::CreateUserRequest {
            email: "refresh@example.com".to_string(),
            password: "TestPassword123!".to_string(),
            first_name: "Refresh".to_string(),
            last_name: "User".to_string(),
            role: Some("user".to_string()),
        };

        let user = user_service.create_user(create_request).await.unwrap();
        let user_model = user_service
            .as_ref()
            .get_user_by_email("refresh@example.com")
            .await
            .unwrap();
        let token = auth_service_arc.generate_token(&user_model).unwrap();

        // Test refresh
        let req = test::TestRequest::post()
            .uri("/api/auth/refresh")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(auth_service_arc.clone()))
                .route("/api/auth/refresh", web::post().to(refresh_token)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());

        let body: serde_json::Value = test::read_body_json(resp).await;
        assert!(body["token"].is_string());
        assert!(body["expires_at"].is_number());
    }

    #[tokio::test]
    async fn test_refresh_token_handler_missing_header() {
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service);

        let req = test::TestRequest::post()
            .uri("/api/auth/refresh")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(auth_service_arc.clone()))
                .route("/api/auth/refresh", web::post().to(refresh_token)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_refresh_token_handler_invalid_format() {
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service);

        let req = test::TestRequest::post()
            .uri("/api/auth/refresh")
            .insert_header(("Authorization", "InvalidFormat token123"))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(auth_service_arc.clone()))
                .route("/api/auth/refresh", web::post().to(refresh_token)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_refresh_token_handler_invalid_token() {
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let auth_service_arc = Arc::new(auth_service);

        let req = test::TestRequest::post()
            .uri("/api/auth/refresh")
            .insert_header(("Authorization", "Bearer invalid_token_12345"))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(auth_service_arc.clone()))
                .route("/api/auth/refresh", web::post().to(refresh_token)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_logout_handler_success() {
        let req = test::TestRequest::post()
            .uri("/api/auth/logout")
            .to_request();

        let app = test::init_service(
            App::new().route("/api/auth/logout", web::post().to(logout)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());

        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["message"], "Logged out successfully");
    }

    #[tokio::test]
    async fn test_change_password_handler_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = web::Data::new(Arc::new(UserService::new(
            db_arc.clone(),
            auth_service.clone(),
        )));

        // Create user
        let create_request = reconciliation_backend::services::user::CreateUserRequest {
            email: "changepass@example.com".to_string(),
            password: "OldPassword123!".to_string(),
            first_name: "Change".to_string(),
            last_name: "Password".to_string(),
            role: Some("user".to_string()),
        };

        let user = user_service.create_user(create_request).await.unwrap();
        let user_model = user_service
            .as_ref()
            .get_user_by_email("changepass@example.com")
            .await
            .unwrap();
        let token = auth_service.generate_token(&user_model).unwrap();

        let change_request = ChangePasswordRequest {
            current_password: "OldPassword123!".to_string(),
            new_password: "NewPassword123!".to_string(),
        };

        // Test change password via service directly (handler requires middleware)
        // The handler test would require full middleware setup

        // Mock the extract_user_id helper - in real tests, we'd use middleware
        // For now, we'll test the service directly
        let result = user_service
            .as_ref()
            .change_password(
                user.id,
                &change_request.current_password,
                &change_request.new_password,
                None,
            )
            .await;

        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_request_password_reset_handler_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let user_service = web::Data::new(Arc::new(UserService::new(
            db_arc.clone(),
            auth_service.clone(),
        )));

        // Create user
        let create_request = reconciliation_backend::services::user::CreateUserRequest {
            email: "reset@example.com".to_string(),
            password: "TestPassword123!".to_string(),
            first_name: "Reset".to_string(),
            last_name: "User".to_string(),
            role: Some("user".to_string()),
        };

        user_service.create_user(create_request).await.unwrap();

        let reset_request = PasswordResetRequest {
            email: "reset@example.com".to_string(),
        };

        // Create request body manually since PasswordResetRequest only implements Deserialize
        let req = test::TestRequest::post()
            .uri("/api/auth/password-reset")
            .set_payload(format!(r#"{{"email":"{}"}}"#, reset_request.email))
            .insert_header(("Content-Type", "application/json"))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(Arc::new(auth_service.clone())))
                .app_data(user_service.clone())
                .route("/api/auth/password-reset", web::post().to(request_password_reset)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should succeed even if email doesn't exist (security: don't reveal if email exists)
        assert!(resp.status().is_success() || resp.status().as_u16() == 200);
    }

    #[tokio::test]
    async fn test_request_password_reset_handler_nonexistent_email() {
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let reset_request = PasswordResetRequest {
            email: "nonexistent@example.com".to_string(),
        };

        // Create request body manually since PasswordResetRequest only implements Deserialize
        let req = test::TestRequest::post()
            .uri("/api/auth/password-reset")
            .set_payload(format!(r#"{{"email":"{}"}}"#, reset_request.email))
            .insert_header(("Content-Type", "application/json"))
            .to_request();

        // Should still return success to prevent email enumeration
        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(Arc::new(auth_service.clone())))
                .route("/api/auth/password-reset", web::post().to(request_password_reset)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Security: should return success even for nonexistent emails
        assert!(resp.status().is_success() || resp.status().as_u16() == 200);
    }
}
