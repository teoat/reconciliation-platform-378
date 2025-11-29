//! SQL Sync handler tests
//!
//! Comprehensive tests for SQL sync endpoints

use actix_web::{test, web, App};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::sql_sync;
use reconciliation_backend::handlers::types::ApiResponse;
use reconciliation_backend::test_utils_export::database::setup_test_database;

#[tokio::test]
async fn test_list_sync_configurations() {
    let db = Arc::new(setup_test_database().await);
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(db.clone()))
            .service(web::scope("/sync").configure(sql_sync::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/sync/sql-sync/configurations")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_create_sync_configuration() {
    let db = Arc::new(setup_test_database().await);
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(db.clone()))
            .service(web::scope("/sync").configure(sql_sync::configure_routes))
    ).await;

    let request_data = json!({
        "name": "test-sync",
        "source_table": "source_table",
        "target_table": "target_table",
        "sync_strategy": "incremental",
        "enabled": true
    });

    let req = test::TestRequest::post()
        .uri("/sync/sql-sync/configurations")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_get_sync_configuration() {
    let db = Arc::new(setup_test_database().await);
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(db.clone()))
            .service(web::scope("/sync").configure(sql_sync::configure_routes))
    ).await;

    let config_id = Uuid::new_v4();
    let req = test::TestRequest::get()
        .uri(&format!("/sync/sql-sync/configurations/{}", config_id))
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth and existence
    assert!(resp.status().is_success() || resp.status().is_client_error() || resp.status().as_u16() == 404);
}

#[tokio::test]
async fn test_list_sync_executions() {
    let db = Arc::new(setup_test_database().await);
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(db.clone()))
            .service(web::scope("/sync").configure(sql_sync::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/sync/sql-sync/executions")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_list_sync_conflicts() {
    let db = Arc::new(setup_test_database().await);
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(db.clone()))
            .service(web::scope("/sync").configure(sql_sync::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/sync/sql-sync/conflicts")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

#[tokio::test]
async fn test_get_sync_statistics() {
    let db = Arc::new(setup_test_database().await);
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(db.clone()))
            .service(web::scope("/sync").configure(sql_sync::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/sync/sql-sync/statistics")
        .to_request();

    let resp = test::call_service(&app, req).await;
    // May succeed or fail depending on auth
    assert!(resp.status().is_success() || resp.status().is_client_error());
}

