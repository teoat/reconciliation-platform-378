//! API Versioning Middleware
//!
//! Adds version headers to responses and deprecation warnings for legacy routes

use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage,
};
use futures::future::{ok, Ready};
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;

/// API versioning configuration
#[derive(Debug, Clone)]
pub struct ApiVersioningConfig {
    /// Current API version
    pub current_version: String,
    /// Sunset date for legacy routes (RFC 3339 format)
    pub legacy_sunset_date: String,
    /// Whether to add deprecation headers to legacy routes
    pub enable_deprecation_warnings: bool,
}

impl Default for ApiVersioningConfig {
    fn default() -> Self {
        Self {
            current_version: "1".to_string(),
            legacy_sunset_date: "2026-01-01T00:00:00Z".to_string(),
            enable_deprecation_warnings: true,
        }
    }
}

/// API versioning middleware
pub struct ApiVersioningMiddleware {
    config: ApiVersioningConfig,
}

impl ApiVersioningMiddleware {
    pub fn new(config: ApiVersioningConfig) -> Self {
        Self { config }
    }
}

impl<S, B> Transform<S, ServiceRequest> for ApiVersioningMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = ApiVersioningService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(ApiVersioningService {
            service: Rc::new(service),
            config: self.config.clone(),
        })
    }
}

/// API versioning service
pub struct ApiVersioningService<S> {
    service: Rc<S>,
    config: ApiVersioningConfig,
}

impl<S, B> Service<ServiceRequest> for ApiVersioningService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + 'static>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let config = self.config.clone();
        let path = req.path().to_string();

        Box::pin(async move {
            let res = service.call(req).await?;

            // Check if this is a legacy route (not versioned)
            let is_legacy_route = path.starts_with("/api/") && !path.starts_with("/api/v");

            let (req, mut res) = res.into_parts();
            let headers = res.headers_mut();

            // Add API version header to all responses
            use actix_web::http::header::{HeaderName, HeaderValue};
            headers.insert(
                HeaderName::from_static("api-version"),
                HeaderValue::from_str(&config.current_version)
                    .unwrap_or_else(|_| HeaderValue::from_static("1")),
            );

            // Add deprecation headers for legacy routes
            if is_legacy_route && config.enable_deprecation_warnings {
                headers.insert(
                    HeaderName::from_static("deprecation"),
                    HeaderValue::from_static("true"),
                );

                headers.insert(
                    HeaderName::from_static("sunset"),
                    HeaderValue::from_str(&config.legacy_sunset_date)
                        .unwrap_or_else(|_| {
                            HeaderValue::from_static("2026-01-01T00:00:00Z")
                        }),
                );

                // Add link header pointing to versioned endpoint
                let versioned_path = path.replacen("/api/", "/api/v1/", 1);
                let link_value = format!("<{}>; rel=\"alternate\"; type=\"application/json\"", versioned_path);
                if let Ok(link_header) = HeaderValue::from_str(&link_value) {
                    headers.insert(
                        HeaderName::from_static("link"),
                        link_header,
                    );
                }
            }

            Ok(ServiceResponse::new(req, res))
        })
    }
}

