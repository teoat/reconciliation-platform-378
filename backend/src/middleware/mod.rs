//! Middleware module for the Reconciliation Backend
//!
//! This module contains all middleware components including security,
//! authentication, logging, and performance monitoring.

pub mod auth;
pub mod cache;
pub mod logging;
pub mod performance;
pub mod security;
pub mod validation;

// Add S-Tier middleware
pub mod advanced_rate_limiter;
pub mod circuit_breaker;
pub mod distributed_tracing;
pub mod request_tracing;
pub mod request_validation;

// Re-export commonly used middleware
pub use auth::AuthMiddleware;
pub use logging::{LoggingConfig, LoggingMiddleware};
pub use security::metrics::*;
pub use security::{
    configure_security_middleware, CsrfProtectionMiddleware, RateLimitMiddleware, SecurityConfig,
    SecurityHeadersConfig, SecurityHeadersMiddleware,
};

// Export S-Tier middleware
pub use advanced_rate_limiter::{AdvancedRateLimiter, RateLimitConfig};
pub use cache::Cache;
pub use circuit_breaker::{CircuitBreaker, CircuitBreakerConfig};
pub use distributed_tracing::{DistributedTracing, DistributedTracingMiddleware, TracingConfig};
pub use performance::{PerformanceMiddleware, PerformanceMonitoringConfig};
pub use request_tracing::{RequestIdExt, RequestIdMiddleware};
pub use request_validation::{RequestValidator, ValidationConfig};
pub use validation::Validation;

// Correlation ID middleware
pub mod correlation_id;
pub use correlation_id::{CorrelationIdExt, CorrelationIdMiddleware};

// Error handler middleware
pub mod error_handler;
pub use error_handler::{
    add_correlation_id_to_response, create_error_response_with_correlation_id,
    extract_correlation_id_from_request, ErrorHandlerMiddleware,
};
