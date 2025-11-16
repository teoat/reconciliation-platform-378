//! Alert management implementation

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;
use chrono::Utc;

use crate::errors::{AppError, AppResult};
use crate::services::monitoring::types::{AlertDefinition, AlertInstance, AlertSeverity, AlertStatus};

/// Alert manager
pub struct AlertManager {
    alert_definitions: Arc<RwLock<HashMap<String, AlertDefinition>>>,
    active_alerts: Arc<RwLock<HashMap<Uuid, AlertInstance>>>,
}

impl AlertManager {
    pub fn new() -> Self {
        Self {
            alert_definitions: Arc::new(RwLock::new(HashMap::new())),
            active_alerts: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Add alert definition
    pub async fn add_alert_definition(&self, definition: AlertDefinition) -> AppResult<()> {
        let mut definitions = self.alert_definitions.write().await;
        definitions.insert(definition.id.clone(), definition);
        Ok(())
    }

    /// Remove alert definition
    pub async fn remove_alert_definition(&self, alert_id: &str) -> AppResult<()> {
        let mut definitions = self.alert_definitions.write().await;
        definitions.remove(alert_id);
        Ok(())
    }

    /// Get alert definition
    pub async fn get_alert_definition(&self, alert_id: &str) -> Option<AlertDefinition> {
        let definitions = self.alert_definitions.read().await;
        definitions.get(alert_id).cloned()
    }

    /// List all alert definitions
    pub async fn list_alert_definitions(&self) -> Vec<AlertDefinition> {
        let definitions = self.alert_definitions.read().await;
        definitions.values().cloned().collect()
    }

    /// Trigger an alert
    pub async fn trigger_alert(&self, alert_id: &str, severity: AlertSeverity, message: String) -> AppResult<Uuid> {
        let definition = self.get_alert_definition(alert_id).await
            .ok_or_else(|| AppError::ValidationError("Alert definition not found".to_string()))?;

        let message_clone = message.clone();
        let alert_instance = AlertInstance {
            id: Uuid::new_v4(),
            alert_id: alert_id.to_string(),
            severity,
            message,
            triggered_at: Utc::now(),
            resolved_at: None,
            status: AlertStatus::Active,
        };

        let alert_id = alert_instance.id;
        self.active_alerts.write().await.insert(alert_id, alert_instance);

        // Send notifications
        self.send_notifications(&definition, &message_clone).await?;

        Ok(alert_id)
    }

    /// Resolve an alert
    pub async fn resolve_alert(&self, alert_instance_id: Uuid) -> AppResult<()> {
        let mut alerts = self.active_alerts.write().await;
        if let Some(mut alert) = alerts.get_mut(&alert_instance_id) {
            alert.status = AlertStatus::Resolved;
            alert.resolved_at = Some(Utc::now());
        }
        Ok(())
    }

    /// List active alerts
    pub async fn list_active_alerts(&self) -> Vec<AlertInstance> {
        let alerts = self.active_alerts.read().await;
        alerts.values()
            .filter(|a| matches!(a.status, AlertStatus::Active))
            .cloned()
            .collect()
    }

    /// Send notifications for an alert
    async fn send_notifications(&self, definition: &AlertDefinition, message: &str) -> AppResult<()> {
        for channel in &definition.notification_channels {
            // In a real implementation, this would send notifications via the configured channels
            log::info!("Sending alert notification via {} to {}: {}", channel.type_, channel.endpoint, message);
        }
        Ok(())
    }
}

impl Default for AlertManager {
    fn default() -> Self {
        Self::new()
    }
}

