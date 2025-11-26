//! Metrics Service
//!
//! Provides metrics collection and monitoring for all services

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};

/// Metric types
#[derive(Debug, Clone, serde::Serialize)]
pub enum MetricType {
    Counter,
    Gauge,
    Histogram,
    Summary,
}

/// Metric value
#[derive(Debug, Clone, serde::Serialize)]
pub struct MetricValue {
    pub value: f64,
    pub timestamp: DateTime<Utc>,
    pub labels: HashMap<String, String>,
}

/// Metric
#[derive(Debug, Clone, serde::Serialize)]
pub struct Metric {
    pub name: String,
    pub metric_type: MetricType,
    pub values: Vec<MetricValue>,
    pub description: String,
}

/// Metrics service
pub struct MetricsService {
    metrics: Arc<RwLock<HashMap<String, Metric>>>,
}

impl MetricsService {
    /// Create a new metrics service
    pub fn new() -> Self {
        Self {
            metrics: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Increment a counter metric
    pub async fn increment_counter(&self, name: &str, labels: Option<HashMap<String, String>>) {
        let mut metrics = self.metrics.write().await;
        let metric = metrics.entry(name.to_string()).or_insert_with(|| Metric {
            name: name.to_string(),
            metric_type: MetricType::Counter,
            values: Vec::new(),
            description: format!("Counter metric: {}", name),
        });

        let labels = labels.unwrap_or_default();
        metric.values.push(MetricValue {
            value: 1.0,
            timestamp: Utc::now(),
            labels,
        });
    }

    /// Set a gauge metric
    pub async fn set_gauge(&self, name: &str, value: f64, labels: Option<HashMap<String, String>>) {
        let mut metrics = self.metrics.write().await;
        let metric = metrics.entry(name.to_string()).or_insert_with(|| Metric {
            name: name.to_string(),
            metric_type: MetricType::Gauge,
            values: Vec::new(),
            description: format!("Gauge metric: {}", name),
        });

        let labels = labels.unwrap_or_default();
        metric.values.push(MetricValue {
            value,
            timestamp: Utc::now(),
            labels,
        });
    }

    /// Record a histogram value
    pub async fn record_histogram(&self, name: &str, value: f64, labels: Option<HashMap<String, String>>) {
        let mut metrics = self.metrics.write().await;
        let metric = metrics.entry(name.to_string()).or_insert_with(|| Metric {
            name: name.to_string(),
            metric_type: MetricType::Histogram,
            values: Vec::new(),
            description: format!("Histogram metric: {}", name),
        });

        let labels = labels.unwrap_or_default();
        metric.values.push(MetricValue {
            value,
            timestamp: Utc::now(),
            labels,
        });
    }

    /// Get metric by name
    pub async fn get_metric(&self, name: &str) -> Option<Metric> {
        let metrics = self.metrics.read().await;
        metrics.get(name).cloned()
    }

    /// Get all metrics
    pub async fn get_all_metrics(&self) -> HashMap<String, Metric> {
        let metrics = self.metrics.read().await;
        metrics.clone()
    }

    /// Get metrics summary
    pub async fn get_summary(&self) -> HashMap<String, f64> {
        let metrics = self.metrics.read().await;
        let mut summary = HashMap::new();

        for (name, metric) in metrics.iter() {
            match metric.metric_type {
                MetricType::Counter => {
                    let total: f64 = metric.values.iter().map(|v| v.value).sum();
                    summary.insert(format!("{}_total", name), total);
                }
                MetricType::Gauge => {
                    if let Some(last) = metric.values.last() {
                        summary.insert(name.clone(), last.value);
                    }
                }
                MetricType::Histogram => {
                    if !metric.values.is_empty() {
                        let values: Vec<f64> = metric.values.iter().map(|v| v.value).collect();
                        let count = values.len() as f64;
                        let sum: f64 = values.iter().sum();
                        let avg = sum / count;
                        
                        summary.insert(format!("{}_count", name), count);
                        summary.insert(format!("{}_sum", name), sum);
                        summary.insert(format!("{}_avg", name), avg);
                    }
                }
                MetricType::Summary => {
                    // Similar to histogram
                    if !metric.values.is_empty() {
                        let values: Vec<f64> = metric.values.iter().map(|v| v.value).collect();
                        let count = values.len() as f64;
                        summary.insert(format!("{}_count", name), count);
                    }
                }
            }
        }

        summary
    }
}

impl Default for MetricsService {
    fn default() -> Self {
        Self::new()
    }
}

/// Predefined metric names
pub mod metric_names {
    pub const CQRS_COMMAND_COUNT: &str = "cqrs_command_total";
    pub const CQRS_QUERY_COUNT: &str = "cqrs_query_total";
    pub const EVENT_PUBLISHED_COUNT: &str = "event_published_total";
    pub const SECRET_ROTATION_COUNT: &str = "secret_rotation_total";
    pub const RATE_LIMIT_HITS: &str = "rate_limit_hits_total";
    pub const RATE_LIMIT_EXCEEDED: &str = "rate_limit_exceeded_total";
    pub const ZERO_TRUST_VERIFICATIONS: &str = "zero_trust_verifications_total";
    pub const CACHE_HIT_RATE: &str = "cache_hit_rate";
    pub const CACHE_WARMING_DURATION: &str = "cache_warming_duration_seconds";
    pub const QUERY_OPTIMIZATION_COUNT: &str = "query_optimization_total";
}

