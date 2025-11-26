//! Rate limiting middleware

use actix_service::{Service, Transform};
use actix_web::{
    body::EitherBody,
    dev::{ServiceRequest, ServiceResponse},
    Error, HttpMessage,
};
use futures_util::future::{ok, Ready};
use std::collections::{HashMap, VecDeque};
use std::future::Future;
use std::pin::Pin;
use std::sync::{Arc, Mutex};
use std::task::{Context, Poll};
use std::time::Instant;

use super::metrics::RATE_LIMIT_BLOCKS;

/// Rate limiting middleware
pub struct RateLimitMiddleware {
    max_requests: u32,
    window_seconds: u64,
}

impl RateLimitMiddleware {
    pub fn new(max_requests: u32, window_seconds: u64) -> Self {
        Self {
            max_requests,
            window_seconds,
        }
    }
}

impl<S, B> Transform<S, ServiceRequest> for RateLimitMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + Clone + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Transform = RateLimitService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        // Try to initialize Redis client for distributed rate limiting
        let redis_client = match std::env::var("REDIS_URL") {
            Ok(redis_url) => match redis::Client::open(redis_url) {
                Ok(client) => {
                    log::info!("Rate limiting using Redis for distributed tracking");
                    Some(Arc::new(client))
                }
                Err(e) => {
                    log::warn!("Failed to connect to Redis for rate limiting, falling back to in-memory: {}", e);
                    None
                }
            },
            Err(_) => {
                log::warn!(
                    "REDIS_URL not set, rate limiting using in-memory store (not distributed)"
                );
                None
            }
        };

        ok(RateLimitService {
            service,
            max_requests: self.max_requests,
            window_seconds: self.window_seconds,
            redis_client,
            store: Arc::new(Mutex::new(HashMap::new())),
        })
    }
}

pub struct RateLimitService<S> {
    service: S,
    max_requests: u32,
    window_seconds: u64,
    redis_client: Option<Arc<redis::Client>>,
    store: Arc<Mutex<HashMap<String, VecDeque<Instant>>>>,
}

impl<S, B> Service<ServiceRequest> for RateLimitService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + Clone + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(&self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        // Get client identifier (IP address or user ID)
        let client_id = self.get_client_id(&req);
        let max_requests = self.max_requests;
        let window_seconds = self.window_seconds;
        let redis_client = self.redis_client.clone();
        let store = self.store.clone();
        let service = self.service.clone();

        Box::pin(async move {
            // Check if Redis is available for distributed rate limiting
            if let Some(redis_client) = redis_client {
                match Self::check_redis_rate_limit(
                    &redis_client,
                    &client_id,
                    max_requests,
                    window_seconds,
                )
                .await
                {
                    Ok(false) => {
                        // Rate limit exceeded
                        RATE_LIMIT_BLOCKS.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                        let response = actix_web::HttpResponse::TooManyRequests()
                            .json(serde_json::json!({
                                "error": "Rate limit exceeded",
                                "message": format!("Too many requests. Limit: {} requests per {} seconds", max_requests, window_seconds)
                            }));
                        return Ok(req.into_response(response.map_into_right_body()));
                    }
                    Ok(true) => {
                        // Rate limit not exceeded, proceed
                    }
                    Err(e) => {
                        log::warn!(
                            "Redis rate limiting failed, falling back to in-memory: {}",
                            e
                        );
                        // Fall back to in-memory rate limiting
                        if !Self::check_memory_rate_limit(
                            &store,
                            &client_id,
                            max_requests,
                            window_seconds,
                        ) {
                            RATE_LIMIT_BLOCKS.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                            let response = actix_web::HttpResponse::TooManyRequests()
                                .json(serde_json::json!({
                                    "error": "Rate limit exceeded",
                                    "message": format!("Too many requests. Limit: {} requests per {} seconds", max_requests, window_seconds)
                                }));
                            return Ok(req.into_response(response.map_into_right_body()));
                        }
                    }
                }
            } else {
                // Redis not available, use in-memory rate limiting
                if !Self::check_memory_rate_limit(&store, &client_id, max_requests, window_seconds)
                {
                    RATE_LIMIT_BLOCKS.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    let response = actix_web::HttpResponse::TooManyRequests()
                        .json(serde_json::json!({
                            "error": "Rate limit exceeded",
                            "message": format!("Too many requests. Limit: {} requests per {} seconds", max_requests, window_seconds)
                        }));
                    return Ok(req.into_response(response.map_into_right_body()));
                }
            }

            let fut = service.call(req);
            fut.await.map(|res| res.map_into_left_body())
        })
    }
}

impl<S> RateLimitService<S> {
    fn get_client_id(&self, req: &ServiceRequest) -> String {
        // Try to get user ID from request extensions first
        if let Some(claims) = req.extensions().get::<crate::services::auth::Claims>() {
            return claims.sub.clone();
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
        client_id: &str,
        max_requests: u32,
        window_seconds: u64,
    ) -> Result<bool, redis::RedisError> {
        let mut conn = redis_client.get_async_connection().await?;
        let key = format!("ratelimit:{}", client_id);
        let now = chrono::Utc::now().timestamp() as f64;
        let window_start = now - window_seconds as f64;

        // Remove old entries and count current requests in window
        let count: i64 = redis::pipe()
            .atomic()
            .zrembyscore(&key, "-inf", window_start)
            .zadd(&key, now, now)
            .zcard(&key)
            .pexpire(&key, (window_seconds * 1000) as i64)
            .query_async(&mut conn)
            .await?;

        Ok(count as u32 <= max_requests)
    }

    /// Check rate limit using in-memory storage (fallback)
    fn check_memory_rate_limit(
        store: &Arc<Mutex<HashMap<String, VecDeque<Instant>>>>,
        client_id: &str,
        max_requests: u32,
        window_seconds: u64,
    ) -> bool {
        let now = Instant::now();
        let window = std::time::Duration::from_secs(window_seconds);

        let mut store = store.lock().unwrap_or_else(|e| {
            log::error!("Rate limit store mutex poisoned: {}. Resetting.", e);
            e.into_inner()
        });

        let entry = store.entry(client_id.to_string()).or_default();

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
}
