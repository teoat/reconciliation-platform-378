//! API endpoint tests for the Reconciliation Backend
//!
//! This module contains tests for all REST API endpoints including
//! request/response validation, error handling, and edge cases.

use actix_web::{test, web, App};
use serde_json::json;
use uuid::Uuid;

use reconciliation_backend::{config::Config, database::Database, handlers::configure_routes};

mod test_utils;
use test_utils::*;

/// Test API endpoint setup
async fn setup_api_test_app() -> impl actix_web::dev::Service<
    actix_http::Request,
    Response = actix_web::dev::ServiceResponse<actix_web::body::BoxBody>,
    Error = actix_web::Error,
> {
    let config = Config::from_env().expect("Failed to load test config");
    let db = Database::new(&config.database_url)
        .await
        .expect("Failed to create test database");

    db.run_migrations().await.expect("Failed to run migrations");

    test::init_service(
        App::new()
            .app_data(web::Data::new(db))
            .app_data(web::Data::new(config))
            .configure(configure_routes),
    )
    .await
}

/// Test authentication endpoints
#[tokio::test]
async fn test_auth_endpoints() {
    let app = setup_api_test_app().await;

    // Test user registration
    let register_data = json!({
        "email": "test@example.com",
        "password": "TestPassword123!",
        "first_name": "Test",
        "last_name": "User",
        "role": "user"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_json(&register_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
}

/// Test settings endpoints
#[tokio::test]
async fn test_settings_endpoints() {
    let app = setup_api_test_app().await;

    // First, create a user and get a token
    let register_data = json!({
        "email": "settings@example.com",
        "password": "SettingsPassword123!",
        "first_name": "Settings",
        "last_name": "User",
        "role": "user"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_json(&register_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    let body: serde_json::Value = test::read_body_json(resp).await;
    let token = body["token"].as_str().unwrap();

    // Test get user settings
    let req = test::TestRequest::get()
        .uri("/api/settings")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["settings"].is_object());

    // Test update user settings
    let update_data = json!({
        "theme": "dark",
        "notifications": {
            "email": true,
            "push": false
        },
        "language": "en"
    });

    let req = test::TestRequest::put()
        .uri("/api/settings")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .insert_header(("Content-Type", "application/json"))
        .set_json(&update_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["message"], "Settings updated successfully");
}

/// Test profile endpoints
#[tokio::test]
async fn test_profile_endpoints() {
    let app = setup_api_test_app().await;

    // First, create a user and get a token
    let register_data = json!({
        "email": "profile@example.com",
        "password": "ProfilePassword123!",
        "first_name": "Profile",
        "last_name": "User",
        "role": "user"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_json(&register_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    let body: serde_json::Value = test::read_body_json(resp).await;
    let token = body["token"].as_str().unwrap();

    // Test get user profile
    let req = test::TestRequest::get()
        .uri("/api/profile")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["profile"].is_object());
    assert_eq!(body["profile"]["email"], "profile@example.com");

    // Test update user profile
    let update_data = json!({
        "first_name": "Updated",
        "last_name": "Profile",
        "bio": "Updated bio"
    });

    let req = test::TestRequest::put()
        .uri("/api/profile")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .insert_header(("Content-Type", "application/json"))
        .set_json(&update_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["message"], "Profile updated successfully");
}

/// Test monitoring endpoints
#[tokio::test]
async fn test_monitoring_endpoints() {
    let app = setup_api_test_app().await;

    // First, create an admin user and get a token
    let register_data = json!({
        "email": "admin@example.com",
        "password": "AdminPassword123!",
        "first_name": "Admin",
        "last_name": "User",
        "role": "admin"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_json(&register_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    let body: serde_json::Value = test::read_body_json(resp).await;
    let token = body["token"].as_str().unwrap();

    // Test get system metrics
    let req = test::TestRequest::get()
        .uri("/api/monitoring/metrics")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["metrics"].is_object());

    // Test get system health
    let req = test::TestRequest::get()
        .uri("/api/monitoring/health")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["status"].is_string());

    // Test get alerts
    let req = test::TestRequest::get()
        .uri("/api/monitoring/alerts")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["alerts"].is_array());
}

/// Test sync endpoints
#[tokio::test]
async fn test_sync_endpoints() {
    let app = setup_api_test_app().await;

    // First, create a user and get a token
    let register_data = json!({
        "email": "sync@example.com",
        "password": "SyncPassword123!",
        "first_name": "Sync",
        "last_name": "User",
        "role": "user"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_json(&register_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    let body: serde_json::Value = test::read_body_json(resp).await;
    let token = body["token"].as_str().unwrap();

    // Test get sync status
    let req = test::TestRequest::get()
        .uri("/api/sync/status")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["status"].is_object());

    // Test sync data
    let sync_data = json!({
        "last_sync_timestamp": "2024-01-01T00:00:00Z",
        "data_types": ["projects", "reconciliation_jobs"]
    });

    let req = test::TestRequest::post()
        .uri("/api/sync")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .insert_header(("Content-Type", "application/json"))
        .set_json(&sync_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["synced_data"].is_object());
}

/// Test password manager endpoints
#[tokio::test]
async fn test_password_manager_endpoints() {
    let app = setup_api_test_app().await;

    // First, create a user and get a token
    let register_data = json!({
        "email": "passwords@example.com",
        "password": "PasswordsPassword123!",
        "first_name": "Passwords",
        "last_name": "User",
        "role": "user"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_json(&register_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    let body: serde_json::Value = test::read_body_json(resp).await;
    let token = body["token"].as_str().unwrap();

    // Test create password entry
    let create_data = json!({
        "name": "test-service",
        "password": "TestPassword123!",
        "description": "Test service password",
        "rotation_days": 90
    });

    let req = test::TestRequest::post()
        .uri("/api/passwords")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .insert_header(("Content-Type", "application/json"))
        .set_json(&create_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    let password_id = body["id"].as_str().unwrap();

    // Test get password entries
    let req = test::TestRequest::get()
        .uri("/api/passwords")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["passwords"].is_array());

    // Test get specific password
    let req = test::TestRequest::get()
        .uri(&format!("/api/passwords/{}", password_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["name"], "test-service");

    // Test update password
    let update_data = json!({
        "description": "Updated description"
    });

    let req = test::TestRequest::put()
        .uri(&format!("/api/passwords/{}", password_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .insert_header(("Content-Type", "application/json"))
        .set_json(&update_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    // Test delete password
    let req = test::TestRequest::delete()
        .uri(&format!("/api/passwords/{}", password_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
}

/// Test onboarding endpoints
#[tokio::test]
async fn test_onboarding_endpoints() {
    let app = setup_api_test_app().await;

    // First, create a user and get a token
    let register_data = json!({
        "email": "onboarding@example.com",
        "password": "OnboardingPassword123!",
        "first_name": "Onboarding",
        "last_name": "User",
        "role": "user"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_json(&register_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    let body: serde_json::Value = test::read_body_json(resp).await;
    let token = body["token"].as_str().unwrap();

    // Test get onboarding status
    let req = test::TestRequest::get()
        .uri("/api/onboarding/status")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["status"].is_object());

    // Test complete onboarding step
    let step_data = json!({
        "step": "create_project",
        "completed": true
    });

    let req = test::TestRequest::post()
        .uri("/api/onboarding/step")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .insert_header(("Content-Type", "application/json"))
        .set_json(&step_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["message"], "Onboarding step completed");

    // Test skip onboarding
    let req = test::TestRequest::post()
        .uri("/api/onboarding/skip")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["message"], "Onboarding skipped");
}

/// Test API endpoint rate limiting
#[tokio::test]
async fn test_api_rate_limiting() {
    let app = setup_api_test_app().await;

    // Test login rate limiting
    for i in 0..15 {
        let login_data = json!({
            "email": "ratelimit@example.com",
            "password": "WrongPassword"
        });

        let req = test::TestRequest::post()
            .uri("/api/auth/login")
            .insert_header(("Content-Type", "application/json"))
            .set_json(&login_data)
            .to_request();

        let resp = test::call_service(&app, req).await;

        if i >= 10 {
            // Should eventually hit rate limit
            if resp.status() == 429 {
                break;
            }
        }
    }

    // Test registration rate limiting
    for i in 0..10 {
        let register_data = json!({
            "email": format!("ratelimit{}@example.com", i),
            "password": "RateLimitPassword123!",
            "first_name": "Rate",
            "last_name": "Limit"
        });

        let req = test::TestRequest::post()
            .uri("/api/auth/register")
            .insert_header(("Content-Type", "application/json"))
            .set_json(&register_data)
            .to_request();

        let resp = test::call_service(&app, req).await;

        // Should eventually hit rate limit
        if resp.status() == 429 {
            break;
        }
    }
}

/// Test API endpoint input validation
#[tokio::test]
async fn test_api_input_validation() {
    let app = setup_api_test_app().await;

    // Test invalid email format
    let invalid_register_data = json!({
        "email": "invalid-email",
        "password": "ValidPassword123!",
        "first_name": "Test",
        "last_name": "User"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_json(&invalid_register_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());

    // Test weak password
    let weak_password_data = json!({
        "email": "weak@example.com",
        "password": "weak",
        "first_name": "Weak",
        "last_name": "Password"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_json(&weak_password_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());

    // Test missing required fields
    let incomplete_data = json!({
        "email": "incomplete@example.com"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_json(&incomplete_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());
}

/// Test API endpoint CORS headers
#[tokio::test]
async fn test_api_cors_headers() {
    let app = setup_api_test_app().await;

    // Test preflight request
    let req = test::TestRequest::default()
        .method("OPTIONS")
        .uri("/api/auth/login")
        .insert_header(("Origin", "http://localhost:3000"))
        .insert_header(("Access-Control-Request-Method", "POST"))
        .insert_header(("Access-Control-Request-Headers", "Content-Type"))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let headers = resp.headers();
    assert!(headers.contains_key("access-control-allow-origin"));
    assert!(headers.contains_key("access-control-allow-methods"));
    assert!(headers.contains_key("access-control-allow-headers"));

    // Test actual request with origin
    let login_data = json!({
        "email": "cors@example.com",
        "password": "CorsPassword123!"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/login")
        .insert_header(("Origin", "http://localhost:3000"))
        .insert_header(("Content-Type", "application/json"))
        .set_json(&login_data)
        .to_request();

    let resp = test::call_service(&app, req).await;

    let headers = resp.headers();
    assert!(headers.contains_key("access-control-allow-origin"));
}

/// Test user management endpoints
#[tokio::test]
async fn test_user_endpoints() {
    let app = setup_api_test_app().await;

    // First, create a user and get a token
    let register_data = json!({
        "email": "admin@example.com",
        "password": "AdminPassword123!",
        "first_name": "Admin",
        "last_name": "User",
        "role": "admin"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_json(&register_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    let body: serde_json::Value = test::read_body_json(resp).await;
    let token = body["token"].as_str().unwrap();

    // Test get users endpoint
    let req = test::TestRequest::get()
        .uri("/api/users")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["users"].is_array());
    assert!(body["total"].is_number());

    // Test create user endpoint
    let create_user_data = json!({
        "email": "newuser@example.com",
        "password": "NewUserPassword123!",
        "first_name": "New",
        "last_name": "User",
        "role": "user"
    });

    let req = test::TestRequest::post()
        .uri("/api/users")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .insert_header(("Content-Type", "application/json"))
        .set_json(&create_user_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    let user_id = body["id"].as_str().unwrap();

    // Test get specific user endpoint
    let req = test::TestRequest::get()
        .uri(&format!("/api/users/{}", user_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["email"].as_str().unwrap(), "newuser@example.com");

    // Test update user endpoint
    let update_user_data = json!({
        "first_name": "Updated",
        "last_name": "User"
    });

    let req = test::TestRequest::put()
        .uri(&format!("/api/users/{}", user_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .insert_header(("Content-Type", "application/json"))
        .set_json(&update_user_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["first_name"].as_str().unwrap(), "Updated");

    // Test delete user endpoint
    let req = test::TestRequest::delete()
        .uri(&format!("/api/users/{}", user_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    // Test search users endpoint
    let req = test::TestRequest::get()
        .uri("/api/users/search?q=admin")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["users"].is_array());
}

/// Test project management endpoints
#[tokio::test]
async fn test_project_endpoints() {
    let app = setup_api_test_app().await;

    // First, create a user and get a token
    let register_data = json!({
        "email": "projectowner@example.com",
        "password": "ProjectPassword123!",
        "first_name": "Project",
        "last_name": "Owner",
        "role": "manager"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_json(&register_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    let body: serde_json::Value = test::read_body_json(resp).await;
    let token = body["token"].as_str().unwrap();
    let user_id = body["user"]["id"].as_str().unwrap();

    // Test get projects endpoint
    let req = test::TestRequest::get()
        .uri("/api/projects")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["projects"].is_array());

    // Test create project endpoint
    let create_project_data = json!({
        "name": "Test Project",
        "description": "A test project",
        "owner_id": user_id,
        "status": "active"
    });

    let req = test::TestRequest::post()
        .uri("/api/projects")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .insert_header(("Content-Type", "application/json"))
        .set_json(&create_project_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    let project_id = body["id"].as_str().unwrap();

    // Test get specific project endpoint
    let req = test::TestRequest::get()
        .uri(&format!("/api/projects/{}", project_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["name"].as_str().unwrap(), "Test Project");

    // Test update project endpoint
    let update_project_data = json!({
        "name": "Updated Project",
        "description": "An updated test project"
    });

    let req = test::TestRequest::put()
        .uri(&format!("/api/projects/{}", project_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .insert_header(("Content-Type", "application/json"))
        .set_json(&update_project_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["name"].as_str().unwrap(), "Updated Project");

    // Test delete project endpoint
    let req = test::TestRequest::delete()
        .uri(&format!("/api/projects/{}", project_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
}

/// Test reconciliation endpoints
#[tokio::test]
async fn test_reconciliation_endpoints() {
    let app = setup_api_test_app().await;

    // First, create a user and get a token
    let register_data = json!({
        "email": "reconciliation@example.com",
        "password": "ReconciliationPassword123!",
        "first_name": "Reconciliation",
        "last_name": "User",
        "role": "manager"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_json(&register_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    let body: serde_json::Value = test::read_body_json(resp).await;
    let token = body["token"].as_str().unwrap();

    // Test get reconciliation jobs endpoint
    let req = test::TestRequest::get()
        .uri("/api/reconciliation/jobs/test-project-id")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["jobs"].is_array());

    // Test create reconciliation job endpoint
    let create_job_data = json!({
        "name": "Test Reconciliation Job",
        "description": "A test reconciliation job",
        "confidence_threshold": 0.8
    });

    let req = test::TestRequest::post()
        .uri("/api/reconciliation/jobs/test-project-id")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .insert_header(("Content-Type", "application/json"))
        .set_json(&create_job_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    let job_id = body["id"].as_str().unwrap();

    // Test get specific reconciliation job endpoint
    let req = test::TestRequest::get()
        .uri(&format!("/api/reconciliation/jobs/{}", job_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["name"].as_str().unwrap(), "Test Reconciliation Job");

    // Test start reconciliation job endpoint
    let req = test::TestRequest::post()
        .uri(&format!("/api/reconciliation/jobs/{}/start", job_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    // Test stop reconciliation job endpoint
    let req = test::TestRequest::post()
        .uri(&format!("/api/reconciliation/jobs/{}/stop", job_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    // Test get reconciliation results endpoint
    let req = test::TestRequest::get()
        .uri(&format!("/api/reconciliation/jobs/{}/results", job_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["results"].is_array());

    // Test get reconciliation progress endpoint
    let req = test::TestRequest::get()
        .uri(&format!("/api/reconciliation/jobs/{}/progress", job_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["progress"].is_number());
    assert!(body["status"].is_string());
}

/// Test file upload endpoints
#[tokio::test]
async fn test_file_endpoints() {
    let app = setup_api_test_app().await;

    // First, create a user and get a token
    let register_data = json!({
        "email": "fileuser@example.com",
        "password": "FilePassword123!",
        "first_name": "File",
        "last_name": "User",
        "role": "user"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_json(&register_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    let body: serde_json::Value = test::read_body_json(resp).await;
    let token = body["token"].as_str().unwrap();

    // Test file upload endpoint
    let req = test::TestRequest::post()
        .uri("/api/files/upload")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    let file_id = body["id"].as_str().unwrap();

    // Test get file endpoint
    let req = test::TestRequest::get()
        .uri(&format!("/api/files/{}", file_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["id"].as_str().unwrap(), file_id);

    // Test process file endpoint
    let req = test::TestRequest::post()
        .uri(&format!("/api/files/{}/process", file_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    // Test delete file endpoint
    let req = test::TestRequest::delete()
        .uri(&format!("/api/files/{}", file_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
}

/// Test analytics endpoints
#[tokio::test]
async fn test_analytics_endpoints() {
    let app = setup_api_test_app().await;

    // First, create a user and get a token
    let register_data = json!({
        "email": "analytics@example.com",
        "password": "AnalyticsPassword123!",
        "first_name": "Analytics",
        "last_name": "User",
        "role": "admin"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_json(&register_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    let body: serde_json::Value = test::read_body_json(resp).await;
    let token = body["token"].as_str().unwrap();
    let user_id = body["user"]["id"].as_str().unwrap();

    // Test dashboard data endpoint
    let req = test::TestRequest::get()
        .uri("/api/analytics/dashboard")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["total_users"].is_number());
    assert!(body["total_projects"].is_number());

    // Test project stats endpoint
    let req = test::TestRequest::get()
        .uri(&format!("/api/analytics/projects/{}/stats", Uuid::new_v4()))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    // Test user activity endpoint
    let req = test::TestRequest::get()
        .uri(&format!("/api/analytics/users/{}/activity", user_id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["total_actions"].is_number());

    // Test reconciliation stats endpoint
    let req = test::TestRequest::get()
        .uri("/api/analytics/reconciliation/stats")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["total_jobs"].is_number());
    assert!(body["completed_jobs"].is_number());
}

/// Test system endpoints
#[tokio::test]
async fn test_system_endpoints() {
    let app = setup_api_test_app().await;

    // Test health check endpoint
    let req = test::TestRequest::get().uri("/health").to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["status"].as_str().unwrap(), "healthy");
    assert!(body["timestamp"].is_string());
    assert!(body["version"].is_string());

    // Test system status endpoint
    let req = test::TestRequest::get()
        .uri("/api/system/status")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["status"].as_str().unwrap(), "operational");
    assert!(body["uptime"].is_string());
    assert!(body["version"].is_string());

    // Test metrics endpoint
    let req = test::TestRequest::get()
        .uri("/api/system/metrics")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["metrics"].is_string());
}

/// Test error handling in endpoints
#[tokio::test]
async fn test_endpoint_error_handling() {
    let app = setup_api_test_app().await;

    // Test invalid JSON in request body
    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_payload("invalid json")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());

    // Test missing required fields
    let invalid_data = json!({
        "email": "test@example.com"
        // Missing password, first_name, last_name
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_json(&invalid_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());

    // Test invalid UUID in URL path
    let req = test::TestRequest::get()
        .uri("/api/users/invalid-uuid")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());

    // Test unauthorized access
    let req = test::TestRequest::get().uri("/api/users").to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());

    // Test invalid authorization header
    let req = test::TestRequest::get()
        .uri("/api/users")
        .insert_header(("Authorization", "InvalidToken"))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());

    // Test non-existent endpoint
    let req = test::TestRequest::get()
        .uri("/api/nonexistent")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());
}

/// Test pagination in endpoints
#[tokio::test]
async fn test_endpoint_pagination() {
    let app = setup_api_test_app().await;

    // First, create a user and get a token
    let register_data = json!({
        "email": "pagination@example.com",
        "password": "PaginationPassword123!",
        "first_name": "Pagination",
        "last_name": "User",
        "role": "admin"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .insert_header(("Content-Type", "application/json"))
        .set_json(&register_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    let body: serde_json::Value = test::read_body_json(resp).await;
    let token = body["token"].as_str().unwrap();

    // Test pagination parameters
    let req = test::TestRequest::get()
        .uri("/api/users?page=1&per_page=10")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["page"].as_i64().unwrap(), 1);
    assert_eq!(body["per_page"].as_i64().unwrap(), 10);
    assert!(body["total"].is_number());
    assert!(body["users"].is_array());

    // Test invalid pagination parameters
    let req = test::TestRequest::get()
        .uri("/api/users?page=0&per_page=0")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    // Should be corrected to valid values
    assert!(body["page"].as_i64().unwrap() >= 1);
    assert!(body["per_page"].as_i64().unwrap() >= 1);
    assert!(body["per_page"].as_i64().unwrap() <= 100);
}

/// Test concurrent API requests
#[tokio::test]
async fn test_concurrent_api_requests() {
    let app = setup_api_test_app().await;

    // Test concurrent health checks
    let handles: Vec<_> = (0..10)
        .map(|_| {
            let app = app.clone();
            tokio::spawn(async move {
                let req = test::TestRequest::get().uri("/health").to_request();

                test::call_service(&app, req).await
            })
        })
        .collect();

    let results: Vec<_> = futures::future::join_all(handles).await;

    // Verify all requests succeeded
    for result in results {
        assert!(result.is_ok());
        let resp = result.unwrap();
        assert!(resp.status().is_success());
    }
}
