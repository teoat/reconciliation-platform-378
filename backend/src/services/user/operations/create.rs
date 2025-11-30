//! User creation operations

use crate::database::{transaction::with_transaction, Database};
use crate::errors::{AppError, AppResult};
use crate::models::{schema::users, NewUser};
use crate::services::auth::{AuthService, ValidationUtils};
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
use uuid::Uuid;

use super::super::traits::{CreateOAuthUserRequest, CreateUserRequest, UserInfo};

/// Create a new user
pub async fn create_user_logic(
    db: &Database,
    auth_service: &AuthService,
    request: CreateUserRequest,
) -> AppResult<Uuid> {
    // Validate input
    ValidationUtils::validate_email(&request.email)?;
    auth_service.validate_password_strength(&request.password)?;

    // Hash password
    let password_hash = auth_service.hash_password(&request.password)?;
    
    // Set password expiration (configurable)
    let config = crate::config::PasswordConfig::from_env();
    let now = chrono::Utc::now();
    let password_expires_at = now + config.expiration_duration();
    let password_last_changed = now;

    // Determine role
    let role = request.role.unwrap_or_else(|| "user".to_string());
    // Validate role format - standardize to match OAuth user validation
    if role != "user" && role != "admin" && role != "manager" && role != "viewer" {
        return Err(AppError::Validation(
            "Invalid role. Must be one of: user, admin, manager, viewer".to_string(),
        ));
    }

    // Create user - move duplicate check inside transaction to prevent race condition
    let sanitized_email = ValidationUtils::sanitize_string(&request.email);
    let new_user = NewUser {
        email: sanitized_email.clone(),
        password_hash,
        username: None,
        first_name: Some(ValidationUtils::sanitize_string(&request.first_name)),
        last_name: Some(ValidationUtils::sanitize_string(&request.last_name)),
        status: role.clone(),
        email_verified: false, // Email verification required for security
        password_expires_at: Some(password_expires_at),
        password_last_changed: Some(password_last_changed),
        password_history: Some(serde_json::json!([])), // Empty history for new users
        is_initial_password: None,
        initial_password_set_at: None,
        auth_provider: Some("password".to_string()),
    };

    with_transaction(db.get_pool(), |tx| {
        // Check if user already exists inside transaction (atomic check)
        let count = users::table
            .filter(users::email.eq(&sanitized_email))
            .count()
            .get_result::<i64>(tx)
            .map_err(AppError::Database)?;

        if count > 0 {
            return Err(AppError::Conflict(
                "User with this email already exists".to_string(),
            ));
        }

        // Insert user
        diesel::insert_into(users::table)
            .values(&new_user)
            .returning(users::id)
            .get_result::<Uuid>(tx)
            .map_err(|e| {
                // Handle database constraint violations (e.g., unique constraint on email)
                if e.to_string().contains("duplicate key") || e.to_string().contains("unique") {
                    AppError::Conflict("User with this email already exists".to_string())
                } else {
                    AppError::Database(e)
                }
            })
    })
    .await
}

/// Create a new user with an initial password (for testing/pre-production)
pub async fn create_user_with_initial_password(
    db: &Database,
    auth_service: &AuthService,
    request: CreateUserRequest,
) -> AppResult<(Uuid, String)> {
    use crate::services::auth::password::PasswordManager;
    
    // Generate initial password
    let initial_password = PasswordManager::generate_initial_password()?;
    
    // Validate email
    ValidationUtils::validate_email(&request.email)?;
    
    // Hash the initial password
    let password_hash = auth_service.hash_password(&initial_password)?;
    
    // Set password expiration (configurable - shorter for initial passwords)
    let config = crate::config::PasswordConfig::from_env();
    let now = chrono::Utc::now();
    let password_expires_at = now + config.initial_expiration_duration();
    let password_last_changed = now;
    
    // Determine role
    let role = request.role.unwrap_or_else(|| "user".to_string());
    if role != "user" && role != "admin" && role != "manager" && role != "viewer" {
        return Err(AppError::Validation(
            "Invalid role. Must be one of: user, admin, manager, viewer".to_string(),
        ));
    }
    
    // Create user with initial password flag
    let sanitized_email = ValidationUtils::sanitize_string(&request.email);
    let new_user = NewUser {
        email: sanitized_email.clone(),
        password_hash,
        username: None,
        first_name: Some(ValidationUtils::sanitize_string(&request.first_name)),
        last_name: Some(ValidationUtils::sanitize_string(&request.last_name)),
        status: role.clone(),
        email_verified: false,
        password_expires_at: Some(password_expires_at),
        password_last_changed: Some(password_last_changed),
        password_history: Some(serde_json::json!([])),
        is_initial_password: Some(true),
        initial_password_set_at: Some(now),
        auth_provider: Some("password".to_string()),
    };
    
    let created_user_id = with_transaction(db.get_pool(), |tx| {
        // Check if user already exists
        let count = users::table
            .filter(users::email.eq(&sanitized_email))
            .count()
            .get_result::<i64>(tx)
            .map_err(AppError::Database)?;
        
        if count > 0 {
            return Err(AppError::Conflict(
                "User with this email already exists".to_string(),
            ));
        }
        
        // Insert user
        diesel::insert_into(users::table)
            .values(&new_user)
            .returning(users::id)
            .get_result::<Uuid>(tx)
            .map_err(|e| {
                if e.to_string().contains("duplicate key") || e.to_string().contains("unique") {
                    AppError::Conflict("User with this email already exists".to_string())
                } else {
                    AppError::Database(e)
                }
            })
    })
    .await?;
    
    Ok((created_user_id, initial_password))
}

/// Create a new OAuth user (no password validation)
pub async fn create_oauth_user(
    db: &Database,
    _auth_service: &AuthService,
    request: CreateOAuthUserRequest,
) -> AppResult<Uuid> {
    // Validate input
    ValidationUtils::validate_email(&request.email)?;

    // For OAuth users, use a placeholder password hash (they won't use password auth)
    // Generate a random hash that won't match any password
    let password_hash = format!("oauth_user_{}", Uuid::new_v4());

    // Determine role - standardize to match regular user validation
    let role = request.role.unwrap_or_else(|| "user".to_string());
    // Validate role format - match regular user validation
    if role != "user" && role != "admin" && role != "manager" && role != "viewer" {
        return Err(AppError::Validation(
            "Invalid role. Must be one of: user, admin, manager, viewer".to_string(),
        ));
    }

    // Create user - check if exists inside transaction to prevent race condition
    let sanitized_email = ValidationUtils::sanitize_string(&request.email);
    let now = chrono::Utc::now();
    let config = crate::config::PasswordConfig::from_env();
    let password_expires_at = now + config.initial_expiration_duration();
    let new_user = NewUser {
        email: sanitized_email.clone(),
        password_hash,
        username: None,
        first_name: Some(ValidationUtils::sanitize_string(&request.first_name)),
        last_name: Some(ValidationUtils::sanitize_string(&request.last_name)),
        status: role.clone(),
        email_verified: true, // OAuth emails are pre-verified by provider
        password_expires_at: Some(password_expires_at),
        password_last_changed: Some(now),
        password_history: Some(serde_json::json!([])), // Empty history for new users
        is_initial_password: None,
        initial_password_set_at: None,
        auth_provider: Some("google".to_string()),
    };

    let result = with_transaction(db.get_pool(), |tx| {
        // Check if user already exists inside transaction (atomic check)
        let count = users::table
            .filter(users::email.eq(&sanitized_email))
            .count()
            .get_result::<i64>(tx)
            .map_err(AppError::Database)?;

        if count > 0 {
            // User exists, return existing user ID for retrieval
            let existing_user_id = users::table
                .filter(users::email.eq(&sanitized_email))
                .select(users::id)
                .first::<Uuid>(tx)
                .map_err(AppError::Database)?;
            return Ok(Some(existing_user_id));
        }

        // Insert new user
        let result = match diesel::insert_into(users::table)
            .values(&new_user)
            .returning(users::id)
            .get_result::<Uuid>(tx)
        {
            Ok(user_id) => Ok(Some(user_id)),
            Err(e) => {
                // Handle database constraint violations (e.g., unique constraint on email)
                let error_str = e.to_string();
                if error_str.contains("duplicate key") || error_str.contains("unique") {
                    // If we get here, user was created between check and insert
                    // Try to get existing user ID
                    match users::table
                        .filter(users::email.eq(&sanitized_email))
                        .select(users::id)
                        .first::<Uuid>(tx)
                    {
                        Ok(user_id) => Ok(Some(user_id)),
                        Err(_) => Err(AppError::Conflict(
                            "User with this email already exists".to_string(),
                        )),
                    }
                } else {
                    Err(AppError::Database(e))
                }
            }
        }?;

        Ok(result)
    })
    .await?;

    // Get user (new or existing) with project count
    match result {
        Some(user_id) => Ok(user_id),
        None => Err(AppError::Internal(
            "Failed to create or retrieve user".to_string(),
        )),
    }
}

