//! Validation utilities

use crate::errors::{AppError, AppResult};

/// Validation utilities
pub struct ValidationUtils;

impl ValidationUtils {
    /// Validate email format
    pub fn validate_email(email: &str) -> AppResult<()> {
        crate::utils::validation::validate_email(email)
            .map_err(|e| AppError::Validation(e))
    }

    /// Validate password strength
    pub fn validate_password(password: &str) -> AppResult<()> {
        crate::utils::validation::validate_password(password)
            .map_err(|e| AppError::Validation(e))
    }

    /// Sanitize string
    pub fn sanitize_string(s: &str) -> String {
        crate::utils::string::sanitize_string(s)
    }

    /// Validate pagination parameters
    pub fn validate_pagination(
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<(i64, i64)> {
        let page = page.unwrap_or(1).max(1);
        let per_page = per_page.unwrap_or(20).max(1).min(100);
        Ok((page, per_page))
    }
}

