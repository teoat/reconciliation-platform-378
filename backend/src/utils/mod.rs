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
use uuid::Uuid;

/// Extract user ID from request extensions
pub fn extract_user_id(req: &HttpRequest) -> Uuid {
    req.extensions()
        .get::<crate::services::auth::Claims>()
        .map(|claims| uuid::Uuid::parse_str(&claims.sub).unwrap_or_else(|_| uuid::Uuid::new_v4()))
        .unwrap_or_else(|| uuid::Uuid::new_v4())
}
