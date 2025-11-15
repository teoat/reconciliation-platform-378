//! Security middleware module
//! 
//! Provides security headers, CSRF protection, and rate limiting

pub mod headers;
pub mod csrf;
pub mod rate_limit;
pub mod metrics;

// Re-exports
pub use headers::{SecurityHeadersMiddleware, SecurityHeadersConfig, CspNonce};
pub use csrf::CsrfProtectionMiddleware;
pub use rate_limit::RateLimitMiddleware;
pub use metrics::*;

// Configuration
#[derive(Clone)]
pub struct SecurityConfig {
    pub csrf_secret: String,
    pub rate_limit_requests: u32,
    pub rate_limit_window: u64,
}

impl Default for SecurityConfig {
    fn default() -> Self {
        Self {
            csrf_secret: "change-this-csrf-secret-in-production".to_string(),
            rate_limit_requests: 100,
            rate_limit_window: 3600, // 1 hour
        }
    }
}

pub fn configure_security_middleware(cfg: &mut actix_web::web::ServiceConfig, _config: SecurityConfig) {
    // Note: ServiceConfig cannot apply wrap globally; keep for compatibility.
    let _ = cfg;
}

