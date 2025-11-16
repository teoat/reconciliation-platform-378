//! Password hashing and validation

use crate::errors::{AppError, AppResult};
use bcrypt::{hash, verify, DEFAULT_COST};
use rand::distributions::Alphanumeric;
use rand::Rng;

/// Password manager
pub struct PasswordManager;

impl PasswordManager {
    /// Hash a password using bcrypt
    pub fn hash_password(password: &str) -> AppResult<String> {
        hash(password, DEFAULT_COST)
            .map_err(|e| AppError::Internal(format!("Password hashing failed: {}", e)))
    }

    /// Verify a password against its hash
    pub fn verify_password(password: &str, hash: &str) -> AppResult<bool> {
        verify(password, hash)
            .map_err(|e| AppError::Internal(format!("Password verification failed: {}", e)))
    }

    /// Validate password strength
    pub fn validate_password_strength(password: &str) -> AppResult<()> {
        if password.len() < 8 {
            return Err(AppError::Validation(
                "Password must be at least 8 characters long".to_string(),
            ));
        }

        if !password.chars().any(|c| c.is_uppercase()) {
            return Err(AppError::Validation(
                "Password must contain at least one uppercase letter".to_string(),
            ));
        }

        if !password.chars().any(|c| c.is_lowercase()) {
            return Err(AppError::Validation(
                "Password must contain at least one lowercase letter".to_string(),
            ));
        }

        if !password.chars().any(|c| c.is_numeric()) {
            return Err(AppError::Validation(
                "Password must contain at least one number".to_string(),
            ));
        }

        if !password
            .chars()
            .any(|c| "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(c))
        {
            return Err(AppError::Validation(
                "Password must contain at least one special character".to_string(),
            ));
        }

        Ok(())
    }

    /// Generate a secure random token for password reset
    pub fn generate_reset_token() -> AppResult<String> {
        let token: String = rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(32)
            .map(char::from)
            .collect();

        Ok(token)
    }
}
