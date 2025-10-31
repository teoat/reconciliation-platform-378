//! Authentication handlers module
//! 
//! Contains all authentication-related HTTP request handlers

use actix_web::{web, HttpRequest, HttpResponse, Result};
use uuid::Uuid;
use std::sync::Arc;

use crate::errors::AppError;
use crate::services::auth::{AuthService, LoginRequest, RegisterRequest, ChangePasswordRequest, GoogleOAuthRequest};
use crate::services::user::{UserService, CreateOAuthUserRequest};
use crate::handlers::helpers::{mask_email, get_client_ip, get_user_agent};

/// Configure authentication routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/login", web::post().to(login))
        .route("/register", web::post().to(register))
        .route("/refresh", web::post().to(refresh_token))
        .route("/logout", web::post().to(logout))
        .route("/change-password", web::post().to(change_password))
        .route("/password-reset", web::post().to(request_password_reset))
        .route("/password-reset/confirm", web::post().to(confirm_password_reset))
        .route("/verify-email", web::post().to(verify_email))
        .route("/resend-verification", web::post().to(resend_verification))
        .route("/google", web::post().to(google_oauth))
        .route("/me", web::get().to(get_current_user));
}

/// Login endpoint
pub async fn login(
    req: web::Json<LoginRequest>,
    http_req: HttpRequest,
    auth_service: web::Data<Arc<AuthService>>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    // Get user by email
    let user = user_service.as_ref().get_user_by_email(&req.email).await?;
    
    // Verify password
    if !auth_service.as_ref().verify_password(&req.password, &user.password_hash)? {
        // Audit log for failed authentication
        let logger = crate::services::structured_logging::StructuredLogging::new("auth".to_string());
        let mut fields = std::collections::HashMap::new();
        fields.insert("event_type".to_string(), serde_json::json!("auth_denied"));
        fields.insert("reason".to_string(), serde_json::json!("invalid_password"));
        fields.insert("email".to_string(), serde_json::json!(mask_email(&req.email)));
        fields.insert("ip_address".to_string(), serde_json::json!(get_client_ip(&http_req)));
        fields.insert("user_agent".to_string(), serde_json::json!(get_user_agent(&http_req)));
        fields.insert("timestamp".to_string(), serde_json::json!(chrono::Utc::now().to_rfc3339()));
        logger.log(crate::services::structured_logging::LogLevel::Warn, "Authentication denied: invalid credentials", fields);

        return Err(AppError::Authentication("Invalid credentials".to_string()));
    }
    
    // Check if user is active
    if !user.is_active {
        return Err(AppError::Authentication("Account is deactivated".to_string()));
    }
    
    // Generate token
    let token = auth_service.as_ref().generate_token(&user)?;
    
    // Update last login
    user_service.as_ref().update_last_login(user.id).await?;
    
    // Create response
    let auth_response = crate::services::auth::AuthResponse {
        token,
        user: crate::services::auth::UserInfo {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            is_active: user.is_active,
            last_login: Some(chrono::Utc::now()),
        },
        expires_at: (chrono::Utc::now().timestamp() + auth_service.as_ref().get_expiration()) as usize,
    };
    
    Ok(HttpResponse::Ok().json(auth_response))
}

/// Register endpoint
pub async fn register(
    req: web::Json<RegisterRequest>,
    auth_service: web::Data<Arc<AuthService>>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    // Create user
    let create_request = crate::services::user::CreateUserRequest {
        email: req.email.clone(),
        password: req.password.clone(),
        first_name: req.first_name.clone(),
        last_name: req.last_name.clone(),
        role: req.role.clone(),
    };
    
    let user_info = user_service.as_ref().create_user(create_request).await?;
    
    // Generate token
    let user = user_service.as_ref().get_user_by_id(user_info.id).await?;
    let token = auth_service.as_ref().generate_token(&crate::models::User {
        id: user.id,
        email: user.email,
        password_hash: String::new(), // Not needed for token generation
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
    })?;
    
    // Create response
    let auth_response = crate::services::auth::AuthResponse {
        token,
        user: crate::services::auth::UserInfo {
            id: user_info.id,
            email: user_info.email,
            first_name: user_info.first_name,
            last_name: user_info.last_name,
            role: user_info.role,
            is_active: user_info.is_active,
            last_login: user_info.last_login,
        },
        expires_at: (chrono::Utc::now().timestamp() + auth_service.as_ref().get_expiration()) as usize,
    };
    
    Ok(HttpResponse::Created().json(auth_response))
}

/// Refresh token endpoint
pub async fn refresh_token(
    req: HttpRequest,
    auth_service: web::Data<Arc<AuthService>>,
) -> Result<HttpResponse, AppError> {
    // Extract token from Authorization header
    let auth_header = req.headers().get("Authorization")
        .ok_or_else(|| AppError::Authentication("Missing Authorization header".to_string()))?;
    
    let auth_str = auth_header.to_str()
        .map_err(|_| AppError::Authentication("Invalid Authorization header".to_string()))?;
    
    if !auth_str.starts_with("Bearer ") {
        return Err(AppError::Authentication("Invalid Authorization header format".to_string()));
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
        email: claims.email,
        password_hash: String::new(),
        first_name: String::new(),
        last_name: String::new(),
        role: claims.role,
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        last_login: None,
    };
    
    let new_token = auth_service.as_ref().generate_token(&user)?;
    let expiration = auth_service.as_ref().get_expiration();
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "token": new_token,
        "expires_at": (chrono::Utc::now().timestamp() + expiration) as usize
    })))
}

/// Logout endpoint
pub async fn logout() -> Result<HttpResponse, AppError> {
    // In a stateless JWT implementation, logout is handled client-side
    // by removing the token. For enhanced security, you could implement
    // a token blacklist using Redis.
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Logged out successfully"
    })))
}

/// Change password endpoint
pub async fn change_password(
    req: web::Json<ChangePasswordRequest>,
    user_id: web::Path<Uuid>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    // Change password
    user_service.as_ref().change_password(
        user_id.into_inner(),
        &req.current_password,
        &req.new_password,
    ).await?;
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Password changed successfully"
    })))
}

/// Request password reset
pub async fn request_password_reset(
    req: web::Json<crate::services::auth::PasswordResetRequest>,
    data: web::Data<crate::database::Database>,
    auth_service: web::Data<Arc<AuthService>>,
    config: web::Data<crate::config::Config>,
) -> Result<HttpResponse, AppError> {
    let enhanced_auth = crate::services::auth::EnhancedAuthService::new(
        config.jwt_secret.clone(),
        auth_service.as_ref().get_expiration(),
    );
    
    let _reset_token = enhanced_auth.generate_password_reset_token(&req.email, &data).await?;
    
    // In production, the reset token is sent via email only and never returned in API responses
    
    Ok(HttpResponse::Ok().json(crate::handlers::types::ApiResponse::<serde_json::Value> {
        success: true,
        data: None,
        message: Some("Password reset instructions sent to your email".to_string()),
        error: None,
    }))
}

/// Confirm password reset
pub async fn confirm_password_reset(
    req: web::Json<crate::services::auth::PasswordResetConfirmation>,
    data: web::Data<crate::database::Database>,
    auth_service: web::Data<Arc<AuthService>>,
    config: web::Data<crate::config::Config>,
) -> Result<HttpResponse, AppError> {
    let enhanced_auth = crate::services::auth::EnhancedAuthService::new(
        config.jwt_secret.clone(),
        auth_service.as_ref().get_expiration(),
    );
    
    enhanced_auth.confirm_password_reset(&req.token, &req.new_password, &data).await?;
    
    Ok(HttpResponse::Ok().json(crate::handlers::types::ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Password reset successfully".to_string()),
        error: None,
    }))
}

/// Verify email with token
pub async fn verify_email(
    req: web::Json<serde_json::Value>,
    data: web::Data<crate::database::Database>,
    auth_service: web::Data<Arc<AuthService>>,
    config: web::Data<crate::config::Config>,
) -> Result<HttpResponse, AppError> {
    let enhanced_auth = crate::services::auth::EnhancedAuthService::new(
        config.jwt_secret.clone(),
        auth_service.as_ref().get_expiration(),
    );
    
    let token = req.get("token")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::BadRequest("Token is required".to_string()))?;
    
    enhanced_auth.verify_email(token, &data).await?;
    
    Ok(HttpResponse::Ok().json(crate::handlers::types::ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Email verified successfully".to_string()),
        error: None,
    }))
}

/// Resend email verification
pub async fn resend_verification(
    req: web::Json<crate::services::auth::PasswordResetRequest>,
    data: web::Data<crate::database::Database>,
    user_service: web::Data<Arc<UserService>>,
    auth_service: web::Data<Arc<AuthService>>,
    config: web::Data<crate::config::Config>,
) -> Result<HttpResponse, AppError> {
    let enhanced_auth = crate::services::auth::EnhancedAuthService::new(
        config.jwt_secret.clone(),
        auth_service.as_ref().get_expiration(),
    );
    
    // Get user by email
    let user = user_service.as_ref().get_user_by_email(&req.email).await?;
    
    // Generate new verification token
    let token = enhanced_auth.generate_email_verification_token(user.id, &user.email, &data).await?;
    
    Ok(HttpResponse::Ok().json(crate::handlers::types::ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "message": "Verification token generated",
            "token": token // Remove this in production - send via email
        })),
        message: Some("Verification email sent".to_string()),
        error: None,
    }))
}

/// Google OAuth endpoint
pub async fn google_oauth(
    req: web::Json<GoogleOAuthRequest>,
    http_req: HttpRequest,
    auth_service: web::Data<Arc<AuthService>>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    // Verify Google ID token
    let client = reqwest::Client::new();
    let verify_url = format!("https://oauth2.googleapis.com/tokeninfo?id_token={}", req.id_token);
    
    let response = client
        .get(&verify_url)
        .send()
        .await
        .map_err(|e| AppError::Internal(format!("Failed to verify Google token: {}", e)))?;
    
    if !response.status().is_success() {
        return Err(AppError::Authentication("Invalid Google ID token".to_string()));
    }
    
    let token_info: serde_json::Value = response
        .json()
        .await
        .map_err(|e| AppError::Internal(format!("Failed to parse Google response: {}", e)))?;
    
    // Extract user information from Google token
    let email = token_info["email"]
        .as_str()
        .ok_or_else(|| AppError::Authentication("Email not found in Google token".to_string()))?
        .to_string();
    
    let first_name = token_info["given_name"]
        .as_str()
        .unwrap_or("")
        .to_string();
    
    let last_name = token_info["family_name"]
        .as_str()
        .unwrap_or("")
        .to_string();
    
    // Create or get user
    let create_oauth_request = CreateOAuthUserRequest {
        email: email.clone(),
        first_name,
        last_name,
        role: None,
    };
    
    let user_info = user_service.as_ref().create_oauth_user(create_oauth_request).await?;
    
    // Get full user for token generation
    let user = user_service.as_ref().get_user_by_email(&email).await?;
    
    // Check if user is active
    if !user.is_active {
        return Err(AppError::Authentication("Account is deactivated".to_string()));
    }
    
    // Generate token
    let token = auth_service.as_ref().generate_token(&user)?;
    
    // Update last login
    user_service.as_ref().update_last_login(user.id).await?;
    
    // Create response
    let auth_response = crate::services::auth::AuthResponse {
        token,
        user: crate::services::auth::UserInfo {
            id: user_info.id,
            email: user_info.email,
            first_name: user_info.first_name,
            last_name: user_info.last_name,
            role: user_info.role,
            is_active: user_info.is_active,
            last_login: Some(chrono::Utc::now()),
        },
        expires_at: (chrono::Utc::now().timestamp() + auth_service.as_ref().get_expiration()) as usize,
    };
    
    Ok(HttpResponse::Ok().json(auth_response))
}

/// Get current user information
pub async fn get_current_user(
    req: HttpRequest,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    // Extract user_id from request
    let user_id = crate::handlers::helpers::extract_user_id(&req)?;
    
    let user = user_service.as_ref().get_user_by_id(user_id).await?;
    
    Ok(HttpResponse::Ok().json(crate::handlers::types::ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "last_login": user.last_login
        })),
        message: None,
        error: None,
    }))
}
