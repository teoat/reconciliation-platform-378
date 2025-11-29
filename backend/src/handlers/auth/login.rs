//! Login handler for authentication

use actix_web::{web, HttpRequest, HttpResponse, Result};
use std::sync::Arc;

use crate::errors::AppError;
use crate::handlers::helpers::{get_client_ip, get_user_agent, mask_email};
use crate::services::auth::{AuthService, LoginRequest};
use crate::services::security_monitor::{
    SecurityEvent, SecurityEventType, SecurityMonitor, SecuritySeverity,
};
use crate::services::user::UserService;

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

    // Get user by email with enhanced error handling (Tier 1: Critical)
    let user = match user_service.as_ref().get_user_by_email(&req.email).await {
        Ok(user) => user,
        Err(e) => {
            // Enhanced error logging for authentication failures
            log::warn!(
                "Authentication attempt failed - user not found: {} from IP: {} - Error: {}",
                mask_email(&req.email),
                ip,
                e
            );
            
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
                        meta.insert("error".to_string(), e.to_string());
                        meta
                    },
                };
                if let Err(monitor_err) = monitor.record_event(event).await {
                    log::error!("Failed to record security event: {}", monitor_err);
                }
            }
            return Err(AppError::Authentication("Invalid credentials".to_string()));
        }
    };

    // Check if account is locked BEFORE attempting authentication
    if let Some(monitor) = security_monitor.as_ref() {
        match monitor.is_account_locked(&ip, Some(&user.id.to_string())).await {
            Ok(true) => {
                // Account is locked - return error immediately
                let remaining_attempts = monitor
                    .get_remaining_attempts(&ip, Some(&user.id.to_string()))
                    .await
                    .unwrap_or(0);
                
                log::warn!(
                    "⚠️  Login attempt blocked - account locked for user: {} from IP: {}",
                    mask_email(&req.email),
                    ip
                );

                return Err(AppError::Authentication(format!(
                    "Account is temporarily locked due to too many failed login attempts. Please try again in 15 minutes. {} attempts remaining.",
                    remaining_attempts
                )));
            }
            Ok(false) => {
                // Account is not locked, proceed with authentication
            }
            Err(e) => {
                // Error checking lockout status - log but don't block (fail open for availability)
                log::error!("Error checking account lockout status: {}", e);
            }
        }
    }

    // Verify password with enhanced error handling (Tier 1: Critical)
    let password_valid = auth_service
        .as_ref()
        .verify_password(&req.password, &user.password_hash)
        .map_err(|e| {
            log::error!(
                "Password verification error for user {}: {}",
                mask_email(&req.email),
                e
            );
            AppError::Internal("Authentication service error".to_string())
        })?;
    
    if !password_valid {
        // Record failed login attempt and check if account should be locked
        let mut is_locked = false;
        let mut remaining_attempts = 0;
        
        if let Some(monitor) = security_monitor.as_ref() {
            // Record the failed attempt
            match monitor.record_login_attempt(&ip, Some(&user.id.to_string()), false).await {
                Ok((locked, remaining)) => {
                    is_locked = locked;
                    remaining_attempts = remaining;
                }
                Err(e) => {
                    log::error!("Error recording login attempt: {}", e);
                }
            }

            // Log security event for failed authentication
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
                    if is_locked {
                        meta.insert("account_locked".to_string(), "true".to_string());
                    }
                    meta.insert("remaining_attempts".to_string(), remaining_attempts.to_string());
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
        if is_locked {
            fields.insert("account_locked".to_string(), serde_json::json!(true));
            fields.insert("remaining_attempts".to_string(), serde_json::json!(remaining_attempts));
        }
        logger.log(
            crate::services::structured_logging::LogLevel::Warn,
            "Authentication denied: invalid credentials",
            fields,
        );

        // Return appropriate error message based on lockout status
        if is_locked {
            return Err(AppError::Authentication(
                "Account is temporarily locked due to too many failed login attempts. Please try again in 15 minutes.".to_string()
            ));
        } else {
            return Err(AppError::Authentication(format!(
                "Invalid credentials. {} attempts remaining before account lockout.",
                remaining_attempts
            )));
        }
    }

    // Check if user is active
    if user.status != "active" {
        return Err(AppError::Authentication(
            "Account is deactivated".to_string(),
        ));
    }

    // Check if password has expired
    if let Some(expires_at) = user.password_expires_at {
        if expires_at < chrono::Utc::now() {
            return Err(AppError::Authentication(
                "Your password has expired. Please reset your password using the 'Forgot Password' link.".to_string(),
            ));
        }
    }

    // Clear login attempts on successful authentication
    if let Some(monitor) = security_monitor.as_ref() {
        let _ = monitor.record_login_attempt(&ip, Some(&user.id.to_string()), true).await;
    }

    // Initialize automatic secrets on master login (first user becomes master)
    if let Some(secret_manager) = http_req.app_data::<web::Data<Arc<crate::services::secret_manager::SecretManager>>>() {
        if let Err(e) = secret_manager.initialize_secrets(user.id).await {
            log::warn!("Failed to initialize secrets on login: {}", e);
            // Don't fail login if secret initialization fails
        }
    }

    // Generate token
    let token = auth_service.as_ref().generate_token(&user)?;

    // Update last login
    user_service.as_ref().update_last_login(user.id).await?;

    // Get user role from status field
    let role = user.status.clone();

    // Check if user has initial password that needs to be changed
    let requires_password_change = user.is_initial_password;
    
    // Check if password is expiring soon (configurable threshold)
    let config = crate::config::PasswordConfig::from_env();
    let password_expires_soon = if let Some(expires_at) = user.password_expires_at {
        let days_until_expiry = (expires_at - chrono::Utc::now()).num_days();
        days_until_expiry <= config.warning_days_before_expiry as i64 && days_until_expiry > 0
    } else {
        false
    };
    
    let message = if requires_password_change {
        Some("Please change your initial password".to_string())
    } else if password_expires_soon {
        let days = (user.password_expires_at.unwrap() - chrono::Utc::now()).num_days();
        Some(format!("Your password will expire in {} day(s). Please change it soon.", days))
    } else {
        None
    };

    // Create response
    let password_expires_in_days = if password_expires_soon {
        Some((user.password_expires_at.unwrap() - chrono::Utc::now()).num_days() as u32)
    } else {
        None
    };

    let auth_response = crate::services::auth::AuthResponse {
        token,
        user: crate::services::auth::UserInfo {
            id: user.id,
            email: user.email,
            first_name: user.first_name.as_deref().unwrap_or("").to_string(),
            last_name: user.last_name.as_deref().unwrap_or("").to_string(),
            role,
            is_active: user.status == "active",
            last_login: user.last_login_at,
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






