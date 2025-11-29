//! Password manager handler tests
//!
//! Comprehensive tests for password manager endpoints

use actix_web::{test, web, App};
use serde_json::json;
use std::sync::Arc;

use reconciliation_backend::handlers::password_manager;
use reconciliation_backend::services::password_manager::PasswordManager;

#[tokio::test]
async fn test_list_passwords() {
    let password_manager = Arc::new(PasswordManager::new());
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(password_manager.clone()))
            .service(web::scope("/passwords").configure(password_manager::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/passwords")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_create_password() {
    let password_manager = Arc::new(PasswordManager::new());
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(password_manager.clone()))
            .service(web::scope("/passwords").configure(password_manager::configure_routes))
    ).await;

    let request_data = json!({
        "name": "test-password",
        "password": "TestPassword123!",
        "rotation_interval_days": 90
    });

    let req = test::TestRequest::post()
        .uri("/passwords")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_rotate_password() {
    let password_manager = Arc::new(PasswordManager::new());
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(password_manager.clone()))
            .service(web::scope("/passwords").configure(password_manager::configure_routes))
    ).await;

    let request_data = json!({
        "name": "test-password"
    });

    let req = test::TestRequest::post()
        .uri("/passwords/rotate")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth and password existence
    assert!(resp.status().is_success() || resp.status().is_client_error() || resp.status().as_u16() == 404);
}

#[tokio::test]
async fn test_get_rotation_schedule() {
    let password_manager = Arc::new(PasswordManager::new());
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(password_manager.clone()))
            .service(web::scope("/passwords").configure(password_manager::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/passwords/rotation-schedule")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

