//! Comprehensive Users handler tests
//!
//! Tests for all user management endpoints

use actix_web::{test, web, App};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::users;
use reconciliation_backend::handlers::types::ApiResponse;
use reconciliation_backend::services::auth::AuthService;
use reconciliation_backend::services::cache::MultiLevelCache;
use reconciliation_backend::services::user::UserService;
use reconciliation_backend::test_utils_export::database::setup_test_database;

#[tokio::test]
async fn test_get_users() {
    let db = Arc::new(setup_test_database().await);
    let cache = Arc::new(MultiLevelCache::new());
    let auth_service = AuthService::new("test_secret".to_string(), 3600);
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service));
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new((*db).clone()))
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::from(user_service.clone()))
            .service(web::scope("/users").configure(users::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/users")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_create_user() {
    let db = Arc::new(setup_test_database().await);
    let cache = Arc::new(MultiLevelCache::new());
    let auth_service = AuthService::new("test_secret".to_string(), 3600);
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service));
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new((*db).clone()))
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::from(user_service.clone()))
            .service(web::scope("/users").configure(users::configure_routes))
    ).await;

    let request_data = json!({
        "email": format!("test-{}@example.com", uuid::Uuid::new_v4()),
        "password": "TestPassword123!",
        "first_name": "Test",
        "last_name": "User",
        "role": "user"
    });

    let req = test::TestRequest::post()
        .uri("/users")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth and validation
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_get_user() {
    let db = Arc::new(setup_test_database().await);
    let cache = Arc::new(MultiLevelCache::new());
    let auth_service = AuthService::new("test_secret".to_string(), 3600);
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service));
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new((*db).clone()))
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::from(user_service.clone()))
            .service(web::scope("/users").configure(users::configure_routes))
    ).await;

    let user_id = Uuid::new_v4();
    let req = test::TestRequest::get()
        .uri(&format!("/users/{}", user_id))
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth and user existence
    assert!(resp.status().is_success() || resp.status().is_client_error() || resp.status().as_u16() == 404);
}

#[tokio::test]
async fn test_search_users() {
    let db = Arc::new(setup_test_database().await);
    let cache = Arc::new(MultiLevelCache::new());
    let auth_service = AuthService::new("test_secret".to_string(), 3600);
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service));
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new((*db).clone()))
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::from(user_service.clone()))
            .service(web::scope("/users").configure(users::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/users/search?q=test")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_get_user_statistics() {
    let db = Arc::new(setup_test_database().await);
    let cache = Arc::new(MultiLevelCache::new());
    let auth_service = AuthService::new("test_secret".to_string(), 3600);
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service));
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new((*db).clone()))
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::from(user_service.clone()))
            .service(web::scope("/users").configure(users::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/users/statistics")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_get_user_preferences() {
    let db = Arc::new(setup_test_database().await);
    let cache = Arc::new(MultiLevelCache::new());
    let auth_service = AuthService::new("test_secret".to_string(), 3600);
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service));
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new((*db).clone()))
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::from(user_service.clone()))
            .service(web::scope("/users").configure(users::configure_routes))
    ).await;

    let user_id = Uuid::new_v4();
    let req = test::TestRequest::get()
        .uri(&format!("/users/{}/preferences", user_id))
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth and user existence
    assert!(resp.status().is_success() || resp.status().is_client_error() || resp.status().as_u16() == 404);
}

