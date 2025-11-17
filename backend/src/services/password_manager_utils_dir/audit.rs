//! Password Manager Audit Logging
//!
//! Handles audit logging for password manager operations.

use crate::database::Database;
use crate::errors::AppResult;
use std::sync::Arc;

/// Audit logger for password manager operations
pub struct PasswordAuditLogger {
    db: Arc<Database>,
}

impl PasswordAuditLogger {
    /// Create a new audit logger
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    /// Log audit event for password access
    /// 
    /// This logs password manager operations for security auditing.
    /// Non-blocking - failures are logged but don't affect the operation.
    pub async fn log_audit(
        &self,
        password_entry_id: &str,
        action: &str,
        user_id: Option<&str>,
        ip_address: Option<&str>,
        user_agent: Option<&str>,
    ) -> AppResult<()> {
        use diesel::prelude::*;
        
        let mut conn = self.db.get_connection()?;
        
        // Insert audit log entry using raw SQL
        // In production, consider creating a proper Diesel model for audit_log
        let query = format!(
            r#"
            INSERT INTO password_audit_log 
            (password_entry_id, action, user_id, ip_address, user_agent, timestamp)
            VALUES ('{}', '{}', {}, {}, {}, NOW())
            "#,
            password_entry_id.replace("'", "''"), // Escape single quotes
            action.replace("'", "''"),
            user_id.map(|id| format!("'{}'", id.replace("'", "''"))).unwrap_or_else(|| "NULL".to_string()),
            ip_address.map(|ip| format!("'{}'", ip.replace("'", "''"))).unwrap_or_else(|| "NULL".to_string()),
            user_agent.map(|ua| format!("'{}'", ua.replace("'", "''"))).unwrap_or_else(|| "NULL".to_string()),
        );
        
        diesel::sql_query(&query)
            .execute(&mut conn)
            .map_err(|e| {
                // Log error but don't fail the operation - audit logging should be non-blocking
                log::warn!("Failed to log password audit to database: {}", e);
            })
            .ok();
        
        // Always log to application logs for redundancy
        log::info!(
            "Password audit: entry_id={}, action={}, user_id={:?}, ip={:?}, user_agent={:?}",
            password_entry_id,
            action,
            user_id,
            ip_address,
            user_agent
        );
        
        Ok(())
    }
}

