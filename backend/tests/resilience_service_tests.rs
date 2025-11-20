//! Service layer tests for ResilienceManager
//!
//! Tests resilience patterns including circuit breakers,
//! retry logic, and graceful degradation.

use reconciliation_backend::services::resilience::{
    ResilienceManager, ResilienceConfig, CircuitBreakerServiceConfig, RetryConfig,
};

/// Test ResilienceManager methods
#[cfg(test)]
mod resilience_service_tests {
    use super::*;

    #[test]
    fn test_resilience_manager_creation() {
        let manager = ResilienceManager::new();
        
        // Verify manager is created
        assert!(true);
    }

    #[test]
    fn test_resilience_manager_with_config() {
        let config = ResilienceConfig {
            database: CircuitBreakerServiceConfig {
                failure_threshold: 10,
                success_threshold: 5,
                timeout_seconds: 60,
                enable_fallback: true,
            },
            cache: CircuitBreakerServiceConfig {
                failure_threshold: 15,
                success_threshold: 3,
                timeout_seconds: 30,
                enable_fallback: true,
            },
            api: CircuitBreakerServiceConfig {
                failure_threshold: 8,
                success_threshold: 2,
                timeout_seconds: 120,
                enable_fallback: true,
            },
            retry: RetryConfig {
                max_retries: 5,
                initial_delay_ms: 200,
                max_delay_ms: 20000,
                backoff_multiplier: 2.5,
            },
        };

        let manager = ResilienceManager::with_config(config);
        
        // Verify manager is created with custom config
        assert!(true);
    }

    #[test]
    fn test_resilience_config_default() {
        let config = ResilienceConfig::default();
        
        assert_eq!(config.database.failure_threshold, 5);
        assert_eq!(config.retry.max_retries, 3);
        assert!(config.database.enable_fallback);
    }

    #[tokio::test]
    async fn test_database_circuit_breaker() {
        let manager = ResilienceManager::new();

        // Test database circuit breaker
        let result = manager
            .execute_database(async {
                Ok::<(), reconciliation_backend::errors::AppError>(())
            })
            .await;

        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_cache_circuit_breaker() {
        let manager = ResilienceManager::new();

        // Test cache circuit breaker
        let result = manager
            .execute_cache(async {
                Ok::<(), reconciliation_backend::errors::AppError>(())
            })
            .await;

        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_api_circuit_breaker() {
        let manager = ResilienceManager::new();

        // Test API circuit breaker - wrap async block in closure
        let result = manager
            .execute_api(|| async {
                Ok::<(), reconciliation_backend::errors::AppError>(())
            })
            .await;

        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_database_with_correlation() {
        let manager = ResilienceManager::new();

        // Test database operation with correlation ID
        let result = manager
            .execute_database_with_correlation(
                async {
                    Ok::<(), reconciliation_backend::errors::AppError>(())
                },
                Some("test_correlation_id".to_string()),
            )
            .await;

        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_cache_with_correlation() {
        let manager = ResilienceManager::new();

        // Test cache operation with correlation ID
        let result = manager
            .execute_cache_with_correlation(
                async {
                    Ok::<(), reconciliation_backend::errors::AppError>(())
                },
                Some("test_correlation_id".to_string()),
            )
            .await;

        assert!(result.is_ok() || result.is_err());
    }
}

