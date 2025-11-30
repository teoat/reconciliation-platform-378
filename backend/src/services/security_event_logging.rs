//! Security Event Logging Service
//!
//! Logs security-related events for audit and compliance purposes.
//! Tracks authentication attempts, authorization failures, and security incidents.

use chrono::Utc;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::database::Database;
use crate::errors::AppResult;
use crate::models::schema::security_events::dsl::*;

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
    db: Option<Database>,
}

impl SecurityEventLoggingService {
    /// Create a new security event logging service
    pub fn new(db: Option<Database>) -> Self {
        Self { db }
    }

    /// Log a security event
    pub async fn log_event(
        &self,
        evt_type: SecurityEventType,
        evt_severity: SecurityEventSeverity,
        evt_message: String,
        evt_details: serde_json::Value,
        context: SecurityEventContext,
    ) -> AppResult<String> {
        let event_id = Uuid::new_v4();

        // Log to standard logger based on severity
        match evt_severity {
            SecurityEventSeverity::Critical => {
                log::error!("[SECURITY] {}: {}", format!("{:?}", evt_type), evt_message);
            }
            SecurityEventSeverity::High => {
                log::warn!("[SECURITY] {}: {}", format!("{:?}", evt_type), evt_message);
            }
            SecurityEventSeverity::Medium => {
                log::info!("[SECURITY] {}: {}", format!("{:?}", evt_type), evt_message);
            }
            SecurityEventSeverity::Low => {
                log::debug!("[SECURITY] {}: {}", format!("{:?}", evt_type), evt_message);
            }
        }

        // Insert into database if available
        if let Some(db) = &self.db {
            let mut conn = db.get_connection()?;

            let type_str = format!("{:?}", evt_type);
            let severity_str = format!("{:?}", evt_severity);

            // Convert context.user_id (String) to Uuid if possible
            let uid = context.user_id.and_then(|s| Uuid::parse_str(&s).ok());

            // Parse IP address
            // Note: ipnetwork::IpNetwork or ipnetwork::IpNetwork logic needed if column is Inet
            // For now assuming we can pass string if we cast it or if diesel handles it.
            // But diesel postgres inet expects IpNetwork.
            // Let's try to parse it.
            let ip_net = context
                .ip_address
                .and_then(|s| s.parse::<ipnetwork::IpNetwork>().ok());

            diesel::insert_into(security_events)
                .values((
                    id.eq(event_id),
                    event_type.eq(type_str),
                    severity.eq(severity_str),
                    user_id.eq(uid),
                    ip_address.eq(ip_net),
                    user_agent.eq(context.user_agent),
                    // resource_type and resource_id are not in context, maybe add them?
                    // For now leave null
                    action.eq(evt_message), // Using message as action description
                    details.eq(Some(evt_details)),
                    // metadata
                ))
                .execute(&mut conn)
                .map_err(|e| {
                    log::error!("Failed to insert security event: {}", e);
                    crate::errors::AppError::InternalServerError(
                        "Failed to insert security event".to_string(),
                    )
                })?;
        }

        Ok(event_id.to_string())
    }

    /// Get security events
    pub async fn get_events(&self, filters: SecurityEventFilters) -> Vec<SecurityEvent> {
        // If no DB, return empty
        let db = match &self.db {
            Some(d) => d,
            None => return Vec::new(),
        };

        let mut conn = match db.get_connection() {
            Ok(c) => c,
            Err(_) => return Vec::new(),
        };

        let mut query = security_events.into_boxed();

        if let Some(ft) = &filters.event_type {
            query = query.filter(event_type.eq(format!("{:?}", ft)));
        }

        if let Some(fs) = &filters.severity {
            query = query.filter(severity.eq(format!("{:?}", fs)));
        }

        if let Some(fuid) = &filters.user_id {
            if let Ok(uid) = Uuid::parse_str(fuid) {
                query = query.filter(user_id.eq(uid));
            }
        }

        if let Some(start) = filters.start_time {
            let start_dt = chrono::DateTime::<Utc>::from_naive_utc_and_offset(
                chrono::NaiveDateTime::from_timestamp_opt(start, 0).unwrap_or_else(|| chrono::NaiveDateTime::default()),
                Utc,
            );
            query = query.filter(created_at.ge(start_dt));
        }

        if let Some(end) = filters.end_time {
            let end_dt = chrono::DateTime::<Utc>::from_naive_utc_and_offset(
                chrono::NaiveDateTime::from_timestamp_opt(end, 0).unwrap_or_else(|| chrono::NaiveDateTime::default()),
                Utc,
            );
            query = query.filter(created_at.le(end_dt));
        }

        query = query.order(created_at.desc());

        if let Some(l) = filters.limit {
            query = query.limit(l as i64);
        }

        // Execute query
        let results = query.load::<(
            Uuid,
            String,
            String,
            Option<Uuid>,
            Option<ipnetwork::IpNetwork>,
            Option<String>,
            Option<String>,
            Option<Uuid>,
            String,
            Option<serde_json::Value>,
            Option<serde_json::Value>,
            chrono::DateTime<chrono::Utc>,
        )>(&mut conn);

        match results {
            Ok(rows) => {
                rows.into_iter()
                    .map(
                        |(
                            id_val,
                            type_val,
                            sev_val,
                            uid_val,
                            ip_val,
                            agent_val,
                            _res_type,
                            _res_id,
                            action_val,
                            details_val,
                            _meta_val,
                            created_val,
                        )| {
                            // Parse enums
                            let evt_type = serde_json::from_str::<SecurityEventType>(&format!(
                                "\"{}\"",
                                type_val
                            ))
                            .unwrap_or(SecurityEventType::SuspiciousActivity); // Fallback

                            let evt_sev = serde_json::from_str::<SecurityEventSeverity>(&format!(
                                "\"{}\"",
                                sev_val
                            ))
                            .unwrap_or(SecurityEventSeverity::Low); // Fallback

                            SecurityEvent {
                                id: id_val.to_string(),
                                timestamp: created_val.timestamp(),
                                event_type: evt_type,
                                severity: evt_sev,
                                user_id: uid_val.map(|u| u.to_string()),
                                ip_address: ip_val.map(|ip| ip.to_string()),
                                user_agent: agent_val,
                                endpoint: None, // Not stored in main columns
                                method: None,
                                status_code: None,
                                message: action_val,
                                details: details_val.unwrap_or(serde_json::json!({})),
                                correlation_id: None,
                            }
                        },
                    )
                    .collect()
            }
            Err(e) => {
                log::error!("Failed to fetch security events: {}", e);
                Vec::new()
            }
        }
    }

    /// Get event statistics
    pub async fn get_statistics(&self) -> SecurityEventStatistics {
        // Placeholder implementation
        SecurityEventStatistics {
            total_events: 0,
            by_type: std::collections::HashMap::new(),
            by_severity: std::collections::HashMap::new(),
            recent_critical: 0,
            recent_high: 0,
        }
    }
}

impl Default for SecurityEventLoggingService {
    fn default() -> Self {
        Self::new(None)
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
