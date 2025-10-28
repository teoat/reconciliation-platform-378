//! Logging Middleware
//! 
//! This module provides comprehensive logging middleware for structured logging,
//! request/response logging, and error tracking.

use actix_web::{dev::ServiceRequest, Error, HttpMessage, Result};
use actix_web::dev::{Service, ServiceResponse, Transform};
use futures::future::{ok, Ready};
use futures::Future;
use std::rc::Rc;
use std::pin::Pin;
use std::sync::Arc;
use std::time::{Instant, SystemTime, UNIX_EPOCH};
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;


/// Logging configuration
#[derive(Debug, Clone)]
pub struct LoggingConfig {
    pub enable_request_logging: bool,
    pub enable_response_logging: bool,
    pub enable_error_logging: bool,
    pub enable_structured_logging: bool,
    pub log_level: LogLevel,
    pub include_headers: bool,
    pub include_body: bool,
    pub max_body_size: usize,
    pub sensitive_headers: Vec<String>,
    pub sensitive_fields: Vec<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum LogLevel {
    Trace,
    Debug,
    Info,
    Warn,
    Error,
}

impl Default for LoggingConfig {
    fn default() -> Self {
        Self {
            enable_request_logging: true,
            enable_response_logging: true,
            enable_error_logging: true,
            enable_structured_logging: true,
            log_level: LogLevel::Info,
            include_headers: true,
            include_body: false,
            max_body_size: 1024,
            sensitive_headers: vec!["authorization".to_string(), "cookie".to_string()],
            sensitive_fields: vec!["password".to_string(), "token".to_string(), "secret".to_string()],
        }
    }
}

/// Logging middleware state
#[derive(Clone)]
pub struct LoggingMiddlewareState {
    pub config: LoggingConfig,
    pub logs: Arc<RwLock<Vec<LogEntry>>>,
}

/// Log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub id: String,
    pub timestamp: u64,
    pub level: String,
    pub message: String,
    pub request_id: Option<String>,
    pub user_id: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub method: Option<String>,
    pub path: Option<String>,
    pub status_code: Option<u16>,
    pub response_time_ms: Option<u64>,
    pub error: Option<ErrorDetails>,
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Error details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorDetails {
    pub error_type: String,
    pub error_message: String,
    pub stack_trace: Option<String>,
    pub error_code: Option<String>,
}

/// Logging middleware
pub struct LoggingMiddleware {
    config: LoggingConfig,
}

impl LoggingMiddleware {
    pub fn new(config: LoggingConfig) -> Self {
        Self { config }
    }
}

impl<S, B> Transform<S, ServiceRequest> for LoggingMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = LoggingMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        let state = LoggingMiddlewareState {
            config: self.config.clone(),
            logs: Arc::new(RwLock::new(Vec::new())),
        };

        ok(LoggingMiddlewareService {
            service: Rc::new(service),
            state,
        })
    }
}

/// Logging middleware service
pub struct LoggingMiddlewareService<S> {
    service: Rc<S>,
    state: LoggingMiddlewareState,
}

impl<S, B> Service<ServiceRequest> for LoggingMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(&self, cx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let state = self.state.clone();

        Box::pin(async move {
            let start_time = Instant::now();
            let request_id = Uuid::new_v4().to_string();
            
            // Extract request information
            let method = req.method().to_string();
            let path = req.path().to_string();
            let ip_address = req.connection_info().peer_addr().unwrap_or("unknown").to_string();
            let user_agent = req.headers().get("User-Agent")
                .and_then(|h| h.to_str().ok())
                .map(|s| s.to_string());

            // Extract user ID if available
            let user_id = req.extensions()
                .get::<crate::services::auth::Claims>()
                .map(|claims| claims.sub.clone());

            // Log request
            if state.config.enable_request_logging {
                log_request(&state, &request_id, &method, &path, &ip_address, &user_agent, &user_id).await;
            }

            // Call the next service
            let result = service.call(req).await;
            
            let response_time = start_time.elapsed();
            let response_time_ms = response_time.as_millis() as u64;

            match result {
                Ok(res) => {
                    let status_code = res.status().as_u16();
                    
                    // Log response
                    if state.config.enable_response_logging {
                        log_response(&state, &request_id, &method, &path, status_code, response_time_ms).await;
                    }
                    
                    Ok(res)
                }
                Err(error) => {
                    // Log error
                    if state.config.enable_error_logging {
                        log_error(&state, &request_id, &method, &path, &error, response_time_ms).await;
                    }
                    
                    Err(error)
                }
            }
        })
    }
}

/// Log request
async fn log_request(
    state: &LoggingMiddlewareState,
    request_id: &str,
    method: &str,
    path: &str,
    ip_address: &str,
    user_agent: &Option<String>,
    user_id: &Option<String>,
) {
    let log_entry = LogEntry {
        id: Uuid::new_v4().to_string(),
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        level: "info".to_string(),
        message: format!("Request: {} {}", method, path),
        request_id: Some(request_id.to_string()),
        user_id: user_id.clone(),
        ip_address: Some(ip_address.to_string()),
        user_agent: user_agent.clone(),
        method: Some(method.to_string()),
        path: Some(path.to_string()),
        status_code: None,
        response_time_ms: None,
        error: None,
        metadata: HashMap::new(),
    };

    let mut logs = state.logs.write().await;
    logs.push(log_entry);
    
    // Keep only last 10000 logs
    if logs.len() > 10000 {
        let len = logs.len();
        logs.drain(0..len - 10000);
    }
}

/// Log response
async fn log_response(
    state: &LoggingMiddlewareState,
    request_id: &str,
    method: &str,
    path: &str,
    status_code: u16,
    response_time_ms: u64,
) {
    let level = if status_code >= 400 { "error" } else { "info" };
    
    let log_entry = LogEntry {
        id: Uuid::new_v4().to_string(),
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        level: level.to_string(),
        message: format!("Response: {} {} - Status: {} - Time: {}ms", method, path, status_code, response_time_ms),
        request_id: Some(request_id.to_string()),
        user_id: None,
        ip_address: None,
        user_agent: None,
        method: Some(method.to_string()),
        path: Some(path.to_string()),
        status_code: Some(status_code),
        response_time_ms: Some(response_time_ms),
        error: None,
        metadata: HashMap::new(),
    };

    let mut logs = state.logs.write().await;
    logs.push(log_entry);
}

/// Log error
async fn log_error(
    state: &LoggingMiddlewareState,
    request_id: &str,
    method: &str,
    path: &str,
    error: &Error,
    response_time_ms: u64,
) {
    let log_entry = LogEntry {
        id: Uuid::new_v4().to_string(),
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        level: "error".to_string(),
        message: format!("Error: {} {} - {}", method, path, error),
        request_id: Some(request_id.to_string()),
        user_id: None,
        ip_address: None,
        user_agent: None,
        method: Some(method.to_string()),
        path: Some(path.to_string()),
        status_code: None,
        response_time_ms: Some(response_time_ms),
        error: Some(ErrorDetails {
            error_type: "http_error".to_string(),
            error_message: error.to_string(),
            stack_trace: None,
            error_code: None,
        }),
        metadata: HashMap::new(),
    };

    let mut logs = state.logs.write().await;
    logs.push(log_entry);
}

/// Structured logger
pub struct StructuredLogger {
    pub logs: Arc<RwLock<Vec<LogEntry>>>,
    pub config: LoggingConfig,
}

impl StructuredLogger {
    pub fn new(config: LoggingConfig) -> Self {
        Self {
            logs: Arc::new(RwLock::new(Vec::new())),
            config,
        }
    }
    
    pub async fn log(&self, level: LogLevel, message: &str, metadata: Option<HashMap<String, serde_json::Value>>) {
        if self.should_log(&level) {
            let log_entry = LogEntry {
                id: Uuid::new_v4().to_string(),
                timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
                level: level.to_string(),
                message: message.to_string(),
                request_id: None,
                user_id: None,
                ip_address: None,
                user_agent: None,
                method: None,
                path: None,
                status_code: None,
                response_time_ms: None,
                error: None,
                metadata: metadata.unwrap_or_default(),
            };

            let mut logs = self.logs.write().await;
            logs.push(log_entry);
            
            // Keep only last 10000 logs
            if logs.len() > 10000 {
                let len = logs.len();
                logs.drain(0..len - 10000);
            }
        }
    }
    
    pub async fn log_info(&self, message: &str, metadata: Option<HashMap<String, serde_json::Value>>) {
        self.log(LogLevel::Info, message, metadata).await;
    }
    
    pub async fn log_warn(&self, message: &str, metadata: Option<HashMap<String, serde_json::Value>>) {
        self.log(LogLevel::Warn, message, metadata).await;
    }
    
    pub async fn log_error(&self, message: &str, error: Option<&Error>, metadata: Option<HashMap<String, serde_json::Value>>) {
        let mut log_metadata = metadata.unwrap_or_default();
        
        if let Some(err) = error {
            log_metadata.insert("error_type".to_string(), serde_json::Value::String("application_error".to_string()));
            log_metadata.insert("error_message".to_string(), serde_json::Value::String(err.to_string()));
        }
        
        self.log(LogLevel::Error, message, Some(log_metadata)).await;
    }
    
    pub async fn log_debug(&self, message: &str, metadata: Option<HashMap<String, serde_json::Value>>) {
        self.log(LogLevel::Debug, message, metadata).await;
    }
    
    pub async fn log_trace(&self, message: &str, metadata: Option<HashMap<String, serde_json::Value>>) {
        self.log(LogLevel::Trace, message, metadata).await;
    }
    
    fn should_log(&self, level: &LogLevel) -> bool {
        match (&self.config.log_level, level) {
            (LogLevel::Trace, _) => true,
            (LogLevel::Debug, LogLevel::Debug | LogLevel::Info | LogLevel::Warn | LogLevel::Error) => true,
            (LogLevel::Info, LogLevel::Info | LogLevel::Warn | LogLevel::Error) => true,
            (LogLevel::Warn, LogLevel::Warn | LogLevel::Error) => true,
            (LogLevel::Error, LogLevel::Error) => true,
            _ => false,
        }
    }
    
    pub async fn get_logs(&self, level: Option<LogLevel>, limit: Option<usize>) -> Vec<LogEntry> {
        let logs = self.logs.read().await;
        let mut filtered_logs: Vec<LogEntry> = logs.clone();
        
        if let Some(level_filter) = level {
            filtered_logs.retain(|log| log.level == level_filter.to_string());
        }
        
        if let Some(limit_count) = limit {
            filtered_logs.truncate(limit_count);
        }
        
        filtered_logs
    }
    
    pub async fn get_logs_by_time_range(&self, start_time: u64, end_time: u64) -> Vec<LogEntry> {
        let logs = self.logs.read().await;
        logs.iter()
            .filter(|log| log.timestamp >= start_time && log.timestamp <= end_time)
            .cloned()
            .collect()
    }
    
    pub async fn get_error_logs(&self) -> Vec<LogEntry> {
        let logs = self.logs.read().await;
        logs.iter()
            .filter(|log| log.level == "error")
            .cloned()
            .collect()
    }
    
    pub async fn get_slow_requests(&self, threshold_ms: u64) -> Vec<LogEntry> {
        let logs = self.logs.read().await;
        logs.iter()
            .filter(|log| log.response_time_ms.map_or(false, |time| time > threshold_ms))
            .cloned()
            .collect()
    }
}

impl ToString for LogLevel {
    fn to_string(&self) -> String {
        match self {
            LogLevel::Trace => "trace",
            LogLevel::Debug => "debug",
            LogLevel::Info => "info",
            LogLevel::Warn => "warn",
            LogLevel::Error => "error",
        }.to_string()
    }
}

/// Error tracking service
pub struct ErrorTrackingService {
    pub errors: Arc<RwLock<Vec<ErrorEntry>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorEntry {
    pub id: String,
    pub timestamp: u64,
    pub error_type: String,
    pub error_message: String,
    pub stack_trace: Option<String>,
    pub user_id: Option<String>,
    pub request_id: Option<String>,
    pub endpoint: Option<String>,
    pub method: Option<String>,
    pub status_code: Option<u16>,
    pub metadata: HashMap<String, serde_json::Value>,
}

impl ErrorTrackingService {
    pub fn new() -> Self {
        Self {
            errors: Arc::new(RwLock::new(Vec::new())),
        }
    }
    
    pub async fn track_error(
        &self,
        error_type: &str,
        error_message: &str,
        stack_trace: Option<&str>,
        user_id: Option<&str>,
        request_id: Option<&str>,
        endpoint: Option<&str>,
        method: Option<&str>,
        status_code: Option<u16>,
        metadata: Option<HashMap<String, serde_json::Value>>,
    ) {
        let error_entry = ErrorEntry {
            id: Uuid::new_v4().to_string(),
            timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            error_type: error_type.to_string(),
            error_message: error_message.to_string(),
            stack_trace: stack_trace.map(|s| s.to_string()),
            user_id: user_id.map(|s| s.to_string()),
            request_id: request_id.map(|s| s.to_string()),
            endpoint: endpoint.map(|s| s.to_string()),
            method: method.map(|s| s.to_string()),
            status_code,
            metadata: metadata.unwrap_or_default(),
        };

        let mut errors = self.errors.write().await;
        errors.push(error_entry);
        
        // Keep only last 5000 errors
        if errors.len() > 5000 {
            let len = errors.len();
            errors.drain(0..len - 5000);
        }
    }
    
    pub async fn get_errors(&self, error_type: Option<&str>, limit: Option<usize>) -> Vec<ErrorEntry> {
        let errors = self.errors.read().await;
        let mut filtered_errors: Vec<ErrorEntry> = errors.clone();
        
        if let Some(type_filter) = error_type {
            filtered_errors.retain(|error| error.error_type == type_filter);
        }
        
        if let Some(limit_count) = limit {
            filtered_errors.truncate(limit_count);
        }
        
        filtered_errors
    }
    
    pub async fn get_error_statistics(&self) -> HashMap<String, usize> {
        let errors = self.errors.read().await;
        let mut stats = HashMap::new();
        
        for error in errors.iter() {
            *stats.entry(error.error_type.clone()).or_insert(0) += 1;
        }
        
        stats
    }
}
