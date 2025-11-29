//! Better Auth Monitoring and Metrics
//!
//! This module provides monitoring, metrics, and logging for Better Auth integration.

use prometheus::{Counter, Histogram, IntGauge, Registry};
use std::collections::HashMap;
use std::sync::Arc;

use crate::services::structured_logging::{LogLevel, StructuredLogging};

/// Better Auth metrics
pub struct BetterAuthMetrics {
    /// Total authentication attempts
    pub auth_attempts_total: Counter,
    /// Successful authentications
    pub auth_success_total: Counter,
    /// Failed authentications
    pub auth_failures_total: Counter,
    /// Token validations
    pub token_validations_total: Counter,
    /// Token cache hits
    pub token_cache_hits_total: Counter,
    /// Token cache misses
    pub token_cache_misses_total: Counter,
    /// Token introspection requests
    pub token_introspection_total: Counter,
    /// Token refresh requests
    pub token_refresh_total: Counter,
    /// Active sessions
    pub active_sessions: IntGauge,
    /// Authentication duration histogram
    pub auth_duration_seconds: Histogram,
    /// Token validation duration
    pub token_validation_duration_seconds: Histogram,
    /// Migration status counters
    pub migrated_users_total: IntGauge,
    pub pending_migration_users: IntGauge,
    pub dual_mode_users: IntGauge,
    /// OAuth authentications
    pub oauth_auth_total: Counter,
    /// Structured logger
    logger: StructuredLogging,
}

impl BetterAuthMetrics {
    /// Create new Better Auth metrics
    pub fn new(registry: &Registry) -> Result<Self, prometheus::Error> {
        let auth_attempts_total = Counter::new(
            "better_auth_attempts_total",
            "Total number of authentication attempts",
        )?;
        registry.register(Box::new(auth_attempts_total.clone()))?;

        let auth_success_total = Counter::new(
            "better_auth_success_total",
            "Total number of successful authentications",
        )?;
        registry.register(Box::new(auth_success_total.clone()))?;

        let auth_failures_total = Counter::new(
            "better_auth_failures_total",
            "Total number of failed authentications",
        )?;
        registry.register(Box::new(auth_failures_total.clone()))?;

        let token_validations_total = Counter::new(
            "better_auth_token_validations_total",
            "Total number of token validations",
        )?;
        registry.register(Box::new(token_validations_total.clone()))?;

        let token_cache_hits_total = Counter::new(
            "better_auth_token_cache_hits_total",
            "Total number of token cache hits",
        )?;
        registry.register(Box::new(token_cache_hits_total.clone()))?;

        let token_cache_misses_total = Counter::new(
            "better_auth_token_cache_misses_total",
            "Total number of token cache misses",
        )?;
        registry.register(Box::new(token_cache_misses_total.clone()))?;

        let token_introspection_total = Counter::new(
            "better_auth_token_introspection_total",
            "Total number of token introspection requests",
        )?;
        registry.register(Box::new(token_introspection_total.clone()))?;

        let token_refresh_total = Counter::new(
            "better_auth_token_refresh_total",
            "Total number of token refresh requests",
        )?;
        registry.register(Box::new(token_refresh_total.clone()))?;

        let active_sessions = IntGauge::new(
            "better_auth_active_sessions",
            "Number of active Better Auth sessions",
        )?;
        registry.register(Box::new(active_sessions.clone()))?;

        let auth_duration_seconds = Histogram::with_opts(
            prometheus::HistogramOpts::new(
                "better_auth_duration_seconds",
                "Authentication duration in seconds",
            )
            .buckets(vec![0.001, 0.01, 0.1, 0.5, 1.0, 2.5, 5.0, 10.0]),
        )?;
        registry.register(Box::new(auth_duration_seconds.clone()))?;

        let token_validation_duration_seconds = Histogram::with_opts(
            prometheus::HistogramOpts::new(
                "better_auth_token_validation_duration_seconds",
                "Token validation duration in seconds",
            )
            .buckets(vec![0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0]),
        )?;
        registry.register(Box::new(token_validation_duration_seconds.clone()))?;

        let migrated_users_total = IntGauge::new(
            "better_auth_migrated_users_total",
            "Total number of users migrated to Better Auth",
        )?;
        registry.register(Box::new(migrated_users_total.clone()))?;

        let pending_migration_users = IntGauge::new(
            "better_auth_pending_migration_users",
            "Number of users pending migration to Better Auth",
        )?;
        registry.register(Box::new(pending_migration_users.clone()))?;

        let dual_mode_users = IntGauge::new(
            "better_auth_dual_mode_users",
            "Number of users in dual authentication mode",
        )?;
        registry.register(Box::new(dual_mode_users.clone()))?;

        let oauth_auth_total = Counter::new(
            "better_auth_oauth_total",
            "Total number of OAuth authentications",
        )?;
        registry.register(Box::new(oauth_auth_total.clone()))?;

        let logger = StructuredLogging::new("better_auth_metrics".to_string());

        Ok(Self {
            auth_attempts_total,
            auth_success_total,
            auth_failures_total,
            token_validations_total,
            token_cache_hits_total,
            token_cache_misses_total,
            token_introspection_total,
            token_refresh_total,
            active_sessions,
            auth_duration_seconds,
            token_validation_duration_seconds,
            migrated_users_total,
            pending_migration_users,
            dual_mode_users,
            oauth_auth_total,
            logger,
        })
    }

    /// Record authentication attempt
    pub fn record_auth_attempt(&self) {
        self.auth_attempts_total.inc();
    }

    /// Record successful authentication
    pub fn record_auth_success(&self, auth_method: &str, duration_seconds: f64) {
        self.auth_success_total.inc();
        self.auth_duration_seconds.observe(duration_seconds);

        let mut fields = HashMap::new();
        fields.insert("auth_method".to_string(), serde_json::json!(auth_method));
        fields.insert("duration_seconds".to_string(), serde_json::json!(duration_seconds));
        self.logger.log(LogLevel::Info, "Authentication successful", fields);
    }

    /// Record failed authentication
    pub fn record_auth_failure(&self, auth_method: &str, reason: &str) {
        self.auth_failures_total.inc();

        let mut fields = HashMap::new();
        fields.insert("auth_method".to_string(), serde_json::json!(auth_method));
        fields.insert("reason".to_string(), serde_json::json!(reason));
        self.logger.log(LogLevel::Warn, "Authentication failed", fields);
    }

    /// Record token validation
    pub fn record_token_validation(&self, cached: bool, duration_seconds: f64) {
        self.token_validations_total.inc();
        
        if cached {
            self.token_cache_hits_total.inc();
        } else {
            self.token_cache_misses_total.inc();
        }

        self.token_validation_duration_seconds.observe(duration_seconds);
    }

    /// Record token introspection
    pub fn record_token_introspection(&self) {
        self.token_introspection_total.inc();
    }

    /// Record token refresh
    pub fn record_token_refresh(&self, success: bool) {
        self.token_refresh_total.inc();

        let mut fields = HashMap::new();
        fields.insert("success".to_string(), serde_json::json!(success));
        self.logger.log(
            LogLevel::Info,
            "Token refresh attempted",
            fields,
        );
    }

    /// Update active sessions count
    pub fn update_active_sessions(&self, count: i64) {
        self.active_sessions.set(count);
    }

    /// Update migration statistics
    pub fn update_migration_stats(&self, migrated: i64, pending: i64, dual_mode: i64) {
        self.migrated_users_total.set(migrated);
        self.pending_migration_users.set(pending);
        self.dual_mode_users.set(dual_mode);

        let mut fields = HashMap::new();
        fields.insert("migrated".to_string(), serde_json::json!(migrated));
        fields.insert("pending".to_string(), serde_json::json!(pending));
        fields.insert("dual_mode".to_string(), serde_json::json!(dual_mode));
        self.logger.log(
            LogLevel::Debug,
            "Migration statistics updated",
            fields,
        );
    }

    /// Record OAuth authentication
    pub fn record_oauth_auth(&self, provider: &str, success: bool) {
        self.oauth_auth_total.inc();

        let mut fields = HashMap::new();
        fields.insert("provider".to_string(), serde_json::json!(provider));
        fields.insert("success".to_string(), serde_json::json!(success));
        self.logger.log(
            LogLevel::Info,
            "OAuth authentication attempted",
            fields,
        );
    }

    /// Log security event
    pub fn log_security_event(&self, event_type: &str, details: HashMap<String, serde_json::Value>) {
        let mut fields = details;
        fields.insert("event_type".to_string(), serde_json::json!(event_type));
        fields.insert("timestamp".to_string(), serde_json::json!(chrono::Utc::now().to_rfc3339()));
        
        self.logger.log(
            LogLevel::Warn,
            &format!("Security event: {}", event_type),
            fields,
        );
    }
}

/// Better Auth monitoring service
pub struct BetterAuthMonitor {
    metrics: Arc<BetterAuthMetrics>,
    logger: StructuredLogging,
}

impl BetterAuthMonitor {
    /// Create new Better Auth monitor
    pub fn new(registry: &Registry) -> Result<Self, prometheus::Error> {
        let metrics = Arc::new(BetterAuthMetrics::new(registry)?);
        let logger = StructuredLogging::new("better_auth_monitor".to_string());

        Ok(Self { metrics, logger })
    }

    /// Get metrics reference
    pub fn metrics(&self) -> Arc<BetterAuthMetrics> {
        self.metrics.clone()
    }

    /// Health check for Better Auth integration
    pub async fn health_check(&self, auth_server_url: &str) -> bool {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(5))
            .build()
            .unwrap_or_default();

        let health_url = format!("{}/health", auth_server_url);
        
        match client.get(&health_url).send().await {
            Ok(response) if response.status().is_success() => {
                let mut fields = HashMap::new();
                fields.insert("status".to_string(), serde_json::json!("healthy"));
                fields.insert("url".to_string(), serde_json::json!(health_url));
                self.logger.log(
                    LogLevel::Debug,
                    "Better Auth server health check passed",
                    fields,
                );
                true
            }
            Ok(response) => {
                let mut fields = HashMap::new();
                fields.insert("status".to_string(), serde_json::json!("unhealthy"));
                fields.insert("status_code".to_string(), serde_json::json!(response.status().as_u16()));
                self.logger.log(
                    LogLevel::Error,
                    "Better Auth server health check failed",
                    fields,
                );
                false
            }
            Err(err) => {
                let mut fields = HashMap::new();
                fields.insert("error".to_string(), serde_json::json!(err.to_string()));
                self.logger.log(
                    LogLevel::Error,
                    "Better Auth server health check error",
                    fields,
                );
                false
            }
        }
    }

    /// Get authentication statistics summary
    pub fn get_stats_summary(&self) -> HashMap<String, f64> {
        let mut stats = HashMap::new();
        
        stats.insert(
            "auth_attempts".to_string(),
            self.metrics.auth_attempts_total.get(),
        );
        stats.insert(
            "auth_success".to_string(),
            self.metrics.auth_success_total.get(),
        );
        stats.insert(
            "auth_failures".to_string(),
            self.metrics.auth_failures_total.get(),
        );
        stats.insert(
            "token_validations".to_string(),
            self.metrics.token_validations_total.get(),
        );
        stats.insert(
            "token_cache_hits".to_string(),
            self.metrics.token_cache_hits_total.get(),
        );
        stats.insert(
            "active_sessions".to_string(),
            self.metrics.active_sessions.get() as f64,
        );

        stats
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_better_auth_metrics_creation() {
        let registry = Registry::new();
        let metrics = BetterAuthMetrics::new(&registry);
        assert!(metrics.is_ok());
    }

    #[test]
    fn test_record_metrics() {
        let registry = Registry::new();
        let metrics = BetterAuthMetrics::new(&registry).unwrap();

        metrics.record_auth_attempt();
        assert_eq!(metrics.auth_attempts_total.get(), 1.0);

        metrics.record_auth_success("better_auth", 0.5);
        assert_eq!(metrics.auth_success_total.get(), 1.0);

        metrics.record_auth_failure("legacy", "invalid_password");
        assert_eq!(metrics.auth_failures_total.get(), 1.0);
    }
}

