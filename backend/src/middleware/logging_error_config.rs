//! Configuration structs for error logging
//!
//! This module provides configuration structs to reduce function argument complexity

use std::collections::HashMap;

/// Configuration for tracking errors
#[derive(Debug, Clone)]
pub struct TrackErrorConfig {
    pub error_type: String,
    pub error_message: String,
    pub stack_trace: Option<String>,
    pub user_id: Option<String>,
    pub request_id: Option<String>,
    pub endpoint: Option<String>,
    pub method: Option<String>,
    pub status_code: Option<u16>,
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}


