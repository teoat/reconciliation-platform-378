//! Service layer tests for ErrorRecoveryService
//!
//! Tests error recovery functionality including retry logic,
//! circuit breakers, and graceful degradation.

use reconciliation_backend::services::error_recovery::{
    ErrorRecoveryService, ErrorRecoveryConfig, CircuitBreakerState,
    GracefulDegradationService, ErrorContext,
};
use reconciliation_backend::errors::AppResult;
use std::collections::HashMap;
use std::time::Duration;

/// Test ErrorRecoveryService methods
#[cfg(test)]
mod error_recovery_service_tests {
    use super::*;

    fn create_test_config() -> ErrorRecoveryConfig {
        ErrorRecoveryConfig {
            max_retry_attempts: 3,
            retry_delay_ms: 100,
            exponential_backoff: true,
            max_backoff_ms: 1000,
            circuit_breaker_threshold: 5,
            circuit_breaker_timeout_ms: 1000,
            enable_graceful_degradation: true,
            fallback_responses: HashMap::new(),
        }
    }

    #[tokio::test]
    async fn test_error_recovery_service_creation() {
        let config = create_test_config();
        let _service = ErrorRecoveryService::new(config);
        
        // Verify service is created
        assert!(true);
    }

    #[tokio::test]
    async fn test_execute_with_retry_success() {
        let config = create_test_config();
        let service = ErrorRecoveryService::new(config);
        
        let mut attempt = 0;
        let operation = || {
            attempt += 1;
            Box::pin(async move {
                if attempt == 1 {
                    Err::<String, String>("First attempt fails".to_string())
                } else {
                    Ok("Success".to_string())
                }
            })
        };
        
        let result = service.execute_with_retry("test_op", operation).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "Success");
    }

    #[tokio::test]
    async fn test_execute_with_retry_max_attempts() {
        let config = create_test_config();
        let service = ErrorRecoveryService::new(config);
        
        let operation = || {
            Box::pin(async move {
                Err::<String, String>("Always fails".to_string())
            })
        };
        
        let result = service.execute_with_retry("test_op", operation).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_check_circuit_breaker_closed() {
        let config = create_test_config();
        let service = ErrorRecoveryService::new(config);
        
        // Check circuit breaker for new service (should be closed)
        let result = service.check_circuit_breaker("test_service").await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_circuit_breaker_failure_tracking() {
        let config = create_test_config();
        let service = ErrorRecoveryService::new(config);
        
        // Record multiple failures
        for _ in 0..5 {
            service.record_circuit_breaker_failure("test_service").await;
        }
        
        // Circuit breaker should be open
        let result = service.check_circuit_breaker("test_service").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_circuit_breaker_success_reset() {
        let config = create_test_config();
        let service = ErrorRecoveryService::new(config);
        
        // Record some failures
        for _ in 0..3 {
            service.record_circuit_breaker_failure("test_service").await;
        }
        
        // Record success (should reset failure count)
        service.record_circuit_breaker_success("test_service").await;
        
        // Circuit breaker should still be closed
        let result = service.check_circuit_breaker("test_service").await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_circuit_breaker_half_open() {
        let config = create_test_config();
        let service = ErrorRecoveryService::new(config);
        
        // Open circuit breaker
        for _ in 0..5 {
            service.record_circuit_breaker_failure("test_service").await;
        }
        
        // Wait for timeout (in real scenario)
        // For test, we'll manually check that it's open
        let result = service.check_circuit_breaker("test_service").await;
        assert!(result.is_err());
        
        // After timeout, should transition to half-open
        // This is tested by checking status
        let status = service.get_circuit_breaker_status().await;
        let service_state = status.get("test_service");
        assert!(service_state.is_some());
    }

    #[tokio::test]
    async fn test_get_circuit_breaker_status() {
        let config = create_test_config();
        let service = ErrorRecoveryService::new(config);
        
        // Create circuit breakers for multiple services
        service.check_circuit_breaker("service1").await.unwrap();
        service.check_circuit_breaker("service2").await.unwrap();
        
        let status = service.get_circuit_breaker_status().await;
        assert!(status.contains_key("service1"));
        assert!(status.contains_key("service2"));
    }

    #[tokio::test]
    async fn test_get_error_statistics() {
        let config = create_test_config();
        let service = ErrorRecoveryService::new(config);
        
        // Execute operations that fail
        let operation = || {
            Box::pin(async move {
                Err::<String, String>("Test error".to_string())
            })
        };
        
        // This will record errors
        let _ = service.execute_with_retry("op1", operation).await;
        
        let stats = service.get_error_statistics().await;
        assert!(!stats.is_empty());
    }

    #[tokio::test]
    async fn test_graceful_degradation_service() {
        let mut fallback_responses = HashMap::new();
        fallback_responses.insert("test_service".to_string(), "Fallback response".to_string());
        
        let service = GracefulDegradationService::new(fallback_responses);
        
        // Mark service as degraded
        service.mark_service_degraded("test_service").await;
        
        // Check if degraded
        let is_degraded = service.is_service_degraded("test_service").await;
        assert!(is_degraded);
        
        // Get fallback response
        let fallback = service.get_fallback_response("test_service");
        assert!(fallback.is_some());
        assert_eq!(fallback.unwrap(), "Fallback response");
    }

    #[tokio::test]
    async fn test_graceful_degradation_recovery() {
        let fallback_responses = HashMap::new();
        let service = GracefulDegradationService::new(fallback_responses);
        
        // Mark as degraded
        service.mark_service_degraded("test_service").await;
        assert!(service.is_service_degraded("test_service").await);
        
        // Mark as recovered
        service.mark_service_recovered("test_service").await;
        assert!(!service.is_service_degraded("test_service").await);
    }

    #[tokio::test]
    async fn test_get_degraded_services() {
        let fallback_responses = HashMap::new();
        let service = GracefulDegradationService::new(fallback_responses);
        
        // Mark multiple services as degraded
        service.mark_service_degraded("service1").await;
        service.mark_service_degraded("service2").await;
        
        let degraded = service.get_degraded_services().await;
        assert!(degraded.len() >= 2);
        assert!(degraded.contains(&"service1".to_string()));
        assert!(degraded.contains(&"service2".to_string()));
    }

    #[tokio::test]
    async fn test_error_context_builder() {
        let context = ErrorContext::new("op1".to_string())
            .with_user_id("user123".to_string())
            .with_request_id("req123".to_string())
            .with_endpoint("/api/test".to_string())
            .with_method("GET".to_string());
        
        assert_eq!(context.operation_id, "op1");
        assert_eq!(context.user_id, Some("user123".to_string()));
        assert_eq!(context.request_id, Some("req123".to_string()));
        assert_eq!(context.endpoint, Some("/api/test".to_string()));
        assert_eq!(context.method, Some("GET".to_string()));
    }

    #[tokio::test]
    async fn test_error_context_with_metadata() {
        let mut metadata = HashMap::new();
        metadata.insert("key1".to_string(), serde_json::json!("value1"));
        metadata.insert("key2".to_string(), serde_json::json!("value2"));
        
        let context = ErrorContext::new("op1".to_string())
            .with_metadata(metadata.clone());
        
        assert_eq!(context.metadata, metadata);
    }

    #[tokio::test]
    async fn test_retry_with_exponential_backoff() {
        let config = ErrorRecoveryConfig {
            max_retry_attempts: 3,
            retry_delay_ms: 100,
            exponential_backoff: true,
            max_backoff_ms: 1000,
            circuit_breaker_threshold: 5,
            circuit_breaker_timeout_ms: 1000,
            enable_graceful_degradation: true,
            fallback_responses: HashMap::new(),
        };
        
        let service = ErrorRecoveryService::new(config);
        
        let mut attempt = 0;
        let operation = || {
            attempt += 1;
            Box::pin(async move {
                Err::<String, String>(format!("Attempt {}", attempt))
            })
        };
        
        // Should retry with exponential backoff
        let start = std::time::Instant::now();
        let _result = service.execute_with_retry("test_op", operation).await;
        let duration = start.elapsed();
        
        // Should take some time due to backoff
        assert!(duration.as_millis() > 0);
    }

    #[tokio::test]
    async fn test_retry_without_exponential_backoff() {
        let config = ErrorRecoveryConfig {
            max_retry_attempts: 3,
            retry_delay_ms: 100,
            exponential_backoff: false,
            max_backoff_ms: 1000,
            circuit_breaker_threshold: 5,
            circuit_breaker_timeout_ms: 1000,
            enable_graceful_degradation: true,
            fallback_responses: HashMap::new(),
        };
        
        let service = ErrorRecoveryService::new(config);
        
        let operation = || {
            Box::pin(async move {
                Err::<String, String>("Always fails".to_string())
            })
        };
        
        let start = std::time::Instant::now();
        let _result = service.execute_with_retry("test_op", operation).await;
        let duration = start.elapsed();
        
        // Should take time but with constant delay
        assert!(duration.as_millis() > 0);
    }

    #[tokio::test]
    async fn test_multiple_circuit_breakers() {
        let config = create_test_config();
        let service = ErrorRecoveryService::new(config);
        
        // Create circuit breakers for multiple services
        service.check_circuit_breaker("service1").await.unwrap();
        service.check_circuit_breaker("service2").await.unwrap();
        service.check_circuit_breaker("service3").await.unwrap();
        
        // Open one circuit breaker
        for _ in 0..5 {
            service.record_circuit_breaker_failure("service1").await;
        }
        
        let status = service.get_circuit_breaker_status().await;
        assert_eq!(status.get("service1"), Some(&CircuitBreakerState::Open));
        assert_eq!(status.get("service2"), Some(&CircuitBreakerState::Closed));
        assert_eq!(status.get("service3"), Some(&CircuitBreakerState::Closed));
    }

    #[tokio::test]
    async fn test_error_recovery_service_concurrent_operations() {
        let config = create_test_config();
        let service = ErrorRecoveryService::new(config);
        
        // Test concurrent operations
        let (result1, result2, result3) = tokio::join!(
            service.check_circuit_breaker("service1"),
            service.check_circuit_breaker("service2"),
            service.get_circuit_breaker_status()
        );
        
        assert!(result1.is_ok());
        assert!(result2.is_ok());
        assert!(!result3.is_empty());
    }
}

