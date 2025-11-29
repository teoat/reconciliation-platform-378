//! API Key Authentication Middleware
//!
//! Provides API key authentication for external service-to-service communication.
//! Validates API keys from Authorization header or X-API-Key header.

use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error,
};
use futures_util::future::LocalBoxFuture;
use std::{
    future::{ready, Ready},
    rc::Rc,
};

use crate::errors::AppError;
use crate::services::secrets::SecretsService;

/// API Key authentication configuration
#[derive(Clone)]
pub struct ApiKeyConfig {
    /// Required API key (from environment)
    pub api_key: String,
    /// Header name to check (default: "X-API-Key")
    pub header_name: String,
    /// Whether to also check Authorization header
    pub check_authorization: bool,
}

impl Default for ApiKeyConfig {
    fn default() -> Self {
        Self {
            api_key: SecretsService::get_api_key()
                .unwrap_or_else(|_| "".to_string()),
            header_name: "X-API-Key".to_string(),
            check_authorization: true,
        }
    }
}

/// API Key authentication middleware
pub struct ApiKeyMiddleware {
    config: ApiKeyConfig,
}

impl ApiKeyMiddleware {
    pub fn new(config: ApiKeyConfig) -> Self {
        Self { config }
    }

    pub fn default() -> Self {
        Self::new(ApiKeyConfig::default())
    }
}

impl<S, B> Transform<S, ServiceRequest> for ApiKeyMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = ApiKeyMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(ApiKeyMiddlewareService {
            service: Rc::new(service),
            config: self.config.clone(),
        }))
    }
}

pub struct ApiKeyMiddlewareService<S> {
    service: Rc<S>,
    config: ApiKeyConfig,
}

impl<S, B> Service<ServiceRequest> for ApiKeyMiddlewareService<S>
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
        let service = Rc::clone(&self.service);
        let config = self.config.clone();

        Box::pin(async move {
            // Skip API key check if no API key is configured
            if config.api_key.is_empty() {
                return service.call(req).await;
            }

            // Extract API key from headers
            let provided_key = req.headers()
                .get(&config.header_name)
                .and_then(|h| h.to_str().ok())
                .or_else(|| {
                    if config.check_authorization {
                        req.headers()
                            .get("Authorization")
                            .and_then(|h| h.to_str().ok())
                            .and_then(|auth| {
                                // Support "Bearer <key>" or "ApiKey <key>" format
                                if auth.starts_with("Bearer ") {
                                    Some(&auth[7..])
                                } else if auth.starts_with("ApiKey ") {
                                    Some(&auth[7..])
                                } else {
                                    Some(auth)
                                }
                            })
                    } else {
                        None
                    }
                });

            match provided_key {
                Some(key) if key == config.api_key => {
                    // Valid API key - proceed with request
                    service.call(req).await
                }
                Some(_) => {
                    // Invalid API key
                    let error = AppError::Authentication("Invalid API key".to_string());
                    Err(actix_web::error::ErrorUnauthorized(error))
                }
                None => {
                    // No API key provided
                    let error = AppError::Authentication("API key required".to_string());
                    Err(actix_web::error::ErrorUnauthorized(error))
                }
            }
        })
    }
}

