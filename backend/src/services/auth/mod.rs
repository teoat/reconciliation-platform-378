//! Authentication and security services for the Reconciliation Backend
//!
//! This module provides JWT authentication, password hashing, role-based access control,
//! and security middleware, split into focused sub-modules.

pub mod jwt;
pub mod middleware;
pub mod password;
pub mod roles;
pub mod types;
pub mod validation;

pub use jwt::JwtManager;
pub use middleware::{CorsConfig, SecurityMiddleware};
pub use password::PasswordManager;
pub use roles::{RoleManager, UserRole};
pub use types::*;
pub use validation::ValidationUtils;

use crate::errors::{AppError, AppResult};

/// Authentication service
///
/// This is the main entry point for authentication operations.
/// It composes the various authentication modules.
#[derive(Clone)]
pub struct AuthService {
    jwt_manager: JwtManager,
}

impl AuthService {
    pub fn new(jwt_secret: String, jwt_expiration: i64) -> Self {
        Self {
            jwt_manager: JwtManager::new(jwt_secret, jwt_expiration),
        }
    }

    /// Get configured JWT expiration seconds
    pub fn get_expiration(&self) -> i64 {
        self.jwt_manager.get_expiration()
    }

    /// Hash a password using bcrypt
    pub fn hash_password(&self, password: &str) -> AppResult<String> {
        PasswordManager::hash_password(password)
    }

    /// Verify a password against its hash
    pub fn verify_password(&self, password: &str, hash: &str) -> AppResult<bool> {
        PasswordManager::verify_password(password, hash)
    }

    /// Generate a JWT token for a user
    pub fn generate_token(&self, user: &crate::models::User) -> AppResult<String> {
        self.jwt_manager.generate_token(user)
    }

    /// Validate and decode a JWT token
    pub fn validate_token(&self, token: &str) -> AppResult<Claims> {
        self.jwt_manager.validate_token(token)
    }

    /// Extract user ID from token
    pub fn get_user_id_from_token(&self, token: &str) -> AppResult<uuid::Uuid> {
        self.jwt_manager.get_user_id_from_token(token)
    }

    /// Check if user has required role
    pub fn has_role(&self, user_role: &str, required_role: &str) -> bool {
        RoleManager::has_role(user_role, required_role)
    }

    /// Validate password strength
    pub fn validate_password_strength(&self, password: &str) -> AppResult<()> {
        PasswordManager::validate_password_strength(password)
    }

    /// Generate a secure random token for password reset
    pub fn generate_reset_token(&self) -> AppResult<String> {
        PasswordManager::generate_reset_token()
    }
}

/// Enhanced authentication service with session management
///
/// Provides extended authentication features including session management,
/// password reset, and email verification.
pub struct EnhancedAuthService {
    #[allow(dead_code)]
    jwt_secret: String,
    #[allow(dead_code)]
    jwt_expiration: i64,
    session_timeout: i64,
    #[allow(dead_code)]
    password_reset_timeout: i64,
    session_rotation_interval: i64,
}

impl EnhancedAuthService {
    pub fn new(jwt_secret: String, jwt_expiration: i64) -> Self {
        Self {
            jwt_secret,
            jwt_expiration,
            session_timeout: 3600,          // 1 hour
            password_reset_timeout: 1800,   // 30 minutes
            session_rotation_interval: 900, // Rotate session every 15 minutes
        }
    }

    /// Rotate session token for security
    pub fn should_rotate_session(&self, created_at: chrono::DateTime<chrono::Utc>) -> bool {
        let now = chrono::Utc::now();
        let elapsed = now.signed_duration_since(created_at);
        elapsed.num_seconds() >= self.session_rotation_interval
    }

    /// Create user session
    pub async fn create_session(
        &self,
        user: &crate::models::User,
        _db: &crate::database::Database,
    ) -> AppResult<SessionInfo> {
        let now = chrono::Utc::now();
        let expires_at = now + chrono::Duration::seconds(self.session_timeout);

        Ok(SessionInfo {
            user_id: user.id,
            email: user.email.clone(),
            role: user.status.clone(), // Role stored in status field
            created_at: now,
            expires_at,
            last_activity: now,
        })
    }

    /// Generate new session with rotation
    pub async fn create_rotated_session(
        &self,
        user: &crate::models::User,
        db: &crate::database::Database,
    ) -> AppResult<SessionInfo> {
        self.create_session(user, db).await
    }

    /// Generate password reset token
    pub async fn generate_password_reset_token(
        &self,
        email: &str,
        db: &crate::database::Database,
    ) -> AppResult<String> {
        use crate::models::schema::password_reset_tokens;
        use crate::models::NewPasswordResetToken;
        use diesel::prelude::*;
        use sha2::{Digest, Sha256};

        // Check if user exists
        let mut conn = db.get_connection()?;
        let user = crate::models::schema::users::table
            .filter(crate::models::schema::users::email.eq(email))
            .first::<crate::models::User>(&mut conn)
            .map_err(AppError::Database)?;

        // Generate reset token
        let reset_token = PasswordManager::generate_reset_token()?;

        // Hash the token before storing
        let mut hasher = Sha256::new();
        hasher.update(reset_token.as_bytes());
        let token_hash = format!("{:x}", hasher.finalize());

        // Invalidate any existing tokens for this user
        let now = chrono::Utc::now();
        diesel::update(password_reset_tokens::table)
            .filter(password_reset_tokens::user_id.eq(user.id))
            .set(crate::models::UpdatePasswordResetToken { used_at: Some(now) })
            .execute(&mut conn)
            .map_err(AppError::Database)?;

        // Store new token with 30 minute expiration
        let expires_at = now + chrono::Duration::minutes(30);
        let new_token = NewPasswordResetToken {
            user_id: user.id,
            token_hash,
            expires_at,
        };

        diesel::insert_into(password_reset_tokens::table)
            .values(new_token)
            .execute(&mut conn)
            .map_err(AppError::Database)?;

        Ok(reset_token)
    }

    /// Confirm password reset
    pub async fn confirm_password_reset(
        &self,
        token: &str,
        new_password: &str,
        db: &crate::database::Database,
    ) -> AppResult<()> {
        use crate::models::schema::password_reset_tokens;
        use crate::models::schema::users;
        use crate::models::{PasswordResetToken, UpdatePasswordResetToken};
        use diesel::prelude::*;
        use sha2::{Digest, Sha256};

        // Validate password strength
        PasswordManager::validate_password_strength(new_password)?;

        // Hash the provided token to compare
        let mut hasher = Sha256::new();
        hasher.update(token.as_bytes());
        let token_hash = format!("{:x}", hasher.finalize());

        // Look up the token
        let mut conn = db.get_connection()?;
        let reset_token = password_reset_tokens::table
            .filter(password_reset_tokens::token_hash.eq(&token_hash))
            .first::<PasswordResetToken>(&mut conn)
            .map_err(|_| AppError::Authentication("Invalid or expired reset token".to_string()))?;

        // Check if token is already used
        if reset_token.used_at.is_some() {
            return Err(AppError::Authentication(
                "Token has already been used".to_string(),
            ));
        }

        // Check if token is expired
        let now = chrono::Utc::now();
        if reset_token.expires_at < now {
            return Err(AppError::Authentication("Token has expired".to_string()));
        }

        // Hash new password
        let password_hash = PasswordManager::hash_password(new_password)?;

        // Get user to check password history
        let user = users::table
            .filter(users::id.eq(reset_token.user_id))
            .first::<crate::models::User>(&mut conn)
            .map_err(AppError::Database)?;

        // Update password history (keep last 5)
        let mut password_history = if let Some(history) = &user.password_history {
            serde_json::from_value::<Vec<String>>(history.clone()).unwrap_or_default()
        } else {
            Vec::new()
        };
        
        // Add current password hash to history
        password_history.insert(0, user.password_hash.clone());
        password_history.truncate(5);
        
        let password_history_json = serde_json::to_value(password_history)
            .map_err(|e| AppError::Internal(format!("Failed to serialize password history: {}", e)))?;

        // Calculate new expiration (configurable)
        let config = crate::config::PasswordConfig::from_env();
        let now = chrono::Utc::now();
        let password_expires_at = now + config.expiration_duration();

        // Update user's password with history and expiration
        diesel::update(users::table)
            .filter(users::id.eq(reset_token.user_id))
            .set((
                users::password_hash.eq(&password_hash),
                users::password_last_changed.eq(now),
                users::password_expires_at.eq(password_expires_at),
                users::password_history.eq(password_history_json),
                users::updated_at.eq(now),
            ))
            .execute(&mut conn)
            .map_err(AppError::Database)?;

        // Mark token as used
        diesel::update(password_reset_tokens::table)
            .filter(password_reset_tokens::id.eq(reset_token.id))
            .set(UpdatePasswordResetToken { used_at: Some(now) })
            .execute(&mut conn)
            .map_err(AppError::Database)?;

        Ok(())
    }

    /// Check if user has permission for specific action
    pub fn check_permission(&self, user_role: &str, resource: &str, action: &str) -> bool {
        RoleManager::check_permission(user_role, resource, action)
    }

    /// Get user permissions
    pub fn get_user_permissions(&self, user_role: &str) -> Vec<String> {
        RoleManager::get_user_permissions(user_role)
    }

    /// Generate API key
    pub async fn generate_api_key(
        &self,
        _user_id: uuid::Uuid,
        _description: &str,
        _db: &crate::database::Database,
    ) -> AppResult<String> {
        // Generate a secure API key
        PasswordManager::generate_reset_token()
    }

    /// Validate password strength
    pub fn validate_password_strength(&self, password: &str) -> AppResult<()> {
        PasswordManager::validate_password_strength(password)
    }

    /// Hash password
    pub fn hash_password(&self, password: &str) -> AppResult<String> {
        PasswordManager::hash_password(password)
    }

    /// Generate reset token
    pub fn generate_reset_token(&self) -> AppResult<String> {
        PasswordManager::generate_reset_token()
    }

    /// Generate email verification token
    pub async fn generate_email_verification_token(
        &self,
        user_id: uuid::Uuid,
        _email: &str,
        db: &crate::database::Database,
    ) -> AppResult<String> {
        use crate::models::schema::email_verification_tokens;
        use crate::models::NewEmailVerificationToken;
        use diesel::prelude::*;
        use sha2::{Digest, Sha256};

        // Generate verification token
        let token = PasswordManager::generate_reset_token()?;

        // Hash the token
        let mut hasher = Sha256::new();
        hasher.update(token.as_bytes());
        let token_hash = format!("{:x}", hasher.finalize());

        // Delete any existing tokens for this user
        diesel::delete(email_verification_tokens::table)
            .filter(email_verification_tokens::user_id.eq(user_id))
            .execute(&mut db.get_connection()?)
            .map_err(AppError::Database)?;

        // Store new token with 24 hour expiration
        let expires_at = chrono::Utc::now() + chrono::Duration::hours(24);
        let new_token = NewEmailVerificationToken {
            user_id,
            token_hash,
            expires_at,
        };

        diesel::insert_into(email_verification_tokens::table)
            .values(new_token)
            .execute(&mut db.get_connection()?)
            .map_err(AppError::Database)?;

        Ok(token)
    }

    /// Verify email with token
    pub async fn verify_email(&self, token: &str, db: &crate::database::Database) -> AppResult<()> {
        use crate::models::schema::email_verification_tokens;
        use crate::models::{EmailVerificationToken, UpdateEmailVerificationToken};
        use diesel::prelude::*;
        use sha2::{Digest, Sha256};

        // Hash the provided token
        let mut hasher = Sha256::new();
        hasher.update(token.as_bytes());
        let token_hash = format!("{:x}", hasher.finalize());

        // Look up the token
        let mut conn = db.get_connection()?;
        let verification_token = email_verification_tokens::table
            .filter(email_verification_tokens::token_hash.eq(&token_hash))
            .first::<EmailVerificationToken>(&mut conn)
            .map_err(|_| {
                AppError::Authentication("Invalid or expired verification token".to_string())
            })?;

        // Check if already verified
        if verification_token.used_at.is_some() {
            return Err(AppError::Authentication(
                "Email already verified".to_string(),
            ));
        }

        // Check if expired
        let now = chrono::Utc::now();
        if verification_token.expires_at < now {
            return Err(AppError::Authentication(
                "Verification token has expired".to_string(),
            ));
        }

        // Mark as verified
        diesel::update(email_verification_tokens::table)
            .filter(email_verification_tokens::id.eq(verification_token.id))
            .set(UpdateEmailVerificationToken { used_at: Some(now) })
            .execute(&mut conn)
            .map_err(AppError::Database)?;

        // Email verification doesn't change email - it just verifies the existing one
        // No need to update email field

        Ok(())
    }
}
