//! Enhanced authentication service with session management
//!
//! Provides extended authentication features including session management,
//! password reset, and email verification.

use crate::database::{Database, transaction::with_transaction};
use crate::errors::{AppError, AppResult};
use crate::services::auth::{password::PasswordManager, types::SessionInfo};
use crate::models::{User, NewUserSession, UserSession, UpdateUserSession, TwoFactorAuth};
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
use crate::models::schema::user_sessions;
use uuid::Uuid;
use std::sync::Arc;
use super::two_factor::TwoFactorAuthService;

/// Enhanced authentication service with session management
///
/// Provides extended authentication features including session management,
/// password reset, and email verification.
#[derive(Clone)]
pub struct EnhancedAuthService {
    #[allow(dead_code)]
    jwt_secret: String,
    #[allow(dead_code)]
    jwt_expiration: i64,
    pub session_timeout: i64,
    #[allow(dead_code)]
    pub password_reset_timeout: i64,
    pub session_rotation_interval: i64,
    db: Arc<Database>, // Add database field
    two_factor_service: Arc<TwoFactorAuthService>, // Add 2FA service field
}

impl EnhancedAuthService {
    pub fn new(jwt_secret: String, jwt_expiration: i64, db: Arc<Database>) -> Self {
        Self {
            jwt_secret,
            jwt_expiration,
            session_timeout: 3600,          // 1 hour
            password_reset_timeout: 1800,   // 30 minutes
            session_rotation_interval: 900, // Rotate session every 15 minutes
            two_factor_service: Arc::new(TwoFactorAuthService::new(Arc::clone(&db))), // Initialize 2FA service
            db,
        }
    }

    /// Rotate session token for security
    pub fn should_rotate_session(&self, created_at: chrono::DateTime<chrono::Utc>) -> bool {
        let now = chrono::Utc::now();
        let elapsed = now.signed_duration_since(created_at);
        elapsed.num_seconds() >= self.session_rotation_interval
    }

    /// Create user session and persist to database
    pub async fn create_session(
        &self,
        user: &User,
        db: &Database,
        ip_address: Option<String>,
        user_agent: Option<String>,
    ) -> AppResult<SessionInfo> {
        let now = chrono::Utc::now();
        let expires_at = now + chrono::Duration::seconds(self.session_timeout);

        // Generate secure session token and refresh token
        let session_token = PasswordManager::generate_reset_token()?;
        let refresh_token = PasswordManager::generate_reset_token()?;

        let new_session = NewUserSession {
            user_id: user.id,
            session_token: session_token.clone(),
            refresh_token: Some(refresh_token.clone()),
            ip_address, // Pass the IP address
            user_agent, // Pass the user agent
            device_info: None, // Can be extended later
            is_active: true,
            expires_at,
            last_activity: now,
        };

        let created_session = with_transaction(db.get_pool(), |tx| {
            diesel::insert_into(user_sessions::table)
                .values(new_session)
                .get_result::<UserSession>(tx)
                .map_err(AppError::Database)
        })
        .await?;

        Ok(SessionInfo {
            user_id: user.id,
            email: user.email.clone(),
            role: user.status.clone(),
            created_at: created_session.created_at,
            expires_at: created_session.expires_at,
            last_activity: created_session.last_activity,
            session_token, // Return the actual session token
            refresh_token: Some(refresh_token), // Return the actual refresh token
        })
    }

    /// Generate new session with rotation
    pub async fn create_rotated_session(
        &self,
        user: &User,
        db: &Database,
        current_refresh_token: &str,
        ip_address: Option<String>,
        user_agent: Option<String>,
    ) -> AppResult<SessionInfo> {
        // Invalidate the old refresh token (mark as used/inactive)
        with_transaction(db.get_pool(), |tx| {
            diesel::update(user_sessions::table)
                .filter(user_sessions::refresh_token.eq(current_refresh_token))
                .set((user_sessions::is_active.eq(false), user_sessions::updated_at.eq(chrono::Utc::now())))
                .execute(tx)
                .map_err(AppError::Database)
        }).await?;

        // Create a new session with new tokens
        self.create_session(user, db, ip_address, user_agent).await
    }

    /// Generate password reset token
    pub async fn generate_password_reset_token(
        &self,
        email: &str,
        db: &Database,
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
        db: &Database,
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
        crate::services::auth::roles::RoleManager::check_permission(user_role, resource, action)
    }

    /// Get user permissions
    pub fn get_user_permissions(&self, user_role: &str) -> Vec<String> {
        crate::services::auth::roles::RoleManager::get_user_permissions(user_role)
    }

    /// Generate API key
    pub async fn generate_api_key(
        &self,
        _user_id: uuid::Uuid,
        _description: &str,
        _db: &Database,
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
        db: &Database,
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
    pub async fn verify_email(&self, token: &str, db: &Database) -> AppResult<()> {
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

    /// Validate a refresh token and return the associated user session
    pub async fn validate_refresh_token(&self, db: &Database, refresh_token: &str) -> AppResult<UserSession> {
        let mut conn = db.get_connection()?;
        let now = chrono::Utc::now();

        let session = user_sessions::table
            .filter(user_sessions::refresh_token.eq(refresh_token))
            .filter(user_sessions::is_active.eq(true))
            .filter(user_sessions::expires_at.gt(now))
            .first::<UserSession>(&mut conn)
            .map_err(|_| AppError::Authentication("Invalid or expired refresh token".to_string()))?;

        Ok(session)
    }

    /// Invalidate a specific refresh token
    pub async fn invalidate_refresh_token(&self, db: &Database, refresh_token: &str) -> AppResult<()> {
        with_transaction(db.get_pool(), |tx| {
            diesel::update(user_sessions::table)
                .filter(user_sessions::refresh_token.eq(refresh_token))
                .set((user_sessions::is_active.eq(false), user_sessions::updated_at.eq(chrono::Utc::now())))
                .execute(tx)
                .map_err(AppError::Database)
        }).await?;
        Ok(())
    }

    /// Invalidate all refresh tokens for a given user (e.g., on password change or logout all devices)
    pub async fn invalidate_all_user_refresh_tokens(&self, db: &Database, user_id: Uuid) -> AppResult<()> {
        with_transaction(db.get_pool(), |tx| {
            diesel::update(user_sessions::table)
                .filter(user_sessions::user_id.eq(user_id))
                .set((user_sessions::is_active.eq(false), user_sessions::updated_at.eq(chrono::Utc::now())))
                .execute(tx)
                .map_err(AppError::Database)
        }).await?;
        Ok(())
    }

    /// Delegate to 2FA service - Get or create 2FA record
    pub async fn get_or_create_2fa_record(&self, user_id: Uuid) -> AppResult<TwoFactorAuth> {
        self.two_factor_service.get_or_create_2fa_record(user_id).await
    }

    /// Delegate to 2FA service - Generate TOTP secret and QR code
    pub async fn generate_totp_secret_and_qr(
        &self,
        user_id: Uuid,
        user_email: &str,
    ) -> AppResult<(String, String)> {
        self.two_factor_service.generate_totp_secret_and_qr(user_id, user_email).await
    }

    /// Delegate to 2FA service - Verify TOTP code
    pub async fn verify_totp_code(&self, user_id: Uuid, code: &str) -> AppResult<bool> {
        self.two_factor_service.verify_totp_code(user_id, code).await
    }

    /// Delegate to 2FA service - Enable 2FA
    pub async fn enable_2fa(&self, user_id: Uuid) -> AppResult<()> {
        self.two_factor_service.enable_2fa(user_id).await
    }

    /// Delegate to 2FA service - Disable 2FA
    pub async fn disable_2fa(&self, user_id: Uuid) -> AppResult<()> {
        self.two_factor_service.disable_2fa(user_id).await
    }

    /// Delegate to 2FA service - Generate recovery codes
    pub async fn generate_recovery_codes(&self, user_id: Uuid) -> AppResult<Vec<String>> {
        self.two_factor_service.generate_recovery_codes(user_id).await
    }

    /// Delegate to 2FA service - Verify recovery code
    pub async fn verify_recovery_code(&self, user_id: Uuid, code: &str) -> AppResult<bool> {
        self.two_factor_service.verify_recovery_code(user_id, code).await
    }

    /// Delegate to 2FA service - Check if 2FA is enabled
    pub async fn is_2fa_enabled(&self, user_id: Uuid) -> AppResult<bool> {
        self.two_factor_service.is_2fa_enabled(user_id).await
    }
}


