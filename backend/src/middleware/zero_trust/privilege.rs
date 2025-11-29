//! Least privilege enforcement for zero-trust middleware

use crate::errors::{AppError, AppResult};
use crate::services::auth::{AuthService, Claims};
use crate::services::auth::roles::RoleManager;
use actix_web::dev::ServiceRequest;
use actix_web::HttpMessage;
use std::sync::Arc;
use super::identity::extract_token_from_request;

/// Enforce least privilege access control
///
/// Implements role-based access control (RBAC) to ensure users only have
/// access to resources and actions permitted by their role.
pub async fn enforce_least_privilege(req: &ServiceRequest, auth_service: Option<&Arc<AuthService>>) -> AppResult<()> {
    let path = req.path();
    let method = req.method().as_str();

    // Get user from authentication token (stored in extensions by verify_identity)
    let user_role = if let Some(claims) = req.extensions().get::<Claims>() {
        claims.role.clone()
    } else {
        // If no claims, try to extract from token
        if let Some(auth) = auth_service {
            match extract_token_from_request(req) {
                Ok(token) => {
                    match auth.validate_token(&token) {
                        Ok(claims) => claims.role,
                        Err(_) => return Err(AppError::Unauthorized("Invalid or expired token".to_string())),
                    }
                }
                Err(_) => return Err(AppError::Unauthorized("Missing authentication token".to_string())),
            }
        } else {
            return Err(AppError::Unauthorized("Authentication service not available".to_string()));
        }
    };

    // Check if user has required permissions for the endpoint
    // Implement role-based access control (RBAC)
    let resource = extract_resource_from_path(path);
    let action = extract_action_from_method(method);

    // Check permissions using RoleManager
    if !RoleManager::check_permission(&user_role, &resource, &action) {
        return Err(AppError::Forbidden(format!(
            "User with role '{}' does not have permission to {} {}",
            user_role, action, resource
        )));
    }

    // Example: Admin-only endpoints
    if path.starts_with("/api/admin") && method != "GET" {
        // Check if user is admin
        if user_role != "admin" {
            return Err(AppError::Forbidden("Admin access required".to_string()));
        }
        log::debug!("Admin endpoint accessed by admin: {} {}", method, path);
    }

    Ok(())
}

/// Extract resource type from request path
///
/// Maps URL paths to resource types for RBAC permission checking.
pub fn extract_resource_from_path(path: &str) -> String {
    if path.starts_with("/api/users") {
        "users".to_string()
    } else if path.starts_with("/api/projects") {
        "projects".to_string()
    } else if path.starts_with("/api/reconciliation") {
        "reconciliation".to_string()
    } else if path.starts_with("/api/analytics") {
        "analytics".to_string()
    } else if path.starts_with("/api/admin") {
        "system".to_string()
    } else {
        "unknown".to_string()
    }
}

/// Extract action from HTTP method
///
/// Maps HTTP methods to RBAC actions (read, create, update, delete).
pub fn extract_action_from_method(method: &str) -> String {
    match method {
        "GET" => "read".to_string(),
        "POST" => "create".to_string(),
        "PUT" | "PATCH" => "update".to_string(),
        "DELETE" => "delete".to_string(),
        _ => "read".to_string(),
    }
}

