//! Error Logging Service with Correlation IDs
//!
//! This service provides centralized error logging with correlation IDs for
//! distributed tracing and better error tracking across the application.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::fs::OpenOptions;
use tokio::io::AsyncWriteExt;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Error log entry with correlation ID
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorLogEntry {
    pub id: String,
    pub correlation_id: String,
    pub timestamp: DateTime<Utc>,
    pub level: ErrorLevel,
    pub error_type: String,
    pub message: String,
    pub service: String,
    pub operation: Option<String>,
    pub user_id: Option<String>,
    pub request_id: Option<String>,
    pub endpoint: Option<String>,
    pub method: Option<String>,
    pub status_code: Option<u16>,
    pub stack_trace: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub context: HashMap<String, String>,
}

/// Error severity levels
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ErrorLevel {
    Debug,
    Info,
    Warning,
    Error,
    Critical,
}

/// Error logging configuration
#[derive(Debug, Clone)]
pub struct ErrorLoggingConfig {
    pub service_name: String,
    pub max_log_entries: usize,
    pub enable_structured_logging: bool,
    pub enable_correlation_tracking: bool,
    pub log_to_console: bool,
    pub log_to_file: bool,
    pub log_file_path: Option<String>,
}

impl Default for ErrorLoggingConfig {
    fn default() -> Self {
        Self {
            service_name: "reconciliation-backend".to_string(),
            max_log_entries: 10000,
            enable_structured_logging: true,
            enable_correlation_tracking: true,
            log_to_console: true,
            log_to_file: false,
            log_file_path: None,
        }
    }
}

/// Error logging service
pub struct ErrorLoggingService {
    config: ErrorLoggingConfig,
    log_entries: Arc<RwLock<Vec<ErrorLogEntry>>>,
    correlation_context: Arc<RwLock<HashMap<String, CorrelationContext>>>,
}

/// Correlation context for tracking related operations
#[derive(Debug, Clone)]
pub struct CorrelationContext {
    pub correlation_id: String,
    pub parent_correlation_id: Option<String>,
    pub start_time: DateTime<Utc>,
    pub operation_stack: Vec<String>,
    pub metadata: HashMap<String, String>,
}

impl ErrorLoggingService {
    /// Create new error logging service
    pub fn new(config: ErrorLoggingConfig) -> Self {
        Self {
            config,
            log_entries: Arc::new(RwLock::new(Vec::new())),
            correlation_context: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Log an error with correlation ID (auto-extracts from request context if available)
    pub async fn log_error(
        &self,
        correlation_id: &str,
        error_type: &str,
        message: &str,
        level: ErrorLevel,
        context: ErrorContext,
    ) {
        let entry = ErrorLogEntry {
            id: Uuid::new_v4().to_string(),
            correlation_id: correlation_id.to_string(),
            timestamp: Utc::now(),
            level,
            error_type: error_type.to_string(),
            message: message.to_string(),
            service: self.config.service_name.clone(),
            operation: context.operation,
            user_id: context.user_id,
            request_id: context.request_id,
            endpoint: context.endpoint,
            method: context.method,
            status_code: context.status_code,
            stack_trace: context.stack_trace,
            metadata: context.metadata,
            context: context.additional_context,
        };

        // Store in memory
        self.store_log_entry(entry.clone()).await;

        // Log to configured outputs
        if self.config.enable_structured_logging {
            self.log_to_outputs(&entry).await;
        }
    }

    /// Log error with automatic correlation ID generation
    /// Tries to extract correlation ID from request context if available
    pub async fn log_error_auto_correlation(
        &self,
        error_type: &str,
        message: &str,
        level: ErrorLevel,
        mut context: ErrorContext,
    ) {
        // Try to get correlation ID from context first, generate if not available
        let correlation_id = if let Some(id) = context.request_id.clone() {
            id
        } else {
            self.generate_correlation_id().await
        };

        // Ensure correlation ID is set in context
        context.request_id = Some(correlation_id.clone());

        self.log_error(&correlation_id, error_type, message, level, context)
            .await;
    }

    /// Log error from AppError with automatic correlation ID extraction
    pub async fn log_app_error(
        &self,
        error: &crate::errors::AppError,
        correlation_id: Option<String>,
        context: ErrorContext,
    ) {
        let corr_id = correlation_id.unwrap_or_else(|| {
            // Try to extract from context, otherwise generate
            context.request_id.clone().unwrap_or_else(|| {
                // Generate synchronously for immediate use
                Uuid::new_v4().to_string()
            })
        });

        let (error_type, message, level) = match error {
            crate::errors::AppError::Database(_) => {
                ("DatabaseError", error.to_string(), ErrorLevel::Error)
            }
            crate::errors::AppError::Connection(_) => {
                ("ConnectionError", error.to_string(), ErrorLevel::Critical)
            }
            crate::errors::AppError::Authentication(_) => (
                "AuthenticationError",
                error.to_string(),
                ErrorLevel::Warning,
            ),
            crate::errors::AppError::Authorization(_) => {
                ("AuthorizationError", error.to_string(), ErrorLevel::Warning)
            }
            crate::errors::AppError::Validation(_) => {
                ("ValidationError", error.to_string(), ErrorLevel::Warning)
            }
            crate::errors::AppError::Internal(_)
            | crate::errors::AppError::InternalServerError(_) => {
                ("InternalError", error.to_string(), ErrorLevel::Error)
            }
            crate::errors::AppError::NotFound(_) => {
                ("NotFoundError", error.to_string(), ErrorLevel::Info)
            }
            _ => ("UnknownError", error.to_string(), ErrorLevel::Error),
        };

        self.log_error(&corr_id, error_type, &message, level, context)
            .await;
    }

    /// Start a new correlation context
    pub async fn start_correlation_context(
        &self,
        operation: &str,
        parent_correlation_id: Option<String>,
    ) -> String {
        let correlation_id = Uuid::new_v4().to_string();
        let context = CorrelationContext {
            correlation_id: correlation_id.clone(),
            parent_correlation_id,
            start_time: Utc::now(),
            operation_stack: vec![operation.to_string()],
            metadata: HashMap::new(),
        };

        let mut contexts = self.correlation_context.write().await;
        contexts.insert(correlation_id.clone(), context);

        correlation_id
    }

    /// Add operation to correlation context
    pub async fn push_operation(&self, correlation_id: &str, operation: &str) {
        let mut contexts = self.correlation_context.write().await;
        if let Some(context) = contexts.get_mut(correlation_id) {
            context.operation_stack.push(operation.to_string());
        }
    }

    /// Remove operation from correlation context
    pub async fn pop_operation(&self, correlation_id: &str) {
        let mut contexts = self.correlation_context.write().await;
        if let Some(context) = contexts.get_mut(correlation_id) {
            context.operation_stack.pop();
        }
    }

    /// End correlation context and log duration
    pub async fn end_correlation_context(&self, correlation_id: &str) {
        let mut contexts = self.correlation_context.write().await;
        if let Some(context) = contexts.remove(correlation_id) {
            let duration = Utc::now().signed_duration_since(context.start_time);
            log::info!(
                "Correlation context {} completed in {}ms",
                correlation_id,
                duration.num_milliseconds()
            );
        }
    }

    /// Get correlation context
    pub async fn get_correlation_context(
        &self,
        correlation_id: &str,
    ) -> Option<CorrelationContext> {
        let contexts = self.correlation_context.read().await;
        contexts.get(correlation_id).cloned()
    }

    /// Get recent error logs
    pub async fn get_recent_errors(&self, limit: usize) -> Vec<ErrorLogEntry> {
        let entries = self.log_entries.read().await;
        entries.iter().rev().take(limit).cloned().collect()
    }

    /// Get errors by correlation ID
    pub async fn get_errors_by_correlation(&self, correlation_id: &str) -> Vec<ErrorLogEntry> {
        let entries = self.log_entries.read().await;
        entries
            .iter()
            .filter(|entry| entry.correlation_id == correlation_id)
            .cloned()
            .collect()
    }

    /// Get error statistics
    pub async fn get_error_statistics(&self) -> HashMap<String, usize> {
        let entries = self.log_entries.read().await;
        let mut stats = HashMap::new();

        for entry in entries.iter() {
            *stats.entry(entry.error_type.clone()).or_insert(0) += 1;
        }

        stats
    }

    /// Clear old log entries
    pub async fn cleanup_old_entries(&self, max_age_hours: i64) {
        let cutoff = Utc::now() - chrono::Duration::hours(max_age_hours);
        let mut entries = self.log_entries.write().await;

        entries.retain(|entry| entry.timestamp > cutoff);

        // Also cleanup old correlation contexts
        let mut contexts = self.correlation_context.write().await;
        contexts.retain(|_, context| {
            Utc::now()
                .signed_duration_since(context.start_time)
                .num_hours()
                < max_age_hours
        });
    }

    // Private methods

    async fn store_log_entry(&self, entry: ErrorLogEntry) {
        let mut entries = self.log_entries.write().await;
        entries.push(entry);

        // Maintain max entries limit
        if entries.len() > self.config.max_log_entries {
            let excess = entries.len() - self.config.max_log_entries;
            entries.drain(0..excess);
        }
    }

    async fn log_to_outputs(&self, entry: &ErrorLogEntry) {
        if self.config.log_to_console {
            let json = serde_json::to_string(entry).unwrap_or_default();
            match entry.level {
                ErrorLevel::Debug | ErrorLevel::Info => log::info!("{}", json),
                ErrorLevel::Warning => log::warn!("{}", json),
                ErrorLevel::Error | ErrorLevel::Critical => log::error!("{}", json),
            }
        }

        // File logging implementation with rotation support
        if self.config.log_to_file {
            if let Some(file_path) = &self.config.log_file_path {
                if let Err(e) = self.write_to_file(entry, file_path).await {
                    log::error!("Failed to write error log to file {}: {}", file_path, e);
                }
            } else {
                // Default log file path if not specified
                let default_path =
                    format!("logs/error_{}.log", chrono::Utc::now().format("%Y%m%d"));
                if let Err(e) = self.write_to_file(entry, &default_path).await {
                    log::error!(
                        "Failed to write error log to default file {}: {}",
                        default_path,
                        e
                    );
                }
            }
        }

        // TODO: Add external service integration (ELK, Loki, etc.)
        // This would integrate with centralized logging services
    }

    async fn generate_correlation_id(&self) -> String {
        Uuid::new_v4().to_string()
    }

    /// Write error log entry to file with rotation support
    async fn write_to_file(
        &self,
        entry: &ErrorLogEntry,
        file_path: &str,
    ) -> Result<(), std::io::Error> {
        // Ensure log directory exists
        if let Some(parent) = PathBuf::from(file_path).parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        // Open file in append mode
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(file_path)
            .await?;

        // Write entry as JSON line
        let json = serde_json::to_string(entry).map_err(|e| {
            std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                format!("JSON serialization failed: {}", e),
            )
        })?;

        file.write_all(json.as_bytes()).await?;
        file.write_all(b"\n").await?;
        file.flush().await?;

        // Check file size and rotate if needed (>100MB)
        if let Ok(metadata) = tokio::fs::metadata(file_path).await {
            if metadata.len() > 100 * 1024 * 1024 {
                // Rotate log file
                let rotated_path = format!(
                    "{}.{}",
                    file_path,
                    chrono::Utc::now().format("%Y%m%d_%H%M%S")
                );
                if let Err(e) = tokio::fs::rename(file_path, &rotated_path).await {
                    log::warn!("Failed to rotate log file: {}", e);
                }
            }
        }

        Ok(())
    }
}

/// Context information for error logging
#[derive(Debug, Clone, Default)]
pub struct ErrorContext {
    pub operation: Option<String>,
    pub user_id: Option<String>,
    pub request_id: Option<String>,
    pub endpoint: Option<String>,
    pub method: Option<String>,
    pub status_code: Option<u16>,
    pub stack_trace: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub additional_context: HashMap<String, String>,
}

impl ErrorContext {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn operation(mut self, operation: String) -> Self {
        self.operation = Some(operation);
        self
    }

    pub fn user_id(mut self, user_id: String) -> Self {
        self.user_id = Some(user_id);
        self
    }

    pub fn request_id(mut self, request_id: String) -> Self {
        self.request_id = Some(request_id);
        self
    }

    pub fn endpoint(mut self, endpoint: String) -> Self {
        self.endpoint = Some(endpoint);
        self
    }

    pub fn method(mut self, method: String) -> Self {
        self.method = Some(method);
        self
    }

    pub fn status_code(mut self, status_code: u16) -> Self {
        self.status_code = Some(status_code);
        self
    }

    pub fn stack_trace(mut self, stack_trace: String) -> Self {
        self.stack_trace = Some(stack_trace);
        self
    }

    pub fn metadata(mut self, key: String, value: serde_json::Value) -> Self {
        self.metadata.insert(key, value);
        self
    }

    pub fn context(mut self, key: String, value: String) -> Self {
        self.additional_context.insert(key, value);
        self
    }
}

/// Convenience macros for error logging
#[macro_export]
macro_rules! log_error {
    ($logger:expr, $correlation_id:expr, $error_type:expr, $message:expr) => {
        $logger
            .log_error(
                $correlation_id,
                $error_type,
                $message,
                $crate::services::error_logging::ErrorLevel::Error,
                $crate::services::error_logging::ErrorContext::new(),
            )
            .await
    };
}

#[macro_export]
macro_rules! log_error_with_context {
    ($logger:expr, $correlation_id:expr, $error_type:expr, $message:expr, $context:expr) => {
        $logger
            .log_error(
                $correlation_id,
                $error_type,
                $message,
                $crate::services::error_logging::ErrorLevel::Error,
                $context,
            )
            .await
    };
}

#[macro_export]
macro_rules! start_correlation {
    ($logger:expr, $operation:expr) => {
        $logger.start_correlation_context($operation, None).await
    };
}

#[macro_export]
macro_rules! start_correlation_child {
    ($logger:expr, $operation:expr, $parent_id:expr) => {
        $logger
            .start_correlation_context($operation, Some($parent_id.to_string()))
            .await
    };
}
