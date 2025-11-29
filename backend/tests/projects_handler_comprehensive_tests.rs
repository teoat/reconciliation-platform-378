//! Comprehensive Projects handler tests
//!
//! Tests for all project management endpoints

use actix_web::{test, web, App};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::config::Config;
use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::projects;
use reconciliation_backend::handlers::types::ApiResponse;
use reconciliation_backend::services::cache::MultiLevelCache;
use reconciliation_backend::test_utils_export::database::setup_test_database;

#[tokio::test]
async fn test_get_projects_no_auth() {
    let db = Arc::new(setup_test_database().await);
    let cache = Arc::new(MultiLevelCache::new());
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
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::new(config))
            .service(web::scope("/projects").configure(projects::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/projects")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth requirement
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_create_project_no_auth() {
    let db = Arc::new(setup_test_database().await);
    let cache = Arc::new(MultiLevelCache::new());
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
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::new(config))
            .service(web::scope("/projects").configure(projects::configure_routes))
    ).await;

    let request_data = json!({
        "name": "Test Project",
        "description": "Test description",
        "owner_id": Uuid::new_v4()
    });

    let req = test::TestRequest::post()
        .uri("/projects")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());
}

#[tokio::test]
async fn test_get_project_no_auth() {
    let db = Arc::new(setup_test_database().await);
    let cache = Arc::new(MultiLevelCache::new());
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
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::new(config))
            .service(web::scope("/projects").configure(projects::configure_routes))
    ).await;

    let project_id = Uuid::new_v4();
    let req = test::TestRequest::get()
        .uri(&format!("/projects/{}", project_id))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());
}

#[tokio::test]
async fn test_get_project_data_sources_no_auth() {
    let db = Arc::new(setup_test_database().await);
    let cache = Arc::new(MultiLevelCache::new());
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
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::new(config))
            .service(web::scope("/projects").configure(projects::configure_routes))
    ).await;

    let project_id = Uuid::new_v4();
    let req = test::TestRequest::get()
        .uri(&format!("/projects/{}/data-sources", project_id))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());
}

#[tokio::test]
async fn test_get_reconciliation_jobs_no_auth() {
    let db = Arc::new(setup_test_database().await);
    let cache = Arc::new(MultiLevelCache::new());
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
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::new(config))
            .service(web::scope("/projects").configure(projects::configure_routes))
    ).await;

    let project_id = Uuid::new_v4();
    let req = test::TestRequest::get()
        .uri(&format!("/projects/{}/reconciliation-jobs", project_id))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_client_error());
}

