//! Password management handlers

use actix_web::{web, HttpRequest, HttpResponse, Result};
use std::sync::Arc;

use crate::errors::AppError;
use crate::handlers::helpers::extract_user_id;
use crate::services::auth::{
    AuthService, ChangeInitialPasswordRequest, ChangePasswordRequest,
};
use crate::services::user::UserService;

/// Change password endpoint
pub async fn change_password(
    req: web::Json<ChangePasswordRequest>,
    http_req: HttpRequest,
    user_service: web::Data<Arc<UserService>>,
    auth_service: web::Data<Arc<AuthService>>,
) -> Result<HttpResponse, AppError> {
    // Extract user_id from request
    let user_id = extract_user_id(&http_req)?;

    // Get user to verify current password
    let user = user_service.as_ref().get_user_by_id_raw(user_id).await?;

    // Verify current password
    if !auth_service
        .as_ref()
        .verify_password(&req.current_password, &user.password_hash)?
    {
        return Err(AppError::Authentication(
            "Current password is incorrect".to_string(),
        ));
    }

    // Get password manager from app data
    let password_manager = http_req
        .app_data::<web::Data<Arc<crate::services::password_manager::PasswordManager>>>()
        .ok_or_else(|| {
            AppError::Internal("Password manager not available".to_string())
        })?;

    // Change password
    user_service
        .as_ref()
        .change_password(user_id, &req.current_password, &req.new_password, password_manager)
        .await?;

    Ok(
        HttpResponse::Ok().json(crate::handlers::types::ApiResponse::<()> {
            success: true,
            data: None,
            message: Some("Password changed successfully".to_string()),
            error: None,
        }),
    )
}

/// Change initial password endpoint
/// 
/// This endpoint is used to change an initial/temporary password.
/// It verifies the current password and sets a new password, marking it as non-initial.
pub async fn change_initial_password(
    req: web::Json<ChangeInitialPasswordRequest>,
    http_req: HttpRequest,
    user_service: web::Data<Arc<UserService>>,
    auth_service: web::Data<Arc<AuthService>>,
) -> Result<HttpResponse, AppError> {
    // Extract user_id from request
    let user_id = extract_user_id(&http_req)?;

    // Get user to verify initial password status
    let user = user_service.as_ref().get_user_by_id_raw(user_id).await?;
    
    if !user.is_initial_password {
        return Err(AppError::Validation(
            "This endpoint is only for changing initial passwords. Use /change-password instead.".to_string(),
        ));
    }

    // Verify current password
    if !auth_service
        .as_ref()
        .verify_password(&req.current_password, &user.password_hash)?
    {
        return Err(AppError::Authentication(
            "Current password is incorrect".to_string(),
        ));
    }

    // Use user service to change initial password
    user_service
        .as_ref()
        .change_initial_password(user_id, &req.current_password, &req.new_password)
        .await?;

    Ok(
        HttpResponse::Ok().json(crate::handlers::types::ApiResponse::<()> {
            success: true,
            data: None,
            message: Some("Initial password changed successfully. You can now use your new password to login.".to_string()),
            error: None,
        }),
    )
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

    let _reset_token = enhanced_auth
        .generate_password_reset_token(&req.email, &data)
        .await?;

    // In production, the reset token is sent via email only and never returned in API responses

    Ok(
        HttpResponse::Ok().json(crate::handlers::types::ApiResponse::<serde_json::Value> {
            success: true,
            data: None,
            message: Some("Password reset instructions sent to your email".to_string()),
            error: None,
        }),
    )
}

/// Confirm password reset
pub async fn confirm_password_reset(
    req: web::Json<crate::services::auth::PasswordResetConfirmation>,
    _http_req: HttpRequest,
    data: web::Data<crate::database::Database>,
    auth_service: web::Data<Arc<AuthService>>,
    config: web::Data<crate::config::Config>,
) -> Result<HttpResponse, AppError> {
    let enhanced_auth = crate::services::auth::EnhancedAuthService::new(
        config.jwt_secret.clone(),
        auth_service.as_ref().get_expiration(),
    );

    // Get user_id from reset token to clear master key
    use crate::models::schema::password_reset_tokens;
    use diesel::prelude::*;
    use sha2::{Digest, Sha256};
    
    let mut hasher = Sha256::new();
    hasher.update(req.token.as_bytes());
    let token_hash = format!("{:x}", hasher.finalize());
    
    let mut conn = data.get_connection()?;
    let _reset_token = password_reset_tokens::table
        .filter(password_reset_tokens::token_hash.eq(&token_hash))
        .first::<crate::models::PasswordResetToken>(&mut conn)
        .ok();

    enhanced_auth
        .confirm_password_reset(&req.token, &req.new_password, &data)
        .await?;

    // Password manager master keys are no longer stored in memory
    // No cleanup needed after password reset
    // See: docs/architecture/PASSWORD_SYSTEM_ORCHESTRATION.md

    Ok(
        HttpResponse::Ok().json(crate::handlers::types::ApiResponse::<()> {
            success: true,
            data: None,
            message: Some("Password reset successfully".to_string()),
            error: None,
        }),
    )
}






