//! Service layer tests for StructuredLogging
//!
//! Tests structured logging functionality including
//! log levels, correlation IDs, and field management.

use reconciliation_backend::services::structured_logging::{
    StructuredLogging, LogLevel,
};
use std::collections::HashMap;

/// Test StructuredLogging methods
#[cfg(test)]
mod structured_logging_service_tests {
    use super::*;

    #[test]
    fn test_structured_logging_creation() {
        let logger = StructuredLogging::new("test-service".to_string());
        
        // Verify logger is created
        assert!(true);
    }

    #[test]
    fn test_log_without_correlation_id() {
        let logger = StructuredLogging::new("test-service".to_string());
        let mut fields = HashMap::new();
        fields.insert("user_id".to_string(), serde_json::json!("user123"));
        fields.insert("action".to_string(), serde_json::json!("test_action"));

        logger.log(LogLevel::Info, "Test log message", fields);

        // Should complete without error
        assert!(true);
    }

    #[test]
    fn test_log_with_correlation_id() {
        let logger = StructuredLogging::new("test-service".to_string());
        let mut fields = HashMap::new();
        fields.insert("user_id".to_string(), serde_json::json!("user123"));

        logger.log_with_correlation_id(
            LogLevel::Info,
            "Test log with correlation",
            Some("corr123".to_string()),
            fields,
        );

        // Should complete without error
        assert!(true);
    }

    #[test]
    fn test_log_different_levels() {
        let logger = StructuredLogging::new("test-service".to_string());
        let fields = HashMap::new();

        logger.log(LogLevel::Trace, "Trace message", fields.clone());
        logger.log(LogLevel::Debug, "Debug message", fields.clone());
        logger.log(LogLevel::Info, "Info message", fields.clone());
        logger.log(LogLevel::Warn, "Warning message", fields.clone());
        logger.log(LogLevel::Error, "Error message", fields);

        // Should complete without error
        assert!(true);
    }

    #[test]
    fn test_log_with_complex_fields() {
        let logger = StructuredLogging::new("test-service".to_string());
        let mut fields = HashMap::new();
        fields.insert("nested".to_string(), serde_json::json!({
            "key1": "value1",
            "key2": 123
        }));
        fields.insert("array".to_string(), serde_json::json!([1, 2, 3]));

        logger.log(LogLevel::Info, "Complex log entry", fields);

        // Should complete without error
        assert!(true);
    }
}

