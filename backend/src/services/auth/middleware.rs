//! Security middleware and CORS configuration

use actix_web::HttpRequest;
use crate::errors::{AppError, AppResult};

/// Security middleware utilities
pub struct SecurityMiddleware;

impl SecurityMiddleware {
    /// Validate request headers for security
    pub fn validate_headers(req: &HttpRequest) -> AppResult<()> {
        // Check for required headers
        if req.headers().get("user-agent").is_none() {
            return Err(AppError::BadRequest(
                "User-Agent header is required".to_string(),
            ));
        }

        // Check for suspicious patterns
        if let Some(user_agent) = req.headers().get("user-agent") {
            let ua_str = user_agent.to_str().unwrap_or("");
            if ua_str.contains("bot") || ua_str.contains("crawler") {
                return Err(AppError::BadRequest(
                    "Automated requests not allowed".to_string(),
                ));
            }
        }

        Ok(())
    }

    /// Rate limiting check (basic implementation)
    pub fn check_rate_limit(_req: &HttpRequest) -> AppResult<()> {
        // Note: Rate limiting is now handled by the SecurityMiddleware with Redis support
        // This is a legacy method maintained for backward compatibility
        Ok(())
    }

    /// Validate file upload security
    pub fn validate_file_upload(
        filename: &str,
        content_type: &str,
        size: usize,
    ) -> AppResult<()> {
        // Check file extension
        let allowed_extensions = ["csv", "xlsx", "xls", "json", "txt"];
        let extension = filename.split('.').last().unwrap_or("").to_lowercase();

        if !allowed_extensions.contains(&extension.as_str()) {
            return Err(AppError::Validation(format!(
                "File type .{} not allowed",
                extension
            )));
        }

        // Check content type
        let allowed_types = [
            "text/csv",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/json",
            "text/plain",
        ];

        if !allowed_types.contains(&content_type) {
            return Err(AppError::Validation(format!(
                "Content type {} not allowed",
                content_type
            )));
        }

        // Check file size (10MB limit)
        if size > 10 * 1024 * 1024 {
            return Err(AppError::Validation(
                "File size exceeds 10MB limit".to_string(),
            ));
        }

        Ok(())
    }
}

/// CORS configuration
pub struct CorsConfig;

impl CorsConfig {
    pub fn get_allowed_origins() -> Vec<String> {
        std::env::var("CORS_ORIGINS")
            .unwrap_or_else(|_| "http://localhost:3000,http://localhost:5173".to_string())
            .split(',')
            .map(|s| s.trim().to_string())
            .collect()
    }

    pub fn get_allowed_methods() -> Vec<String> {
        vec![
            "GET".to_string(),
            "POST".to_string(),
            "PUT".to_string(),
            "DELETE".to_string(),
            "OPTIONS".to_string(),
        ]
    }

    pub fn get_allowed_headers() -> Vec<String> {
        vec![
            "Content-Type".to_string(),
            "Authorization".to_string(),
            "X-Requested-With".to_string(),
        ]
    }
}

