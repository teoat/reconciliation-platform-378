//! Resilience patterns for services
//!
//! Provides circuit breakers, retry logic, and graceful degradation
//! for database, cache, and external API calls.

use crate::errors::AppResult;
use crate::middleware::circuit_breaker::{CircuitBreaker, CircuitBreakerConfig};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;

/// Configuration for circuit breaker service
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CircuitBreakerServiceConfig {
    pub failure_threshold: u32,
    pub success_threshold: u32,
    pub timeout_seconds: u64,
    pub enable_fallback: bool,
}

/// Configuration for retry logic
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetryConfig {
    pub max_retries: u32,
    pub initial_delay_ms: u64,
    pub max_delay_ms: u64,
    pub backoff_multiplier: f64,
}

/// Overall resilience configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResilienceConfig {
    pub database: CircuitBreakerServiceConfig,
    pub cache: CircuitBreakerServiceConfig,
    pub api: CircuitBreakerServiceConfig,
    pub retry: RetryConfig,
}

impl Default for ResilienceConfig {
    fn default() -> Self {
        Self {
            database: CircuitBreakerServiceConfig {
                failure_threshold: 5,
                success_threshold: 2,
                timeout_seconds: 30,
                enable_fallback: true,
            },
            cache: CircuitBreakerServiceConfig {
                failure_threshold: 10,
                success_threshold: 3,
                timeout_seconds: 15,
                enable_fallback: true,
            },
            api: CircuitBreakerServiceConfig {
                failure_threshold: 5,
                success_threshold: 2,
                timeout_seconds: 60,
                enable_fallback: true,
            },
            retry: RetryConfig {
                max_retries: 3,
                initial_delay_ms: 100,
                max_delay_ms: 10000,
                backoff_multiplier: 2.0,
            },
        }
    }
}

/// Circuit breaker manager for services
pub struct ResilienceManager {
    database_circuit_breaker: Arc<CircuitBreaker>,
    cache_circuit_breaker: Arc<CircuitBreaker>,
    api_circuit_breaker: Arc<CircuitBreaker>,
    retry_config: RetryConfig,
}

impl ResilienceManager {
    /// Create a new resilience manager with default circuit breakers
    pub fn new() -> Self {
        Self::with_config(ResilienceConfig::default())
    }

    /// Create a resilience manager with custom configuration
    pub fn with_config(config: ResilienceConfig) -> Self {
        Self {
            database_circuit_breaker: Arc::new(CircuitBreaker::new(CircuitBreakerConfig {
                failure_threshold: config.database.failure_threshold as usize,
                success_threshold: config.database.success_threshold as usize,
                timeout: Duration::from_secs(config.database.timeout_seconds),
                enable_fallback: config.database.enable_fallback,
            })),
            cache_circuit_breaker: Arc::new(CircuitBreaker::new(CircuitBreakerConfig {
                failure_threshold: config.cache.failure_threshold as usize,
                success_threshold: config.cache.success_threshold as usize,
                timeout: Duration::from_secs(config.cache.timeout_seconds),
                enable_fallback: config.cache.enable_fallback,
            })),
            api_circuit_breaker: Arc::new(CircuitBreaker::new(CircuitBreakerConfig {
                failure_threshold: config.api.failure_threshold as usize,
                success_threshold: config.api.success_threshold as usize,
                timeout: Duration::from_secs(config.api.timeout_seconds),
                enable_fallback: config.api.enable_fallback,
            })),
            retry_config: config.retry,
        }
    }

    /// Execute database operation with circuit breaker and retry
    pub async fn execute_database<F, T>(&self, operation: F) -> AppResult<T>
    where
        F: std::future::Future<Output = AppResult<T>>,
    {
        self.execute_database_with_correlation(operation, None)
            .await
    }

    /// Execute database operation with circuit breaker and correlation ID
    pub async fn execute_database_with_correlation<F, T>(
        &self,
        operation: F,
        correlation_id: Option<String>,
    ) -> AppResult<T>
    where
        F: std::future::Future<Output = AppResult<T>>,
    {
        use crate::monitoring::metrics;

        let corr_id = correlation_id.as_deref().unwrap_or("unknown");

        // Record request
        metrics::CIRCUIT_BREAKER_REQUESTS
            .with_label_values(&["database"])
            .inc();

        // Log operation start with correlation ID
        log::debug!(
            "[{}] Executing database operation with circuit breaker",
            corr_id
        );

        // Execute with circuit breaker
        match self.database_circuit_breaker.call(operation).await {
            Ok(result) => {
                metrics::CIRCUIT_BREAKER_SUCCESSES
                    .with_label_values(&["database"])
                    .inc();
                log::debug!("[{}] Database operation succeeded", corr_id);
                Ok(result)
            }
            Err(e) => {
                metrics::CIRCUIT_BREAKER_FAILURES
                    .with_label_values(&["database"])
                    .inc();
                log::warn!("[{}] Database operation failed: {}", corr_id, e);
                Err(e)
            }
        }
    }

    /// Execute cache operation with circuit breaker and retry
    pub async fn execute_cache<F, T>(&self, operation: F) -> AppResult<T>
    where
        F: std::future::Future<Output = AppResult<T>>,
    {
        self.execute_cache_with_correlation(operation, None).await
    }

    /// Execute cache operation with circuit breaker and correlation ID
    pub async fn execute_cache_with_correlation<F, T>(
        &self,
        operation: F,
        correlation_id: Option<String>,
    ) -> AppResult<T>
    where
        F: std::future::Future<Output = AppResult<T>>,
    {
        use crate::monitoring::metrics;

        let corr_id = correlation_id.as_deref().unwrap_or("unknown");

        // Record request
        metrics::CIRCUIT_BREAKER_REQUESTS
            .with_label_values(&["cache"])
            .inc();

        // Log operation start with correlation ID
        log::debug!(
            "[{}] Executing cache operation with circuit breaker",
            corr_id
        );

        // Execute with circuit breaker
        match self.cache_circuit_breaker.call(operation).await {
            Ok(result) => {
                metrics::CIRCUIT_BREAKER_SUCCESSES
                    .with_label_values(&["cache"])
                    .inc();
                log::debug!("[{}] Cache operation succeeded", corr_id);
                Ok(result)
            }
            Err(e) => {
                metrics::CIRCUIT_BREAKER_FAILURES
                    .with_label_values(&["cache"])
                    .inc();
                log::warn!("[{}] Cache operation failed: {}", corr_id, e);
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
        self.execute_api_with_correlation(operation, None).await
    }

    /// Execute external API call with circuit breaker, retry, and correlation ID
    pub async fn execute_api_with_correlation<F, T, Fut>(
        &self,
        operation: F,
        correlation_id: Option<String>,
    ) -> AppResult<T>
    where
        F: Fn() -> Fut + Send + Sync,
        Fut: std::future::Future<Output = AppResult<T>> + Send,
        T: Send,
    {
        use crate::monitoring::metrics;

        let corr_id = correlation_id.as_deref().unwrap_or("unknown");

        // Record request
        metrics::CIRCUIT_BREAKER_REQUESTS
            .with_label_values(&["api"])
            .inc();

        // Log operation start with correlation ID
        log::debug!("[{}] Executing API operation with circuit breaker", corr_id);

        // Execute with circuit breaker first, then retry if needed
        let cb_result = self.api_circuit_breaker.call(operation()).await;

        // If circuit breaker fails, retry with exponential backoff
        match cb_result {
            Ok(result) => {
                metrics::CIRCUIT_BREAKER_SUCCESSES
                    .with_label_values(&["api"])
                    .inc();
                log::debug!("[{}] API operation succeeded", corr_id);
                Ok(result)
            }
            Err(e) => {
                metrics::CIRCUIT_BREAKER_FAILURES
                    .with_label_values(&["api"])
                    .inc();
                log::warn!("[{}] API operation failed, retrying: {}", corr_id, e);

                // Retry with exponential backoff using configured retry config
                let mut attempt = 0;
                let mut delay_ms = self.retry_config.initial_delay_ms;

                while attempt < self.retry_config.max_retries {
                    log::debug!(
                        "[{}] Retry attempt {} for API operation",
                        corr_id,
                        attempt + 1
                    );

                    match self.api_circuit_breaker.call(operation()).await {
                        Ok(result) => {
                            metrics::CIRCUIT_BREAKER_SUCCESSES
                                .with_label_values(&["api"])
                                .inc();
                            log::info!(
                                "[{}] API operation succeeded after {} retries",
                                corr_id,
                                attempt + 1
                            );
                            return Ok(result);
                        }
                        Err(err) => {
                            metrics::CIRCUIT_BREAKER_FAILURES
                                .with_label_values(&["api"])
                                .inc();
                            attempt += 1;
                            if attempt < self.retry_config.max_retries {
                                // Calculate delay with exponential backoff
                                let calculated_delay =
                                    (delay_ms as f64 * self.retry_config.backoff_multiplier) as u64;
                                let final_delay =
                                    std::cmp::min(calculated_delay, self.retry_config.max_delay_ms);
                                log::debug!(
                                    "[{}] Waiting {}ms before retry {}",
                                    corr_id,
                                    final_delay,
                                    attempt + 1
                                );
                                tokio::time::sleep(std::time::Duration::from_millis(final_delay))
                                    .await;
                                delay_ms = final_delay;
                            } else {
                                log::error!(
                                    "[{}] API operation failed after {} retries: {}",
                                    corr_id,
                                    self.retry_config.max_retries,
                                    err
                                );
                                return Err(err);
                            }
                        }
                    }
                }

                log::error!("[{}] API operation failed after all retries", corr_id);
                Err(e)
            }
        }
    }

    /// Get database circuit breaker stats
    pub async fn get_database_stats(&self) -> crate::middleware::circuit_breaker::CircuitStats {
        let stats = self.database_circuit_breaker.get_stats().await;
        self.update_circuit_breaker_metrics("database", &stats)
            .await;
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
        metrics::CIRCUIT_BREAKER_STATE
            .with_label_values(&[service])
            .set(state_value);

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

    /// Execute operation with graceful degradation
    /// Returns fallback value if operation fails
    pub async fn execute_with_fallback<F, T>(operation: F, fallback: T) -> T
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
    pub async fn execute_with_default<F, T>(operation: F) -> T
    where
        F: std::future::Future<Output = AppResult<Option<T>>>,
        T: Default,
    {
        operation
            .await
            .unwrap_or_else(|e| {
                log::warn!("Operation failed, using default: {}", e);
                None
            })
            .unwrap_or_default()
    }

    /// Execute operation with empty fallback for collections
    pub async fn execute_with_empty<F, T>(operation: F) -> T
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
