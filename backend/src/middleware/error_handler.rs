//! Error Handler Middleware
//!
//! Ensures correlation IDs flow through all error paths by extracting them
//! from request extensions and adding them to error responses.

use actix_web::{
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage, HttpResponse,
};
use futures::future::{ok, Ready};
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;

/// Correlation ID header name
const CORRELATION_ID_HEADER: &str = "x-correlation-id";

/// Error handler middleware
pub struct ErrorHandlerMiddleware;

impl<S> Transform<S, ServiceRequest> for ErrorHandlerMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse, Error = Error> + 'static,
    S::Future: 'static,
{
    type Response = ServiceResponse;
    type Error = Error;
    type InitError = ();
    type Transform = ErrorHandlerService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(ErrorHandlerService {
            service: Rc::new(service),
        })
    }
}

/// Error handler service
pub struct ErrorHandlerService<S> {
    service: Rc<S>,
}

impl<S> Service<ServiceRequest> for ErrorHandlerService<S>
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
        
        // Extract correlation ID from request extensions
        let correlation_id = req.extensions()
            .get::<String>()
            .cloned()
            .unwrap_or_else(|| {
                // Generate new correlation ID if not present
                use uuid::Uuid;
                Uuid::new_v4().to_string()
            });
        
        Box::pin(async move {
            let res = service.call(req).await?;
            
            // Ensure correlation ID is in response headers and JSON body for error responses
            let (req, mut res) = res.into_parts();
            let status = res.status();
            let headers = res.headers_mut();
            
            // Add correlation ID to headers if not already present
            if !headers.contains_key(CORRELATION_ID_HEADER) {
                headers.insert(
                    actix_web::http::header::HeaderName::from_static(CORRELATION_ID_HEADER),
                    actix_web::http::header::HeaderValue::from_str(&correlation_id)
                        .unwrap_or_else(|_| actix_web::http::header::HeaderValue::from_static("unknown")),
                );
            }
            
            // For error responses (4xx, 5xx), add correlation ID to JSON body if it's an ErrorResponse
            if status.is_client_error() || status.is_server_error() {
                // Try to parse and modify the response body
                let body = actix_web::body::to_bytes(res.into_body()).await.map_err(|e| {
                    actix_web::Error::from(std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to read body: {}", e)))
                })?;
                
                // Try to parse as ErrorResponse JSON
                if let Ok(mut error_response) = serde_json::from_slice::<crate::errors::ErrorResponse>(&body) {
                    // Add correlation ID if not already present
                    if error_response.correlation_id.is_none() {
                        error_response.correlation_id = Some(correlation_id.clone());
                    }
                    
                    // Rebuild response with modified JSON
                    let json_body = serde_json::to_string(&error_response).unwrap_or_else(|_| String::from_utf8_lossy(&body).to_string());
                    let new_res = actix_web::HttpResponse::build(status)
                        .content_type("application/json")
                        .header(CORRELATION_ID_HEADER, &correlation_id)
                        .body(json_body);
                    
                    return Ok(ServiceResponse::new(req, new_res));
                }
                
                // If not ErrorResponse JSON, rebuild response with original body
                let new_res = actix_web::HttpResponse::build(status)
                    .header(CORRELATION_ID_HEADER, &correlation_id)
                    .body(body);
                
                return Ok(ServiceResponse::new(req, new_res));
            }
            
            Ok(ServiceResponse::new(req, res))
        })
    }
}

/// Helper function to extract correlation ID from HttpRequest
pub fn extract_correlation_id_from_request(req: &actix_web::HttpRequest) -> Option<String> {
    req.extensions().get::<String>().cloned()
}

/// Helper function to add correlation ID to HttpResponse
pub fn add_correlation_id_to_response(
    mut response: HttpResponse,
    correlation_id: Option<String>,
) -> HttpResponse {
    if let Some(corr_id) = correlation_id {
        response.headers_mut().insert(
            actix_web::http::header::HeaderName::from_static(CORRELATION_ID_HEADER),
            actix_web::http::header::HeaderValue::from_str(&corr_id)
                .unwrap_or_else(|_| actix_web::http::header::HeaderValue::from_static("unknown")),
        );
    }
    response
}

/// Helper function to create error response with correlation ID
pub fn create_error_response_with_correlation_id(
    status: actix_web::http::StatusCode,
    error: &crate::errors::ErrorResponse,
    correlation_id: Option<String>,
) -> HttpResponse {
    let mut response = HttpResponse::build(status).json(error);
    
    if let Some(corr_id) = correlation_id {
        response.headers_mut().insert(
            actix_web::http::header::HeaderName::from_static(CORRELATION_ID_HEADER),
            actix_web::http::header::HeaderValue::from_str(&corr_id)
                .unwrap_or_else(|_| actix_web::http::header::HeaderValue::from_static("unknown")),
        );
    }
    
    response
}


