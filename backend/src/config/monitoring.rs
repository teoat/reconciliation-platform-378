use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitoringConfig {
    pub sentry_dsn: String,
    pub enable_metrics: bool,
    pub prometheus_port: u16,
    pub log_level: String,
}

impl MonitoringConfig {
    pub fn from_env() -> Self {
        Self {
            sentry_dsn: env::var("SENTRY_DSN").unwrap_or_default(),
            enable_metrics: env::var("ENABLE_METRICS")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .unwrap_or(true),
            prometheus_port: env::var("PROMETHEUS_PORT")
                .unwrap_or_else(|_| "9090".to_string())
                .parse()
                .unwrap_or(9090),
            log_level: env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
        }
    }
}
