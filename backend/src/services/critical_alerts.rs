//! Critical Monitoring Alerts Setup
//! 
//! Configures essential monitoring alerts for production deployment

use std::collections::HashMap;
use chrono::Utc;
use serde::{Deserialize, Serialize};

/// Critical alert configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CriticalAlert {
    pub id: String,
    pub name: String,
    pub description: String,
    pub threshold: AlertThreshold,
    pub severity: AlertSeverity,
    pub enabled: bool,
    pub notification_channels: Vec<String>,
}

/// Alert threshold configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertThreshold {
    ErrorRate { max_percentage: f64, time_window_minutes: u32 },
    ResponseTime { max_ms: u32, percentile: u8 },
    Availability { min_percentage: f64, time_window_minutes: u32 },
    Custom { metric: String, operator: String, value: f64 },
}

/// Alert severity levels
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AlertSeverity {
    Critical,
    High,
    Medium,
    Low,
}

impl std::fmt::Display for AlertSeverity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AlertSeverity::Critical => write!(f, "Critical"),
            AlertSeverity::High => write!(f, "High"),
            AlertSeverity::Medium => write!(f, "Medium"),
            AlertSeverity::Low => write!(f, "Low"),
        }
    }
}

/// Alert manager for critical monitoring
pub struct CriticalAlertManager {
    alerts: HashMap<String, CriticalAlert>,
    notification_service: NotificationService,
}

/// Notification service for alert delivery
pub struct NotificationService {
    slack_webhook: Option<String>,
    email_config: Option<EmailConfig>,
    webhook_urls: Vec<String>,
}

/// Email configuration for alerts
#[derive(Debug, Clone)]
pub struct EmailConfig {
    pub smtp_host: String,
    pub smtp_port: u16,
    pub username: String,
    pub password: String,
    pub from_address: String,
    pub to_addresses: Vec<String>,
}

impl CriticalAlertManager {
    /// Create new critical alert manager
    pub fn new() -> Self {
        let notification_service = NotificationService::new();
        
        let mut manager = Self {
            alerts: HashMap::new(),
            notification_service,
        };
        
        // Setup default critical alerts
        manager.setup_default_alerts();
        
        manager
    }
    
    /// Setup default critical alerts
    fn setup_default_alerts(&mut self) {
        // Error rate alert
        self.add_alert(CriticalAlert {
            id: "error_rate_high".to_string(),
            name: "High Error Rate".to_string(),
            description: "Error rate exceeds 1%".to_string(),
            threshold: AlertThreshold::ErrorRate {
                max_percentage: 1.0,
                time_window_minutes: 5,
            },
            severity: AlertSeverity::Critical,
            enabled: true,
            notification_channels: vec!["slack".to_string(), "email".to_string()],
        });
        
        // Response time alert
        self.add_alert(CriticalAlert {
            id: "response_time_high".to_string(),
            name: "High Response Time".to_string(),
            description: "95th percentile response time exceeds 2 seconds".to_string(),
            threshold: AlertThreshold::ResponseTime {
                max_ms: 2000,
                percentile: 95,
            },
            severity: AlertSeverity::High,
            enabled: true,
            notification_channels: vec!["slack".to_string()],
        });
        
        // Availability alert
        self.add_alert(CriticalAlert {
            id: "availability_low".to_string(),
            name: "Low Availability".to_string(),
            description: "Service availability below 99.8%".to_string(),
            threshold: AlertThreshold::Availability {
                min_percentage: 99.8,
                time_window_minutes: 10,
            },
            severity: AlertSeverity::Critical,
            enabled: true,
            notification_channels: vec!["slack".to_string(), "email".to_string(), "webhook".to_string()],
        });
        
        // Database connection alert
        self.add_alert(CriticalAlert {
            id: "database_connections_high".to_string(),
            name: "High Database Connections".to_string(),
            description: "Database connection usage above 80%".to_string(),
            threshold: AlertThreshold::Custom {
                metric: "database_connections_percentage".to_string(),
                operator: ">".to_string(),
                value: 80.0,
            },
            severity: AlertSeverity::High,
            enabled: true,
            notification_channels: vec!["slack".to_string()],
        });
        
        // Memory usage alert
        self.add_alert(CriticalAlert {
            id: "memory_usage_high".to_string(),
            name: "High Memory Usage".to_string(),
            description: "Memory usage above 90%".to_string(),
            threshold: AlertThreshold::Custom {
                metric: "memory_usage_percentage".to_string(),
                operator: ">".to_string(),
                value: 90.0,
            },
            severity: AlertSeverity::High,
            enabled: true,
            notification_channels: vec!["slack".to_string()],
        });
        
        // Disk space alert
        self.add_alert(CriticalAlert {
            id: "disk_space_low".to_string(),
            name: "Low Disk Space".to_string(),
            description: "Disk space below 10%".to_string(),
            threshold: AlertThreshold::Custom {
                metric: "disk_space_percentage".to_string(),
                operator: "<".to_string(),
                value: 10.0,
            },
            severity: AlertSeverity::Critical,
            enabled: true,
            notification_channels: vec!["slack".to_string(), "email".to_string()],
        });
    }
    
    /// Add a new alert
    pub fn add_alert(&mut self, alert: CriticalAlert) {
        self.alerts.insert(alert.id.clone(), alert);
    }
    
    /// Check if alert should trigger
    pub fn check_alert(&self, alert_id: &str, current_value: f64) -> bool {
        let Some(alert) = self.alerts.get(alert_id) else {
            return false;
        };
        
        if !alert.enabled {
            return false;
        }
        
        match &alert.threshold {
            AlertThreshold::ErrorRate { max_percentage, .. } => {
                current_value > *max_percentage
            },
            AlertThreshold::ResponseTime { max_ms, .. } => {
                current_value > (*max_ms as f64)
            },
            AlertThreshold::Availability { min_percentage, .. } => {
                current_value < *min_percentage
            },
            AlertThreshold::Custom { operator, value, .. } => {
                match operator.as_str() {
                    ">" => current_value > *value,
                    "<" => current_value < *value,
                    ">=" => current_value >= *value,
                    "<=" => current_value <= *value,
                    "==" => (current_value - *value).abs() < 0.001,
                    _ => false,
                }
            },
        }
    }
    
    /// Trigger alert notification
    pub async fn trigger_alert(&self, alert_id: &str, current_value: f64) -> Result<(), AlertError> {
        let Some(alert) = self.alerts.get(alert_id) else {
            return Err(AlertError::AlertNotFound(alert_id.to_string()));
        };
        
        let message = format!(
            "🚨 {} Alert Triggered\n\nAlert: {}\nDescription: {}\nCurrent Value: {:.2}\nThreshold: {:?}\nTime: {}",
            alert.severity,
            alert.name,
            alert.description,
            current_value,
            alert.threshold,
            Utc::now().format("%Y-%m-%d %H:%M:%S UTC")
        );
        
        // Send to all configured channels
        for channel in &alert.notification_channels {
            match channel.as_str() {
                "slack" => {
                    self.notification_service.send_slack_alert(&message).await?;
                },
                "email" => {
                    self.notification_service.send_email_alert(&alert.name, &message).await?;
                },
                "webhook" => {
                    self.notification_service.send_webhook_alert(&message).await?;
                },
                _ => {
                    log::warn!("Unknown notification channel: {}", channel);
                }
            }
        }
        
        log::info!("Alert {} triggered and notifications sent", alert_id);
        Ok(())
    }
    
    /// Get all alerts
    pub fn get_alerts(&self) -> Vec<&CriticalAlert> {
        self.alerts.values().collect()
    }
    
    /// Get enabled alerts
    pub fn get_enabled_alerts(&self) -> Vec<&CriticalAlert> {
        self.alerts.values().filter(|alert| alert.enabled).collect()
    }
    
    /// Enable/disable alert
    pub fn set_alert_enabled(&mut self, alert_id: &str, enabled: bool) -> Result<(), AlertError> {
        if let Some(alert) = self.alerts.get_mut(alert_id) {
            alert.enabled = enabled;
            Ok(())
        } else {
            Err(AlertError::AlertNotFound(alert_id.to_string()))
        }
    }
}

impl NotificationService {
    pub fn new() -> Self {
        Self {
            slack_webhook: std::env::var("SLACK_WEBHOOK_URL").ok(),
            email_config: Self::load_email_config(),
            webhook_urls: std::env::var("ALERT_WEBHOOK_URLS")
                .unwrap_or_default()
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect(),
        }
    }
    
    fn load_email_config() -> Option<EmailConfig> {
        Some(EmailConfig {
            smtp_host: std::env::var("SMTP_HOST").ok()?,
            smtp_port: std::env::var("SMTP_PORT").ok()?.parse().ok()?,
            username: std::env::var("SMTP_USERNAME").ok()?,
            password: std::env::var("SMTP_PASSWORD").ok()?,
            from_address: std::env::var("ALERT_FROM_EMAIL").ok()?,
            to_addresses: std::env::var("ALERT_TO_EMAILS")
                .unwrap_or_default()
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect(),
        })
    }
    
    async fn send_slack_alert(&self, message: &str) -> Result<(), AlertError> {
        if let Some(webhook_url) = &self.slack_webhook {
            let payload = serde_json::json!({
                "text": message,
                "username": "378-Alerts",
                "icon_emoji": ":warning:"
            });
            
            let client = reqwest::Client::new();
            let response = client
                .post(webhook_url)
                .json(&payload)
                .send()
                .await
                .map_err(|e| AlertError::NotificationError(e.to_string()))?;
            
            if !response.status().is_success() {
                return Err(AlertError::NotificationError(format!("Slack webhook failed: {}", response.status())));
            }
            
            log::info!("Slack alert sent successfully");
        } else {
            log::warn!("Slack webhook URL not configured");
        }
        
        Ok(())
    }
    
    async fn send_email_alert(&self, subject: &str, message: &str) -> Result<(), AlertError> {
        if let Some(config) = &self.email_config {
            // In a real implementation, this would use lettre to send emails
            log::info!("Email alert would be sent: {} - {}", subject, message);
            log::info!("To: {:?}", config.to_addresses);
        } else {
            log::warn!("Email configuration not available");
        }
        
        Ok(())
    }
    
    async fn send_webhook_alert(&self, message: &str) -> Result<(), AlertError> {
        for webhook_url in &self.webhook_urls {
            let payload = serde_json::json!({
                "message": message,
                "timestamp": Utc::now(),
                "source": "378-reconciliation-platform"
            });
            
            let client = reqwest::Client::new();
            let response = client
                .post(webhook_url)
                .json(&payload)
                .send()
                .await
                .map_err(|e| AlertError::NotificationError(e.to_string()))?;
            
            if !response.status().is_success() {
                log::warn!("Webhook alert failed for {}: {}", webhook_url, response.status());
            } else {
                log::info!("Webhook alert sent to {}", webhook_url);
            }
        }
        
        Ok(())
    }
}

/// Alert error types
#[derive(Debug, thiserror::Error)]
pub enum AlertError {
    #[error("Alert not found: {0}")]
    AlertNotFound(String),
    
    #[error("Notification error: {0}")]
    NotificationError(String),
    
    #[error("Configuration error: {0}")]
    ConfigurationError(String),
}

impl Default for CriticalAlertManager {
    fn default() -> Self {
        Self::new()
    }
}
