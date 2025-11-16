//! Metrics module for the Reconciliation Backend
//!
//! Provides Prometheus metrics for monitoring:
//! - Security metrics (rate limiting, CSRF, auth)
//! - Database metrics (query duration, pool stats)
//! - Cache metrics (hits, misses, hit rate)
//! - Application metrics (request counts, errors)

use once_cell::sync::Lazy;
use prometheus::{
    histogram_opts, opts, Counter, CounterVec, Encoder, Gauge, GaugeVec, Histogram, HistogramVec,
    Registry, TextEncoder,
};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

/// Security metrics tracking
#[derive(Clone)]
pub struct SecurityMetrics {
    pub rate_limit_blocks: Arc<AtomicU64>,
    pub csrf_failures: Arc<AtomicU64>,
    pub auth_denied: Arc<AtomicU64>,
    pub unauthorized_access_attempts: Arc<AtomicU64>,
}

impl Default for SecurityMetrics {
    fn default() -> Self {
        Self {
            rate_limit_blocks: Arc::new(AtomicU64::new(0)),
            csrf_failures: Arc::new(AtomicU64::new(0)),
            auth_denied: Arc::new(AtomicU64::new(0)),
            unauthorized_access_attempts: Arc::new(AtomicU64::new(0)),
        }
    }
}

impl SecurityMetrics {
    pub fn record_rate_limit_block(&self) {
        self.rate_limit_blocks.fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_csrf_failure(&self) {
        self.csrf_failures.fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_auth_denied(&self) {
        self.auth_denied.fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_unauthorized_attempt(&self) {
        self.unauthorized_access_attempts
            .fetch_add(1, Ordering::Relaxed);
    }

    pub fn get_prometheus_metrics(&self) -> String {
        format!(
            "# HELP rate_limit_blocks_total Number of requests blocked by rate limiter\n\
             # TYPE rate_limit_blocks_total counter\n\
             rate_limit_blocks_total {}\n\n\
             # HELP csrf_failures_total Number of CSRF validation failures\n\
             # TYPE csrf_failures_total counter\n\
             csrf_failures_total {}\n\n\
             # HELP auth_denied_total Number of authentication denials\n\
             # TYPE auth_denied_total counter\n\
             auth_denied_total {}\n\n\
             # HELP unauthorized_access_attempts_total Number of unauthorized access attempts\n\
             # TYPE unauthorized_access_attempts_total counter\n\
             unauthorized_access_attempts_total {}\n",
            self.rate_limit_blocks.load(Ordering::Relaxed),
            self.csrf_failures.load(Ordering::Relaxed),
            self.auth_denied.load(Ordering::Relaxed),
            self.unauthorized_access_attempts.load(Ordering::Relaxed),
        )
    }
}

/// PII masking utility for logs
pub struct PiiMasker;

impl PiiMasker {
    /// Mask email addresses
    pub fn mask_email(email: &str) -> String {
        if let Some(at_pos) = email.find('@') {
            if at_pos > 0 {
                let prefix = &email[..at_pos];
                let domain = &email[at_pos..];
                let masked = "*".repeat(at_pos.min(3));
                format!("{}@{}", masked, domain)
            } else {
                String::from("***@***")
            }
        } else {
            String::from("***")
        }
    }

    /// Mask UUIDs (keep first and last few chars)
    pub fn mask_uuid(uuid: &str) -> String {
        if uuid.len() > 8 {
            format!("{}***{}", &uuid[..4], &uuid[uuid.len() - 4..])
        } else {
            String::from("***")
        }
    }

    /// Mask IP addresses (keep first octet)
    pub fn mask_ip(ip: &str) -> String {
        if let Some(dot_pos) = ip.find('.') {
            if dot_pos > 0 {
                format!("{}.***", &ip[..dot_pos])
            } else {
                String::from("***")
            }
        } else {
            String::from("***")
        }
    }

    /// Mask JWT tokens (keep prefix only)
    pub fn mask_token(token: &str) -> String {
        if token.len() > 20 {
            format!("{}***", &token[..20])
        } else {
            String::from("***")
        }
    }
}

// ============================================================================
// PROMETHEUS METRICS (Database, Cache, Application)
// ============================================================================

/// Database query duration histogram (tagged by route, operation, table)
pub static DB_QUERY_DURATION: Lazy<HistogramVec> = Lazy::new(|| {
    HistogramVec::new(
        histogram_opts!(
            "reconciliation_db_query_duration_seconds",
            "Database query duration in seconds"
        )
        .buckets(vec![0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0]),
        &["route", "operation", "table"],
    )
    .unwrap_or_else(|e| {
        log::error!("Failed to create DB_QUERY_DURATION metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    })
});

/// Cache operation counters
pub static CACHE_HITS: Lazy<CounterVec> = Lazy::new(|| {
    CounterVec::new(
        opts!("reconciliation_cache_hits_total", "Total cache hits"),
        &["cache_level", "key_type"],
    )
    .unwrap_or_else(|e| {
        log::error!("Failed to create CACHE_HITS metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    })
});

pub static CACHE_MISSES: Lazy<CounterVec> = Lazy::new(|| {
    CounterVec::new(
        opts!("reconciliation_cache_misses_total", "Total cache misses"),
        &["cache_level", "key_type"],
    )
    .unwrap_or_else(|e| {
        log::error!("Failed to create CACHE_MISSES metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    })
});

/// Connection pool metrics
pub static DB_POOL_ACTIVE: Lazy<Gauge> = Lazy::new(|| {
    Gauge::with_opts(opts!(
        "reconciliation_db_pool_connections_active",
        "Active database connections in pool"
    ))
    .unwrap_or_else(|e| {
        log::error!("Failed to create DB_POOL_ACTIVE metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    })
});

pub static DB_POOL_IDLE: Lazy<Gauge> = Lazy::new(|| {
    Gauge::with_opts(opts!(
        "reconciliation_db_pool_connections_idle",
        "Idle database connections in pool"
    ))
    .unwrap_or_else(|e| {
        log::error!("Failed to create DB_POOL_IDLE metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    })
});

pub static DB_POOL_SIZE: Lazy<Gauge> = Lazy::new(|| {
    Gauge::with_opts(opts!(
        "reconciliation_db_pool_connections_total",
        "Total database connections in pool"
    ))
    .unwrap_or_else(|e| {
        log::error!("Failed to create DB_POOL_SIZE metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    })
});

/// Database pool exhaustion counter
pub static DB_POOL_EXHAUSTION: Lazy<Counter> = Lazy::new(|| {
    Counter::with_opts(opts!(
        "reconciliation_db_pool_exhaustion_total",
        "Total number of database pool exhaustion events"
    ))
    .unwrap_or_else(|e| {
        log::error!("Failed to create DB_POOL_EXHAUSTION metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    })
});

/// Request metrics
pub static HTTP_REQUESTS_TOTAL: Lazy<CounterVec> = Lazy::new(|| {
    CounterVec::new(
        opts!("reconciliation_http_requests_total", "Total HTTP requests"),
        &["method", "route", "status"],
    )
    .unwrap_or_else(|e| {
        log::error!("Failed to create HTTP_REQUESTS_TOTAL metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    })
});

pub static HTTP_REQUEST_DURATION: Lazy<HistogramVec> = Lazy::new(|| {
    HistogramVec::new(
        histogram_opts!(
            "reconciliation_http_request_duration_seconds",
            "HTTP request duration in seconds"
        )
        .buckets(vec![
            0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0,
        ]),
        &["method", "route"],
    )
    .unwrap_or_else(|e| {
        log::error!("Failed to create HTTP_REQUEST_DURATION metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    })
});

/// Circuit breaker metrics
pub static CIRCUIT_BREAKER_STATE: Lazy<GaugeVec> = Lazy::new(|| {
    GaugeVec::new(
        opts!(
            "reconciliation_circuit_breaker_state",
            "Circuit breaker state (0=closed, 1=half-open, 2=open)"
        ),
        &["service"],
    )
    .unwrap_or_else(|e| {
        log::error!("Failed to create CIRCUIT_BREAKER_STATE metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    })
});

pub static CIRCUIT_BREAKER_FAILURES: Lazy<CounterVec> = Lazy::new(|| {
    CounterVec::new(
        opts!(
            "reconciliation_circuit_breaker_failures_total",
            "Total circuit breaker failures"
        ),
        &["service"],
    )
    .unwrap_or_else(|e| {
        log::error!("Failed to create CIRCUIT_BREAKER_FAILURES metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    })
});

pub static CIRCUIT_BREAKER_SUCCESSES: Lazy<CounterVec> = Lazy::new(|| {
    CounterVec::new(
        opts!(
            "reconciliation_circuit_breaker_successes_total",
            "Total circuit breaker successes"
        ),
        &["service"],
    )
    .unwrap_or_else(|e| {
        log::error!("Failed to create CIRCUIT_BREAKER_SUCCESSES metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    })
});

pub static CIRCUIT_BREAKER_REQUESTS: Lazy<CounterVec> = Lazy::new(|| {
    CounterVec::new(
        opts!(
            "reconciliation_circuit_breaker_requests_total",
            "Total circuit breaker requests"
        ),
        &["service"],
    )
    .unwrap_or_else(|e| {
        log::error!("Failed to create CIRCUIT_BREAKER_REQUESTS metric: {}", e);
        panic!("Failed to initialize metrics: {}", e);
    })
});

/// Register all metrics with Prometheus registry
pub fn register_all_metrics() -> Registry {
    let registry = Registry::new();

    // Register all metrics with error logging (avoid panics in production)
    for metric in [
        Box::new(DB_QUERY_DURATION.clone()) as Box<dyn prometheus::core::Collector>,
        Box::new(CACHE_HITS.clone()),
        Box::new(CACHE_MISSES.clone()),
        Box::new(DB_POOL_ACTIVE.clone()),
        Box::new(DB_POOL_IDLE.clone()),
        Box::new(DB_POOL_SIZE.clone()),
        Box::new(DB_POOL_EXHAUSTION.clone()),
        Box::new(HTTP_REQUESTS_TOTAL.clone()),
        Box::new(HTTP_REQUEST_DURATION.clone()),
        Box::new(CIRCUIT_BREAKER_STATE.clone()),
        Box::new(CIRCUIT_BREAKER_FAILURES.clone()),
        Box::new(CIRCUIT_BREAKER_SUCCESSES.clone()),
        Box::new(CIRCUIT_BREAKER_REQUESTS.clone()),
    ] {
        if let Err(e) = registry.register(metric) {
            log::error!("Failed to register Prometheus metric: {}", e);
        }
    }

    registry
}

/// Get all metrics as Prometheus-formatted string
pub fn gather_all_metrics() -> String {
    let registry = register_all_metrics();
    let encoder = TextEncoder::new();
    let metric_families = registry.gather();
    let mut buffer = Vec::new();
    if let Err(e) = encoder.encode(&metric_families, &mut buffer) {
        log::error!("Failed to encode Prometheus metrics: {}", e);
        return String::new();
    }
    match String::from_utf8(buffer) {
        Ok(s) => s,
        Err(e) => {
            log::error!("Failed to convert Prometheus metrics to UTF-8: {}", e);
            String::new()
        }
    }
}

/// Helper to record cache hit
pub fn record_cache_hit(cache_level: &str, key_type: &str) {
    CACHE_HITS.with_label_values(&[cache_level, key_type]).inc();
}

/// Helper to record cache miss
pub fn record_cache_miss(cache_level: &str, key_type: &str) {
    CACHE_MISSES
        .with_label_values(&[cache_level, key_type])
        .inc();
}

/// Helper to update pool metrics
pub fn update_pool_metrics(active: usize, idle: usize, total: usize) {
    DB_POOL_ACTIVE.set(active as f64);
    DB_POOL_IDLE.set(idle as f64);
    DB_POOL_SIZE.set(total as f64);
}

/// Record database pool exhaustion event
pub fn record_pool_exhaustion() {
    DB_POOL_EXHAUSTION.inc();
}

/// Timer guard for database queries
pub struct DbQueryTimer {
    start: std::time::Instant,
    timer: Histogram,
}

impl DbQueryTimer {
    pub fn start(route: &str, operation: &str, table: &str) -> Self {
        let timer = DB_QUERY_DURATION
            .with_label_values(&[route, operation, table])
            .clone();
        Self {
            start: std::time::Instant::now(),
            timer,
        }
    }
}

impl Drop for DbQueryTimer {
    fn drop(&mut self) {
        let elapsed = self.start.elapsed().as_secs_f64();
        self.timer.observe(elapsed);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mask_email() {
        assert_eq!(PiiMasker::mask_email("test@example.com"), "***@example.com");
    }

    #[test]
    fn test_mask_uuid() {
        let uuid = "12345678-1234-1234-1234-123456789012";
        let masked = PiiMasker::mask_uuid(uuid);
        assert!(masked.starts_with("1234"));
        assert!(masked.ends_with("9012"));
    }

    #[test]
    fn test_mask_ip() {
        assert_eq!(PiiMasker::mask_ip("192.168.1.1"), "192.***");
    }
}
