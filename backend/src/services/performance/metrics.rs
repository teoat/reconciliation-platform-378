//! Metrics collection module for performance monitoring
//!
//! This module handles Prometheus metrics collection, including counters,
//! gauges, and histograms for request tracking, cache statistics, and connection monitoring.

use prometheus::{Counter, Gauge, Histogram, HistogramOpts, Registry, TextEncoder};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use crate::errors::{AppError, AppResult};

// Performance monitoring data structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub request_count: u64,
    pub average_response_time: f64,
    pub error_rate: f64,
    pub active_connections: u64,
    pub database_connections: u64,
    pub cache_hit_rate: f64,
    pub memory_usage: f64,
    pub cpu_usage: f64,
    pub timestamp: String,
}

#[derive(Debug, Clone)]
pub struct RequestMetrics {
    pub method: String,
    pub path: String,
    pub status_code: u16,
    pub duration: Duration,
    pub timestamp: Instant,
}

#[derive(Debug, Clone)]
pub struct CacheStats {
    pub hits: u64,
    pub misses: u64,
    pub evictions: u64,
    pub size: u64,
}

/// Metrics collection service
pub struct MetricsCollector {
    pub metrics: Arc<RwLock<HashMap<String, Vec<RequestMetrics>>>>,
    pub cache_stats: Arc<RwLock<CacheStats>>,
    pub registry: Registry,
    pub request_counter: Option<Counter>,
    pub request_duration: Option<Histogram>,
    pub active_connections: Option<Gauge>,
    pub database_connections: Option<Gauge>,
    pub cache_hits: Option<Counter>,
    pub cache_misses: Option<Counter>,
    pub reconciliation_jobs: Option<Gauge>,
    pub file_uploads: Option<Gauge>,
}

impl MetricsCollector {
    pub fn new() -> AppResult<Self> {
        let registry = Registry::new();

        let request_counter = Counter::new(
            "http_requests_total",
            "Total number of HTTP requests"
        ).map_err(|e| {
            log::error!("Failed to create REQUEST_COUNTER metric: {}", e);
            AppError::Monitoring(format!("Failed to initialize REQUEST_COUNTER: {}", e))
        })?;
        registry.register(Box::new(request_counter.clone())).map_err(|e| {
            log::error!("Failed to register REQUEST_COUNTER metric: {}", e);
            AppError::Monitoring(format!("Failed to register REQUEST_COUNTER: {}", e))
        })?;

        let request_duration = Histogram::with_opts(
            HistogramOpts::new("http_request_duration_seconds", "HTTP request duration in seconds")
                .buckets(vec![0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0])
        ).map_err(|e| {
            log::error!("Failed to create REQUEST_DURATION metric: {}", e);
            AppError::Monitoring(format!("Failed to initialize REQUEST_DURATION: {}", e))
        })?;
        registry.register(Box::new(request_duration.clone())).map_err(|e| {
            log::error!("Failed to register REQUEST_DURATION metric: {}", e);
            AppError::Monitoring(format!("Failed to register REQUEST_DURATION: {}", e))
        })?;

        let active_connections = Gauge::new(
            "active_connections",
            "Number of active connections"
        ).map_err(|e| {
            log::error!("Failed to create ACTIVE_CONNECTIONS metric: {}", e);
            AppError::Monitoring(format!("Failed to initialize ACTIVE_CONNECTIONS: {}", e))
        })?;
        registry.register(Box::new(active_connections.clone())).map_err(|e| {
            log::error!("Failed to register ACTIVE_CONNECTIONS metric: {}", e);
            AppError::Monitoring(format!("Failed to register ACTIVE_CONNECTIONS: {}", e))
        })?;

        let database_connections = Gauge::new(
            "database_connections",
            "Number of database connections"
        ).map_err(|e| {
            log::error!("Failed to create DATABASE_CONNECTIONS metric: {}", e);
            AppError::Monitoring(format!("Failed to initialize DATABASE_CONNECTIONS: {}", e))
        })?;
        registry.register(Box::new(database_connections.clone())).map_err(|e| {
            log::error!("Failed to register DATABASE_CONNECTIONS metric: {}", e);
            AppError::Monitoring(format!("Failed to register DATABASE_CONNECTIONS: {}", e))
        })?;

        let cache_hits = Counter::new(
            "cache_hits_total",
            "Total number of cache hits"
        ).map_err(|e| {
            log::error!("Failed to create CACHE_HITS metric: {}", e);
            AppError::Monitoring(format!("Failed to initialize CACHE_HITS: {}", e))
        })?;
        registry.register(Box::new(cache_hits.clone())).map_err(|e| {
            log::error!("Failed to register CACHE_HITS metric: {}", e);
            AppError::Monitoring(format!("Failed to register CACHE_HITS: {}", e))
        })?;

        let cache_misses = Counter::new(
            "cache_misses_total",
            "Total number of cache misses"
        ).map_err(|e| {
            log::error!("Failed to create CACHE_MISSES metric: {}", e);
            AppError::Monitoring(format!("Failed to initialize CACHE_MISSES: {}", e))
        })?;
        registry.register(Box::new(cache_misses.clone())).map_err(|e| {
            log::error!("Failed to register CACHE_MISSES metric: {}", e);
            AppError::Monitoring(format!("Failed to register CACHE_MISSES: {}", e))
        })?;

        let reconciliation_jobs = Gauge::new(
            "reconciliation_jobs_active",
            "Number of active reconciliation jobs"
        ).map_err(|e| {
            log::error!("Failed to create RECONCILIATION_JOBS metric: {}", e);
            AppError::Monitoring(format!("Failed to initialize RECONCILIATION_JOBS: {}", e))
        })?;
        registry.register(Box::new(reconciliation_jobs.clone())).map_err(|e| {
            log::error!("Failed to register RECONCILIATION_JOBS metric: {}", e);
            AppError::Monitoring(format!("Failed to register RECONCILIATION_JOBS: {}", e))
        })?;

        let file_uploads = Gauge::new(
            "file_uploads_active",
            "Number of active file uploads"
        ).map_err(|e| {
            log::error!("Failed to create FILE_UPLOADS metric: {}", e);
            AppError::Monitoring(format!("Failed to initialize FILE_UPLOADS: {}", e))
        })?;
        registry.register(Box::new(file_uploads.clone())).map_err(|e| {
            log::error!("Failed to register FILE_UPLOADS metric: {}", e);
            AppError::Monitoring(format!("Failed to register FILE_UPLOADS: {}", e))
        })?;

        Ok(Self {
            metrics: Arc::new(RwLock::new(HashMap::new())),
            cache_stats: Arc::new(RwLock::new(CacheStats {
                hits: 0,
                misses: 0,
                evictions: 0,
                size: 0,
            })),
            registry,
            request_counter: Some(request_counter),
            request_duration: Some(request_duration),
            active_connections: Some(active_connections),
            database_connections: Some(database_connections),
            cache_hits: Some(cache_hits),
            cache_misses: Some(cache_misses),
            reconciliation_jobs: Some(reconciliation_jobs),
            file_uploads: Some(file_uploads),
        })
    }

    pub async fn record_request(&self, request_metrics: RequestMetrics) {
        // Record in Prometheus
        if let Some(counter) = &self.request_counter {
            counter.inc();
        }
        if let Some(duration_metric) = &self.request_duration {
            duration_metric.observe(request_metrics.duration.as_secs_f64());
        }

        // Record in internal metrics
        let key = format!("{}:{}", request_metrics.method, request_metrics.path);
        let mut metrics = self.metrics.write().await;
        metrics
            .entry(key.clone())
            .or_insert_with(Vec::new)
            .push(request_metrics);

        // Keep only last 1000 requests per endpoint
        if let Some(requests) = metrics.get_mut(&key) {
            if requests.len() > 1000 {
                requests.drain(0..requests.len() - 1000);
            }
        }
    }

    pub async fn record_cache_hit(&self) {
        if let Some(hits_metric) = &self.cache_hits {
            hits_metric.inc();
        }
        let mut stats = self.cache_stats.write().await;
        stats.hits += 1;
    }

    pub async fn record_cache_miss(&self) {
        if let Some(misses_metric) = &self.cache_misses {
            misses_metric.inc();
        }
        let mut stats = self.cache_stats.write().await;
        stats.misses += 1;
    }

    pub async fn record_cache_eviction(&self) {
        let mut stats = self.cache_stats.write().await;
        stats.evictions += 1;
    }

    pub async fn update_active_connections(&self, count: u64) {
        if let Some(connections_metric) = &self.active_connections {
            connections_metric.set(count as f64);
        }
    }

    pub async fn update_database_connections(&self, count: u64) {
        if let Some(connections_metric) = &self.database_connections {
            connections_metric.set(count as f64);
        }
    }

    pub async fn update_reconciliation_jobs(&self, count: u64) {
        if let Some(jobs_metric) = &self.reconciliation_jobs {
            jobs_metric.set(count as f64);
        }
    }

    pub async fn update_file_uploads(&self, count: u64) {
        if let Some(uploads_metric) = &self.file_uploads {
            uploads_metric.set(count as f64);
        }
    }

    pub async fn get_prometheus_metrics(&self) -> String {
        let encoder = TextEncoder::new();
        let metric_families = self.registry.gather();
        encoder
            .encode_to_string(&metric_families)
            .unwrap_or_else(|e| {
                log::error!("Failed to encode Prometheus metrics: {}", e);
                "# Error encoding metrics\n".to_string()
            })
    }

    pub fn get_cache_stats(&self) -> Arc<RwLock<CacheStats>> {
        self.cache_stats.clone()
    }

    pub fn get_metrics(&self) -> Arc<RwLock<HashMap<String, Vec<RequestMetrics>>>> {
        self.metrics.clone()
    }
}

impl Default for MetricsCollector {
    fn default() -> Self {
        Self::new().unwrap_or_else(|e| {
            // Log the error and create a dummy MetricsCollector if initialization fails
            log::error!("Failed to initialize MetricsCollector: {}", e);
            MetricsCollector {
                metrics: Arc::new(RwLock::new(HashMap::new())),
                cache_stats: Arc::new(RwLock::new(CacheStats {
                    hits: 0,
                    misses: 0,
                    evictions: 0,
                    size: 0,
                })),
                registry: Registry::new(),
                request_counter: None,
                request_duration: None,
                active_connections: None,
                database_connections: None,
                cache_hits: None,
                cache_misses: None,
                reconciliation_jobs: None,
                file_uploads: None,
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_metrics_collector_error_handling() {
        // Create the first instance, which should succeed
        let metrics_collector_1 = MetricsCollector::new();
        assert!(metrics_collector_1.is_ok(), "First MetricsCollector initialization failed: {:?}", metrics_collector_1.err());

        // Attempt to create a second instance. This should cause a metric registration error
        // because the Prometheus registry would already contain metrics with the same names.
        let metrics_collector_2 = MetricsCollector::new();
        assert!(metrics_collector_2.is_err());
        if let Err(AppError::Monitoring(msg)) = metrics_collector_2 {
            assert!(msg.contains("Failed to register"), "Error message did not indicate registration failure: {}", msg);
        } else {
            panic!("Expected AppError::Monitoring, but got a different error or success");
        }
    }
}
