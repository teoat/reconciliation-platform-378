//! Email verification handlers

use actix_web::{web, HttpResponse, Result};
use std::sync::Arc;

use crate::errors::AppError;
use crate::services::auth::AuthService;
use crate::services::user::UserService;

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

    let token = req
        .get("token")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::BadRequest("Token is required".to_string()))?;

    enhanced_auth.verify_email(token, &data).await?;

    Ok(
        HttpResponse::Ok().json(crate::handlers::types::ApiResponse::<()> {
            success: true,
            data: None,
            message: Some("Email verified successfully".to_string()),
            error: None,
        }),
    )
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
    let token = enhanced_auth
        .generate_email_verification_token(user.id, &user.email, &data)
        .await?;

    Ok(
        HttpResponse::Ok().json(crate::handlers::types::ApiResponse {
            success: true,
            data: Some(serde_json::json!({
                "message": "Verification token generated",
                "token": token // Remove this in production - send via email
            })),
            message: Some("Verification email sent".to_string()),
            error: None,
        }),
    )
}

