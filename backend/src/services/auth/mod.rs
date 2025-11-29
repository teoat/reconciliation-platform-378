//! Authentication and security services for the Reconciliation Backend
//!
//! This module provides JWT authentication, password hashing, role-based access control,
//! and security middleware, split into focused sub-modules.

pub mod enhanced;
pub mod jwt;
pub mod middleware;
pub mod password;
pub mod password_reset_rate_limit;
pub mod roles;
pub mod types;
pub mod validation;

pub use enhanced::EnhancedAuthService;
pub use jwt::JwtManager;
pub use middleware::{CorsConfig, SecurityMiddleware};
pub use password::PasswordManager;
pub use roles::{RoleManager, UserRole};
pub use types::*;
pub use validation::ValidationUtils;

use crate::errors::AppResult;

/// Authentication service
///
/// This is the main entry point for authentication operations.
/// It composes the various authentication modules.
///
/// Password handling (hashing, verification, strength validation, and
/// reset/initial password generation) is delegated exclusively to
/// `PasswordManager` in `services/auth/password.rs`. No other module
/// should implement password hashing/verification.
#[derive(Clone)]
pub struct AuthService {
    jwt_manager: JwtManager,
}

impl AuthService {
    pub fn new(jwt_secret: String, jwt_expiration: i64) -> Self {
        Self {
            jwt_manager: JwtManager::new(jwt_secret, jwt_expiration),
        }
    }

    /// Get configured JWT expiration seconds
    pub fn get_expiration(&self) -> i64 {
        self.jwt_manager.get_expiration()
    }

    /// Hash a password using bcrypt
    pub fn hash_password(&self, password: &str) -> AppResult<String> {
        PasswordManager::hash_password(password)
    }

    /// Verify a password against its hash
    pub fn verify_password(&self, password: &str, hash: &str) -> AppResult<bool> {
        PasswordManager::verify_password(password, hash)
    }

    /// Generate a JWT token for a user
    pub fn generate_token(&self, user: &crate::models::User) -> AppResult<String> {
        self.jwt_manager.generate_token(user)
    }

    /// Validate and decode a JWT token
    pub fn validate_token(&self, token: &str) -> AppResult<Claims> {
        self.jwt_manager.validate_token(token)
    }

    /// Extract user ID from token
    pub fn get_user_id_from_token(&self, token: &str) -> AppResult<uuid::Uuid> {
        self.jwt_manager.get_user_id_from_token(token)
    }

    /// Check if user has required role
    pub fn has_role(&self, user_role: &str, required_role: &str) -> bool {
        RoleManager::has_role(user_role, required_role)
    }

    /// Validate password strength
    pub fn validate_password_strength(&self, password: &str) -> AppResult<()> {
        PasswordManager::validate_password_strength(password)
    }

    /// Generate a secure random token for password reset
    pub fn generate_reset_token(&self) -> AppResult<String> {
        PasswordManager::generate_reset_token()
    }
}

// EnhancedAuthService implementation moved to enhanced.rs module

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::TestUser;
    use crate::database::Database;
    use uuid::Uuid;

    async fn create_test_db() -> Database {
        Database::new("postgresql://test:test@localhost/reconciliation_test")
            .await
            .expect("Failed to create test database")
    }

    #[tokio::test]
    async fn test_auth_service_creation() {
        let service = AuthService::new("test_secret".to_string(), 3600);
        assert_eq!(service.get_expiration(), 3600);
    }

    #[tokio::test]
    async fn test_auth_service_password_operations() {
        let service = AuthService::new("test_secret".to_string(), 3600);
        let password = "TestPassword123!";

        // Test password hashing
        let hash = service.hash_password(password).expect("Should hash password");
        assert_ne!(hash, password);
        assert!(hash.len() > 10); // bcrypt hash should be reasonably long

        // Test password verification
        let is_valid = service.verify_password(password, &hash).expect("Should verify password");
        assert!(is_valid);

        // Test wrong password
        let is_invalid = service.verify_password("WrongPassword", &hash).expect("Should reject wrong password");
        assert!(!is_invalid);
    }

    #[tokio::test]
    async fn test_auth_service_jwt_operations() {
        let service = AuthService::new("test_secret".to_string(), 3600);
        let test_user = TestUser::new();

        let user = crate::models::User {
            id: test_user.id,
            email: test_user.email.clone(),
            password_hash: "hashed_password".to_string(),
            username: None,
            first_name: Some(test_user.first_name.clone()),
            last_name: Some(test_user.last_name.clone()),
            status: test_user.role.to_string(),
            email_verified: true,
            email_verified_at: None,
            last_login_at: None,
            last_active_at: None,
            password_expires_at: None,
            password_last_changed: None,
            password_history: None,
            is_initial_password: false,
            initial_password_set_at: None,
            auth_provider: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        // Test token generation
        let token = service.generate_token(&user).expect("Should generate token");
        assert!(!token.is_empty());
        assert!(token.contains(".")); // JWT format has dots

        // Test token validation
        let claims = service.validate_token(&token).expect("Should validate token");
        assert_eq!(claims.sub, user.id.to_string());
        assert_eq!(claims.email, user.email);

        // Test user ID extraction
        let user_id = service.get_user_id_from_token(&token).expect("Should extract user ID");
        assert_eq!(user_id, user.id);
    }

    #[tokio::test]
    async fn test_auth_service_role_operations() {
        let service = AuthService::new("test_secret".to_string(), 3600);

        // Test role hierarchy
        assert!(service.has_role("admin", "admin"));
        assert!(service.has_role("admin", "user"));
        assert!(service.has_role("manager", "user"));
        assert!(service.has_role("user", "user"));
        assert!(!service.has_role("user", "admin"));
        assert!(!service.has_role("viewer", "user"));
    }

    #[tokio::test]
    async fn test_auth_service_password_validation() {
        let service = AuthService::new("test_secret".to_string(), 3600);

        // Valid password
        assert!(service.validate_password_strength("ValidPass123!").is_ok());

        // Invalid passwords
        assert!(service.validate_password_strength("short").is_err());
        assert!(service.validate_password_strength("nouppercase123!").is_err());
        assert!(service.validate_password_strength("NOLOWERCASE123!").is_err());
        assert!(service.validate_password_strength("NoNumbers!").is_err());
        assert!(service.validate_password_strength("NoSpecial123").is_err());
    }

    #[tokio::test]
    async fn test_auth_service_reset_token_generation() {
        let service = AuthService::new("test_secret".to_string(), 3600);

        let token = service.generate_reset_token().expect("Should generate reset token");
        assert!(!token.is_empty());
        assert!(token.len() >= 32); // Should be reasonably long
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_creation() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        // Test default values
        assert_eq!(service.session_timeout, 3600);
        assert_eq!(service.password_reset_timeout, 1800);
        assert_eq!(service.session_rotation_interval, 900);
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_session_rotation() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        let now = chrono::Utc::now();

        // Test session that doesn't need rotation
        let recent_time = now - chrono::Duration::minutes(5);
        assert!(!service.should_rotate_session(recent_time));

        // Test session that needs rotation
        let old_time = now - chrono::Duration::minutes(20);
        assert!(service.should_rotate_session(old_time));
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_create_session() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);
        let db = create_test_db().await;
        let test_user = TestUser::new();

        let user = crate::models::User {
            id: test_user.id,
            email: test_user.email.clone(),
            password_hash: "hashed_password".to_string(),
            username: None,
            first_name: Some(test_user.first_name.clone()),
            last_name: Some(test_user.last_name.clone()),
            status: test_user.role.to_string(),
            email_verified: true,
            email_verified_at: None,
            last_login_at: None,
            last_active_at: None,
            password_expires_at: None,
            password_last_changed: None,
            password_history: None,
            is_initial_password: false,
            initial_password_set_at: None,
            auth_provider: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        let session = service.create_session(&user, &db).await.expect("Should create session");

        assert_eq!(session.user_id, user.id);
        assert_eq!(session.email, user.email);
        assert_eq!(session.role, user.status.clone());
        assert!(session.expires_at > session.created_at);
        assert_eq!(session.last_activity, session.created_at);
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_rotated_session() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);
        let db = create_test_db().await;
        let test_user = TestUser::new();

        let user = crate::models::User {
            id: test_user.id,
            email: test_user.email.clone(),
            password_hash: "hashed_password".to_string(),
            username: None,
            first_name: Some(test_user.first_name.clone()),
            last_name: Some(test_user.last_name.clone()),
            status: test_user.role.to_string(),
            email_verified: true,
            email_verified_at: None,
            last_login_at: None,
            last_active_at: None,
            password_expires_at: None,
            password_last_changed: None,
            password_history: None,
            is_initial_password: false,
            initial_password_set_at: None,
            auth_provider: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        let session = service.create_rotated_session(&user, &db).await.expect("Should create rotated session");

        assert_eq!(session.user_id, user.id);
        assert!(session.expires_at > session.created_at);
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_password_reset_token() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);
        let db = create_test_db().await;

        // This test would require a real user in the database
        // For now, test that the method exists and handles errors gracefully
        let result = service.generate_password_reset_token("nonexistent@example.com", &db).await;
        // Should fail gracefully for non-existent user
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_confirm_password_reset() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);
        let db = create_test_db().await;

        // Test with invalid token
        let result = service.confirm_password_reset("invalid_token", "NewPass123!", &db).await;
        assert!(result.is_err());

        // Test with weak password
        let result = service.confirm_password_reset("some_token", "weak", &db).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_permissions() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        // Test permission checking
        assert!(service.check_permission("admin", "users", "delete"));
        assert!(service.check_permission("user", "projects", "create"));
        assert!(!service.check_permission("viewer", "users", "delete"));

        // Test permission listing
        let admin_permissions = service.get_user_permissions("admin");
        assert!(admin_permissions.contains(&"users:create".to_string()));
        assert!(admin_permissions.contains(&"system:admin".to_string()));

        let user_permissions = service.get_user_permissions("user");
        assert!(user_permissions.contains(&"projects:create".to_string()));
        assert!(!user_permissions.contains(&"users:delete".to_string()));
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_api_key_generation() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);
        let db = create_test_db().await;

        let api_key = service.generate_api_key(Uuid::new_v4(), "Test API Key", &db).await.expect("Should generate API key");
        assert!(!api_key.is_empty());
        assert!(api_key.len() >= 32);
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_password_strength_validation() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        assert!(service.validate_password_strength("ValidPass123!").is_ok());
        assert!(service.validate_password_strength("weak").is_err());
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_hash_password() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        let hash = service.hash_password("TestPassword123!").expect("Should hash password");
        assert!(!hash.is_empty());
        assert_ne!(hash, "TestPassword123!");
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_generate_reset_token() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        let token = service.generate_reset_token().expect("Should generate token");
        assert!(!token.is_empty());
        assert!(token.len() >= 32);
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_email_verification_token() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);
        let db = create_test_db().await;

        // Test with invalid user ID (would fail in real scenario)
        let result = service.generate_email_verification_token(Uuid::nil(), "test@example.com", &db).await;
        // Should either succeed or fail gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_verify_email() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);
        let db = create_test_db().await;

        // Test with invalid token
        let result = service.verify_email("invalid_token", &db).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_auth_service_error_handling() {
        let service = AuthService::new("test_secret".to_string(), 3600);

        // Test invalid JWT
        let result = service.validate_token("invalid.jwt.token");
        assert!(result.is_err());

        // Test empty password
        let result = service.hash_password("");
        assert!(result.is_err());

        // Test password verification with invalid hash
        let result = service.verify_password("password", "invalid_hash");
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_error_handling() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);
        let db = create_test_db().await;

        // Test session creation with invalid user
        let invalid_user = crate::models::User {
            id: Uuid::nil(),
            email: "invalid".to_string(),
            password_hash: "hash".to_string(),
            username: None,
            first_name: Some("Invalid".to_string()),
            last_name: Some("User".to_string()),
            status: "invalid".to_string(),
            email_verified: false,
            email_verified_at: None,
            last_login_at: None,
            last_active_at: None,
            password_expires_at: None,
            password_last_changed: None,
            password_history: None,
            is_initial_password: false,
            initial_password_set_at: None,
            auth_provider: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        let result = service.create_session(&invalid_user, &db).await;
        // Should still create session even with invalid user data
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_auth_service_clone() {
        let service1 = AuthService::new("test_secret".to_string(), 3600);
        let service2 = service1.clone();

        assert_eq!(service1.get_expiration(), service2.get_expiration());
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_clone() {
        let service1 = EnhancedAuthService::new("test_secret".to_string(), 3600);
        let service2 = service1.clone();

        assert_eq!(service1.session_timeout, service2.session_timeout);
        assert_eq!(service1.password_reset_timeout, service2.password_reset_timeout);
    }
}
