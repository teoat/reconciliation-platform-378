//! Performance Monitoring Middleware
//!
//! This module provides performance monitoring middleware for tracking
//! request metrics, database performance, and system resources.

use actix_web::dev::{Service, ServiceResponse, Transform};
use actix_web::{dev::ServiceRequest, Error, HttpMessage, Result};
use futures::future::{ok, Ready};
use futures::Future;
use log::{error, warn};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::pin::Pin;
use std::rc::Rc;
use std::sync::Arc;
use std::time::{Instant, SystemTime, UNIX_EPOCH};
use tokio::sync::RwLock;

use crate::services::performance::{PerformanceService, RequestMetrics};

/// Performance monitoring configuration
#[derive(Debug, Clone)]
pub struct PerformanceMonitoringConfig {
    pub enable_request_tracking: bool,
    pub enable_database_tracking: bool,
    pub enable_system_monitoring: bool,
    pub slow_request_threshold_ms: u64,
    pub slow_query_threshold_ms: u64,
    pub metrics_retention_days: u32,
    pub enable_real_time_alerts: bool,
    pub alert_thresholds: AlertThresholds,
}

#[derive(Debug, Clone)]
pub struct AlertThresholds {
    pub max_response_time_ms: u64,
    pub max_error_rate_percent: f64,
    pub max_cpu_usage_percent: f64,
    pub max_memory_usage_percent: f64,
    pub max_database_connections: u32,
}

impl Default for PerformanceMonitoringConfig {
    fn default() -> Self {
        Self {
            enable_request_tracking: true,
            enable_database_tracking: true,
            enable_system_monitoring: true,
            slow_request_threshold_ms: 1000,
            slow_query_threshold_ms: 500,
            metrics_retention_days: 30,
            enable_real_time_alerts: true,
            alert_thresholds: AlertThresholds {
                max_response_time_ms: 2000,
                max_error_rate_percent: 5.0,
                max_cpu_usage_percent: 80.0,
                max_memory_usage_percent: 85.0,
                max_database_connections: 50,
            },
        }
    }
}

/// Performance monitoring state
#[derive(Clone)]
pub struct PerformanceMonitoringState {
    pub performance_service: Arc<PerformanceService>,
    pub config: PerformanceMonitoringConfig,
    pub request_metrics: Arc<RwLock<HashMap<String, Vec<RequestMetric>>>>,
    pub database_metrics: Arc<RwLock<HashMap<String, Vec<DatabaseMetric>>>>,
    pub system_metrics: Arc<RwLock<HashMap<String, Vec<SystemMetric>>>>,
}

/// Request metric
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestMetric {
    pub method: String,
    pub path: String,
    pub status_code: u16,
    pub response_time_ms: u64,
    pub request_size_bytes: Option<u64>,
    pub response_size_bytes: Option<u64>,
    pub user_id: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub timestamp: u64,
}

/// Database metric
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseMetric {
    pub query_hash: String,
    pub query_text: String,
    pub execution_time_ms: u64,
    pub rows_examined: Option<u64>,
    pub rows_returned: Option<u64>,
    pub is_slow: bool,
    pub timestamp: u64,
}

/// System metric
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetric {
    pub metric_type: String,
    pub metric_name: String,
    pub metric_value: f64,
    pub unit: String,
    pub timestamp: u64,
}

/// Performance monitoring middleware
pub struct PerformanceMiddleware {
    config: PerformanceMonitoringConfig,
}

impl PerformanceMiddleware {
    pub fn new(config: PerformanceMonitoringConfig) -> Self {
        Self { config }
    }

    pub fn with_performance_service(_performance_service: Arc<PerformanceService>) -> Self {
        Self {
            config: PerformanceMonitoringConfig::default(),
        }
    }
}

impl<S, B> Transform<S, ServiceRequest> for PerformanceMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = PerformanceMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        let state = PerformanceMonitoringState {
            performance_service: Arc::new(PerformanceService::new()),
            config: self.config.clone(),
            request_metrics: Arc::new(RwLock::new(HashMap::new())),
            database_metrics: Arc::new(RwLock::new(HashMap::new())),
            system_metrics: Arc::new(RwLock::new(HashMap::new())),
        };

        ok(PerformanceMiddlewareService {
            service: Rc::new(service),
            state,
        })
    }
}

/// Performance monitoring middleware service
pub struct PerformanceMiddlewareService<S> {
    service: Rc<S>,
    state: PerformanceMonitoringState,
}

impl<S, B> Service<ServiceRequest> for PerformanceMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(
        &self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let state = self.state.clone();

        Box::pin(async move {
            let start_time = Instant::now();
            let method = req.method().to_string();
            let path = req.path().to_string();
            let ip_address = req
                .connection_info()
                .peer_addr()
                .unwrap_or("unknown")
                .to_string();
            let user_agent = req
                .headers()
                .get("User-Agent")
                .and_then(|h| h.to_str().ok())
                .map(|s| s.to_string());

            // Extract user ID if available
            let user_id = req
                .extensions()
                .get::<crate::services::auth::Claims>()
                .map(|claims| claims.sub.clone());

            // Call the next service
            let res = service.call(req).await?;

            let response_time = start_time.elapsed();
            let response_time_ms = response_time.as_millis() as u64;
            let status_code = res.status().as_u16();

            // Record request metric
            if state.config.enable_request_tracking {
                record_request_metric(
                    &state,
                    RequestMetric {
                        method: method.clone(),
                        path: path.clone(),
                        status_code,
                        response_time_ms,
                        request_size_bytes: None, // Would need to be calculated
                        response_size_bytes: None, // Would need to be calculated
                        user_id,
                        ip_address: Some(ip_address),
                        user_agent,
                        timestamp: SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap_or_default()
                            .as_secs(),
                    },
                )
                .await;
            }

            // Check for slow requests
            if response_time_ms > state.config.slow_request_threshold_ms {
                log_slow_request(&state, &method, &path, response_time_ms).await;
            }

            // Check for error responses
            if status_code >= 400 {
                log_error_response(&state, &method, &path, status_code).await;
            }

            // Record performance metrics
            state
                .performance_service
                .record_request(RequestMetrics {
                    method: method.to_string(),
                    path: path.to_string(),
                    status_code,
                    duration: response_time,
                    timestamp: Instant::now(),
                })
                .await;

            Ok(res)
        })
    }
}

/// Record request metric
async fn record_request_metric(state: &PerformanceMonitoringState, metric: RequestMetric) {
    let key = format!("{}:{}", metric.method, metric.path);
    let mut metrics = state.request_metrics.write().await;

    metrics
        .entry(key.clone())
        .or_insert_with(Vec::new)
        .push(metric);

    // Keep only last 1000 metrics per endpoint
    if let Some(metrics_vec) = metrics.get_mut(&key) {
        if metrics_vec.len() > 1000 {
            metrics_vec.drain(0..metrics_vec.len() - 1000);
        }
    }
}

/// Log slow request
async fn log_slow_request(
    state: &PerformanceMonitoringState,
    method: &str,
    path: &str,
    response_time_ms: u64,
) {
    warn!("SLOW REQUEST: {} {} - {}ms", method, path, response_time_ms);

    // In a real implementation, you'd send this to a monitoring system
    // or trigger an alert if the threshold is exceeded
}

/// Log error response
async fn log_error_response(
    state: &PerformanceMonitoringState,
    method: &str,
    path: &str,
    status_code: u16,
) {
    error!(
        "ERROR RESPONSE: {} {} - Status: {}",
        method, path, status_code
    );

    // In a real implementation, you'd send this to a monitoring system
    // or trigger an alert if the error rate is too high
}

/// Database performance monitoring
pub struct DatabasePerformanceMonitor {
    pub slow_query_threshold_ms: u64,
    pub query_metrics: Arc<RwLock<HashMap<String, Vec<DatabaseMetric>>>>,
}

impl DatabasePerformanceMonitor {
    pub fn new(slow_query_threshold_ms: u64) -> Self {
        Self {
            slow_query_threshold_ms,
            query_metrics: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn record_query(
        &self,
        query_hash: String,
        query_text: String,
        execution_time_ms: u64,
        rows_examined: Option<u64>,
        rows_returned: Option<u64>,
    ) {
        let is_slow = execution_time_ms > self.slow_query_threshold_ms;

        let metric = DatabaseMetric {
            query_hash: query_hash.clone(),
            query_text,
            execution_time_ms,
            rows_examined,
            rows_returned,
            is_slow,
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
        };

        let mut metrics = self.query_metrics.write().await;
        metrics
            .entry(query_hash)
            .or_insert_with(Vec::new)
            .push(metric.clone());

        if is_slow {
            warn!(
                "SLOW QUERY: {} - {}ms",
                metric.query_text, execution_time_ms
            );
        }
    }

    pub async fn get_slow_queries(&self) -> Vec<DatabaseMetric> {
        let metrics = self.query_metrics.read().await;
        let mut slow_queries = Vec::new();

        for query_metrics in metrics.values() {
            for metric in query_metrics {
                if metric.is_slow {
                    slow_queries.push(metric.clone());
                }
            }
        }

        slow_queries.sort_by(|a, b| b.execution_time_ms.cmp(&a.execution_time_ms));
        slow_queries
    }

    pub async fn get_query_statistics(&self) -> HashMap<String, QueryStatistics> {
        let metrics = self.query_metrics.read().await;
        let mut statistics = HashMap::new();

        for (query_hash, query_metrics) in metrics.iter() {
            if !query_metrics.is_empty() {
                let total_execution_time: u64 =
                    query_metrics.iter().map(|m| m.execution_time_ms).sum();
                let avg_execution_time = total_execution_time / query_metrics.len() as u64;
                let max_execution_time = query_metrics
                    .iter()
                    .map(|m| m.execution_time_ms)
                    .max()
                    .unwrap_or(0);
                let slow_query_count = query_metrics.iter().filter(|m| m.is_slow).count();

                statistics.insert(
                    query_hash.clone(),
                    QueryStatistics {
                        query_hash: query_hash.clone(),
                        execution_count: query_metrics.len(),
                        total_execution_time_ms: total_execution_time,
                        average_execution_time_ms: avg_execution_time,
                        max_execution_time_ms: max_execution_time,
                        slow_query_count,
                        slow_query_percentage: (slow_query_count as f64
                            / query_metrics.len() as f64)
                            * 100.0,
                    },
                );
            }
        }

        statistics
    }
}

/// Query statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryStatistics {
    pub query_hash: String,
    pub execution_count: usize,
    pub total_execution_time_ms: u64,
    pub average_execution_time_ms: u64,
    pub max_execution_time_ms: u64,
    pub slow_query_count: usize,
    pub slow_query_percentage: f64,
}

/// System resource monitoring
pub struct SystemResourceMonitor {
    pub metrics: Arc<RwLock<HashMap<String, Vec<SystemMetric>>>>,
}

impl Default for SystemResourceMonitor {
    fn default() -> Self {
        Self::new()
    }
}

impl SystemResourceMonitor {
    pub fn new() -> Self {
        Self {
            metrics: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn record_cpu_usage(&self, usage_percent: f64) {
        self.record_metric("cpu", "usage_percent", usage_percent, "percent")
            .await;
    }

    pub async fn record_memory_usage(&self, usage_percent: f64) {
        self.record_metric("memory", "usage_percent", usage_percent, "percent")
            .await;
    }

    pub async fn record_disk_usage(&self, usage_percent: f64) {
        self.record_metric("disk", "usage_percent", usage_percent, "percent")
            .await;
    }

    pub async fn record_network_usage(&self, bytes_sent: u64, bytes_received: u64) {
        self.record_metric("network", "bytes_sent", bytes_sent as f64, "bytes")
            .await;
        self.record_metric("network", "bytes_received", bytes_received as f64, "bytes")
            .await;
    }

    async fn record_metric(
        &self,
        metric_type: &str,
        metric_name: &str,
        metric_value: f64,
        unit: &str,
    ) {
        let key = format!("{}:{}", metric_type, metric_name);
        let metric = SystemMetric {
            metric_type: metric_type.to_string(),
            metric_name: metric_name.to_string(),
            metric_value,
            unit: unit.to_string(),
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
        };

        let mut metrics = self.metrics.write().await;
        metrics
            .entry(key.clone())
            .or_insert_with(Vec::new)
            .push(metric);

        // Keep only last 1000 metrics per type
        if let Some(metrics_vec) = metrics.get_mut(&key) {
            if metrics_vec.len() > 1000 {
                metrics_vec.drain(0..metrics_vec.len() - 1000);
            }
        }
    }

    pub async fn get_current_metrics(&self) -> HashMap<String, f64> {
        let metrics = self.metrics.read().await;
        let mut current_metrics = HashMap::new();

        for (key, metric_vec) in metrics.iter() {
            if let Some(latest_metric) = metric_vec.last() {
                current_metrics.insert(key.clone(), latest_metric.metric_value);
            }
        }

        current_metrics
    }
}

/// Performance alerting system
pub struct PerformanceAlerting {
    pub config: PerformanceMonitoringConfig,
    pub alerts: Arc<RwLock<Vec<PerformanceAlert>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceAlert {
    pub id: String,
    pub alert_type: String,
    pub severity: String,
    pub message: String,
    pub threshold_value: f64,
    pub current_value: f64,
    pub timestamp: u64,
    pub acknowledged: bool,
    pub resolved: bool,
}

impl PerformanceAlerting {
    pub fn new(config: PerformanceMonitoringConfig) -> Self {
        Self {
            config,
            alerts: Arc::new(RwLock::new(Vec::new())),
        }
    }

    pub async fn check_response_time_alert(&self, response_time_ms: u64) {
        if response_time_ms > self.config.alert_thresholds.max_response_time_ms {
            self.create_alert(
                "high_response_time",
                "high",
                format!(
                    "Response time {}ms exceeds threshold of {}ms",
                    response_time_ms, self.config.alert_thresholds.max_response_time_ms
                ),
                self.config.alert_thresholds.max_response_time_ms as f64,
                response_time_ms as f64,
            )
            .await;
        }
    }

    pub async fn check_cpu_usage_alert(&self, cpu_usage_percent: f64) {
        if cpu_usage_percent > self.config.alert_thresholds.max_cpu_usage_percent {
            self.create_alert(
                "high_cpu_usage",
                "medium",
                format!(
                    "CPU usage {}% exceeds threshold of {}%",
                    cpu_usage_percent, self.config.alert_thresholds.max_cpu_usage_percent
                ),
                self.config.alert_thresholds.max_cpu_usage_percent,
                cpu_usage_percent,
            )
            .await;
        }
    }

    pub async fn check_memory_usage_alert(&self, memory_usage_percent: f64) {
        if memory_usage_percent > self.config.alert_thresholds.max_memory_usage_percent {
            self.create_alert(
                "high_memory_usage",
                "high",
                format!(
                    "Memory usage {}% exceeds threshold of {}%",
                    memory_usage_percent, self.config.alert_thresholds.max_memory_usage_percent
                ),
                self.config.alert_thresholds.max_memory_usage_percent,
                memory_usage_percent,
            )
            .await;
        }
    }

    async fn create_alert(
        &self,
        alert_type: &str,
        severity: &str,
        message: String,
        threshold_value: f64,
        current_value: f64,
    ) {
        let alert = PerformanceAlert {
            id: uuid::Uuid::new_v4().to_string(),
            alert_type: alert_type.to_string(),
            severity: severity.to_string(),
            message,
            threshold_value,
            current_value,
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            acknowledged: false,
            resolved: false,
        };

        let mut alerts = self.alerts.write().await;
        alerts.push(alert.clone());

        // Keep only last 1000 alerts
        if alerts.len() > 1000 {
            let len = alerts.len();
            alerts.drain(0..len - 1000);
        }

        warn!("PERFORMANCE ALERT: {}", alert.message);
    }

    pub async fn get_active_alerts(&self) -> Vec<PerformanceAlert> {
        let alerts = self.alerts.read().await;
        alerts
            .iter()
            .filter(|alert| !alert.resolved)
            .cloned()
            .collect()
    }

    pub async fn acknowledge_alert(&self, alert_id: &str) -> bool {
        let mut alerts = self.alerts.write().await;
        if let Some(alert) = alerts.iter_mut().find(|a| a.id == alert_id) {
            alert.acknowledged = true;
            true
        } else {
            false
        }
    }

    pub async fn resolve_alert(&self, alert_id: &str) -> bool {
        let mut alerts = self.alerts.write().await;
        if let Some(alert) = alerts.iter_mut().find(|a| a.id == alert_id) {
            alert.resolved = true;
            true
        } else {
            false
        }
    }
}
