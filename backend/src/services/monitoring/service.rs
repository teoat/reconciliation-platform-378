//! Monitoring service implementation

use crate::errors::{AppError, AppResult};
use prometheus::{core::Collector, Registry, TextEncoder};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

use crate::services::monitoring::metrics::*;
use crate::services::monitoring::types::{HealthChecker, HealthReport, HealthStatus};

/// Monitoring service
#[derive(Clone)]
pub struct MonitoringService {
    pub registry: Registry,
    pub health_checks: Arc<RwLock<HashMap<String, Box<dyn HealthChecker + Send + Sync>>>>,
    pub start_time: Instant,
    pub metrics_cache: Arc<RwLock<HashMap<String, serde_json::Value>>>,
}

impl std::fmt::Debug for MonitoringService {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("MonitoringService")
            .field("start_time", &self.start_time)
            .field("registry", &"Registry")
            .finish()
    }
}

impl MonitoringService {
    pub fn new() -> Self {
        let registry = Registry::new();

        // Register all metrics - log errors but continue if registration fails (duplicates are ok)
        Self::register_metrics(&registry);

        Self {
            registry,
            health_checks: Arc::new(RwLock::new(HashMap::new())),
            start_time: Instant::now(),
            metrics_cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    fn register_metrics(registry: &Registry) {
        let metrics = vec![
            Box::new(HTTP_REQUESTS_TOTAL.clone()) as Box<dyn Collector>,
            Box::new(HTTP_REQUEST_DURATION.clone()),
            Box::new(HTTP_REQUEST_SIZE.clone()),
            Box::new(HTTP_RESPONSE_SIZE.clone()),
            Box::new(DATABASE_CONNECTIONS_ACTIVE.clone()),
            Box::new(DATABASE_CONNECTIONS_IDLE.clone()),
            Box::new(DATABASE_QUERY_DURATION.clone()),
            Box::new(DATABASE_QUERIES_TOTAL.clone()),
            Box::new(CACHE_HITS_TOTAL.clone()),
            Box::new(CACHE_MISSES_TOTAL.clone()),
            Box::new(CACHE_SIZE.clone()),
            Box::new(CACHE_EVICTIONS_TOTAL.clone()),
            Box::new(RECONCILIATION_JOBS_TOTAL.clone()),
            Box::new(RECONCILIATION_JOBS_ACTIVE.clone()),
            Box::new(RECONCILIATION_JOB_DURATION.clone()),
            Box::new(RECONCILIATION_RECORDS_PROCESSED.clone()),
            Box::new(RECONCILIATION_MATCHES_FOUND.clone()),
            Box::new(FILE_UPLOADS_TOTAL.clone()),
            Box::new(FILE_UPLOAD_SIZE.clone()),
            Box::new(FILE_PROCESSING_DURATION.clone()),
            Box::new(WEBSOCKET_CONNECTIONS_ACTIVE.clone()),
            Box::new(WEBSOCKET_MESSAGES_TOTAL.clone()),
            Box::new(WEBSOCKET_MESSAGE_SIZE.clone()),
            Box::new(SYSTEM_MEMORY_USAGE.clone()),
            Box::new(SYSTEM_CPU_USAGE.clone()),
            Box::new(SYSTEM_DISK_USAGE.clone()),
            Box::new(USER_SESSIONS_ACTIVE.clone()),
            Box::new(USER_LOGINS_TOTAL.clone()),
            Box::new(USER_ACTIONS_TOTAL.clone()),
        ];

        for metric in metrics {
            if let Err(e) = registry.register(metric) {
                log::warn!("Failed to register metric: {}", e);
            }
        }
    }

    // ============================================================================
    // METRIC RECORDING METHODS
    // ============================================================================

    pub fn record_http_request(
        &self,
        method: &str,
        endpoint: &str,
        status_code: u16,
        duration: Duration,
        request_size: u64,
        response_size: u64,
    ) {
        HTTP_REQUESTS_TOTAL
            .with_label_values(&[method, endpoint, &status_code.to_string()])
            .inc();
        HTTP_REQUEST_DURATION
            .with_label_values(&[method, endpoint])
            .observe(duration.as_secs_f64());
        HTTP_REQUEST_SIZE
            .with_label_values(&[method, endpoint])
            .observe(request_size as f64);
        HTTP_RESPONSE_SIZE
            .with_label_values(&[method, endpoint])
            .observe(response_size as f64);
    }

    pub fn record_database_query(&self, query_type: &str, duration: Duration, success: bool) {
        DATABASE_QUERY_DURATION
            .with_label_values(&[query_type])
            .observe(duration.as_secs_f64());
        DATABASE_QUERIES_TOTAL
            .with_label_values(&[query_type, if success { "success" } else { "error" }])
            .inc();
    }

    pub fn record_cache_hit(&self) {
        CACHE_HITS_TOTAL.inc();
    }

    pub fn record_cache_miss(&self) {
        CACHE_MISSES_TOTAL.inc();
    }

    pub fn record_cache_eviction(&self) {
        CACHE_EVICTIONS_TOTAL.inc();
    }

    pub fn update_cache_size(&self, size: u64) {
        CACHE_SIZE.set(size as f64);
    }

    pub fn record_reconciliation_job(
        &self,
        duration: Duration,
        records_processed: u64,
        matches_found: u64,
    ) {
        RECONCILIATION_JOBS_TOTAL.inc();
        RECONCILIATION_JOB_DURATION.observe(duration.as_secs_f64());
        RECONCILIATION_RECORDS_PROCESSED.inc_by(records_processed as f64);
        RECONCILIATION_MATCHES_FOUND.inc_by(matches_found as f64);
    }

    pub fn update_reconciliation_jobs_active(&self, count: i64) {
        RECONCILIATION_JOBS_ACTIVE.set(count as f64);
    }

    pub fn record_file_upload(&self, size: u64, processing_duration: Duration) {
        FILE_UPLOADS_TOTAL.inc();
        FILE_UPLOAD_SIZE.observe(size as f64);
        FILE_PROCESSING_DURATION.observe(processing_duration.as_secs_f64());
    }

    pub fn update_websocket_connections(&self, count: i64) {
        WEBSOCKET_CONNECTIONS_ACTIVE.set(count as f64);
    }

    pub fn record_websocket_message(&self, size: u64) {
        WEBSOCKET_MESSAGES_TOTAL.inc();
        WEBSOCKET_MESSAGE_SIZE.observe(size as f64);
    }

    pub fn update_system_metrics(&self, memory: u64, cpu: f64, disk: u64) {
        SYSTEM_MEMORY_USAGE.set(memory as f64);
        SYSTEM_CPU_USAGE.set(cpu);
        SYSTEM_DISK_USAGE.set(disk as f64);
    }

    pub fn update_user_sessions(&self, count: i64) {
        USER_SESSIONS_ACTIVE.set(count as f64);
    }

    pub fn record_user_login(&self) {
        USER_LOGINS_TOTAL.inc();
    }

    pub fn record_user_action(&self) {
        USER_ACTIONS_TOTAL.inc();
    }

    pub fn record_user_action_with_details(&self, action: &str, details: &str) {
        USER_ACTIONS_TOTAL.inc();
        // Log additional details if needed
    }

    // ============================================================================
    // HEALTH CHECK METHODS
    // ============================================================================

    pub async fn add_health_checker(
        &self,
        name: String,
        checker: Box<dyn HealthChecker + Send + Sync>,
    ) {
        let mut checks = self.health_checks.write().await;
        checks.insert(name, checker);
    }

    pub async fn perform_health_checks(&self) -> AppResult<HealthReport> {
        let checks = self.health_checks.read().await;
        let mut health_checks = Vec::new();
        let mut overall_status = HealthStatus::Healthy;

        for (_, checker) in checks.iter() {
            let check = checker.check();
            if check.status.is_unhealthy() {
                overall_status = HealthStatus::Unhealthy;
            } else if check.status.is_degraded() && overall_status.is_healthy() {
                overall_status = HealthStatus::Degraded;
            }
            health_checks.push(check);
        }

        Ok(HealthReport {
            overall_status,
            checks: health_checks,
            timestamp: chrono::Utc::now(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            uptime: self.start_time.elapsed(),
        })
    }

    // ============================================================================
    // METRICS EXPORT METHODS
    // ============================================================================

    pub fn get_metrics_prometheus(&self) -> AppResult<String> {
        let encoder = TextEncoder::new();
        let metric_families = self.registry.gather();
        let encoded = encoder
            .encode_to_string(&metric_families)
            .map_err(|e| AppError::Internal(format!("Failed to encode metrics: {}", e)))?;
        Ok(encoded)
    }

    pub async fn get_cached_metrics(&self, key: &str) -> Option<serde_json::Value> {
        let cache = self.metrics_cache.read().await;
        cache.get(key).cloned()
    }

    pub async fn cache_metrics(&self, key: String, metrics: serde_json::Value) {
        let mut cache = self.metrics_cache.write().await;
        cache.insert(key, metrics);
    }

    /// Get system metrics
    pub async fn get_system_metrics(&self) -> AppResult<serde_json::Value> {
        let metrics = serde_json::json!({
            "http_requests_total": 0, // CounterVec doesn't have simple get method
            "http_request_duration": 0, // HistogramVec doesn't have get_sample_count
            "database_connections_active": DATABASE_CONNECTIONS_ACTIVE.get(),
            "database_connections_idle": DATABASE_CONNECTIONS_IDLE.get(),
            "cache_hits_total": CACHE_HITS_TOTAL.get(),
            "cache_misses_total": CACHE_MISSES_TOTAL.get(),
            "cache_size": CACHE_SIZE.get(),
            "reconciliation_jobs_total": RECONCILIATION_JOBS_TOTAL.get(),
            "reconciliation_jobs_active": RECONCILIATION_JOBS_ACTIVE.get(),
            "system_cpu_usage": SYSTEM_CPU_USAGE.get(),
            "system_memory_usage": SYSTEM_MEMORY_USAGE.get(),
            "system_disk_usage": SYSTEM_DISK_USAGE.get(),
            "uptime_seconds": self.start_time.elapsed().as_secs(),
        });

        Ok(metrics)
    }
}

impl Default for MonitoringService {
    fn default() -> Self {
        Self::new()
    }
}
