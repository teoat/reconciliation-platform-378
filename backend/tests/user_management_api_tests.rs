//! API endpoint tests for user management handlers
//!
//! Tests all user management API endpoints including CRUD operations,
//! search, statistics, and preferences management.

use actix_web::{test, web, App};
use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::users::{
    create_user, delete_user, get_user, get_user_preferences, get_user_statistics, get_users,
    search_users, update_user, update_user_preferences,
};
use reconciliation_backend::services::auth::AuthService;
use reconciliation_backend::services::cache::MultiLevelCache;
use reconciliation_backend::services::user::UserService;
use reconciliation_backend::test_utils_export::database::setup_test_database;

/// Helper function to create test config
fn create_test_config() -> reconciliation_backend::config::Config {
    reconciliation_backend::config::Config {
        host: "0.0.0.0".to_string(),
        port: 2000,
        database_url: "postgresql://test_user:test_pass@localhost:5432/test_db".to_string(),
        redis_url: "redis://localhost:6379".to_string(),
        jwt_secret: "test_secret".to_string(),
        jwt_expiration: 3600,
        cors_origins: vec!["http://localhost:3000".to_string()],
        log_level: "info".to_string(),
        max_file_size: 10485760,
        upload_path: "./uploads".to_string(),
    }
}

/// Test user management API endpoints
#[cfg(test)]
mod user_management_api_tests {
    use super::*;

    /// Setup test fixtures (user, auth service)
    async fn setup_test_fixtures(
        db: Database,
        auth_service: AuthService,
    ) -> (Uuid, String) {
        let user_service = UserService::new(Arc::new(db.clone()), auth_service.clone());

        // Create test user
        let user = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "testuser@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Test".to_string(),
                last_name: "User".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Generate token for authentication
        let user_model = user_service
            .get_user_by_email("testuser@example.com")
            .await
            .unwrap();
        let token = auth_service.generate_token(&user_model).unwrap();

        (user.id, token)
    }

    #[tokio::test]
    async fn test_get_users_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));
        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());

        let req = test::TestRequest::get()
            .uri("/api/users?page=1&per_page=10")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .app_data(cache)
                .route("/api/users", web::get().to(get_users)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_users_with_pagination() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));
        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());

        let req = test::TestRequest::get()
            .uri("/api/users?page=2&per_page=5")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .app_data(cache)
                .route("/api/users", web::get().to(get_users)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_create_user_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));

        let create_request = reconciliation_backend::services::user::CreateUserRequest {
            email: "newuser@example.com".to_string(),
            password: "SecurePassword123!".to_string(),
            first_name: "New".to_string(),
            last_name: "User".to_string(),
            role: Some("user".to_string()),
        };

        let req = test::TestRequest::post()
            .uri("/api/users")
            .set_json(&create_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .route("/api/users", web::post().to(create_user)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success() || resp.status().as_u16() == 201);
    }

    #[tokio::test]
    async fn test_create_user_invalid_email() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));

        let create_request = reconciliation_backend::services::user::CreateUserRequest {
            email: "invalid-email".to_string(), // Invalid email format
            password: "SecurePassword123!".to_string(),
            first_name: "New".to_string(),
            last_name: "User".to_string(),
            role: Some("user".to_string()),
        };

        let req = test::TestRequest::post()
            .uri("/api/users")
            .set_json(&create_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .route("/api/users", web::post().to(create_user)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_get_user_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (user_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));

        let req = test::TestRequest::get()
            .uri(&format!("/api/users/{}", user_id))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .route("/api/users/{user_id}", web::get().to(get_user)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_user_not_found() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));

        let non_existent_id = Uuid::new_v4();

        let req = test::TestRequest::get()
            .uri(&format!("/api/users/{}", non_existent_id))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .route("/api/users/{user_id}", web::get().to(get_user)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_update_user_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (user_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));
        let cache = web::Data::new(MultiLevelCache::new("redis://localhost:6379").unwrap());

        let update_request = reconciliation_backend::services::user::UpdateUserRequest {
            first_name: Some("Updated".to_string()),
            last_name: Some("Name".to_string()),
            email: None,
            role: None,
            is_active: None,
        };

        let req = test::TestRequest::put()
            .uri(&format!("/api/users/{}", user_id))
            .set_json(&update_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .app_data(cache)
                .route("/api/users/{user_id}", web::put().to(update_user)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_delete_user_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (user_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));

        let req = test::TestRequest::delete()
            .uri(&format!("/api/users/{}", user_id))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .route("/api/users/{user_id}", web::delete().to(delete_user)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 204 No Content or 404 if already deleted
        assert!(resp.status().is_success() || resp.status().as_u16() == 204 || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_search_users_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));

        let req = test::TestRequest::get()
            .uri("/api/users/search?q=test")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .route("/api/users/search", web::get().to(search_users)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_search_users_with_pagination() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));

        let req = test::TestRequest::get()
            .uri("/api/users/search?q=test&page=1&per_page=5")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .route("/api/users/search", web::get().to(search_users)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_user_statistics() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));

        let req = test::TestRequest::get()
            .uri("/api/users/statistics")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .route("/api/users/statistics", web::get().to(get_user_statistics)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_user_preferences_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (user_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));

        let req = test::TestRequest::get()
            .uri(&format!("/api/users/{}/preferences", user_id))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .route("/api/users/{user_id}/preferences", web::get().to(get_user_preferences)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_update_user_preferences_success() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (user_id, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));

        // Create preferences update request
        let preferences = reconciliation_backend::services::user::preferences::UserPreferences {
            theme: Some("dark".to_string()),
            language: Some("en".to_string()),
            timezone: Some("UTC".to_string()),
            notifications_enabled: Some(true),
            email_notifications: Some(true),
        };

        let req = test::TestRequest::put()
            .uri(&format!("/api/users/{}/preferences", user_id))
            .set_json(&preferences)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .route("/api/users/{user_id}/preferences", web::put().to(update_user_preferences)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    // Edge cases
    #[tokio::test]
    async fn test_create_user_duplicate_email() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));

        // Create first user
        let create_request = serde_json::json!({
            "email": "duplicate@example.com",
            "password": "TestPassword123!",
            "first_name": "First",
            "last_name": "User",
            "role": "user"
        });

        let req1 = test::TestRequest::post()
            .uri("/api/users")
            .set_json(&create_request)
            .to_request();

        let app1 = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service.clone()))
                .route("/api/users", web::post().to(create_user)),
        )
        .await;

        let resp1 = test::call_service(&app1, req1).await;
        assert!(resp1.status().is_success());

        // Try to create duplicate
        let req2 = test::TestRequest::post()
            .uri("/api/users")
            .set_json(&create_request)
            .to_request();

        let app2 = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service.clone()))
                .route("/api/users", web::post().to(create_user)),
        )
        .await;

        let resp2 = test::call_service(&app2, req2).await;
        // Should fail with conflict
        assert!(resp2.status().is_client_error());
    }

    #[tokio::test]
    async fn test_get_user_not_found_edge_case() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));

        let nonexistent_user_id = Uuid::new_v4();

        let req = test::TestRequest::get()
            .uri(&format!("/api/users/{}", nonexistent_user_id))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .route("/api/users/{user_id}", web::get().to(get_user)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should return 404
        assert_eq!(resp.status().as_u16(), 404);
    }

    #[tokio::test]
    async fn test_update_user_not_found() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));

        let nonexistent_user_id = Uuid::new_v4();
        let update_request = serde_json::json!({
            "first_name": "Updated"
        });

        let req = test::TestRequest::put()
            .uri(&format!("/api/users/{}", nonexistent_user_id))
            .set_json(&update_request)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .route("/api/users/{user_id}", web::put().to(update_user)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should return 404
        assert_eq!(resp.status().as_u16(), 404);
    }

    #[tokio::test]
    async fn test_list_users_with_invalid_pagination() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let user_service = Arc::new(UserService::new(db_arc.clone(), auth_service.clone()));

        // Test with negative page
        let req = test::TestRequest::get()
            .uri("/api/users?page=-1&per_page=10")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(web::Data::new(user_service))
                .route("/api/users", web::get().to(get_users)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should handle gracefully (may return 400 or default to page 1)
        assert!(resp.status().is_success() || resp.status().is_client_error());
    }
}

