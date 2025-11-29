//! Better Auth Configuration
//!
//! Configuration for integrating with Better Auth server

use serde::{Deserialize, Serialize};
use std::env;

/// Better Auth configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BetterAuthConfig {
    /// Better Auth server URL
    pub auth_server_url: String,
    
    /// Enable Better Auth (feature flag)
    pub enabled: bool,
    
    /// Enable dual auth mode (support both legacy JWT and Better Auth)
    pub dual_mode: bool,
    
    /// Token cache TTL in seconds
    pub cache_ttl_seconds: u64,
}

impl BetterAuthConfig {
    /// Create configuration from environment variables
    pub fn from_env() -> Self {
        Self {
            auth_server_url: env::var("BETTER_AUTH_SERVER_URL")
                .unwrap_or_else(|_| "http://localhost:4000".to_string()),
            enabled: env::var("BETTER_AUTH_ENABLED")
                .unwrap_or_else(|_| "false".to_string())
                .parse()
                .unwrap_or(false),
            dual_mode: env::var("BETTER_AUTH_DUAL_MODE")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .unwrap_or(true),
            cache_ttl_seconds: env::var("BETTER_AUTH_CACHE_TTL")
                .unwrap_or_else(|_| "300".to_string())
                .parse()
                .unwrap_or(300),
        }
    }

    /// Check if Better Auth is enabled
    pub fn is_enabled(&self) -> bool {
        self.enabled
    }

    /// Check if dual mode is enabled
    pub fn is_dual_mode(&self) -> bool {
        self.dual_mode
    }
}

impl Default for BetterAuthConfig {
    fn default() -> Self {
        Self {
            auth_server_url: "http://localhost:4000".to_string(),
            enabled: false,
            dual_mode: true,
            cache_ttl_seconds: 300,
        }
    }
}

