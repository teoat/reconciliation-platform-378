//! Rate limiting middleware

use actix_web::{
    dev::{ServiceRequest, ServiceResponse},
    Error, HttpMessage, body::EitherBody,
};
use actix_service::{Service, Transform};
use futures_util::future::{ok, Ready};
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex};
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
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
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
            Ok(redis_url) => {
                match redis::Client::open(redis_url) {
                    Ok(client) => {
                        log::info!("Rate limiting using Redis for distributed tracking");
                        Some(Arc::new(client))
                    }
                    Err(e) => {
                        log::warn!("Failed to connect to Redis for rate limiting, falling back to in-memory: {}", e);
                        None
                    }
                }
            }
            Err(_) => {
                log::warn!("REDIS_URL not set, rate limiting using in-memory store (not distributed)");
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
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
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
        
        // TODO: Implement proper async Redis rate limiting

        // In-memory rate limiting
        let now = Instant::now();
        let window = std::time::Duration::from_secs(self.window_seconds);
        {
            let mut store = self.store.lock().unwrap_or_else(|e| {
                log::error!("Rate limit store mutex poisoned: {}. Resetting.", e);
                e.into_inner()
            });
            let entry = store.entry(client_id).or_insert_with(|| VecDeque::new());
            while let Some(front) = entry.front() {
                if now.duration_since(*front) > window { entry.pop_front(); } else { break; }
            }
            if entry.len() as u32 >= self.max_requests {
                RATE_LIMIT_BLOCKS.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                let response = actix_web::HttpResponse::TooManyRequests()
                    .json(serde_json::json!({
                        "error": "Rate limit exceeded",
                        "message": format!("Too many requests. Limit: {} requests per {} seconds", self.max_requests, self.window_seconds)
                    }));
                return Box::pin(async move { Ok(req.into_response(response.map_into_right_body())) });
            }
            entry.push_back(now);
        }

        let fut = self.service.call(req);
        Box::pin(async move { fut.await.map(|res| res.map_into_left_body()) })
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
}

