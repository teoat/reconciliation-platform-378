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

    /// Unified password strength validator
    /// Validates password strength with configurable requirements
    pub fn validate_password_strength(password: &str) -> AppResult<()> {
        // Common banned passwords list
        let banned_passwords = vec![
            "password", "12345678", "password123", "admin123", "qwerty123",
            "welcome123", "letmein", "monkey", "dragon", "master",
        ];
        
        let password_lower = password.to_lowercase();
        if banned_passwords.contains(&password_lower.as_str()) {
            return Err(AppError::Validation(
                "Password is too common. Please choose a stronger password.".to_string(),
            ));
        }

        if password.len() < 8 {
            return Err(AppError::Validation(
                "Password must be at least 8 characters long".to_string(),
            ));
        }

        if password.len() > 128 {
            return Err(AppError::Validation(
                "Password must be no more than 128 characters long".to_string(),
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
                "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)".to_string(),
            ));
        }

        // Check for common patterns
        if password.chars().all(|c| c.is_ascii_alphanumeric() || "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(c)) {
            // Check for sequential characters (e.g., "1234", "abcd")
            let chars: Vec<char> = password.chars().collect();
            let mut sequential_count = 1;
            for i in 1..chars.len() {
                if chars[i] as u32 == chars[i-1] as u32 + 1 {
                    sequential_count += 1;
                    if sequential_count >= 4 {
                        return Err(AppError::Validation(
                            "Password contains sequential characters. Please choose a stronger password.".to_string(),
                        ));
                    }
                } else {
                    sequential_count = 1;
                }
            }
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
