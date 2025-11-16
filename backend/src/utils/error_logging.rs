// ============================================================================
// ERROR LOGGING UTILITIES
// ============================================================================
// Provides structured error logging with correlation IDs for request tracing

use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

/// Error correlation ID for request tracing
pub type CorrelationId = String;

/// Structured error context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorContext {
    pub correlation_id: CorrelationId,
    pub timestamp: u64,
    pub error_type: String,
    pub error_message: String,
    pub stack_trace: Option<String>,
    pub user_id: Option<String>,
    pub request_path: Option<String>,
    pub additional_context: serde_json::Value,
}

impl ErrorContext {
    /// Create a new error context
    pub fn new(error_type: String, error_message: String) -> Self {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        Self {
            correlation_id: generate_correlation_id(),
            timestamp,
            error_type,
            error_message,
            stack_trace: None,
            user_id: None,
            request_path: None,
            additional_context: serde_json::json!({}),
        }
    }

    /// Add user ID to error context
    pub fn with_user_id(mut self, user_id: String) -> Self {
        self.user_id = Some(user_id);
        self
    }

    /// Add request path to error context
    pub fn with_request_path(mut self, path: String) -> Self {
        self.request_path = Some(path);
        self
    }

    /// Add additional context data
    pub fn with_context(mut self, context: serde_json::Value) -> Self {
        self.additional_context = context;
        self
    }

    /// Log error with structured context
    pub fn log_error(&self) {
        log::error!(
            "Error [{}] {}: {} | User: {:?} | Path: {:?} | Context: {}",
            self.correlation_id,
            self.error_type,
            self.error_message,
            self.user_id,
            self.request_path,
            serde_json::to_string(&self.additional_context).unwrap_or_default()
        );
    }
}

/// Generate correlation ID for request tracing
/// Uses UUID v4 format for uniqueness
pub fn generate_correlation_id() -> CorrelationId {
    use uuid::Uuid;
    Uuid::new_v4().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_context_creation() {
        let ctx = ErrorContext::new("DatabaseError".to_string(), "Connection failed".to_string());

        assert_eq!(ctx.error_type, "DatabaseError");
        assert_eq!(ctx.error_message, "Connection failed");
        assert!(!ctx.correlation_id.is_empty());
    }

    #[test]
    fn test_correlation_id_generation() {
        let id1 = generate_correlation_id();
        let id2 = generate_correlation_id();

        assert_ne!(id1, id2);
        assert!(!id1.is_empty());
        assert!(!id2.is_empty());
    }
}
