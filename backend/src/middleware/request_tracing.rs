//! Request ID tracing middleware for the Reconciliation Backend
//!
//! Generates unique request IDs for each HTTP request to enable distributed tracing
//! and easier production debugging.

use actix_web::{
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage,
};
use futures::future::{ok, Ready};
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;
use uuid::Uuid;

/// Request ID middleware
pub struct RequestIdMiddleware;

impl<S> Transform<S, ServiceRequest> for RequestIdMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse, Error = Error> + 'static,
    S::Future: 'static,
{
    type Response = ServiceResponse;
    type Error = Error;
    type InitError = ();
    type Transform = RequestIdService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(RequestIdService {
            service: Rc::new(service),
        })
    }
}

/// Request ID service
pub struct RequestIdService<S> {
    service: Rc<S>,
}

impl<S> Service<ServiceRequest> for RequestIdService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse, Error = Error> + 'static,
    S::Future: 'static,
{
    type Response = ServiceResponse;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(
        &self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();

        // Generate or retrieve request ID
        let request_id = req
            .headers()
            .get("X-Request-ID")
            .and_then(|h| h.to_str().ok())
            .map(|s| s.to_string())
            .unwrap_or_else(|| Uuid::new_v4().to_string());

        // Store request ID in request extensions for access in handlers
        req.extensions_mut().insert(request_id.clone());

        Box::pin(async move {
            let res = service.call(req).await?;

            // Add request ID to response headers
            let (req, mut res) = res.into_parts();
            res.headers_mut().insert(
                actix_web::http::header::HeaderName::from_static("x-request-id"),
                actix_web::http::header::HeaderValue::from_str(&request_id).unwrap_or_else(|_| {
                    actix_web::http::header::HeaderValue::from_static("unknown")
                }),
            );

            Ok(ServiceResponse::new(req, res))
        })
    }
}

/// Extension trait to retrieve request ID from service requests
pub trait RequestIdExt {
    fn request_id(&self) -> Option<String>;
}

impl RequestIdExt for ServiceRequest {
    fn request_id(&self) -> Option<String> {
        self.extensions().get::<String>().cloned()
    }
}

impl RequestIdExt for actix_web::HttpRequest {
    fn request_id(&self) -> Option<String> {
        self.extensions().get::<String>().cloned()
    }
}
