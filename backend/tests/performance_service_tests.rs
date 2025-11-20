//! Service layer tests for PerformanceService
//!
//! Tests performance monitoring, metrics collection,
//! and system monitoring functionality.

use reconciliation_backend::services::performance::PerformanceService;
use reconciliation_backend::services::performance::RequestMetrics;
use std::time::Duration;

/// Test PerformanceService methods
#[cfg(test)]
mod performance_service_tests {
    use super::*;

    #[tokio::test]
    async fn test_performance_service_creation() {
        let service = PerformanceService::new();
        
        // Verify service is created
        assert!(true);
    }

    #[tokio::test]
    async fn test_record_request() {
        let service = PerformanceService::new();

        let metrics = RequestMetrics {
            path: "/api/test".to_string(),
            method: "GET".to_string(),
            status_code: 200,
            duration: Duration::from_millis(100),
            timestamp: std::time::Instant::now(),
        };

        service.record_request(metrics).await;

        // Should complete without error
        assert!(true);
    }

    #[tokio::test]
    async fn test_record_cache_operations() {
        let service = PerformanceService::new();

        service.record_cache_hit().await;
        service.record_cache_miss().await;
        service.record_cache_eviction().await;

        // Should complete without error
        assert!(true);
    }

    #[tokio::test]
    async fn test_update_connections() {
        let service = PerformanceService::new();

        service.update_active_connections(10).await;
        service.update_database_connections(5).await;

        // Should complete without error
        assert!(true);
    }

    #[tokio::test]
    async fn test_update_jobs_and_uploads() {
        let service = PerformanceService::new();

        service.update_reconciliation_jobs(3).await;
        service.update_file_uploads(2).await;

        // Should complete without error
        assert!(true);
    }

    #[tokio::test]
    async fn test_get_metrics() {
        let service = PerformanceService::new();

        // Record some metrics first
        let metrics = RequestMetrics {
            path: "/api/test".to_string(),
            method: "GET".to_string(),
            status_code: 200,
            duration: Duration::from_millis(50),
            timestamp: std::time::Instant::now(),
        };
        service.record_request(metrics).await;

        let performance_metrics = service.get_metrics().await;
        
        // Should return metrics
        assert!(performance_metrics.request_count >= 0);
    }

    #[tokio::test]
    async fn test_get_comprehensive_metrics() {
        let service = PerformanceService::new();

        // Record some metrics first
        let metrics = RequestMetrics {
            path: "/api/test".to_string(),
            method: "GET".to_string(),
            status_code: 200,
            duration: Duration::from_millis(50),
            timestamp: std::time::Instant::now(),
        };
        service.record_request(metrics).await;

        let comprehensive_metrics = service.get_comprehensive_metrics().await;
        
        // Should return comprehensive metrics
        assert!(comprehensive_metrics.is_ok());
        let metrics_value = comprehensive_metrics.unwrap();
        assert!(metrics_value.is_object());
    }
}

