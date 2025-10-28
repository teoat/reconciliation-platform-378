// Monitoring Configuration - Sentry, Prometheus, and Alert Setup
// Centralized configuration for observability and error tracking

use std::env;

pub struct MonitoringConfig {
    pub sentry_dsn: String,
    pub prometheus_port: u16,
    pub log_level: String,
    pub enable_metrics: bool,
    pub enable_tracing: bool,
}

impl MonitoringConfig {
    pub fn from_env() -> Self {
        Self {
            sentry_dsn: env::var("SENTRY_DSN")
                .unwrap_or_else(|_| "".to_string()),
            
            prometheus_port: env::var("PROMETHEUS_PORT")
                .unwrap_or_else(|_| "9090".to_string())
                .parse()
                .unwrap_or(9090),
            
            log_level: env::var("RUST_LOG")
                .unwrap_or_else(|_| "info".to_string()),
            
            enable_metrics: env::var("ENABLE_METRICS")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .unwrap_or(true),
            
            enable_tracing: env::var("ENABLE_TRACING")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .unwrap_or(true),
        }
    }

    pub fn is_monitoring_enabled(&self) -> bool {
        !self.sentry_dsn.is_empty() || self.enable_metrics
    }
}

// Alert thresholds
pub struct AlertThresholds {
    pub cfur_min: f64,
    pub latency_max_ms: u64,
    pub error_rate_max: f64,
}

impl AlertThresholds {
    pub fn production() -> Self {
        Self {
            cfur_min: 0.998,      // 99.8%
            latency_max_ms: 500,  // 500ms
            error_rate_max: 0.01, // 1%
        }
    }
}

impl Default for MonitoringConfig {
    fn default() -> Self {
        Self::from_env()
    }
}

