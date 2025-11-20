//! API endpoint tests for system and monitoring handlers
//!
//! Tests all system and monitoring API endpoints including status,
//! metrics, health checks, and alerts.

use actix_web::{test, web, App};
use std::sync::Arc;

use reconciliation_backend::handlers::monitoring::{
    get_alerts, get_health, get_metrics, get_system_metrics,
};
use reconciliation_backend::handlers::system::{get_metrics as get_system_metrics_legacy, system_status};
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

/// Test system and monitoring API endpoints
#[cfg(test)]
mod system_monitoring_api_tests {
    use super::*;

    #[tokio::test]
    async fn test_system_status() {
        let req = test::TestRequest::get()
            .uri("/api/system/status")
            .to_request();

        let app = test::init_service(
            App::new()
                .route("/api/system/status", web::get().to(system_status)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_system_metrics_legacy() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);

        let config = web::Data::new(create_test_config());

        let req = test::TestRequest::get()
            .uri("/api/system/metrics")
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db_arc.clone()))
                .app_data(config)
                .route("/api/system/metrics", web::get().to(get_system_metrics_legacy)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_monitoring_health() {
        let req = test::TestRequest::get()
            .uri("/api/monitoring/health")
            .to_request();

        let app = test::init_service(
            App::new()
                .route("/api/monitoring/health", web::get().to(get_health)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_monitoring_metrics() {
        let req = test::TestRequest::get()
            .uri("/api/monitoring/metrics")
            .to_request();

        let app = test::init_service(
            App::new()
                .route("/api/monitoring/metrics", web::get().to(get_metrics)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_alerts() {
        let req = test::TestRequest::get()
            .uri("/api/monitoring/alerts")
            .to_request();

        let app = test::init_service(
            App::new()
                .route("/api/monitoring/alerts", web::get().to(get_alerts)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_system_metrics() {
        let req = test::TestRequest::get()
            .uri("/api/monitoring/system")
            .to_request();

        let app = test::init_service(
            App::new()
                .route("/api/monitoring/system", web::get().to(get_system_metrics)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    // Edge cases
    #[tokio::test]
    async fn test_get_health_with_invalid_service() {
        let req = test::TestRequest::get()
            .uri("/api/monitoring/health?service=invalid_service")
            .to_request();

        let app = test::init_service(
            App::new()
                .route("/api/monitoring/health", web::get().to(get_health)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should handle invalid service gracefully
        assert!(resp.status().is_success() || resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_get_metrics_with_invalid_time_range() {
        let req = test::TestRequest::get()
            .uri("/api/monitoring/metrics?start_time=invalid&end_time=invalid")
            .to_request();

        let app = test::init_service(
            App::new()
                .route("/api/monitoring/metrics", web::get().to(get_metrics)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should handle invalid time range gracefully
        assert!(resp.status().is_success() || resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_get_alerts_with_invalid_severity() {
        let req = test::TestRequest::get()
            .uri("/api/monitoring/alerts?severity=invalid_severity")
            .to_request();

        let app = test::init_service(
            App::new()
                .route("/api/monitoring/alerts", web::get().to(get_alerts)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // Should handle invalid severity gracefully
        assert!(resp.status().is_success() || resp.status().is_client_error());
    }
}

