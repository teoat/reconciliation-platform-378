//! Error handling module for the Reconciliation Backend
//! 
//! This module provides comprehensive error handling with proper error types,
//! error conversion, and standardized error responses.

use actix_web::{HttpResponse, ResponseError};
use serde::{Deserialize, Serialize};
use std::fmt;

/// Main application error type
#[derive(Debug)]
pub enum AppError {
    Database(diesel::result::Error),
    Connection(diesel::ConnectionError),
    Authentication(String),
    Authorization(String),
    Validation(String),
    File(String),
    Config(String),
    Redis(redis::RedisError),
    Jwt(jsonwebtoken::errors::Error),
    Io(std::io::Error),
    Serialization(serde_json::Error),
    Internal(String),
    InternalServerError(String),
    NotFound(String),
    Conflict(String),
    BadRequest(String),
    Unauthorized(String),
    Forbidden(String),
    ServiceUnavailable(String),
    RateLimitExceeded,
    CsrfTokenMissing,
    CsrfTokenInvalid,
    ValidationError(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Database(err) => write!(f, "Database error: {}", err),
            AppError::Connection(err) => write!(f, "Connection error: {}", err),
            AppError::Authentication(msg) => write!(f, "Authentication error: {}", msg),
            AppError::Authorization(msg) => write!(f, "Authorization error: {}", msg),
            AppError::Validation(msg) => write!(f, "Validation error: {}", msg),
            AppError::File(msg) => write!(f, "File error: {}", msg),
            AppError::Config(msg) => write!(f, "Configuration error: {}", msg),
            AppError::Redis(err) => write!(f, "Redis error: {}", err),
            AppError::Jwt(err) => write!(f, "JWT error: {}", err),
            AppError::Io(err) => write!(f, "IO error: {}", err),
            AppError::Serialization(err) => write!(f, "Serialization error: {}", err),
            AppError::Internal(msg) => write!(f, "Internal server error: {}", msg),
            AppError::InternalServerError(msg) => write!(f, "Internal server error: {}", msg),
            AppError::NotFound(msg) => write!(f, "Not found: {}", msg),
            AppError::Conflict(msg) => write!(f, "Conflict: {}", msg),
            AppError::BadRequest(msg) => write!(f, "Bad request: {}", msg),
            AppError::Unauthorized(msg) => write!(f, "Unauthorized: {}", msg),
            AppError::Forbidden(msg) => write!(f, "Forbidden: {}", msg),
            AppError::ServiceUnavailable(msg) => write!(f, "Service unavailable: {}", msg),
            AppError::RateLimitExceeded => write!(f, "Rate limit exceeded"),
            AppError::CsrfTokenMissing => write!(f, "CSRF token missing"),
            AppError::CsrfTokenInvalid => write!(f, "CSRF token invalid"),
            AppError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

// Implement From traits for automatic conversions
impl From<diesel::result::Error> for AppError {
    fn from(err: diesel::result::Error) -> Self {
        AppError::Database(err)
    }
}

impl From<diesel::ConnectionError> for AppError {
    fn from(err: diesel::ConnectionError) -> Self {
        AppError::Connection(err)
    }
}

impl From<redis::RedisError> for AppError {
    fn from(err: redis::RedisError) -> Self {
        AppError::Redis(err)
    }
}

impl From<jsonwebtoken::errors::Error> for AppError {
    fn from(err: jsonwebtoken::errors::Error) -> Self {
        AppError::Jwt(err)
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io(err)
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::Serialization(err)
    }
}

impl From<actix_web::Error> for AppError {
    fn from(err: actix_web::Error) -> Self {
        AppError::Internal(err.to_string())
    }
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        match self {
            AppError::Database(_) => HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Database error".to_string(),
                message: "An internal database error occurred".to_string(),
                code: "DATABASE_ERROR".to_string(),
            }),
            AppError::Connection(_) => HttpResponse::ServiceUnavailable().json(ErrorResponse {
                error: "Connection error".to_string(),
                message: "Unable to connect to database".to_string(),
                code: "CONNECTION_ERROR".to_string(),
            }),
            AppError::Authentication(msg) => HttpResponse::Unauthorized().json(ErrorResponse {
                error: "Authentication error".to_string(),
                message: msg.clone(),
                code: "AUTHENTICATION_ERROR".to_string(),
            }),
            AppError::Authorization(msg) => HttpResponse::Forbidden().json(ErrorResponse {
                error: "Authorization error".to_string(),
                message: msg.clone(),
                code: "AUTHORIZATION_ERROR".to_string(),
            }),
            AppError::Validation(msg) => HttpResponse::BadRequest().json(ErrorResponse {
                error: "Validation error".to_string(),
                message: msg.clone(),
                code: "VALIDATION_ERROR".to_string(),
            }),
            AppError::File(msg) => HttpResponse::BadRequest().json(ErrorResponse {
                error: "File error".to_string(),
                message: msg.clone(),
                code: "FILE_ERROR".to_string(),
            }),
            AppError::Config(msg) => HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Configuration error".to_string(),
                message: msg.clone(),
                code: "CONFIG_ERROR".to_string(),
            }),
            AppError::Redis(_) => HttpResponse::ServiceUnavailable().json(ErrorResponse {
                error: "Redis error".to_string(),
                message: "Cache service unavailable".to_string(),
                code: "REDIS_ERROR".to_string(),
            }),
            AppError::Jwt(_) => HttpResponse::Unauthorized().json(ErrorResponse {
                error: "JWT error".to_string(),
                message: "Invalid or expired token".to_string(),
                code: "JWT_ERROR".to_string(),
            }),
            AppError::Io(_) => HttpResponse::InternalServerError().json(ErrorResponse {
                error: "IO error".to_string(),
                message: "File system error occurred".to_string(),
                code: "IO_ERROR".to_string(),
            }),
            AppError::Serialization(_) => HttpResponse::BadRequest().json(ErrorResponse {
                error: "Serialization error".to_string(),
                message: "Invalid data format".to_string(),
                code: "SERIALIZATION_ERROR".to_string(),
            }),
            AppError::Internal(msg) => HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Internal server error".to_string(),
                message: msg.clone(),
                code: "INTERNAL_ERROR".to_string(),
            }),
            AppError::InternalServerError(msg) => HttpResponse::InternalServerError().json(ErrorResponse {
                error: "Internal server error".to_string(),
                message: msg.clone(),
                code: "INTERNAL_SERVER_ERROR".to_string(),
            }),
            AppError::NotFound(msg) => HttpResponse::NotFound().json(ErrorResponse {
                error: "Not found".to_string(),
                message: msg.clone(),
                code: "NOT_FOUND".to_string(),
            }),
            AppError::Conflict(msg) => HttpResponse::Conflict().json(ErrorResponse {
                error: "Conflict".to_string(),
                message: msg.clone(),
                code: "CONFLICT".to_string(),
            }),
            AppError::BadRequest(msg) => HttpResponse::BadRequest().json(ErrorResponse {
                error: "Bad request".to_string(),
                message: msg.clone(),
                code: "BAD_REQUEST".to_string(),
            }),
            AppError::Unauthorized(msg) => HttpResponse::Unauthorized().json(ErrorResponse {
                error: "Unauthorized".to_string(),
                message: msg.clone(),
                code: "UNAUTHORIZED".to_string(),
            }),
            AppError::Forbidden(msg) => HttpResponse::Forbidden().json(ErrorResponse {
                error: "Forbidden".to_string(),
                message: msg.clone(),
                code: "FORBIDDEN".to_string(),
            }),
            AppError::ServiceUnavailable(msg) => HttpResponse::ServiceUnavailable().json(ErrorResponse {
                error: "Service unavailable".to_string(),
                message: msg.clone(),
                code: "SERVICE_UNAVAILABLE".to_string(),
            }),
            AppError::RateLimitExceeded => HttpResponse::TooManyRequests().json(ErrorResponse {
                error: "Rate limit exceeded".to_string(),
                message: "Too many requests, please try again later".to_string(),
                code: "RATE_LIMIT_EXCEEDED".to_string(),
            }),
            AppError::CsrfTokenMissing => HttpResponse::BadRequest().json(ErrorResponse {
                error: "CSRF token missing".to_string(),
                message: "CSRF token is required for this request".to_string(),
                code: "CSRF_TOKEN_MISSING".to_string(),
            }),
            AppError::CsrfTokenInvalid => HttpResponse::BadRequest().json(ErrorResponse {
                error: "CSRF token invalid".to_string(),
                message: "Invalid CSRF token provided".to_string(),
                code: "CSRF_TOKEN_INVALID".to_string(),
            }),
            AppError::ValidationError(msg) => HttpResponse::BadRequest().json(ErrorResponse {
                error: "Validation error".to_string(),
                message: msg.clone(),
                code: "VALIDATION_ERROR".to_string(),
            }),
        }
    }
}

/// Standardized error response format
#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
    pub code: String,
}

/// Result type alias for convenience
pub type AppResult<T> = Result<T, AppError>;

/// Enhanced error context for better debugging
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorContext {
    pub field: Option<String>,
    pub value: Option<String>,
    pub constraint: Option<String>,
    pub details: Option<String>,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl ErrorContext {
    pub fn new() -> Self {
        Self {
            field: None,
            value: None,
            constraint: None,
            details: None,
            timestamp: chrono::Utc::now(),
        }
    }

    pub fn with_field(mut self, field: impl Into<String>) -> Self {
        self.field = Some(field.into());
        self
    }

    pub fn with_value(mut self, value: impl Into<String>) -> Self {
        self.value = Some(value.into());
        self
    }

    pub fn with_constraint(mut self, constraint: impl Into<String>) -> Self {
        self.constraint = Some(constraint.into());
        self
    }

    pub fn with_details(mut self, details: impl Into<String>) -> Self {
        self.details = Some(details.into());
        self
    }
}

impl Default for ErrorContext {
    fn default() -> Self {
        Self::new()
    }
}

/// Enhanced error response with context
#[derive(Debug, Serialize, Deserialize)]
pub struct EnhancedErrorResponse {
    pub error: String,
    pub message: String,
    pub code: String,
    pub context: Option<ErrorContext>,
    pub request_id: Option<String>,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl EnhancedErrorResponse {
    pub fn new(error: String, message: String, code: String) -> Self {
        Self {
            error,
            message,
            code,
            context: None,
            request_id: None,
            timestamp: chrono::Utc::now(),
        }
    }

    pub fn with_context(mut self, context: ErrorContext) -> Self {
        self.context = Some(context);
        self
    }

    pub fn with_request_id(mut self, request_id: impl Into<String>) -> Self {
        self.request_id = Some(request_id.into());
        self
    }
}