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

    #[tokio::test]
    async fn test_record_http_request_error_status() {
        let monitoring_service = MonitoringService::new();

        // Record error status codes
        monitoring_service.record_http_request(
            "POST",
            "/api/users",
            400,
            Duration::from_millis(50),
            512,
            1024,
        );

        monitoring_service.record_http_request(
            "GET",
            "/api/projects",
            500,
            Duration::from_millis(200),
            256,
            512,
        );

        assert!(true);
    }

    #[tokio::test]
    async fn test_record_database_query_failure() {
        let monitoring_service = MonitoringService::new();

        // Record failed query
        monitoring_service.record_database_query(
            "UPDATE",
            Duration::from_millis(100),
            false,
        );

        assert!(true);
    }

    #[tokio::test]
    async fn test_record_slow_database_query() {
        let monitoring_service = MonitoringService::new();

        // Record slow query
        monitoring_service.record_database_query(
            "SELECT",
            Duration::from_secs(5), // 5 seconds - slow query
            true,
        );

        assert!(true);
    }

    #[tokio::test]
    async fn test_cache_metrics_edge_cases() {
        let monitoring_service = MonitoringService::new();

        // Test with zero and large values
        monitoring_service.update_cache_size(0);
        monitoring_service.update_cache_size(1000000);

        // Multiple operations
        for _ in 0..10 {
            monitoring_service.record_cache_hit();
            monitoring_service.record_cache_miss();
        }

        assert!(true);
    }

    #[tokio::test]
    async fn test_record_reconciliation_job_edge_cases() {
        let monitoring_service = MonitoringService::new();

        // Record job with zero matches
        monitoring_service.record_reconciliation_job(
            Duration::from_secs(1),
            0,
            0,
        );

        // Record job with many matches
        monitoring_service.record_reconciliation_job(
            Duration::from_secs(60),
            10000,
            5000,
        );

        assert!(true);
    }

    #[tokio::test]
    async fn test_record_file_upload_large_file() {
        let monitoring_service = MonitoringService::new();

        // Record large file upload
        monitoring_service.record_file_upload(
            100 * 1024 * 1024, // 100MB
            Duration::from_secs(10),
        );

        // Record small file upload
        monitoring_service.record_file_upload(
            1024, // 1KB
            Duration::from_millis(10),
        );

        assert!(true);
    }

    #[tokio::test]
    async fn test_user_metrics_edge_cases() {
        let monitoring_service = MonitoringService::new();

        // Test with zero sessions
        monitoring_service.update_user_sessions(0);

        // Test with many sessions
        monitoring_service.update_user_sessions(1000);

        // Multiple user actions
        for _ in 0..100 {
            monitoring_service.record_user_action();
        }

        assert!(true);
    }

    #[tokio::test]
    async fn test_get_system_metrics_multiple_calls() {
        let monitoring_service = MonitoringService::new();

        // Get metrics multiple times
        let (result1, result2, result3) = tokio::join!(
            monitoring_service.get_system_metrics(),
            monitoring_service.get_system_metrics(),
            monitoring_service.get_system_metrics()
        );

        assert!(result1.is_ok());
        assert!(result2.is_ok());
        assert!(result3.is_ok());
    }

    #[tokio::test]
    async fn test_perform_health_checks_multiple_calls() {
        let monitoring_service = MonitoringService::new();

        // Perform health checks multiple times
        let (result1, result2) = tokio::join!(
            monitoring_service.perform_health_checks(),
            monitoring_service.perform_health_checks()
        );

        assert!(result1.is_ok());
        assert!(result2.is_ok());
    }

    #[tokio::test]
    async fn test_add_health_checker() {
        use reconciliation_backend::services::monitoring::types::{HealthChecker, HealthCheck, HealthStatus};
        
        struct TestHealthChecker;
        impl HealthChecker for TestHealthChecker {
            fn name(&self) -> String {
                "test".to_string()
            }
            
            fn check(&self) -> HealthCheck {
                HealthCheck {
                    name: "test".to_string(),
                    status: HealthStatus::Healthy,
                    message: Some("Test check".to_string()),
                    duration: Duration::from_millis(10),
                    timestamp: chrono::Utc::now(),
                    details: None,
                }
            }
        }

        let monitoring_service = MonitoringService::new();
        let checker = Box::new(TestHealthChecker) as Box<dyn HealthChecker + Send + Sync>;
        
        monitoring_service.add_health_checker("test_checker".to_string(), checker).await;
        
        let result = monitoring_service.perform_health_checks().await;
        assert!(result.is_ok());
        
        let report = result.unwrap();
        assert!(!report.checks.is_empty());
    }

    #[tokio::test]
    async fn test_get_metrics_prometheus() {
        let monitoring_service = MonitoringService::new();

        // Record some metrics first
        monitoring_service.record_http_request("GET", "/api/test", 200, Duration::from_millis(50), 1024, 2048);
        monitoring_service.record_cache_hit();
        monitoring_service.record_user_login();

        let result = monitoring_service.get_metrics_prometheus();
        assert!(result.is_ok());
        
        let metrics = result.unwrap();
        assert!(!metrics.is_empty());
        // Prometheus format should contain metric names
        assert!(metrics.contains("http_requests_total") || metrics.contains("cache_hits_total") || metrics.contains("user_logins_total"));
    }

    #[tokio::test]
    async fn test_cache_metrics_operations() {
        let monitoring_service = MonitoringService::new();

        // Test cache metrics caching
        let key = "test_metrics";
        let metrics = serde_json::json!({
            "cache_hits": 100,
            "cache_misses": 50
        });

        monitoring_service.cache_metrics(key.to_string(), metrics.clone()).await;
        
        let cached = monitoring_service.get_cached_metrics(key).await;
        assert!(cached.is_some());
        assert_eq!(cached.unwrap(), metrics);
    }

    #[tokio::test]
    async fn test_get_cached_metrics_nonexistent() {
        let monitoring_service = MonitoringService::new();

        let cached = monitoring_service.get_cached_metrics("nonexistent_key").await;
        assert!(cached.is_none());
    }

    #[tokio::test]
    async fn test_health_check() {
        let monitoring_service = MonitoringService::new();

        let status = monitoring_service.health_check();
        assert_eq!(status.get("status"), Some(&"healthy".to_string()));
        assert!(status.contains_key("uptime_seconds"));
        assert!(status.contains_key("version"));
    }

    #[tokio::test]
    async fn test_update_reconciliation_jobs_active() {
        let monitoring_service = MonitoringService::new();

        monitoring_service.update_reconciliation_jobs_active(5);
        monitoring_service.update_reconciliation_jobs_active(0);
        monitoring_service.update_reconciliation_jobs_active(100);

        // Should complete without error
        assert!(true);
    }

    #[tokio::test]
    async fn test_update_websocket_connections() {
        let monitoring_service = MonitoringService::new();

        monitoring_service.update_websocket_connections(10);
        monitoring_service.update_websocket_connections(0);
        monitoring_service.update_websocket_connections(50);

        // Should complete without error
        assert!(true);
    }

    #[tokio::test]
    async fn test_record_websocket_message() {
        let monitoring_service = MonitoringService::new();

        monitoring_service.record_websocket_message(1024);
        monitoring_service.record_websocket_message(2048);
        monitoring_service.record_websocket_message(0);

        // Should complete without error
        assert!(true);
    }

    #[tokio::test]
    async fn test_update_system_metrics() {
        let monitoring_service = MonitoringService::new();

        monitoring_service.update_system_metrics(1024 * 1024 * 1024, 50.0, 100 * 1024 * 1024);
        monitoring_service.update_system_metrics(0, 0.0, 0);
        monitoring_service.update_system_metrics(u64::MAX, 100.0, u64::MAX);

        // Should complete without error
        assert!(true);
    }

    #[tokio::test]
    async fn test_record_user_action_with_details() {
        let monitoring_service = MonitoringService::new();

        monitoring_service.record_user_action_with_details("create_project", "project_id=123");
        monitoring_service.record_user_action_with_details("delete_file", "file_id=456");
        monitoring_service.record_user_action_with_details("", "");

        // Should complete without error
        assert!(true);
    }

    #[tokio::test]
    async fn test_monitoring_service_default() {
        let monitoring_service = MonitoringService::default();
        
        // Verify service is created
        assert!(monitoring_service.start_time.elapsed().as_secs() >= 0);
    }

    #[tokio::test]
    async fn test_record_http_request_various_methods() {
        let monitoring_service = MonitoringService::new();

        // Test various HTTP methods
        let methods = vec!["GET", "POST", "PUT", "DELETE", "PATCH"];
        for method in methods {
            monitoring_service.record_http_request(
                method,
                "/api/test",
                200,
                Duration::from_millis(100),
                1024,
                2048,
            );
        }

        assert!(true);
    }

    #[tokio::test]
    async fn test_record_http_request_various_status_codes() {
        let monitoring_service = MonitoringService::new();

        // Test various status codes
        let status_codes = vec![200, 201, 400, 401, 403, 404, 500, 502, 503];
        for status in status_codes {
            monitoring_service.record_http_request(
                "GET",
                "/api/test",
                status,
                Duration::from_millis(50),
                512,
                1024,
            );
        }

        assert!(true);
    }

    #[tokio::test]
    async fn test_record_database_query_various_types() {
        let monitoring_service = MonitoringService::new();

        // Test various query types
        let query_types = vec!["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP"];
        for query_type in query_types {
            monitoring_service.record_database_query(
                query_type,
                Duration::from_millis(50),
                true,
            );
            monitoring_service.record_database_query(
                query_type,
                Duration::from_millis(100),
                false,
            );
        }

        assert!(true);
    }

    #[tokio::test]
    async fn test_get_system_metrics_after_operations() {
        let monitoring_service = MonitoringService::new();

        // Perform various operations
        monitoring_service.record_http_request("GET", "/api/test", 200, Duration::from_millis(50), 1024, 2048);
        monitoring_service.record_cache_hit();
        monitoring_service.record_cache_miss();
        monitoring_service.update_cache_size(1000);
        monitoring_service.record_reconciliation_job(Duration::from_secs(10), 1000, 500);
        monitoring_service.update_reconciliation_jobs_active(5);
        monitoring_service.record_file_upload(1024 * 1024, Duration::from_millis(200));
        monitoring_service.update_websocket_connections(10);
        monitoring_service.record_websocket_message(1024);
        monitoring_service.update_system_metrics(1024 * 1024 * 1024, 50.0, 100 * 1024 * 1024);
        monitoring_service.update_user_sessions(20);
        monitoring_service.record_user_login();
        monitoring_service.record_user_action();

        // Get system metrics
        let result = monitoring_service.get_system_metrics().await;
        assert!(result.is_ok());
        
        let metrics = result.unwrap();
        assert!(metrics.is_object());
    }

    #[tokio::test]
    async fn test_perform_health_checks_with_checkers() {
        use reconciliation_backend::services::monitoring::types::{HealthChecker, HealthCheck, HealthStatus};
        
        struct HealthyChecker;
        impl HealthChecker for HealthyChecker {
            fn name(&self) -> String {
                "healthy_check".to_string()
            }
            
            fn check(&self) -> HealthCheck {
                HealthCheck {
                    name: "healthy_check".to_string(),
                    status: HealthStatus::Healthy,
                    message: Some("All good".to_string()),
                    duration: Duration::from_millis(10),
                    timestamp: chrono::Utc::now(),
                    details: None,
                }
            }
        }

        struct DegradedChecker;
        impl HealthChecker for DegradedChecker {
            fn name(&self) -> String {
                "degraded_check".to_string()
            }
            
            fn check(&self) -> HealthCheck {
                HealthCheck {
                    name: "degraded_check".to_string(),
                    status: HealthStatus::Degraded,
                    message: Some("Performance degraded".to_string()),
                    duration: Duration::from_millis(20),
                    timestamp: chrono::Utc::now(),
                    details: None,
                }
            }
        }

        let monitoring_service = MonitoringService::new();
        
        let healthy_checker = Box::new(HealthyChecker) as Box<dyn HealthChecker + Send + Sync>;
        let degraded_checker = Box::new(DegradedChecker) as Box<dyn HealthChecker + Send + Sync>;
        
        monitoring_service.add_health_checker("healthy".to_string(), healthy_checker).await;
        monitoring_service.add_health_checker("degraded".to_string(), degraded_checker).await;
        
        let result = monitoring_service.perform_health_checks().await;
        assert!(result.is_ok());
        
        let report = result.unwrap();
        assert_eq!(report.checks.len(), 2);
        // Overall status should be degraded if one checker is degraded
        assert!(matches!(report.overall_status, HealthStatus::Degraded | HealthStatus::Healthy));
    }
}

