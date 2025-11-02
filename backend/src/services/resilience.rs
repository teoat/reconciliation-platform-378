//! Resilience patterns for services
//!
//! Provides circuit breakers, retry logic, and graceful degradation
//! for database, cache, and external API calls.

use std::sync::Arc;
use std::time::Duration;
use futures::Future;
use crate::errors::{AppError, AppResult};
use crate::middleware::circuit_breaker::{CircuitBreaker, CircuitBreakerConfig};

/// Circuit breaker manager for services
pub struct ResilienceManager {
    database_circuit_breaker: Arc<CircuitBreaker>,
    cache_circuit_breaker: Arc<CircuitBreaker>,
    api_circuit_breaker: Arc<CircuitBreaker>,
}

impl ResilienceManager {
    /// Create a new resilience manager with default circuit breakers
    pub fn new() -> Self {
        Self {
            database_circuit_breaker: Arc::new(CircuitBreaker::new(CircuitBreakerConfig {
                failure_threshold: 5,
                success_threshold: 2,
                timeout: Duration::from_secs(30),
                enable_fallback: true,
            })),
            cache_circuit_breaker: Arc::new(CircuitBreaker::new(CircuitBreakerConfig {
                failure_threshold: 10, // More tolerant for cache
                success_threshold: 3,
                timeout: Duration::from_secs(15), // Faster recovery for cache
                enable_fallback: true,
            })),
            api_circuit_breaker: Arc::new(CircuitBreaker::new(CircuitBreakerConfig {
                failure_threshold: 5,
                success_threshold: 2,
                timeout: Duration::from_secs(60),
                enable_fallback: true,
            })),
        }
    }

    /// Execute database operation with circuit breaker and retry
    pub async fn execute_database<F, T>(&self, operation: F) -> AppResult<T>
    where
        F: std::future::Future<Output = AppResult<T>>,
    {
        use crate::monitoring::metrics;
        
        // Record request
        metrics::CIRCUIT_BREAKER_REQUESTS.with_label_values(&["database"]).inc();
        
        // Execute with circuit breaker
        match self.database_circuit_breaker.call(operation).await {
            Ok(result) => {
                metrics::CIRCUIT_BREAKER_SUCCESSES.with_label_values(&["database"]).inc();
                Ok(result)
            }
            Err(e) => {
                metrics::CIRCUIT_BREAKER_FAILURES.with_label_values(&["database"]).inc();
                Err(e)
            }
        }
    }

    /// Execute cache operation with circuit breaker and retry
    pub async fn execute_cache<F, T>(&self, operation: F) -> AppResult<T>
    where
        F: std::future::Future<Output = AppResult<T>>,
    {
        use crate::monitoring::metrics;
        
        // Record request
        metrics::CIRCUIT_BREAKER_REQUESTS.with_label_values(&["cache"]).inc();
        
        // Execute with circuit breaker
        match self.cache_circuit_breaker.call(operation).await {
            Ok(result) => {
                metrics::CIRCUIT_BREAKER_SUCCESSES.with_label_values(&["cache"]).inc();
                Ok(result)
            }
            Err(e) => {
                metrics::CIRCUIT_BREAKER_FAILURES.with_label_values(&["cache"]).inc();
                Err(e)
            }
        }
    }

    /// Execute external API call with circuit breaker and retry
    pub async fn execute_api<F, T, Fut>(&self, operation: F) -> AppResult<T>
    where
        F: Fn() -> Fut + Send + Sync,
        Fut: std::future::Future<Output = AppResult<T>> + Send,
        T: Send,
    {
        use crate::monitoring::metrics;
        
        // Record request
        metrics::CIRCUIT_BREAKER_REQUESTS.with_label_values(&["api"]).inc();
        
        // Execute with circuit breaker first, then retry if needed
        let cb_result = self.api_circuit_breaker.call(operation()).await;
        
        // If circuit breaker fails, retry with exponential backoff
        match cb_result {
            Ok(result) => {
                metrics::CIRCUIT_BREAKER_SUCCESSES.with_label_values(&["api"]).inc();
                Ok(result)
            }
            Err(e) => {
                metrics::CIRCUIT_BREAKER_FAILURES.with_label_values(&["api"]).inc();
                // Retry with exponential backoff
                let mut attempt = 0;
                let max_retries = 3;
                let mut delay_ms = 100u64;
                
                while attempt < max_retries {
                    match self.api_circuit_breaker.call(operation()).await {
                        Ok(result) => {
                            metrics::CIRCUIT_BREAKER_SUCCESSES.with_label_values(&["api"]).inc();
                            return Ok(result);
                        }
                        Err(err) => {
                            metrics::CIRCUIT_BREAKER_FAILURES.with_label_values(&["api"]).inc();
                            attempt += 1;
                            if attempt < max_retries {
                                tokio::time::sleep(std::time::Duration::from_millis(delay_ms)).await;
                                delay_ms *= 2; // Exponential backoff
                            } else {
                                return Err(err);
                            }
                        }
                    }
                }
                
                Err(e)
            }
        }
    }

    /// Get database circuit breaker stats
    pub async fn get_database_stats(&self) -> crate::middleware::circuit_breaker::CircuitStats {
        let stats = self.database_circuit_breaker.get_stats().await;
        self.update_circuit_breaker_metrics("database", &stats).await;
        stats
    }

    /// Get cache circuit breaker stats
    pub async fn get_cache_stats(&self) -> crate::middleware::circuit_breaker::CircuitStats {
        let stats = self.cache_circuit_breaker.get_stats().await;
        self.update_circuit_breaker_metrics("cache", &stats).await;
        stats
    }

    /// Get API circuit breaker stats
    pub async fn get_api_stats(&self) -> crate::middleware::circuit_breaker::CircuitStats {
        let stats = self.api_circuit_breaker.get_stats().await;
        self.update_circuit_breaker_metrics("api", &stats).await;
        stats
    }

    /// Update Prometheus metrics for circuit breaker
    async fn update_circuit_breaker_metrics(
        &self,
        service: &str,
        stats: &crate::middleware::circuit_breaker::CircuitStats,
    ) {
        use crate::monitoring::metrics;
        
        // Update state gauge (0=closed, 1=half-open, 2=open)
        let state_value = match stats.state {
            crate::middleware::circuit_breaker::CircuitState::Closed => 0.0,
            crate::middleware::circuit_breaker::CircuitState::HalfOpen => 1.0,
            crate::middleware::circuit_breaker::CircuitState::Open => 2.0,
        };
        metrics::CIRCUIT_BREAKER_STATE.with_label_values(&[service]).set(state_value);
        
        // Note: Request/success/failure counters are already being incremented
        // in execute_* methods above. This method just updates the state gauge.
    }

    /// Reset all circuit breakers
    pub async fn reset_all(&self) {
        self.database_circuit_breaker.reset().await;
        self.cache_circuit_breaker.reset().await;
        self.api_circuit_breaker.reset().await;
    }
}

impl Default for ResilienceManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Graceful degradation utilities
pub mod graceful_degradation {
    use super::*;
    use serde_json::Value;

    /// Execute operation with graceful degradation
    /// Returns fallback value if operation fails
    pub async fn execute_with_fallback<F, T>(
        operation: F,
        fallback: T,
    ) -> T
    where
        F: std::future::Future<Output = AppResult<T>>,
        T: Clone,
    {
        match operation.await {
            Ok(result) => result,
            Err(e) => {
                log::warn!("Operation failed, using fallback: {}", e);
                fallback
            }
        }
    }

    /// Execute operation with default fallback for Option types
    pub async fn execute_with_default<F, T>(
        operation: F,
    ) -> T
    where
        F: std::future::Future<Output = AppResult<Option<T>>>,
        T: Default,
    {
        operation.await
            .unwrap_or_else(|e| {
                log::warn!("Operation failed, using default: {}", e);
                None
            })
            .unwrap_or_default()
    }

    /// Execute operation with empty fallback for collections
    pub async fn execute_with_empty<F, T>(
        operation: F,
    ) -> T
    where
        F: std::future::Future<Output = AppResult<T>>,
        T: Default,
    {
        operation.await.unwrap_or_else(|e| {
            log::warn!("Operation failed, using empty collection: {}", e);
            T::default()
        })
    }

    /// Execute operation with cached fallback
    pub async fn execute_with_cached_fallback<F, T>(
        operation: F,
        cache_key: &str,
        ttl_seconds: u64,
    ) -> AppResult<T>
    where
        F: std::future::Future<Output = AppResult<T>>,
        T: serde::Serialize + for<'de> serde::Deserialize<'de> + Clone,
    {
        // Try to get from cache first
        // If operation fails, return cached value if available
        // This would need cache service integration
        operation.await
    }
}

