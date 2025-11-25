//! Authentication-specific rate limiting middleware
//!
//! Provides stricter rate limiting for authentication endpoints with different limits
//! per endpoint type (login, register, password reset, etc.)

use actix_service::{Service, Transform};
use actix_web::{
    body::BoxBody,
    dev::{ServiceRequest, ServiceResponse},
    Error, HttpMessage,
};
use futures_util::future::{ok, Ready};
use std::collections::{HashMap, VecDeque};
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;
use std::sync::{Arc, Mutex};
use std::task::{Context, Poll};
use std::time::Instant;

use super::metrics::RATE_LIMIT_BLOCKS;

/// Rate limit configuration for different auth endpoints
#[derive(Debug, Clone)]
pub struct AuthRateLimitConfig {
    /// Login endpoint: 5 attempts per 15 minutes
    pub login_max_requests: u32,
    pub login_window_seconds: u64,
    
    /// Register endpoint: 3 attempts per hour
    pub register_max_requests: u32,
    pub register_window_seconds: u64,
    
    /// Password reset endpoint: 3 attempts per hour
    pub password_reset_max_requests: u32,
    pub password_reset_window_seconds: u64,
    
    /// Refresh token endpoint: 10 requests per minute
    pub refresh_max_requests: u32,
    pub refresh_window_seconds: u64,
    
    /// Other auth endpoints: 10 requests per minute
    pub default_max_requests: u32,
    pub default_window_seconds: u64,
}

impl Default for AuthRateLimitConfig {
    fn default() -> Self {
        Self {
            // Login: 5 attempts per 15 minutes (900 seconds)
            login_max_requests: 5,
            login_window_seconds: 900,
            
            // Register: 3 attempts per hour (3600 seconds)
            register_max_requests: 3,
            register_window_seconds: 3600,
            
            // Password reset: 3 attempts per hour (3600 seconds)
            password_reset_max_requests: 3,
            password_reset_window_seconds: 3600,
            
            // Refresh token: 10 requests per minute (60 seconds)
            refresh_max_requests: 10,
            refresh_window_seconds: 60,
            
            // Default: 10 requests per minute (60 seconds)
            default_max_requests: 10,
            default_window_seconds: 60,
        }
    }
}

/// Authentication rate limiting middleware
pub struct AuthRateLimitMiddleware {
    config: AuthRateLimitConfig,
}

impl AuthRateLimitMiddleware {
    pub fn new(config: AuthRateLimitConfig) -> Self {
        Self { config }
    }
}

impl Default for AuthRateLimitMiddleware {
    fn default() -> Self {
        Self::new(AuthRateLimitConfig::default())
    }
}

impl<S, B> Transform<S, ServiceRequest> for AuthRateLimitMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: actix_web::body::MessageBody + 'static,
    <B as actix_web::body::MessageBody>::Error: std::fmt::Debug,
{
    type Response = ServiceResponse<BoxBody>;
    type Error = Error;
    type Transform = AuthRateLimitService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        // Try to initialize Redis client for distributed rate limiting
        let redis_client = match std::env::var("REDIS_URL") {
            Ok(redis_url) => match redis::Client::open(redis_url) {
                Ok(client) => {
                    log::info!("Auth rate limiting using Redis for distributed tracking");
                    Some(Arc::new(client))
                }
                Err(e) => {
                    log::warn!("Failed to connect to Redis for auth rate limiting, falling back to in-memory: {}", e);
                    None
                }
            },
            Err(_) => {
                log::warn!(
                    "REDIS_URL not set, auth rate limiting using in-memory store (not distributed)"
                );
                None
            }
        };

        ok(AuthRateLimitService {
            service: Rc::new(service),
            config: self.config.clone(),
            redis_client,
            store: Arc::new(Mutex::new(HashMap::new())),
        })
    }
}

#[derive(Clone)]
pub struct AuthRateLimitService<S> {
    service: Rc<S>,
    config: AuthRateLimitConfig,
    redis_client: Option<Arc<redis::Client>>,
    store: Arc<Mutex<HashMap<String, VecDeque<Instant>>>>,
}

impl<S, B> Service<ServiceRequest> for AuthRateLimitService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: actix_web::body::MessageBody + 'static,
    <B as actix_web::body::MessageBody>::Error: std::fmt::Debug,
{
    type Response = ServiceResponse<BoxBody>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(&self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let path = req.path().to_string();
        let config = self.config.clone();
        let redis_client = self.redis_client.clone();
        let store = self.store.clone();
        let service = self.service.clone();

        Box::pin(async move {
            // Only apply rate limiting to /api/auth/* endpoints
            if !path.starts_with("/api/auth") {
                // Not an auth endpoint, skip rate limiting
                let fut = service.call(req);
                return fut.await.map(|res| res.map_body(|_, body| body.boxed()));
            }

            // Determine rate limit based on endpoint
            let (max_requests, window_seconds) = get_rate_limit_for_path(&path, &config);
            
            // Get client identifier (IP address or email for login/register)
            let client_id = get_client_id_for_auth(&req, &path);
            
            // Check rate limit
            let rate_limit_exceeded = if let Some(redis_client) = redis_client {
                match check_redis_rate_limit(
                    &redis_client,
                    &format!("auth:{}:{}", &path, &client_id),
                    max_requests,
                    window_seconds,
                )
                .await
                {
                    Ok(false) => true,
                    Ok(true) => false,
                    Err(e) => {
                        log::warn!("Redis auth rate limiting failed, falling back to in-memory: {}", e);
                        !check_memory_rate_limit(&store, &format!("auth:{}:{}", &path, &client_id), max_requests, window_seconds)
                    }
                }
            } else {
                !check_memory_rate_limit(&store, &format!("auth:{}:{}", &path, &client_id), max_requests, window_seconds)
            };

            if rate_limit_exceeded {
                RATE_LIMIT_BLOCKS.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                
                let reset_time = chrono::Utc::now().timestamp() + window_seconds as i64;
                let response = actix_web::HttpResponse::TooManyRequests()
                    .insert_header(("X-RateLimit-Limit", max_requests.to_string()))
                    .insert_header(("X-RateLimit-Remaining", "0"))
                    .insert_header(("X-RateLimit-Reset", reset_time.to_string()))
                    .json(serde_json::json!({
                        "error": "RATE_LIMIT_EXCEEDED",
                        "message": format!("Too many requests to {}. Limit: {} requests per {} seconds", path, max_requests, window_seconds),
                        "retry_after": window_seconds
                    }));
                // HttpResponse::json() already returns HttpResponse<BoxBody>
                // Convert to ServiceResponse<BoxBody>
                let (req_parts, _) = req.into_parts();
                return Ok(ServiceResponse::new(req_parts, response));
            }

            // Calculate remaining requests and reset time for headers
            let remaining = calculate_remaining_requests(&store, &format!("auth:{}:{}", &path, &client_id), max_requests, window_seconds);
            let reset_time = chrono::Utc::now().timestamp() + window_seconds as i64;

            let fut = service.call(req);
            let mut res = fut.await?;
            
            // Add rate limit headers to response
            if let Ok(limit_header) = actix_web::http::header::HeaderValue::from_str(&max_requests.to_string()) {
                res.headers_mut().insert(
                    actix_web::http::header::HeaderName::from_static("x-ratelimit-limit"),
                    limit_header,
                );
            }
            if let Ok(remaining_header) = actix_web::http::header::HeaderValue::from_str(&remaining.to_string()) {
                res.headers_mut().insert(
                    actix_web::http::header::HeaderName::from_static("x-ratelimit-remaining"),
                    remaining_header,
                );
            }
            if let Ok(reset_header) = actix_web::http::header::HeaderValue::from_str(&reset_time.to_string()) {
                res.headers_mut().insert(
                    actix_web::http::header::HeaderName::from_static("x-ratelimit-reset"),
                    reset_header,
                );
            }

            Ok(res.map_body(|_, body| body.boxed()))
        })
    }
}

/// Get rate limit configuration for a specific auth endpoint path
fn get_rate_limit_for_path(path: &str, config: &AuthRateLimitConfig) -> (u32, u64) {
    if path.contains("/login") {
        (config.login_max_requests, config.login_window_seconds)
    } else if path.contains("/register") {
        (config.register_max_requests, config.register_window_seconds)
    } else if path.contains("/password-reset") {
        (config.password_reset_max_requests, config.password_reset_window_seconds)
    } else if path.contains("/refresh") {
        (config.refresh_max_requests, config.refresh_window_seconds)
    } else {
        (config.default_max_requests, config.default_window_seconds)
    }
}

/// Get client identifier for auth endpoints
/// For login/register, try to get email from request body if available
/// Otherwise, use IP address
fn get_client_id_for_auth(req: &ServiceRequest, path: &str) -> String {
    // For login and register, prefer email-based rate limiting
    if path.contains("/login") || path.contains("/register") {
        // Try to extract email from request (if body is available)
        // Note: This is a simplified approach - in production, you might want to
        // parse the body or use a different approach
        if let Some(claims) = req.extensions().get::<crate::services::auth::Claims>() {
            return claims.email.clone();
        }
    }
    
    // Fall back to IP address
    req.connection_info()
        .peer_addr()
        .map(|addr| addr.to_string())
        .unwrap_or_else(|| "unknown".to_string())
}

/// Check rate limit using Redis (distributed)
async fn check_redis_rate_limit(
    redis_client: &redis::Client,
    key: &str,
    max_requests: u32,
    window_seconds: u64,
) -> Result<bool, redis::RedisError> {
    let mut conn = redis_client.get_async_connection().await?;
    let redis_key = format!("ratelimit:{}", key);
    let now = chrono::Utc::now().timestamp() as f64;
    let window_start = now - window_seconds as f64;

    // Remove old entries and count current requests in window
    let count: i64 = redis::pipe()
        .atomic()
        .zrembyscore(&redis_key, "-inf", window_start)
        .zadd(&redis_key, now, now)
        .zcard(&redis_key)
        .pexpire(&redis_key, (window_seconds * 1000) as usize)
        .query_async(&mut conn)
        .await?;

    Ok(count as u32 <= max_requests)
}

/// Check rate limit using in-memory storage (fallback)
fn check_memory_rate_limit(
    store: &Arc<Mutex<HashMap<String, VecDeque<Instant>>>>,
    key: &str,
    max_requests: u32,
    window_seconds: u64,
) -> bool {
    let now = Instant::now();
    let window = std::time::Duration::from_secs(window_seconds);

    let mut store = store.lock().unwrap_or_else(|e| {
        log::error!("Auth rate limit store mutex poisoned: {}. Resetting.", e);
        e.into_inner()
    });

    let entry = store.entry(key.to_string()).or_default();

    // Remove expired entries
    while let Some(front) = entry.front() {
        if now.duration_since(*front) > window {
            entry.pop_front();
        } else {
            break;
        }
    }

    // Check if limit exceeded
    if entry.len() as u32 >= max_requests {
        false
    } else {
        entry.push_back(now);
        true
    }
}

/// Calculate remaining requests for rate limit headers
fn calculate_remaining_requests(
    store: &Arc<Mutex<HashMap<String, VecDeque<Instant>>>>,
    key: &str,
    max_requests: u32,
    window_seconds: u64,
) -> u32 {
    let now = Instant::now();
    let window = std::time::Duration::from_secs(window_seconds);

    let store = store.lock().unwrap_or_else(|e| {
        log::error!("Auth rate limit store mutex poisoned: {}. Resetting.", e);
        e.into_inner()
    });

    if let Some(entry) = store.get(key) {
        let valid_entries = entry.iter()
            .filter(|&time| now.duration_since(*time) <= window)
            .count();
        max_requests.saturating_sub(valid_entries as u32)
    } else {
        max_requests
    }
}

