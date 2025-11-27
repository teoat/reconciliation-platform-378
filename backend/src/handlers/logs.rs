//! Logging handlers module
//!
//! Provides endpoints for receiving and processing client-side logs

use actix_web::{web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::errors::AppError;
use crate::handlers::types::ApiResponse;

/// Log entry from frontend
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct FrontendLogEntry {
    /// Log level (error, warn, info, debug, trace)
    pub level: String,
    /// Log message
    pub message: String,
    /// Optional timestamp (ISO 8601 format)
    pub timestamp: Option<String>,
    /// Optional metadata as key-value pairs
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

/// Request body for logs endpoint
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct LogsRequest {
    /// Array of log entries to process
    pub logs: Vec<FrontendLogEntry>,
    /// Optional batch timestamp (ISO 8601 format)
    pub timestamp: Option<String>,
}

/// Response for logs endpoint
#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct LogsResponse {
    /// Number of log entries received
    pub received: usize,
    /// Number of log entries processed
    pub processed: usize,
}

/// POST /api/logs - Receive logs from frontend
/// 
/// Accepts client-side log entries and processes them on the backend.
/// Logs are forwarded to the backend logging system based on their level.
#[utoipa::path(
    post,
    path = "/api/logs",
    tag = "Logging",
    request_body = LogsRequest,
    responses(
        (status = 200, description = "Logs processed successfully", body = ApiResponse<LogsResponse>),
        (status = 400, description = "Invalid request body", body = ErrorResponse),
        (status = 422, description = "Validation error", body = ErrorResponse)
    )
)]
pub async fn post_logs(body: web::Json<LogsRequest>) -> Result<HttpResponse, AppError> {
    let logs_count = body.logs.len();
    
    // Process logs (store, forward to logging service, etc.)
    for log_entry in &body.logs {
        // Log to backend logger based on level
        let level = log_entry.level.to_lowercase();
        let message = format!(
            "[Frontend] {}",
            log_entry.message
        );
        
        match level.as_str() {
            "error" | "critical" => {
                log::error!("{}", message);
            }
            "warn" | "warning" => {
                log::warn!("{}", message);
            }
            "info" => {
                log::info!("{}", message);
            }
            "debug" | "trace" => {
                log::debug!("{}", message);
            }
            _ => {
                log::info!("{}", message);
            }
        }
        
        // If metadata exists, log it as well
        if let Some(metadata) = &log_entry.metadata {
            if !metadata.is_empty() {
                log::debug!("Log metadata: {:?}", metadata);
            }
        }
    }
    
    // Validate input
    if logs_count == 0 {
        return Err(AppError::Validation(
            "At least one log entry is required".to_string(),
        ));
    }
    
    if logs_count > 100 {
        return Err(AppError::Validation(
            "Maximum 100 log entries per request".to_string(),
        ));
    }
    
    // Return success response
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(LogsResponse {
            received: logs_count,
            processed: logs_count,
        }),
        message: Some(format!("Successfully processed {} log entries", logs_count)),
        error: None,
    }))
}

