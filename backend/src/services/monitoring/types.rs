//! Monitoring types and data structures

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use uuid::Uuid;

/// Health check result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheck {
    pub name: String,
    pub status: HealthStatus,
    pub message: Option<String>,
    pub duration: Duration,
    pub timestamp: DateTime<Utc>,
    pub details: Option<serde_json::Value>,
}

/// Health status enumeration
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum HealthStatus {
    /// System is healthy
    Healthy,
    /// System is degraded but operational
    Degraded,
    /// System is unhealthy
    Unhealthy,
}

impl HealthStatus {
    pub fn is_healthy(&self) -> bool {
        matches!(self, HealthStatus::Healthy)
    }

    pub fn is_degraded(&self) -> bool {
        matches!(self, HealthStatus::Degraded)
    }

    pub fn is_unhealthy(&self) -> bool {
        matches!(self, HealthStatus::Unhealthy)
    }
}

/// Health report containing all health checks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthReport {
    pub overall_status: HealthStatus,
    pub checks: Vec<HealthCheck>,
    pub timestamp: DateTime<Utc>,
    pub version: String,
    pub uptime: Duration,
}

/// Health checker trait
pub trait HealthChecker {
    fn name(&self) -> String;
    fn check(&self) -> HealthCheck;
}

/// Alert definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertDefinition {
    pub id: String,
    pub name: String,
    pub description: String,
    pub severity: AlertSeverity,
    pub condition: String,
    pub threshold: f64,
    pub enabled: bool,
    pub notification_channels: Vec<NotificationChannel>,
}

/// Alert instance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertInstance {
    pub id: Uuid,
    pub alert_id: String,
    pub severity: AlertSeverity,
    pub message: String,
    pub triggered_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub status: AlertStatus,
}

/// Alert severity levels
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertSeverity {
    Critical,
    Warning,
    Info,
}

/// Alert status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertStatus {
    Active,
    Resolved,
    Acknowledged,
}

/// Notification channel configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationChannel {
    pub type_: String,
    pub endpoint: String,
    pub config: Option<serde_json::Value>,
}
