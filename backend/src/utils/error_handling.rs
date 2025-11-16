// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================
// Provides Result-based error handling to replace unwrap/expect

use serde::{Deserialize, Serialize};
use std::fmt::{Display, Formatter, Result as FmtResult};

/// Standard application error types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppError {
    /// Database errors
    Database(String),
    /// Validation errors
    Validation(String),
    /// Authentication errors
    Authentication(String),
    /// Authorization errors
    Authorization(String),
    /// Not found errors
    NotFound(String),
    /// Internal server errors
    Internal(String),
    /// Network errors
    Network(String),
    /// Timeout errors
    Timeout(String),
    /// Configuration errors
    Configuration(String),
}

impl Display for AppError {
    fn fmt(&self, f: &mut Formatter<'_>) -> FmtResult {
        match self {
            AppError::Database(msg) => write!(f, "Database error: {}", msg),
            AppError::Validation(msg) => write!(f, "Validation error: {}", msg),
            AppError::Authentication(msg) => write!(f, "Authentication error: {}", msg),
            AppError::Authorization(msg) => write!(f, "Authorization error: {}", msg),
            AppError::NotFound(msg) => write!(f, "Not found: {}", msg),
            AppError::Internal(msg) => write!(f, "Internal error: {}", msg),
            AppError::Network(msg) => write!(f, "Network error: {}", msg),
            AppError::Timeout(msg) => write!(f, "Timeout error: {}", msg),
            AppError::Configuration(msg) => write!(f, "Configuration error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

/// Type alias for Result with AppError
pub type AppResult<T> = Result<T, AppError>;

/// Helper trait to convert Option to AppResult
pub trait OptionExt<T> {
    fn ok_or_not_found(self, message: impl Into<String>) -> AppResult<T>;
    fn ok_or_internal(self, message: impl Into<String>) -> AppResult<T>;
}

impl<T> OptionExt<T> for Option<T> {
    fn ok_or_not_found(self, message: impl Into<String>) -> AppResult<T> {
        self.ok_or_else(|| AppError::NotFound(message.into()))
    }

    fn ok_or_internal(self, message: impl Into<String>) -> AppResult<T> {
        self.ok_or_else(|| AppError::Internal(message.into()))
    }
}

/// Helper trait to convert Result to AppResult
pub trait ResultExt<T, E> {
    fn map_to_app_error(self) -> AppResult<T>
    where
        E: Display;

    fn map_to_database_error(self) -> AppResult<T>
    where
        E: Display;

    fn map_to_validation_error(self) -> AppResult<T>
    where
        E: Display;
}

impl<T, E> ResultExt<T, E> for Result<T, E> {
    fn map_to_app_error(self) -> AppResult<T>
    where
        E: Display,
    {
        self.map_err(|e| AppError::Internal(format!("{}", e)))
    }

    fn map_to_database_error(self) -> AppResult<T>
    where
        E: Display,
    {
        self.map_err(|e| AppError::Database(format!("{}", e)))
    }

    fn map_to_validation_error(self) -> AppResult<T>
    where
        E: Display,
    {
        self.map_err(|e| AppError::Validation(format!("{}", e)))
    }
}

/// Helper macro to safely unwrap with context
#[macro_export]
macro_rules! safe_unwrap {
    ($expr:expr, $msg:expr) => {
        $expr.map_err(|e| {
            $crate::utils::error_handling::AppError::Internal(format!("{}: {}", $msg, e))
        })?
    };
}

/// Helper macro for database operations
#[macro_export]
macro_rules! db_result {
    ($expr:expr) => {
        $expr.map_err(|e| $crate::utils::error_handling::AppError::Database(format!("{}", e)))
    };
}

/// Helper macro for validation
#[macro_export]
macro_rules! validate {
    ($condition:expr, $msg:expr) => {
        if !$condition {
            return Err($crate::utils::error_handling::AppError::Validation(
                $msg.into(),
            ));
        }
    };
}

/// Convert Diesel errors to AppError
impl From<diesel::result::Error> for AppError {
    fn from(err: diesel::result::Error) -> Self {
        match err {
            diesel::result::Error::NotFound => AppError::NotFound("Database row not found".into()),
            diesel::result::Error::DatabaseError(kind, ref info) => {
                AppError::Database(format!("Database error ({:?}): {}", kind, info.message()))
            }
            _ => AppError::Database(format!("Database error: {}", err)),
        }
    }
}

/// Convert serde_json errors to AppError
impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::Validation(format!("JSON parsing error: {}", err))
    }
}

/// Convert std::io::Error to AppError
impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Internal(format!("IO error: {}", err))
    }
}

/// Convert Redis errors to AppError
impl From<redis::RedisError> for AppError {
    fn from(err: redis::RedisError) -> Self {
        AppError::Internal(format!("Redis error: {}", err))
    }
}
