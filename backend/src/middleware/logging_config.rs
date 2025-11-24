//! Configuration structs for logging middleware
//!
//! This module provides configuration structs to reduce function argument complexity

use actix_web::http::HeaderMap;
use std::collections::HashMap;

/// Configuration for logging a request
#[derive(Debug, Clone)]
pub struct LogRequestConfig {
    pub request_id: String,
    pub method: String,
    pub path: String,
    pub ip_address: String,
    pub user_agent: Option<String>,
    pub user_id: Option<String>,
    pub headers: Option<HeaderMap>,
    pub body: Option<String>,
}

/// Configuration for logging a response
#[derive(Debug, Clone)]
pub struct LogResponseConfig {
    pub request_id: String,
    pub method: String,
    pub path: String,
    pub status_code: u16,
    pub response_time_ms: u64,
    pub response_body: Option<String>,
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}


