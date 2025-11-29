//! OAuth authentication handlers

use actix_web::{web, HttpRequest, HttpResponse, Result};
use std::sync::Arc;

use crate::errors::AppError;
use crate::services::auth::{AuthService, GoogleOAuthRequest};
use crate::services::user::{CreateOAuthUserRequest, UserService};

/// Google OAuth endpoint
pub async fn google_oauth(
    req: web::Json<GoogleOAuthRequest>,
    http_req: HttpRequest,
    auth_service: web::Data<Arc<AuthService>>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    // Get Google OAuth client ID using SecretsService
    let google_client_id = crate::services::secrets::SecretsService::get_google_client_id()
        .ok()
        .filter(|id| !id.is_empty());

    // Verify Google ID token using Google's tokeninfo endpoint
    let client = reqwest::Client::new();
    let verify_url = format!(
        "https://oauth2.googleapis.com/tokeninfo?id_token={}",
        req.id_token
    );

    let response = client
        .get(&verify_url)
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| AppError::Internal(format!("Failed to verify Google token: {}", e)))?;

    if !response.status().is_success() {
        return Err(AppError::Authentication(
            "Invalid Google ID token".to_string(),
        ));
    }

    let token_info: serde_json::Value = response
        .json()
        .await
        .map_err(|e| AppError::Internal(format!("Failed to parse Google response: {}", e)))?;

    // Validate audience (client ID) if configured
    if let Some(ref client_id) = google_client_id {
        if let Some(aud) = token_info["aud"].as_str() {
            if aud != client_id {
                return Err(AppError::Authentication(
                    "Token audience mismatch".to_string(),
                ));
            }
        }
    }

    // Validate token expiration
    if let Some(exp) = token_info["exp"].as_i64() {
        let now = chrono::Utc::now().timestamp();
        if exp < now {
            return Err(AppError::Authentication(
                "Google token has expired".to_string(),
            ));
        }
    }

    // Extract user information from Google token
    let email = token_info["email"]
        .as_str()
        .ok_or_else(|| AppError::Authentication("Email not found in Google token".to_string()))?
        .to_string();

    // Verify email is verified by Google
    if let Some(email_verified) = token_info["email_verified"].as_bool() {
        if !email_verified {
            return Err(AppError::Authentication(
                "Google email is not verified".to_string(),
            ));
        }
    }

    let first_name = token_info["given_name"].as_str().unwrap_or("").to_string();
    let last_name = token_info["family_name"].as_str().unwrap_or("").to_string();
    // Safe: JSON parsing with fallback to empty string
    let _picture = token_info["picture"].as_str().map(|s| s.to_string()); // Reserved for future use

    // Create or get user
    let create_oauth_request = CreateOAuthUserRequest {
        email: email.clone(),
        first_name,
        last_name,
        role: None,
        picture: _picture,
    };

    let user_info = user_service
        .as_ref()
        .create_oauth_user(create_oauth_request)
        .await?;

    // Get full user for token generation
    let user = user_service.as_ref().get_user_by_email(&email).await?;

    // Check if user is active
    if user.status != "active" {
        return Err(AppError::Authentication(
            "Account is deactivated".to_string(),
        ));
    }

    // Initialize automatic secrets on master OAuth login (first user becomes master)
    if let Some(secret_manager) = http_req.app_data::<web::Data<Arc<crate::services::secret_manager::SecretManager>>>() {
        if let Err(e) = secret_manager.initialize_secrets(user.id).await {
            log::warn!("Failed to initialize secrets on OAuth login: {}", e);
            // Don't fail login if secret initialization fails
        }
    }

    // Generate token
    let token = auth_service.as_ref().generate_token(&user)?;

    // Update last login
    user_service.as_ref().update_last_login(user.id).await?;

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
        Some((user.password_expires_at.unwrap() - chrono::Utc::now()).num_days() as u32)
    } else {
        None
    };
    
    let message = if requires_password_change {
        Some("Please change your initial password".to_string())
    } else if password_expires_soon {
        Some(format!("Your password will expire in {} day(s). Please change it soon.", password_expires_in_days.unwrap()))
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

    Ok(HttpResponse::Ok().json(auth_response))
}






