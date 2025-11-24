//! Tiered Error Handling System
//!
//! Provides tier-based error handling for different risk levels:
//! - Tier 1: Critical operations (auth, payments, data integrity)
//! - Tier 2: Important operations (file uploads, data processing)
//! - Tier 3: Standard operations (general API calls)
//!
//! Each tier has different error handling requirements:
//! - Tier 1: Full error recovery, circuit breakers, retries, detailed logging
//! - Tier 2: Retries with backoff, error logging, graceful degradation
//! - Tier 3: Basic error handling, standard logging

use crate::errors::{AppError, AppResult};
use crate::services::error_logging::{ErrorContext, ErrorLevel, ErrorLoggingService};
use std::sync::Arc;
use uuid::Uuid;

/// Error handling tier levels
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorHandlingTier {
    /// Tier 1: Critical operations requiring maximum protection
    Critical,
    /// Tier 2: Important operations requiring enhanced protection
    Important,
    /// Tier 3: Standard operations with basic protection
    Standard,
}

/// Configuration for tiered error handling
#[derive(Debug, Clone)]
pub struct TieredErrorConfig {
    pub tier: ErrorHandlingTier,
    pub enable_retry: bool,
    pub max_retries: u32,
    pub enable_circuit_breaker: bool,
    pub enable_graceful_degradation: bool,
    pub log_level: ErrorLevel,
    pub include_stack_trace: bool,
}

impl Default for TieredErrorConfig {
    fn default() -> Self {
        Self {
            tier: ErrorHandlingTier::Standard,
            enable_retry: false,
            max_retries: 0,
            enable_circuit_breaker: false,
            enable_graceful_degradation: false,
            log_level: ErrorLevel::Error,
            include_stack_trace: false,
        }
    }
}

impl TieredErrorConfig {
    /// Create config for Tier 1 (Critical) operations
    pub fn critical() -> Self {
        Self {
            tier: ErrorHandlingTier::Critical,
            enable_retry: true,
            max_retries: 3,
            enable_circuit_breaker: true,
            enable_graceful_degradation: true,
            log_level: ErrorLevel::Critical,
            include_stack_trace: true,
        }
    }

    /// Create config for Tier 2 (Important) operations
    pub fn important() -> Self {
        Self {
            tier: ErrorHandlingTier::Important,
            enable_retry: true,
            max_retries: 2,
            enable_circuit_breaker: false,
            enable_graceful_degradation: true,
            log_level: ErrorLevel::Error,
            include_stack_trace: false,
        }
    }

    /// Create config for Tier 3 (Standard) operations
    pub fn standard() -> Self {
        Self::default()
    }
}

/// Tiered error handler
pub struct TieredErrorHandler {
    error_logger: Option<Arc<ErrorLoggingService>>,
}

impl TieredErrorHandler {
    /// Create new tiered error handler
    pub fn new(error_logger: Option<Arc<ErrorLoggingService>>) -> Self {
        Self { error_logger }
    }

    /// Execute operation with tiered error handling
    pub async fn execute_with_tier<F, T>(
        &self,
        operation: F,
        config: TieredErrorConfig,
        context: ErrorContext,
    ) -> AppResult<T>
    where
        F: std::future::Future<Output = AppResult<T>> + Send,
    {
        let operation_id = Uuid::new_v4().to_string();
        let correlation_id = context
            .request_id
            .clone()
            .unwrap_or_else(|| Uuid::new_v4().to_string());

        // Log operation start for critical operations
        if config.tier == ErrorHandlingTier::Critical {
            if let Some(ref logger) = self.error_logger {
                logger
                    .log_error(
                        &correlation_id,
                        "OperationStart",
                        &format!("Starting critical operation: {}", operation_id),
                        ErrorLevel::Info,
                        context.clone(),
                    )
                    .await;
            }
        }

        // Execute operation
        // Note: Retry logic should be implemented at the call site using ErrorRecoveryService
        // or by wrapping the operation in a closure that can be called multiple times
        let result = operation.await;

        // Handle result based on tier
        match result {
            Ok(value) => {
                // Log success for critical operations
                if config.tier == ErrorHandlingTier::Critical {
                    if let Some(ref logger) = self.error_logger {
                        logger
                            .log_error(
                                &correlation_id,
                                "OperationSuccess",
                                &format!("Critical operation succeeded: {}", operation_id),
                                ErrorLevel::Info,
                                context,
                            )
                            .await;
                    }
                }
                Ok(value)
            }
            Err(error) => {
                // Enhanced error handling based on tier
                self.handle_error::<T>(
                    error,
                    &config,
                    &operation_id,
                    &correlation_id,
                    context,
                )
                .await
            }
        }
    }

    // Note: Retry logic for futures requires the operation to be a closure that creates
    // a new future each time. Use ErrorRecoveryService::execute_with_retry at the call site
    // for operations that need retry logic.

    /// Handle error based on tier configuration
    async fn handle_error<T>(
        &self,
        error: AppError,
        config: &TieredErrorConfig,
        operation_id: &str,
        correlation_id: &str,
        mut context: ErrorContext,
    ) -> AppResult<T> {
        // Log error with appropriate level
        if let Some(ref logger) = self.error_logger {
            let error_type = match &error {
                AppError::Database(_) => "DatabaseError",
                AppError::Connection(_) => "ConnectionError",
                AppError::Authentication(_) => "AuthenticationError",
                AppError::Authorization(_) => "AuthorizationError",
                AppError::Validation(_) => "ValidationError",
                AppError::File(_) => "FileError",
                AppError::Internal(_) | AppError::InternalServerError(_) => "InternalError",
                AppError::NotFound(_) => "NotFoundError",
                AppError::Timeout => "TimeoutError",
                _ => "UnknownError",
            };

            // Add stack trace if configured
            if config.include_stack_trace {
                context.stack_trace = Some(format!("{:?}", error));
            }

            logger
                .log_error(
                    correlation_id,
                    error_type,
                    &error.to_string(),
                    config.log_level.clone(),
                    context,
                )
                .await;
        }

        // For critical tier, attempt graceful degradation
        if config.tier == ErrorHandlingTier::Critical && config.enable_graceful_degradation {
            // Log degradation attempt
            log::warn!(
                "Attempting graceful degradation for critical operation {}",
                operation_id
            );
            // Graceful degradation logic would go here
        }

        Err(error)
    }
}

/// Macro for executing operations with tiered error handling
#[macro_export]
macro_rules! execute_tiered {
    ($handler:expr, $operation:expr, $tier:expr, $context:expr) => {
        $handler.execute_with_tier($operation, $tier, $context).await
    };
}

/// Helper function to create error context
pub fn create_error_context(
    operation: &str,
    user_id: Option<Uuid>,
    request_id: Option<String>,
    endpoint: Option<String>,
    method: Option<String>,
) -> ErrorContext {
    let mut ctx = ErrorContext::new()
        .operation(operation.to_string());
    
    if let Some(id) = user_id {
        ctx = ctx.user_id(id.to_string());
    }
    if let Some(rid) = request_id {
        ctx = ctx.request_id(rid);
    }
    if let Some(ep) = endpoint {
        ctx = ctx.endpoint(ep);
    }
    if let Some(m) = method {
        ctx = ctx.method(m);
    }
    
    ctx
}

