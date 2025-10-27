//! Comprehensive Security Middleware
//! 
//! This module provides comprehensive security middleware including rate limiting,
//! CSRF protection, input validation, and security headers.

use actix_web::{dev::ServiceRequest, Error, HttpMessage, HttpRequest, HttpResponse, Result};
use actix_web::dev::{Service, ServiceResponse, Transform};
use actix_web::body::BoxBody;
use actix_web::http::header::{HeaderName, HeaderValue};
use actix_web::middleware::DefaultHeaders;
use futures::future::{ok, Ready};
use futures::Future;
use std::collections::HashMap;
use std::pin::Pin;
use std::rc::Rc;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::services::monitoring::MonitoringService;

/// Rate limiting configuration
#[derive(Debug, Clone)]
pub struct RateLimitConfig {
    pub requests_per_minute: u32,
    pub burst_size: u32,
    pub window_size: Duration,
    pub cleanup_interval: Duration,
}

impl Default for RateLimitConfig {
    fn default() -> Self {
        Self {
            requests_per_minute: 60,
            burst_size: 10,
            window_size: Duration::from_secs(60),
            cleanup_interval: Duration::from_secs(300), // 5 minutes
        }
    }
}

/// Rate limiter entry
#[derive(Debug, Clone)]
struct RateLimitEntry {
    requests: u32,
    window_start: SystemTime,
    last_request: SystemTime,
    blocked_until: Option<SystemTime>,
}

/// Rate limiter
#[derive(Debug, Clone)]
pub struct RateLimiter {
    config: RateLimitConfig,
    entries: Arc<RwLock<HashMap<String, RateLimitEntry>>>,
    monitoring: Option<Arc<MonitoringService>>,
}

impl RateLimiter {
    pub fn new(config: RateLimitConfig, monitoring: Option<Arc<MonitoringService>>) -> Self {
        Self {
            config,
            entries: Arc::new(RwLock::new(HashMap::new())),
            monitoring,
        }
    }

    /// Check if request is allowed
    pub async fn is_allowed(&self, key: &str) -> AppResult<bool> {
        let now = SystemTime::now();
        let mut entries = self.entries.write().await;
        
        // Clean up old entries
        self.cleanup_old_entries(&mut entries, now).await;
        
        let entry = entries.entry(key.to_string()).or_insert_with(|| {
            RateLimitEntry {
                requests: 0,
                window_start: now,
                last_request: now,
                blocked_until: None,
            }
        });
        
        // Check if window has expired
        if now.duration_since(entry.window_start).unwrap_or(Duration::ZERO) >= self.config.window_size {
            entry.requests = 0;
            entry.window_start = now;
        }
        
        // Check burst limit
        if entry.requests >= self.config.burst_size {
            // Record rate limit hit
            if let Some(monitoring) = &self.monitoring {
                monitoring.record_user_action();
            }
            return Ok(false);
        }
        
        // Check requests per minute limit
        if entry.requests >= self.config.requests_per_minute {
            // Record rate limit hit
            if let Some(monitoring) = &self.monitoring {
                monitoring.record_user_action();
            }
            return Ok(false);
        }
        
        // Allow request
        entry.requests += 1;
        entry.last_request = now;
        
        Ok(true)
    }
    
    /// Clean up old entries
    async fn cleanup_old_entries(&self, entries: &mut HashMap<String, RateLimitEntry>, now: SystemTime) {
        entries.retain(|_, entry| {
            now.duration_since(entry.last_request).unwrap_or(Duration::ZERO) < self.config.cleanup_interval
        });
    }
    
    /// Get current rate limit status
    pub async fn get_status(&self, key: &str) -> AppResult<RateLimitStatus> {
        let entries = self.entries.read().await;
        if let Some(entry) = entries.get(key) {
            let now = SystemTime::now();
            let window_remaining = self.config.window_size
                .checked_sub(now.duration_since(entry.window_start).unwrap_or(Duration::ZERO))
                .unwrap_or(Duration::ZERO);
            
            Ok(RateLimitStatus {
                requests_used: entry.requests,
                requests_limit: self.config.requests_per_minute,
                burst_limit: self.config.burst_size,
                window_remaining: window_remaining.as_secs(),
                reset_time: entry.window_start + self.config.window_size,
            })
        } else {
            Ok(RateLimitStatus {
                requests_used: 0,
                requests_limit: self.config.requests_per_minute,
                burst_limit: self.config.burst_size,
                window_remaining: self.config.window_size.as_secs(),
                reset_time: SystemTime::now() + self.config.window_size,
            })
        }
    }
}

/// Rate limit status
#[derive(Debug, Clone)]
pub struct RateLimitStatus {
    pub requests_used: u32,
    pub requests_limit: u32,
    pub burst_limit: u32,
    pub window_remaining: u64,
    pub reset_time: SystemTime,
}

/// Security service configuration
#[derive(Debug, Clone)]
pub struct SecurityConfig {
    pub jwt_secret: String,
    pub jwt_expiry: u64,
    pub bcrypt_cost: u32,
    pub session_timeout: Duration,
    pub max_login_attempts: u32,
    pub lockout_duration: Duration,
}

impl Default for SecurityConfig {
    fn default() -> Self {
        Self {
            jwt_secret: "default_secret_key".to_string(),
            jwt_expiry: 3600, // 1 hour
            bcrypt_cost: 12,
            session_timeout: Duration::from_secs(1800), // 30 minutes
            max_login_attempts: 5,
            lockout_duration: Duration::from_secs(900), // 15 minutes
        }
    }
}

/// Security service for handling security operations
#[derive(Clone)]
pub struct SecurityService {
    config: SecurityConfig,
}

impl SecurityService {
    pub fn new(config: SecurityConfig) -> Self {
        Self { config }
    }
    
    /// Generate CSRF token
    pub fn generate_csrf_token(&self) -> String {
        use base64::Engine as _;
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let bytes: [u8; 32] = rng.gen();
        base64::engine::general_purpose::STANDARD.encode(bytes)
    }
    
    /// Validate CSRF token
    pub fn validate_csrf_token(&self, token: &str) -> AppResult<()> {
        use base64::Engine as _;
        if token.len() < 32 {
            return Err(AppError::CsrfTokenInvalid);
        }
        
        // In a real implementation, you would validate against stored tokens
        // For now, we'll just check the format
        if let Err(_) = base64::engine::general_purpose::STANDARD.decode(token) {
            return Err(AppError::CsrfTokenInvalid);
        }
        
        Ok(())
    }
    
    /// Hash password using bcrypt
    pub fn hash_password(&self, password: &str) -> AppResult<String> {
        use bcrypt::{hash, DEFAULT_COST};
        hash(password, DEFAULT_COST)
            .map_err(|e| AppError::InternalServerError(format!("Password hashing failed: {}", e)))
    }
    
    /// Verify password against hash
    pub fn verify_password(&self, password: &str, hash: &str) -> AppResult<bool> {
        use bcrypt::verify;
        verify(password, hash)
            .map_err(|e| AppError::InternalServerError(format!("Password verification failed: {}", e)))
    }
    
    /// Generate JWT token
    pub fn generate_jwt_token(&self, claims: &serde_json::Value) -> AppResult<String> {
        use jsonwebtoken::{encode, Header, EncodingKey};
        
        let header = Header::default();
        let key = EncodingKey::from_secret(self.config.jwt_secret.as_bytes());
        
        encode(&header, claims, &key)
            .map_err(|e| AppError::InternalServerError(format!("JWT generation failed: {}", e)))
    }
    
    /// Validate JWT token
    pub fn validate_jwt_token(&self, token: &str) -> AppResult<serde_json::Value> {
        use jsonwebtoken::{decode, DecodingKey, Validation};
        
        let key = DecodingKey::from_secret(self.config.jwt_secret.as_bytes());
        let validation = Validation::default();
        
        let token_data = decode::<serde_json::Value>(token, &key, &validation)
            .map_err(|e| AppError::Authentication(format!("JWT validation failed: {}", e)))?;
        
        Ok(token_data.claims)
    }
}

/// Security middleware configuration
#[derive(Debug, Clone)]
pub struct SecurityMiddlewareConfig {
    pub enable_rate_limiting: bool,
    pub enable_csrf_protection: bool,
    pub enable_input_validation: bool,
    pub enable_security_headers: bool,
    pub rate_limit_requests: u32,
    pub rate_limit_window: Duration,
    pub csrf_token_header: String,
    pub allowed_origins: Vec<String>,
    pub enable_cors: bool,
    pub enable_hsts: bool,
    pub enable_csp: bool,
}

impl Default for SecurityMiddlewareConfig {
    fn default() -> Self {
        Self {
            enable_rate_limiting: true,
            enable_csrf_protection: true,
            enable_input_validation: true,
            enable_security_headers: true,
            rate_limit_requests: 100,
            rate_limit_window: Duration::from_secs(3600),
            csrf_token_header: "X-CSRF-Token".to_string(),
            allowed_origins: vec!["http://localhost:3000".to_string()],
            enable_cors: true,
            enable_hsts: true,
            enable_csp: true,
        }
    }
}

/// Security middleware state
#[derive(Clone)]
pub struct SecurityMiddlewareState {
    pub security_service: Arc<SecurityService>,
    pub config: SecurityMiddlewareConfig,
    pub rate_limits: Arc<RwLock<HashMap<String, RateLimitEntry>>>,
    pub csrf_tokens: Arc<RwLock<HashMap<String, String>>>,
}

/// Security middleware
pub struct SecurityMiddleware {
    config: SecurityMiddlewareConfig,
}

impl SecurityMiddleware {
    pub fn new(config: SecurityMiddlewareConfig) -> Self {
        Self { config }
    }
    
    pub fn with_security_service(security_service: Arc<SecurityService>) -> Self {
        Self {
            config: SecurityMiddlewareConfig::default(),
        }
    }
}

impl<S> Transform<S, ServiceRequest> for SecurityMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<BoxBody>, Error = Error> + 'static,
    S::Future: 'static,
{
    type Response = ServiceResponse<BoxBody>;
    type Error = Error;
    type InitError = ();
    type Transform = SecurityMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        let state = SecurityMiddlewareState {
            security_service: Arc::new(SecurityService::new(SecurityConfig::default())),
            config: self.config.clone(),
            rate_limits: Arc::new(RwLock::new(HashMap::new())),
            csrf_tokens: Arc::new(RwLock::new(HashMap::new())),
        };

        ok(SecurityMiddlewareService {
            service: Rc::new(service),
            state,
        })
    }
}

/// Security middleware service
pub struct SecurityMiddlewareService<S> {
    service: Rc<S>,
    state: SecurityMiddlewareState,
}

impl<S> Service<ServiceRequest> for SecurityMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<BoxBody>, Error = Error> + 'static,
    S::Future: 'static,
{
    type Response = ServiceResponse<BoxBody>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(&self, cx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let state = self.state.clone();

        Box::pin(async move {
            // Extract request information
            let ip_address = req.connection_info().remote_addr().unwrap_or("unknown").to_string();
            let user_agent = req.headers().get("User-Agent")
                .and_then(|h| h.to_str().ok())
                .unwrap_or("unknown")
                .to_string();
            let method = req.method().to_string();
            let path = req.path().to_string();

            // Rate limiting check
            if state.config.enable_rate_limiting {
                if let Err(_) = check_rate_limit(&state, &ip_address, &path).await {
                    return Ok(ServiceResponse::new(
                        req.into_parts().0,
                        HttpResponse::TooManyRequests()
                            .json(serde_json::json!({
                                "error": "Rate limit exceeded",
                                "message": "Too many requests. Please try again later."
                            }))
                            .map_into_boxed_body()
                    ));
                }
            }

            // CSRF protection check
            if state.config.enable_csrf_protection && method != "GET" && method != "HEAD" {
                if let Err(_) = check_csrf_token(&state, &req).await {
                    return Ok(ServiceResponse::new(
                        req.into_parts().0,
                        HttpResponse::Forbidden()
                            .json(serde_json::json!({
                                "error": "CSRF token missing or invalid",
                                "message": "CSRF protection is enabled for this endpoint."
                            }))
                            .map_into_boxed_body()
                    ));
                }
            }

            // Input validation
            if state.config.enable_input_validation {
                if let Err(_) = validate_request_input(&state, &req).await {
                    return Ok(ServiceResponse::new(
                        req.into_parts().0,
                        HttpResponse::BadRequest()
                            .json(serde_json::json!({
                                "error": "Invalid input detected",
                                "message": "Request contains potentially malicious content."
                            }))
                            .map_into_boxed_body()
                    ));
                }
            }

            // Add security headers
            let mut req = req;
            if state.config.enable_security_headers {
                add_security_headers(&mut req, &state.config);
            }

            // Call the next service
            let res = service.call(req).await?;

            // Log security event if needed
            log_security_event(&state, &ip_address, &user_agent, &method, &path, res.status().as_u16()).await;

            Ok(res.map_into_boxed_body())
        })
    }
}

/// Check rate limit for a request
async fn check_rate_limit(
    state: &SecurityMiddlewareState,
    ip_address: &str,
    path: &str,
) -> AppResult<()> {
    let key = format!("{}:{}", ip_address, path);
    let now = SystemTime::now();
    
    let mut rate_limits = state.rate_limits.write().await;
    
    if let Some(entry) = rate_limits.get_mut(&key) {
        // Check if still in the same window
        if now.duration_since(entry.window_start).unwrap_or(Duration::from_secs(0)) < state.config.rate_limit_window {
            // Check if blocked
            if let Some(blocked_until) = entry.blocked_until {
                if now < blocked_until {
                    return Err(AppError::RateLimitExceeded);
                } else {
                    entry.blocked_until = None; // Unblock
                }
            }
            
            // Increment count
            entry.requests += 1;
            
            // Check if limit exceeded
            if entry.requests > state.config.rate_limit_requests {
                entry.blocked_until = Some(now + Duration::from_secs(300)); // Block for 5 minutes
                return Err(AppError::RateLimitExceeded);
            }
        } else {
            // New window
            *entry = RateLimitEntry {
                requests: 1,
                window_start: now,
                last_request: now,
                blocked_until: None,
            };
        }
    } else {
        // First request
        rate_limits.insert(key, RateLimitEntry {
            requests: 1,
            window_start: now,
            last_request: now,
            blocked_until: None,
        });
    }
    
    Ok(())
}

/// Check CSRF token
async fn check_csrf_token(
    state: &SecurityMiddlewareState,
    req: &ServiceRequest,
) -> AppResult<()> {
    let token = req.headers()
        .get(&state.config.csrf_token_header)
        .and_then(|h| h.to_str().ok())
        .ok_or(AppError::CsrfTokenMissing)?;
    
    // For now, we'll implement a simple token validation
    // In a real implementation, you'd validate against a stored token
    if token.len() < 32 {
        return Err(AppError::CsrfTokenInvalid);
    }
    
    Ok(())
}

/// Validate request input
async fn validate_request_input(
    state: &SecurityMiddlewareState,
    req: &ServiceRequest,
) -> AppResult<()> {
    // Check query parameters
    for param in req.query_string().split('&') {
        if let Some((key, value)) = param.split_once('=') {
            if let Err(_) = validate_input_string(key) {
                return Err(AppError::Validation("Invalid query parameter".to_string()));
            }
            if let Err(_) = validate_input_string(value) {
                return Err(AppError::Validation("Invalid query parameter value".to_string()));
            }
        }
    }
    
    // Check path parameters
    for segment in req.path().split('/') {
        if !segment.is_empty() {
            if let Err(_) = validate_input_string(segment) {
                return Err(AppError::Validation("Invalid path parameter".to_string()));
            }
        }
    }
    
    Ok(())
}

/// Validate input string for security issues
fn validate_input_string(input: &str) -> AppResult<()> {
    // Check for SQL injection patterns
    let sql_patterns = [
        "'; DROP TABLE",
        "UNION SELECT",
        "INSERT INTO",
        "DELETE FROM",
        "UPDATE SET",
        "OR 1=1",
        "AND 1=1",
    ];
    
    for pattern in &sql_patterns {
        if input.to_uppercase().contains(pattern) {
            return Err(AppError::Validation(format!("Potential SQL injection detected: {}", pattern)));
        }
    }
    
    // Check for XSS patterns
    let xss_patterns = [
        "<script",
        "javascript:",
        "onload=",
        "onerror=",
        "onclick=",
        "onmouseover=",
    ];
    
    for pattern in &xss_patterns {
        if input.to_lowercase().contains(pattern) {
            return Err(AppError::Validation(format!("Potential XSS detected: {}", pattern)));
        }
    }
    
    // Check for path traversal
    if input.contains("../") || input.contains("..\\") {
        return Err(AppError::Validation("Potential path traversal detected".to_string()));
    }
    
    Ok(())
}

/// Add security headers to the request
fn add_security_headers(req: &mut ServiceRequest, config: &SecurityMiddlewareConfig) {
    let headers = req.headers_mut();
    headers.insert(
        HeaderName::from_static("x-xss-protection"),
        HeaderValue::from_static("1; mode=block"),
    );
    headers.insert(
        HeaderName::from_static("x-content-type-options"),
        HeaderValue::from_static("nosniff"),
    );
    headers.insert(
        HeaderName::from_static("strict-transport-security"),
        HeaderValue::from_static("max-age=31536000; includeSubDomains"),
    );
    if config.enable_csp {
        headers.insert(
            HeaderName::from_static("content-security-policy"),
            HeaderValue::from_static("default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';"),
        );
    }
}

/// Log security event
async fn log_security_event(
    state: &SecurityMiddlewareState,
    ip_address: &str,
    user_agent: &str,
    method: &str,
    path: &str,
    status_code: u16,
) {
    // Log the security event
    println!("Security event: {} {} - Status: {} - IP: {} - User-Agent: {}", method, path, status_code, ip_address, user_agent);
}

/// CORS middleware configuration
pub struct CorsConfig {
    pub allowed_origins: Vec<String>,
    pub allowed_methods: Vec<String>,
    pub allowed_headers: Vec<String>,
    pub allow_credentials: bool,
    pub max_age: u32,
}

impl Default for CorsConfig {
    fn default() -> Self {
        Self {
            allowed_origins: vec!["http://localhost:3000".to_string()],
            allowed_methods: vec!["GET".to_string(), "POST".to_string(), "PUT".to_string(), "DELETE".to_string()],
            allowed_headers: vec!["Content-Type".to_string(), "Authorization".to_string(), "X-CSRF-Token".to_string()],
            allow_credentials: true,
            max_age: 86400,
        }
    }
}

/// Security headers middleware
pub struct SecurityHeadersMiddleware {
    config: SecurityMiddlewareConfig,
}

impl SecurityHeadersMiddleware {
    pub fn new(config: SecurityMiddlewareConfig) -> Self {
        Self { config }
    }
}

impl<S, B> Transform<S, ServiceRequest> for SecurityHeadersMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static + actix_web::body::MessageBody,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = SecurityHeadersService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(SecurityHeadersService {
            service: Rc::new(service),
            config: self.config.clone(),
        })
    }
}

/// Security headers service
pub struct SecurityHeadersService<S> {
    service: Rc<S>,
    config: SecurityMiddlewareConfig,
}

impl<S, B> Service<ServiceRequest> for SecurityHeadersService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static + actix_web::body::MessageBody,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(&self, cx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let config = self.config.clone();

        Box::pin(async move {
            let mut res = service.call(req).await?;
            
            // Add security headers to response
            let headers = res.headers_mut();
            
            // Content Security Policy
            if config.enable_csp {
                headers.insert(
                    HeaderName::from_static("content-security-policy"),
                    HeaderValue::from_static("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:; frame-ancestors 'none';")
                );
            }
            
            // HTTP Strict Transport Security
            if config.enable_hsts {
                headers.insert(
                    HeaderName::from_static("strict-transport-security"),
                    HeaderValue::from_static("max-age=31536000; includeSubDomains; preload")
                );
            }
            
            // X-Frame-Options
            headers.insert(
                HeaderName::from_static("x-frame-options"),
                HeaderValue::from_static("DENY")
            );
            
            // X-Content-Type-Options
            headers.insert(
                HeaderName::from_static("x-content-type-options"),
                HeaderValue::from_static("nosniff")
            );
            
            // X-XSS-Protection
            headers.insert(
                HeaderName::from_static("x-xss-protection"),
                HeaderValue::from_static("1; mode=block")
            );
            
            // Referrer-Policy
            headers.insert(
                HeaderName::from_static("referrer-policy"),
                HeaderValue::from_static("strict-origin-when-cross-origin")
            );
            
            // Permissions-Policy
            headers.insert(
                HeaderName::from_static("permissions-policy"),
                HeaderValue::from_static("geolocation=(), microphone=(), camera=()")
            );

            Ok(res)
        })
    }
}

/// Input sanitization utilities
pub mod sanitization {
    use crate::errors::AppResult;
    
    /// Sanitize HTML input to prevent XSS
    pub fn sanitize_html(input: &str) -> String {
        input
            .replace('<', "&lt;")
            .replace('>', "&gt;")
            .replace('"', "&quot;")
            .replace('\'', "&#x27;")
            .replace('/', "&#x2F;")
            .replace('&', "&amp;")
    }
    
    /// Sanitize SQL input to prevent injection
    pub fn sanitize_sql(input: &str) -> AppResult<String> {
        // Remove or escape dangerous SQL characters
        let sanitized = input
            .replace('\'', "''")
            .replace(';', "")
            .replace("--", "")
            .replace("/*", "")
            .replace("*/", "");
        
        // Check for remaining dangerous patterns
        let dangerous_patterns = [
            "DROP TABLE",
            "DELETE FROM",
            "INSERT INTO",
            "UPDATE SET",
            "UNION SELECT",
            "OR 1=1",
            "AND 1=1",
        ];
        
        for pattern in &dangerous_patterns {
            if sanitized.to_uppercase().contains(pattern) {
                return Err(crate::errors::AppError::Validation(
                    format!("Potentially dangerous SQL pattern detected: {}", pattern)
                ));
            }
        }
        
        Ok(sanitized)
    }
    
    /// Sanitize file path to prevent directory traversal
    pub fn sanitize_file_path(input: &str) -> AppResult<String> {
        let sanitized = input
            .replace("../", "")
            .replace("..\\", "")
            .replace("..", "");
        
        if sanitized.contains("..") {
            return Err(crate::errors::AppError::Validation(
                "Directory traversal attempt detected".to_string()
            ));
        }
        
        Ok(sanitized)
    }
    
    /// Validate email format
    pub fn validate_email(email: &str) -> AppResult<()> {
        if email.len() > 254 {
            return Err(crate::errors::AppError::Validation(
                "Email address too long".to_string()
            ));
        }
        
        if !email.contains('@') {
            return Err(crate::errors::AppError::Validation(
                "Invalid email format".to_string()
            ));
        }
        
        let parts: Vec<&str> = email.split('@').collect();
        if parts.len() != 2 {
            return Err(crate::errors::AppError::Validation(
                "Invalid email format".to_string()
            ));
        }
        
        if parts[0].is_empty() || parts[1].is_empty() {
            return Err(crate::errors::AppError::Validation(
                "Invalid email format".to_string()
            ));
        }
        
        Ok(())
    }
    
    /// Validate password strength
    pub fn validate_password_strength(password: &str) -> AppResult<()> {
        if password.len() < 8 {
            return Err(crate::errors::AppError::Validation(
                "Password must be at least 8 characters long".to_string()
            ));
        }
        
        if password.len() > 128 {
            return Err(crate::errors::AppError::Validation(
                "Password must be less than 128 characters".to_string()
            ));
        }
        
        let mut has_upper = false;
        let mut has_lower = false;
        let mut has_digit = false;
        let mut has_special = false;
        
        for ch in password.chars() {
            if ch.is_uppercase() {
                has_upper = true;
            } else if ch.is_lowercase() {
                has_lower = true;
            } else if ch.is_ascii_digit() {
                has_digit = true;
            } else if "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(ch) {
                has_special = true;
            }
        }
        
        if !has_upper {
            return Err(crate::errors::AppError::Validation(
                "Password must contain at least one uppercase letter".to_string()
            ));
        }
        
        if !has_lower {
            return Err(crate::errors::AppError::Validation(
                "Password must contain at least one lowercase letter".to_string()
            ));
        }
        
        if !has_digit {
            return Err(crate::errors::AppError::Validation(
                "Password must contain at least one digit".to_string()
            ));
        }
        
        if !has_special {
            return Err(crate::errors::AppError::Validation(
                "Password must contain at least one special character".to_string()
            ));
        }
        
        Ok(())
    }
}
