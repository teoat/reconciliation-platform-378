//! Password validation

use crate::errors::{AppError, AppResult};
use regex::Regex;

pub struct PasswordValidator {
    password_regex: Regex,
}

impl PasswordValidator {
    pub fn new() -> Result<Self, regex::Error> {
        // Regex for allowed characters only (no look-ahead assertions)
        // Rust's regex crate doesn't support look-ahead, so we validate requirements separately
        Ok(Self {
            password_regex: Regex::new(r"^[A-Za-z\d@$!%*?&]{8,}$")?,
        })
    }

    pub fn with_regex(password_regex: Regex) -> Self {
        Self { password_regex }
    }

    pub fn validate(&self, password: &str) -> AppResult<()> {
        if password.is_empty() {
            return Err(AppError::Validation("Password is required".to_string()));
        }

        if password.len() < 8 {
            return Err(AppError::Validation(
                "Password must be at least 8 characters long".to_string(),
            ));
        }

        if password.len() > 128 {
            return Err(AppError::Validation("Password is too long".to_string()));
        }

        // Check allowed characters only
        if !self.password_regex.is_match(password) {
            return Err(AppError::Validation(
                "Password contains invalid characters. Only letters, digits, and @$!%*?& are allowed".to_string()
            ));
        }

        // Manual validation for required character types (replaces look-ahead assertions)
        let has_lowercase = password.chars().any(|c| c.is_ascii_lowercase());
        let has_uppercase = password.chars().any(|c| c.is_ascii_uppercase());
        let has_digit = password.chars().any(|c| c.is_ascii_digit());
        let has_special = password.chars().any(|c| matches!(c, '@' | '$' | '!' | '%' | '*' | '?' | '&'));

        if !has_lowercase || !has_uppercase || !has_digit || !has_special {
            return Err(AppError::Validation(
                "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character (@$!%*?&)".to_string()
            ));
        }

        Ok(())
    }
}
