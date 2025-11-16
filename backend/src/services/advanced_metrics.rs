//! Advanced Metrics Service
// Establishment Business KPIs, SLA metrics, and custom metrics collection

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;

/// Metric types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MetricType {
    Counter,
    Gauge,
    Histogram,
    Summary,
}

/// Custom metric
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomMetric {
    pub name: String,
    pub metric_type: MetricType,
    pub value: f64,
    pub labels: HashMap<String, String>,
    pub timestamp: String,
}

/// Business KPI
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BusinessKPI {
    pub name: String,
    pub value: f64,
    pub target: f64,
    pub unit: String,
    pub timestamp: String,
}

/// SLA metric
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SLAMetric {
    pub service: String,
    pub uptime_percentage: f64,
    pub target_uptime: f64,
    pub response_time_p95: Duration,
    pub response_time_p99: Duration,
    pub error_rate: f64,
    pub timestamp: String,
}

/// Advanced metrics service
pub struct AdvancedMetrics {
    metrics: Arc<RwLock<HashMap<String, CustomMetric>>>,
    kpis: Arc<RwLock<Vec<BusinessKPI>>>,
    sla_metrics: Arc<RwLock<HashMap<String, SLAMetric>>>,
}

impl Default for AdvancedMetrics {
    fn default() -> Self {
        Self::new()
    }
}

impl AdvancedMetrics {
    pub fn new() -> Self {
        Self {
            metrics: Arc::new(RwLock::new(HashMap::new())),
            kpis: Arc::new(RwLock::new(Vec::new())),
            sla_metrics: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn record_custom_metric(&self, metric: CustomMetric) {
        let mut metrics = self.metrics.write().await;
        metrics.insert(metric.name.clone(), metric);
    }

    pub async fn record_kpi(&self, kpi: BusinessKPI) {
        let mut kpis = self.kpis.write().await;
        kpis.push(kpi);
        if kpis.len() > 1000 {
            kpis.remove(0);
        }
    }

    pub async fn record_sla_metric(&self, service: String, metric: SLAMetric) {
        let mut slas = self.sla_metrics.write().await;
        slas.insert(service, metric);
    }

    pub async fn get_metrics(&self) -> Vec<CustomMetric> {
        let metrics = self.metrics.read().await;
        metrics.values().cloned().collect()
    }

    pub async fn get_kpis(&self) -> Vec<BusinessKPI> {
        self.kpis.read().await.clone()
    }

    pub async fn get_sla_metrics(&self) -> HashMap<String, SLAMetric> {
        self.sla_metrics.read().await.clone()
    }
}
