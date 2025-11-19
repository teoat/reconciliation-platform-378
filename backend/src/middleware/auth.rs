//! Authentication Middleware
//!
//! This module provides authentication middleware for protecting routes
//! and managing user sessions.

use actix_web::dev::{Service, ServiceResponse, Transform};
use actix_web::{body::BoxBody, dev::ServiceRequest, Error, HttpMessage, HttpResponse, Result};
use futures::future::{ok, Ready};
use futures::Future;
use std::pin::Pin;
use std::rc::Rc;
use std::sync::Arc;

use crate::errors::{AppError, AppResult};
use crate::monitoring::SecurityMetrics;
use crate::services::auth::{AuthService, Claims};
use crate::services::security_monitor::{
    SecurityEvent, SecurityEventType, SecurityMonitor, SecuritySeverity,
};

/// Authentication middleware configuration
#[derive(Debug, Clone)]
pub struct AuthMiddlewareConfig {
    pub require_auth: bool,
    pub allowed_roles: Vec<String>,
    pub skip_paths: Vec<String>,
    pub token_header: String,
    pub token_prefix: String,
}

impl Default for AuthMiddlewareConfig {
    fn default() -> Self {
        Self {
            require_auth: true,
            allowed_roles: vec![],
            skip_paths: vec![
                "/health".to_string(),
                "/api/auth/login".to_string(),
                "/api/auth/register".to_string(),
            ],
            token_header: "Authorization".to_string(),
            token_prefix: "Bearer ".to_string(),
        }
    }
}

/// Authentication middleware state
#[derive(Clone)]
pub struct AuthMiddlewareState {
    pub auth_service: Arc<AuthService>,
    pub config: AuthMiddlewareConfig,
    pub security_metrics: Arc<SecurityMetrics>,
    pub security_monitor: Option<Arc<SecurityMonitor>>,
}

/// Authentication middleware
pub struct AuthMiddleware {
    auth_service: Arc<AuthService>,
    config: AuthMiddlewareConfig,
    security_metrics: Arc<SecurityMetrics>,
    security_monitor: Option<Arc<SecurityMonitor>>,
}

impl AuthMiddleware {
    pub fn new(
        auth_service: Arc<AuthService>,
        config: AuthMiddlewareConfig,
        security_metrics: Arc<SecurityMetrics>,
    ) -> Self {
        Self {
            auth_service,
            config,
            security_metrics,
            security_monitor: None,
        }
    }

    pub fn with_auth_service(
        auth_service: Arc<AuthService>,
        security_metrics: Arc<SecurityMetrics>,
    ) -> Self {
        Self {
            auth_service,
            config: AuthMiddlewareConfig::default(),
            security_metrics,
            security_monitor: None,
        }
    }

    pub fn with_security_monitor(mut self, security_monitor: Arc<SecurityMonitor>) -> Self {
        self.security_monitor = Some(security_monitor);
        self
    }
}

impl<S> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<BoxBody>, Error = Error> + 'static,
    S::Future: 'static,
{
    type Response = ServiceResponse<BoxBody>;
    type Error = Error;
    type InitError = ();
    type Transform = AuthMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        let state = AuthMiddlewareState {
            auth_service: self.auth_service.clone(),
            config: self.config.clone(),
            security_metrics: self.security_metrics.clone(),
            security_monitor: self.security_monitor.clone(),
        };

        ok(AuthMiddlewareService {
            service: Rc::new(service),
            state,
        })
    }
}

/// Authentication middleware service
pub struct AuthMiddlewareService<S> {
    service: Rc<S>,
    state: AuthMiddlewareState,
}

impl<S> Service<ServiceRequest> for AuthMiddlewareService<S>
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
            // Only allow disabling auth in debug builds (development/testing)
            #[cfg(debug_assertions)]
            {
                if std::env::var("DISABLE_AUTH")
                    .unwrap_or_else(|_| "false".to_string())
                    .to_lowercase()
                    == "true"
                {
                    log::warn!("⚠️  AUTHENTICATION DISABLED - DEBUG MODE ONLY - This should never be enabled in production!");
                    return service.call(req).await;
                }
            }
            // In release builds, this code is completely removed by the compiler

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
            let token = match extract_token(&req, &state.config) {
                Ok(token) => token,
                Err(_) => {
                    let ip = get_client_ip_from_req(&req);

                    // Record security metric
                    state.security_metrics.record_auth_denied();

                    // Log security event to SecurityMonitor if available
                    if let Some(monitor) = &state.security_monitor {
                        let event = SecurityEvent {
                            id: uuid::Uuid::new_v4().to_string(),
                            event_type: SecurityEventType::AuthenticationFailure,
                            severity: SecuritySeverity::Medium,
                            timestamp: chrono::Utc::now().to_rfc3339(),
                            source_ip: Some(ip.clone()),
                            user_id: None,
                            description: format!(
                                "Authentication denied: missing token on {}",
                                req.path()
                            ),
                            metadata: {
                                let mut meta = std::collections::HashMap::new();
                                meta.insert("path".to_string(), req.path().to_string());
                                meta.insert(
                                    "method".to_string(),
                                    req.method().as_str().to_string(),
                                );
                                meta.insert(
                                    "user_agent".to_string(),
                                    get_user_agent_from_req(&req),
                                );
                                meta
                            },
                        };
                        let _ = monitor.record_event(event).await;
                    }

                    // Audit log for missing authentication
                    let logger = crate::services::structured_logging::StructuredLogging::new(
                        "auth".to_string(),
                    );
                    let mut fields = std::collections::HashMap::new();
                    fields.insert("event_type".to_string(), serde_json::json!("auth_denied"));
                    fields.insert("reason".to_string(), serde_json::json!("missing_token"));
                    fields.insert("path".to_string(), serde_json::json!(req.path()));
                    fields.insert(
                        "method".to_string(),
                        serde_json::json!(req.method().as_str()),
                    );
                    fields.insert("ip_address".to_string(), serde_json::json!(ip));
                    fields.insert(
                        "user_agent".to_string(),
                        serde_json::json!(get_user_agent_from_req(&req)),
                    );
                    fields.insert(
                        "timestamp".to_string(),
                        serde_json::json!(chrono::Utc::now().to_rfc3339()),
                    );
                    logger.log(
                        crate::services::structured_logging::LogLevel::Warn,
                        "Authentication denied: missing token",
                        fields,
                    );

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

            // Validate token
            let claims = match state.auth_service.validate_token(&token) {
                Ok(claims) => claims,
                Err(_) => {
                    let ip = get_client_ip_from_req(&req);

                    // Record security metric
                    state.security_metrics.record_auth_denied();

                    // Log security event to SecurityMonitor if available
                    if let Some(monitor) = &state.security_monitor {
                        let event = SecurityEvent {
                            id: uuid::Uuid::new_v4().to_string(),
                            event_type: SecurityEventType::AuthenticationFailure,
                            severity: SecuritySeverity::Medium,
                            timestamp: chrono::Utc::now().to_rfc3339(),
                            source_ip: Some(ip.clone()),
                            user_id: None,
                            description: format!(
                                "Authentication denied: invalid token on {}",
                                req.path()
                            ),
                            metadata: {
                                let mut meta = std::collections::HashMap::new();
                                meta.insert("path".to_string(), req.path().to_string());
                                meta.insert(
                                    "method".to_string(),
                                    req.method().as_str().to_string(),
                                );
                                meta.insert(
                                    "user_agent".to_string(),
                                    get_user_agent_from_req(&req),
                                );
                                meta
                            },
                        };
                        let _ = monitor.record_event(event).await;

                        // Check for brute force attack
                        if let Ok(is_brute_force) = monitor.detect_brute_force(&ip, false).await {
                            if is_brute_force {
                                log::warn!("Brute force attack detected from IP: {}", ip);
                                // In production, would trigger alert/block
                            }
                        }
                    }

                    // Audit log for invalid token
                    let logger = crate::services::structured_logging::StructuredLogging::new(
                        "auth".to_string(),
                    );
                    let mut fields = std::collections::HashMap::new();
                    fields.insert("event_type".to_string(), serde_json::json!("auth_denied"));
                    fields.insert("reason".to_string(), serde_json::json!("invalid_token"));
                    fields.insert("path".to_string(), serde_json::json!(req.path()));
                    fields.insert(
                        "method".to_string(),
                        serde_json::json!(req.method().as_str()),
                    );
                    fields.insert("ip_address".to_string(), serde_json::json!(ip));
                    fields.insert(
                        "user_agent".to_string(),
                        serde_json::json!(get_user_agent_from_req(&req)),
                    );
                    fields.insert(
                        "timestamp".to_string(),
                        serde_json::json!(chrono::Utc::now().to_rfc3339()),
                    );
                    logger.log(
                        crate::services::structured_logging::LogLevel::Warn,
                        "Authentication denied: invalid token",
                        fields,
                    );

                    let (req, _payload) = req.into_parts();
                    return Ok(ServiceResponse::new(
                        req,
                        HttpResponse::Unauthorized()
                            .json(serde_json::json!({
                                "error": "Invalid token",
                                "message": "Authentication token is invalid or expired"
                            }))
                            .map_into_boxed_body(),
                    ));
                }
            };

            // Check role permissions
            if !state.config.allowed_roles.is_empty()
                && !state.config.allowed_roles.contains(&claims.role)
            {
                let (req, _payload) = req.into_parts();
                return Ok(ServiceResponse::new(
                    req,
                    HttpResponse::Forbidden()
                        .json(serde_json::json!({
                            "error": "Insufficient permissions",
                            "message": "You don't have permission to access this resource"
                        }))
                        .map_into_boxed_body(),
                ));
            }

            // Add claims to request extensions
            req.extensions_mut().insert(claims);

            // Call the next service
            service.call(req).await
        })
    }
}

/// Extract token from request headers
fn extract_token(req: &ServiceRequest, config: &AuthMiddlewareConfig) -> AppResult<String> {
    let auth_header = req
        .headers()
        .get(&config.token_header)
        .and_then(|h| h.to_str().ok())
        .ok_or(AppError::Unauthorized(
            "Missing Authorization header".to_string(),
        ))?;

    if !auth_header.starts_with(&config.token_prefix) {
        return Err(AppError::Unauthorized("Invalid token".to_string()));
    }

    let token = auth_header
        .strip_prefix(&config.token_prefix)
        .ok_or(AppError::Unauthorized(
            "Missing Authorization header".to_string(),
        ))?;

    Ok(token.to_string())
}

/// Role-based access control middleware
pub struct RoleBasedAccessControl {
    required_roles: Vec<String>,
}

impl RoleBasedAccessControl {
    pub fn new(required_roles: Vec<String>) -> Self {
        Self { required_roles }
    }

    pub fn admin_only() -> Self {
        Self::new(vec!["admin".to_string(), "super_admin".to_string()])
    }

    pub fn manager_or_above() -> Self {
        Self::new(vec![
            "manager".to_string(),
            "admin".to_string(),
            "super_admin".to_string(),
        ])
    }

    pub fn analyst_or_above() -> Self {
        Self::new(vec![
            "analyst".to_string(),
            "manager".to_string(),
            "admin".to_string(),
            "super_admin".to_string(),
        ])
    }
}

impl<S> Transform<S, ServiceRequest> for RoleBasedAccessControl
where
    S: Service<ServiceRequest, Response = ServiceResponse<BoxBody>, Error = Error> + 'static,
    S::Future: 'static,
{
    type Response = ServiceResponse<BoxBody>;
    type Error = Error;
    type InitError = ();
    type Transform = RoleBasedAccessControlService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(RoleBasedAccessControlService {
            service: Rc::new(service),
            required_roles: self.required_roles.clone(),
        })
    }
}

/// Role-based access control service
pub struct RoleBasedAccessControlService<S> {
    service: Rc<S>,
    required_roles: Vec<String>,
}

impl<S> Service<ServiceRequest> for RoleBasedAccessControlService<S>
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
        let required_roles = self.required_roles.clone();

        Box::pin(async move {
            // Get claims from request extensions
            let claims_opt = req.extensions().get::<Claims>().map(|c| Claims {
                sub: c.sub.clone(),
                email: c.email.clone(),
                role: c.role.clone(),
                exp: c.exp,
                iat: c.iat,
            });

            let claims: Claims = match claims_opt {
                Some(c) => c,
                None => {
                    let (req_parts, _payload) = req.into_parts();
                    return Ok(ServiceResponse::new(
                        req_parts,
                        HttpResponse::Unauthorized()
                            .json(serde_json::json!({
                                "error": "Unauthorized",
                                "message": "Missing Authorization header"
                            }))
                            .map_into_boxed_body(),
                    ));
                }
            };

            // Check if user has required role
            if !required_roles.contains(&claims.role) {
                return Ok(ServiceResponse::new(
                    req.into_parts().0,
                    HttpResponse::Forbidden()
                        .json(serde_json::json!({
                            "error": "Insufficient permissions",
                            "message": "You don't have the required role to access this resource",
                            "required_roles": required_roles,
                            "user_role": claims.role
                        }))
                        .map_into_boxed_body(),
                ));
            }

            // Call the next service
            service.call(req).await
        })
    }
}

/// Permission-based access control
pub struct PermissionBasedAccessControl {
    required_permissions: Vec<String>,
}

impl PermissionBasedAccessControl {
    pub fn new(required_permissions: Vec<String>) -> Self {
        Self {
            required_permissions,
        }
    }

    pub fn users_manage() -> Self {
        Self::new(vec!["users:manage".to_string()])
    }

    pub fn projects_manage() -> Self {
        Self::new(vec!["projects:manage".to_string()])
    }

    pub fn reconciliation_manage() -> Self {
        Self::new(vec!["reconciliation:manage".to_string()])
    }

    pub fn analytics_view() -> Self {
        Self::new(vec!["analytics:view".to_string()])
    }
}

impl<S> Transform<S, ServiceRequest> for PermissionBasedAccessControl
where
    S: Service<ServiceRequest, Response = ServiceResponse<BoxBody>, Error = Error> + 'static,
    S::Future: 'static,
{
    type Response = ServiceResponse<BoxBody>;
    type Error = Error;
    type InitError = ();
    type Transform = PermissionBasedAccessControlService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(PermissionBasedAccessControlService {
            service: Rc::new(service),
            required_permissions: self.required_permissions.clone(),
        })
    }
}

/// Permission-based access control service
pub struct PermissionBasedAccessControlService<S> {
    service: Rc<S>,
    required_permissions: Vec<String>,
}

impl<S> Service<ServiceRequest> for PermissionBasedAccessControlService<S>
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
        let required_permissions = self.required_permissions.clone();

        Box::pin(async move {
            // Get claims from request extensions
            let claims_binding = req.extensions().get::<Claims>().cloned();
            let claims = match claims_binding {
                Some(c) => c,
                None => {
                    let (req, _payload) = req.into_parts();
                    return Ok(ServiceResponse::new(
                        req,
                        HttpResponse::Unauthorized()
                            .json(serde_json::json!({
                                "error": "Unauthorized",
                                "message": "Missing Authorization header"
                            }))
                            .map_into_boxed_body(),
                    ));
                }
            };

            // For now, we'll implement a simple permission check
            // In a real implementation, you'd check against user permissions from the database
            if claims.role == "super_admin" {
                // Super admin has all permissions
                return service.call(req).await;
            }

            // Check if user has required permissions
            // This is a simplified implementation - in reality, you'd check against stored permissions
            let user_permissions = match claims.role.as_str() {
                "admin" => vec![
                    "users:manage",
                    "projects:manage",
                    "reconciliation:manage",
                    "analytics:view",
                ],
                "manager" => vec!["projects:manage", "reconciliation:manage", "analytics:view"],
                "analyst" => vec!["reconciliation:manage", "analytics:view"],
                "viewer" => vec!["analytics:view"],
                _ => vec![],
            };

            for required_permission in &required_permissions {
                if !user_permissions.contains(&required_permission.as_str()) {
                    let (req, _payload) = req.into_parts();
                    return Ok(ServiceResponse::new(
                        req,
                        HttpResponse::Forbidden()
                            .json(serde_json::json!({
                                "error": "Insufficient permissions",
                                "message": "You don't have the required permission to access this resource",
                                "required_permissions": required_permissions,
                                "user_permissions": user_permissions
                            }))
                            .map_into_boxed_body()
                    ));
                }
            }

            // Call the next service
            service.call(req).await
        })
    }
}

/// Helper function to get client IP address from ServiceRequest
fn get_client_ip_from_req(req: &ServiceRequest) -> String {
    // Try X-Forwarded-For header first (for proxies/load balancers)
    if let Some(forwarded_for) = req.headers().get("X-Forwarded-For") {
        if let Ok(forwarded_str) = forwarded_for.to_str() {
            // Take the first IP if there are multiple
            if let Some(first_ip) = forwarded_str.split(',').next() {
                return first_ip.trim().to_string();
            }
        }
    }

    // Try X-Real-IP header
    if let Some(real_ip) = req.headers().get("X-Real-IP") {
        if let Ok(real_ip_str) = real_ip.to_str() {
            return real_ip_str.to_string();
        }
    }

    // Fall back to connection info
    req.connection_info()
        .peer_addr()
        .unwrap_or("unknown")
        .to_string()
}

/// Helper function to get user agent from ServiceRequest
fn get_user_agent_from_req(req: &ServiceRequest) -> String {
    req.headers()
        .get("User-Agent")
        .and_then(|ua| ua.to_str().ok())
        .unwrap_or("unknown")
        .to_string()
}
