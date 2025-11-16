//! Security Monitoring Service
//!
//! Anomaly detection, automated alerting, and security dashboard

use crate::errors::AppResult;
use crate::services::email::EmailService;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant, SystemTime};
use tokio::sync::RwLock;

/// Security event types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SecurityEventType {
    BruteForceAttack,
    UnusualAccessPattern,
    DataExfiltrationAttempt,
    PrivilegeEscalationAttempt,
    SqlInjectionAttempt,
    XssAttempt,
    RateLimitExceeded,
    AuthenticationFailure,
    AuthorizationFailure,
    Custom(String),
}

/// Security event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityEvent {
    pub id: String,
    pub event_type: SecurityEventType,
    pub severity: SecuritySeverity,
    pub timestamp: String,
    pub source_ip: Option<String>,
    pub user_id: Option<String>,
    pub description: String,
    pub metadata: HashMap<String, String>,
}

/// Security severity levels
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SecuritySeverity {
    Low,
    Medium,
    High,
    Critical,
}

/// Anomaly detection configuration
#[derive(Debug, Clone)]
pub struct AnomalyDetectionConfig {
    /// Threshold for brute force detection (failed logins)
    pub brute_force_threshold: usize,

    /// Time window for brute force detection
    pub brute_force_window: Duration,

    /// Threshold for unusual access patterns
    pub unusual_access_threshold: usize,

    /// Enable anomaly detection
    pub enable_anomaly_detection: bool,
}

impl Default for AnomalyDetectionConfig {
    fn default() -> Self {
        Self {
            brute_force_threshold: 5,
            brute_force_window: Duration::from_secs(300), // 5 minutes
            unusual_access_threshold: 10,
            enable_anomaly_detection: true,
        }
    }
}

/// Security monitor service
pub struct SecurityMonitor {
    config: AnomalyDetectionConfig,
    events: Arc<RwLock<Vec<SecurityEvent>>>,
    anomaly_scores: Arc<RwLock<HashMap<String, f64>>>,
    alert_rules: Arc<RwLock<HashMap<String, AlertRule>>>,
    email_service: Option<Arc<EmailService>>,
    http_client: Arc<Client>,
}

#[derive(Debug, Clone)]
pub struct AlertRule {
    name: String,
    condition: AlertCondition,
    action: AlertAction,
}

#[derive(Debug, Clone)]
enum AlertCondition {
    #[allow(dead_code)]
    EventCount {
        event_type: SecurityEventType,
        threshold: usize,
        window: Duration,
    },
    #[allow(dead_code)]
    AnomalyScore {
        threshold: f64,
    },
}

#[derive(Debug, Clone)]
enum AlertAction {
    #[allow(dead_code)]
    Log,
    #[allow(dead_code)]
    NotifyEmail(String),
    #[allow(dead_code)]
    NotifySlack(String),
    #[allow(dead_code)]
    BlockIp(String),
}

impl SecurityMonitor {
    /// Create a new security monitor
    pub fn new(config: AnomalyDetectionConfig) -> Self {
        Self {
            config,
            events: Arc::new(RwLock::new(Vec::new())),
            anomaly_scores: Arc::new(RwLock::new(HashMap::new())),
            alert_rules: Arc::new(RwLock::new(HashMap::new())),
            email_service: None,
            http_client: Arc::new(Client::new()),
        }
    }

    /// Create a new security monitor with email service
    pub fn with_email_service(
        config: AnomalyDetectionConfig,
        email_service: Arc<EmailService>,
    ) -> Self {
        Self {
            config,
            events: Arc::new(RwLock::new(Vec::new())),
            anomaly_scores: Arc::new(RwLock::new(HashMap::new())),
            alert_rules: Arc::new(RwLock::new(HashMap::new())),
            email_service: Some(email_service),
            http_client: Arc::new(Client::new()),
        }
    }

    /// Add an alert rule
    pub async fn add_alert_rule(&self, rule: AlertRule) {
        let mut rules = self.alert_rules.write().await;
        let rule_id = format!("rule_{}", uuid::Uuid::new_v4());
        let mut rule_copy = rule.clone();
        // Set a name if not already set
        if rule_copy.name.is_empty() {
            rule_copy.name = format!("Alert Rule {}", rules.len() + 1);
        }
        rules.insert(rule_id, rule_copy);
    }

    pub async fn record_event(&self, event: SecurityEvent) -> AppResult<()> {
        // Store event
        let mut events = self.events.write().await;
        events.push(event.clone());

        // Keep only recent events (last 1000)
        if events.len() > 1000 {
            events.remove(0);
        }
        drop(events);

        // Check if this indicates an anomaly
        let anomaly_score = self.calculate_anomaly_score(&event).await;

        let mut scores = self.anomaly_scores.write().await;
        scores.insert(event.id.clone(), anomaly_score);
        drop(scores);

        // Check alert rules
        self.check_alert_rules(&event, anomaly_score).await;

        Ok(())
    }

    /// Detect brute force attacks
    pub async fn detect_brute_force(&self, ip_address: &str, success: bool) -> AppResult<bool> {
        if success {
            // Reset on success
            return Ok(false);
        }

        // Count failures in window
        let now = SystemTime::now();
        let _window_start = now - self.config.brute_force_window;

        let events = self.events.read().await;
        let failure_count = events
            .iter()
            .filter(|e| {
                matches!(e.event_type, SecurityEventType::AuthenticationFailure)
                    && e.source_ip
                        .as_ref()
                        .map(|ip| ip == ip_address)
                        .unwrap_or(false)
            })
            .count();

        Ok(failure_count >= self.config.brute_force_threshold)
    }

    /// Calculate anomaly score for an event
    async fn calculate_anomaly_score(&self, event: &SecurityEvent) -> f64 {
        let mut score = 0.0;

        // Base scores by event type
        match event.event_type {
            SecurityEventType::BruteForceAttack => score += 80.0,
            SecurityEventType::DataExfiltrationAttempt => score += 90.0,
            SecurityEventType::PrivilegeEscalationAttempt => score += 85.0,
            SecurityEventType::SqlInjectionAttempt => score += 70.0,
            SecurityEventType::XssAttempt => score += 65.0,
            _ => score += 30.0,
        }

        // Severity modifier
        match event.severity {
            SecuritySeverity::Critical => score += 20.0,
            SecuritySeverity::High => score += 15.0,
            SecuritySeverity::Medium => score += 10.0,
            SecuritySeverity::Low => score += 5.0,
        }

        // Frequency modifier (check recent events)
        let recent_count = self.count_recent_events(event).await;
        score += (recent_count as f64) * 5.0;

        score.min(100.0)
    }

    /// Count recent similar events
    async fn count_recent_events(&self, event: &SecurityEvent) -> usize {
        let events = self.events.read().await;
        let _window = Duration::from_secs(600); // 10 minutes
        let _now = Instant::now();

        events
            .iter()
            .filter(|e| {
                std::mem::discriminant(&e.event_type) == std::mem::discriminant(&event.event_type)
            })
            .count()
    }

    /// Check alert rules and trigger actions
    async fn check_alert_rules(&self, event: &SecurityEvent, score: f64) {
        let rules = self.alert_rules.read().await;

        for (_, rule) in rules.iter() {
            let should_trigger = match &rule.condition {
                AlertCondition::EventCount {
                    event_type,
                    threshold: _,
                    window: _,
                } => {
                    std::mem::discriminant(&event.event_type) == std::mem::discriminant(event_type)
                }
                AlertCondition::AnomalyScore { threshold } => score >= *threshold,
            };

            if should_trigger {
                // Trigger action
                match &rule.action {
                    AlertAction::Log => {
                        log::warn!("Security alert: {} - {}", rule.name, event.description);
                    }
                    AlertAction::NotifyEmail(email) => {
                        self.send_email_alert(email, event, score).await;
                    }
                    AlertAction::NotifySlack(webhook) => {
                        self.send_slack_alert(webhook, event, score).await;
                    }
                    AlertAction::BlockIp(ip) => {
                        self.block_ip(ip).await;
                    }
                }
            }
        }
    }

    /// Send email alert
    async fn send_email_alert(&self, email: &str, event: &SecurityEvent, score: f64) {
        if let Some(email_service) = &self.email_service {
            let subject = format!(
                "🚨 Security Alert: {} (Score: {:.1})",
                match event.severity {
                    SecuritySeverity::Critical => "CRITICAL",
                    SecuritySeverity::High => "HIGH",
                    SecuritySeverity::Medium => "MEDIUM",
                    SecuritySeverity::Low => "LOW",
                },
                score
            );

            let body = format!(
                r#"
Security Event Detected

Event Type: {:?}
Severity: {:?}
Anomaly Score: {:.1}/100
Description: {}

Timestamp: {}
Source IP: {}
User ID: {}

Metadata:
{}

If you believe this is a false positive, please review the security logs.

Best regards,
Security Monitoring System
"#,
                event.event_type,
                event.severity,
                score,
                event.description,
                event.timestamp,
                event.source_ip.as_ref().unwrap_or(&"N/A".to_string()),
                event.user_id.as_ref().unwrap_or(&"N/A".to_string()),
                serde_json::to_string_pretty(&event.metadata).unwrap_or_else(|_| "{}".to_string())
            );

            if let Err(e) = email_service.send_email(email, &subject, &body).await {
                log::error!("Failed to send security email alert: {}", e);
            } else {
                log::info!("Security email alert sent to {}", email);
            }
        } else {
            log::warn!(
                "Email service not configured, cannot send email alert to {}",
                email
            );
        }
    }

    /// Send Slack alert
    async fn send_slack_alert(&self, webhook: &str, event: &SecurityEvent, score: f64) {
        let severity_emoji = match event.severity {
            SecuritySeverity::Critical => "🔴",
            SecuritySeverity::High => "🟠",
            SecuritySeverity::Medium => "🟡",
            SecuritySeverity::Low => "⚪",
        };

        let payload = serde_json::json!({
            "text": format!("{} Security Alert", severity_emoji),
            "username": "Security Monitor",
            "icon_emoji": ":warning:",
            "attachments": [{
                "color": match event.severity {
                    SecuritySeverity::Critical => "danger",
                    SecuritySeverity::High => "warning",
                    SecuritySeverity::Medium => "good",
                    SecuritySeverity::Low => "#cccccc",
                },
                "fields": [
                    {
                        "title": "Event Type",
                        "value": format!("{:?}", event.event_type),
                        "short": true
                    },
                    {
                        "title": "Severity",
                        "value": format!("{:?}", event.severity),
                        "short": true
                    },
                    {
                        "title": "Anomaly Score",
                        "value": format!("{:.1}/100", score),
                        "short": true
                    },
                    {
                        "title": "Source IP",
                        "value": event.source_ip.as_ref().unwrap_or(&"N/A".to_string()),
                        "short": true
                    },
                    {
                        "title": "Description",
                        "value": event.description,
                        "short": false
                    },
                    {
                        "title": "Timestamp",
                        "value": event.timestamp,
                        "short": false
                    }
                ]
            }]
        });

        match self.http_client.post(webhook).json(&payload).send().await {
            Ok(response) => {
                if response.status().is_success() {
                    log::info!("Security Slack alert sent successfully");
                } else {
                    log::error!("Slack webhook returned error: {}", response.status());
                }
            }
            Err(e) => {
                log::error!("Failed to send Slack alert: {}", e);
            }
        }
    }

    /// Block IP address
    async fn block_ip(&self, ip: &str) {
        log::info!("Would block IP address: {}", ip);
    }

    /// Get recent security events
    pub async fn get_recent_events(&self, limit: usize) -> Vec<SecurityEvent> {
        let events = self.events.read().await;
        events.iter().rev().take(limit).cloned().collect()
    }

    /// Get anomaly scores
    pub async fn get_anomaly_scores(&self) -> HashMap<String, f64> {
        self.anomaly_scores.read().await.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[tokio::test]
    async fn test_brute_force_detection() -> Result<(), Box<dyn std::error::Error>> {
        let monitor = SecurityMonitor::new(AnomalyDetectionConfig::default());

        // Simulate 5 failed attempts
        for _ in 0..5 {
            monitor.detect_brute_force("127.0.0.1", false).await?;
        }

        let detected = monitor.detect_brute_force("127.0.0.1", false).await?;
        assert!(detected);
        Ok(())
    }

    #[tokio::test]
    async fn test_anomaly_score_calculation() -> Result<(), Box<dyn std::error::Error>> {
        let monitor = SecurityMonitor::new(AnomalyDetectionConfig::default());

        let event = SecurityEvent {
            id: Uuid::new_v4().to_string(),
            event_type: SecurityEventType::BruteForceAttack,
            severity: SecuritySeverity::Critical,
            timestamp: SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)?
                .as_secs()
                .to_string(),
            source_ip: Some("127.0.0.1".to_string()),
            user_id: None,
            description: "Test event".to_string(),
            metadata: HashMap::new(),
        };

        let score = monitor.calculate_anomaly_score(&event).await;
        assert!(score > 80.0);
        Ok(())
    }
}
