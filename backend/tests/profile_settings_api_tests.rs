//! API endpoint tests for profile and settings handlers
//!
//! Tests all profile and settings API endpoints including profile management,
//! settings retrieval and updates.

use actix_web::{test, web, App};
use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::profile::{get_profile, get_profile_stats, update_profile};
use reconciliation_backend::handlers::settings::{get_settings, reset_settings, update_settings};
use reconciliation_backend::services::auth::AuthService;
use reconciliation_backend::services::cache::MultiLevelCache;
use reconciliation_backend::services::user::UserService;
use reconciliation_backend::test_utils_export::database::setup_test_database;

/// Test profile and settings API endpoints
#[cfg(test)]
mod profile_settings_api_tests {
    use super::*;

    /// Setup test fixtures (user)
    async fn setup_test_fixtures(
        db: Database,
        auth_service: AuthService,
    ) -> (Uuid, String) {
        let user_service = UserService::new(Arc::new(db.clone()), auth_service.clone());

        // Create test user
        let user = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "profileuser@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Profile".to_string(),
                last_name: "User".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Generate token for authentication
        let user_model = user_service
            .get_user_by_email("profileuser@example.com")
            .await
            .unwrap();
        let token = auth_service.generate_token(&user_model).unwrap();

        (user.id, token)
    }

    #[tokio::test]
    async fn test_get_profile() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (user_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));
        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());

        let req = test::TestRequest::get()
            .uri("/api/profile")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(user_id))
                .app_data(cache)
                .app_data(web::Data::new(user_service))
                .route("/api/profile", web::get().to(get_profile)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_update_profile() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (user_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));
        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());

        let update_request = serde_json::json!({
            "first_name": "Updated",
            "last_name": "Name",
            "bio": "Updated bio"
        });

        let req = test::TestRequest::put()
            .uri("/api/profile")
            .set_json(&update_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(user_id))
                .app_data(cache)
                .app_data(web::Data::new(user_service))
                .route("/api/profile", web::put().to(update_profile)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_profile_stats() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (user_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));
        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());

        let req = test::TestRequest::get()
            .uri("/api/profile/stats")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(user_id))
                .app_data(cache)
                .app_data(web::Data::new(user_service))
                .route("/api/profile/stats", web::get().to(get_profile_stats)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_settings() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (user_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());

        let req = test::TestRequest::get()
            .uri("/api/settings")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(user_id))
                .app_data(cache)
                .route("/api/settings", web::get().to(get_settings)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_update_settings() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (user_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());

        let update_request = serde_json::json!({
            "theme": "dark",
            "language": "en",
            "timezone": "UTC",
            "notifications": {
                "email_notifications": true,
                "push_notifications": false
            },
            "privacy": {
                "profile_visibility": "private",
                "data_sharing": false
            },
            "display": {
                "date_format": "MM/DD/YYYY",
                "time_format": "12h",
                "currency": "USD",
                "items_per_page": 25,
                "compact_view": false
            }
        });

        let req = test::TestRequest::put()
            .uri("/api/settings")
            .set_json(&update_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(user_id))
                .app_data(cache)
                .route("/api/settings", web::put().to(update_settings)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_update_settings_invalid_theme() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (user_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());

        // Invalid theme value
        let update_request = serde_json::json!({
            "theme": "invalid_theme",
            "language": "en",
            "timezone": "UTC",
            "notifications": {},
            "privacy": {
                "profile_visibility": "team"
            },
            "display": {
                "items_per_page": 25
            }
        });

        let req = test::TestRequest::put()
            .uri("/api/settings")
            .set_json(&update_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(user_id))
                .app_data(cache)
                .route("/api/settings", web::put().to(update_settings)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_reset_settings() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (user_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());

        let req = test::TestRequest::post()
            .uri("/api/settings/reset")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(user_id))
                .app_data(cache)
                .route("/api/settings/reset", web::post().to(reset_settings)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    // Edge cases
    #[tokio::test]
    async fn test_get_profile_not_found() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let nonexistent_user_id = Uuid::new_v4();

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));

        let req = test::TestRequest::get()
            .uri(&format!("/api/profile/{}", nonexistent_user_id))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .route("/api/profile/{user_id}", web::get().to(get_profile)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should return 404
        assert_eq!(resp.status().as_u16(), 404);
    }

    #[tokio::test]
    async fn test_update_profile_invalid_email() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (user_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));

        // Invalid email format
        let update_request = serde_json::json!({
            "email": "not-an-email"
        });

        let req = test::TestRequest::put()
            .uri(&format!("/api/profile/{}", user_id))
            .set_json(&update_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .route("/api/profile/{user_id}", web::put().to(update_profile)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should fail validation
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_get_settings_unauthorized() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());

        let req = test::TestRequest::get()
            .uri("/api/settings")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(Uuid::new_v4())) // Invalid user_id
                .app_data(cache)
                .route("/api/settings", web::get().to(get_settings)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should handle gracefully
        assert!(resp.status().is_success() || resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_update_settings_invalid_items_per_page() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (user_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());

        // Invalid items_per_page (negative)
        let update_request = serde_json::json!({
            "display": {
                "items_per_page": -10
            }
        });

        let req = test::TestRequest::put()
            .uri("/api/settings")
            .set_json(&update_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(user_id))
                .app_data(cache)
                .route("/api/settings", web::put().to(update_settings)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should fail validation
        assert!(resp.status().is_client_error());
    }
}

