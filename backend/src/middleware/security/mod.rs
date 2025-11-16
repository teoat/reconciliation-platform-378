//! Security middleware module
//!
//! Provides security headers, CSRF protection, and rate limiting

pub mod csrf;
pub mod headers;
pub mod metrics;
pub mod rate_limit;

// Re-exports
pub use csrf::CsrfProtectionMiddleware;
pub use headers::{CspNonce, SecurityHeadersConfig, SecurityHeadersMiddleware};
pub use metrics::*;
pub use rate_limit::RateLimitMiddleware;

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

pub fn configure_security_middleware(
    cfg: &mut actix_web::web::ServiceConfig,
    _config: SecurityConfig,
) {
    // Note: ServiceConfig cannot apply wrap globally; keep for compatibility.
    let _ = cfg;
}
