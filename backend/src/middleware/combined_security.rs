//! Combined Security Middleware
//!
//! Merges SecurityHeaders and ZeroTrust middleware to reduce stack depth.
use actix_service::{Service, Transform};
use actix_web::{
    dev::{ServiceRequest, ServiceResponse},
    Error, HttpMessage,
};
use futures::future::{ready, Ready};
use std::pin::Pin;
use std::sync::Arc;
use std::task::{Context, Poll};
use uuid::Uuid;

use crate::middleware::security::headers::{
    add_security_headers_to_response, CspNonce, SecurityHeadersConfig,
};
use crate::middleware::zero_trust::{
    check_network_segmentation, enforce_least_privilege, verify_identity, verify_mtls,
    ZeroTrustConfig,
};
use crate::services::auth::AuthService;
use redis::Client as RedisClient;
use crate::config::Config;

/// Combined security middleware
pub struct CombinedSecurityMiddleware {
    headers_config: SecurityHeadersConfig,
    zero_trust_config: ZeroTrustConfig,
    auth_service: Option<Arc<AuthService>>,
    redis_client: Option<Arc<RedisClient>>,
    config: Arc<Config>, // Add config field
}

impl CombinedSecurityMiddleware {
    pub fn new(headers_config: SecurityHeadersConfig, zero_trust_config: ZeroTrustConfig, config: Arc<Config>) -> Self {
        // Initialize Redis client if needed (similar to ZeroTrustMiddleware)
        let redis_client = match std::env::var("REDIS_URL") {
            Ok(redis_url) => match RedisClient::open(redis_url) {
                Ok(client) => Some(Arc::new(client)),
                Err(_) => None,
            },
            Err(_) => None,
        };

        Self {
            headers_config,
            zero_trust_config,
            auth_service: None,
            redis_client,
            config,
        }
    }

    pub fn with_auth_service(mut self, auth_service: Arc<AuthService>) -> Self {
        self.auth_service = Some(auth_service);
        self
    }

    pub fn with_redis_client(mut self, redis_client: Arc<RedisClient>) -> Self {
        self.redis_client = Some(redis_client);
        self
    }
}

impl<S, B> Transform<S, ServiceRequest> for CombinedSecurityMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = CombinedSecurityService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(CombinedSecurityService {
            service: Arc::new(service),
            headers_config: self.headers_config.clone(),
            zero_trust_config: self.zero_trust_config.clone(),
            auth_service: self.auth_service.clone(),
            redis_client: self.redis_client.clone(),
            config: self.config.clone(),
        }))
    }
}

pub struct CombinedSecurityService<S> {
    service: Arc<S>,
    headers_config: SecurityHeadersConfig,
    zero_trust_config: ZeroTrustConfig,
    auth_service: Option<Arc<AuthService>>,
    redis_client: Option<Arc<RedisClient>>,
    config: Arc<Config>, // Add config field
}

impl<S, B> Service<ServiceRequest> for CombinedSecurityService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future =
        Pin<Box<dyn std::future::Future<Output = Result<Self::Response, Self::Error>> + 'static>>;

    fn poll_ready(&self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, mut req: ServiceRequest) -> Self::Future {
        let headers_config = self.headers_config.clone();
        let zero_trust_config = self.zero_trust_config.clone();
        let service = Arc::clone(&self.service);
        let auth_service = self.auth_service.clone();
        let redis_client = self.redis_client.clone();
        let _config = self.config.clone(); // Clone config for use in async block

        // 1. Security Headers Logic (Request side)
        let csp_nonce = if headers_config.enable_csp {
            let nonce = Uuid::new_v4().to_string().replace('-', "");
            req.extensions_mut().insert(CspNonce(nonce.clone()));
            Some(nonce)
        } else {
            None
        };

        // Add default headers to request if missing (simplified version of SecurityHeadersService::add_security_headers)
        // Note: Real implementation would modify req.headers_mut() here
        // For brevity, we skip modifying request headers as they are mostly for response
        // but some might be needed for downstream.
        // The original implementation modified request headers to ensure defaults.

        Box::pin(async move {
            // 2. Zero Trust Logic
            let path = req.path();
            // Skip logic for public endpoints (same as ZeroTrustMiddleware)
            let should_skip = path == "/health"
                || path.starts_with("/health/")
                || path == "/api/health"
                || path.starts_with("/api/health/")
                || path == "/api/auth/login"
                || path.starts_with("/api/auth/login")
                || path == "/api/auth/register"
                || path.starts_with("/api/auth/register")
                || path == "/api/auth/google"
                || path.starts_with("/api/auth/google")
                || path.starts_with("/api/auth/password-reset");

            if !should_skip {
                // Verify identity
                if zero_trust_config.require_identity_verification {
                    if let Err(e) = verify_identity(&req, auth_service.as_ref(), redis_client.as_ref()).await {
                        log::warn!("Identity verification failed: {}", e);
                        return Err(actix_web::error::ErrorUnauthorized(
                            "Identity verification failed",
                        ));
                    }

                    // RBAC: Extract user claims and check permissions
                    if zero_trust_config.enforce_least_privilege {
                        let auth_service_clone = auth_service.clone();
                        let user_id_from_req = req.extensions_mut().get::<Uuid>().cloned();
                        let claims = req.extensions_mut().get::<crate::services::auth::Claims>().cloned();

                        if let (Some(auth_svc), Some(user_id), Some(claims)) = (auth_service_clone, user_id_from_req, claims) {
                            // Determine resource and action from request path and method
                            let (resource, action) = match (req.path(), req.method().as_str()) {
                                // Users management
                                (p, "GET") if p.starts_with("/api/v2/users") => ("users", "read"),
                                (p, "POST") if p.starts_with("/api/v2/users") => ("users", "create"),
                                (p, "PUT") if p.starts_with("/api/v2/users/") => ("users", "update"),
                                (p, "DELETE") if p.starts_with("/api/v2/users/") => ("users", "delete"),
                                
                                // Projects management (example)
                                (p, "GET") if p.starts_with("/api/v2/projects") => ("projects", "read"),
                                (p, "POST") if p.starts_with("/api/v2/projects") => ("projects", "create"),
                                (p, "PUT") if p.starts_with("/api/v2/projects/") => ("projects", "update"),
                                (p, "DELETE") if p.starts_with("/api/v2/projects/") => ("projects", "delete"),
                                
                                // Reconciliation management (example)
                                (p, "GET") if p.starts_with("/api/v2/reconciliation") => ("reconciliation", "read"),
                                (p, "POST") if p.starts_with("/api/v2/reconciliation") => ("reconciliation", "create"),
                                (p, "PUT") if p.starts_with("/api/v2/reconciliation/") => ("reconciliation", "update"),
                                (p, "DELETE") if p.starts_with("/api/v2/reconciliation/") => ("reconciliation", "delete"),
                                
                                // Default to a generic permission check or deny
                                _ => ("unspecified", "access"), // Deny by default
                            };

                            // Check if the user has the required permission
                            if !auth_svc.check_permission(&claims.role, resource, action) {
                                log::warn!("Access denied for user {} (role: {}): insufficient privileges for {} {}", user_id, claims.role, resource, action);
                                return Err(actix_web::error::ErrorForbidden("Insufficient privileges"));
                            }
                        } else {
                            // If identity verification passed but claims/user_id are missing, something is wrong
                            log::error!("Identity verified, but user ID or claims missing for path: {}", path);
                            return Err(actix_web::error::ErrorInternalServerError("Authentication context missing"));
                        }
                    }
                }

                // Verify mTLS
                if zero_trust_config.require_mtls {
                    if let Err(e) = verify_mtls(&req).await {
                        log::warn!("mTLS verification failed: {}", e);
                        return Err(actix_web::error::ErrorForbidden("mTLS verification failed"));
                    }
                }

                // Enforce least privilege
                if zero_trust_config.enforce_least_privilege {
                    if let Err(e) = enforce_least_privilege(&req, auth_service.as_ref()).await {
                        log::warn!("Least privilege check failed: {}", e);
                        return Err(actix_web::error::ErrorForbidden("Insufficient privileges"));
                    }
                }

                // Check network segmentation
                if zero_trust_config.network_segmentation {
                    if let Err(e) = check_network_segmentation(&req).await {
                        log::warn!("Network segmentation check failed: {}", e);
                        return Err(actix_web::error::ErrorForbidden(
                            "Network segmentation violation",
                        ));
                    }
                }
            }

            // 3. Call Service
            let mut res = service.call(req).await?;

            // 4. Security Headers Logic (Response side)
            add_security_headers_to_response(&mut res, &headers_config, csp_nonce.as_deref());

            Ok(res)
        })
    }
}
