//! Circuit Breaker Pattern Implementation
//!
//! Prevents cascade failures by stopping requests to failing services,
//! allowing them time to recover.

use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use crate::errors::{AppError, AppResult};

/// Circuit breaker states
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum CircuitState {
    /// Normal operation - requests pass through
    Closed,
    
    /// Failing - requests are rejected immediately
    Open,
    
    /// Testing if service has recovered
    HalfOpen,
}

/// Circuit breaker configuration
#[derive(Debug, Clone)]
pub struct CircuitBreakerConfig {
    /// Number of failures before opening circuit
    pub failure_threshold: usize,
    
    /// Number of successes before closing circuit
    pub success_threshold: usize,
    
    /// Timeout before attempting half-open state
    pub timeout: Duration,
    
    /// Enable fallback on failure
    pub enable_fallback: bool,
}

impl Default for CircuitBreakerConfig {
    fn default() -> Self {
        Self {
            failure_threshold: 5,
            success_threshold: 2,
            timeout: Duration::from_secs(60),
            enable_fallback: true,
        }
    }
}

/// Circuit breaker statistics
#[derive(Debug, Clone)]
pub struct CircuitStats {
    pub state: CircuitState,
    pub failure_count: usize,
    pub success_count: usize,
    pub last_failure: Option<Instant>,
    pub total_requests: u64,
    pub total_failures: u64,
    pub total_successes: u64,
}

/// Circuit breaker
pub struct CircuitBreaker {
    state: Arc<RwLock<CircuitState>>,
    failure_count: Arc<RwLock<usize>>,
    success_count: Arc<RwLock<usize>>,
    last_state_change: Arc<RwLock<Instant>>,
    config: CircuitBreakerConfig,
    stats: Arc<RwLock<CircuitStats>>,
}

impl CircuitBreaker {
    /// Create a new circuit breaker
    pub fn new(config: CircuitBreakerConfig) -> Self {
        Self {
            state: Arc::new(RwLock::new(CircuitState::Closed)),
            failure_count: Arc::new(RwLock::new(0)),
            success_count: Arc::new(RwLock::new(0)),
            last_state_change: Arc::new(RwLock::new(Instant::now())),
            config,
            stats: Arc::new(RwLock::new(CircuitStats {
                state: CircuitState::Closed,
                failure_count: 0,
                success_count: 0,
                last_failure: None,
                total_requests: 0,
                total_failures: 0,
                total_successes: 0,
            })),
        }
    }

    /// Call a function through the circuit breaker
    pub async fn call<F, T>(&self, f: F) -> AppResult<T>
    where
        F: Future<Output = AppResult<T>>,
    {
        // Check if we should allow the request
        if !self.is_request_allowed().await {
            let mut stats = self.stats.write().await;
            stats.total_requests += 1;
            
            return Err(AppError::ServiceUnavailable(
                "Circuit breaker is open. Service unavailable.".to_string()
            ));
        }

        // Try to execute the function
        let result = f.await;

        // Update statistics
        let mut stats = self.stats.write().await;
        stats.total_requests += 1;

        match result {
            Ok(value) => {
                self.record_success().await;
                stats.total_successes += 1;
                Ok(value)
            }
            Err(e) => {
                self.record_failure().await;
                stats.total_failures += 1;
                stats.last_failure = Some(Instant::now());
                
                // If fallback enabled, return a fallback response
                if self.config.enable_fallback {
                    log::warn!("Circuit breaker detected failure. Using fallback.");
                    return self.get_fallback_response().await;
                }
                
                Err(e)
            }
        }
    }

    /// Check if request should be allowed
    async fn is_request_allowed(&self) -> bool {
        let state = self.state.read().await.clone();
        
        match state {
            CircuitState::Closed => true,
            
            CircuitState::Open => {
                // Check if timeout has passed
                let last_change = self.last_state_change.read().await;
                if last_change.elapsed() > self.config.timeout {
                    // Transition to half-open
                    drop(last_change);
                    self.transition_to_half_open().await;
                    true
                } else {
                    false
                }
            }
            
            CircuitState::HalfOpen => true,
        }
    }

    /// Record a successful operation
    async fn record_success(&self) {
        let mut state = self.state.write().await;
        
        match *state {
            CircuitState::Closed => {
                // Reset failure count on success
                let mut failures = self.failure_count.write().await;
                *failures = 0;
            }
            
            CircuitState::HalfOpen => {
                let mut successes = self.success_count.write().await;
                *successes += 1;
                
                // If we have enough successes, close the circuit
                if *successes >= self.config.success_threshold {
                    *state = CircuitState::Closed;
                    *successes = 0;
                    *self.failure_count.write().await = 0;
                    *self.last_state_change.write().await = Instant::now();
                    
                    // Update stats
                    let mut stats = self.stats.write().await;
                    stats.state = CircuitState::Closed;
                }
            }
            
            CircuitState::Open => {
                // Should not happen in open state
            }
        }
    }

    /// Record a failed operation
    async fn record_failure(&self) {
        let mut state = self.state.write().await;
        
        match *state {
            CircuitState::Closed | CircuitState::HalfOpen => {
                let mut failures = self.failure_count.write().await;
                *failures += 1;
                
                // Update stats
                let mut stats = self.stats.write().await;
                stats.failure_count = *failures;
                
                // If we exceed the threshold, open the circuit
                if *failures >= self.config.failure_threshold {
                    *state = CircuitState::Open;
                    *self.last_state_change.write().await = Instant::now();
                    
                    stats.state = CircuitState::Open;
                    stats.failure_count = 0;
                    stats.success_count = 0;
                    
                    log::error!(
                        "Circuit breaker opened after {} failures",
                        self.config.failure_threshold
                    );
                }
            }
            
            CircuitState::Open => {
                // Already open, no-op
            }
        }
    }

    /// Transition to half-open state
    async fn transition_to_half_open(&self) {
        let mut state = self.state.write().await;
        if *state == CircuitState::Open {
            *state = CircuitState::HalfOpen;
            *self.last_state_change.write().await = Instant::now();
            *self.success_count.write().await = 0;
            
            // Update stats
            let mut stats = self.stats.write().await;
            stats.state = CircuitState::HalfOpen;
            
            log::info!("Circuit breaker transitioning to half-open state");
        }
    }

    /// Get fallback response (placeholder)
    async fn get_fallback_response<T>(&self) -> AppResult<T> {
        // In a real implementation, this would return a cached or default response
        Err(AppError::ServiceUnavailable(
            "Service unavailable. Fallback not implemented.".to_string()
        ))
    }

    /// Get current statistics
    pub async fn get_stats(&self) -> CircuitStats {
        let stats = self.stats.read().await.clone();
        stats
    }

    /// Get current state
    pub async fn get_state(&self) -> CircuitState {
        *self.state.read().await
    }

    /// Force reset circuit breaker
    pub async fn reset(&self) {
        *self.state.write().await = CircuitState::Closed;
        *self.failure_count.write().await = 0;
        *self.success_count.write().await = 0;
        *self.last_state_change.write().await = Instant::now();
        
        let mut stats = self.stats.write().await;
        stats.state = CircuitState::Closed;
        stats.failure_count = 0;
        stats.success_count = 0;
    }
}

// Re-export for use in other modules
pub use futures::Future;

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[tokio::test]
    async fn test_circuit_closed_initial() {
        let cb = CircuitBreaker::new(CircuitBreakerConfig::default());
        assert_eq!(cb.get_state().await, CircuitState::Closed);
    }

    #[tokio::test]
    async fn test_circuit_opens_after_threshold() {
        let config = CircuitBreakerConfig {
            failure_threshold: 3,
            ..Default::default()
        };
        let cb = CircuitBreaker::new(config);

        // Simulate failures
        for _ in 0..3 {
            cb.record_failure().await;
        }

        assert_eq!(cb.get_state().await, CircuitState::Open);
    }

    #[tokio::test]
    async fn test_circuit_half_open_after_timeout() {
        let config = CircuitBreakerConfig {
            failure_threshold: 2,
            timeout: Duration::from_millis(100),
            ..Default::default()
        };
        let cb = CircuitBreaker::new(config);

        // Open the circuit
        for _ in 0..2 {
            cb.record_failure().await;
        }
        assert_eq!(cb.get_state().await, CircuitState::Open);

        // Wait for timeout
        tokio::time::sleep(Duration::from_millis(150)).await;

        // Attempt request should trigger half-open
        cb.is_request_allowed().await;
        tokio::time::sleep(Duration::from_millis(10)).await;
        
        // State should be half-open or closed
        let state = cb.get_state().await;
        assert!(state == CircuitState::HalfOpen || state == CircuitState::Closed);
    }

    #[tokio::test]
    async fn test_circuit_closes_after_successes() {
        let config = CircuitBreakerConfig {
            failure_threshold: 2,
            success_threshold: 2,
            ..Default::default()
        };
        let cb = CircuitBreaker::new(config);

        // Open the circuit
        for _ in 0..2 {
            cb.record_failure().await;
        }

        // Manually transition to half-open
        cb.transition_to_half_open().await;

        // Record successes
        for _ in 0..2 {
            cb.record_success().await;
        }

        assert_eq!(cb.get_state().await, CircuitState::Closed);
    }
}

