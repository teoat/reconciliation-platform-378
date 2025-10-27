//! Structured Logging Service
//! JSON logging with ELK/Loki integration

use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;
use crate::errors::{AppError, AppResult};

/// Log levels
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LogLevel {
    Trace,
    Debug,
    Info,
    Warn,
    Error,
}

/// Structured log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub timestamp: String,
    pub level: LogLevel,
    pub message: String,
    pub service: String,
    pub fields: HashMap<String, serde_json::Value>,
}

/// Structured logging service
pub struct StructuredLogging {
    service_name: String,
}

impl StructuredLogging {
    pub fn new(service_name: String) -> Self {
        Self { service_name }
    }

    pub fn log(&self, level: LogLevel, message: &str, fields: HashMap<String, serde_json::Value>) {
        let entry = LogEntry {
            timestamp: chrono::Utc::now().to_rfc3339(),
            level,
            message: message.to_string(),
            service: self.service_name.clone(),
            fields,
        };

        // In production, send to ELK/Loki
        let json = serde_json::to_string(&entry).unwrap_or_default();
        println!("{}", json);
    }
}

