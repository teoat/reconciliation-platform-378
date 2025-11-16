//! Metrics collection module for performance monitoring
//! 
//! This module handles Prometheus metrics collection, including counters,
//! gauges, and histograms for request tracking, cache statistics, and connection monitoring.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use prometheus::{Counter, Histogram, Gauge, Registry, TextEncoder, HistogramOpts};

// Performance metrics
lazy_static::lazy_static! {
    pub static ref REQUEST_COUNTER: Counter = Counter::new(
        "http_requests_total",
        "Total number of HTTP requests"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create REQUEST_COUNTER metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref REQUEST_DURATION: Histogram = Histogram::with_opts(
        HistogramOpts::new("http_request_duration_seconds", "HTTP request duration in seconds")
            .buckets(vec![0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0])
    ).unwrap_or_else(|e| {
        log::error!("Failed to create REQUEST_DURATION metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref ACTIVE_CONNECTIONS: Gauge = Gauge::new(
        "active_connections",
        "Number of active connections"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create ACTIVE_CONNECTIONS metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref DATABASE_CONNECTIONS: Gauge = Gauge::new(
        "database_connections",
        "Number of database connections"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create DATABASE_CONNECTIONS metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref CACHE_HITS: Counter = Counter::new(
        "cache_hits_total",
        "Total number of cache hits"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create CACHE_HITS metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref CACHE_MISSES: Counter = Counter::new(
        "cache_misses_total",
        "Total number of cache misses"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create CACHE_MISSES metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref RECONCILIATION_JOBS: Gauge = Gauge::new(
        "reconciliation_jobs_active",
        "Number of active reconciliation jobs"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create RECONCILIATION_JOBS metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref FILE_UPLOADS: Gauge = Gauge::new(
        "file_uploads_active",
        "Number of active file uploads"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create FILE_UPLOADS metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });
}

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
}

impl MetricsCollector {
    pub fn new() -> Self {
        let registry = Registry::new();
        
        // Register metrics - log errors but continue (graceful degradation)
        if let Err(e) = registry.register(Box::new(REQUEST_COUNTER.clone())) {
            log::warn!("Failed to register REQUEST_COUNTER metric: {}", e);
        }
        if let Err(e) = registry.register(Box::new(REQUEST_DURATION.clone())) {
            log::warn!("Failed to register REQUEST_DURATION metric: {}", e);
        }
        if let Err(e) = registry.register(Box::new(ACTIVE_CONNECTIONS.clone())) {
            log::warn!("Failed to register ACTIVE_CONNECTIONS metric: {}", e);
        }
        if let Err(e) = registry.register(Box::new(DATABASE_CONNECTIONS.clone())) {
            log::warn!("Failed to register DATABASE_CONNECTIONS metric: {}", e);
        }
        if let Err(e) = registry.register(Box::new(CACHE_HITS.clone())) {
            log::warn!("Failed to register CACHE_HITS metric: {}", e);
        }
        if let Err(e) = registry.register(Box::new(CACHE_MISSES.clone())) {
            log::warn!("Failed to register CACHE_MISSES metric: {}", e);
        }
        if let Err(e) = registry.register(Box::new(RECONCILIATION_JOBS.clone())) {
            log::warn!("Failed to register RECONCILIATION_JOBS metric: {}", e);
        }
        if let Err(e) = registry.register(Box::new(FILE_UPLOADS.clone())) {
            log::warn!("Failed to register FILE_UPLOADS metric: {}", e);
        }
        
        Self {
            metrics: Arc::new(RwLock::new(HashMap::new())),
            cache_stats: Arc::new(RwLock::new(CacheStats {
                hits: 0,
                misses: 0,
                evictions: 0,
                size: 0,
            })),
            registry,
        }
    }
    
    pub async fn record_request(&self, request_metrics: RequestMetrics) {
        // Record in Prometheus
        REQUEST_COUNTER.inc();
        REQUEST_DURATION.observe(request_metrics.duration.as_secs_f64());
        
        // Record in internal metrics
        let key = format!("{}:{}", request_metrics.method, request_metrics.path);
        let mut metrics = self.metrics.write().await;
        metrics.entry(key.clone()).or_insert_with(Vec::new).push(request_metrics);
        
        // Keep only last 1000 requests per endpoint
        if let Some(requests) = metrics.get_mut(&key) {
            if requests.len() > 1000 {
                requests.drain(0..requests.len() - 1000);
            }
        }
    }
    
    pub async fn record_cache_hit(&self) {
        CACHE_HITS.inc();
        let mut stats = self.cache_stats.write().await;
        stats.hits += 1;
    }
    
    pub async fn record_cache_miss(&self) {
        CACHE_MISSES.inc();
        let mut stats = self.cache_stats.write().await;
        stats.misses += 1;
    }
    
    pub async fn record_cache_eviction(&self) {
        let mut stats = self.cache_stats.write().await;
        stats.evictions += 1;
    }
    
    pub async fn update_active_connections(&self, count: u64) {
        ACTIVE_CONNECTIONS.set(count as f64);
    }
    
    pub async fn update_database_connections(&self, count: u64) {
        DATABASE_CONNECTIONS.set(count as f64);
    }
    
    pub async fn update_reconciliation_jobs(&self, count: u64) {
        RECONCILIATION_JOBS.set(count as f64);
    }
    
    pub async fn update_file_uploads(&self, count: u64) {
        FILE_UPLOADS.set(count as f64);
    }
    
    pub async fn get_prometheus_metrics(&self) -> String {
        let encoder = TextEncoder::new();
        let metric_families = self.registry.gather();
        encoder.encode_to_string(&metric_families)
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
        Self::new()
    }
}

