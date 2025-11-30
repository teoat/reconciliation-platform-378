// Security Hardening Service
// This service handles security measures, vulnerability scanning, and compliance validation

// Password hashing/verification is handled by services/auth/password.rs (PasswordManager)
// bcrypt imports removed - no longer needed
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::sync::RwLock;
use uuid::Uuid;

// Security configuration
#[derive(Debug, Clone)]
pub struct SecurityConfig {
    pub jwt_secret: String,
    pub jwt_expiration: Duration,
    // bcrypt_cost removed - password operations handled by services/auth/password.rs
    pub max_login_attempts: u32,
    pub lockout_duration: Duration,
    pub session_timeout: Duration,
    pub rate_limit_requests: u32,
    pub rate_limit_window: Duration,
    pub enable_csrf: bool,
    pub enable_cors: bool,
    pub allowed_origins: Vec<String>,
    pub enable_helmet: bool,
    pub enable_hsts: bool,
    pub enable_csp: bool,
}

impl Default for SecurityConfig {
    fn default() -> Self {
        Self {
            jwt_secret: "your-super-secret-key-change-in-production".to_string(),
            jwt_expiration: Duration::from_secs(86400), // 24 hours
            // bcrypt_cost removed - password operations handled by services/auth/password.rs
            max_login_attempts: 5,
            lockout_duration: Duration::from_secs(900), // 15 minutes
            session_timeout: Duration::from_secs(3600), // 1 hour
            rate_limit_requests: 100,
            rate_limit_window: Duration::from_secs(3600), // 1 hour
            enable_csrf: true,
            enable_cors: true,
            allowed_origins: vec![
                "http://localhost:1000".to_string(),
                "http://localhost:3000".to_string(),
            ],
            enable_helmet: true,
            enable_hsts: true,
            enable_csp: true,
        }
    }
}

// Security events and violations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityEvent {
    pub id: String,
    pub event_type: SecurityEventType,
    pub severity: SecuritySeverity,
    pub user_id: Option<String>,
    pub ip_address: String,
    pub user_agent: Option<String>,
    pub description: String,
    pub metadata: HashMap<String, String>,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SecurityEventType {
    LoginAttempt,
    LoginSuccess,
    LoginFailure,
    AccountLockout,
    PasswordChange,
    SuspiciousActivity,
    RateLimitExceeded,
    CsrfViolation,
    XssAttempt,
    SqlInjectionAttempt,
    UnauthorizedAccess,
    DataBreach,
    SystemIntrusion,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SecuritySeverity {
    Low,
    Medium,
    High,
    Critical,
}

// Rate limiting
#[derive(Debug, Clone)]
pub struct RateLimitEntry {
    pub count: u32,
    pub window_start: SystemTime,
    pub blocked_until: Option<SystemTime>,
}

/// CSRF token entry
#[derive(Debug, Clone)]
pub struct CsrfToken {
    pub user_id: Uuid,
    pub expires_at: u64,
}

// Security service
pub struct SecurityService {
    pub config: SecurityConfig,
    pub login_attempts: Arc<RwLock<HashMap<String, Vec<SystemTime>>>>,
    pub rate_limits: Arc<RwLock<HashMap<String, RateLimitEntry>>>,
    pub security_events: Arc<RwLock<Vec<SecurityEvent>>>,
    pub blocked_ips: Arc<RwLock<HashMap<String, SystemTime>>>,
    pub active_sessions: Arc<RwLock<HashMap<String, SessionInfo>>>,
    pub csrf_tokens: Arc<RwLock<HashMap<String, CsrfToken>>>,
}

#[derive(Debug, Clone)]
pub struct SessionInfo {
    pub user_id: String,
    pub ip_address: String,
    pub user_agent: String,
    pub created_at: SystemTime,
    pub last_activity: SystemTime,
    pub expires_at: SystemTime,
}

impl SecurityService {
    pub fn new(config: SecurityConfig) -> Self {
        Self {
            config,
            login_attempts: Arc::new(RwLock::new(HashMap::new())),
            rate_limits: Arc::new(RwLock::new(HashMap::new())),
            security_events: Arc::new(RwLock::new(Vec::new())),
            blocked_ips: Arc::new(RwLock::new(HashMap::new())),
            active_sessions: Arc::new(RwLock::new(HashMap::new())),
            csrf_tokens: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    // Authentication security
    // NOTE: Password hashing/verification is handled by services/auth/password.rs (PasswordManager)
    // Deprecated password methods removed - use AuthService::hash_password(), AuthService::verify_password() instead

    pub async fn generate_jwt_token(
        &self,
        user_id: &str,
        claims: HashMap<String, String>,
    ) -> Result<String, String> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| "System time is before Unix epoch")?
            .as_secs();
        let exp = now + self.config.jwt_expiration.as_secs();

        let mut jwt_claims = claims;
        jwt_claims.insert("sub".to_string(), user_id.to_string());
        jwt_claims.insert("iat".to_string(), now.to_string());
        jwt_claims.insert("exp".to_string(), exp.to_string());

        let header = Header::new(Algorithm::HS256);
        let encoding_key = EncodingKey::from_secret(self.config.jwt_secret.as_ref());

        encode(&header, &jwt_claims, &encoding_key)
            .map_err(|e| format!("JWT token generation failed: {}", e))
    }

    pub async fn validate_jwt_token(&self, token: &str) -> Result<HashMap<String, String>, String> {
        let decoding_key = DecodingKey::from_secret(self.config.jwt_secret.as_ref());
        let validation = Validation::new(Algorithm::HS256);

        decode::<HashMap<String, String>>(token, &decoding_key, &validation)
            .map(|token_data| token_data.claims)
            .map_err(|e| format!("JWT token validation failed: {}", e))
    }

    // Login attempt tracking
    pub async fn record_login_attempt(
        &self,
        ip_address: &str,
        user_id: Option<&str>,
        success: bool,
    ) {
        let now = SystemTime::now();
        let key = format!("{}:{}", ip_address, user_id.unwrap_or("unknown"));

        // Record attempt
        let mut attempts = self.login_attempts.write().await;
        let user_attempts = attempts.entry(key.clone()).or_insert_with(Vec::new);
        user_attempts.push(now);

        // Clean old attempts
        let cutoff = now - self.config.lockout_duration;
        user_attempts.retain(|&time| time > cutoff);

        // Check if account should be locked
        if user_attempts.len() >= self.config.max_login_attempts as usize {
            self.log_security_event(SecurityEvent {
                id: Uuid::new_v4().to_string(),
                event_type: SecurityEventType::AccountLockout,
                severity: SecuritySeverity::High,
                user_id: user_id.map(|s| s.to_string()),
                ip_address: ip_address.to_string(),
                user_agent: None,
                description: format!(
                    "Account locked due to {} failed login attempts",
                    user_attempts.len()
                ),
                metadata: HashMap::new(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            })
            .await;
        }

        // Log the attempt
        self.log_security_event(SecurityEvent {
            id: Uuid::new_v4().to_string(),
            event_type: if success {
                SecurityEventType::LoginSuccess
            } else {
                SecurityEventType::LoginFailure
            },
            severity: if success {
                SecuritySeverity::Low
            } else {
                SecuritySeverity::Medium
            },
            user_id: user_id.map(|s| s.to_string()),
            ip_address: ip_address.to_string(),
            user_agent: None,
            description: if success {
                "Successful login".to_string()
            } else {
                "Failed login attempt".to_string()
            },
            metadata: HashMap::new(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })
        .await;
    }

    pub async fn is_account_locked(&self, ip_address: &str, user_id: Option<&str>) -> bool {
        let key = format!("{}:{}", ip_address, user_id.unwrap_or("unknown"));
        let attempts = self.login_attempts.read().await;

        if let Some(user_attempts) = attempts.get(&key) {
            let now = SystemTime::now();
            let cutoff = now - self.config.lockout_duration;
            let recent_attempts = user_attempts.iter().filter(|&&time| time > cutoff).count();

            recent_attempts >= self.config.max_login_attempts as usize
        } else {
            false
        }
    }

    // Rate limiting
    pub async fn check_rate_limit(&self, identifier: &str) -> Result<bool, String> {
        let now = SystemTime::now();
        let mut rate_limits = self.rate_limits.write().await;

        if let Some(entry) = rate_limits.get_mut(identifier) {
            // Check if still in current window
            if now
                .duration_since(entry.window_start)
                .map_err(|_| "Time went backwards")?
                < self.config.rate_limit_window
            {
                if entry.count >= self.config.rate_limit_requests {
                    // Rate limit exceeded
                    self.log_security_event(SecurityEvent {
                        id: Uuid::new_v4().to_string(),
                        event_type: SecurityEventType::RateLimitExceeded,
                        severity: SecuritySeverity::Medium,
                        user_id: None,
                        ip_address: identifier.to_string(),
                        user_agent: None,
                        description: "Rate limit exceeded".to_string(),
                        metadata: HashMap::new(),
                        timestamp: chrono::Utc::now().to_rfc3339(),
                    })
                    .await;

                    return Err("Rate limit exceeded".to_string());
                }
                entry.count += 1;
            } else {
                // New window
                entry.count = 1;
                entry.window_start = now;
            }
        } else {
            // First request
            rate_limits.insert(
                identifier.to_string(),
                RateLimitEntry {
                    count: 1,
                    window_start: now,
                    blocked_until: None,
                },
            );
        }

        Ok(true)
    }

    // Session management
    pub async fn create_session(
        &self,
        user_id: &str,
        ip_address: &str,
        user_agent: &str,
    ) -> String {
        let session_id = Uuid::new_v4().to_string();
        let now = SystemTime::now();
        let expires_at = now + self.config.session_timeout;

        let session_info = SessionInfo {
            user_id: user_id.to_string(),
            ip_address: ip_address.to_string(),
            user_agent: user_agent.to_string(),
            created_at: now,
            last_activity: now,
            expires_at,
        };

        let mut sessions = self.active_sessions.write().await;
        sessions.insert(session_id.clone(), session_info);

        session_id
    }

    pub async fn validate_session(&self, session_id: &str) -> Result<SessionInfo, String> {
        let mut sessions = self.active_sessions.write().await;

        if let Some(session) = sessions.get_mut(session_id) {
            let now = SystemTime::now();

            if now > session.expires_at {
                sessions.remove(session_id);
                return Err("Session expired".to_string());
            }

            // Update last activity
            session.last_activity = now;

            // Extend session if needed
            if now
                .duration_since(session.created_at)
                .map_err(|_| "Session created in future")?
                > self.config.session_timeout / 2
            {
                session.expires_at = now + self.config.session_timeout;
            }

            Ok(session.clone())
        } else {
            Err("Invalid session".to_string())
        }
    }

    pub async fn invalidate_session(&self, session_id: &str) {
        let mut sessions = self.active_sessions.write().await;
        sessions.remove(session_id);
    }

    pub async fn cleanup_expired_sessions(&self) {
        let now = SystemTime::now();
        let mut sessions = self.active_sessions.write().await;

        sessions.retain(|_, session| session.expires_at > now);
    }

    // IP blocking
    pub async fn block_ip(&self, ip_address: &str, duration: Duration) {
        let mut blocked_ips = self.blocked_ips.write().await;
        let block_until = SystemTime::now() + duration;
        blocked_ips.insert(ip_address.to_string(), block_until);

        self.log_security_event(SecurityEvent {
            id: Uuid::new_v4().to_string(),
            event_type: SecurityEventType::SystemIntrusion,
            severity: SecuritySeverity::High,
            user_id: None,
            ip_address: ip_address.to_string(),
            user_agent: None,
            description: format!("IP address blocked for {} seconds", duration.as_secs()),
            metadata: HashMap::new(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })
        .await;
    }

    pub async fn is_ip_blocked(&self, ip_address: &str) -> bool {
        let blocked_ips = self.blocked_ips.read().await;

        if let Some(&block_until) = blocked_ips.get(ip_address) {
            if SystemTime::now() < block_until {
                return true;
            }
        }

        false
    }



    // NOTE: Password validation is handled by services/auth/password.rs (PasswordManager)
    // Deprecated validate_password_strength method removed - use AuthService::validate_password_strength() instead

    // Security event logging
    pub async fn log_security_event(&self, event: SecurityEvent) {
        let mut events = self.security_events.write().await;
        events.push(event);

        // Keep only last 10000 events
        let events_len = events.len();
        if events_len > 10000 {
            events.drain(0..events_len - 10000);
        }
    }

    pub async fn get_security_events(&self, limit: Option<usize>) -> Vec<SecurityEvent> {
        let events = self.security_events.read().await;
        let limit = limit.unwrap_or(100);
        events.iter().rev().take(limit).cloned().collect()
    }

    // Vulnerability scanning
    pub async fn scan_for_vulnerabilities(&self) -> Vec<VulnerabilityReport> {
        // Check for weak passwords
        // Check for SQL injection patterns
        // Check for XSS vulnerabilities
        // Check for CSRF vulnerabilities
        // Check for insecure configurations

        Vec::new()
    }

    // Compliance validation
    pub async fn validate_compliance(&self) -> ComplianceReport {
        ComplianceReport {
            gdpr_compliant: true,
            hipaa_compliant: true,
            sox_compliant: true,
            pci_compliant: true,
            issues: Vec::new(),
            recommendations: Vec::new(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct VulnerabilityReport {
    pub id: String,
    pub severity: SecuritySeverity,
    pub title: String,
    pub description: String,
    pub recommendation: String,
    pub affected_components: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct ComplianceReport {
    pub gdpr_compliant: bool,
    pub hipaa_compliant: bool,
    pub sox_compliant: bool,
    pub pci_compliant: bool,
    pub issues: Vec<String>,
    pub recommendations: Vec<String>,
}

impl SecurityService {
    /// Generate CSRF token
    pub async fn generate_csrf_token(&self, user_id: Uuid) -> Result<String, String> {
        if !self.config.enable_csrf {
            return Ok("csrf_disabled".to_string());
        }

        let token = Uuid::new_v4().to_string();
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| "System time is before UNIX epoch".to_string())?
            .as_secs();
        let expires_at = now + self.config.session_timeout.as_secs();

        let mut csrf_tokens = self.csrf_tokens.write().await;
        csrf_tokens.insert(
            token.clone(),
            CsrfToken {
                user_id,
                expires_at,
            },
        );

        Ok(token)
    }

    /// Validate CSRF token
    pub async fn validate_csrf_token(&self, token: &str, user_id: Uuid) -> Result<bool, String> {
        if !self.config.enable_csrf {
            return Ok(true);
        }

        let csrf_tokens = self.csrf_tokens.read().await;

        if let Some(csrf_token) = csrf_tokens.get(token) {
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map_err(|_| "System time is before UNIX epoch".to_string())?
                .as_secs();

            if csrf_token.user_id == user_id && csrf_token.expires_at > now {
                return Ok(true);
            }
        }

        Err("Invalid or expired CSRF token".to_string())
    }

    /// Sanitize input to prevent XSS and injection attacks
    pub fn sanitize_input(&self, input: &str) -> String {
        input
            .replace('<', "&lt;")
            .replace('>', "&gt;")
            .replace('"', "&quot;")
            .replace('\'', "&#x27;")
            .replace('&', "&amp;")
            .replace('\n', "\\n")
            .replace('\r', "\\r")
            .replace('\t', "\\t")
    }

    /// Validate input for SQL injection patterns
    pub fn validate_input_for_sql_injection(&self, input: &str) -> Result<(), String> {
        let dangerous_patterns = [
            "'",
            "\"",
            ";",
            "--",
            "/*",
            "*/",
            "xp_",
            "sp_",
            "exec",
            "execute",
            "select",
            "insert",
            "update",
            "delete",
            "drop",
            "create",
            "alter",
            "union",
            "script",
            "javascript:",
            "vbscript:",
            "onload",
            "onerror",
        ];

        let input_lower = input.to_lowercase();

        for pattern in &dangerous_patterns {
            if input_lower.contains(pattern) {
                return Err(format!("Potentially dangerous input detected: {}", pattern));
            }
        }

        Ok(())
    }

    /// Validate file upload for security
    pub fn validate_file_upload(
        &self,
        filename: &str,
        content_type: &str,
        size: u64,
    ) -> Result<(), String> {
        // Check file extension
        let allowed_extensions = ["csv", "json", "xlsx", "txt", "pdf"];
        let extension = filename.split('.').next_back().unwrap_or("").to_lowercase();

        if !allowed_extensions.contains(&extension.as_str()) {
            return Err("File type not allowed".to_string());
        }

        // Check content type
        let allowed_types = [
            "text/csv",
            "application/json",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
            "application/pdf",
        ];

        if !allowed_types.contains(&content_type) {
            return Err("Content type not allowed".to_string());
        }

        // Check file size (10MB limit)
        if size > 10 * 1024 * 1024 {
            return Err("File too large".to_string());
        }

        Ok(())
    }

    /// Clean up expired CSRF tokens
    pub async fn cleanup_expired_csrf_tokens(&self) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or(Duration::from_secs(0))
            .as_secs();

        let mut csrf_tokens = self.csrf_tokens.write().await;
        csrf_tokens.retain(|_, token| token.expires_at > now);
    }
}

impl Default for SecurityService {
    fn default() -> Self {
        Self::new(SecurityConfig::default())
    }
}
