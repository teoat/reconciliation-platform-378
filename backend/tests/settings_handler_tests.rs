//! Settings handler tests
//!
//! Comprehensive tests for settings endpoints

use actix_web::{test, web, App};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::handlers::settings;
use reconciliation_backend::handlers::types::ApiResponse;
use reconciliation_backend::services::cache::MultiLevelCache;

#[tokio::test]
async fn test_get_settings() {
    let cache = Arc::new(MultiLevelCache::new());
    let user_id = Uuid::new_v4();
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::from(user_id))
            .service(web::scope("/settings").configure(settings::configure_routes))
    ).await;

    let req = test::TestRequest::get()
        .uri("/settings")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
    assert!(body.success);
    assert!(body.data.is_some());
    
    let data = body.data.unwrap();
    assert_eq!(data["theme"], "light");
    assert!(data.get("notifications").is_some());
    assert!(data.get("privacy").is_some());
    assert!(data.get("display").is_some());
}

#[tokio::test]
async fn test_update_settings() {
    let cache = Arc::new(MultiLevelCache::new());
    let user_id = Uuid::new_v4();
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::from(user_id))
            .service(web::scope("/settings").configure(settings::configure_routes))
    ).await;

    let request_data = json!({
        "theme": "dark",
        "language": "en",
        "timezone": "UTC",
        "notifications": {
            "email_notifications": true,
            "push_notifications": false,
            "sms_notifications": false,
            "project_updates": true,
            "reconciliation_alerts": true,
            "system_announcements": false
        },
        "privacy": {
            "profile_visibility": "private",
            "data_sharing": false,
            "analytics_tracking": true,
            "activity_logging": true
        },
        "display": {
            "date_format": "DD/MM/YYYY",
            "time_format": "24h",
            "currency": "EUR",
            "items_per_page": 50,
            "compact_view": true
        }
    });

    let req = test::TestRequest::put()
        .uri("/settings")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
    assert!(body.success);
    assert_eq!(body.data.as_ref().unwrap()["theme"], "dark");
}

#[tokio::test]
async fn test_update_settings_invalid_theme() {
    let cache = Arc::new(MultiLevelCache::new());
    let user_id = Uuid::new_v4();
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::from(user_id))
            .service(web::scope("/settings").configure(settings::configure_routes))
    ).await;

    let request_data = json!({
        "theme": "invalid",
        "language": "en",
        "timezone": "UTC",
        "notifications": {},
        "privacy": {},
        "display": {}
    });

    let req = test::TestRequest::put()
        .uri("/settings")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status().as_u16(), 422); // Validation error
}

#[tokio::test]
async fn test_update_settings_invalid_items_per_page() {
    let cache = Arc::new(MultiLevelCache::new());
    let user_id = Uuid::new_v4();
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::from(user_id))
            .service(web::scope("/settings").configure(settings::configure_routes))
    ).await;

    let request_data = json!({
        "theme": "light",
        "language": "en",
        "timezone": "UTC",
        "notifications": {},
        "privacy": {},
        "display": {
            "items_per_page": 5  // Below minimum
        }
    });

    let req = test::TestRequest::put()
        .uri("/settings")
        .set_json(&request_data)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status().as_u16(), 422); // Validation error
}

#[tokio::test]
async fn test_reset_settings() {
    let cache = Arc::new(MultiLevelCache::new());
    let user_id = Uuid::new_v4();
    
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(cache.clone()))
            .app_data(web::Data::from(user_id))
            .service(web::scope("/settings").configure(settings::configure_routes))
    ).await;

    let req = test::TestRequest::post()
        .uri("/settings/reset")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
    assert!(body.success);
    assert_eq!(body.data.as_ref().unwrap()["theme"], "light");
}

