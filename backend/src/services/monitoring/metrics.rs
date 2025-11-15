//! Metrics definitions and collection

use prometheus::{
    Counter, Histogram, Gauge, CounterVec, HistogramVec, Opts, HistogramOpts,
};
use log;

// ============================================================================
// COMPREHENSIVE METRICS DEFINITIONS
// ============================================================================

lazy_static::lazy_static! {
    // HTTP Metrics
    pub static ref HTTP_REQUESTS_TOTAL: CounterVec = CounterVec::new(
        Opts::new("http_requests_total", "Total number of HTTP requests"),
        &["method", "endpoint", "status_code"]
    ).unwrap_or_else(|e| {
        log::error!("Failed to create HTTP_REQUESTS_TOTAL metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref HTTP_REQUEST_DURATION: HistogramVec = HistogramVec::new(
        HistogramOpts::new("http_request_duration_seconds", "HTTP request duration in seconds"),
        &["method", "endpoint"]
    ).unwrap_or_else(|e| {
        log::error!("Failed to create HTTP_REQUEST_DURATION metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref HTTP_REQUEST_SIZE: HistogramVec = HistogramVec::new(
        HistogramOpts::new("http_request_size_bytes", "HTTP request size in bytes"),
        &["method", "endpoint"]
    ).unwrap_or_else(|e| {
        log::error!("Failed to create HTTP_REQUEST_SIZE metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref HTTP_RESPONSE_SIZE: HistogramVec = HistogramVec::new(
        HistogramOpts::new("http_response_size_bytes", "HTTP response size in bytes"),
        &["method", "endpoint"]
    ).unwrap_or_else(|e| {
        log::error!("Failed to create HTTP_RESPONSE_SIZE metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    // Database Metrics
    pub static ref DATABASE_CONNECTIONS_ACTIVE: Gauge = Gauge::new(
        "database_connections_active", "Number of active database connections"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create DATABASE_CONNECTIONS_ACTIVE metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref DATABASE_CONNECTIONS_IDLE: Gauge = Gauge::new(
        "database_connections_idle", "Number of idle database connections"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create DATABASE_CONNECTIONS_IDLE metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref DATABASE_QUERY_DURATION: HistogramVec = HistogramVec::new(
        HistogramOpts::new("database_query_duration_seconds", "Database query duration in seconds"),
        &["query_type"]
    ).unwrap_or_else(|e| {
        log::error!("Failed to create DATABASE_QUERY_DURATION metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref DATABASE_QUERIES_TOTAL: CounterVec = CounterVec::new(
        Opts::new("database_queries_total", "Total number of database queries"),
        &["query_type", "status"]
    ).unwrap_or_else(|e| {
        log::error!("Failed to create DATABASE_QUERIES_TOTAL metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    // Cache Metrics
    pub static ref CACHE_HITS_TOTAL: Counter = Counter::new(
        "cache_hits_total", "Total number of cache hits"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create CACHE_HITS_TOTAL metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref CACHE_MISSES_TOTAL: Counter = Counter::new(
        "cache_misses_total", "Total number of cache misses"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create CACHE_MISSES_TOTAL metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref CACHE_SIZE: Gauge = Gauge::new(
        "cache_size_bytes", "Current cache size in bytes"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create CACHE_SIZE metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref CACHE_EVICTIONS_TOTAL: Counter = Counter::new(
        "cache_evictions_total", "Total number of cache evictions"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create CACHE_EVICTIONS_TOTAL metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    // Reconciliation Metrics
    pub static ref RECONCILIATION_JOBS_TOTAL: Counter = Counter::new(
        "reconciliation_jobs_total", "Total number of reconciliation jobs"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create RECONCILIATION_JOBS_TOTAL metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref RECONCILIATION_JOBS_ACTIVE: Gauge = Gauge::new(
        "reconciliation_jobs_active", "Number of active reconciliation jobs"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create RECONCILIATION_JOBS_ACTIVE metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref RECONCILIATION_JOB_DURATION: Histogram = Histogram::with_opts(
        HistogramOpts::new("reconciliation_job_duration_seconds", "Reconciliation job duration in seconds")
    ).unwrap_or_else(|e| {
        log::error!("Failed to create RECONCILIATION_JOB_DURATION metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref RECONCILIATION_RECORDS_PROCESSED: Counter = Counter::new(
        "reconciliation_records_processed_total", "Total number of reconciliation records processed"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create RECONCILIATION_RECORDS_PROCESSED metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref RECONCILIATION_MATCHES_FOUND: Counter = Counter::new(
        "reconciliation_matches_found_total", "Total number of reconciliation matches found"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create RECONCILIATION_MATCHES_FOUND metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    // File Processing Metrics
    pub static ref FILE_UPLOADS_TOTAL: Counter = Counter::new(
        "file_uploads_total", "Total number of file uploads"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create FILE_UPLOADS_TOTAL metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref FILE_UPLOAD_SIZE: Histogram = Histogram::with_opts(
        HistogramOpts::new("file_upload_size_bytes", "File upload size in bytes")
    ).unwrap_or_else(|e| {
        log::error!("Failed to create FILE_UPLOAD_SIZE metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref FILE_PROCESSING_DURATION: Histogram = Histogram::with_opts(
        HistogramOpts::new("file_processing_duration_seconds", "File processing duration in seconds")
    ).unwrap_or_else(|e| {
        log::error!("Failed to create FILE_PROCESSING_DURATION metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    // WebSocket Metrics
    pub static ref WEBSOCKET_CONNECTIONS_ACTIVE: Gauge = Gauge::new(
        "websocket_connections_active", "Number of active WebSocket connections"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create WEBSOCKET_CONNECTIONS_ACTIVE metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref WEBSOCKET_MESSAGES_TOTAL: Counter = Counter::new(
        "websocket_messages_total", "Total number of WebSocket messages"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create WEBSOCKET_MESSAGES_TOTAL metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref WEBSOCKET_MESSAGE_SIZE: Histogram = Histogram::with_opts(
        HistogramOpts::new("websocket_message_size_bytes", "WebSocket message size in bytes")
    ).unwrap_or_else(|e| {
        log::error!("Failed to create WEBSOCKET_MESSAGE_SIZE metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    // System Metrics
    pub static ref SYSTEM_MEMORY_USAGE: Gauge = Gauge::new(
        "system_memory_usage_percent", "System memory usage percentage"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create SYSTEM_MEMORY_USAGE metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref SYSTEM_CPU_USAGE: Gauge = Gauge::new(
        "system_cpu_usage_percent", "System CPU usage percentage"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create SYSTEM_CPU_USAGE metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref SYSTEM_DISK_USAGE: Gauge = Gauge::new(
        "system_disk_usage_percent", "System disk usage percentage"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create SYSTEM_DISK_USAGE metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    // User Metrics
    pub static ref USER_SESSIONS_ACTIVE: Gauge = Gauge::new(
        "user_sessions_active", "Number of active user sessions"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create USER_SESSIONS_ACTIVE metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref USER_LOGINS_TOTAL: Counter = Counter::new(
        "user_logins_total", "Total number of user logins"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create USER_LOGINS_TOTAL metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });

    pub static ref USER_ACTIONS_TOTAL: Counter = Counter::new(
        "user_actions_total", "Total number of user actions"
    ).unwrap_or_else(|e| {
        log::error!("Failed to create USER_ACTIONS_TOTAL metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    });
}

