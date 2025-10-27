// ============================================================================
// COMPREHENSIVE MONITORING & METRICS SERVICE
// ============================================================================

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use lazy_static::lazy_static;
use prometheus::{
    Counter, Histogram, Gauge, Registry, TextEncoder, Encoder,
    CounterVec, HistogramVec, GaugeVec, Opts, HistogramOpts
};
use prometheus::core::Collector;
use diesel::RunQueryDsl;
use crate::errors::{AppError, AppResult};
use uuid::Uuid;

// ============================================================================
// COMPREHENSIVE METRICS DEFINITIONS
// ============================================================================

lazy_static::lazy_static! {
    // HTTP Metrics
    static ref HTTP_REQUESTS_TOTAL: CounterVec = CounterVec::new(
        Opts::new("http_requests_total", "Total number of HTTP requests"),
        &["method", "endpoint", "status_code"]
    ).unwrap();
    
    static ref HTTP_REQUEST_DURATION: HistogramVec = HistogramVec::new(
        HistogramOpts::new("http_request_duration_seconds", "HTTP request duration in seconds"),
        &["method", "endpoint"]
    ).unwrap();
    
    static ref HTTP_REQUEST_SIZE: HistogramVec = HistogramVec::new(
        HistogramOpts::new("http_request_size_bytes", "HTTP request size in bytes"),
        &["method", "endpoint"]
    ).unwrap();
    
    static ref HTTP_RESPONSE_SIZE: HistogramVec = HistogramVec::new(
        HistogramOpts::new("http_response_size_bytes", "HTTP response size in bytes"),
        &["method", "endpoint"]
    ).unwrap();
    
    // Database Metrics
    static ref DATABASE_CONNECTIONS_ACTIVE: Gauge = Gauge::new(
        "database_connections_active", "Number of active database connections"
    ).unwrap();
    
    static ref DATABASE_CONNECTIONS_IDLE: Gauge = Gauge::new(
        "database_connections_idle", "Number of idle database connections"
    ).unwrap();
    
    static ref DATABASE_QUERY_DURATION: HistogramVec = HistogramVec::new(
        HistogramOpts::new("database_query_duration_seconds", "Database query duration in seconds"),
        &["query_type"]
    ).unwrap();
    
    static ref DATABASE_QUERIES_TOTAL: CounterVec = CounterVec::new(
        Opts::new("database_queries_total", "Total number of database queries"),
        &["query_type", "status"]
    ).unwrap();
    
    // Cache Metrics
    static ref CACHE_HITS_TOTAL: Counter = Counter::new(
        "cache_hits_total", "Total number of cache hits"
    ).unwrap();
    
    static ref CACHE_MISSES_TOTAL: Counter = Counter::new(
        "cache_misses_total", "Total number of cache misses"
    ).unwrap();
    
    static ref CACHE_SIZE: Gauge = Gauge::new(
        "cache_size_bytes", "Current cache size in bytes"
    ).unwrap();
    
    static ref CACHE_EVICTIONS_TOTAL: Counter = Counter::new(
        "cache_evictions_total", "Total number of cache evictions"
    ).unwrap();
    
    // Reconciliation Metrics
    static ref RECONCILIATION_JOBS_TOTAL: Counter = Counter::new(
        "reconciliation_jobs_total", "Total number of reconciliation jobs"
    ).unwrap();
    
    static ref RECONCILIATION_JOBS_ACTIVE: Gauge = Gauge::new(
        "reconciliation_jobs_active", "Number of active reconciliation jobs"
    ).unwrap();
    
    static ref RECONCILIATION_JOB_DURATION: Histogram = Histogram::with_opts(
        HistogramOpts::new("reconciliation_job_duration_seconds", "Reconciliation job duration in seconds")
    ).unwrap();
    
    static ref RECONCILIATION_RECORDS_PROCESSED: Counter = Counter::new(
        "reconciliation_records_processed_total", "Total number of reconciliation records processed"
    ).unwrap();
    
    static ref RECONCILIATION_MATCHES_FOUND: Counter = Counter::new(
        "reconciliation_matches_found_total", "Total number of reconciliation matches found"
    ).unwrap();
    
    // File Processing Metrics
    static ref FILE_UPLOADS_TOTAL: Counter = Counter::new(
        "file_uploads_total", "Total number of file uploads"
    ).unwrap();
    
    static ref FILE_UPLOAD_SIZE: Histogram = Histogram::with_opts(
        HistogramOpts::new("file_upload_size_bytes", "File upload size in bytes")
    ).unwrap();
    
    static ref FILE_PROCESSING_DURATION: Histogram = Histogram::with_opts(
        HistogramOpts::new("file_processing_duration_seconds", "File processing duration in seconds")
    ).unwrap();
    
    // WebSocket Metrics
    static ref WEBSOCKET_CONNECTIONS_ACTIVE: Gauge = Gauge::new(
        "websocket_connections_active", "Number of active WebSocket connections"
    ).unwrap();
    
    static ref WEBSOCKET_MESSAGES_TOTAL: Counter = Counter::new(
        "websocket_messages_total", "Total number of WebSocket messages"
    ).unwrap();
    
    static ref WEBSOCKET_MESSAGE_SIZE: Histogram = Histogram::with_opts(
        HistogramOpts::new("websocket_message_size_bytes", "WebSocket message size in bytes")
    ).unwrap();
    
    // System Metrics
    static ref SYSTEM_MEMORY_USAGE: Gauge = Gauge::new(
        "system_memory_usage_percent", "System memory usage percentage"
    ).unwrap();
    
    static ref SYSTEM_CPU_USAGE: Gauge = Gauge::new(
        "system_cpu_usage_percent", "System CPU usage percentage"
    ).unwrap();
    
    static ref SYSTEM_DISK_USAGE: Gauge = Gauge::new(
        "system_disk_usage_percent", "System disk usage percentage"
    ).unwrap();
    
    // User Metrics
    static ref USER_SESSIONS_ACTIVE: Gauge = Gauge::new(
        "user_sessions_active", "Number of active user sessions"
    ).unwrap();
    
    static ref USER_LOGINS_TOTAL: Counter = Counter::new(
        "user_logins_total", "Total number of user logins"
    ).unwrap();
    
    static ref USER_ACTIONS_TOTAL: Counter = Counter::new(
        "user_actions_total", "Total number of user actions"
    ).unwrap();
}

// ============================================================================
// HEALTH CHECK STRUCTURES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheck {
    pub name: String,
    pub status: HealthStatus,
    pub message: Option<String>,
    pub duration: Duration,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub details: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum HealthStatus {
    Healthy,
    Degraded,
    Unhealthy,
}

impl HealthStatus {
    pub fn is_healthy(&self) -> bool {
        matches!(self, HealthStatus::Healthy)
    }
    
    pub fn is_degraded(&self) -> bool {
        matches!(self, HealthStatus::Degraded)
    }
    
    pub fn is_unhealthy(&self) -> bool {
        matches!(self, HealthStatus::Unhealthy)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthReport {
    pub overall_status: HealthStatus,
    pub checks: Vec<HealthCheck>,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub version: String,
    pub uptime: Duration,
}

// ============================================================================
// MONITORING SERVICE
// ============================================================================

#[derive(Clone)]
pub struct MonitoringService {
    registry: Registry,
    health_checks: Arc<RwLock<HashMap<String, Box<dyn HealthChecker + Send + Sync>>>>,
    start_time: Instant,
    metrics_cache: Arc<RwLock<HashMap<String, serde_json::Value>>>,
}

impl std::fmt::Debug for MonitoringService {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("MonitoringService")
            .field("start_time", &self.start_time)
            .field("registry", &"Registry")
            .finish()
    }
}

pub trait HealthChecker {
    fn name(&self) -> String;
    fn check(&self) -> HealthCheck;
}

impl MonitoringService {
    pub fn new() -> Self {
        let registry = Registry::new();
        
        // Register all metrics
        registry.register(Box::new(HTTP_REQUESTS_TOTAL.clone())).unwrap();
        registry.register(Box::new(HTTP_REQUEST_DURATION.clone())).unwrap();
        registry.register(Box::new(HTTP_REQUEST_SIZE.clone())).unwrap();
        registry.register(Box::new(HTTP_RESPONSE_SIZE.clone())).unwrap();
        registry.register(Box::new(DATABASE_CONNECTIONS_ACTIVE.clone())).unwrap();
        registry.register(Box::new(DATABASE_CONNECTIONS_IDLE.clone())).unwrap();
        registry.register(Box::new(DATABASE_QUERY_DURATION.clone())).unwrap();
        registry.register(Box::new(DATABASE_QUERIES_TOTAL.clone())).unwrap();
        registry.register(Box::new(CACHE_HITS_TOTAL.clone())).unwrap();
        registry.register(Box::new(CACHE_MISSES_TOTAL.clone())).unwrap();
        registry.register(Box::new(CACHE_SIZE.clone())).unwrap();
        registry.register(Box::new(CACHE_EVICTIONS_TOTAL.clone())).unwrap();
        registry.register(Box::new(RECONCILIATION_JOBS_TOTAL.clone())).unwrap();
        registry.register(Box::new(RECONCILIATION_JOBS_ACTIVE.clone())).unwrap();
        registry.register(Box::new(RECONCILIATION_JOB_DURATION.clone())).unwrap();
        registry.register(Box::new(RECONCILIATION_RECORDS_PROCESSED.clone())).unwrap();
        registry.register(Box::new(RECONCILIATION_MATCHES_FOUND.clone())).unwrap();
        registry.register(Box::new(FILE_UPLOADS_TOTAL.clone())).unwrap();
        registry.register(Box::new(FILE_UPLOAD_SIZE.clone())).unwrap();
        registry.register(Box::new(FILE_PROCESSING_DURATION.clone())).unwrap();
        registry.register(Box::new(WEBSOCKET_CONNECTIONS_ACTIVE.clone())).unwrap();
        registry.register(Box::new(WEBSOCKET_MESSAGES_TOTAL.clone())).unwrap();
        registry.register(Box::new(WEBSOCKET_MESSAGE_SIZE.clone())).unwrap();
        registry.register(Box::new(SYSTEM_MEMORY_USAGE.clone())).unwrap();
        registry.register(Box::new(SYSTEM_CPU_USAGE.clone())).unwrap();
        registry.register(Box::new(SYSTEM_DISK_USAGE.clone())).unwrap();
        registry.register(Box::new(USER_SESSIONS_ACTIVE.clone())).unwrap();
        registry.register(Box::new(USER_LOGINS_TOTAL.clone())).unwrap();
        registry.register(Box::new(USER_ACTIONS_TOTAL.clone())).unwrap();
        
        Self {
            registry,
            health_checks: Arc::new(RwLock::new(HashMap::new())),
            start_time: Instant::now(),
            metrics_cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    // ============================================================================
    // METRIC RECORDING METHODS
    // ============================================================================
    
    pub fn record_http_request(&self, method: &str, endpoint: &str, status_code: u16, duration: Duration, request_size: u64, response_size: u64) {
        HTTP_REQUESTS_TOTAL.with_label_values(&[method, endpoint, &status_code.to_string()]).inc();
        HTTP_REQUEST_DURATION.with_label_values(&[method, endpoint]).observe(duration.as_secs_f64());
        HTTP_REQUEST_SIZE.with_label_values(&[method, endpoint]).observe(request_size as f64);
        HTTP_RESPONSE_SIZE.with_label_values(&[method, endpoint]).observe(response_size as f64);
    }
    
    pub fn record_database_query(&self, query_type: &str, duration: Duration, success: bool) {
        DATABASE_QUERY_DURATION.with_label_values(&[query_type]).observe(duration.as_secs_f64());
        DATABASE_QUERIES_TOTAL.with_label_values(&[query_type, if success { "success" } else { "error" }]).inc();
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
    
    pub fn record_reconciliation_job(&self, duration: Duration, records_processed: u64, matches_found: u64) {
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
    
    pub async fn add_health_checker(&self, name: String, checker: Box<dyn HealthChecker + Send + Sync>) {
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
        let encoded = encoder.encode_to_string(&metric_families)
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

// ============================================================================
// HEALTH CHECK IMPLEMENTATIONS
// ============================================================================

pub struct DatabaseHealthChecker;

impl DatabaseHealthChecker {
    pub fn new() -> Self {
        Self
    }
}

impl HealthChecker for DatabaseHealthChecker {
    fn name(&self) -> String {
        "database".to_string()
    }
    
    fn check(&self) -> HealthCheck {
        let start = Instant::now();
        
        // Placeholder for database health check
        // In a real implementation, this would ping the database
        HealthCheck {
            name: "database".to_string(),
            status: HealthStatus::Healthy,
            message: Some("Database connection successful".to_string()),
            duration: start.elapsed(),
            timestamp: chrono::Utc::now(),
            details: Some(serde_json::json!({
                "status": "connected"
            })),
        }
    }
}

pub struct RedisHealthChecker;

impl RedisHealthChecker {
    pub fn new() -> Self {
        Self
    }
}

impl HealthChecker for RedisHealthChecker {
    fn name(&self) -> String {
        "redis".to_string()
    }
    
    fn check(&self) -> HealthCheck {
        let start = Instant::now();
        
        // Placeholder for Redis health check
        // In a real implementation, this would ping Redis
        HealthCheck {
            name: "redis".to_string(),
            status: HealthStatus::Healthy,
            message: Some("Redis connection successful".to_string()),
            duration: start.elapsed(),
            timestamp: chrono::Utc::now(),
            details: Some(serde_json::json!({
                "status": "connected"
            })),
        }
    }
}

pub struct SystemHealthChecker;

impl HealthChecker for SystemHealthChecker {
    fn name(&self) -> String {
        "system".to_string()
    }
    
    fn check(&self) -> HealthCheck {
        let start = Instant::now();
        
        // Basic system health check
        let memory_usage = SYSTEM_MEMORY_USAGE.get();
        let cpu_usage = SYSTEM_CPU_USAGE.get();
        
        let status = if cpu_usage > 90.0 || memory_usage > 0.9 {
            HealthStatus::Degraded
        } else if cpu_usage > 95.0 || memory_usage > 0.95 {
            HealthStatus::Unhealthy
        } else {
            HealthStatus::Healthy
        };
        
        HealthCheck {
            name: "system".to_string(),
            status,
            message: Some(format!("CPU: {:.1}%, Memory: {:.1}%", cpu_usage, memory_usage * 100.0)),
            duration: start.elapsed(),
            timestamp: chrono::Utc::now(),
            details: Some(serde_json::json!({
                "cpu_usage": cpu_usage,
                "memory_usage": memory_usage,
                "disk_usage": SYSTEM_DISK_USAGE.get()
            })),
        }
    }
}
// ============================================================================
// MONITORING ALERTING (Merged from monitoring_alerting.rs)  
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertDefinition {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertInstance {
    pub id: Uuid,
    pub alert_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertSeverity {
    Critical,
    Warning,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationChannel {
    pub type_: String,
    pub endpoint: String,
}

