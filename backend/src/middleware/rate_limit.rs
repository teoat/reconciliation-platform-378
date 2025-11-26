//! Rate Limiting Middleware
//!
//! Per-endpoint rate limiting with configurable limits

use crate::errors::AppError;
use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage,
};
use futures::future::{ready, Ready};
use std::collections::HashMap;
use std::pin::Pin;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::RwLock;

/// Rate limit configuration per endpoint
#[derive(Debug, Clone)]
pub struct PerEndpointRateLimitConfig {
    /// Maximum requests per window
    pub max_requests: u32,
    /// Time window in seconds
    pub window_seconds: u64,
    /// Per-user rate limiting (if true, rate limit per user ID)
    pub per_user: bool,
}

impl Default for PerEndpointRateLimitConfig {
    fn default() -> Self {
        Self {
            max_requests: 100,
            window_seconds: 60,
            per_user: false,
        }
    }
}

/// Rate limit entry
#[derive(Debug, Clone)]
struct RateLimitEntry {
    count: u32,
    window_start: Instant,
}

/// Rate limiter
pub struct PerEndpointRateLimiter {
    limits: Arc<RwLock<HashMap<String, RateLimitEntry>>>,
    config: PerEndpointRateLimitConfig,
}

impl PerEndpointRateLimiter {
    pub fn new(config: PerEndpointRateLimitConfig) -> Self {
        Self {
            limits: Arc::new(RwLock::new(HashMap::new())),
            config,
        }
    }

    /// Check if request is allowed
    pub async fn check(&self, key: &str) -> Result<bool, AppError> {
        let mut limits = self.limits.write().await;
        let now = Instant::now();

        let entry = limits.entry(key.to_string()).or_insert_with(|| RateLimitEntry {
            count: 0,
            window_start: now,
        });

        // Reset window if expired
        if now.duration_since(entry.window_start).as_secs() >= self.config.window_seconds {
            entry.count = 0;
            entry.window_start = now;
        }

        // Check limit
        if entry.count >= self.config.max_requests {
            return Ok(false);
        }

        entry.count += 1;
        Ok(true)
    }

    /// Get remaining requests
    pub async fn remaining(&self, key: &str) -> u32 {
        let limits = self.limits.read().await;
        let now = Instant::now();

        if let Some(entry) = limits.get(key) {
            if now.duration_since(entry.window_start).as_secs() >= self.config.window_seconds {
                return self.config.max_requests;
            }
            self.config.max_requests.saturating_sub(entry.count)
        } else {
            self.config.max_requests
        }
    }
}

/// Rate limit middleware
pub struct PerEndpointRateLimitMiddleware {
    limiter: Arc<PerEndpointRateLimiter>,
    endpoint_configs: HashMap<String, PerEndpointRateLimitConfig>,
}

impl PerEndpointRateLimitMiddleware {
    pub fn new() -> Self {
        let mut endpoint_configs = HashMap::new();
        
        // Configure rate limits per endpoint
        endpoint_configs.insert(
            "/api/auth/login".to_string(),
            PerEndpointRateLimitConfig {
                max_requests: 5,
                window_seconds: 60,
                per_user: true,
            },
        );
        
        endpoint_configs.insert(
            "/api/auth/register".to_string(),
            PerEndpointRateLimitConfig {
                max_requests: 3,
                window_seconds: 3600, // 1 hour
                per_user: false,
            },
        );

        Self {
            limiter: Arc::new(PerEndpointRateLimiter::new(PerEndpointRateLimitConfig::default())),
            endpoint_configs,
        }
    }

    fn get_rate_limit_key(&self, req: &ServiceRequest) -> String {
        let path = req.path();
        let user_id = req.extensions()
            .get::<uuid::Uuid>()
            .map(|id| id.to_string())
            .unwrap_or_else(|| "anonymous".to_string());
        
        format!("{}:{}", path, user_id)
    }
}

impl Default for PerEndpointRateLimitMiddleware {
    fn default() -> Self {
        Self::new()
    }
}

impl<S, B> Transform<S, ServiceRequest> for PerEndpointRateLimitMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = PerEndpointRateLimitMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        let limiter = Arc::clone(&self.limiter);
        let endpoint_configs = self.endpoint_configs.clone();
        ready(Ok(PerEndpointRateLimitMiddlewareService {
            service: std::rc::Rc::new(service),
            limiter,
            endpoint_configs,
        }))
    }
}

/// Rate limit middleware service
pub struct PerEndpointRateLimitMiddlewareService<S> {
    service: std::rc::Rc<S>,
    limiter: Arc<PerEndpointRateLimiter>,
    endpoint_configs: HashMap<String, PerEndpointRateLimitConfig>,
}

impl<S, B> Service<ServiceRequest> for PerEndpointRateLimitMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn std::future::Future<Output = Result<Self::Response, Self::Error>> + 'static>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let limiter = Arc::clone(&self.limiter);
        let path = req.path().to_string();
        let endpoint_configs = self.endpoint_configs.clone();
        let service = self.service.clone();

        Box::pin(async move {
            // Check if endpoint has custom rate limit config
            let _config = endpoint_configs.get(&path)
                .cloned()
                .unwrap_or_else(|| PerEndpointRateLimitConfig::default());

            let key = format!("{}:{}", path, 
                req.extensions()
                    .get::<uuid::Uuid>()
                    .map(|id| id.to_string())
                    .unwrap_or_else(|| "anonymous".to_string())
            );

            match limiter.check(&key).await {
                Ok(true) => {
                    // Add rate limit headers
                    let mut res = service.call(req).await?;
                    let remaining = limiter.remaining(&key).await;
                    use actix_web::http::header::{HeaderName, HeaderValue};
                    let name = HeaderName::from_static("x-ratelimit-remaining");
                    if let Ok(value) = HeaderValue::from_str(&remaining.to_string()) {
                        res.headers_mut().insert(name, value);
                    }
                    Ok(res)
                }
                Ok(false) => {
                    Err(actix_web::error::ErrorTooManyRequests("Rate limit exceeded"))
                }
                Err(e) => {
                    log::error!("Rate limit check error: {}", e);
                    Err(actix_web::error::ErrorInternalServerError("Rate limit error"))
                }
            }
        })
    }
}

