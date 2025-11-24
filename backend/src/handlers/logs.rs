//! Logging handlers module
//!
//! Provides endpoints for receiving and processing client-side logs

use actix_web::{web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::errors::AppError;
use crate::handlers::types::ApiResponse;

/// Log entry from frontend
#[derive(Debug, Deserialize)]
pub struct FrontendLogEntry {
    pub level: String,
    pub message: String,
    #[allow(dead_code)]
    pub timestamp: Option<String>,
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

/// Request body for logs endpoint
#[derive(Debug, Deserialize)]
pub struct LogsRequest {
    pub logs: Vec<crate::handlers::logs::FrontendLogEntry>,
    pub timestamp: Option<String>,
}

/// Response for logs endpoint
#[derive(Debug, Serialize)]
struct LogsResponse {
    received: usize,
    processed: usize,
}

/// POST /api/logs - Receive logs from frontend
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

