// All integrations in one place
// Imports and initializes monitoring, Sentry, etc.

use crate::config::monitoring::MonitoringConfig;
use prometheus::Registry;
use std::env;

/// Initialize all monitoring and observability integrations
pub fn initialize_integrations() -> (Option<sentry::ClientInitGuard>, Option<Registry>) {
    let monitoring_config = MonitoringConfig::from_env();
    
    // Initialize Sentry
    let sentry_guard = initialize_sentry(&monitoring_config);
    
    // Initialize Prometheus
    let prometheus_registry = initialize_prometheus(&monitoring_config);
    
    (sentry_guard, prometheus_registry)
}

fn initialize_sentry(config: &MonitoringConfig) -> Option<sentry::ClientInitGuard> {
    if config.sentry_dsn.is_empty() {
        log::warn!("⚠️  Sentry DSN not configured - error tracking disabled");
        return None;
    }
    
    let dsn: sentry::types::Dsn = config.sentry_dsn.parse().ok()?;
    
    let guard = sentry::init((
        dsn,
        sentry::ClientOptions {
            release: Some(env!("CARGO_PKG_VERSION").into()),
            environment: Some(std::env::var("ENVIRONMENT").unwrap_or_else(|_| "development".into())),
            traces_sample_rate: 0.1,
            ..Default::default()
        },
    ));
    
    log::info!("✅ Sentry initialized");
    Some(guard)
}

fn initialize_prometheus(config: &MonitoringConfig) -> Option<prometheus::Registry> {
    if !config.enable_metrics {
        log::warn!("⚠️  Metrics disabled");
        return None;
    }
    
    let registry = Registry::new();
    log::info!("✅ Prometheus metrics initialized on port {}", config.prometheus_port);
    Some(registry)
}

// Re-export for easy use
pub use MonitoringConfig;
