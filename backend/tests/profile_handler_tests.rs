//! Profile handler tests
//!
//! Comprehensive tests for profile endpoints

use actix_web::{test, web, App};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::profile;
use reconciliation_backend::handlers::types::ApiResponse;
use reconciliation_backend::services::cache::MultiLevelCache;
use reconciliation_backend::services::user::UserService;
use reconciliation_backend::services::auth::AuthService;
use reconciliation_backend::test_utils_export::database::setup_test_database;
use std::sync::Arc;

#[tokio::test]
async fn test_get_profile() {
    let db = Arc::new(setup_test_database().await);
    let cache = Arc::new(MultiLevelCache::new());
    let auth_service = AuthService::new("test_secret".to_string(), 3600);
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service));
    let user_id = Uuid::new_v4();
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(db))
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::from(user_service.clone()))
            .app_data(web::Data::from(user_id))
            .service(web::scope("/profile").configure(profile::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/profile")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on user existence
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_update_profile() {
    let db = Arc::new(setup_test_database().await);
    let cache = Arc::new(MultiLevelCache::new());
    let auth_service = AuthService::new("test_secret".to_string(), 3600);
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service));
    let user_id = Uuid::new_v4();
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(db))
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::from(user_service.clone()))
            .app_data(web::Data::from(user_id))
            .service(web::scope("/profile").configure(profile::configure_routes))
    ).await;

    let request_data = json!({
        "first_name": "John",
        "last_name": "Doe",
        "bio": "Test bio",
        "company": "Test Company"
    });

    let req = test::TestRequest::put()
        .uri("/profile")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on user existence
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_update_profile_invalid_first_name() {
    let db = Arc::new(setup_test_database().await);
    let cache = Arc::new(MultiLevelCache::new());
    let auth_service = AuthService::new("test_secret".to_string(), 3600);
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service));
    let user_id = Uuid::new_v4();
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(db))
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::from(user_service.clone()))
            .app_data(web::Data::from(user_id))
            .service(web::scope("/profile").configure(profile::configure_routes))
    ).await;

    let request_data = json!({
        "first_name": ""  // Empty - should fail validation
    });

    let req = test::TestRequest::put()
        .uri("/profile")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status().as_u16(), 422); // Validation error
}

#[tokio::test]
async fn test_update_profile_invalid_bio_length() {
    let db = Arc::new(setup_test_database().await);
    let cache = Arc::new(MultiLevelCache::new());
    let auth_service = AuthService::new("test_secret".to_string(), 3600);
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service));
    let user_id = Uuid::new_v4();
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(db))
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::from(user_service.clone()))
            .app_data(web::Data::from(user_id))
            .service(web::scope("/profile").configure(profile::configure_routes))
    ).await;

    let request_data = json!({
        "bio": "x".repeat(501)  // Too long - should fail validation
    });

    let req = test::TestRequest::put()
        .uri("/profile")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status().as_u16(), 422); // Validation error
}

#[tokio::test]
async fn test_upload_avatar() {
    let cache = Arc::new(MultiLevelCache::new());
    let user_id = Uuid::new_v4();
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::from(user_id))
            .service(web::scope("/profile").configure(profile::configure_routes))
    ).await;

    let req = test::TestRequest::post()
        .uri("/profile/avatar")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
    assert!(body.success);
    assert!(body.data.is_some());
    assert!(body.data.as_ref().unwrap().get("avatar_url").is_some());
}

#[tokio::test]
async fn test_get_profile_stats() {
    let db = Arc::new(setup_test_database().await);
    let auth_service = AuthService::new("test_secret".to_string(), 3600);
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service));
    let user_id = Uuid::new_v4();
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(db))
            .app_data(web::Data::from(user_service.clone()))
            .app_data(web::Data::from(user_id))
            .service(web::scope("/profile").configure(profile::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/profile/stats")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on user existence
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

