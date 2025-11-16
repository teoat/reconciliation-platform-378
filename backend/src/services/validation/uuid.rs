//! UUID validation

use crate::errors::{AppError, AppResult};
pub use uuid::Uuid;

pub struct UuidValidator;

impl UuidValidator {
    pub fn new() -> AppResult<Self> {
        Ok(Self)
    }

    pub fn validate(&self, uuid_str: &str) -> AppResult<Uuid> {
        Uuid::parse_str(uuid_str)
            .map_err(|_| AppError::Validation("Invalid UUID format".to_string()))
    }
}
