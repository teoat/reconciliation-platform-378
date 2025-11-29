//! Files handler tests
//!
//! Comprehensive tests for file management endpoints

use actix_web::{test, web, App};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::config::Config;
use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::files;
use reconciliation_backend::handlers::types::ApiResponse;
use reconciliation_backend::test_utils_export::database::setup_test_database;

#[tokio::test]
async fn test_init_resumable_upload_no_auth() {
    let db = Arc::new(setup_test_database().await);
    let config = Config::from_env().unwrap_or_else(|_| Config {
        host: "0.0.0.0".to_string(),
        port: 2000,
        database_url: "postgresql://postgres:postgres@localhost:5432/reconciliation_test".to_string(),
        redis_url: "redis://localhost:6379".to_string(),
        jwt_secret: "test-secret".to_string(),
        jwt_expiration: 3600,
        cors_origins: vec![],
        log_level: "info".to_string(),
        max_file_size: 10485760,
        upload_path: "./uploads".to_string(),
    });
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new((*db).clone()))
            .app_data(web::Data::new(config))
            .service(web::scope("/files").configure(files::configure_routes))
    ).await;

    let request_data = json!({
        "project_id": Uuid::new_v4(),
        "filename": "test.csv",
        "expected_size": 1024
    });

    let req = test::TestRequest::post()
        .uri("/files/upload/resumable/init")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    // Should fail without auth
    assert!(resp.status().is_client_error());
}

#[tokio::test]
async fn test_get_file_no_auth() {
    let db = Arc::new(setup_test_database().await);
    let config = Config::from_env().unwrap_or_else(|_| Config {
        host: "0.0.0.0".to_string(),
        port: 2000,
        database_url: "postgresql://postgres:postgres@localhost:5432/reconciliation_test".to_string(),
        redis_url: "redis://localhost:6379".to_string(),
        jwt_secret: "test-secret".to_string(),
        jwt_expiration: 3600,
        cors_origins: vec![],
        log_level: "info".to_string(),
        max_file_size: 10485760,
        upload_path: "./uploads".to_string(),
    });
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new((*db).clone()))
            .app_data(web::Data::new(config))
            .service(web::scope("/files").configure(files::configure_routes))
    ).await;

    let file_id = Uuid::new_v4();
    let req = test::TestRequest::get()
        .uri(&format!("/files/{}", file_id))
        .to_request();

    let resp = test::call_service(&app, req).await;
    // Should fail without auth
    assert!(resp.status().is_client_error());
}

#[tokio::test]
async fn test_delete_file_no_auth() {
    let db = Arc::new(setup_test_database().await);
    let config = Config::from_env().unwrap_or_else(|_| Config {
        host: "0.0.0.0".to_string(),
        port: 2000,
        database_url: "postgresql://postgres:postgres@localhost:5432/reconciliation_test".to_string(),
        redis_url: "redis://localhost:6379".to_string(),
        jwt_secret: "test-secret".to_string(),
        jwt_expiration: 3600,
        cors_origins: vec![],
        log_level: "info".to_string(),
        max_file_size: 10485760,
        upload_path: "./uploads".to_string(),
    });
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new((*db).clone()))
            .app_data(web::Data::new(config))
            .service(web::scope("/files").configure(files::configure_routes))
    ).await;

    let file_id = Uuid::new_v4();
    let req = test::TestRequest::delete()
        .uri(&format!("/files/{}", file_id))
        .to_request();

    let resp = test::call_service(&app, req).await;
    // Should fail without auth
    assert!(resp.status().is_client_error());
}

#[tokio::test]
async fn test_get_file_preview_no_auth() {
    let db = Arc::new(setup_test_database().await);
    let config = Config::from_env().unwrap_or_else(|_| Config {
        host: "0.0.0.0".to_string(),
        port: 2000,
        database_url: "postgresql://postgres:postgres@localhost:5432/reconciliation_test".to_string(),
        redis_url: "redis://localhost:6379".to_string(),
        jwt_secret: "test-secret".to_string(),
        jwt_expiration: 3600,
        cors_origins: vec![],
        log_level: "info".to_string(),
        max_file_size: 10485760,
        upload_path: "./uploads".to_string(),
    });
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new((*db).clone()))
            .app_data(web::Data::new(config))
            .service(web::scope("/files").configure(files::configure_routes))
    ).await;

    let file_id = Uuid::new_v4();
    let req = test::TestRequest::get()
        .uri(&format!("/files/{}/preview", file_id))
        .to_request();

    let resp = test::call_service(&app, req).await;
    // Should fail without auth
    assert!(resp.status().is_client_error());
}

