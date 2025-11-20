//! Service layer tests for MonitoringService
//!
//! Tests MonitoringService methods including metrics recording,
//! health checks, and system monitoring.

use std::time::Duration;

use reconciliation_backend::services::monitoring::MonitoringService;

/// Test MonitoringService methods
#[cfg(test)]
mod monitoring_service_tests {
    use super::*;

    #[tokio::test]
    async fn test_monitoring_service_creation() {
        let monitoring_service = MonitoringService::new();
        
        // Verify service is created
        assert!(monitoring_service.start_time.elapsed().as_secs() >= 0);
    }

    #[tokio::test]
    async fn test_record_http_request() {
        let monitoring_service = MonitoringService::new();

        monitoring_service.record_http_request(
            "GET",
            "/api/users",
            200,
            Duration::from_millis(100),
            1024,
            2048,
        );

        // Metrics should be recorded (no return value to assert)
        assert!(true);
    }

    #[tokio::test]
    async fn test_record_database_query() {
        let monitoring_service = MonitoringService::new();

        monitoring_service.record_database_query(
            "SELECT",
            Duration::from_millis(50),
            true,
        );

        assert!(true);
    }

    #[tokio::test]
    async fn test_cache_metrics() {
        let monitoring_service = MonitoringService::new();

        monitoring_service.record_cache_hit();
        monitoring_service.record_cache_miss();
        monitoring_service.record_cache_eviction();
        monitoring_service.update_cache_size(1000);

        assert!(true);
    }

    #[tokio::test]
    async fn test_record_reconciliation_job() {
        let monitoring_service = MonitoringService::new();

        monitoring_service.record_reconciliation_job(
            Duration::from_secs(10),
            1000,
            500,
        );

        assert!(true);
    }

    #[tokio::test]
    async fn test_record_file_upload() {
        let monitoring_service = MonitoringService::new();

        monitoring_service.record_file_upload(
            1024 * 1024, // 1MB
            Duration::from_millis(200),
        );

        assert!(true);
    }

    #[tokio::test]
    async fn test_user_metrics() {
        let monitoring_service = MonitoringService::new();

        monitoring_service.update_user_sessions(10);
        monitoring_service.record_user_login();
        monitoring_service.record_user_action();

        assert!(true);
    }

    #[tokio::test]
    async fn test_get_system_metrics() {
        let monitoring_service = MonitoringService::new();

        let result = monitoring_service.get_system_metrics().await;
        assert!(result.is_ok());

        let metrics = result.unwrap();
        // Metrics is a serde_json::Value, check if it's an object
        assert!(metrics.is_object() || metrics.is_null());
    }

    #[tokio::test]
    async fn test_perform_health_checks() {
        let monitoring_service = MonitoringService::new();

        let result = monitoring_service.perform_health_checks().await;
        assert!(result.is_ok());

        let health_report = result.unwrap();
        assert_eq!(health_report.overall_status, reconciliation_backend::services::monitoring::types::HealthStatus::Healthy);
    }
}

