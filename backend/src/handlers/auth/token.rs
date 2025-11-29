//! Token management handlers (refresh, logout)

use actix_web::{web, HttpRequest, HttpResponse, Result};
use std::sync::Arc;
use uuid::Uuid;

use crate::errors::AppError;
use crate::services::auth::AuthService;

/// Refresh token endpoint
pub async fn refresh_token(
    req: HttpRequest,
    auth_service: web::Data<Arc<AuthService>>,
) -> Result<HttpResponse, AppError> {
    // Extract token from Authorization header
    let auth_header = req
        .headers()
        .get("Authorization")
        .ok_or_else(|| AppError::Authentication("Missing Authorization header".to_string()))?;

    let auth_str = auth_header
        .to_str()
        .map_err(|_| AppError::Authentication("Invalid Authorization header".to_string()))?;

    if !auth_str.starts_with("Bearer ") {
        return Err(AppError::Authentication(
            "Invalid Authorization header format".to_string(),
        ));
    }

    let token = &auth_str[7..]; // Remove "Bearer " prefix

    // Validate token
    let claims = auth_service.as_ref().validate_token(token)?;

    // Generate new token
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|e| AppError::Authentication(format!("Invalid user ID: {}", e)))?;

    // For simplicity, we'll create a minimal user struct for token generation
    // In a real implementation, you'd fetch the full user from the database
    let user = crate::models::User {
        id: user_id,
        email: claims.email.clone(),
        username: None,
        first_name: None,
        last_name: None,
        password_hash: String::new(),
        status: "active".to_string(),
        email_verified: true,
        email_verified_at: None,
        last_login_at: None,
        last_active_at: None,
        password_expires_at: None,
        password_last_changed: None,
        password_history: None,
        is_initial_password: false,
        initial_password_set_at: None,
        auth_provider: None,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let new_token = auth_service.as_ref().generate_token(&user)?;
    let expiration = auth_service.as_ref().get_expiration();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "token": new_token,
        "expires_at": (chrono::Utc::now().timestamp() + expiration) as usize
    })))
}

/// Logout endpoint
pub async fn logout(
    _http_req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    // Password manager master keys are no longer stored in memory
    // No cleanup needed on logout
    // See: docs/architecture/PASSWORD_SYSTEM_ORCHESTRATION.md
    
    // In a stateless JWT implementation, logout is handled client-side
    // by removing the token from storage. For enhanced security, you could:
    // 1. Add token to a revocation list (Redis)
    // 2. Implement token blacklisting
    // 3. Use shorter token expiration times
    
    Ok(HttpResponse::Ok().json(crate::handlers::types::ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Logged out successfully".to_string()),
        error: None,
    }))
}

