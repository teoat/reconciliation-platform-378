// backend/src/middleware/cache.rs
use actix_web::{
    dev::{forward_ready, Service, ServiceFactory, ServiceRequest, ServiceResponse},
    Error, HttpMessage, HttpResponse,
};
use futures::future::{LocalBoxFuture, Ready};
use std::{
    rc::Rc,
    task::{Context, Poll},
};
use crate::services::advanced_cache::{AdvancedCacheService, CacheStrategy};
use crate::errors::AppError;
use actix_web::web::Data;
use serde_json::json;
use std::time::Duration;

/// Cache middleware for automatic response caching
pub struct CacheMiddleware<S> {
    service: Rc<S>,
    cache_service: AdvancedCacheService,
}

impl<S> CacheMiddleware<S> {
    pub fn new(service: Rc<S>, cache_service: AdvancedCacheService) -> Self {
        Self {
            service,
            cache_service,
        }
    }
}

impl<S, B> Service<ServiceRequest> for CacheMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let cache_service = self.cache_service.clone();

        Box::pin(async move {
            let path = req.path().to_string();
            let method = req.method().to_string();
            
            // Only cache GET requests
            if method == "GET" {
                let cache_key = format!("cache:{}:{}", method, path);
                
                // Try to get from cache
                if let Ok(Some(cached_response)) = cache_service.get::<serde_json::Value>(&cache_key).await {
                    let response = HttpResponse::Ok().json(cached_response);
                    return Ok(req.into_response(response));
                }
            }

            // Continue with the request
            let response = service.call(req).await?;
            
            // Cache successful GET responses
            if method == "GET" && response.status().is_success() {
                let cache_key = format!("cache:{}:{}", method, path);
                // Note: In a real implementation, you would extract the response body
                // and cache it with appropriate TTL
            }

            Ok(response)
        })
    }
}

/// Cache middleware factory
pub fn cache_middleware<S>(service: Rc<S>, cache_service: AdvancedCacheService) -> CacheMiddleware<S> {
    CacheMiddleware::new(service, cache_service)
}
