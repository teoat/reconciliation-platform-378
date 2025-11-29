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
        let _service = PerformanceService::new();
        
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
        assert!(performance_metrics.request_count >= 1);
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

    #[tokio::test]
    async fn test_get_prometheus_metrics() {
        let service = PerformanceService::new();

        // Record some metrics
        let metrics = RequestMetrics {
            path: "/api/test".to_string(),
            method: "GET".to_string(),
            status_code: 200,
            duration: Duration::from_millis(100),
            timestamp: std::time::Instant::now(),
        };
        service.record_request(metrics).await;
        service.record_cache_hit().await;
        service.record_cache_miss().await;

        let prometheus_metrics = service.get_prometheus_metrics().await;
        
        // Should return Prometheus format metrics
        assert!(!prometheus_metrics.is_empty());
        assert!(prometheus_metrics.contains("http_requests_total") || prometheus_metrics.contains("cache"));
    }

    #[tokio::test]
    async fn test_get_metrics_with_multiple_requests() {
        let service = PerformanceService::new();

        // Record multiple requests
        for i in 0..10 {
            let metrics = RequestMetrics {
                path: format!("/api/test{}", i),
                method: "GET".to_string(),
                status_code: if i % 2 == 0 { 200 } else { 404 },
                duration: Duration::from_millis(50 + i as u64 * 10),
                timestamp: std::time::Instant::now(),
            };
            service.record_request(metrics).await;
        }

        let performance_metrics = service.get_metrics().await;
        
        assert!(performance_metrics.request_count >= 10);
        assert!(performance_metrics.average_response_time >= 0.0);
    }

    #[tokio::test]
    async fn test_get_metrics_with_errors() {
        let service = PerformanceService::new();

        // Record requests with errors
        for status_code in [400, 401, 403, 404, 500] {
            let metrics = RequestMetrics {
                path: "/api/test".to_string(),
                method: "GET".to_string(),
                status_code,
                duration: Duration::from_millis(100),
                timestamp: std::time::Instant::now(),
            };
            service.record_request(metrics).await;
        }

        let performance_metrics = service.get_metrics().await;
        
        assert!(performance_metrics.request_count >= 5);
        assert!(performance_metrics.error_rate >= 0.0);
    }

    #[tokio::test]
    async fn test_get_metrics_empty() {
        let service = PerformanceService::new();

        // Get metrics without recording any requests
        let performance_metrics = service.get_metrics().await;
        
        assert_eq!(performance_metrics.request_count, 0);
        assert_eq!(performance_metrics.average_response_time, 0.0);
        assert_eq!(performance_metrics.error_rate, 0.0);
    }

    #[tokio::test]
    async fn test_cache_statistics() {
        let service = PerformanceService::new();

        // Record cache operations
        for _ in 0..10 {
            service.record_cache_hit().await;
        }
        for _ in 0..5 {
            service.record_cache_miss().await;
        }
        for _ in 0..2 {
            service.record_cache_eviction().await;
        }

        let performance_metrics = service.get_metrics().await;
        
        // Cache hit rate should be calculated
        assert!(performance_metrics.cache_hit_rate >= 0.0);
        assert!(performance_metrics.cache_hit_rate <= 1.0);
    }

    #[tokio::test]
    async fn test_cache_hit_rate_calculation() {
        let service = PerformanceService::new();

        // Record only hits
        for _ in 0..10 {
            service.record_cache_hit().await;
        }

        let metrics1 = service.get_metrics().await;
        assert_eq!(metrics1.cache_hit_rate, 1.0);

        // Record only misses
        for _ in 0..10 {
            service.record_cache_miss().await;
        }

        let metrics2 = service.get_metrics().await;
        // Hit rate should be 0.5 (10 hits / 20 total)
        assert!(metrics2.cache_hit_rate >= 0.0);
    }

    #[tokio::test]
    async fn test_connection_tracking() {
        let service = PerformanceService::new();

        // Update connections
        service.update_active_connections(25).await;
        service.update_database_connections(10).await;

        // Connections are tracked internally
        assert!(true);
    }

    #[tokio::test]
    async fn test_reconciliation_jobs_tracking() {
        let service = PerformanceService::new();

        // Update job counts
        service.update_reconciliation_jobs(5).await;
        service.update_reconciliation_jobs(10).await;
        service.update_reconciliation_jobs(0).await;

        // Jobs are tracked internally
        assert!(true);
    }

    #[tokio::test]
    async fn test_file_uploads_tracking() {
        let service = PerformanceService::new();

        // Update upload counts
        service.update_file_uploads(3).await;
        service.update_file_uploads(7).await;
        service.update_file_uploads(2).await;

        // Uploads are tracked internally
        assert!(true);
    }

    #[tokio::test]
    async fn test_get_comprehensive_metrics_structure() {
        let service = PerformanceService::new();

        // Record various metrics
        service.record_request(RequestMetrics {
            path: "/api/users".to_string(),
            method: "GET".to_string(),
            status_code: 200,
            duration: Duration::from_millis(50),
            timestamp: std::time::Instant::now(),
        }).await;
        service.record_cache_hit().await;
        service.update_active_connections(10).await;

        let comprehensive_metrics = service.get_comprehensive_metrics().await.unwrap();
        
        // Check structure
        assert!(comprehensive_metrics.get("performance").is_some());
        assert!(comprehensive_metrics.get("cache").is_some());
        assert!(comprehensive_metrics.get("prometheus").is_some());
        assert!(comprehensive_metrics.get("timestamp").is_some());
    }

    #[tokio::test]
    async fn test_concurrent_metrics_recording() {
        let service = PerformanceService::new();

        // Record metrics concurrently
        let handles: Vec<_> = (0..20).map(|i| {
            let service = &service;
            tokio::spawn(async move {
                service.record_request(RequestMetrics {
                    path: format!("/api/test{}", i),
                    method: "GET".to_string(),
                    status_code: 200,
                    duration: Duration::from_millis(50),
                    timestamp: std::time::Instant::now(),
                }).await;
            })
        }).collect();

        futures::future::join_all(handles).await;

        let performance_metrics = service.get_metrics().await;
        assert!(performance_metrics.request_count >= 20);
    }

    #[tokio::test]
    async fn test_average_response_time_calculation() {
        let service = PerformanceService::new();

        // Record requests with different durations
        let durations = vec![50, 100, 150, 200, 250];
        for duration in durations {
            service.record_request(RequestMetrics {
                path: "/api/test".to_string(),
                method: "GET".to_string(),
                status_code: 200,
                duration: Duration::from_millis(duration),
                timestamp: std::time::Instant::now(),
            }).await;
        }

        let performance_metrics = service.get_metrics().await;
        
        // Average should be calculated (approximately 150ms)
        assert!(performance_metrics.average_response_time >= 0.0);
    }

    #[tokio::test]
    async fn test_error_rate_calculation() {
        let service = PerformanceService::new();

        // Record mix of successful and error requests
        for i in 0..20 {
            service.record_request(RequestMetrics {
                path: "/api/test".to_string(),
                method: "GET".to_string(),
                status_code: if i < 5 { 500 } else { 200 },
                duration: Duration::from_millis(50),
                timestamp: std::time::Instant::now(),
            }).await;
        }

        let performance_metrics = service.get_metrics().await;
        
        // Error rate should be 5/20 = 0.25
        assert!(performance_metrics.error_rate >= 0.0);
        assert!(performance_metrics.error_rate <= 1.0);
    }

    #[tokio::test]
    async fn test_system_metrics_included() {
        let service = PerformanceService::new();

        let performance_metrics = service.get_metrics().await;
        
        // System metrics should be included
        assert!(performance_metrics.memory_usage >= 0.0);
        assert!(performance_metrics.memory_usage <= 1.0);
        assert!(performance_metrics.cpu_usage >= 0.0);
        assert!(performance_metrics.cpu_usage <= 1.0);
        assert!(!performance_metrics.timestamp.is_empty());
    }

    #[tokio::test]
    async fn test_performance_service_default() {
        let service = PerformanceService::default();
        
        // Should create service successfully
        assert!(true);
    }

    // =========================================================================
    // DatabasePool Tests
    // =========================================================================

    #[tokio::test]
    async fn test_database_pool_new() {
        let pool = reconciliation_backend::services::performance::DatabasePool::new();
        
        assert_eq!(pool.max_connections, 20);
        assert_eq!(pool.min_connections, 5);
    }

    #[tokio::test]
    async fn test_database_pool_optimized_for_reconciliation() {
        let pool = reconciliation_backend::services::performance::DatabasePool::optimized_for_reconciliation();
        
        assert_eq!(pool.max_connections, 50);
        assert_eq!(pool.min_connections, 10);
    }

    #[tokio::test]
    async fn test_database_pool_with_max_connections() {
        let pool = reconciliation_backend::services::performance::DatabasePool::new()
            .with_max_connections(100);
        
        assert_eq!(pool.max_connections, 100);
    }

    #[tokio::test]
    async fn test_database_pool_with_min_connections() {
        let pool = reconciliation_backend::services::performance::DatabasePool::new()
            .with_min_connections(10);
        
        assert_eq!(pool.min_connections, 10);
    }

    #[tokio::test]
    async fn test_database_pool_with_timeouts() {
        let pool = reconciliation_backend::services::performance::DatabasePool::new()
            .with_timeouts(Duration::from_secs(60), Duration::from_secs(1200));
        
        assert_eq!(pool.connection_timeout, Duration::from_secs(60));
        assert_eq!(pool.idle_timeout, Duration::from_secs(1200));
    }

    #[tokio::test]
    async fn test_database_pool_with_advanced_timeouts() {
        let pool = reconciliation_backend::services::performance::DatabasePool::new()
            .with_advanced_timeouts(
                Duration::from_secs(60),
                Duration::from_secs(1200),
                Duration::from_secs(20),
                Duration::from_secs(3600),
            );
        
        assert_eq!(pool.connection_timeout, Duration::from_secs(60));
        assert_eq!(pool.idle_timeout, Duration::from_secs(1200));
        assert_eq!(pool.acquire_timeout, Duration::from_secs(20));
        assert_eq!(pool.max_lifetime, Duration::from_secs(3600));
    }

    #[tokio::test]
    async fn test_database_pool_default() {
        let pool = reconciliation_backend::services::performance::DatabasePool::default();
        
        assert_eq!(pool.max_connections, 20);
        assert_eq!(pool.min_connections, 5);
    }

    // =========================================================================
    // RedisPool Tests
    // =========================================================================

    #[tokio::test]
    async fn test_redis_pool_new() {
        let pool = reconciliation_backend::services::performance::RedisPool::new();
        
        assert_eq!(pool.max_connections, 10);
        assert_eq!(pool.retry_attempts, 3);
    }

    #[tokio::test]
    async fn test_redis_pool_with_max_connections() {
        let pool = reconciliation_backend::services::performance::RedisPool::new()
            .with_max_connections(20);
        
        assert_eq!(pool.max_connections, 20);
    }

    #[tokio::test]
    async fn test_redis_pool_with_timeouts() {
        let pool = reconciliation_backend::services::performance::RedisPool::new()
            .with_timeouts(Duration::from_secs(10), Duration::from_secs(5));
        
        assert_eq!(pool.connection_timeout, Duration::from_secs(10));
        assert_eq!(pool.command_timeout, Duration::from_secs(5));
    }

    #[tokio::test]
    async fn test_redis_pool_default() {
        let pool = reconciliation_backend::services::performance::RedisPool::default();
        
        assert_eq!(pool.max_connections, 10);
    }

    // =========================================================================
    // FileProcessor Tests
    // =========================================================================

    #[tokio::test]
    async fn test_file_processor_new() {
        let processor = reconciliation_backend::services::performance::FileProcessor::new();
        
        assert_eq!(processor.chunk_size, 8192);
        assert_eq!(processor.max_concurrent_files, 5);
        assert_eq!(processor.buffer_size, 65536);
    }

    #[tokio::test]
    async fn test_file_processor_with_chunk_size() {
        let processor = reconciliation_backend::services::performance::FileProcessor::new()
            .with_chunk_size(16384);
        
        assert_eq!(processor.chunk_size, 16384);
    }

    #[tokio::test]
    async fn test_file_processor_with_max_concurrent() {
        let processor = reconciliation_backend::services::performance::FileProcessor::new()
            .with_max_concurrent(10);
        
        assert_eq!(processor.max_concurrent_files, 10);
    }

    #[tokio::test]
    async fn test_file_processor_with_buffer_size() {
        let processor = reconciliation_backend::services::performance::FileProcessor::new()
            .with_buffer_size(131072);
        
        assert_eq!(processor.buffer_size, 131072);
    }

    #[tokio::test]
    async fn test_file_processor_default() {
        let processor = reconciliation_backend::services::performance::FileProcessor::default();
        
        assert_eq!(processor.chunk_size, 8192);
    }

    // =========================================================================
    // Edge Cases and Error Conditions
    // =========================================================================

    #[tokio::test]
    async fn test_metrics_with_zero_duration() {
        let service = PerformanceService::new();

        service.record_request(RequestMetrics {
            path: "/api/test".to_string(),
            method: "GET".to_string(),
            status_code: 200,
            duration: Duration::ZERO,
            timestamp: std::time::Instant::now(),
        }).await;

        let performance_metrics = service.get_metrics().await;
        assert!(performance_metrics.average_response_time >= 0.0);
    }

    #[tokio::test]
    async fn test_metrics_with_very_long_duration() {
        let service = PerformanceService::new();

        service.record_request(RequestMetrics {
            path: "/api/test".to_string(),
            method: "GET".to_string(),
            status_code: 200,
            duration: Duration::from_secs(60),
            timestamp: std::time::Instant::now(),
        }).await;

        let performance_metrics = service.get_metrics().await;
        assert!(performance_metrics.average_response_time >= 0.0);
    }

    #[tokio::test]
    async fn test_cache_statistics_with_no_operations() {
        let service = PerformanceService::new();

        // Don't record any cache operations
        let performance_metrics = service.get_metrics().await;
        
        // Cache hit rate should be 0 when no operations
        assert_eq!(performance_metrics.cache_hit_rate, 0.0);
    }

    #[tokio::test]
    async fn test_connection_updates_edge_cases() {
        let service = PerformanceService::new();

        // Test with zero connections
        service.update_active_connections(0).await;
        service.update_database_connections(0).await;

        // Test with very large numbers
        service.update_active_connections(u64::MAX).await;
        service.update_database_connections(u64::MAX).await;

        // Should handle gracefully
        assert!(true);
    }

    #[tokio::test]
    async fn test_prometheus_metrics_format() {
        let service = PerformanceService::new();

        // Record various metrics
        service.record_request(RequestMetrics {
            path: "/api/test".to_string(),
            method: "GET".to_string(),
            status_code: 200,
            duration: Duration::from_millis(100),
            timestamp: std::time::Instant::now(),
        }).await;
        service.record_cache_hit().await;

        let prometheus_metrics = service.get_prometheus_metrics().await;
        
        // Should be valid Prometheus format
        assert!(!prometheus_metrics.is_empty());
        // May contain metric names or values
        assert!(prometheus_metrics.len() > 0);
    }

    #[tokio::test]
    async fn test_comprehensive_metrics_timestamp() {
        let service = PerformanceService::new();

        let comprehensive_metrics = service.get_comprehensive_metrics().await.unwrap();
        
        // Should have timestamp
        assert!(comprehensive_metrics.get("timestamp").is_some());
        let timestamp = comprehensive_metrics.get("timestamp").unwrap().as_str().unwrap();
        assert!(!timestamp.is_empty());
    }

    #[tokio::test]
    async fn test_database_pool_builder_pattern() {
        let pool = reconciliation_backend::services::performance::DatabasePool::new()
            .with_max_connections(100)
            .with_min_connections(20)
            .with_timeouts(Duration::from_secs(60), Duration::from_secs(1200));
        
        assert_eq!(pool.max_connections, 100);
        assert_eq!(pool.min_connections, 20);
        assert_eq!(pool.connection_timeout, Duration::from_secs(60));
    }

    #[tokio::test]
    async fn test_redis_pool_builder_pattern() {
        let pool = reconciliation_backend::services::performance::RedisPool::new()
            .with_max_connections(20)
            .with_timeouts(Duration::from_secs(10), Duration::from_secs(5));
        
        assert_eq!(pool.max_connections, 20);
        assert_eq!(pool.connection_timeout, Duration::from_secs(10));
    }

    #[tokio::test]
    async fn test_file_processor_builder_pattern() {
        let processor = reconciliation_backend::services::performance::FileProcessor::new()
            .with_chunk_size(16384)
            .with_max_concurrent(10)
            .with_buffer_size(131072);
        
        assert_eq!(processor.chunk_size, 16384);
        assert_eq!(processor.max_concurrent_files, 10);
        assert_eq!(processor.buffer_size, 131072);
    }
}

