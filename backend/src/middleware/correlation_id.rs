//! Correlation ID Middleware
//!
//! Propagates correlation IDs across requests for distributed tracing and error tracking.
//! Correlation IDs are extracted from headers, generated if missing, and propagated to all logs.

use actix_web::{
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage,
};
use futures::future::{ok, Ready};
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;
use uuid::Uuid;

/// Correlation ID header name
const CORRELATION_ID_HEADER: &str = "X-Correlation-ID";

/// Correlation ID middleware
pub struct CorrelationIdMiddleware;

impl<S> Transform<S, ServiceRequest> for CorrelationIdMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse, Error = Error> + 'static,
    S::Future: 'static,
{
    type Response = ServiceResponse;
    type Error = Error;
    type InitError = ();
    type Transform = CorrelationIdService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(CorrelationIdService {
            service: Rc::new(service),
        })
    }
}

/// Correlation ID service
pub struct CorrelationIdService<S> {
    service: Rc<S>,
}

impl<S> Service<ServiceRequest> for CorrelationIdService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse, Error = Error> + 'static,
    S::Future: 'static,
{
    type Response = ServiceResponse;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(&self, cx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        
        // Generate or retrieve correlation ID
        let correlation_id = req.headers()
            .get(CORRELATION_ID_HEADER)
            .and_then(|h| h.to_str().ok())
            .map(|s| s.to_string())
            .unwrap_or_else(|| Uuid::new_v4().to_string());
        
        // Store correlation ID in request extensions for access in handlers
        req.extensions_mut().insert(correlation_id.clone());
        
        Box::pin(async move {
            let res = service.call(req).await?;
            
            // Add correlation ID to response headers
            let (req, mut res) = res.into_parts();
            res.headers_mut().insert(
                actix_web::http::header::HeaderName::from_static("x-correlation-id"),
                actix_web::http::header::HeaderValue::from_str(&correlation_id)
                    .unwrap_or_else(|_| actix_web::http::header::HeaderValue::from_static("unknown")),
            );
            
            Ok(ServiceResponse::new(req, res))
        })
    }
}

/// Extension trait to retrieve correlation ID from service requests
pub trait CorrelationIdExt {
    fn correlation_id(&self) -> Option<String>;
}

impl CorrelationIdExt for ServiceRequest {
    fn correlation_id(&self) -> Option<String> {
        self.extensions().get::<String>().cloned()
    }
}

impl CorrelationIdExt for actix_web::HttpRequest {
    fn correlation_id(&self) -> Option<String> {
        self.extensions().get::<String>().cloned()
    }
}

