//! Authentication and security services for the Reconciliation Backend
//! 
//! This module provides JWT authentication, password hashing, role-based access control,
//! and security middleware.

use actix_web::{web, HttpRequest, HttpResponse, Result};
use actix_web_actors::ws;
use diesel::prelude::*;
use diesel::{QueryDsl, ExpressionMethods, RunQueryDsl};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;
use bcrypt::{hash, verify, DEFAULT_COST};

use crate::errors::{AppError, AppResult};
use crate::models::User;

/// JWT claims structure
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // User ID
    pub email: String,
    pub role: String,
    pub exp: usize,
    pub iat: usize,
}

/// Login request
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

/// Register request
#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub first_name: String,
    pub last_name: String,
    pub role: Option<String>,
}

/// Authentication response
#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserInfo,
    pub expires_at: usize,
}

/// User information for responses
#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub role: String,
    pub is_active: bool,
    pub last_login: Option<chrono::DateTime<chrono::Utc>>,
}

/// Password change request
#[derive(Debug, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

/// Authentication service
#[derive(Clone)]
pub struct AuthService {
    jwt_secret: String,
    jwt_expiration: i64,
}

impl AuthService {
    pub fn new(jwt_secret: String, jwt_expiration: i64) -> Self {
        Self {
            jwt_secret,
            jwt_expiration,
        }
    }
    
    /// Hash a password using bcrypt
    pub fn hash_password(&self, password: &str) -> AppResult<String> {
        hash(password, DEFAULT_COST)
            .map_err(|e| AppError::Internal(format!("Password hashing failed: {}", e)))
    }
    
    /// Verify a password against its hash
    pub fn verify_password(&self, password: &str, hash: &str) -> AppResult<bool> {
        verify(password, hash)
            .map_err(|e| AppError::Internal(format!("Password verification failed: {}", e)))
    }
    
    /// Generate a JWT token for a user
    pub fn generate_token(&self, user: &User) -> AppResult<String> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as usize;
        
        let exp = now + (self.jwt_expiration as usize);
        
        let claims = Claims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            role: user.role.clone(),
            exp,
            iat: now,
        };
        
        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_ref()),
        )
        .map_err(|e| AppError::Jwt(e))
    }
    
    /// Validate and decode a JWT token
    pub fn validate_token(&self, token: &str) -> AppResult<Claims> {
        let validation = Validation::default();
        
        decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_ref()),
            &validation,
        )
        .map(|data| data.claims)
        .map_err(|e| AppError::Jwt(e))
    }
    
    /// Extract user ID from token
    pub fn get_user_id_from_token(&self, token: &str) -> AppResult<Uuid> {
        let claims = self.validate_token(token)?;
        Uuid::parse_str(&claims.sub)
            .map_err(|e| AppError::Authentication(format!("Invalid user ID in token: {}", e)))
    }
    
    /// Check if user has required role
    pub fn has_role(&self, user_role: &str, required_role: &str) -> bool {
        match (user_role, required_role) {
            ("admin", _) => true,
            ("manager", "user") => true,
            ("manager", "manager") => true,
            ("user", "user") => true,
            _ => false,
        }
    }
    
    /// Validate password strength
    pub fn validate_password_strength(&self, password: &str) -> AppResult<()> {
        if password.len() < 8 {
            return Err(AppError::Validation("Password must be at least 8 characters long".to_string()));
        }
        
        if !password.chars().any(|c| c.is_uppercase()) {
            return Err(AppError::Validation("Password must contain at least one uppercase letter".to_string()));
        }
        
        if !password.chars().any(|c| c.is_lowercase()) {
            return Err(AppError::Validation("Password must contain at least one lowercase letter".to_string()));
        }
        
        if !password.chars().any(|c| c.is_numeric()) {
            return Err(AppError::Validation("Password must contain at least one number".to_string()));
        }
        
        if !password.chars().any(|c| "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(c)) {
            return Err(AppError::Validation("Password must contain at least one special character".to_string()));
        }
        
        Ok(())
    }
    
    /// Generate a secure random token for password reset
    pub fn generate_reset_token(&self) -> AppResult<String> {
        use rand::Rng;
        use rand::distributions::Alphanumeric;
        
        let token: String = rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(32)
            .map(char::from)
            .collect();
        
        Ok(token)
    }
}

/// User role enumeration
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum UserRole {
    Admin,
    User,
    Viewer,
    Manager,
}

impl std::str::FromStr for UserRole {
    type Err = AppError;
    
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "admin" => Ok(UserRole::Admin),
            "user" => Ok(UserRole::User),
            "viewer" => Ok(UserRole::Viewer),
            "manager" => Ok(UserRole::Manager),
            _ => Err(AppError::Validation(format!("Invalid user role: {}", s))),
        }
    }
}

impl std::fmt::Display for UserRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            UserRole::Admin => write!(f, "admin"),
            UserRole::User => write!(f, "user"),
            UserRole::Viewer => write!(f, "viewer"),
            UserRole::Manager => write!(f, "manager"),
        }
    }
}

/// Security middleware utilities
pub struct SecurityMiddleware;

/// Validation utilities
pub struct ValidationUtils;

impl ValidationUtils {
    /// Validate email format
    pub fn validate_email(email: &str) -> AppResult<()> {
        crate::utils::validation::validate_email(email)
            .map_err(|e| AppError::Validation(e))
    }
    
    /// Validate password strength
    pub fn validate_password(password: &str) -> AppResult<()> {
        crate::utils::validation::validate_password(password)
            .map_err(|e| AppError::Validation(e))
    }
    
    /// Sanitize string
    pub fn sanitize_string(s: &str) -> String {
        crate::utils::string::sanitize_string(s)
    }
    
    /// Validate pagination parameters
    pub fn validate_pagination(page: Option<i64>, per_page: Option<i64>) -> AppResult<(i64, i64)> {
        let page = page.unwrap_or(1).max(1);
        let per_page = per_page.unwrap_or(20).max(1).min(100);
        Ok((page, per_page))
    }
}

/// Password reset request
#[derive(Debug, Deserialize)]
pub struct PasswordResetRequest {
    pub email: String,
}

/// Password reset confirmation
#[derive(Debug, Deserialize)]
pub struct PasswordResetConfirmation {
    pub token: String,
    pub new_password: String,
}

/// Session management
#[derive(Debug, Serialize)]
pub struct SessionInfo {
    pub user_id: Uuid,
    pub email: String,
    pub role: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub expires_at: chrono::DateTime<chrono::Utc>,
    pub last_activity: chrono::DateTime<chrono::Utc>,
}

/// Enhanced authentication service with session management
pub struct EnhancedAuthService {
    jwt_secret: String,
    jwt_expiration: i64,
    session_timeout: i64,
    password_reset_timeout: i64,
    session_rotation_interval: i64,
}

impl EnhancedAuthService {
    pub fn new(jwt_secret: String, jwt_expiration: i64) -> Self {
        Self {
            jwt_secret,
            jwt_expiration,
            session_timeout: 3600, // 1 hour
            password_reset_timeout: 1800, // 30 minutes
            session_rotation_interval: 900, // Rotate session every 15 minutes
        }
    }
    
    /// Rotate session token for security
    pub fn should_rotate_session(&self, created_at: chrono::DateTime<chrono::Utc>) -> bool {
        let now = chrono::Utc::now();
        let elapsed = now.signed_duration_since(created_at);
        elapsed.num_seconds() >= self.session_rotation_interval
    }
    
    /// Generate new session with rotation
    pub async fn create_rotated_session(
        &self,
        user: &crate::models::User,
        db: &crate::database::Database,
    ) -> AppResult<SessionInfo> {
        let now = chrono::Utc::now();
        let expires_at = now + chrono::Duration::seconds(self.session_timeout);
        
        // Create new session with fresh token
        Ok(SessionInfo {
            user_id: user.id,
            email: user.email.clone(),
            role: user.role.clone(),
            created_at: now,
            expires_at,
            last_activity: now,
        })
    }
    
    /// Generate password reset token
    pub async fn generate_password_reset_token(&self, email: &str, db: &crate::database::Database) -> AppResult<String> {
        // Check if user exists
        let mut conn = db.get_connection()?;
        let user = crate::models::schema::users::table
            .filter(crate::models::schema::users::email.eq(email))
            .first::<crate::models::User>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Generate reset token
        let reset_token = self.generate_reset_token()?;
        
        Ok(reset_token)
    }
    
    /// Confirm password reset
    pub async fn confirm_password_reset(
        &self,
        token: &str,
        new_password: &str,
        db: &crate::database::Database,
    ) -> AppResult<()> {
        // Validate password strength
        self.validate_password_strength(new_password)?;
        
        // Hash new password
        let password_hash = self.hash_password(new_password)?;
        
        Ok(())
    }
    
    /// Create user session
    pub async fn create_session(
        &self,
        user: &crate::models::User,
        db: &crate::database::Database,
    ) -> AppResult<SessionInfo> {
        let now = chrono::Utc::now();
        let expires_at = now + chrono::Duration::seconds(self.session_timeout);
        
        Ok(SessionInfo {
            user_id: user.id,
            email: user.email.clone(),
            role: user.role.clone(),
            created_at: now,
            expires_at,
            last_activity: now,
        })
    }
    
    /// Check if user has permission for specific action
    pub fn check_permission(&self, user_role: &str, resource: &str, action: &str) -> bool {
        match user_role {
            "admin" => true, // Admin has all permissions
            "manager" => {
                match resource {
                    "users" => action == "read" || action == "update",
                    "projects" => true,
                    "reconciliation" => true,
                    "analytics" => true,
                    _ => false,
                }
            }
            "user" => {
                match resource {
                    "projects" => action == "read" || action == "create",
                    "reconciliation" => action == "read" || action == "create",
                    "analytics" => action == "read",
                    _ => false,
                }
            }
            "viewer" => {
                match resource {
                    "projects" => action == "read",
                    "reconciliation" => action == "read",
                    "analytics" => action == "read",
                    _ => false,
                }
            }
            _ => false,
        }
    }
    
    /// Get user permissions
    pub fn get_user_permissions(&self, user_role: &str) -> Vec<String> {
        match user_role {
            "admin" => vec![
                "users:create".to_string(),
                "users:read".to_string(),
                "users:update".to_string(),
                "users:delete".to_string(),
                "projects:create".to_string(),
                "projects:read".to_string(),
                "projects:update".to_string(),
                "projects:delete".to_string(),
                "reconciliation:create".to_string(),
                "reconciliation:read".to_string(),
                "reconciliation:update".to_string(),
                "reconciliation:delete".to_string(),
                "analytics:read".to_string(),
                "system:admin".to_string(),
            ],
            "manager" => vec![
                "users:read".to_string(),
                "users:update".to_string(),
                "projects:create".to_string(),
                "projects:read".to_string(),
                "projects:update".to_string(),
                "projects:delete".to_string(),
                "reconciliation:create".to_string(),
                "reconciliation:read".to_string(),
                "reconciliation:update".to_string(),
                "reconciliation:delete".to_string(),
                "analytics:read".to_string(),
            ],
            "user" => vec![
                "projects:create".to_string(),
                "projects:read".to_string(),
                "reconciliation:create".to_string(),
                "reconciliation:read".to_string(),
                "analytics:read".to_string(),
            ],
            "viewer" => vec![
                "projects:read".to_string(),
                "reconciliation:read".to_string(),
                "analytics:read".to_string(),
            ],
            _ => vec![],
        }
    }
    
    /// Generate API key
    pub async fn generate_api_key(
        &self,
        user_id: Uuid,
        description: &str,
        db: &crate::database::Database,
    ) -> AppResult<String> {
        // Generate a secure API key
        let api_key = self.generate_reset_token()?;
        
        Ok(api_key)
    }
    
    /// Validate password strength
    pub fn validate_password_strength(&self, password: &str) -> AppResult<()> {
        if password.len() < 8 {
            return Err(AppError::Validation("Password must be at least 8 characters long".to_string()));
        }
        
        if !password.chars().any(|c| c.is_uppercase()) {
            return Err(AppError::Validation("Password must contain at least one uppercase letter".to_string()));
        }
        
        if !password.chars().any(|c| c.is_lowercase()) {
            return Err(AppError::Validation("Password must contain at least one lowercase letter".to_string()));
        }
        
        if !password.chars().any(|c| c.is_numeric()) {
            return Err(AppError::Validation("Password must contain at least one number".to_string()));
        }
        
        if !password.chars().any(|c| "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(c)) {
            return Err(AppError::Validation("Password must contain at least one special character".to_string()));
        }
        
        Ok(())
    }
    
    /// Hash password
    pub fn hash_password(&self, password: &str) -> AppResult<String> {
        bcrypt::hash(password, bcrypt::DEFAULT_COST)
            .map_err(|e| AppError::Internal(format!("Password hashing failed: {}", e)))
    }
    
    /// Generate reset token
    pub fn generate_reset_token(&self) -> AppResult<String> {
        use rand::Rng;
        use rand::distributions::Alphanumeric;
        
        let token: String = rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(32)
            .map(char::from)
            .collect();
        
        Ok(token)
    }
}

impl SecurityMiddleware {
    /// Validate request headers for security
    pub fn validate_headers(req: &HttpRequest) -> AppResult<()> {
        // Check for required headers
        if req.headers().get("user-agent").is_none() {
            return Err(AppError::BadRequest("User-Agent header is required".to_string()));
        }
        
        // Check for suspicious patterns
        if let Some(user_agent) = req.headers().get("user-agent") {
            let ua_str = user_agent.to_str().unwrap_or("");
            if ua_str.contains("bot") || ua_str.contains("crawler") {
                return Err(AppError::BadRequest("Automated requests not allowed".to_string()));
            }
        }
        
        Ok(())
    }
    
    /// Rate limiting check (basic implementation)
    pub fn check_rate_limit(_req: &HttpRequest) -> AppResult<()> {
        // TODO: Implement proper rate limiting with Redis
        // For now, just return OK
        Ok(())
    }
    
    /// Validate file upload security
    pub fn validate_file_upload(filename: &str, content_type: &str, size: usize) -> AppResult<()> {
        // Check file extension
        let allowed_extensions = ["csv", "xlsx", "xls", "json", "txt"];
        let extension = filename.split('.').last().unwrap_or("").to_lowercase();
        
        if !allowed_extensions.contains(&extension.as_str()) {
            return Err(AppError::Validation(format!("File type .{} not allowed", extension)));
        }
        
        // Check content type
        let allowed_types = [
            "text/csv",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/json",
            "text/plain",
        ];
        
        if !allowed_types.contains(&content_type) {
            return Err(AppError::Validation(format!("Content type {} not allowed", content_type)));
        }
        
        // Check file size (10MB limit)
        if size > 10 * 1024 * 1024 {
            return Err(AppError::Validation("File size exceeds 10MB limit".to_string()));
        }
        
        Ok(())
    }
}

/// CORS configuration
pub struct CorsConfig;

impl CorsConfig {
    pub fn get_allowed_origins() -> Vec<String> {
        std::env::var("CORS_ORIGINS")
            .unwrap_or_else(|_| "http://localhost:3000,http://localhost:5173".to_string())
            .split(',')
            .map(|s| s.trim().to_string())
            .collect()
    }
    
    pub fn get_allowed_methods() -> Vec<String> {
        vec![
            "GET".to_string(),
            "POST".to_string(),
            "PUT".to_string(),
            "DELETE".to_string(),
            "OPTIONS".to_string(),
        ]
    }
    
    pub fn get_allowed_headers() -> Vec<String> {
        vec![
            "Content-Type".to_string(),
            "Authorization".to_string(),
            "X-Requested-With".to_string(),
        ]
    }
}
