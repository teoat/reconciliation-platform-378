use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpResponse, body::{MessageBody, BoxBody},
};
use futures::future::{LocalBoxFuture, ok, Ready};
use std::rc::Rc;
use crate::services::cache::MultiLevelCache;
use std::sync::Arc;
use std::time::Duration;

pub struct CacheMiddleware<S> {
    service: Rc<S>,
    cache_service: Arc<MultiLevelCache>,
}

impl<S> CacheMiddleware<S> {
    pub fn new(service: Rc<S>, cache_service: Arc<MultiLevelCache>) -> Self {
        Self {
            service,
            cache_service,
        }
    }
}

pub struct Cache;

impl<S, B> Transform<S, ServiceRequest> for Cache
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
    <B as MessageBody>::Error: std::fmt::Debug,
{
    type Response = ServiceResponse<BoxBody>;
    type Error = Error;
    type InitError = ();
    type Transform = CacheMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        let redis_url = std::env::var("REDIS_URL")
            .unwrap_or_else(|_| "redis://localhost:6379".to_string());
        let cache_service = match MultiLevelCache::new(&redis_url) {
            Ok(cache) => cache,
            Err(e) => {
                log::error!("Failed to create cache service with REDIS_URL {}: {}", redis_url, e);
                log::error!("Cache middleware will not function correctly - ensure REDIS_URL is set correctly");
                // Return a fallback or panic depending on requirements
                // For now, we'll panic as cache service is critical
                panic!("Failed to create cache service - ensure REDIS_URL is set correctly: {}", e);
            }
        };
        ok(CacheMiddleware::new(Rc::new(service), Arc::new(cache_service)))
    }
}

/// Helper to create cache middleware with pre-initialized cache service
/// This allows using cache that was initialized with ResilienceManager
pub struct CacheWithService {
    cache: Arc<MultiLevelCache>,
}

impl CacheWithService {
    pub fn new(cache: Arc<MultiLevelCache>) -> Self {
        Self { cache }
    }
}

impl<S, B> Transform<S, ServiceRequest> for CacheWithService
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
    <B as MessageBody>::Error: std::fmt::Debug,
{
    type Response = ServiceResponse<BoxBody>;
    type Error = Error;
    type InitError = ();
    type Transform = CacheMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(CacheMiddleware::new(Rc::new(service), self.cache.clone()))
    }
}

impl<S, B> Service<ServiceRequest> for CacheMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
    <B as MessageBody>::Error: std::fmt::Debug,
{
    type Response = ServiceResponse<BoxBody>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let cache_service = Arc::clone(&self.cache_service);

        Box::pin(async move {
            let path = req.path().to_string();
            let method = req.method().to_string();
            
            // Only cache GET requests
            if method == "GET" {
                let cache_key = format!("cache:{}:{}", method, path);
                
                // Try to get from cache
                if let Ok(Some(cached_response)) = cache_service.get::<serde_json::Value>(&cache_key).await {
                    let response = HttpResponse::Ok().json(cached_response);
                    return Ok(ServiceResponse::new(req.into_parts().0, response.map_into_boxed_body()));
                }
            }

            let response = service.call(req).await?;

            // Cache successful GET responses
            if method == "GET" && response.status().is_success() {
                let cache_key = format!("cache:{}:{}", method, path);
                let (req, res) = response.into_parts();
                match actix_web::body::to_bytes(res.into_body()).await {
                    Ok(bytes) => {
                        if let Ok(body) = serde_json::from_slice::<serde_json::Value>(&bytes) {
                            let _ = cache_service.set(&cache_key, &body, Some(Duration::from_secs(60))).await;
                        }
                        let res = HttpResponse::Ok().body(bytes);
                        return Ok(ServiceResponse::new(req, res.map_into_boxed_body()));
                    }
                    Err(e) => {
                        log::warn!("Failed to read response body for caching: {}", e);
                        // Continue without caching if body read fails
                    }
                }
            }

            Ok(response.map_into_boxed_body())
        })
    }
}
