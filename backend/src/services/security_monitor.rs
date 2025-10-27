//! Security Monitoring Service
//!
//! Anomaly detection, automated alerting, and security dashboard

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant, SystemTime};
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use crate::errors::{AppError, AppResult};

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
}

#[derive(Debug, Clone)]
struct AlertRule {
    name: String,
    condition: AlertCondition,
    action: AlertAction,
}

#[derive(Debug, Clone)]
enum AlertCondition {
    EventCount { event_type: SecurityEventType, threshold: usize, window: Duration },
    AnomalyScore { threshold: f64 },
}

#[derive(Debug, Clone)]
enum AlertAction {
    Log,
    NotifyEmail(String),
    NotifySlack(String),
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
        }
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
        let window_start = now - self.config.brute_force_window;

        let events = self.events.read().await;
        let failure_count = events.iter()
            .filter(|e| {
                matches!(e.event_type, SecurityEventType::AuthenticationFailure) &&
                e.source_ip.as_ref().map(|ip| ip == ip_address).unwrap_or(false)
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
        let window = Duration::from_secs(600); // 10 minutes
        let now = Instant::now();

        events.iter()
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
                AlertCondition::EventCount { event_type, threshold, window: _ } => {
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
        log::info!("Would send email alert to {}: {} (score: {:.1})", email, event.description, score);
    }

    /// Send Slack alert
    async fn send_slack_alert(&self, webhook: &str, event: &SecurityEvent, score: f64) {
        log::info!("Would send Slack alert to {}: {} (score: {:.1})", webhook, event.description, score);
    }

    /// Block IP address
    async fn block_ip(&self, ip: &str) {
        log::info!("Would block IP address: {}", ip);
    }

    /// Get recent security events
    pub async fn get_recent_events(&self, limit: usize) -> Vec<SecurityEvent> {
        let events = self.events.read().await;
        events.iter()
            .rev()
            .take(limit)
            .cloned()
            .collect()
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
    async fn test_brute_force_detection() {
        let monitor = SecurityMonitor::new(AnomalyDetectionConfig::default());
        
        // Simulate 5 failed attempts
        for _ in 0..5 {
            monitor.detect_brute_force("127.0.0.1", false).await.unwrap();
        }
        
        let detected = monitor.detect_brute_force("127.0.0.1", false).await.unwrap();
        assert!(detected);
    }

    #[tokio::test]
    async fn test_anomaly_score_calculation() {
        let monitor = SecurityMonitor::new(AnomalyDetectionConfig::default());
        
        let event = SecurityEvent {
            id: Uuid::new_v4().to_string(),
            event_type: SecurityEventType::BruteForceAttack,
            severity: SecuritySeverity::Critical,
            timestamp: SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs().to_string(),
            source_ip: Some("127.0.0.1".to_string()),
            user_id: None,
            description: "Test event".to_string(),
            metadata: HashMap::new(),
        };
        
        let score = monitor.calculate_anomaly_score(&event).await;
        assert!(score > 80.0);
    }
}

