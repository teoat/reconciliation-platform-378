//! Advanced Rate Limiting Middleware
//!
//! Distributed Redis-backed rate limiting with per-user, per-IP, and per-endpoint limits

use crate::errors::{AppError, AppResult};
use redis::Client as RedisClient;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant, SystemTime};
use tokio::sync::RwLock;

/// Rate limit configuration
#[derive(Debug, Clone)]
pub struct RateLimitConfig {
    /// Requests per minute
    pub requests_per_minute: u32,

    /// Burst size (initial burst allowed)
    pub burst_size: u32,

    /// Window size for rate limiting
    pub window_size: Duration,

    /// Enable distributed limiting via Redis
    pub enable_distributed: bool,
}

impl Default for RateLimitConfig {
    fn default() -> Self {
        Self {
            requests_per_minute: 60,
            burst_size: 10,
            window_size: Duration::from_secs(60),
            enable_distributed: true,
        }
    }
}

/// Rate limit result
#[derive(Debug, Clone)]
pub struct RateLimitResult {
    pub allowed: bool,
    pub remaining: u32,
    pub reset_at: Instant,
}

/// Rate limit key types
#[derive(Debug, Clone, Hash, PartialEq, Eq)]
pub enum RateLimitKey {
    IpAddress(String),
    UserId(String),
    ApiKey(String),
    Endpoint(String),
    Custom(String),
}

impl std::fmt::Display for RateLimitKey {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            Self::IpAddress(ip) => format!("ip:{}", ip),
            Self::UserId(uid) => format!("user:{}", uid),
            Self::ApiKey(key) => format!("apikey:{}", key),
            Self::Endpoint(endpoint) => format!("endpoint:{}", endpoint),
            Self::Custom(key) => format!("custom:{}", key),
        };
        write!(f, "{}", s)
    }
}

/// Advanced rate limiter with distributed support
pub struct AdvancedRateLimiter {
    config: RateLimitConfig,
    redis_client: Option<Arc<RedisClient>>,
    local_cache: Arc<RwLock<HashMap<String, (u32, Instant)>>>,
}

impl AdvancedRateLimiter {
    /// Create a new rate limiter
    pub fn new(config: RateLimitConfig, redis_client: Option<Arc<RedisClient>>) -> Self {
        Self {
            config,
            redis_client,
            local_cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Check if request is allowed
    pub async fn is_allowed(&self, key: &RateLimitKey) -> AppResult<RateLimitResult> {
        let key_str = key.to_string();

        if self.config.enable_distributed {
            self.check_redis_rate_limit(&key_str).await
        } else {
            self.check_local_rate_limit(&key_str).await
        }
    }

    /// Check rate limit via Redis (distributed)
    async fn check_redis_rate_limit(&self, key: &str) -> AppResult<RateLimitResult> {
        if let Some(client) = &self.redis_client {
            let mut conn = client
                .get_multiplexed_async_connection()
                .await
                .map_err(|e| AppError::Internal(format!("Redis connection failed: {}", e)))?;

            let window = self.config.window_size.as_secs() as usize;
            let now = SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap_or_else(|_| {
                    log::error!("System time is before Unix epoch");
                    std::time::Duration::ZERO
                })
                .as_micros();

            let redis_key = format!("ratelimit:{}", key);

            let (count,): (i32,) = redis::pipe()
                .atomic()
                .zrembyscore(&redis_key, 0, (now - (window as u128 * 1_000_000)) as i64)
                .zadd(&redis_key, now as i64, now as i64)
                .expire(&redis_key, window as i64)
                .zcard(&redis_key)
                .query_async(&mut conn)
                .await
                .map_err(|e| AppError::Internal(format!("Redis pipeline failed: {}", e)))?;

            let remaining = self.config.requests_per_minute.saturating_sub(count as u32);
            let allowed = count as u32 <= self.config.requests_per_minute;

            Ok(RateLimitResult {
                allowed,
                remaining,
                reset_at: Instant::now() + self.config.window_size,
            })
        } else {
            // Fallback to local
            self.check_local_rate_limit(key).await
        }
    }

    /// Check rate limit locally
    async fn check_local_rate_limit(&self, key: &str) -> AppResult<RateLimitResult> {
        let mut cache = self.local_cache.write().await;
        let now = Instant::now();

        if let Some((count, reset_at)) = cache.get_mut(key) {
            if now > *reset_at {
                // Reset window
                *count = 1;
                *reset_at = now + self.config.window_size;
                Ok(RateLimitResult {
                    allowed: true,
                    remaining: self.config.requests_per_minute - 1,
                    reset_at: *reset_at,
                })
            } else if *count >= self.config.requests_per_minute {
                // Rate limit exceeded
                Ok(RateLimitResult {
                    allowed: false,
                    remaining: 0,
                    reset_at: *reset_at,
                })
            } else {
                *count += 1;
                Ok(RateLimitResult {
                    allowed: true,
                    remaining: self.config.requests_per_minute - *count,
                    reset_at: *reset_at,
                })
            }
        } else {
            // First request
            cache.insert(key.to_string(), (1, now + self.config.window_size));
            Ok(RateLimitResult {
                allowed: true,
                remaining: self.config.requests_per_minute - 1,
                reset_at: now + self.config.window_size,
            })
        }
    }

    /// Reset rate limit for a key
    pub async fn reset(&self, key: &RateLimitKey) -> AppResult<()> {
        let key_str = key.to_string();

        if let Some(client) = &self.redis_client {
            let mut conn = client
                .get_multiplexed_async_connection()
                .await
                .map_err(|e| AppError::Internal(format!("Redis connection failed: {}", e)))?;

            let redis_key = format!("ratelimit:{}", key_str);
            redis::cmd("DEL")
                .arg(&redis_key)
                .query_async::<_, ()>(&mut conn)
                .await
                .map_err(|e| AppError::Internal(format!("Redis DEL failed: {}", e)))?;
        }

        let mut cache = self.local_cache.write().await;
        cache.remove(&key_str);

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_local_rate_limit() {
        let config = RateLimitConfig {
            requests_per_minute: 5,
            ..Default::default()
        };

        let limiter = AdvancedRateLimiter::new(config, None);
        let key = RateLimitKey::IpAddress("127.0.0.1".to_string());

        // First 5 requests should be allowed
        for _ in 0..5 {
            let result = limiter.is_allowed(&key).await.unwrap();
            assert!(result.allowed);
        }

        // 6th request should be rejected
        let result = limiter.is_allowed(&key).await.unwrap();
        assert!(!result.allowed);
    }

    #[tokio::test]
    async fn test_rate_limit_reset() {
        let limiter = AdvancedRateLimiter::new(RateLimitConfig::default(), None);
        let key = RateLimitKey::UserId("user123".to_string());

        // Exceed limit
        for _ in 0..65 {
            limiter.is_allowed(&key).await.unwrap();
        }

        // Reset
        limiter.reset(&key).await.unwrap();

        // Should be allowed again
        let result = limiter.is_allowed(&key).await.unwrap();
        assert!(result.allowed);
    }
}
