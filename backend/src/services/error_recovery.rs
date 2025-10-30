//! Enhanced Error Handling and Recovery
//! 
//! This module provides comprehensive error handling, recovery mechanisms,
//! and centralized error tracking.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use actix_web::{HttpResponse, ResponseError};
use thiserror::Error;

use crate::errors::{AppError, AppResult};

/// Error recovery configuration
#[derive(Debug, Clone)]
pub struct ErrorRecoveryConfig {
    pub max_retry_attempts: u32,
    pub retry_delay_ms: u64,
    pub exponential_backoff: bool,
    pub max_backoff_ms: u64,
    pub circuit_breaker_threshold: u32,
    pub circuit_breaker_timeout_ms: u64,
    pub enable_graceful_degradation: bool,
    pub fallback_responses: HashMap<String, String>,
}

impl Default for ErrorRecoveryConfig {
    fn default() -> Self {
        Self {
            max_retry_attempts: 3,
            retry_delay_ms: 1000,
            exponential_backoff: true,
            max_backoff_ms: 30000,
            circuit_breaker_threshold: 5,
            circuit_breaker_timeout_ms: 60000,
            enable_graceful_degradation: true,
            fallback_responses: HashMap::new(),
        }
    }
}

/// Error recovery service
pub struct ErrorRecoveryService {
    pub config: ErrorRecoveryConfig,
    pub retry_attempts: Arc<RwLock<HashMap<String, RetryAttempt>>>,
    pub circuit_breakers: Arc<RwLock<HashMap<String, CircuitBreaker>>>,
    pub error_history: Arc<RwLock<Vec<ErrorRecord>>>,
}

/// Retry attempt record
#[derive(Debug, Clone)]
pub struct RetryAttempt {
    pub operation_id: String,
    pub attempt_count: u32,
    pub last_attempt: u64,
    pub next_retry: u64,
    pub error_type: String,
    pub error_message: String,
}

/// Circuit breaker state
#[derive(Debug, Clone)]
pub struct CircuitBreaker {
    pub service_name: String,
    pub failure_count: u32,
    pub last_failure: u64,
    pub state: CircuitBreakerState,
    pub threshold: u32,
    pub timeout_ms: u64,
}

#[derive(Debug, Clone, PartialEq)]
pub enum CircuitBreakerState {
    Closed,    // Normal operation
    Open,      // Circuit is open, failing fast
    HalfOpen,  // Testing if service is back
}

/// Error record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorRecord {
    pub id: String,
    pub timestamp: u64,
    pub error_type: String,
    pub error_message: String,
    pub stack_trace: Option<String>,
    pub operation_id: Option<String>,
    pub user_id: Option<String>,
    pub request_id: Option<String>,
    pub endpoint: Option<String>,
    pub method: Option<String>,
    pub status_code: Option<u16>,
    pub retry_count: u32,
    pub resolved: bool,
    pub resolution: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
}

impl ErrorRecoveryService {
    pub fn new(config: ErrorRecoveryConfig) -> Self {
        Self {
            config,
            retry_attempts: Arc::new(RwLock::new(HashMap::new())),
            circuit_breakers: Arc::new(RwLock::new(HashMap::new())),
            error_history: Arc::new(RwLock::new(Vec::new())),
        }
    }
    
    /// Execute operation with retry logic
    pub async fn execute_with_retry<F, T, E>(
        &self,
        operation_id: &str,
        operation: F,
    ) -> AppResult<T>
    where
        F: Fn() -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<T, E>> + Send>>,
        E: std::fmt::Display + Send + Sync + 'static,
    {
        let mut attempt = 0;
        let mut last_error: Option<E> = None;
        
        while attempt < self.config.max_retry_attempts {
            match operation().await {
                Ok(result) => {
                    // Success - clear any retry attempts
                    self.clear_retry_attempt(operation_id).await;
                    return Ok(result);
                }
                Err(error) => {
                    last_error = Some(error);
                    attempt += 1;
                    
                    // Record the error
                    self.record_error(
                        operation_id,
                        "retry_error",
                        &last_error.as_ref().unwrap().to_string(),
                        attempt,
                    ).await;
                    
                    // Check if we should retry
                    if attempt < self.config.max_retry_attempts {
                        let delay = self.calculate_retry_delay(attempt);
                        tokio::time::sleep(Duration::from_millis(delay)).await;
                    }
                }
            }
        }
        
        // All retries failed
        Err(AppError::Internal(format!(
            "Operation {} failed after {} attempts: {}",
            operation_id,
            self.config.max_retry_attempts,
            last_error.unwrap().to_string()
        )))
    }
    
    /// Check circuit breaker state
    pub async fn check_circuit_breaker(&self, service_name: &str) -> AppResult<()> {
        let mut circuit_breakers = self.circuit_breakers.write().await;
        
        if let Some(circuit_breaker) = circuit_breakers.get_mut(service_name) {
            let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() * 1000;
            
            match circuit_breaker.state {
                CircuitBreakerState::Open => {
                    if now - circuit_breaker.last_failure > circuit_breaker.timeout_ms {
                        circuit_breaker.state = CircuitBreakerState::HalfOpen;
                        return Ok(());
                    } else {
                        return Err(AppError::ServiceUnavailable(format!(
                            "Circuit breaker for {} is open",
                            service_name
                        )));
                    }
                }
                CircuitBreakerState::HalfOpen => {
                    // Allow one request to test if service is back
                    return Ok(());
                }
                CircuitBreakerState::Closed => {
                    return Ok(());
                }
            }
        } else {
            // Create new circuit breaker
            circuit_breakers.insert(service_name.to_string(), CircuitBreaker {
                service_name: service_name.to_string(),
                failure_count: 0,
                last_failure: 0,
                state: CircuitBreakerState::Closed,
                threshold: self.config.circuit_breaker_threshold,
                timeout_ms: self.config.circuit_breaker_timeout_ms,
            });
            return Ok(());
        }
    }
    
    /// Record circuit breaker success
    pub async fn record_circuit_breaker_success(&self, service_name: &str) {
        let mut circuit_breakers = self.circuit_breakers.write().await;
        
        if let Some(circuit_breaker) = circuit_breakers.get_mut(service_name) {
            match circuit_breaker.state {
                CircuitBreakerState::HalfOpen => {
                    circuit_breaker.state = CircuitBreakerState::Closed;
                    circuit_breaker.failure_count = 0;
                }
                CircuitBreakerState::Closed => {
                    // Reset failure count on success
                    circuit_breaker.failure_count = 0;
                }
                _ => {}
            }
        }
    }
    
    /// Record circuit breaker failure
    pub async fn record_circuit_breaker_failure(&self, service_name: &str) {
        let mut circuit_breakers = self.circuit_breakers.write().await;
        
        if let Some(circuit_breaker) = circuit_breakers.get_mut(service_name) {
            circuit_breaker.failure_count += 1;
            circuit_breaker.last_failure = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() * 1000;
            
            if circuit_breaker.failure_count >= circuit_breaker.threshold {
                circuit_breaker.state = CircuitBreakerState::Open;
            }
        }
    }
    
    /// Calculate retry delay with exponential backoff
    fn calculate_retry_delay(&self, attempt: u32) -> u64 {
        if self.config.exponential_backoff {
            let delay = self.config.retry_delay_ms * 2_u64.pow(attempt - 1);
            delay.min(self.config.max_backoff_ms)
        } else {
            self.config.retry_delay_ms
        }
    }
    
    /// Clear retry attempt
    async fn clear_retry_attempt(&self, operation_id: &str) {
        let mut retry_attempts = self.retry_attempts.write().await;
        retry_attempts.remove(operation_id);
    }
    
    /// Record error
    async fn record_error(
        &self,
        operation_id: &str,
        error_type: &str,
        error_message: &str,
        retry_count: u32,
    ) {
        let error_record = ErrorRecord {
            id: Uuid::new_v4().to_string(),
            timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            error_type: error_type.to_string(),
            error_message: error_message.to_string(),
            stack_trace: None,
            operation_id: Some(operation_id.to_string()),
            user_id: None,
            request_id: None,
            endpoint: None,
            method: None,
            status_code: None,
            retry_count,
            resolved: false,
            resolution: None,
            metadata: HashMap::new(),
        };

        let mut error_history = self.error_history.write().await;
        error_history.push(error_record);
        
        // Keep only last 10000 errors
        let history_len = error_history.len();
        if history_len > 10000 {
            error_history.drain(0..history_len - 10000);
        }
    }
    
    /// Get error statistics
    pub async fn get_error_statistics(&self) -> HashMap<String, usize> {
        let error_history = self.error_history.read().await;
        let mut stats = HashMap::new();
        
        for error in error_history.iter() {
            *stats.entry(error.error_type.clone()).or_insert(0) += 1;
        }
        
        stats
    }
    
    /// Get circuit breaker status
    pub async fn get_circuit_breaker_status(&self) -> HashMap<String, CircuitBreakerState> {
        let circuit_breakers = self.circuit_breakers.read().await;
        circuit_breakers.iter()
            .map(|(name, cb)| (name.clone(), cb.state.clone()))
            .collect()
    }
}

/// Graceful degradation service
pub struct GracefulDegradationService {
    pub fallback_responses: HashMap<String, String>,
    pub degraded_services: Arc<RwLock<HashMap<String, bool>>>,
}

impl GracefulDegradationService {
    pub fn new(fallback_responses: HashMap<String, String>) -> Self {
        Self {
            fallback_responses,
            degraded_services: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    /// Mark service as degraded
    pub async fn mark_service_degraded(&self, service_name: &str) {
        let mut degraded_services = self.degraded_services.write().await;
        degraded_services.insert(service_name.to_string(), true);
    }
    
    /// Mark service as recovered
    pub async fn mark_service_recovered(&self, service_name: &str) {
        let mut degraded_services = self.degraded_services.write().await;
        degraded_services.insert(service_name.to_string(), false);
    }
    
    /// Check if service is degraded
    pub async fn is_service_degraded(&self, service_name: &str) -> bool {
        let degraded_services = self.degraded_services.read().await;
        degraded_services.get(service_name).copied().unwrap_or(false)
    }
    
    /// Get fallback response
    pub fn get_fallback_response(&self, service_name: &str) -> Option<&String> {
        self.fallback_responses.get(service_name)
    }
    
    /// Get degraded services
    pub async fn get_degraded_services(&self) -> Vec<String> {
        let degraded_services = self.degraded_services.read().await;
        degraded_services.iter()
            .filter(|(_, &degraded)| degraded)
            .map(|(name, _)| name.clone())
            .collect()
    }
}

/// Error context for better error handling
#[derive(Debug, Clone)]
pub struct ErrorContext {
    pub operation_id: String,
    pub user_id: Option<String>,
    pub request_id: Option<String>,
    pub endpoint: Option<String>,
    pub method: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
}

impl ErrorContext {
    pub fn new(operation_id: String) -> Self {
        Self {
            operation_id,
            user_id: None,
            request_id: None,
            endpoint: None,
            method: None,
            metadata: HashMap::new(),
        }
    }
    
    pub fn with_user_id(mut self, user_id: String) -> Self {
        self.user_id = Some(user_id);
        self
    }
    
    pub fn with_request_id(mut self, request_id: String) -> Self {
        self.request_id = Some(request_id);
        self
    }
    
    pub fn with_endpoint(mut self, endpoint: String) -> Self {
        self.endpoint = Some(endpoint);
        self
    }
    
    pub fn with_method(mut self, method: String) -> Self {
        self.method = Some(method);
        self
    }
    
    pub fn with_metadata(mut self, metadata: HashMap<String, serde_json::Value>) -> Self {
        self.metadata = metadata;
        self
    }
}

/// Enhanced error types
#[derive(Error, Debug)]
pub enum EnhancedError {
    #[error("Database connection failed: {0}")]
    DatabaseConnection(String),
    
    #[error("External service unavailable: {0}")]
    ExternalServiceUnavailable(String),
    
    #[error("Rate limit exceeded: {0}")]
    RateLimitExceeded(String),
    
    #[error("Circuit breaker open: {0}")]
    CircuitBreakerOpen(String),
    
    #[error("Graceful degradation active: {0}")]
    GracefulDegradation(String),
    
    #[error("Retry limit exceeded: {0}")]
    RetryLimitExceeded(String),
    
    #[error("Validation failed: {0}")]
    ValidationFailed(String),
    
    #[error("Authentication failed: {0}")]
    AuthenticationFailed(String),
    
    #[error("Authorization failed: {0}")]
    AuthorizationFailed(String),
    
    #[error("Resource not found: {0}")]
    ResourceNotFound(String),
    
    #[error("Internal server error: {0}")]
    InternalServerError(String),
}

impl ResponseError for EnhancedError {
    fn error_response(&self) -> HttpResponse {
        match self {
            EnhancedError::DatabaseConnection(_) => {
                HttpResponse::ServiceUnavailable()
                    .json(serde_json::json!({
                        "error": "Database connection failed",
                        "message": "The database is temporarily unavailable. Please try again later.",
                        "code": "DB_CONNECTION_ERROR"
                    }))
            }
            EnhancedError::ExternalServiceUnavailable(_) => {
                HttpResponse::ServiceUnavailable()
                    .json(serde_json::json!({
                        "error": "External service unavailable",
                        "message": "An external service is temporarily unavailable. Please try again later.",
                        "code": "EXTERNAL_SERVICE_ERROR"
                    }))
            }
            EnhancedError::RateLimitExceeded(_) => {
                HttpResponse::TooManyRequests()
                    .json(serde_json::json!({
                        "error": "Rate limit exceeded",
                        "message": "Too many requests. Please try again later.",
                        "code": "RATE_LIMIT_ERROR"
                    }))
            }
            EnhancedError::CircuitBreakerOpen(_) => {
                HttpResponse::ServiceUnavailable()
                    .json(serde_json::json!({
                        "error": "Service temporarily unavailable",
                        "message": "The service is temporarily unavailable due to high error rate.",
                        "code": "CIRCUIT_BREAKER_OPEN"
                    }))
            }
            EnhancedError::GracefulDegradation(_) => {
                HttpResponse::ServiceUnavailable()
                    .json(serde_json::json!({
                        "error": "Service degraded",
                        "message": "The service is operating in degraded mode.",
                        "code": "GRACEFUL_DEGRADATION"
                    }))
            }
            EnhancedError::RetryLimitExceeded(_) => {
                HttpResponse::InternalServerError()
                    .json(serde_json::json!({
                        "error": "Retry limit exceeded",
                        "message": "The operation failed after multiple retry attempts.",
                        "code": "RETRY_LIMIT_ERROR"
                    }))
            }
            EnhancedError::ValidationFailed(_) => {
                HttpResponse::BadRequest()
                    .json(serde_json::json!({
                        "error": "Validation failed",
                        "message": "The request data is invalid.",
                        "code": "VALIDATION_ERROR"
                    }))
            }
            EnhancedError::AuthenticationFailed(_) => {
                HttpResponse::Unauthorized()
                    .json(serde_json::json!({
                        "error": "Authentication failed",
                        "message": "Invalid credentials provided.",
                        "code": "AUTH_ERROR"
                    }))
            }
            EnhancedError::AuthorizationFailed(_) => {
                HttpResponse::Forbidden()
                    .json(serde_json::json!({
                        "error": "Authorization failed",
                        "message": "You don't have permission to access this resource.",
                        "code": "AUTHZ_ERROR"
                    }))
            }
            EnhancedError::ResourceNotFound(_) => {
                HttpResponse::NotFound()
                    .json(serde_json::json!({
                        "error": "Resource not found",
                        "message": "The requested resource was not found.",
                        "code": "NOT_FOUND_ERROR"
                    }))
            }
            EnhancedError::InternalServerError(_) => {
                HttpResponse::InternalServerError()
                    .json(serde_json::json!({
                        "error": "Internal server error",
                        "message": "An unexpected error occurred. Please try again later.",
                        "code": "INTERNAL_ERROR"
                    }))
            }
        }
    }
}

/// Error recovery utilities
pub mod recovery_utils {
    use super::*;
    
    /// Retry operation with exponential backoff
    pub async fn retry_with_backoff<F, T, E>(
        operation: F,
        max_retries: u32,
        initial_delay_ms: u64,
    ) -> Result<T, E>
    where
        F: Fn() -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<T, E>> + Send>>,
        E: std::fmt::Display + Send + Sync + 'static,
    {
        let mut attempt = 0;
        let mut delay = initial_delay_ms;
        
        while attempt < max_retries {
            match operation().await {
                Ok(result) => return Ok(result),
                Err(error) => {
                    attempt += 1;
                    if attempt < max_retries {
                        tokio::time::sleep(Duration::from_millis(delay)).await;
                        delay *= 2; // Exponential backoff
                    } else {
                        return Err(error);
                    }
                }
            }
        }
        
        unreachable!()
    }
    
    /// Execute operation with timeout
    pub async fn execute_with_timeout<F, T>(
        operation: F,
        timeout_duration: Duration,
    ) -> AppResult<T>
    where
        F: std::future::Future<Output = AppResult<T>>,
    {
        tokio::time::timeout(timeout_duration, operation)
            .await
            .map_err(|_| AppError::Timeout)?
    }
    
    /// Execute operation with circuit breaker
    pub async fn execute_with_circuit_breaker<F, T>(
        service_name: &str,
        operation: F,
        recovery_service: &ErrorRecoveryService,
    ) -> AppResult<T>
    where
        F: std::future::Future<Output = AppResult<T>>,
    {
        // Check circuit breaker
        recovery_service.check_circuit_breaker(service_name).await?;
        
        match operation.await {
            Ok(result) => {
                recovery_service.record_circuit_breaker_success(service_name).await;
                Ok(result)
            }
            Err(error) => {
                recovery_service.record_circuit_breaker_failure(service_name).await;
                Err(error)
            }
        }
    }
}
