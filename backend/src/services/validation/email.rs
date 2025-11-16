//! Email validation

use crate::errors::{AppError, AppResult};
use regex::Regex;

pub struct EmailValidator {
    email_regex: Regex,
}

impl EmailValidator {
    pub fn new() -> Result<Self, regex::Error> {
        Ok(Self {
            email_regex: Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")?,
        })
    }

    pub fn validate(&self, email: &str) -> AppResult<()> {
        if email.is_empty() {
            return Err(AppError::Validation("Email is required".to_string()));
        }

        if !self.email_regex.is_match(email) {
            return Err(AppError::Validation("Invalid email format".to_string()));
        }

        if email.len() > 254 {
            return Err(AppError::Validation("Email is too long".to_string()));
        }

        Ok(())
    }
}
