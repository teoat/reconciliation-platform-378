//! Password reset rate limiting
//!
//! Prevents brute force attacks on password reset tokens by limiting
//! the number of attempts per token and IP address.

use crate::errors::{AppError, AppResult};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

/// Rate limit configuration
#[derive(Debug, Clone)]
pub struct PasswordResetRateLimitConfig {
    /// Maximum attempts per token (default: 5)
    pub max_attempts_per_token: u32,
    
    /// Maximum attempts per IP address (default: 10)
    pub max_attempts_per_ip: u32,
    
    /// Lockout duration in seconds (default: 900 = 15 minutes)
    pub lockout_duration_secs: u64,
    
    /// Time window for rate limiting in seconds (default: 3600 = 1 hour)
    pub time_window_secs: u64,
}

impl Default for PasswordResetRateLimitConfig {
    #[allow(clippy::default_trait_access)]
    fn default() -> Self {
        Self {
            max_attempts_per_token: 5,
            max_attempts_per_ip: 10,
            lockout_duration_secs: 900, // 15 minutes
            time_window_secs: 3600,     // 1 hour
        }
    }
}

/// Attempt tracking entry
#[derive(Debug, Clone)]
struct AttemptEntry {
    count: u32,
    first_attempt: Instant,
    last_attempt: Instant,
    locked_until: Option<Instant>,
}

/// Password reset rate limiter
pub struct PasswordResetRateLimiter {
    config: PasswordResetRateLimitConfig,
    token_attempts: Arc<Mutex<HashMap<String, AttemptEntry>>>,
    ip_attempts: Arc<Mutex<HashMap<String, AttemptEntry>>>,
}

impl PasswordResetRateLimiter {
    /// Create a new rate limiter
    pub fn new(config: PasswordResetRateLimitConfig) -> Self {
        Self {
            config,
            token_attempts: Arc::new(Mutex::new(HashMap::new())),
            ip_attempts: Arc::new(Mutex::new(HashMap::new())),
        }
    }
    
    /// Create with default configuration
    #[allow(clippy::default_trait_access)]
    pub fn with_default_config() -> Self {
        Self::new(PasswordResetRateLimitConfig::default())
    }
    
    /// Check if a token attempt is allowed
    /// Returns Ok(()) if allowed, Err if rate limited
    pub fn check_token_attempt(&self, token_hash: &str) -> AppResult<()> {
        let mut attempts = self.token_attempts.lock()
            .map_err(|e| AppError::Internal(format!("Failed to acquire lock: {}", e)))?;
        
        let now = Instant::now();
        let entry = attempts.entry(token_hash.to_string()).or_insert_with(|| {
            AttemptEntry {
                count: 0,
                first_attempt: now,
                last_attempt: now,
                locked_until: None,
            }
        });
        
        // Check if locked
        if let Some(locked_until) = entry.locked_until {
            if now < locked_until {
                let remaining = (locked_until - now).as_secs();
                return Err(AppError::Authentication(format!(
                    "Too many attempts. Please try again in {} seconds.",
                    remaining
                )));
            } else {
                // Lock expired, reset
                entry.locked_until = None;
                entry.count = 0;
                entry.first_attempt = now;
            }
        }
        
        // Check if within time window
        if (now - entry.first_attempt).as_secs() > self.config.time_window_secs {
            // Time window expired, reset
            entry.count = 0;
            entry.first_attempt = now;
        }
        
        // Check if exceeded max attempts
        if entry.count >= self.config.max_attempts_per_token {
            // Lock the token
            entry.locked_until = Some(now + Duration::from_secs(self.config.lockout_duration_secs));
            return Err(AppError::Authentication(
                "Too many attempts for this reset token. Please request a new password reset link.".to_string()
            ));
        }
        
        // Increment attempt count
        entry.count += 1;
        entry.last_attempt = now;
        
        Ok(())
    }
    
    /// Check if an IP attempt is allowed
    /// Returns Ok(()) if allowed, Err if rate limited
    pub fn check_ip_attempt(&self, ip: &str) -> AppResult<()> {
        let mut attempts = self.ip_attempts.lock()
            .map_err(|e| AppError::Internal(format!("Failed to acquire lock: {}", e)))?;
        
        let now = Instant::now();
        let entry = attempts.entry(ip.to_string()).or_insert_with(|| {
            AttemptEntry {
                count: 0,
                first_attempt: now,
                last_attempt: now,
                locked_until: None,
            }
        });
        
        // Check if locked
        if let Some(locked_until) = entry.locked_until {
            if now < locked_until {
                let remaining = (locked_until - now).as_secs();
                return Err(AppError::Authentication(format!(
                    "Too many password reset attempts from this IP. Please try again in {} seconds.",
                    remaining
                )));
            } else {
                // Lock expired, reset
                entry.locked_until = None;
                entry.count = 0;
                entry.first_attempt = now;
            }
        }
        
        // Check if within time window
        if (now - entry.first_attempt).as_secs() > self.config.time_window_secs {
            // Time window expired, reset
            entry.count = 0;
            entry.first_attempt = now;
        }
        
        // Check if exceeded max attempts
        if entry.count >= self.config.max_attempts_per_ip {
            // Lock the IP
            entry.locked_until = Some(now + Duration::from_secs(self.config.lockout_duration_secs));
            return Err(AppError::Authentication(
                "Too many password reset attempts from this IP. Please try again later.".to_string()
            ));
        }
        
        // Increment attempt count
        entry.count += 1;
        entry.last_attempt = now;
        
        Ok(())
    }
    
    /// Record a successful password reset (clears attempts for token)
    pub fn record_success(&self, token_hash: &str) {
        if let Ok(mut attempts) = self.token_attempts.lock() {
            attempts.remove(token_hash);
        }
    }
    
    /// Clean up old entries (should be called periodically)
    pub fn cleanup(&self) {
        let now = Instant::now();
        let window = Duration::from_secs(self.config.time_window_secs);
        
        // Clean token attempts
        if let Ok(mut attempts) = self.token_attempts.lock() {
            attempts.retain(|_, entry| {
                // Keep if locked or within time window
                entry.locked_until.is_some() || 
                (now - entry.first_attempt) < window
            });
        }
        
        // Clean IP attempts
        if let Ok(mut attempts) = self.ip_attempts.lock() {
            attempts.retain(|_, entry| {
                // Keep if locked or within time window
                entry.locked_until.is_some() || 
                (now - entry.first_attempt) < window
            });
        }
    }
}

