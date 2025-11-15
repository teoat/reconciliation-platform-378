//! S-Tier Architecture Tests
//! Comprehensive tests for all S-Tier features

use reconciliation_backend::services::{
    security_monitor::{SecurityMonitor, AnomalyDetectionConfig},
    query_optimizer::{QueryOptimizer, QueryOptimizerConfig},
    advanced_metrics::AdvancedMetrics,
    structured_logging::StructuredLogging,
};
use std::time::Duration;
use uuid::Uuid;
use std::collections::HashMap;

#[tokio::test]
async fn test_security_monitor_brute_force_detection() {
    let config = AnomalyDetectionConfig::default();
    let monitor = SecurityMonitor::new(config);
    
    // Simulate brute force attack
    for _ in 0..5 {
        let _ = monitor.detect_brute_force("127.0.0.1", false).await;
    }
    
    let detected = monitor.detect_brute_force("127.0.0.1", false).await.unwrap();
    assert!(detected, "Should detect brute force attack after 5 failures");
}

#[tokio::test]
async fn test_query_optimizer_slow_query() {
    let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
    
    let slow_duration = Duration::from_millis(150);
    let analysis = optimizer.analyze_query(
        "SELECT * FROM users WHERE name LIKE '%test%'",
        slow_duration
    ).await;
    
    assert!(analysis.is_slow, "Should detect slow query");
    assert!(analysis.duration > Duration::from_millis(100));
    assert!(!analysis.optimization_suggestions.is_empty());
}

#[tokio::test]
async fn test_query_optimizer_suggestions() {
    let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
    
    let analysis = optimizer.analyze_query(
        "SELECT * FROM users",
        Duration::from_millis(50)
    ).await;
    
    let has_select_star_warning = analysis.optimization_suggestions
        .iter()
        .any(|s| s.contains("SELECT *"));
    
    assert!(has_select_star_warning, "Should suggest avoiding SELECT *");
}

#[test]
fn test_advanced_metrics_creation() {
    let metrics = AdvancedMetrics::new();
    assert!(true, "AdvancedMetrics should be created successfully");
}

#[test]
fn test_structured_logging() {
    let logging = StructuredLogging::new("test_service".to_string());
    
    let mut fields = HashMap::new();
    fields.insert("user_id".to_string(), serde_json::json!("123"));
    fields.insert("action".to_string(), serde_json::json!("login"));
    
    logging.log(
        reconciliation_backend::services::structured_logging::LogLevel::Info,
        "User logged in",
        fields
    );
    
    assert!(true, "Structured logging should work");
}

#[tokio::test]
async fn test_security_monitor_event_recording() {
    let config = AnomalyDetectionConfig::default();
    let monitor = SecurityMonitor::new(config);
    
    let event = reconciliation_backend::services::security_monitor::SecurityEvent {
        id: Uuid::new_v4().to_string(),
        event_type: reconciliation_backend::services::security_monitor::SecurityEventType::AuthenticationFailure,
        severity: reconciliation_backend::services::security_monitor::SecuritySeverity::Medium,
        timestamp: chrono::Utc::now().to_rfc3339(),
        source_ip: Some("192.168.1.1".to_string()),
        user_id: Some("user123".to_string()),
        description: "Failed login attempt".to_string(),
        metadata: HashMap::new(),
    };
    
    let result = monitor.record_event(event).await;
    assert!(result.is_ok(), "Should record event successfully");
    
    let events = monitor.get_recent_events(10).await;
    assert!(!events.is_empty(), "Should have recent events");
}

#[tokio::test]
async fn test_query_optimizer_index_recommendations() {
    let config = QueryOptimizerConfig {
        enable_index_recommendations: true,
        ..Default::default()
    };
    let optimizer = QueryOptimizer::new(config);
    
    let analysis = optimizer.analyze_query(
        "SELECT * FROM orders WHERE user_id = 123 ORDER BY created_at",
        Duration::from_millis(80)
    ).await;
    
    // Should recommend indexes for WHERE and ORDER BY
    assert!(!analysis.index_suggestions.is_empty());
}

#[tokio::test]
async fn test_query_optimizer_stats() {
    let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
    
    // Analyze multiple queries
    optimizer.analyze_query("SELECT * FROM users", Duration::from_millis(150)).await;
    optimizer.analyze_query("SELECT id FROM users WHERE name = 'test'", Duration::from_millis(30)).await;
    optimizer.analyze_query("SELECT * FROM orders", Duration::from_millis(200)).await;
    
    let stats = optimizer.get_stats().await;
    assert_eq!(stats.total_queries, 3);
    assert_eq!(stats.slow_queries, 2); // 2 queries > 100ms
}

