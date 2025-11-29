//! Structured Logging Service
//! JSON logging with ELK/Loki integration

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Log levels
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LogLevel {
    Trace,
    Debug,
    Info,
    Warn,
    Error,
}

/// Structured log entry with correlation ID support
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub timestamp: String,
    pub level: LogLevel,
    pub message: String,
    pub service: String,
    pub correlation_id: Option<String>,
    pub fields: HashMap<String, serde_json::Value>,
}

/// Structured logging service
#[derive(Clone)]
pub struct StructuredLogging {
    service_name: String,
}

impl StructuredLogging {
    pub fn new(service_name: String) -> Self {
        Self { service_name }
    }

    /// Log with optional correlation ID
    pub fn log(&self, level: LogLevel, message: &str, fields: HashMap<String, serde_json::Value>) {
        self.log_with_correlation_id(level, message, None, fields);
    }

    /// Log with correlation ID for distributed tracing
    pub fn log_with_correlation_id(
        &self,
        level: LogLevel,
        message: &str,
        correlation_id: Option<String>,
        mut fields: HashMap<String, serde_json::Value>,
    ) {
        // Add correlation ID to fields if provided
        if let Some(corr_id) = &correlation_id {
            fields.insert(
                "correlation_id".to_string(),
                serde_json::Value::String(corr_id.clone()),
            );
        }

        let entry = LogEntry {
            timestamp: chrono::Utc::now().to_rfc3339(),
            level,
            message: message.to_string(),
            service: self.service_name.clone(),
            correlation_id,
            fields,
        };

        // In production, send to ELK/Loki
        // Format: JSON with structured fields for easy parsing
        let json = serde_json::to_string(&entry).unwrap_or_default();

        // Output to stdout (can be captured by log aggregation systems)
        println!("{}", json);

        // In production, also send to log aggregation service
        // Example: send_to_elk(&entry).await;
    }
}
