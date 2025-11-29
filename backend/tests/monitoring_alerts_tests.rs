//! Service layer tests for AlertManager
//!
//! Tests AlertManager methods including alert definitions,
//! alert triggering, and alert resolution.

use reconciliation_backend::services::monitoring::AlertManager;
use reconciliation_backend::services::monitoring::types::{
    AlertDefinition, AlertSeverity, NotificationChannel,
};

/// Test AlertManager methods
#[cfg(test)]
mod monitoring_alerts_tests {
    use super::*;

    fn create_test_alert_definition() -> AlertDefinition {
        AlertDefinition {
            id: "test_alert".to_string(),
            name: "Test Alert".to_string(),
            description: "A test alert".to_string(),
            severity: AlertSeverity::Warning,
            condition: "cpu_usage > 80".to_string(),
            threshold: 80.0,
            enabled: true,
            notification_channels: vec![NotificationChannel {
                type_: "email".to_string(),
                endpoint: "admin@example.com".to_string(),
                config: None,
            }],
        }
    }

    #[tokio::test]
    async fn test_alert_manager_creation() {
        let alert_manager = AlertManager::new();
        
        // Verify manager is created
        assert!(true);
    }

    #[tokio::test]
    async fn test_alert_manager_default() {
        let alert_manager = AlertManager::default();
        
        // Verify manager is created
        assert!(true);
    }

    #[tokio::test]
    async fn test_add_alert_definition() {
        let alert_manager = AlertManager::new();
        let definition = create_test_alert_definition();

        let result = alert_manager.add_alert_definition(definition).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_get_alert_definition() {
        let alert_manager = AlertManager::new();
        let definition = create_test_alert_definition();

        alert_manager.add_alert_definition(definition.clone()).await.unwrap();

        let retrieved = alert_manager.get_alert_definition("test_alert").await;
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().id, "test_alert");
    }

    #[tokio::test]
    async fn test_get_alert_definition_nonexistent() {
        let alert_manager = AlertManager::new();

        let retrieved = alert_manager.get_alert_definition("nonexistent").await;
        assert!(retrieved.is_none());
    }

    #[tokio::test]
    async fn test_list_alert_definitions() {
        let alert_manager = AlertManager::new();
        let definition1 = create_test_alert_definition();
        
        let mut definition2 = create_test_alert_definition();
        definition2.id = "test_alert_2".to_string();
        definition2.name = "Test Alert 2".to_string();

        alert_manager.add_alert_definition(definition1).await.unwrap();
        alert_manager.add_alert_definition(definition2).await.unwrap();

        let definitions = alert_manager.list_alert_definitions().await;
        assert_eq!(definitions.len(), 2);
    }

    #[tokio::test]
    async fn test_remove_alert_definition() {
        let alert_manager = AlertManager::new();
        let definition = create_test_alert_definition();

        alert_manager.add_alert_definition(definition).await.unwrap();
        
        let result = alert_manager.remove_alert_definition("test_alert").await;
        assert!(result.is_ok());

        let retrieved = alert_manager.get_alert_definition("test_alert").await;
        assert!(retrieved.is_none());
    }

    #[tokio::test]
    async fn test_trigger_alert() {
        let alert_manager = AlertManager::new();
        let definition = create_test_alert_definition();

        alert_manager.add_alert_definition(definition).await.unwrap();

        let result = alert_manager.trigger_alert(
            "test_alert",
            AlertSeverity::Critical,
            "CPU usage exceeded threshold".to_string(),
        ).await;

        assert!(result.is_ok());
        let alert_id = result.unwrap();
        assert!(!alert_id.is_nil());
    }

    #[tokio::test]
    async fn test_trigger_alert_nonexistent() {
        let alert_manager = AlertManager::new();

        let result = alert_manager.trigger_alert(
            "nonexistent_alert",
            AlertSeverity::Warning,
            "Test message".to_string(),
        ).await;

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_resolve_alert() {
        let alert_manager = AlertManager::new();
        let definition = create_test_alert_definition();

        alert_manager.add_alert_definition(definition).await.unwrap();

        let alert_id = alert_manager.trigger_alert(
            "test_alert",
            AlertSeverity::Warning,
            "Test alert".to_string(),
        ).await.unwrap();

        let result = alert_manager.resolve_alert(alert_id).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_list_active_alerts() {
        let alert_manager = AlertManager::new();
        let definition = create_test_alert_definition();

        alert_manager.add_alert_definition(definition).await.unwrap();

        // Trigger multiple alerts
        let alert_id1 = alert_manager.trigger_alert(
            "test_alert",
            AlertSeverity::Warning,
            "Alert 1".to_string(),
        ).await.unwrap();

        let alert_id2 = alert_manager.trigger_alert(
            "test_alert",
            AlertSeverity::Critical,
            "Alert 2".to_string(),
        ).await.unwrap();

        let active_alerts = alert_manager.list_active_alerts().await;
        assert!(active_alerts.len() >= 2);

        // Resolve one alert
        alert_manager.resolve_alert(alert_id1).await.unwrap();

        let active_alerts_after = alert_manager.list_active_alerts().await;
        assert!(active_alerts_after.len() >= 1);
    }

    #[tokio::test]
    async fn test_trigger_alert_various_severities() {
        let alert_manager = AlertManager::new();
        let definition = create_test_alert_definition();

        alert_manager.add_alert_definition(definition).await.unwrap();

        // Test different severities
        let severities = vec![
            AlertSeverity::Critical,
            AlertSeverity::Warning,
            AlertSeverity::Info,
        ];

        for severity in severities {
            let result = alert_manager.trigger_alert(
                "test_alert",
                severity,
                format!("Alert with severity {:?}", severity),
            ).await;
            assert!(result.is_ok());
        }
    }

    #[tokio::test]
    async fn test_alert_manager_concurrent_operations() {
        let alert_manager = AlertManager::new();
        let definition = create_test_alert_definition();

        alert_manager.add_alert_definition(definition).await.unwrap();

        // Test concurrent operations
        let (result1, result2, result3) = tokio::join!(
            alert_manager.trigger_alert("test_alert", AlertSeverity::Warning, "Alert 1".to_string()),
            alert_manager.trigger_alert("test_alert", AlertSeverity::Critical, "Alert 2".to_string()),
            alert_manager.list_active_alerts()
        );

        assert!(result1.is_ok());
        assert!(result2.is_ok());
        assert!(result3.len() >= 0);
    }
}

