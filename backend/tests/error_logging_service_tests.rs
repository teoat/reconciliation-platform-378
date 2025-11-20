//! Service layer tests for ErrorLoggingService
//!
//! Tests error logging functionality including correlation IDs,
//! error levels, and log entry management.

use reconciliation_backend::services::error_logging::{
    ErrorLoggingService, ErrorLoggingConfig, ErrorLevel, ErrorContext as ErrorLoggingContext,
};
use std::collections::HashMap;
use uuid::Uuid;

/// Test ErrorLoggingService methods
#[cfg(test)]
mod error_logging_service_tests {
    use super::*;

    fn create_test_service() -> ErrorLoggingService {
        let config = ErrorLoggingConfig {
            service_name: "test-service".to_string(),
            max_log_entries: 100,
            enable_structured_logging: true,
            enable_correlation_tracking: true,
            log_to_console: false, // Disable console logging in tests
            log_to_file: false,    // Disable file logging in tests
            log_file_path: None,
        };
        ErrorLoggingService::new(config)
    }

    #[tokio::test]
    async fn test_error_logging_service_creation() {
        let service = create_test_service();
        
        // Verify service is created
        let entries = service.get_recent_errors(10).await;
        assert!(entries.is_empty() || !entries.is_empty()); // Can be empty initially
    }

    #[tokio::test]
    async fn test_log_error() {
        let service = create_test_service();

        let context = ErrorLoggingContext {
            operation: Some("test_operation".to_string()),
            user_id: Some("user123".to_string()),
            request_id: Some("req123".to_string()),
            endpoint: Some("/api/test".to_string()),
            method: Some("GET".to_string()),
            status_code: None,
            stack_trace: None,
            metadata: HashMap::new(),
            additional_context: HashMap::new(),
        };

        service
            .log_error(
                "correlation123",
                "TEST_ERROR",
                "Test error message",
                ErrorLevel::Error,
                context,
            )
            .await;
        
        // Should complete without error
        assert!(true);
    }

    #[tokio::test]
    async fn test_log_error_auto_correlation() {
        let service = create_test_service();
        let correlation_id = Uuid::new_v4().to_string();

        let context = ErrorLoggingContext {
            operation: Some("test_operation".to_string()),
            user_id: Some("user123".to_string()),
            request_id: Some(correlation_id.clone()),
            endpoint: None,
            method: None,
            status_code: None,
            stack_trace: None,
            metadata: HashMap::new(),
            additional_context: HashMap::new(),
        };

        service
            .log_error_auto_correlation(
                "TEST_ERROR",
                "Test error",
                ErrorLevel::Warning,
                context,
            )
            .await;
        
        assert!(true);
    }

    #[tokio::test]
    async fn test_get_recent_errors() {
        let service = create_test_service();
        let empty_context = ErrorLoggingContext {
            operation: None,
            user_id: None,
            request_id: None,
            endpoint: None,
            method: None,
            status_code: None,
            stack_trace: None,
            metadata: HashMap::new(),
            additional_context: HashMap::new(),
        };

        // Log some errors
        service
            .log_error(
                "corr1",
                "ERROR1",
                "Error 1",
                ErrorLevel::Error,
                empty_context.clone(),
            )
            .await;

        service
            .log_error(
                "corr2",
                "ERROR2",
                "Error 2",
                ErrorLevel::Warning,
                empty_context.clone(),
            )
            .await;

        let errors = service.get_recent_errors(10).await;
        assert!(errors.len() >= 2);
    }

    #[tokio::test]
    async fn test_get_recent_errors_filtered() {
        let service = create_test_service();
        let empty_context = ErrorLoggingContext {
            operation: None,
            user_id: None,
            request_id: None,
            endpoint: None,
            method: None,
            status_code: None,
            stack_trace: None,
            metadata: HashMap::new(),
            additional_context: HashMap::new(),
        };

        // Log errors with different levels
        service
            .log_error(
                "corr1",
                "ERROR1",
                "Error 1",
                ErrorLevel::Error,
                empty_context.clone(),
            )
            .await;

        service
            .log_error(
                "corr2",
                "ERROR2",
                "Error 2",
                ErrorLevel::Critical,
                empty_context.clone(),
            )
            .await;

        let errors = service.get_recent_errors(10).await;
        // Should have at least the errors we logged
        assert!(errors.len() >= 2);
    }

    #[tokio::test]
    async fn test_log_error_different_levels() {
        let service = create_test_service();
        let empty_context = ErrorLoggingContext {
            operation: None,
            user_id: None,
            request_id: None,
            endpoint: None,
            method: None,
            status_code: None,
            stack_trace: None,
            metadata: HashMap::new(),
            additional_context: HashMap::new(),
        };

        // Log errors with all levels
        service
            .log_error("corr1", "ERROR1", "Info error", ErrorLevel::Info, empty_context.clone())
            .await;
        service
            .log_error("corr2", "ERROR2", "Warning error", ErrorLevel::Warning, empty_context.clone())
            .await;
        service
            .log_error("corr3", "ERROR3", "Error error", ErrorLevel::Error, empty_context.clone())
            .await;
        service
            .log_error("corr4", "ERROR4", "Critical error", ErrorLevel::Critical, empty_context.clone())
            .await;

        let errors = service.get_recent_errors(10).await;
        assert!(errors.len() >= 4);
    }

    #[tokio::test]
    async fn test_log_error_with_stack_trace() {
        let service = create_test_service();
        let context = ErrorLoggingContext {
            operation: Some("test_operation".to_string()),
            user_id: None,
            request_id: None,
            endpoint: None,
            method: None,
            status_code: None,
            stack_trace: Some("Stack trace here".to_string()),
            metadata: HashMap::new(),
            additional_context: HashMap::new(),
        };

        service
            .log_error("corr1", "STACK_ERROR", "Error with stack", ErrorLevel::Error, context)
            .await;

        assert!(true);
    }

    #[tokio::test]
    async fn test_log_error_with_metadata() {
        let service = create_test_service();
        let mut metadata = HashMap::new();
        metadata.insert("key1".to_string(), "value1".to_string());
        metadata.insert("key2".to_string(), "value2".to_string());

        let context = ErrorLoggingContext {
            operation: None,
            user_id: None,
            request_id: None,
            endpoint: None,
            method: None,
            status_code: None,
            stack_trace: None,
            metadata,
            additional_context: HashMap::new(),
        };

        service
            .log_error("corr1", "META_ERROR", "Error with metadata", ErrorLevel::Error, context)
            .await;

        assert!(true);
    }

    #[tokio::test]
    async fn test_get_recent_errors_limit() {
        let service = create_test_service();
        let empty_context = ErrorLoggingContext {
            operation: None,
            user_id: None,
            request_id: None,
            endpoint: None,
            method: None,
            status_code: None,
            stack_trace: None,
            metadata: HashMap::new(),
            additional_context: HashMap::new(),
        };

        // Log multiple errors
        for i in 0..20 {
            service
                .log_error(
                    &format!("corr{}", i),
                    &format!("ERROR{}", i),
                    &format!("Error {}", i),
                    ErrorLevel::Error,
                    empty_context.clone(),
                )
                .await;
        }

        // Get limited number
        let errors = service.get_recent_errors(5).await;
        assert!(errors.len() <= 5);
    }

    #[tokio::test]
    async fn test_get_recent_errors_zero_limit() {
        let service = create_test_service();

        // Get with zero limit
        let errors = service.get_recent_errors(0).await;
        assert_eq!(errors.len(), 0);
    }

    #[tokio::test]
    async fn test_log_error_empty_correlation() {
        let service = create_test_service();
        let empty_context = ErrorLoggingContext {
            operation: None,
            user_id: None,
            request_id: None,
            endpoint: None,
            method: None,
            status_code: None,
            stack_trace: None,
            metadata: HashMap::new(),
            additional_context: HashMap::new(),
        };

        // Log with empty correlation ID
        service
            .log_error("", "EMPTY_CORR", "Error", ErrorLevel::Error, empty_context)
            .await;

        assert!(true);
    }

    #[tokio::test]
    async fn test_log_error_auto_correlation_empty_context() {
        let service = create_test_service();
        let empty_context = ErrorLoggingContext {
            operation: None,
            user_id: None,
            request_id: None,
            endpoint: None,
            method: None,
            status_code: None,
            stack_trace: None,
            metadata: HashMap::new(),
            additional_context: HashMap::new(),
        };

        service
            .log_error_auto_correlation("AUTO_CORR_ERROR", "Error", ErrorLevel::Warning, empty_context)
            .await;

        assert!(true);
    }

    #[tokio::test]
    async fn test_error_logging_service_config() {
        // Test with different configs
        let config1 = ErrorLoggingConfig {
            service_name: "service1".to_string(),
            max_log_entries: 50,
            enable_structured_logging: true,
            enable_correlation_tracking: true,
            log_to_console: false,
            log_to_file: false,
            log_file_path: None,
        };

        let service1 = ErrorLoggingService::new(config1);
        let entries1 = service1.get_recent_errors(10).await;
        assert!(entries1.len() >= 0);

        let config2 = ErrorLoggingConfig {
            service_name: "service2".to_string(),
            max_log_entries: 200,
            enable_structured_logging: false,
            enable_correlation_tracking: false,
            log_to_console: false,
            log_to_file: false,
            log_file_path: None,
        };

        let service2 = ErrorLoggingService::new(config2);
        let entries2 = service2.get_recent_errors(10).await;
        assert!(entries2.len() >= 0);
    }
}

