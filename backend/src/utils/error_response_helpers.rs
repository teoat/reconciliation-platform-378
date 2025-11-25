//! Helper functions for creating error responses with correlation IDs

use actix_web::HttpRequest;
use crate::errors::{ErrorResponse, AppError};
use crate::middleware::error_handler::extract_correlation_id_from_request;

/// Create an ErrorResponse with correlation ID extracted from request
pub fn create_error_response_with_correlation(
    req: &HttpRequest,
    error: String,
    message: String,
    code: String,
) -> ErrorResponse {
    let correlation_id = extract_correlation_id_from_request(req);
    ErrorResponse {
        error,
        message,
        code,
        correlation_id,
    }
}

/// Helper to convert AppError to ErrorResponse with correlation ID
pub fn app_error_to_response_with_correlation(
    req: &HttpRequest,
    app_error: &AppError,
) -> ErrorResponse {
    let correlation_id = extract_correlation_id_from_request(req);
    
    let (error, message, code) = match app_error {
        AppError::Database(_) => (
            "Database Error".to_string(),
            "A database error occurred".to_string(),
            "DATABASE_ERROR".to_string(),
        ),
        AppError::Connection(_) => (
            "Connection Error".to_string(),
            "Unable to connect to database".to_string(),
            "CONNECTION_ERROR".to_string(),
        ),
        AppError::Authentication(msg) => (
            "Authentication Error".to_string(),
            msg.clone(),
            "AUTHENTICATION_ERROR".to_string(),
        ),
        AppError::Authorization(msg) => (
            "Authorization Error".to_string(),
            msg.clone(),
            "AUTHORIZATION_ERROR".to_string(),
        ),
        AppError::Validation(msg) | AppError::ValidationError(msg) => (
            "Validation Error".to_string(),
            msg.clone(),
            "VALIDATION_ERROR".to_string(),
        ),
        AppError::NotFound(msg) => (
            "Not Found".to_string(),
            msg.clone(),
            "NOT_FOUND".to_string(),
        ),
        AppError::BadRequest(msg) => (
            "Bad Request".to_string(),
            msg.clone(),
            "BAD_REQUEST".to_string(),
        ),
        AppError::Internal(msg) | AppError::InternalServerError(msg) => (
            "Internal Server Error".to_string(),
            msg.clone(),
            "INTERNAL_ERROR".to_string(),
        ),
        _ => (
            "Error".to_string(),
            format!("{}", app_error),
            "ERROR".to_string(),
        ),
    };
    
    ErrorResponse {
        error,
        message,
        code,
        correlation_id,
    }
}

