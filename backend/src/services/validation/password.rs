//! Password validation

use crate::errors::{AppError, AppResult};
use regex::Regex;

pub struct PasswordValidator {
    password_regex: Regex,
}

impl PasswordValidator {
    pub fn new() -> Result<Self, regex::Error> {
        Ok(Self {
            password_regex: Regex::new(
                r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$",
            )?,
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

        if !self.password_regex.is_match(password) {
            return Err(AppError::Validation(
                "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character".to_string()
            ));
        }

        Ok(())
    }
}
