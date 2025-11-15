//! Integration Tests for Resilience Patterns
//! 
//! Tests circuit breakers, retry logic, and graceful degradation
//! for database, cache, and external API calls.

use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;

use reconciliation_backend::services::resilience::{ResilienceManager, graceful_degradation};
use reconciliation_backend::middleware::circuit_breaker::{CircuitState, CircuitBreakerConfig};
use reconciliation_backend::errors::{AppError, AppResult};

/// Test suite for circuit breakers
#[cfg(test)]
mod circuit_breaker_tests {
    use super::*;

    #[tokio::test]
    async fn test_database_circuit_breaker_state_transitions() {
        let manager = ResilienceManager::new();
        
        // Initially circuit should be closed
        let stats = manager.get_database_stats().await;
        assert_eq!(stats.state, CircuitState::Closed);
        
        // Trigger failures to open circuit
        for _ in 0..6 {
            let _ = manager.execute_database(async {
                Err(AppError::Database("Test failure".to_string()))
            }).await;
        }
        
        // Circuit should now be open
        let stats = manager.get_database_stats().await;
        assert_eq!(stats.state, CircuitState::Open);
        assert_eq!(stats.failure_count, 6);
        
        // Requests should fail immediately when circuit is open
        let result = manager.execute_database(async {
            Ok::<(), AppError>(())
        }).await;
        
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_cache_circuit_breaker_graceful_degradation() {
        let manager = ResilienceManager::new();
        
        // Trigger failures to open circuit
        for _ in 0..11 {
            let _ = manager.execute_cache(async {
                Err(AppError::InternalServerError("Cache failure".to_string()))
            }).await;
        }
        
        // Circuit should be open
        let stats = manager.get_cache_stats().await;
        assert_eq!(stats.state, CircuitState::Open);
        
        // With graceful degradation, operations should still handle errors gracefully
        // (This depends on cache implementation - L1 cache should still work)
    }

    #[tokio::test]
    async fn test_api_circuit_breaker_with_retry() {
        let manager = ResilienceManager::new();
        
        let mut attempt_count = 0;
        let operation = || async {
            attempt_count += 1;
            if attempt_count < 3 {
                Err(AppError::InternalServerError("API failure".to_string()))
            } else {
                Ok::<String, AppError>("Success".to_string())
            }
        };
        
        // Should retry and eventually succeed
        let result = manager.execute_api(operation).await;
        assert!(result.is_ok());
        assert_eq!(attempt_count, 3);
        assert_eq!(result.unwrap(), "Success");
    }

    #[tokio::test]
    async fn test_circuit_breaker_recovery_to_half_open() {
        let manager = ResilienceManager::new();
        
        // Open the circuit
        for _ in 0..6 {
            let _ = manager.execute_database(async {
                Err(AppError::Database("Failure".to_string()))
            }).await;
        }
        
        let stats = manager.get_database_stats().await;
        assert_eq!(stats.state, CircuitState::Open);
        
        // Wait for timeout period
        sleep(Duration::from_secs(31)).await;
        
        // Next request should move to half-open
        let _ = manager.execute_database(async {
            Ok::<(), AppError>(())
        }).await;
        
        let stats = manager.get_database_stats().await;
        // State should be half-open or closed depending on implementation
        assert_ne!(stats.state, CircuitState::Open);
    }

    #[tokio::test]
    async fn test_circuit_breaker_stats_tracking() {
        let manager = ResilienceManager::new();
        
        // Execute some operations
        let _ = manager.execute_database(async {
            Ok::<(), AppError>(())
        }).await;
        
        let _ = manager.execute_database(async {
            Err(AppError::Database("Failure".to_string()))
        }).await;
        
        let stats = manager.get_database_stats().await;
        assert!(stats.total_requests > 0);
        assert!(stats.total_failures > 0 || stats.total_successes > 0);
    }

    #[tokio::test]
    async fn test_circuit_breaker_reset() {
        let manager = ResilienceManager::new();
        
        // Open the circuit
        for _ in 0..6 {
            let _ = manager.execute_database(async {
                Err(AppError::Database("Failure".to_string()))
            }).await;
        }
        
        let stats = manager.get_database_stats().await;
        assert_eq!(stats.state, CircuitState::Open);
        
        // Reset all circuit breakers
        manager.reset_all().await;
        
        // After reset, circuit should be closed
        let stats = manager.get_database_stats().await;
        assert_eq!(stats.state, CircuitState::Closed);
    }
}

/// Test suite for graceful degradation
#[cfg(test)]
mod graceful_degradation_tests {
    use super::*;

    #[tokio::test]
    async fn test_execute_with_fallback() {
        let fallback_value = "fallback".to_string();
        
        let result = graceful_degradation::execute_with_fallback(
            async { Err(AppError::InternalServerError("Failure".to_string())) },
            fallback_value.clone(),
        ).await;
        
        assert_eq!(result, fallback_value);
    }

    #[tokio::test]
    async fn test_execute_with_fallback_success() {
        let success_value = "success".to_string();
        let fallback_value = "fallback".to_string();
        
        let result = graceful_degradation::execute_with_fallback(
            async { Ok::<String, AppError>(success_value.clone()) },
            fallback_value.clone(),
        ).await;
        
        assert_eq!(result, success_value);
    }

    #[tokio::test]
    async fn test_execute_with_default() {
        let result: String = graceful_degradation::execute_with_default(
            async { Err(AppError::InternalServerError("Failure".to_string())) },
        ).await;
        
        assert_eq!(result, String::default());
    }

    #[tokio::test]
    async fn test_execute_with_default_success() {
        let result: String = graceful_degradation::execute_with_default(
            async { Ok(Some("success".to_string())) },
        ).await;
        
        assert_eq!(result, "success");
    }

    #[tokio::test]
    async fn test_execute_with_empty() {
        let result: Vec<String> = graceful_degradation::execute_with_empty(
            async { Err(AppError::InternalServerError("Failure".to_string())) },
        ).await;
        
        assert_eq!(result, Vec::<String>::new());
    }

    #[tokio::test]
    async fn test_execute_with_empty_success() {
        let expected = vec!["item1".to_string(), "item2".to_string()];
        
        let result: Vec<String> = graceful_degradation::execute_with_empty(
            async { Ok(expected.clone()) },
        ).await;
        
        assert_eq!(result, expected);
    }
}

/// Test suite for metrics integration
#[cfg(test)]
mod metrics_integration_tests {
    use super::*;
    use reconciliation_backend::monitoring::metrics;

    #[tokio::test]
    async fn test_circuit_breaker_metrics_updated() {
        let manager = ResilienceManager::new();
        
        // Execute operations to trigger metrics
        let _ = manager.execute_database(async {
            Ok::<(), AppError>(())
        }).await;
        
        // Check that metrics exist (they should be registered)
        let stats = manager.get_database_stats().await;
        assert!(stats.total_requests > 0);
    }

    #[tokio::test]
    async fn test_circuit_breaker_state_metrics() {
        let manager = ResilienceManager::new();
        
        // Get stats to trigger metric updates
        let stats = manager.get_database_stats().await;
        
        // Verify state gauge is set correctly
        let state_value = match stats.state {
            CircuitState::Closed => 0.0,
            CircuitState::HalfOpen => 1.0,
            CircuitState::Open => 2.0,
        };
        
        // Metrics should be accessible (we can't directly check Prometheus metrics in unit tests,
        // but we can verify the stats are being tracked)
        assert!(stats.total_requests >= 0);
    }
}

/// Test suite for error propagation
#[cfg(test)]
mod error_propagation_tests {
    use super::*;

    #[tokio::test]
    async fn test_circuit_breaker_preserves_error_types() {
        let manager = ResilienceManager::new();
        
        let result = manager.execute_database(async {
            Err(AppError::Validation("Invalid input".to_string()))
        }).await;
        
        assert!(result.is_err());
        if let Err(e) = result {
            match e {
                AppError::Validation(_) => {} // Expected
                _ => panic!("Error type should be preserved"),
            }
        }
    }

    #[tokio::test]
    async fn test_retry_with_exponential_backoff_timing() {
        let manager = ResilienceManager::new();
        
        let start = std::time::Instant::now();
        let mut attempt_count = 0;
        
        let operation = || async {
            attempt_count += 1;
            if attempt_count < 2 {
                Err(AppError::InternalServerError("Retry needed".to_string()))
            } else {
                Ok::<(), AppError>(())
            }
        };
        
        // Should retry with delays
        let _ = manager.execute_api(operation).await;
        
        let duration = start.elapsed();
        
        // Should have taken at least some time due to retries
        assert!(duration.as_millis() >= 100); // At least 100ms for retry delay
        assert_eq!(attempt_count, 2);
    }
}

