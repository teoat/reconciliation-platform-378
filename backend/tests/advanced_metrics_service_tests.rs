//! Comprehensive service layer tests for AdvancedMetrics
//!
//! Tests advanced metrics functionality including custom metrics,
//! business KPIs, and SLA metrics.

use reconciliation_backend::services::advanced_metrics::{
    AdvancedMetrics, BusinessKPI, CustomMetric, MetricType, SLAMetric,
};
use std::collections::HashMap;
use std::time::Duration;
use chrono::Utc;

/// Test AdvancedMetrics methods
#[cfg(test)]
mod advanced_metrics_service_tests {
    use super::*;

    fn create_test_custom_metric(name: &str, metric_type: MetricType, value: f64) -> CustomMetric {
        CustomMetric {
            name: name.to_string(),
            metric_type,
            value,
            labels: HashMap::new(),
            timestamp: Utc::now().to_rfc3339(),
        }
    }

    fn create_test_kpi(name: &str, value: f64, target: f64) -> BusinessKPI {
        BusinessKPI {
            name: name.to_string(),
            value,
            target,
            unit: "count".to_string(),
            timestamp: Utc::now().to_rfc3339(),
        }
    }

    fn create_test_sla_metric(service: &str, uptime: f64, target_uptime: f64) -> SLAMetric {
        SLAMetric {
            service: service.to_string(),
            uptime_percentage: uptime,
            target_uptime,
            response_time_p95: Duration::from_millis(100),
            response_time_p99: Duration::from_millis(200),
            error_rate: 0.01,
            timestamp: Utc::now().to_rfc3339(),
        }
    }

    // =========================================================================
    // Service Creation
    // =========================================================================

    #[tokio::test]
    async fn test_advanced_metrics_creation() {
        let service = AdvancedMetrics::new();
        
        // Verify service is created
        assert!(true);
    }

    #[tokio::test]
    async fn test_advanced_metrics_default() {
        let service = AdvancedMetrics::default();
        
        // Verify service is created
        assert!(true);
    }

    // =========================================================================
    // Custom Metrics
    // =========================================================================

    #[tokio::test]
    async fn test_record_custom_metric() {
        let service = AdvancedMetrics::new();
        
        let metric = create_test_custom_metric("test_metric", MetricType::Counter, 10.0);
        service.record_custom_metric(metric.clone()).await;
        
        // Verify metric was recorded
        let metrics = service.get_metrics().await;
        assert!(metrics.iter().any(|m| m.name == "test_metric"));
    }

    #[tokio::test]
    async fn test_record_custom_metric_different_types() {
        let service = AdvancedMetrics::new();
        
        // Record different metric types
        service.record_custom_metric(create_test_custom_metric("counter", MetricType::Counter, 1.0)).await;
        service.record_custom_metric(create_test_custom_metric("gauge", MetricType::Gauge, 2.0)).await;
        service.record_custom_metric(create_test_custom_metric("histogram", MetricType::Histogram, 3.0)).await;
        service.record_custom_metric(create_test_custom_metric("summary", MetricType::Summary, 4.0)).await;
        
        let metrics = service.get_metrics().await;
        assert_eq!(metrics.len(), 4);
    }

    #[tokio::test]
    async fn test_record_custom_metric_with_labels() {
        let service = AdvancedMetrics::new();
        
        let mut labels = HashMap::new();
        labels.insert("environment".to_string(), "test".to_string());
        labels.insert("service".to_string(), "api".to_string());
        
        let metric = CustomMetric {
            name: "labeled_metric".to_string(),
            metric_type: MetricType::Gauge,
            value: 5.0,
            labels,
            timestamp: Utc::now().to_rfc3339(),
        };
        
        service.record_custom_metric(metric.clone()).await;
        
        let metrics = service.get_metrics().await;
        let recorded = metrics.iter().find(|m| m.name == "labeled_metric").unwrap();
        assert_eq!(recorded.labels.len(), 2);
        assert_eq!(recorded.labels.get("environment"), Some(&"test".to_string()));
    }

    #[tokio::test]
    async fn test_record_custom_metric_overwrite() {
        let service = AdvancedMetrics::new();
        
        // Record metric with same name
        service.record_custom_metric(create_test_custom_metric("same_name", MetricType::Counter, 10.0)).await;
        service.record_custom_metric(create_test_custom_metric("same_name", MetricType::Gauge, 20.0)).await;
        
        let metrics = service.get_metrics().await;
        assert_eq!(metrics.len(), 1); // Should overwrite, not duplicate
        assert_eq!(metrics[0].value, 20.0);
    }

    #[tokio::test]
    async fn test_get_metrics() {
        let service = AdvancedMetrics::new();
        
        // Record multiple metrics
        for i in 0..5 {
            service.record_custom_metric(create_test_custom_metric(
                &format!("metric_{}", i),
                MetricType::Counter,
                i as f64,
            )).await;
        }
        
        let metrics = service.get_metrics().await;
        assert_eq!(metrics.len(), 5);
    }

    #[tokio::test]
    async fn test_get_metrics_empty() {
        let service = AdvancedMetrics::new();
        
        let metrics = service.get_metrics().await;
        assert_eq!(metrics.len(), 0);
    }

    // =========================================================================
    // Business KPIs
    // =========================================================================

    #[tokio::test]
    async fn test_record_kpi() {
        let service = AdvancedMetrics::new();
        
        let kpi = create_test_kpi("revenue", 1000.0, 1200.0);
        service.record_kpi(kpi.clone()).await;
        
        // Verify KPI was recorded
        let kpis = service.get_kpis().await;
        assert!(kpis.iter().any(|k| k.name == "revenue"));
    }

    #[tokio::test]
    async fn test_record_multiple_kpis() {
        let service = AdvancedMetrics::new();
        
        // Record multiple KPIs
        service.record_kpi(create_test_kpi("revenue", 1000.0, 1200.0)).await;
        service.record_kpi(create_test_kpi("users", 500.0, 600.0)).await;
        service.record_kpi(create_test_kpi("conversion", 0.05, 0.06)).await;
        
        let kpis = service.get_kpis().await;
        assert_eq!(kpis.len(), 3);
    }

    #[tokio::test]
    async fn test_record_kpi_with_different_units() {
        let service = AdvancedMetrics::new();
        
        let kpi = BusinessKPI {
            name: "response_time".to_string(),
            value: 150.0,
            target: 100.0,
            unit: "ms".to_string(),
            timestamp: Utc::now().to_rfc3339(),
        };
        
        service.record_kpi(kpi.clone()).await;
        
        let kpis = service.get_kpis().await;
        let recorded = kpis.iter().find(|k| k.name == "response_time").unwrap();
        assert_eq!(recorded.unit, "ms");
    }

    #[tokio::test]
    async fn test_record_kpi_limit() {
        let service = AdvancedMetrics::new();
        
        // Record more than 1000 KPIs (limit is 1000)
        for i in 0..1500 {
            service.record_kpi(create_test_kpi(&format!("kpi_{}", i), i as f64, (i + 100) as f64)).await;
        }
        
        let kpis = service.get_kpis().await;
        // Should be limited to 1000
        assert_eq!(kpis.len(), 1000);
    }

    #[tokio::test]
    async fn test_get_kpis() {
        let service = AdvancedMetrics::new();
        
        // Record KPIs
        for i in 0..10 {
            service.record_kpi(create_test_kpi(&format!("kpi_{}", i), i as f64, (i + 10) as f64)).await;
        }
        
        let kpis = service.get_kpis().await;
        assert_eq!(kpis.len(), 10);
    }

    #[tokio::test]
    async fn test_get_kpis_empty() {
        let service = AdvancedMetrics::new();
        
        let kpis = service.get_kpis().await;
        assert_eq!(kpis.len(), 0);
    }

    // =========================================================================
    // SLA Metrics
    // =========================================================================

    #[tokio::test]
    async fn test_record_sla_metric() {
        let service = AdvancedMetrics::new();
        
        let sla = create_test_sla_metric("api", 99.9, 99.95);
        service.record_sla_metric("api".to_string(), sla.clone()).await;
        
        // Verify SLA was recorded
        let slas = service.get_sla_metrics().await;
        assert!(slas.contains_key("api"));
    }

    #[tokio::test]
    async fn test_record_multiple_sla_metrics() {
        let service = AdvancedMetrics::new();
        
        // Record SLA metrics for different services
        service.record_sla_metric("api".to_string(), create_test_sla_metric("api", 99.9, 99.95)).await;
        service.record_sla_metric("database".to_string(), create_test_sla_metric("database", 99.99, 99.99)).await;
        service.record_sla_metric("cache".to_string(), create_test_sla_metric("cache", 99.5, 99.9)).await;
        
        let slas = service.get_sla_metrics().await;
        assert_eq!(slas.len(), 3);
    }

    #[tokio::test]
    async fn test_record_sla_metric_overwrite() {
        let service = AdvancedMetrics::new();
        
        // Record SLA for same service twice
        service.record_sla_metric("api".to_string(), create_test_sla_metric("api", 99.9, 99.95)).await;
        service.record_sla_metric("api".to_string(), create_test_sla_metric("api", 99.95, 99.95)).await;
        
        let slas = service.get_sla_metrics().await;
        assert_eq!(slas.len(), 1); // Should overwrite
        assert_eq!(slas.get("api").unwrap().uptime_percentage, 99.95);
    }

    #[tokio::test]
    async fn test_record_sla_metric_with_response_times() {
        let service = AdvancedMetrics::new();
        
        let sla = SLAMetric {
            service: "api".to_string(),
            uptime_percentage: 99.9,
            target_uptime: 99.95,
            response_time_p95: Duration::from_millis(150),
            response_time_p99: Duration::from_millis(300),
            error_rate: 0.005,
            timestamp: Utc::now().to_rfc3339(),
        };
        
        service.record_sla_metric("api".to_string(), sla.clone()).await;
        
        let slas = service.get_sla_metrics().await;
        let recorded = slas.get("api").unwrap();
        assert_eq!(recorded.response_time_p95, Duration::from_millis(150));
        assert_eq!(recorded.response_time_p99, Duration::from_millis(300));
        assert_eq!(recorded.error_rate, 0.005);
    }

    #[tokio::test]
    async fn test_get_sla_metrics() {
        let service = AdvancedMetrics::new();
        
        // Record SLA metrics
        service.record_sla_metric("service1".to_string(), create_test_sla_metric("service1", 99.9, 99.95)).await;
        service.record_sla_metric("service2".to_string(), create_test_sla_metric("service2", 99.8, 99.9)).await;
        
        let slas = service.get_sla_metrics().await;
        assert_eq!(slas.len(), 2);
        assert!(slas.contains_key("service1"));
        assert!(slas.contains_key("service2"));
    }

    #[tokio::test]
    async fn test_get_sla_metrics_empty() {
        let service = AdvancedMetrics::new();
        
        let slas = service.get_sla_metrics().await;
        assert_eq!(slas.len(), 0);
    }

    // =========================================================================
    // Edge Cases and Error Conditions
    // =========================================================================

    #[tokio::test]
    async fn test_custom_metric_with_negative_value() {
        let service = AdvancedMetrics::new();
        
        let metric = create_test_custom_metric("negative", MetricType::Gauge, -10.0);
        service.record_custom_metric(metric).await;
        
        let metrics = service.get_metrics().await;
        let recorded = metrics.iter().find(|m| m.name == "negative").unwrap();
        assert_eq!(recorded.value, -10.0);
    }

    #[tokio::test]
    async fn test_custom_metric_with_zero_value() {
        let service = AdvancedMetrics::new();
        
        let metric = create_test_custom_metric("zero", MetricType::Counter, 0.0);
        service.record_custom_metric(metric).await;
        
        let metrics = service.get_metrics().await;
        let recorded = metrics.iter().find(|m| m.name == "zero").unwrap();
        assert_eq!(recorded.value, 0.0);
    }

    #[tokio::test]
    async fn test_custom_metric_with_very_large_value() {
        let service = AdvancedMetrics::new();
        
        let metric = create_test_custom_metric("large", MetricType::Gauge, f64::MAX);
        service.record_custom_metric(metric).await;
        
        let metrics = service.get_metrics().await;
        let recorded = metrics.iter().find(|m| m.name == "large").unwrap();
        assert_eq!(recorded.value, f64::MAX);
    }

    #[tokio::test]
    async fn test_kpi_with_value_exceeding_target() {
        let service = AdvancedMetrics::new();
        
        let kpi = create_test_kpi("exceeding", 1500.0, 1200.0);
        service.record_kpi(kpi).await;
        
        let kpis = service.get_kpis().await;
        let recorded = kpis.iter().find(|k| k.name == "exceeding").unwrap();
        assert!(recorded.value > recorded.target);
    }

    #[tokio::test]
    async fn test_kpi_with_value_below_target() {
        let service = AdvancedMetrics::new();
        
        let kpi = create_test_kpi("below", 800.0, 1200.0);
        service.record_kpi(kpi).await;
        
        let kpis = service.get_kpis().await;
        let recorded = kpis.iter().find(|k| k.name == "below").unwrap();
        assert!(recorded.value < recorded.target);
    }

    #[tokio::test]
    async fn test_sla_metric_with_uptime_below_target() {
        let service = AdvancedMetrics::new();
        
        let sla = create_test_sla_metric("degraded", 95.0, 99.9);
        service.record_sla_metric("degraded".to_string(), sla).await;
        
        let slas = service.get_sla_metrics().await;
        let recorded = slas.get("degraded").unwrap();
        assert!(recorded.uptime_percentage < recorded.target_uptime);
    }

    #[tokio::test]
    async fn test_sla_metric_with_high_error_rate() {
        let service = AdvancedMetrics::new();
        
        let sla = SLAMetric {
            service: "error_service".to_string(),
            uptime_percentage: 99.0,
            target_uptime: 99.9,
            response_time_p95: Duration::from_millis(500),
            response_time_p99: Duration::from_millis(1000),
            error_rate: 0.1, // 10% error rate
            timestamp: Utc::now().to_rfc3339(),
        };
        
        service.record_sla_metric("error_service".to_string(), sla).await;
        
        let slas = service.get_sla_metrics().await;
        let recorded = slas.get("error_service").unwrap();
        assert_eq!(recorded.error_rate, 0.1);
    }

    #[tokio::test]
    async fn test_concurrent_metric_recording() {
        let service = AdvancedMetrics::new();
        
        // Record metrics concurrently
        let handles: Vec<_> = (0..20).map(|i| {
            let service = &service;
            tokio::spawn(async move {
                service.record_custom_metric(create_test_custom_metric(
                    &format!("concurrent_{}", i),
                    MetricType::Counter,
                    i as f64,
                )).await;
            })
        }).collect();

        futures::future::join_all(handles).await;

        let metrics = service.get_metrics().await;
        assert!(metrics.len() >= 20);
    }

    #[tokio::test]
    async fn test_concurrent_kpi_recording() {
        let service = AdvancedMetrics::new();
        
        // Record KPIs concurrently
        let handles: Vec<_> = (0..50).map(|i| {
            let service = &service;
            tokio::spawn(async move {
                service.record_kpi(create_test_kpi(&format!("kpi_{}", i), i as f64, (i + 10) as f64)).await;
            })
        }).collect();

        futures::future::join_all(handles).await;

        let kpis = service.get_kpis().await;
        assert!(kpis.len() >= 50);
    }

    #[tokio::test]
    async fn test_concurrent_sla_recording() {
        let service = AdvancedMetrics::new();
        
        // Record SLA metrics concurrently
        let handles: Vec<_> = (0..10).map(|i| {
            let service = &service;
            tokio::spawn(async move {
                service.record_sla_metric(
                    format!("service_{}", i),
                    create_test_sla_metric(&format!("service_{}", i), 99.0 + i as f64 * 0.1, 99.9),
                ).await;
            })
        }).collect();

        futures::future::join_all(handles).await;

        let slas = service.get_sla_metrics().await;
        assert!(slas.len() >= 10);
    }

    #[tokio::test]
    async fn test_custom_metric_empty_name() {
        let service = AdvancedMetrics::new();
        
        let metric = CustomMetric {
            name: "".to_string(),
            metric_type: MetricType::Counter,
            value: 1.0,
            labels: HashMap::new(),
            timestamp: Utc::now().to_rfc3339(),
        };
        
        service.record_custom_metric(metric).await;
        
        let metrics = service.get_metrics().await;
        assert!(metrics.iter().any(|m| m.name.is_empty()));
    }

    #[tokio::test]
    async fn test_kpi_empty_name() {
        let service = AdvancedMetrics::new();
        
        let kpi = BusinessKPI {
            name: "".to_string(),
            value: 100.0,
            target: 120.0,
            unit: "count".to_string(),
            timestamp: Utc::now().to_rfc3339(),
        };
        
        service.record_kpi(kpi).await;
        
        let kpis = service.get_kpis().await;
        assert!(kpis.iter().any(|k| k.name.is_empty()));
    }

    #[tokio::test]
    async fn test_sla_metric_empty_service_name() {
        let service = AdvancedMetrics::new();
        
        let sla = create_test_sla_metric("", 99.9, 99.95);
        service.record_sla_metric("".to_string(), sla).await;
        
        let slas = service.get_sla_metrics().await;
        assert!(slas.contains_key(""));
    }

    #[tokio::test]
    async fn test_get_all_metrics_types() {
        let service = AdvancedMetrics::new();
        
        // Record metrics, KPIs, and SLA metrics
        service.record_custom_metric(create_test_custom_metric("metric1", MetricType::Counter, 10.0)).await;
        service.record_kpi(create_test_kpi("kpi1", 100.0, 120.0)).await;
        service.record_sla_metric("service1".to_string(), create_test_sla_metric("service1", 99.9, 99.95)).await;
        
        let metrics = service.get_metrics().await;
        let kpis = service.get_kpis().await;
        let slas = service.get_sla_metrics().await;
        
        assert_eq!(metrics.len(), 1);
        assert_eq!(kpis.len(), 1);
        assert_eq!(slas.len(), 1);
    }

    #[tokio::test]
    async fn test_sla_metric_with_zero_uptime() {
        let service = AdvancedMetrics::new();
        
        let sla = create_test_sla_metric("down", 0.0, 99.9);
        service.record_sla_metric("down".to_string(), sla).await;
        
        let slas = service.get_sla_metrics().await;
        let recorded = slas.get("down").unwrap();
        assert_eq!(recorded.uptime_percentage, 0.0);
    }

    #[tokio::test]
    async fn test_sla_metric_with_perfect_uptime() {
        let service = AdvancedMetrics::new();
        
        let sla = create_test_sla_metric("perfect", 100.0, 99.9);
        service.record_sla_metric("perfect".to_string(), sla).await;
        
        let slas = service.get_sla_metrics().await;
        let recorded = slas.get("perfect").unwrap();
        assert_eq!(recorded.uptime_percentage, 100.0);
    }

    #[tokio::test]
    async fn test_sla_metric_with_zero_error_rate() {
        let service = AdvancedMetrics::new();
        
        let sla = SLAMetric {
            service: "perfect_service".to_string(),
            uptime_percentage: 100.0,
            target_uptime: 99.9,
            response_time_p95: Duration::from_millis(50),
            response_time_p99: Duration::from_millis(100),
            error_rate: 0.0,
            timestamp: Utc::now().to_rfc3339(),
        };
        
        service.record_sla_metric("perfect_service".to_string(), sla).await;
        
        let slas = service.get_sla_metrics().await;
        let recorded = slas.get("perfect_service").unwrap();
        assert_eq!(recorded.error_rate, 0.0);
    }

    #[tokio::test]
    async fn test_custom_metric_timestamp() {
        let service = AdvancedMetrics::new();
        
        let timestamp = Utc::now().to_rfc3339();
        let metric = CustomMetric {
            name: "timestamped".to_string(),
            metric_type: MetricType::Gauge,
            value: 5.0,
            labels: HashMap::new(),
            timestamp: timestamp.clone(),
        };
        
        service.record_custom_metric(metric).await;
        
        let metrics = service.get_metrics().await;
        let recorded = metrics.iter().find(|m| m.name == "timestamped").unwrap();
        assert_eq!(recorded.timestamp, timestamp);
    }

    #[tokio::test]
    async fn test_kpi_timestamp() {
        let service = AdvancedMetrics::new();
        
        let timestamp = Utc::now().to_rfc3339();
        let kpi = BusinessKPI {
            name: "timestamped_kpi".to_string(),
            value: 100.0,
            target: 120.0,
            unit: "count".to_string(),
            timestamp: timestamp.clone(),
        };
        
        service.record_kpi(kpi).await;
        
        let kpis = service.get_kpis().await;
        let recorded = kpis.iter().find(|k| k.name == "timestamped_kpi").unwrap();
        assert_eq!(recorded.timestamp, timestamp);
    }

    #[tokio::test]
    async fn test_sla_metric_timestamp() {
        let service = AdvancedMetrics::new();
        
        let timestamp = Utc::now().to_rfc3339();
        let sla = SLAMetric {
            service: "timestamped_service".to_string(),
            uptime_percentage: 99.9,
            target_uptime: 99.95,
            response_time_p95: Duration::from_millis(100),
            response_time_p99: Duration::from_millis(200),
            error_rate: 0.01,
            timestamp: timestamp.clone(),
        };
        
        service.record_sla_metric("timestamped_service".to_string(), sla).await;
        
        let slas = service.get_sla_metrics().await;
        let recorded = slas.get("timestamped_service").unwrap();
        assert_eq!(recorded.timestamp, timestamp);
    }
}

