// backend/src/services/monitoring_alerting.rs
use crate::errors::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{interval, sleep};

/// Alert severity levels
#[derive(Debug, Clone, Serialize, Deserialize, Hash, PartialEq, Eq, PartialOrd, Ord)]
pub enum AlertSeverity {
    Info,
    Warning,
    Critical,
    Emergency,
}

/// Alert status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AlertStatus {
    Active,
    Acknowledged,
    Resolved,
    Suppressed,
}

/// Alert definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertDefinition {
    pub id: String,
    pub name: String,
    pub description: String,
    pub severity: AlertSeverity,
    pub condition: AlertCondition,
    pub notification_channels: Vec<String>,
    pub escalation_policy: Option<String>,
    pub enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Alert condition types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertCondition {
    /// Metric threshold condition
    MetricThreshold {
        metric_name: String,
        operator: ThresholdOperator,
        threshold_value: f64,
        evaluation_period: Duration,
    },
    /// Multiple metrics condition
    MultiMetric {
        conditions: Vec<AlertCondition>,
        operator: LogicalOperator,
    },
    /// Custom expression condition
    CustomExpression {
        expression: String,
        evaluation_period: Duration,
    },
    /// Health check failure condition
    HealthCheckFailure {
        service_name: String,
        consecutive_failures: u32,
    },
}

/// Threshold operators
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ThresholdOperator {
    GreaterThan,
    GreaterThanOrEqual,
    LessThan,
    LessThanOrEqual,
    Equal,
    NotEqual,
}

/// Logical operators
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LogicalOperator {
    And,
    Or,
}

/// Active alert instance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertInstance {
    pub id: Uuid,
    pub definition_id: String,
    pub severity: AlertSeverity,
    pub status: AlertStatus,
    pub triggered_at: DateTime<Utc>,
    pub acknowledged_at: Option<DateTime<Utc>>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub acknowledged_by: Option<String>,
    pub resolved_by: Option<String>,
    pub message: String,
    pub metadata: HashMap<String, serde_json::Value>,
    pub escalation_level: u32,
}

/// Notification channel configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationChannel {
    pub id: String,
    pub name: String,
    pub channel_type: NotificationChannelType,
    pub configuration: HashMap<String, serde_json::Value>,
    pub enabled: bool,
}

/// Notification channel types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NotificationChannelType {
    Email {
        recipients: Vec<String>,
        smtp_config: SmtpConfig,
    },
    Slack {
        webhook_url: String,
        channel: String,
    },
    Webhook {
        url: String,
        headers: HashMap<String, String>,
    },
    PagerDuty {
        integration_key: String,
    },
    Teams {
        webhook_url: String,
    },
}

/// SMTP configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmtpConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub use_tls: bool,
}

/// Escalation policy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EscalationPolicy {
    pub id: String,
    pub name: String,
    pub levels: Vec<EscalationLevel>,
    pub repeat_interval: Duration,
    pub max_escalations: u32,
}

/// Escalation level
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EscalationLevel {
    pub level: u32,
    pub delay: Duration,
    pub notification_channels: Vec<String>,
    pub users: Vec<String>,
}

/// System metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    pub timestamp: DateTime<Utc>,
    pub cpu_usage_percent: f64,
    pub memory_usage_percent: f64,
    pub disk_usage_percent: f64,
    pub network_io_bytes: u64,
    pub active_connections: u32,
    pub request_rate_per_second: f64,
    pub error_rate_percent: f64,
    pub response_time_ms: f64,
}

/// Health check result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckResult {
    pub service_name: String,
    pub status: HealthStatus,
    pub response_time_ms: u64,
    pub error_message: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Health status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum HealthStatus {
    Healthy,
    Degraded,
    Unhealthy,
}

/// Monitoring and alerting service
pub struct MonitoringAlertingService {
    alert_definitions: Arc<RwLock<HashMap<String, AlertDefinition>>>,
    active_alerts: Arc<RwLock<HashMap<Uuid, AlertInstance>>>,
    notification_channels: Arc<RwLock<HashMap<String, NotificationChannel>>>,
    escalation_policies: Arc<RwLock<HashMap<String, EscalationPolicy>>>,
    system_metrics: Arc<RwLock<Vec<SystemMetrics>>>,
    health_checks: Arc<RwLock<HashMap<String, HealthCheckResult>>>,
    alert_stats: Arc<RwLock<AlertStats>>,
}

/// Alert statistics
#[derive(Debug, Clone, Default)]
pub struct AlertStats {
    pub total_alerts_triggered: u64,
    pub active_alerts_count: u64,
    pub resolved_alerts_count: u64,
    pub acknowledged_alerts_count: u64,
    pub alerts_by_severity: HashMap<AlertSeverity, u64>,
    pub average_resolution_time_minutes: f64,
}

impl MonitoringAlertingService {
    pub fn new() -> Self {
        Self {
            alert_definitions: Arc::new(RwLock::new(HashMap::new())),
            active_alerts: Arc::new(RwLock::new(HashMap::new())),
            notification_channels: Arc::new(RwLock::new(HashMap::new())),
            escalation_policies: Arc::new(RwLock::new(HashMap::new())),
            system_metrics: Arc::new(RwLock::new(Vec::new())),
            health_checks: Arc::new(RwLock::new(HashMap::new())),
            alert_stats: Arc::new(RwLock::new(AlertStats::default())),
        }
    }

    /// Start monitoring service
    pub async fn start_monitoring(&self) -> AppResult<()> {
        // Start system metrics collection
        let metrics_collector = self.clone();
        tokio::spawn(async move {
            let mut interval = interval(Duration::from_secs(30));
            loop {
                interval.tick().await;
                if let Err(e) = metrics_collector.collect_system_metrics().await {
                    eprintln!("Failed to collect system metrics: {}", e);
                }
            }
        });

        // Start health check monitoring
        let health_monitor = self.clone();
        tokio::spawn(async move {
            let mut interval = interval(Duration::from_secs(60));
            loop {
                interval.tick().await;
                if let Err(e) = health_monitor.perform_health_checks().await {
                    eprintln!("Failed to perform health checks: {}", e);
                }
            }
        });

        // Start alert evaluation
        let alert_evaluator = self.clone();
        tokio::spawn(async move {
            let mut interval = interval(Duration::from_secs(10));
            loop {
                interval.tick().await;
                if let Err(e) = alert_evaluator.evaluate_alerts().await {
                    eprintln!("Failed to evaluate alerts: {}", e);
                }
            }
        });

        // Start escalation processing
        let escalation_processor = self.clone();
        tokio::spawn(async move {
            let mut interval = interval(Duration::from_secs(60));
            loop {
                interval.tick().await;
                if let Err(e) = escalation_processor.process_escalations().await {
                    eprintln!("Failed to process escalations: {}", e);
                }
            }
        });

        Ok(())
    }

    /// Add alert definition
    pub async fn add_alert_definition(&self, definition: AlertDefinition) -> AppResult<()> {
        self.alert_definitions.write().await.insert(definition.id.clone(), definition);
        Ok(())
    }

    /// Update alert definition
    pub async fn update_alert_definition(&self, id: &str, definition: AlertDefinition) -> AppResult<()> {
        self.alert_definitions.write().await.insert(id.to_string(), definition);
        Ok(())
    }

    /// Remove alert definition
    pub async fn remove_alert_definition(&self, id: &str) -> AppResult<()> {
        self.alert_definitions.write().await.remove(id);
        Ok(())
    }

    /// Get alert definition
    pub async fn get_alert_definition(&self, id: &str) -> AppResult<Option<AlertDefinition>> {
        let definitions = self.alert_definitions.read().await;
        Ok(definitions.get(id).cloned())
    }

    /// List alert definitions
    pub async fn list_alert_definitions(&self) -> AppResult<Vec<AlertDefinition>> {
        let definitions = self.alert_definitions.read().await;
        Ok(definitions.values().cloned().collect())
    }

    /// Add notification channel
    pub async fn add_notification_channel(&self, channel: NotificationChannel) -> AppResult<()> {
        self.notification_channels.write().await.insert(channel.id.clone(), channel);
        Ok(())
    }

    /// Update notification channel
    pub async fn update_notification_channel(&self, id: &str, channel: NotificationChannel) -> AppResult<()> {
        self.notification_channels.write().await.insert(id.to_string(), channel);
        Ok(())
    }

    /// Remove notification channel
    pub async fn remove_notification_channel(&self, id: &str) -> AppResult<()> {
        self.notification_channels.write().await.remove(id);
        Ok(())
    }

    /// Get notification channel
    pub async fn get_notification_channel(&self, id: &str) -> AppResult<Option<NotificationChannel>> {
        let channels = self.notification_channels.read().await;
        Ok(channels.get(id).cloned())
    }

    /// List notification channels
    pub async fn list_notification_channels(&self) -> AppResult<Vec<NotificationChannel>> {
        let channels = self.notification_channels.read().await;
        Ok(channels.values().cloned().collect())
    }

    /// Add escalation policy
    pub async fn add_escalation_policy(&self, policy: EscalationPolicy) -> AppResult<()> {
        self.escalation_policies.write().await.insert(policy.id.clone(), policy);
        Ok(())
    }

    /// Update escalation policy
    pub async fn update_escalation_policy(&self, id: &str, policy: EscalationPolicy) -> AppResult<()> {
        self.escalation_policies.write().await.insert(id.to_string(), policy);
        Ok(())
    }

    /// Remove escalation policy
    pub async fn remove_escalation_policy(&self, id: &str) -> AppResult<()> {
        self.escalation_policies.write().await.remove(id);
        Ok(())
    }

    /// Get escalation policy
    pub async fn get_escalation_policy(&self, id: &str) -> AppResult<Option<EscalationPolicy>> {
        let policies = self.escalation_policies.read().await;
        Ok(policies.get(id).cloned())
    }

    /// List escalation policies
    pub async fn list_escalation_policies(&self) -> AppResult<Vec<EscalationPolicy>> {
        let policies = self.escalation_policies.read().await;
        Ok(policies.values().cloned().collect())
    }

    /// Trigger alert manually
    pub async fn trigger_alert(&self, definition_id: &str, message: String, metadata: HashMap<String, serde_json::Value>) -> AppResult<Uuid> {
        let definition = self.get_alert_definition(definition_id).await?
            .ok_or_else(|| AppError::Validation("Alert definition not found".to_string()))?;

        let alert_id = Uuid::new_v4();
        let alert_instance = AlertInstance {
            id: alert_id,
            definition_id: definition_id.to_string(),
            severity: definition.severity.clone(),
            status: AlertStatus::Active,
            triggered_at: Utc::now(),
            acknowledged_at: None,
            resolved_at: None,
            acknowledged_by: None,
            resolved_by: None,
            message,
            metadata,
            escalation_level: 0,
        };

        self.active_alerts.write().await.insert(alert_id, alert_instance.clone());
        self.update_alert_stats(&alert_instance).await;

        // Send notifications
        self.send_notifications(&alert_instance, &definition).await?;

        Ok(alert_id)
    }

    /// Acknowledge alert
    pub async fn acknowledge_alert(&self, alert_id: Uuid, acknowledged_by: String) -> AppResult<()> {
        let mut alerts = self.active_alerts.write().await;
        if let Some(alert) = alerts.get_mut(&alert_id) {
            alert.status = AlertStatus::Acknowledged;
            alert.acknowledged_at = Some(Utc::now());
            alert.acknowledged_by = Some(acknowledged_by);
        }
        Ok(())
    }

    /// Resolve alert
    pub async fn resolve_alert(&self, alert_id: Uuid, resolved_by: String) -> AppResult<()> {
        let mut alerts = self.active_alerts.write().await;
        if let Some(alert) = alerts.get_mut(&alert_id) {
            alert.status = AlertStatus::Resolved;
            alert.resolved_at = Some(Utc::now());
            alert.resolved_by = Some(resolved_by);
        }
        Ok(())
    }

    /// Get active alerts
    pub async fn get_active_alerts(&self) -> AppResult<Vec<AlertInstance>> {
        let alerts = self.active_alerts.read().await;
        Ok(alerts.values().cloned().collect())
    }

    /// Get alert by ID
    pub async fn get_alert(&self, alert_id: Uuid) -> AppResult<Option<AlertInstance>> {
        let alerts = self.active_alerts.read().await;
        Ok(alerts.get(&alert_id).cloned())
    }

    /// Collect system metrics
    async fn collect_system_metrics(&self) -> AppResult<()> {
        // In a real implementation, this would collect actual system metrics
        // For now, we'll simulate this
        let metrics = SystemMetrics {
            timestamp: Utc::now(),
            cpu_usage_percent: 25.5,
            memory_usage_percent: 60.2,
            disk_usage_percent: 45.8,
            network_io_bytes: 1024000,
            active_connections: 150,
            request_rate_per_second: 25.3,
            error_rate_percent: 0.5,
            response_time_ms: 125.7,
        };

        let mut system_metrics = self.system_metrics.write().await;
        system_metrics.push(metrics);

        // Keep only last 1000 metrics
        if system_metrics.len() > 1000 {
            let len = system_metrics.len();
            system_metrics.drain(0..len - 1000);
        }

        Ok(())
    }

    /// Perform health checks
    async fn perform_health_checks(&self) -> AppResult<()> {
        // Check database health
        let db_health = self.check_database_health().await;
        self.health_checks.write().await.insert("database".to_string(), db_health);

        // Check Redis health
        let redis_health = self.check_redis_health().await;
        self.health_checks.write().await.insert("redis".to_string(), redis_health);

        // Check external services
        let external_health = self.check_external_services().await;
        self.health_checks.write().await.insert("external_services".to_string(), external_health);

        Ok(())
    }

    /// Check database health
    async fn check_database_health(&self) -> HealthCheckResult {
        let start_time = SystemTime::now();
        
        // In a real implementation, this would perform an actual database query
        // For now, we'll simulate this
        sleep(Duration::from_millis(50)).await;
        
        let response_time = start_time.elapsed().unwrap_or_default().as_millis() as u64;
        
        HealthCheckResult {
            service_name: "database".to_string(),
            status: HealthStatus::Healthy,
            response_time_ms: response_time,
            error_message: None,
            timestamp: Utc::now(),
            metadata: HashMap::new(),
        }
    }

    /// Check Redis health
    async fn check_redis_health(&self) -> HealthCheckResult {
        let start_time = SystemTime::now();
        
        // In a real implementation, this would perform an actual Redis ping
        // For now, we'll simulate this
        sleep(Duration::from_millis(10)).await;
        
        let response_time = start_time.elapsed().unwrap_or_default().as_millis() as u64;
        
        HealthCheckResult {
            service_name: "redis".to_string(),
            status: HealthStatus::Healthy,
            response_time_ms: response_time,
            error_message: None,
            timestamp: Utc::now(),
            metadata: HashMap::new(),
        }
    }

    /// Check external services health
    async fn check_external_services(&self) -> HealthCheckResult {
        let start_time = SystemTime::now();
        
        // In a real implementation, this would check external service endpoints
        // For now, we'll simulate this
        sleep(Duration::from_millis(100)).await;
        
        let response_time = start_time.elapsed().unwrap_or_default().as_millis() as u64;
        
        HealthCheckResult {
            service_name: "external_services".to_string(),
            status: HealthStatus::Healthy,
            response_time_ms: response_time,
            error_message: None,
            timestamp: Utc::now(),
            metadata: HashMap::new(),
        }
    }

    /// Evaluate alert conditions
    async fn evaluate_alerts(&self) -> AppResult<()> {
        let definitions = self.alert_definitions.read().await;
        let metrics = self.system_metrics.read().await;
        let health_checks = self.health_checks.read().await;

        for definition in definitions.values() {
            if !definition.enabled {
                continue;
            }

            if self.evaluate_condition(&definition.condition, &metrics, &health_checks).await? {
                // Check if alert is already active
                let active_alerts = self.active_alerts.read().await;
                let is_already_active = active_alerts.values()
                    .any(|alert| alert.definition_id == definition.id && alert.status == AlertStatus::Active);

                if !is_already_active {
                    drop(active_alerts);
                    self.trigger_alert(&definition.id, format!("Alert triggered: {}", definition.name), HashMap::new()).await?;
                }
            }
        }

        Ok(())
    }

    /// Evaluate alert condition
    async fn evaluate_condition(&self, condition: &AlertCondition, metrics: &[SystemMetrics], health_checks: &HashMap<String, HealthCheckResult>) -> AppResult<bool> {
        match condition {
            AlertCondition::MetricThreshold { metric_name, operator, threshold_value, .. } => {
                if let Some(latest_metric) = metrics.last() {
                    let metric_value = self.get_metric_value(latest_metric, metric_name);
                    Ok(self.compare_values(metric_value, *threshold_value, operator))
                } else {
                    Ok(false)
                }
            }
            AlertCondition::MultiMetric { conditions, operator } => {
                let results: Vec<bool> = futures::future::join_all(
                    conditions.iter().map(|c| self.evaluate_condition(c, metrics, health_checks))
                ).await.into_iter().collect::<Result<Vec<_>, _>>()?;

                match operator {
                    LogicalOperator::And => Ok(results.iter().all(|&r| r)),
                    LogicalOperator::Or => Ok(results.iter().any(|&r| r)),
                }
            }
            AlertCondition::CustomExpression { .. } => {
                // In a real implementation, this would evaluate custom expressions
                Ok(false)
            }
            AlertCondition::HealthCheckFailure { service_name, consecutive_failures } => {
                if let Some(health_check) = health_checks.get(service_name) {
                    Ok(health_check.status == HealthStatus::Unhealthy)
                } else {
                    Ok(false)
                }
            }
        }
    }

    /// Get metric value from system metrics
    fn get_metric_value(&self, metrics: &SystemMetrics, metric_name: &str) -> f64 {
        match metric_name {
            "cpu_usage_percent" => metrics.cpu_usage_percent,
            "memory_usage_percent" => metrics.memory_usage_percent,
            "disk_usage_percent" => metrics.disk_usage_percent,
            "network_io_bytes" => metrics.network_io_bytes as f64,
            "active_connections" => metrics.active_connections as f64,
            "request_rate_per_second" => metrics.request_rate_per_second,
            "error_rate_percent" => metrics.error_rate_percent,
            "response_time_ms" => metrics.response_time_ms,
            _ => 0.0,
        }
    }

    /// Compare values based on operator
    fn compare_values(&self, value: f64, threshold: f64, operator: &ThresholdOperator) -> bool {
        match operator {
            ThresholdOperator::GreaterThan => value > threshold,
            ThresholdOperator::GreaterThanOrEqual => value >= threshold,
            ThresholdOperator::LessThan => value < threshold,
            ThresholdOperator::LessThanOrEqual => value <= threshold,
            ThresholdOperator::Equal => (value - threshold).abs() < f64::EPSILON,
            ThresholdOperator::NotEqual => (value - threshold).abs() >= f64::EPSILON,
        }
    }

    /// Send notifications for alert
    async fn send_notifications(&self, alert: &AlertInstance, definition: &AlertDefinition) -> AppResult<()> {
        let channels = self.notification_channels.read().await;
        
        for channel_id in &definition.notification_channels {
            if let Some(channel) = channels.get(channel_id) {
                if channel.enabled {
                    self.send_notification_to_channel(alert, channel).await?;
                }
            }
        }

        Ok(())
    }

    /// Send notification to specific channel
    async fn send_notification_to_channel(&self, alert: &AlertInstance, channel: &NotificationChannel) -> AppResult<()> {
        match &channel.channel_type {
            NotificationChannelType::Email { .. } => {
                self.send_email_notification(alert, channel).await?;
            }
            NotificationChannelType::Slack { .. } => {
                self.send_slack_notification(alert, channel).await?;
            }
            NotificationChannelType::Webhook { .. } => {
                self.send_webhook_notification(alert, channel).await?;
            }
            NotificationChannelType::PagerDuty { .. } => {
                self.send_pagerduty_notification(alert, channel).await?;
            }
            NotificationChannelType::Teams { .. } => {
                self.send_teams_notification(alert, channel).await?;
            }
        }

        Ok(())
    }

    /// Send email notification
    async fn send_email_notification(&self, alert: &AlertInstance, channel: &NotificationChannel) -> AppResult<()> {
        // In a real implementation, this would send actual emails
        println!("Sending email notification for alert: {}", alert.id);
        Ok(())
    }

    /// Send Slack notification
    async fn send_slack_notification(&self, alert: &AlertInstance, channel: &NotificationChannel) -> AppResult<()> {
        // In a real implementation, this would send actual Slack messages
        println!("Sending Slack notification for alert: {}", alert.id);
        Ok(())
    }

    /// Send webhook notification
    async fn send_webhook_notification(&self, alert: &AlertInstance, channel: &NotificationChannel) -> AppResult<()> {
        // In a real implementation, this would send actual webhook requests
        println!("Sending webhook notification for alert: {}", alert.id);
        Ok(())
    }

    /// Send PagerDuty notification
    async fn send_pagerduty_notification(&self, alert: &AlertInstance, channel: &NotificationChannel) -> AppResult<()> {
        // In a real implementation, this would send actual PagerDuty events
        println!("Sending PagerDuty notification for alert: {}", alert.id);
        Ok(())
    }

    /// Send Teams notification
    async fn send_teams_notification(&self, alert: &AlertInstance, channel: &NotificationChannel) -> AppResult<()> {
        // In a real implementation, this would send actual Teams messages
        println!("Sending Teams notification for alert: {}", alert.id);
        Ok(())
    }

    /// Process alert escalations
    async fn process_escalations(&self) -> AppResult<()> {
        let active_alerts = self.active_alerts.read().await;
        let escalation_policies = self.escalation_policies.read().await;

        for alert in active_alerts.values() {
            if alert.status == AlertStatus::Active {
                if let Some(definition) = self.get_alert_definition(&alert.definition_id).await? {
                    if let Some(policy_id) = definition.escalation_policy {
                        if let Some(policy) = escalation_policies.get(&policy_id) {
                            self.process_alert_escalation(alert, policy).await?;
                        }
                    }
                }
            }
        }

        Ok(())
    }

    /// Process escalation for specific alert
    async fn process_alert_escalation(&self, alert: &AlertInstance, policy: &EscalationPolicy) -> AppResult<()> {
        let time_since_triggered = Utc::now() - alert.triggered_at;
        let escalation_level = alert.escalation_level as usize;

        if escalation_level < policy.levels.len() {
            let level = &policy.levels[escalation_level];
            if time_since_triggered.to_std().unwrap_or_default() >= level.delay {
                // Escalate to next level
                let mut alerts = self.active_alerts.write().await;
                if let Some(alert) = alerts.get_mut(&alert.id) {
                    alert.escalation_level += 1;
                }

                // Send notifications for this escalation level
                for channel_id in &level.notification_channels {
                    if let Some(channel) = self.get_notification_channel(channel_id).await? {
                        self.send_notification_to_channel(alert, &channel).await?;
                    }
                }
            }
        }

        Ok(())
    }

    /// Update alert statistics
    async fn update_alert_stats(&self, alert: &AlertInstance) {
        let mut stats = self.alert_stats.write().await;
        stats.total_alerts_triggered += 1;
        stats.active_alerts_count += 1;
        
        let count = stats.alerts_by_severity.entry(alert.severity.clone()).or_insert(0);
        *count += 1;
    }

    /// Get alert statistics
    pub async fn get_alert_stats(&self) -> AppResult<AlertStats> {
        let stats = self.alert_stats.read().await.clone();
        Ok(stats)
    }

    /// Get system metrics
    pub async fn get_system_metrics(&self, limit: Option<usize>) -> AppResult<Vec<SystemMetrics>> {
        let metrics = self.system_metrics.read().await;
        let limit = limit.unwrap_or(100);
        Ok(metrics.iter().rev().take(limit).cloned().collect())
    }

    /// Get health check results
    pub async fn get_health_check_results(&self) -> AppResult<Vec<HealthCheckResult>> {
        let health_checks = self.health_checks.read().await;
        Ok(health_checks.values().cloned().collect())
    }

    /// Get overall system health
    pub async fn get_system_health(&self) -> AppResult<HealthStatus> {
        let health_checks = self.health_checks.read().await;
        
        let mut overall_status = HealthStatus::Healthy;
        
        for health_check in health_checks.values() {
            match health_check.status {
                HealthStatus::Unhealthy => {
                    overall_status = HealthStatus::Unhealthy;
                    break;
                }
                HealthStatus::Degraded => {
                    if matches!(overall_status, HealthStatus::Healthy) {
                        overall_status = HealthStatus::Degraded;
                    }
                }
                HealthStatus::Healthy => {}
            }
        }

        Ok(overall_status)
    }
}

impl Clone for MonitoringAlertingService {
    fn clone(&self) -> Self {
        Self {
            alert_definitions: Arc::clone(&self.alert_definitions),
            active_alerts: Arc::clone(&self.active_alerts),
            notification_channels: Arc::clone(&self.notification_channels),
            escalation_policies: Arc::clone(&self.escalation_policies),
            system_metrics: Arc::clone(&self.system_metrics),
            health_checks: Arc::clone(&self.health_checks),
            alert_stats: Arc::clone(&self.alert_stats),
        }
    }
}

impl Default for MonitoringAlertingService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[tokio::test]
    async fn test_monitoring_service() {
        let service = MonitoringAlertingService::new();
        
        // Test adding alert definition
        let alert_def = AlertDefinition {
            id: "test_alert".to_string(),
            name: "Test Alert".to_string(),
            description: "A test alert".to_string(),
            severity: AlertSeverity::Warning,
            condition: AlertCondition::MetricThreshold {
                metric_name: "cpu_usage_percent".to_string(),
                operator: ThresholdOperator::GreaterThan,
                threshold_value: 80.0,
                evaluation_period: Duration::from_secs(60),
            },
            notification_channels: vec!["email_channel".to_string()],
            escalation_policy: None,
            enabled: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        service.add_alert_definition(alert_def).await.unwrap();
        
        // Test adding notification channel
        let channel = NotificationChannel {
            id: "email_channel".to_string(),
            name: "Email Channel".to_string(),
            channel_type: NotificationChannelType::Email {
                recipients: vec!["admin@example.com".to_string()],
                smtp_config: SmtpConfig {
                    host: "smtp.example.com".to_string(),
                    port: 587,
                    username: "user".to_string(),
                    password: "pass".to_string(),
                    use_tls: true,
                },
            },
            configuration: HashMap::new(),
            enabled: true,
        };
        
        service.add_notification_channel(channel).await.unwrap();
        
        // Test triggering alert
        let alert_id = service.trigger_alert("test_alert", "Test alert message".to_string(), HashMap::new()).await.unwrap();
        assert!(!alert_id.is_nil());
        
        // Test getting active alerts
        let active_alerts = service.get_active_alerts().await.unwrap();
        assert_eq!(active_alerts.len(), 1);
        
        // Test acknowledging alert
        service.acknowledge_alert(alert_id, "admin".to_string()).await.unwrap();
        
        // Test resolving alert
        service.resolve_alert(alert_id, "admin".to_string()).await.unwrap();
    }

    #[tokio::test]
    async fn test_health_checks() {
        let service = MonitoringAlertingService::new();
        
        // Perform health checks
        service.perform_health_checks().await.unwrap();
        
        // Get health check results
        let results = service.get_health_check_results().await.unwrap();
        assert!(!results.is_empty());
        
        // Get system health
        let health = service.get_system_health().await.unwrap();
        assert!(matches!(health, HealthStatus::Healthy));
    }
}
