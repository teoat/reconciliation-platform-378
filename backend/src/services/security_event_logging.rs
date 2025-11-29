//! Security Event Logging Service
//!
//! Logs security-related events for audit and compliance purposes.
//! Tracks authentication attempts, authorization failures, and security incidents.

use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::errors::AppResult;

/// Security event types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SecurityEventType {
    /// Authentication events
    LoginAttempt,
    LoginSuccess,
    LoginFailure,
    Logout,
    TokenRefresh,
    TokenExpired,
    
    /// Authorization events
    AuthorizationGranted,
    AuthorizationDenied,
    PermissionChanged,
    
    /// Security incidents
    SuspiciousActivity,
    RateLimitExceeded,
    InvalidInput,
    SQLInjectionAttempt,
    XSSAttempt,
    CSRFViolation,
    
    /// Access control events
    ResourceAccessed,
    ResourceCreated,
    ResourceModified,
    ResourceDeleted,
    
    /// Configuration changes
    SecurityConfigChanged,
    UserRoleChanged,
    PasswordChanged,
}

/// Security event severity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SecurityEventSeverity {
    Low,
    Medium,
    High,
    Critical,
}

/// Security event entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityEvent {
    pub id: String,
    pub timestamp: i64,
    pub event_type: SecurityEventType,
    pub severity: SecurityEventSeverity,
    pub user_id: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub endpoint: Option<String>,
    pub method: Option<String>,
    pub status_code: Option<u16>,
    pub message: String,
    pub details: serde_json::Value,
    pub correlation_id: Option<String>,
}

/// Security event logging service
pub struct SecurityEventLoggingService {
    events: Arc<RwLock<Vec<SecurityEvent>>>,
    max_events: usize,
}

impl SecurityEventLoggingService {
    /// Create a new security event logging service
    pub fn new() -> Self {
        Self {
            events: Arc::new(RwLock::new(Vec::new())),
            max_events: 10000, // Keep last 10k events
        }
    }

    /// Log a security event
    pub async fn log_event(
        &self,
        event_type: SecurityEventType,
        severity: SecurityEventSeverity,
        message: String,
        details: serde_json::Value,
        context: SecurityEventContext,
    ) -> AppResult<String> {
        let event = SecurityEvent {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now().timestamp(),
            event_type,
            severity,
            user_id: context.user_id,
            ip_address: context.ip_address,
            user_agent: context.user_agent,
            endpoint: context.endpoint,
            method: context.method,
            status_code: context.status_code,
            message,
            details,
            correlation_id: context.correlation_id,
        };

        let mut events = self.events.write().await;
        events.push(event.clone());

        // Keep only recent events
        if events.len() > self.max_events {
            let len = events.len();
            events.drain(0..len - self.max_events);
        }

        // Log to standard logger based on severity
        match event.severity {
            SecurityEventSeverity::Critical => {
                log::error!("[SECURITY] {}: {}", format!("{:?}", event.event_type), event.message);
            }
            SecurityEventSeverity::High => {
                log::warn!("[SECURITY] {}: {}", format!("{:?}", event.event_type), event.message);
            }
            SecurityEventSeverity::Medium => {
                log::info!("[SECURITY] {}: {}", format!("{:?}", event.event_type), event.message);
            }
            SecurityEventSeverity::Low => {
                log::debug!("[SECURITY] {}: {}", format!("{:?}", event.event_type), event.message);
            }
        }

        Ok(event.id)
    }

    /// Get security events
    pub async fn get_events(
        &self,
        filters: SecurityEventFilters,
    ) -> Vec<SecurityEvent> {
        let events = self.events.read().await;
        let mut filtered: Vec<SecurityEvent> = events.clone();

        // Filter by event type
        if let Some(event_type) = &filters.event_type {
            filtered.retain(|e| {
                match event_type {
                    SecurityEventType::LoginAttempt => matches!(e.event_type, SecurityEventType::LoginAttempt),
                    SecurityEventType::LoginSuccess => matches!(e.event_type, SecurityEventType::LoginSuccess),
                    SecurityEventType::LoginFailure => matches!(e.event_type, SecurityEventType::LoginFailure),
                    SecurityEventType::AuthorizationDenied => matches!(e.event_type, SecurityEventType::AuthorizationDenied),
                    SecurityEventType::SuspiciousActivity => matches!(e.event_type, SecurityEventType::SuspiciousActivity),
                    _ => true,
                }
            });
        }

        // Filter by severity
        if let Some(filter_severity) = &filters.severity {
            let severity_to_match = filter_severity;
            filtered.retain(|e| matches!(&e.severity, severity_to_match));
        }

        // Filter by user ID
        if let Some(user_id) = &filters.user_id {
            filtered.retain(|e| e.user_id.as_ref() == Some(user_id));
        }

        // Filter by date range
        if let Some(start_time) = filters.start_time {
            filtered.retain(|e| e.timestamp >= start_time);
        }
        if let Some(end_time) = filters.end_time {
            filtered.retain(|e| e.timestamp <= end_time);
        }

        // Sort by timestamp (newest first)
        filtered.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

        // Limit results
        if let Some(limit) = filters.limit {
            filtered.truncate(limit);
        }

        filtered
    }

    /// Get event statistics
    pub async fn get_statistics(&self) -> SecurityEventStatistics {
        let events = self.events.read().await;
        
        let mut stats = SecurityEventStatistics {
            total_events: events.len(),
            by_type: std::collections::HashMap::new(),
            by_severity: std::collections::HashMap::new(),
            recent_critical: 0,
            recent_high: 0,
        };

        let now = Utc::now().timestamp();
        let one_hour_ago = now - 3600;

        for event in events.iter() {
            // Count by type
            let type_key = format!("{:?}", event.event_type);
            *stats.by_type.entry(type_key).or_insert(0) += 1;

            // Count by severity
            let severity_key = format!("{:?}", event.severity);
            *stats.by_severity.entry(severity_key).or_insert(0) += 1;

            // Count recent critical/high events
            if event.timestamp >= one_hour_ago {
                match event.severity {
                    SecurityEventSeverity::Critical => stats.recent_critical += 1,
                    SecurityEventSeverity::High => stats.recent_high += 1,
                    _ => {}
                }
            }
        }

        stats
    }
}

impl Default for SecurityEventLoggingService {
    fn default() -> Self {
        Self::new()
    }
}

/// Security event context
#[derive(Debug, Clone, Default)]
pub struct SecurityEventContext {
    pub user_id: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub endpoint: Option<String>,
    pub method: Option<String>,
    pub status_code: Option<u16>,
    pub correlation_id: Option<String>,
}

/// Security event filters
#[derive(Debug, Clone, Default)]
pub struct SecurityEventFilters {
    pub event_type: Option<SecurityEventType>,
    pub severity: Option<SecurityEventSeverity>,
    pub user_id: Option<String>,
    pub start_time: Option<i64>,
    pub end_time: Option<i64>,
    pub limit: Option<usize>,
}

/// Security event statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityEventStatistics {
    pub total_events: usize,
    pub by_type: std::collections::HashMap<String, usize>,
    pub by_severity: std::collections::HashMap<String, usize>,
    pub recent_critical: usize,
    pub recent_high: usize,
}

