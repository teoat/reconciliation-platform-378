use actix_web::{get, post, web, HttpResponse, HttpRequest};
use actix_web::http::header::{self, HeaderValue};
use log::error;

use crate::api::v2::dtos::auth::{AuthResponse, LoginUserRequest, RegisterUserRequest, LoginWithRecoveryCodeRequest, Generate2faSecretResponse, Verify2faCodeRequest, RecoveryCodesResponse};
use crate::errors::AppError;
use crate::services::auth::{AuthService, EnhancedAuthService, oauth::OAuthService};
use crate::services::user::traits::{CreateUserRequest, UserServiceTrait};
use crate::services::user::UserService;

/// Register a new user
#[post("/register")]
pub async fn register_user(
    req: web::Json<RegisterUserRequest>,
    user_service: web::Data<UserService>,
) -> Result<HttpResponse, AppError> {
    let create_user_request = CreateUserRequest {
        email: req.email.clone(),
        password: req.password.clone(),
        first_name: req.first_name.clone(),
        last_name: req.last_name.clone(),
        role: req.role.clone(),
    };

    let user_info = user_service.create_user(create_user_request).await?;

    Ok(HttpResponse::Created().json(user_info))
}

/// Login user and return JWT token
#[post("/login")]
pub async fn login_user(
    req: web::Json<LoginUserRequest>,
    user_service: web::Data<UserService>,
    auth_service: web::Data<AuthService>,
    enhanced_auth_service: web::Data<EnhancedAuthService>,
    http_req: HttpRequest, // To get IP address and user agent
) -> Result<HttpResponse, AppError> {
    let email = req.email.clone();
    let password = req.password.clone();
    let two_factor_code = req.two_factor_code.clone();

    // 1. Retrieve user by email
    let user = user_service.get_user_by_email(&email).await?;

    // 2. Verify password
    let is_valid_password = auth_service.verify_password(&password, &user.password_hash)?;

    if !is_valid_password {
        error!("Failed login attempt for user: {}", email);
        return Err(AppError::Authentication("Invalid credentials".to_string()));
    }

    // 3. Check 2FA status
    let is_2fa_enabled = enhanced_auth_service.is_2fa_enabled(user.id).await?;

    if is_2fa_enabled {
        if let Some(ref code) = req.two_factor_code {
            let is_valid_2fa = enhanced_auth_service.verify_totp_code(user.id, code).await?;
            if !is_valid_2fa {
                error!("Failed 2FA for user: {}", email);
                return Err(AppError::Authentication("Invalid 2FA code".to_string()));
            }
        } else {
            // If 2FA is enabled but no code provided, ask for it
            return Ok(HttpResponse::Unauthorized().json(serde_json::json!({
                "message": "2FA required",
                "status": "2fa_required"
            })));
        }
    }

    // 4. Generate JWT access token
    let access_token = auth_service.generate_token(&user)?;

    // Get IP address and user agent for session tracking
    let ip_address = http_req.connection_info().realip_remote_addr().map(|s| s.to_string());
    let user_agent = http_req.headers().get(header::USER_AGENT).and_then(|v| v.to_str().ok()).map(|s| s.to_string());

    // 5. Create and persist user session with refresh token
    let session_info = enhanced_auth_service.create_session(&user, user_service.db(), ip_address, user_agent).await?;
    let refresh_token = session_info.refresh_token.ok_or_else(|| AppError::Internal("Refresh token not generated".to_string()))?;

    // 6. Update last login timestamp
    if let Err(e) = user_service.update_last_login(user.id).await {
        error!("Failed to update last login for user {}: {}", user.id, e);
    }

    // 7. Set refresh token as an HTTP-only cookie
    let cookie = actix_web::cookie::Cookie::build("refresh_token", refresh_token.clone())
        .path("/api/v2/auth/refresh") // Only send to refresh endpoint
        .http_only(true)
        .secure(true) // Only send over HTTPS
        .max_age(enhanced_auth_service.session_timeout + enhanced_auth_service.session_rotation_interval) // Longer expiration for refresh token
        .finish();

    // 8. Return access token and user info in response body
    Ok(HttpResponse::Ok()
        .cookie(cookie)
        .json(AuthResponse { token: access_token, refresh_token: Some(refresh_token), user: session_info.into() }))
}

/// Login with a 2FA recovery code
#[post("/login/recovery")]
pub async fn login_with_recovery_code(
    req: web::Json<LoginWithRecoveryCodeRequest>,
    user_service: web::Data<UserService>,
    auth_service: web::Data<AuthService>,
    enhanced_auth_service: web::Data<EnhancedAuthService>,
    http_req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let email = req.email.clone();
    let recovery_code = req.recovery_code.clone();

    // 1. Retrieve user by email
    let user = user_service.get_user_by_email(&email).await?;

    // 2. Verify recovery code
    let is_valid_recovery = enhanced_auth_service.verify_recovery_code(user.id, &recovery_code).await?;

    if !is_valid_recovery {
        error!("Failed recovery code login attempt for user: {}", email);
        return Err(AppError::Authentication("Invalid recovery code".to_string()));
    }

    // 3. Generate JWT access token
    let access_token = auth_service.generate_token(&user)?;

    // Get IP address and user agent for session tracking
    let ip_address = http_req.connection_info().realip_remote_addr().map(|s| s.to_string());
    let user_agent = http_req.headers().get(header::USER_AGENT).and_then(|v| v.to_str().ok()).map(|s| s.to_string());

    // 4. Create and persist user session with refresh token
    let session_info = enhanced_auth_service.create_session(&user, user_service.db(), ip_address, user_agent).await?;
    let refresh_token = session_info.refresh_token.ok_or_else(|| AppError::Internal("Refresh token not generated".to_string()))?;

    // 5. Update last login timestamp
    if let Err(e) = user_service.update_last_login(user.id).await {
        error!("Failed to update last login for user {}: {}", user.id, e);
    }

    // 6. Set refresh token as an HTTP-only cookie
    let cookie = actix_web::cookie::Cookie::build("refresh_token", refresh_token.clone())
        .path("/api/v2/auth/refresh")
        .http_only(true)
        .secure(true)
        .max_age(enhanced_auth_service.session_timeout + enhanced_auth_service.session_rotation_interval)
        .finish();

    // 7. Return access token and user info
    Ok(HttpResponse::Ok()
        .cookie(cookie)
        .json(AuthResponse { token: access_token, refresh_token: Some(refresh_token), user: session_info.into() }))
}

/// Refresh JWT token using a refresh token
#[post("/refresh")]
pub async fn refresh_token(
    http_req: HttpRequest,
    user_service: web::Data<UserService>,
    auth_service: web::Data<AuthService>,
    enhanced_auth_service: web::Data<EnhancedAuthService>,
) -> Result<HttpResponse, AppError> {
    // 1. Extract refresh token from cookie
    let refresh_token_cookie = http_req.cookie("refresh_token")
        .ok_or_else(|| AppError::Authentication("Refresh token not found".to_string()))?;
    let current_refresh_token = refresh_token_cookie.value();

    // 2. Validate the refresh token against the database
    let user_session = enhanced_auth_service.validate_refresh_token(user_service.db(), current_refresh_token).await?;

    // Ensure the session is active and belongs to a valid user
    let user = user_service.get_user_by_id_raw(user_session.user_id).await?;

    // 3. Invalidate the old refresh token and generate new tokens
    let ip_address = http_req.connection_info().realip_remote_addr().map(|s| s.to_string());
    let user_agent = http_req.headers().get(header::USER_AGENT).and_then(|v| v.to_str().ok()).map(|s| s.to_string());
    let new_session_info = enhanced_auth_service.create_rotated_session(&user, user_service.db(), current_refresh_token, ip_address, user_agent).await?;

    let new_access_token = auth_service.generate_token(&user)?;
    let new_refresh_token = new_session_info.refresh_token.ok_or_else(|| AppError::Internal("New refresh token not generated".to_string()))?;

    // 4. Set the new refresh token as an HTTP-only cookie
    let new_cookie = actix_web::cookie::Cookie::build("refresh_token", new_refresh_token.clone())
        .path("/api/v2/auth/refresh")
        .http_only(true)
        .secure(true)
        .max_age(enhanced_auth_service.session_timeout + enhanced_auth_service.session_rotation_interval)
        .finish();

    // 5. Return new access token and user info
    Ok(HttpResponse::Ok()
        .cookie(new_cookie)
        .json(AuthResponse { token: new_access_token, refresh_token: Some(new_refresh_token), user: new_session_info.into() }))
}

/// Initiate Google OAuth login flow
#[get("/oauth/google")]
pub async fn google_oauth_login(
    oauth_service: web::Data<OAuthService>,
) -> Result<HttpResponse, AppError> {
    let redirect_url = oauth_service.get_google_authorize_url()?;
    Ok(HttpResponse::Found().insert_header((header::LOCATION, redirect_url.uri().to_string())).finish())
}

/// Google OAuth callback handler
#[get("/oauth/google/callback")]
pub async fn google_oauth_callback(
    http_req: HttpRequest,
    oauth_service: web::Data<OAuthService>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, AppError> {
    let code = query.get("code").ok_or_else(|| AppError::Authentication("Authorization code not found".to_string()))?;
    let state = query.get("state").ok_or_else(|| AppError::Authentication("CSRF state not found".to_string()))?;

    let (user_info, access_token) = oauth_service.handle_google_callback(code.clone(), state.clone()).await?;

    // Set refresh token cookie (same logic as regular login)
    let refresh_token = user_info.refresh_token.ok_or_else(|| AppError::Internal("Refresh token not generated".to_string()))?;
    let cookie = actix_web::cookie::Cookie::build("refresh_token", refresh_token.clone())
        .path("/api/v2/auth/refresh")
        .http_only(true)
        .secure(true)
        .max_age(oauth_service.enhanced_auth_service.session_timeout + oauth_service.enhanced_auth_service.session_rotation_interval)
        .finish();

    // Redirect to frontend dashboard with access token (or store it securely)
    // For simplicity, we'll redirect with the token as a query parameter for now.
    // In a real app, you might set it in local storage or another secure client-side mechanism.
    Ok(HttpResponse::Found()
        .insert_header((header::LOCATION, format!("http://localhost:3000/dashboard?token={}", access_token)))
        .cookie(cookie)
        .finish())
}

/// Initiate GitHub OAuth login flow
#[get("/oauth/github")]
pub async fn github_oauth_login(
    oauth_service: web::Data<OAuthService>,
) -> Result<HttpResponse, AppError> {
    let redirect_url = oauth_service.get_github_authorize_url()?;
    Ok(HttpResponse::Found().insert_header((header::LOCATION, redirect_url.uri().to_string())).finish())
}

/// GitHub OAuth callback handler
#[get("/oauth/github/callback")]
pub async fn github_oauth_callback(
    http_req: HttpRequest,
    oauth_service: web::Data<OAuthService>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, AppError> {
    let code = query.get("code").ok_or_else(|| AppError::Authentication("Authorization code not found".to_string()))?;
    let state = query.get("state").ok_or_else(|| AppError::Authentication("CSRF state not found".to_string()))?;

    let (user_info, access_token) = oauth_service.handle_github_callback(code.clone(), state.clone()).await?;

    // Set refresh token cookie (same logic as regular login)
    let refresh_token = user_info.refresh_token.ok_or_else(|| AppError::Internal("Refresh token not generated".to_string()))?;
    let cookie = actix_web::cookie::Cookie::build("refresh_token", refresh_token.clone())
        .path("/api/v2/auth/refresh")
        .http_only(true)
        .secure(true)
        .max_age(oauth_service.enhanced_auth_service.session_timeout + oauth_service.enhanced_auth_service.session_rotation_interval)
        .finish();

    // Redirect to frontend dashboard with access token
    Ok(HttpResponse::Found()
        .insert_header((header::LOCATION, format!("http://localhost:3000/dashboard?token={}", access_token)))
        .cookie(cookie)
        .finish())
}

/// Generate 2FA secret and QR code
#[post("/2fa/generate")]
pub async fn generate_2fa_secret(
    user_id: web::ReqData<uuid::Uuid>, // Assuming user ID is extracted from JWT
    user_service: web::Data<UserService>,
    enhanced_auth_service: web::Data<EnhancedAuthService>,
) -> Result<HttpResponse, AppError> {
    let user_id = user_id.into_inner();
    let user = user_service.get_user_by_id_raw(user_id).await?;

    let (secret, qr_code_image) = enhanced_auth_service.generate_totp_secret_and_qr(user_id, &user.email).await?;

    Ok(HttpResponse::Ok().json(Generate2faSecretResponse { secret, qr_code_image }))
}

/// Verify 2FA setup with a TOTP code
#[post("/2fa/verify")]
pub async fn verify_2fa_setup(
    user_id: web::ReqData<uuid::Uuid>,
    req: web::Json<Verify2faCodeRequest>,
    enhanced_auth_service: web::Data<EnhancedAuthService>,
) -> Result<HttpResponse, AppError> {
    let user_id = user_id.into_inner();
    let is_valid = enhanced_auth_service.verify_totp_code(user_id, &req.code).await?;

    if is_valid {
        Ok(HttpResponse::Ok().json(serde_json::json!({ "message": "2FA code verified successfully" })))
    } else {
        Err(AppError::Validation("Invalid 2FA code".to_string()))
    }
}

/// Enable 2FA for the user
#[post("/2fa/enable")]
pub async fn enable_2fa(
    user_id: web::ReqData<uuid::Uuid>,
    enhanced_auth_service: web::Data<EnhancedAuthService>,
) -> Result<HttpResponse, AppError> {
    let user_id = user_id.into_inner();
    enhanced_auth_service.enable_2fa(user_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({ "message": "2FA enabled successfully" })))
}

/// Disable 2FA for the user
#[post("/2fa/disable")]
pub async fn disable_2fa(
    user_id: web::ReqData<uuid::Uuid>,
    enhanced_auth_service: web::Data<EnhancedAuthService>,
) -> Result<HttpResponse, AppError> {
    let user_id = user_id.into_inner();
    enhanced_auth_service.disable_2fa(user_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({ "message": "2FA disabled successfully" })))
}

/// Generate new 2FA recovery codes
#[post("/2fa/recovery")]
pub async fn generate_recovery_codes(
    user_id: web::ReqData<uuid::Uuid>,
    enhanced_auth_service: web::Data<EnhancedAuthService>,
) -> Result<HttpResponse, AppError> {
    let user_id = user_id.into_inner();
    let recovery_codes = enhanced_auth_service.generate_recovery_codes(user_id).await?;
    Ok(HttpResponse::Ok().json(RecoveryCodesResponse { recovery_codes }))
}
