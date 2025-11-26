//! Password configuration and policy
//!
//! Centralized configuration for password-related settings.
//! This replaces magic numbers scattered throughout the codebase.

use serde::{Deserialize, Serialize};

/// Password configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordConfig {
    /// Password expiration in days (default: 90)
    pub expiration_days: u32,
    
    /// Initial password expiration in days (default: 7)
    pub initial_expiration_days: u32,
    
    /// Number of previous passwords to keep in history (default: 5)
    pub history_limit: usize,
    
    /// Bcrypt cost factor (default: 12)
    pub bcrypt_cost: u32,
    
    /// Days before expiration to show warning (default: 7)
    pub warning_days_before_expiry: u32,
    
    /// Minimum password length (default: 8)
    pub min_length: usize,
    
    /// Maximum password length (default: 128)
    pub max_length: usize,
    
    /// Require uppercase letter (default: true)
    pub require_uppercase: bool,
    
    /// Require lowercase letter (default: true)
    pub require_lowercase: bool,
    
    /// Require number (default: true)
    pub require_number: bool,
    
    /// Require special character (default: true)
    pub require_special: bool,
    
    /// Maximum sequential characters allowed (default: 3)
    pub max_sequential_chars: usize,
}

impl Default for PasswordConfig {
    fn default() -> Self {
        Self {
            expiration_days: 90,
            initial_expiration_days: 7,
            history_limit: 5,
            bcrypt_cost: 12,
            warning_days_before_expiry: 7,
            min_length: 8,
            max_length: 128,
            require_uppercase: true,
            require_lowercase: true,
            require_number: true,
            require_special: true,
            max_sequential_chars: 3,
        }
    }
}

impl PasswordConfig {
    /// Create config from environment variables
    pub fn from_env() -> Self {
        let mut config = Self::default();
        
        // Allow override via environment variables
        if let Ok(val) = std::env::var("PASSWORD_EXPIRATION_DAYS") {
            if let Ok(days) = val.parse::<u32>() {
                config.expiration_days = days;
            }
        }
        
        if let Ok(val) = std::env::var("PASSWORD_INITIAL_EXPIRATION_DAYS") {
            if let Ok(days) = val.parse::<u32>() {
                config.initial_expiration_days = days;
            }
        }
        
        if let Ok(val) = std::env::var("PASSWORD_HISTORY_LIMIT") {
            if let Ok(limit) = val.parse::<usize>() {
                config.history_limit = limit;
            }
        }
        
        if let Ok(val) = std::env::var("BCRYPT_COST") {
            if let Ok(cost) = val.parse::<u32>() {
                config.bcrypt_cost = cost;
            }
        }
        
        if let Ok(val) = std::env::var("PASSWORD_WARNING_DAYS") {
            if let Ok(days) = val.parse::<u32>() {
                config.warning_days_before_expiry = days;
            }
        }
        
        config
    }
    
    /// Get password expiration duration
    pub fn expiration_duration(&self) -> chrono::Duration {
        chrono::Duration::days(self.expiration_days as i64)
    }
    
    /// Get initial password expiration duration
    pub fn initial_expiration_duration(&self) -> chrono::Duration {
        chrono::Duration::days(self.initial_expiration_days as i64)
    }
    
    /// Get warning threshold duration
    pub fn warning_threshold_duration(&self) -> chrono::Duration {
        chrono::Duration::days(self.warning_days_before_expiry as i64)
    }
}

/// Password strength levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PasswordStrength {
    Weak,
    Fair,
    Good,
    Strong,
}

impl PasswordStrength {
    pub fn as_str(&self) -> &'static str {
        match self {
            PasswordStrength::Weak => "weak",
            PasswordStrength::Fair => "fair",
            PasswordStrength::Good => "good",
            PasswordStrength::Strong => "strong",
        }
    }
}


