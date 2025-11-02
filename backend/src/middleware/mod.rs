//! Middleware module for the Reconciliation Backend
//! 
//! This module contains all middleware components including security,
//! authentication, logging, and performance monitoring.

pub mod security;
pub mod auth;
pub mod logging;
pub mod performance;
pub mod validation;
pub mod cache;

// Add S-Tier middleware
pub mod circuit_breaker;
pub mod advanced_rate_limiter;
pub mod request_validation;
pub mod distributed_tracing;
pub mod request_tracing;

// Re-export commonly used middleware
pub use security::{SecurityHeadersMiddleware, SecurityHeadersConfig, CsrfProtectionMiddleware, RateLimitMiddleware, SecurityConfig, configure_security_middleware};
pub use security::metrics::*;
pub use auth::AuthMiddleware;
pub use logging::{LoggingMiddleware, LoggingConfig};

// Export S-Tier middleware
pub use circuit_breaker::{CircuitBreaker, CircuitBreakerConfig};
pub use advanced_rate_limiter::{AdvancedRateLimiter, RateLimitConfig};
pub use request_validation::{RequestValidator, ValidationConfig};
pub use distributed_tracing::{DistributedTracing, TracingConfig, DistributedTracingMiddleware};
pub use performance::{PerformanceMiddleware, PerformanceMonitoringConfig};
pub use validation::Validation;
pub use cache::Cache;
pub use request_tracing::{RequestIdMiddleware, RequestIdExt};

// Correlation ID middleware
pub mod correlation_id;
pub use correlation_id::{CorrelationIdMiddleware, CorrelationIdExt};
