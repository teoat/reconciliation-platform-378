//! API endpoint tests for analytics handlers
//!
//! Tests all analytics API endpoints including dashboard data,
//! project statistics, user activity, and reconciliation statistics.

use actix_web::{test, web, App};
use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::analytics::{
    get_dashboard_data, get_project_stats, get_reconciliation_stats, get_user_activity,
};
use reconciliation_backend::services::auth::AuthService;
use reconciliation_backend::services::cache::MultiLevelCache;
use reconciliation_backend::services::project::ProjectService;
use reconciliation_backend::services::resilience::ResilienceManager;
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

/// Test analytics API endpoints
#[cfg(test)]
mod analytics_api_tests {
    use super::*;

    /// Setup test fixtures (user, project)
    async fn setup_test_fixtures(
        db: Database,
        auth_service: AuthService,
    ) -> (Uuid, Uuid, String) {
        let user_service = UserService::new(Arc::new(db.clone()), auth_service.clone());
        let project_service = ProjectService::new(db.clone());

        // Create test user
        let user = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "analyticsuser@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Analytics".to_string(),
                last_name: "User".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Create test project
        let project = project_service
            .create_project(reconciliation_backend::services::project::CreateProjectRequest {
                name: "Analytics Test Project".to_string(),
                description: Some("Test project for analytics".to_string()),
                owner_id: user.id,
                status: None,
                settings: None,
            })
            .await
            .unwrap();

        // Generate token for authentication
        let user_model = user_service
            .get_user_by_email("analyticsuser@example.com")
            .await
            .unwrap();
        let token = auth_service.generate_token(&user_model).unwrap();

        (user.id, project.id, token)
    }

    #[tokio::test]
    async fn test_get_dashboard_data() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);

        let cache = web::Data::new(Arc::new(MultiLevelCache::new("redis://localhost:6379").unwrap()));
        let resilience = web::Data::new(Arc::new(ResilienceManager::new()));
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::get()
            .uri("/api/analytics/dashboard")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(resilience)
                .app_data(config)
                .route("/api/analytics/dashboard", web::get().to(get_dashboard_data)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_project_stats() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, project_id, token) =
            setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let cache = web::Data::new(Arc::new(MultiLevelCache::new("redis://localhost:6379").unwrap()));
        let resilience = web::Data::new(Arc::new(ResilienceManager::new()));
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::get()
            .uri(&format!("/api/analytics/projects/{}/stats", project_id))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(resilience)
                .app_data(config)
                .route("/api/analytics/projects/{project_id}/stats", web::get().to(get_project_stats)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_get_user_activity() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (user_id, _, _) = setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let cache = web::Data::new(Arc::new(MultiLevelCache::new("redis://localhost:6379").unwrap()));
        let resilience = web::Data::new(Arc::new(ResilienceManager::new()));
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::get()
            .uri(&format!("/api/analytics/users/{}/activity", user_id))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(resilience)
                .app_data(config)
                .route("/api/analytics/users/{user_id}/activity", web::get().to(get_user_activity)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_get_reconciliation_stats() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);

        let cache = web::Data::new(Arc::new(MultiLevelCache::new("redis://localhost:6379").unwrap()));
        let resilience = web::Data::new(Arc::new(ResilienceManager::new()));
        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::get()
            .uri("/api/analytics/reconciliation/stats")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(cache)
                .app_data(resilience)
                .app_data(config)
                .route("/api/analytics/reconciliation/stats", web::get().to(get_reconciliation_stats)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }
}

