//! Authentication handlers module
//!
//! Contains all authentication-related HTTP request handlers

use actix_web::{web, HttpRequest, HttpResponse, Result};
use std::sync::Arc;
use uuid::Uuid;

use crate::errors::AppError;
use crate::handlers::helpers::{get_client_ip, get_user_agent, mask_email};
use crate::services::auth::{
    AuthService, ChangePasswordRequest, GoogleOAuthRequest, LoginRequest, RegisterRequest,
};
use crate::services::security_monitor::{
    SecurityEvent, SecurityEventType, SecurityMonitor, SecuritySeverity,
};
use crate::services::user::{CreateOAuthUserRequest, UserService};

/// Configure authentication routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/login", web::post().to(login))
        .route("/register", web::post().to(register))
        .route("/refresh", web::post().to(refresh_token))
        .route("/logout", web::post().to(logout))
        .route("/change-password", web::post().to(change_password))
        .route("/password-reset", web::post().to(request_password_reset))
        .route(
            "/password-reset/confirm",
            web::post().to(confirm_password_reset),
        )
        .route("/verify-email", web::post().to(verify_email))
        .route("/resend-verification", web::post().to(resend_verification))
        .route("/google", web::post().to(google_oauth))
        .route("/me", web::get().to(get_current_user))
        .route("/settings", web::get().to(get_user_settings))
        .route("/settings", web::put().to(update_user_settings));
}

/// Login endpoint
#[utoipa::path(
    post,
    path = "/api/v1/auth/login",
    tag = "auth",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful", body = ApiResponse<AuthResponse>),
        (status = 401, description = "Invalid credentials", body = ErrorResponse),
        (status = 422, description = "Validation error", body = ErrorResponse)
    )
)]
pub async fn login(
    req: web::Json<LoginRequest>,
    http_req: HttpRequest,
    auth_service: web::Data<Arc<AuthService>>,
    user_service: web::Data<Arc<UserService>>,
    security_monitor: Option<web::Data<Arc<SecurityMonitor>>>,
) -> Result<HttpResponse, AppError> {
    let ip = get_client_ip(&http_req);

    // Get user by email
    let user = match user_service.as_ref().get_user_by_email(&req.email).await {
        Ok(user) => user,
        Err(_) => {
            // Log failed login attempt (user not found)
            if let Some(monitor) = security_monitor.as_ref() {
                let event = SecurityEvent {
                    id: uuid::Uuid::new_v4().to_string(),
                    event_type: SecurityEventType::AuthenticationFailure,
                    severity: SecuritySeverity::Low,
                    timestamp: chrono::Utc::now().to_rfc3339(),
                    source_ip: Some(ip.clone()),
                    user_id: None,
                    description: format!(
                        "Login attempt with non-existent email: {}",
                        mask_email(&req.email)
                    ),
                    metadata: {
                        let mut meta = std::collections::HashMap::new();
                        meta.insert("email".to_string(), mask_email(&req.email));
                        meta.insert("user_agent".to_string(), get_user_agent(&http_req));
                        meta
                    },
                };
                let _ = monitor.record_event(event).await;
            }
            return Err(AppError::Authentication("Invalid credentials".to_string()));
        }
    };

    // Verify password
    let password_valid = auth_service
        .as_ref()
        .verify_password(&req.password, &user.password_hash)?;
    
    if !password_valid {
        // Log security event for failed authentication
        if let Some(monitor) = security_monitor.as_ref() {
            let event = SecurityEvent {
                id: uuid::Uuid::new_v4().to_string(),
                event_type: SecurityEventType::AuthenticationFailure,
                severity: SecuritySeverity::Medium,
                timestamp: chrono::Utc::now().to_rfc3339(),
                source_ip: Some(ip.clone()),
                user_id: Some(user.id.to_string()),
                description: format!("Failed login attempt for user: {}", mask_email(&req.email)),
                metadata: {
                    let mut meta = std::collections::HashMap::new();
                    meta.insert("email".to_string(), mask_email(&req.email));
                    meta.insert("user_id".to_string(), user.id.to_string());
                    meta.insert("user_agent".to_string(), get_user_agent(&http_req));
                    meta
                },
            };
            let _ = monitor.record_event(event).await;

            // Check for brute force attack
            if let Ok(is_brute_force) = monitor.detect_brute_force(&ip, false).await {
                if is_brute_force {
                    log::warn!(
                        "⚠️  Brute force attack detected from IP: {} for user: {}",
                        ip,
                        mask_email(&req.email)
                    );
                }
            }
        }

        // Audit log for failed authentication
        let logger =
            crate::services::structured_logging::StructuredLogging::new("auth".to_string());
        let mut fields = std::collections::HashMap::new();
        fields.insert("event_type".to_string(), serde_json::json!("auth_denied"));
        fields.insert("reason".to_string(), serde_json::json!("invalid_password"));
        fields.insert(
            "email".to_string(),
            serde_json::json!(mask_email(&req.email)),
        );
        fields.insert("ip_address".to_string(), serde_json::json!(ip));
        fields.insert(
            "user_agent".to_string(),
            serde_json::json!(get_user_agent(&http_req)),
        );
        fields.insert(
            "timestamp".to_string(),
            serde_json::json!(chrono::Utc::now().to_rfc3339()),
        );
        logger.log(
            crate::services::structured_logging::LogLevel::Warn,
            "Authentication denied: invalid credentials",
            fields,
        );

        return Err(AppError::Authentication("Invalid credentials".to_string()));
    }

    // Check if user is active
    if user.status != "active" {
        return Err(AppError::Authentication(
            "Account is deactivated".to_string(),
        ));
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
            first_name: user.first_name.unwrap_or_default(),
            last_name: user.last_name.unwrap_or_default(),
            role: "user".to_string(), // TODO: Implement proper role fetching
            is_active: user.status == "active",
            last_login: user.last_login_at,
        },
        expires_at: (chrono::Utc::now().timestamp() + auth_service.as_ref().get_expiration())
            as usize,
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

    // Generate token - we need to get the User struct, not UserInfo
    let user = user_service
        .as_ref()
        .get_user_by_email(&user_info.email)
        .await?;
    let token = auth_service.as_ref().generate_token(&user)?;

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
        expires_at: (chrono::Utc::now().timestamp() + auth_service.as_ref().get_expiration())
            as usize,
    };

    Ok(HttpResponse::Created().json(auth_response))
}

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
    http_req: HttpRequest,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    // Extract user_id from request
    let user_id = crate::handlers::helpers::extract_user_id(&http_req)?;

    // Change password
    user_service
        .as_ref()
        .change_password(user_id, &req.current_password, &req.new_password)
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
    data: web::Data<crate::database::Database>,
    auth_service: web::Data<Arc<AuthService>>,
    config: web::Data<crate::config::Config>,
) -> Result<HttpResponse, AppError> {
    let enhanced_auth = crate::services::auth::EnhancedAuthService::new(
        config.jwt_secret.clone(),
        auth_service.as_ref().get_expiration(),
    );

    enhanced_auth
        .confirm_password_reset(&req.token, &req.new_password, &data)
        .await?;

    Ok(
        HttpResponse::Ok().json(crate::handlers::types::ApiResponse::<()> {
            success: true,
            data: None,
            message: Some("Password reset successfully".to_string()),
            error: None,
        }),
    )
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

/// Google OAuth endpoint
pub async fn google_oauth(
    req: web::Json<GoogleOAuthRequest>,
    http_req: HttpRequest,
    auth_service: web::Data<Arc<AuthService>>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    // Get Google OAuth client ID from environment (for validation)
    let google_client_id = std::env::var("GOOGLE_CLIENT_ID")
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
    let picture = token_info["picture"].as_str().map(|s| s.to_string());

    // Create or get user
    let create_oauth_request = CreateOAuthUserRequest {
        email: email.clone(),
        first_name,
        last_name,
        role: None,
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
        expires_at: (chrono::Utc::now().timestamp() + auth_service.as_ref().get_expiration())
            as usize,
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

    Ok(
        HttpResponse::Ok().json(crate::handlers::types::ApiResponse {
            success: true,
            data: Some(serde_json::json!({
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": "user", // TODO: Implement proper role fetching
                "is_active": user.is_active,
                "last_login": user.last_login.map(|dt| dt.to_rfc3339())
            })),
            message: None,
            error: None,
        }),
    )
}

/// Get user settings
pub async fn get_user_settings(
    req: HttpRequest,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    // Extract user_id from request
    let user_id = crate::handlers::helpers::extract_user_id(&req)?;

    let settings = user_service.as_ref().get_user_settings(user_id).await?;

    Ok(
        HttpResponse::Ok().json(crate::handlers::types::ApiResponse {
            success: true,
            data: Some(serde_json::json!({
                "notifications": {
                    "email": settings.notifications.email,
                    "push": settings.notifications.push,
                    "reconciliation_complete": settings.notifications.reconciliation_complete,
                },
                "preferences": {
                    "theme": settings.preferences.theme,
                    "language": settings.preferences.language,
                    "timezone": settings.preferences.timezone,
                },
                "security": {
                    "two_factor_enabled": settings.security.two_factor_enabled,
                    "session_timeout": settings.security.session_timeout,
                },
                "updated_at": chrono::Utc::now().to_rfc3339(),
            })),
            message: None,
            error: None,
        }),
    )
}

/// Update user settings
pub async fn update_user_settings(
    req: HttpRequest,
    settings_req: web::Json<serde_json::Value>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    // Extract user_id from request
    let user_id = crate::handlers::helpers::extract_user_id(&req)?;

    // Parse the incoming settings request
    let notifications = settings_req
        .get("notifications")
        .and_then(|n| n.as_object());
    let preferences = settings_req.get("preferences").and_then(|p| p.as_object());
    let security = settings_req.get("security").and_then(|s| s.as_object());

    // Get current settings
    let mut current_settings = user_service.as_ref().get_user_settings(user_id).await?;

    // Update notifications if provided
    if let Some(notif) = notifications {
        if let Some(email) = notif.get("email").and_then(|v| v.as_bool()) {
            current_settings.notifications.email = email;
        }
        if let Some(push) = notif.get("push").and_then(|v| v.as_bool()) {
            current_settings.notifications.push = push;
        }
        if let Some(reconciliation_complete) = notif
            .get("reconciliation_complete")
            .and_then(|v| v.as_bool())
        {
            current_settings.notifications.reconciliation_complete = reconciliation_complete;
        }
    }

    // Update preferences if provided
    if let Some(prefs) = preferences {
        if let Some(theme) = prefs.get("theme").and_then(|v| v.as_str()) {
            current_settings.preferences.theme = theme.to_string();
        }
        if let Some(language) = prefs.get("language").and_then(|v| v.as_str()) {
            current_settings.preferences.language = language.to_string();
        }
        if let Some(timezone) = prefs.get("timezone").and_then(|v| v.as_str()) {
            current_settings.preferences.timezone = timezone.to_string();
        }
    }

    // Update security if provided
    if let Some(sec) = security {
        if let Some(two_factor) = sec.get("two_factor_enabled").and_then(|v| v.as_bool()) {
            current_settings.security.two_factor_enabled = two_factor;
        }
        if let Some(timeout) = sec.get("session_timeout").and_then(|v| v.as_i64()) {
            current_settings.security.session_timeout = timeout as i32;
        }
    }

    // Update settings
    let updated_settings = user_service
        .as_ref()
        .update_user_settings(user_id, current_settings)
        .await?;

    Ok(HttpResponse::Ok().json(crate::handlers::types::ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "notifications": {
                "email": updated_settings.notifications.email,
                "push": updated_settings.notifications.push,
                "reconciliation_complete": updated_settings.notifications.reconciliation_complete,
            },
            "preferences": {
                "theme": updated_settings.preferences.theme,
                "language": updated_settings.preferences.language,
                "timezone": updated_settings.preferences.timezone,
            },
            "security": {
                "two_factor_enabled": updated_settings.security.two_factor_enabled,
                "session_timeout": updated_settings.security.session_timeout,
            },
            "updated_at": chrono::Utc::now().to_rfc3339(),
        })),
        message: Some("Settings updated successfully".to_string()),
        error: None,
    }))
}
