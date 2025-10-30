//! Utility modules for the Reconciliation Backend

pub mod file;
pub mod validation;
pub mod crypto;
pub mod date;
pub mod string;
pub mod authorization;

// Re-export commonly used utilities
pub use file::*;
pub use validation::*;
pub use crypto::*;
pub use date::*;
pub use string::*;
pub use authorization::*;

use actix_web::{HttpRequest, HttpMessage};

/// Extract user ID from request extensions
/// Returns error if authentication is missing or invalid
pub fn extract_user_id(req: &HttpRequest) -> Result<uuid::Uuid, crate::errors::AppError> {
    req.extensions()
        .get::<crate::services::auth::Claims>()
        .map(|claims| uuid::Uuid::parse_str(&claims.sub))
        .ok_or_else(|| crate::errors::AppError::Unauthorized("Missing authentication".to_string()))?
        .map_err(|_| crate::errors::AppError::Unauthorized("Invalid user ID".to_string()))
}
