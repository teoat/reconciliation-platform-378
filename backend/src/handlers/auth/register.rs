//! Registration handler for authentication

use actix_web::{web, HttpRequest, HttpResponse, Result};
use std::sync::Arc;

use crate::errors::AppError;
use crate::services::auth::{AuthService, RegisterRequest};
use crate::services::user::UserService;

/// Register endpoint
pub async fn register(
    req: web::Json<RegisterRequest>,
    http_req: HttpRequest,
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

    // Initialize automatic secrets on master signup (first user becomes master)
    if let Some(secret_manager) = http_req.app_data::<web::Data<Arc<crate::services::secret_manager::SecretManager>>>() {
        if let Err(e) = secret_manager.initialize_secrets(user_info.id).await {
            log::warn!("Failed to initialize secrets on signup: {}", e);
            // Don't fail signup if secret initialization fails
        }
    }

    // Generate token - get User struct by ID (more efficient than by email)
    let user = user_service
        .as_ref()
        .get_user_by_id_raw(user_info.id)
        .await?;
    let token = auth_service.as_ref().generate_token(&user)?;

    // Check if user has initial password and password expiration status
    let config = crate::config::PasswordConfig::from_env();
    let requires_password_change = user.is_initial_password;
    let password_expires_soon = if let Some(expires_at) = user.password_expires_at {
        let days_until_expiry = (expires_at - chrono::Utc::now()).num_days();
        days_until_expiry <= config.warning_days_before_expiry as i64 && days_until_expiry > 0
    } else {
        false
    };
    
    let password_expires_in_days = if password_expires_soon {
        user.password_expires_at
            .map(|expires_at| (expires_at - chrono::Utc::now()).num_days() as u32)
    } else {
        None
    };

    let message = if requires_password_change && password_expires_soon {
        if let Some(days) = password_expires_in_days {
            Some(format!(
                "Please change your initial password. Your password will expire in {} day(s).",
                days
            ))
        } else {
            Some("Please change your initial password".to_string())
        }
    } else if requires_password_change {
        Some("Please change your initial password".to_string())
    } else if password_expires_soon {
        if let Some(days) = password_expires_in_days {
            Some(format!(
                "Your password will expire in {} day(s). Please change it soon.",
                days
            ))
        } else {
            None
        }
    } else {
        None
    };

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
        expires_at: (chrono::Utc::now().timestamp() + auth_service.as_ref().get_expiration())
            as usize,
        requires_password_change: if requires_password_change { Some(true) } else { None },
        password_expires_soon: if password_expires_soon { Some(true) } else { None },
        password_expires_in_days,
        message,
    };

    Ok(HttpResponse::Created().json(auth_response))
}

