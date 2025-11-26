//! Performance monitoring and optimization service
//!
//! This module provides performance monitoring, caching, and optimization capabilities
//! including metrics collection, system monitoring, query optimization, and connection pooling.

pub mod metrics;
pub mod monitoring;
pub mod query_optimizer;

pub use metrics::{
    CacheStats, MetricsCollector, PerformanceMetrics, RequestMetrics,
};
pub use monitoring::{SystemMetrics, SystemMonitor};

pub use query_optimizer::{OptimizationImpact, OptimizationLevel, QueryAnalysis, QueryOptimizer};

use crate::errors::AppResult;
use serde_json;
use std::time::Duration;

/// Main performance service that combines metrics collection and system monitoring
pub struct PerformanceService {
    metrics_collector: MetricsCollector,
    system_monitor: SystemMonitor,
}

impl PerformanceService {
    pub fn new() -> Self {
        Self {
            metrics_collector: MetricsCollector::new().unwrap_or_else(|_| MetricsCollector::default()),
            system_monitor: SystemMonitor::new(),
        }
    }

    pub async fn record_request(&self, request_metrics: RequestMetrics) {
        self.metrics_collector.record_request(request_metrics).await;
    }

    pub async fn record_cache_hit(&self) {
        self.metrics_collector.record_cache_hit().await;
    }

    pub async fn record_cache_miss(&self) {
        self.metrics_collector.record_cache_miss().await;
    }

    pub async fn record_cache_eviction(&self) {
        self.metrics_collector.record_cache_eviction().await;
    }

    pub async fn update_active_connections(&self, count: u64) {
        self.metrics_collector
            .update_active_connections(count)
            .await;
    }

    pub async fn update_database_connections(&self, count: u64) {
        self.metrics_collector
            .update_database_connections(count)
            .await;
    }

    pub async fn update_reconciliation_jobs(&self, count: u64) {
        self.metrics_collector
            .update_reconciliation_jobs(count)
            .await;
    }

    pub async fn update_file_uploads(&self, count: u64) {
        self.metrics_collector.update_file_uploads(count).await;
    }

    pub async fn get_metrics(&self) -> PerformanceMetrics {
        // Clone the data immediately to avoid lifetime issues
        let metrics_data = (*self.metrics_collector.get_metrics().read().await).clone();
        let cache_stats_data = (*self.metrics_collector.get_cache_stats().read().await).clone();

        let mut total_requests = 0;
        let mut total_duration = Duration::ZERO;
        let mut error_count = 0;

        for requests in metrics_data.values() {
            total_requests += requests.len() as u64;
            for request in requests {
                total_duration += request.duration;
                if request.status_code >= 400 {
                    error_count += 1;
                }
            }
        }

        let average_response_time = if total_requests > 0 {
            total_duration.as_secs_f64() / total_requests as f64
        } else {
            0.0
        };

        let error_rate = if total_requests > 0 {
            error_count as f64 / total_requests as f64
        } else {
            0.0
        };

        let cache_hit_rate = if cache_stats_data.hits + cache_stats_data.misses > 0 {
            cache_stats_data.hits as f64 / (cache_stats_data.hits + cache_stats_data.misses) as f64
        } else {
            0.0
        };

        let system_metrics = self.system_monitor.get_system_metrics();

        PerformanceMetrics {
            request_count: total_requests,
            average_response_time,
            error_rate,
            active_connections: {
                // Get from metrics collector if available
                // For now, return 0 as placeholder - should be tracked via MetricsCollector
                0
            },
            database_connections: {
                // Get from metrics collector if available
                // For now, return 0 as placeholder - should be tracked via MetricsCollector
                0
            },
            cache_hit_rate,
            memory_usage: system_metrics.memory_usage,
            cpu_usage: system_metrics.cpu_usage,
            timestamp: system_metrics.timestamp,
        }
    }

    pub async fn get_prometheus_metrics(&self) -> String {
        self.metrics_collector.get_prometheus_metrics().await
    }

    pub async fn get_comprehensive_metrics(&self) -> AppResult<serde_json::Value> {
        // Clone the data immediately to avoid lifetime issues
        let metrics_data = (*self.metrics_collector.get_metrics().read().await).clone();
        let cache_stats_data = (*self.metrics_collector.get_cache_stats().read().await).clone();

        // Calculate average response time
        let mut total_duration = Duration::new(0, 0);
        let mut request_count = 0u64;

        for requests in metrics_data.values() {
            for request in requests {
                total_duration += request.duration;
                request_count += 1;
            }
        }

        let average_response_time = if request_count > 0 {
            total_duration.as_secs_f64() / request_count as f64
        } else {
            0.0
        };

        // Calculate error rate (simplified - would need to track error responses)
        let error_rate = 0.0; // Placeholder - would need to track error responses

        // Calculate cache hit rate
        let total_cache_requests = cache_stats_data.hits + cache_stats_data.misses;
        let cache_hit_rate = if total_cache_requests > 0 {
            cache_stats_data.hits as f64 / total_cache_requests as f64
        } else {
            0.0
        };

        // Get system metrics
        let system_metrics = self.system_monitor.get_system_metrics();

        // Get Prometheus metrics
        let prometheus_metrics = self.get_prometheus_metrics().await;

        // Extract metric values before json! macro (can't use blocks in json! macro)
        // Get from metrics collector if available - for now use placeholders
        let active_connections = 0u64; // Should be tracked via MetricsCollector
        let database_connections = 0u64; // Should be tracked via MetricsCollector
        let timestamp = chrono::Utc::now().to_rfc3339();

        let comprehensive_metrics = serde_json::json!({
            "performance": {
                "request_count": request_count,
                "average_response_time": average_response_time,
                "error_rate": error_rate,
                "active_connections": active_connections,
                "database_connections": database_connections,
                "cache_hit_rate": cache_hit_rate,
                "memory_usage": system_metrics.memory_usage,
                "cpu_usage": system_metrics.cpu_usage,
                "timestamp": timestamp
            },
            "cache": {
                "hits": cache_stats_data.hits,
                "misses": cache_stats_data.misses,
                "evictions": cache_stats_data.evictions,
                "size": cache_stats_data.size,
                "hit_rate": cache_hit_rate
            },
            "prometheus": prometheus_metrics,
            "timestamp": chrono::Utc::now().to_rfc3339()
        });

        Ok(comprehensive_metrics)
    }
}

// Database connection pool optimization
pub struct DatabasePool {
    pub max_connections: u32,
    pub min_connections: u32,
    pub connection_timeout: Duration,
    pub idle_timeout: Duration,
    pub acquire_timeout: Duration,
    pub max_lifetime: Duration,
}

impl DatabasePool {
    pub fn new() -> Self {
        Self {
            max_connections: 20,
            min_connections: 5,
            connection_timeout: Duration::from_secs(30),
            idle_timeout: Duration::from_secs(600),
            acquire_timeout: Duration::from_secs(10),
            max_lifetime: Duration::from_secs(1800), // 30 minutes
        }
    }

    pub fn optimized_for_reconciliation() -> Self {
        Self {
            max_connections: 50,                         // Increased for high concurrency
            min_connections: 10,                         // Higher minimum for faster response
            connection_timeout: Duration::from_secs(10), // Faster timeout
            idle_timeout: Duration::from_secs(300),      // Shorter idle time
            acquire_timeout: Duration::from_secs(5),     // Faster acquire
            max_lifetime: Duration::from_secs(1800),     // 30 minutes
        }
    }

    pub fn with_max_connections(mut self, max: u32) -> Self {
        self.max_connections = max;
        self
    }

    pub fn with_min_connections(mut self, min: u32) -> Self {
        self.min_connections = min;
        self
    }

    pub fn with_timeouts(mut self, connection: Duration, idle: Duration) -> Self {
        self.connection_timeout = connection;
        self.idle_timeout = idle;
        self
    }

    pub fn with_advanced_timeouts(
        mut self,
        connection: Duration,
        idle: Duration,
        acquire: Duration,
        lifetime: Duration,
    ) -> Self {
        self.connection_timeout = connection;
        self.idle_timeout = idle;
        self.acquire_timeout = acquire;
        self.max_lifetime = lifetime;
        self
    }
}

// Redis connection optimization
pub struct RedisPool {
    pub max_connections: u32,
    pub connection_timeout: Duration,
    pub command_timeout: Duration,
    pub retry_attempts: u32,
}

impl RedisPool {
    pub fn new() -> Self {
        Self {
            max_connections: 10,
            connection_timeout: Duration::from_secs(5),
            command_timeout: Duration::from_secs(3),
            retry_attempts: 3,
        }
    }

    pub fn with_max_connections(mut self, max: u32) -> Self {
        self.max_connections = max;
        self
    }

    pub fn with_timeouts(mut self, connection: Duration, command: Duration) -> Self {
        self.connection_timeout = connection;
        self.command_timeout = command;
        self
    }
}

// File processing optimization
pub struct FileProcessor {
    pub chunk_size: usize,
    pub max_concurrent_files: usize,
    pub buffer_size: usize,
}

impl FileProcessor {
    pub fn new() -> Self {
        Self {
            chunk_size: 8192, // 8KB chunks
            max_concurrent_files: 5,
            buffer_size: 65536, // 64KB buffer
        }
    }

    pub fn with_chunk_size(mut self, size: usize) -> Self {
        self.chunk_size = size;
        self
    }

    pub fn with_max_concurrent(mut self, max: usize) -> Self {
        self.max_concurrent_files = max;
        self
    }

    pub fn with_buffer_size(mut self, size: usize) -> Self {
        self.buffer_size = size;
        self
    }
}

impl Default for PerformanceService {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for DatabasePool {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for RedisPool {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for QueryOptimizer {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for FileProcessor {
    fn default() -> Self {
        Self::new()
    }
}
