//! Error handling module for the Reconciliation Backend
//!
//! This module provides comprehensive error handling with proper error types,
//! error conversion, and standardized error responses.

use actix_web::{HttpResponse, ResponseError};
use serde::{Deserialize, Serialize};
use std::fmt;
use std::sync::OnceLock;

// Shared error translation service instance
static ERROR_TRANSLATOR: OnceLock<crate::services::error_translation::ErrorTranslationService> =
    OnceLock::new();

fn get_error_translator() -> &'static crate::services::error_translation::ErrorTranslationService {
    ERROR_TRANSLATOR.get_or_init(crate::services::error_translation::ErrorTranslationService::new)
}

/// Helper function to translate error code to user-friendly message
fn translate_error_code(code: &str, default_message: &str) -> (String, String) {
    let translator = get_error_translator();
    let empty_context = crate::services::error_translation::ErrorContext {
        user_id: None,
        project_id: None,
        workflow_stage: None,
        action: None,
        resource_type: None,
        resource_id: None,
    };
    let friendly =
        translator.translate_error(code, empty_context, Some(default_message.to_string()));
    (friendly.title, friendly.message)
}

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
    Timeout,
    Alert(String),
    Offline(String),
    OptimisticUpdate(String),
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
            AppError::Timeout => write!(f, "Request timeout"),
            AppError::Alert(msg) => write!(f, "Alert: {}", msg),
            AppError::Offline(msg) => write!(f, "Offline error: {}", msg),
            AppError::OptimisticUpdate(msg) => write!(f, "Optimistic update error: {}", msg),
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
        // ✅ ERROR TRANSLATION: Use translation service for user-friendly messages
        // Note: Correlation ID will be added by ErrorHandlerMiddleware
        // This ensures correlation IDs flow through all error paths
        match self {
            AppError::Database(err) => {
                let translator = get_error_translator();
                let empty_context = crate::services::error_translation::ErrorContext {
                    user_id: None,
                    project_id: None,
                    workflow_stage: None,
                    action: None,
                    resource_type: None,
                    resource_id: None,
                };
                let friendly = translator.translate_database_error(err, empty_context);
                HttpResponse::InternalServerError().json(ErrorResponse {
                    error: friendly.title,
                    message: friendly.message,
                    code: friendly.code,
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::Connection(_) => {
                let (title, message) =
                    translate_error_code("CONNECTION_ERROR", "Unable to connect to database");
                HttpResponse::ServiceUnavailable().json(ErrorResponse {
                    error: title,
                    message,
                    code: "CONNECTION_ERROR".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::Authentication(msg) => {
                let (title, _) = translate_error_code("UNAUTHORIZED", msg);
                HttpResponse::Unauthorized().json(ErrorResponse {
                    error: title,
                    message: msg.clone(),
                    code: "AUTHENTICATION_ERROR".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::Authorization(msg) => {
                let (title, _) = translate_error_code("FORBIDDEN", msg);
                HttpResponse::Forbidden().json(ErrorResponse {
                    error: title,
                    message: msg.clone(),
                    code: "AUTHORIZATION_ERROR".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::Validation(msg) | AppError::ValidationError(msg) => {
                let (title, _) = translate_error_code("VALIDATION_ERROR", msg);
                HttpResponse::BadRequest().json(ErrorResponse {
                    error: title,
                    message: msg.clone(),
                    code: "VALIDATION_ERROR".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::File(msg) => {
                let (title, _) = translate_error_code("FILE_ERROR", msg);
                HttpResponse::BadRequest().json(ErrorResponse {
                    error: title,
                    message: msg.clone(),
                    code: "FILE_ERROR".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::Config(msg) => {
                let (title, message) = translate_error_code("CONFIG_ERROR", msg);
                HttpResponse::InternalServerError().json(ErrorResponse {
                    error: title,
                    message,
                    code: "CONFIG_ERROR".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::Redis(_) => {
                let (title, message) =
                    translate_error_code("REDIS_ERROR", "Cache service unavailable");
                HttpResponse::ServiceUnavailable().json(ErrorResponse {
                    error: title,
                    message,
                    code: "REDIS_ERROR".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::Jwt(_) => {
                let (title, message) =
                    translate_error_code("INVALID_TOKEN", "Invalid or expired token");
                HttpResponse::Unauthorized().json(ErrorResponse {
                    error: title,
                    message,
                    code: "JWT_ERROR".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::Io(_) => {
                let (title, message) =
                    translate_error_code("IO_ERROR", "File system error occurred");
                HttpResponse::InternalServerError().json(ErrorResponse {
                    error: title,
                    message,
                    code: "IO_ERROR".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::Serialization(_) => {
                let (title, message) =
                    translate_error_code("SERIALIZATION_ERROR", "Invalid data format");
                HttpResponse::BadRequest().json(ErrorResponse {
                    error: title,
                    message,
                    code: "SERIALIZATION_ERROR".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::Internal(msg) | AppError::InternalServerError(msg) => {
                let (title, _) = translate_error_code("INTERNAL_ERROR", msg);
                HttpResponse::InternalServerError().json(ErrorResponse {
                    error: title,
                    message: msg.clone(),
                    code: "INTERNAL_ERROR".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::NotFound(msg) => {
                let (title, _) = translate_error_code("NOT_FOUND", msg);
                HttpResponse::NotFound().json(ErrorResponse {
                    error: title,
                    message: msg.clone(),
                    code: "NOT_FOUND".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::Conflict(msg) => {
                let (title, _) = translate_error_code("CONFLICT", msg);
                HttpResponse::Conflict().json(ErrorResponse {
                    error: title,
                    message: msg.clone(),
                    code: "CONFLICT".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::BadRequest(msg) => {
                let (title, _) = translate_error_code("BAD_REQUEST", msg);
                HttpResponse::BadRequest().json(ErrorResponse {
                    error: title,
                    message: msg.clone(),
                    code: "BAD_REQUEST".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::Unauthorized(msg) => {
                let (title, _) = translate_error_code("UNAUTHORIZED", msg);
                HttpResponse::Unauthorized().json(ErrorResponse {
                    error: title,
                    message: msg.clone(),
                    code: "UNAUTHORIZED".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::Forbidden(msg) => {
                let (title, _) = translate_error_code("FORBIDDEN", msg);
                HttpResponse::Forbidden().json(ErrorResponse {
                    error: title,
                    message: msg.clone(),
                    code: "FORBIDDEN".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::ServiceUnavailable(msg) => {
                let (title, _) = translate_error_code("SERVICE_UNAVAILABLE", msg);
                HttpResponse::ServiceUnavailable().json(ErrorResponse {
                    error: title,
                    message: msg.clone(),
                    code: "SERVICE_UNAVAILABLE".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::RateLimitExceeded => {
                let (title, message) = translate_error_code(
                    "RATE_LIMIT_EXCEEDED",
                    "Too many requests, please try again later",
                );
                HttpResponse::TooManyRequests().json(ErrorResponse {
                    error: title,
                    message,
                    code: "RATE_LIMIT_EXCEEDED".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::CsrfTokenMissing => {
                let (title, message) = translate_error_code(
                    "CSRF_TOKEN_MISSING",
                    "CSRF token is required for this request",
                );
                HttpResponse::BadRequest().json(ErrorResponse {
                    error: title,
                    message,
                    code: "CSRF_TOKEN_MISSING".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::CsrfTokenInvalid => {
                let (title, message) =
                    translate_error_code("CSRF_TOKEN_INVALID", "Invalid CSRF token provided");
                HttpResponse::BadRequest().json(ErrorResponse {
                    error: title,
                    message,
                    code: "CSRF_TOKEN_INVALID".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::Timeout => {
                let (title, message) = translate_error_code("TIMEOUT", "The request timed out");
                HttpResponse::RequestTimeout().json(ErrorResponse {
                    error: title,
                    message,
                    code: "TIMEOUT".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::Alert(msg) => {
                let (title, message) = translate_error_code("ALERT", msg);
                HttpResponse::InternalServerError().json(ErrorResponse {
                    error: title,
                    message,
                    code: "ALERT".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::Offline(msg) => {
                let (title, message) = translate_error_code("OFFLINE", msg);
                HttpResponse::ServiceUnavailable().json(ErrorResponse {
                    error: title,
                    message,
                    code: "OFFLINE".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
            AppError::OptimisticUpdate(msg) => {
                let (title, message) = translate_error_code("OPTIMISTIC_UPDATE", msg);
                HttpResponse::Conflict().json(ErrorResponse {
                    error: title,
                    message,
                    code: "OPTIMISTIC_UPDATE".to_string(),
                    correlation_id: None, // Will be set by ErrorHandlerMiddleware
                })
            }
        }
    }
}

/// Standardized error response format
#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
    pub code: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation_id: Option<String>,
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

// From implementations for service errors
impl From<crate::services::critical_alerts::AlertError> for AppError {
    fn from(err: crate::services::critical_alerts::AlertError) -> Self {
        AppError::Alert(err.to_string())
    }
}

impl From<crate::services::offline_persistence::OfflineError> for AppError {
    fn from(err: crate::services::offline_persistence::OfflineError) -> Self {
        AppError::Offline(err.to_string())
    }
}

impl From<crate::services::optimistic_ui::OptimisticUpdateError> for AppError {
    fn from(err: crate::services::optimistic_ui::OptimisticUpdateError) -> Self {
        AppError::OptimisticUpdate(err.to_string())
    }
}
