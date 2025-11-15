//! Security metrics tracking

use std::sync::atomic::{AtomicU64, Ordering};

pub static RATE_LIMIT_BLOCKS: AtomicU64 = AtomicU64::new(0);
pub static CSRF_FAILURES: AtomicU64 = AtomicU64::new(0);
pub static AUTH_DENIED: AtomicU64 = AtomicU64::new(0);
pub static UNAUTHORIZED_ACCESS_ATTEMPTS: AtomicU64 = AtomicU64::new(0);

pub fn get_rate_limit_blocks() -> u64 { 
    RATE_LIMIT_BLOCKS.load(Ordering::Relaxed) 
}

pub fn get_csrf_failures() -> u64 { 
    CSRF_FAILURES.load(Ordering::Relaxed) 
}

pub fn get_auth_denied() -> u64 { 
    AUTH_DENIED.load(Ordering::Relaxed) 
}

pub fn get_unauthorized_access_attempts() -> u64 { 
    UNAUTHORIZED_ACCESS_ATTEMPTS.load(Ordering::Relaxed) 
}

pub fn get_all_security_metrics() -> String {
    format!(
        "# HELP rate_limit_blocks_total Number of requests blocked by rate limiter\n\
         # TYPE rate_limit_blocks_total counter\n\
         rate_limit_blocks_total {}\n\n\
         # HELP csrf_failures_total Number of CSRF validation failures\n\
         # TYPE csrf_failures_total counter\n\
         csrf_failures_total {}\n\n\
         # HELP auth_denied_total Number of authentication denials\n\
         # TYPE auth_denied_total counter\n\
         auth_denied_total {}\n\n\
         # HELP unauthorized_access_attempts_total Number of unauthorized access attempts\n\
         # TYPE unauthorized_access_attempts_total counter\n\
         unauthorized_access_attempts_total {}\n",
        RATE_LIMIT_BLOCKS.load(Ordering::Relaxed),
        CSRF_FAILURES.load(Ordering::Relaxed),
        AUTH_DENIED.load(Ordering::Relaxed),
        UNAUTHORIZED_ACCESS_ATTEMPTS.load(Ordering::Relaxed),
    )
}

