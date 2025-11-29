//! Dual Authentication Middleware
//!
//! This middleware supports both legacy token validation and Better Auth tokens
//! during the migration period. It tries Better Auth validation first, then falls
//! back to legacy validation if needed.

use actix_web::dev::{Service, ServiceResponse, Transform};
use actix_web::{body::BoxBody, dev::ServiceRequest, Error, HttpMessage, HttpResponse};
use futures::future::{ok, Ready};
use futures::Future;
use std::pin::Pin;
use std::rc::Rc;
use std::sync::Arc;

use crate::config::better_auth::BetterAuthConfig;
use crate::errors::{AppError, AppResult};
use crate::middleware::better_auth::BetterAuthValidator;
use crate::monitoring::SecurityMetrics;
use crate::services::auth::{AuthService, Claims};
use crate::services::structured_logging::{LogLevel, StructuredLogging};

/// Dual authentication middleware configuration
#[derive(Debug, Clone)]
pub struct DualAuthConfig {
    pub better_auth_config: BetterAuthConfig,
    pub prefer_better_auth: bool, // If true, try Better Auth first
    pub skip_paths: Vec<String>,
}

impl Default for DualAuthConfig {
    fn default() -> Self {
        Self {
            better_auth_config: BetterAuthConfig::default(),
            prefer_better_auth: std::env::var("PREFER_BETTER_AUTH")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .unwrap_or(true),
            skip_paths: vec![
                "/health".to_string(),
                "/api/auth/login".to_string(),
                "/api/auth/register".to_string(),
            ],
        }
    }
}

/// Dual authentication middleware state
#[derive(Clone)]
pub struct DualAuthMiddlewareState {
    pub config: DualAuthConfig,
    pub better_auth_validator: Arc<BetterAuthValidator>,
    pub legacy_auth_service: Arc<AuthService>,
    pub security_metrics: Arc<SecurityMetrics>,
    pub logger: StructuredLogging,
}

/// Dual authentication middleware
pub struct DualAuthMiddleware {
    state: DualAuthMiddlewareState,
}

impl DualAuthMiddleware {
    pub fn new(
        config: DualAuthConfig,
        legacy_auth_service: Arc<AuthService>,
        security_metrics: Arc<SecurityMetrics>,
    ) -> Self {
        let better_auth_validator = Arc::new(BetterAuthValidator::new(
            config.better_auth_config.auth_server_url.clone(),
        ));

        let logger = StructuredLogging::new("dual_auth".to_string());

        Self {
            state: DualAuthMiddlewareState {
                config,
                better_auth_validator,
                legacy_auth_service,
                security_metrics,
                logger,
            },
        }
    }

    /// Try Better Auth validation
    async fn try_better_auth(&self, token: &str) -> Option<Claims> {
        match self.state.better_auth_validator.validate_token(token).await {
            Ok(ba_claims) => {
                let mut fields = std::collections::HashMap::new();
                fields.insert("auth_type".to_string(), serde_json::json!("better_auth"));
                fields.insert("user_id".to_string(), serde_json::json!(ba_claims.sub));
                self.state
                    .logger
                    .log(LogLevel::Debug, "Token validated with Better Auth", fields);

                Some(ba_claims.into())
            }
            Err(err) => {
                let mut fields = std::collections::HashMap::new();
                fields.insert("error".to_string(), serde_json::json!(err.to_string()));
                self.state.logger.log(
                    LogLevel::Debug,
                    "Better Auth validation failed, trying legacy",
                    fields,
                );
                None
            }
        }
    }

    /// Try legacy auth validation
    fn try_legacy_auth(&self, token: &str) -> Option<Claims> {
        match self.state.legacy_auth_service.validate_token(token) {
            Ok(claims) => {
                let mut fields = std::collections::HashMap::new();
                fields.insert("auth_type".to_string(), serde_json::json!("legacy"));
                fields.insert("user_id".to_string(), serde_json::json!(claims.sub));
                self.state
                    .logger
                    .log(LogLevel::Debug, "Token validated with legacy auth", fields);

                Some(claims)
            }
            Err(err) => {
                let mut fields = std::collections::HashMap::new();
                fields.insert("error".to_string(), serde_json::json!(err.to_string()));
                self.state
                    .logger
                    .log(LogLevel::Debug, "Legacy auth validation failed", fields);
                None
            }
        }
    }

    /// Validate token using dual strategy
    pub async fn validate_token(&self, token: &str) -> AppResult<Claims> {
        let claims = if self.state.config.prefer_better_auth {
            // Try Better Auth first, then legacy
            if let Some(claims) = self.try_better_auth(token).await {
                claims
            } else if let Some(claims) = self.try_legacy_auth(token) {
                claims
            } else {
                return Err(AppError::Unauthorized(
                    "Token validation failed with both auth systems".to_string(),
                ));
            }
        } else {
            // Try legacy first, then Better Auth
            if let Some(claims) = self.try_legacy_auth(token) {
                claims
            } else if let Some(claims) = self.try_better_auth(token).await {
                claims
            } else {
                return Err(AppError::Unauthorized(
                    "Token validation failed with both auth systems".to_string(),
                ));
            }
        };

        Ok(claims)
    }
}

impl<S> Transform<S, ServiceRequest> for DualAuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<BoxBody>, Error = Error> + 'static,
    S::Future: 'static,
{
    type Response = ServiceResponse<BoxBody>;
    type Error = Error;
    type InitError = ();
    type Transform = DualAuthMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(DualAuthMiddlewareService {
            service: Rc::new(service),
            state: self.state.clone(),
        })
    }
}

/// Dual authentication middleware service
pub struct DualAuthMiddlewareService<S> {
    service: Rc<S>,
    state: DualAuthMiddlewareState,
}

impl<S> Service<ServiceRequest> for DualAuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<BoxBody>, Error = Error> + 'static,
    S::Future: 'static,
{
    type Response = ServiceResponse<BoxBody>;
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
        let state = self.state.clone();

        Box::pin(async move {
            // Check if path should be skipped
            if state
                .config
                .skip_paths
                .iter()
                .any(|path| req.path().starts_with(path))
            {
                return service.call(req).await;
            }

            // Extract token from header
            let token = match extract_token(&req) {
                Ok(token) => token,
                Err(_) => {
                    state.security_metrics.record_auth_denied();

                    let (req, _payload) = req.into_parts();
                    return Ok(ServiceResponse::new(
                        req,
                        HttpResponse::Unauthorized()
                            .json(serde_json::json!({
                                "error": "Authentication required",
                                "message": "Valid authentication token is required"
                            }))
                            .map_into_boxed_body(),
                    ));
                }
            };

            // Validate token using dual strategy
            let middleware = DualAuthMiddleware {
                state: state.clone(),
            };

            let claims = match middleware.validate_token(&token).await {
                Ok(claims) => claims,
                Err(err) => {
                    state.security_metrics.record_auth_denied();

                    let (req, _payload) = req.into_parts();
                    return Ok(ServiceResponse::new(
                        req,
                        HttpResponse::Unauthorized()
                            .json(serde_json::json!({
                                "error": "Invalid token",
                                "message": err.to_string()
                            }))
                            .map_into_boxed_body(),
                    ));
                }
            };

            // Add claims to request extensions
            req.extensions_mut().insert(claims);

            // Call the next service
            service.call(req).await
        })
    }
}

/// Extract token from request headers
fn extract_token(req: &ServiceRequest) -> AppResult<String> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(AppError::Unauthorized(
            "Missing Authorization header".to_string(),
        ))?;

    if !auth_header.starts_with("Bearer ") {
        return Err(AppError::Unauthorized("Invalid token format".to_string()));
    }

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(AppError::Unauthorized("Invalid token format".to_string()))?;

    Ok(token.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dual_auth_config_default() {
        let config = DualAuthConfig::default();
        assert!(config.prefer_better_auth);
        assert!(!config.skip_paths.is_empty());
    }
}
