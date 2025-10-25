//! Authentication Middleware
//! 
//! This module provides authentication middleware for protecting routes
//! and managing user sessions.

use actix_web::{dev::ServiceRequest, Error, HttpMessage, HttpRequest, HttpResponse, Result};
use actix_web::dev::{Service, ServiceResponse, Transform};
use futures::future::{ok, Ready};
use futures::Future;
use std::rc::Rc;
use std::pin::Pin;
use std::sync::Arc;

use crate::errors::{AppError, AppResult};
use crate::services::auth::{AuthService, Claims};

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
            skip_paths: vec!["/health".to_string(), "/api/auth/login".to_string(), "/api/auth/register".to_string()],
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
}

/// Authentication middleware
pub struct AuthMiddleware {
    config: AuthMiddlewareConfig,
}

impl AuthMiddleware {
    pub fn new(config: AuthMiddlewareConfig) -> Self {
        Self { config }
    }
    
    pub fn with_auth_service(auth_service: Arc<AuthService>) -> Self {
        Self {
            config: AuthMiddlewareConfig::default(),
        }
    }
}

impl<S, B> Transform<S> for AuthMiddleware
where
    S: Service<Request = ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = AuthMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        let state = AuthMiddlewareState {
            auth_service: Arc::new(AuthService::new(
                "your-jwt-secret".to_string(),
                86400
            )),
            config: self.config.clone(),
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

impl<S, B> Service<ServiceRequest> for AuthMiddlewareService<S>
where
    S: Service<Request = ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(&mut self, cx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&mut self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let state = self.state.clone();

        Box::pin(async move {
            // Check if path should be skipped
            if state.config.skip_paths.iter().any(|path| req.path().starts_with(path)) {
                return service.call(req).await;
            }

            // Extract token from header
            let token = match extract_token(&req, &state.config) {
                Ok(token) => token,
                Err(_) => {
                    return Ok(ServiceResponse::new(
                        req.into_parts().0,
                        HttpResponse::Unauthorized()
                            .json(serde_json::json!({
                                "error": "Authentication required",
                                "message": "Valid authentication token is required"
                            }))
                    ));
                }
            };

            // Validate token
            let claims = match state.auth_service.validate_token(&token) {
                Ok(claims) => claims,
                Err(_) => {
                    return Ok(ServiceResponse::new(
                        req.into_parts().0,
                        HttpResponse::Unauthorized()
                            .json(serde_json::json!({
                                "error": "Invalid token",
                                "message": "Authentication token is invalid or expired"
                            }))
                    ));
                }
            };

            // Check role permissions
            if !state.config.allowed_roles.is_empty() {
                if !state.config.allowed_roles.contains(&claims.role) {
                    return Ok(ServiceResponse::new(
                        req.into_parts().0,
                        HttpResponse::Forbidden()
                            .json(serde_json::json!({
                                "error": "Insufficient permissions",
                                "message": "You don't have permission to access this resource"
                            }))
                    ));
                }
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
    let auth_header = req.headers()
        .get(&config.token_header)
        .and_then(|h| h.to_str().ok())
        .ok_or(AppError::Unauthorized("Missing Authorization header".to_string()))?;

    if !auth_header.starts_with(&config.token_prefix) {
        return Err(AppError::Unauthorized("Invalid token".to_string()));
    }

    let token = auth_header.strip_prefix(&config.token_prefix)
        .ok_or(AppError::Unauthorized("Missing Authorization header".to_string()))?;

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
        Self::new(vec!["manager".to_string(), "admin".to_string(), "super_admin".to_string()])
    }
    
    pub fn analyst_or_above() -> Self {
        Self::new(vec!["analyst".to_string(), "manager".to_string(), "admin".to_string(), "super_admin".to_string()])
    }
}

impl<S, B> Transform<S> for RoleBasedAccessControl
where
    S: Service<Request = ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
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

impl<S, B> Service<ServiceRequest> for RoleBasedAccessControlService<S>
where
    S: Service<Request = ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(&mut self, cx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&mut self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let required_roles = self.required_roles.clone();

        Box::pin(async move {
            // Get claims from request extensions
            let claims = req.extensions()
                .get::<Claims>()
                .ok_or(AppError::Unauthorized("Missing Authorization header".to_string()))?;

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
        Self { required_permissions }
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

impl<S, B> Transform<S> for PermissionBasedAccessControl
where
    S: Service<Request = ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
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

impl<S, B> Service<ServiceRequest> for PermissionBasedAccessControlService<S>
where
    S: Service<Request = ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(&mut self, cx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&mut self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let required_permissions = self.required_permissions.clone();

        Box::pin(async move {
            // Get claims from request extensions
            let claims = req.extensions()
                .get::<Claims>()
                .ok_or(AppError::Unauthorized("Missing Authorization header".to_string()))?;

            // For now, we'll implement a simple permission check
            // In a real implementation, you'd check against user permissions from the database
            if claims.role == "super_admin" {
                // Super admin has all permissions
                return service.call(req).await;
            }

            // Check if user has required permissions
            // This is a simplified implementation - in reality, you'd check against stored permissions
            let user_permissions = match claims.role.as_str() {
                "admin" => vec!["users:manage", "projects:manage", "reconciliation:manage", "analytics:view"],
                "manager" => vec!["projects:manage", "reconciliation:manage", "analytics:view"],
                "analyst" => vec!["reconciliation:manage", "analytics:view"],
                "viewer" => vec!["analytics:view"],
                _ => vec![],
            };

            for required_permission in &required_permissions {
                if !user_permissions.contains(&required_permission.as_str()) {
                    return Ok(ServiceResponse::new(
                        req.into_parts().0,
                        HttpResponse::Forbidden()
                            .json(serde_json::json!({
                                "error": "Insufficient permissions",
                                "message": "You don't have the required permission to access this resource",
                                "required_permissions": required_permissions,
                                "user_permissions": user_permissions
                            }))
                    ));
                }
            }

            // Call the next service
            service.call(req).await
        })
    }
}
