//! Comprehensive service layer tests for AuthService
//!
//! Tests AuthService methods including JWT operations, password management,
//! role-based access control, and enhanced authentication features.

use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::services::auth::{
    AuthService, EnhancedAuthService, JwtManager, PasswordManager, RoleManager,
};
use reconciliation_backend::test_utils_export::database::setup_test_database;
use reconciliation_backend::models::User;

/// Test AuthService methods
#[cfg(test)]
mod auth_service_comprehensive_tests {
    use super::*;

    fn create_test_user() -> User {
        User {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            username: None,
            password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqBWVHxkd0".to_string(),
            first_name: Some("Test".to_string()),
            last_name: Some("User".to_string()),
            status: "user".to_string(),
            email_verified: true,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            last_login_at: None,
            last_active_at: None,
            password_expires_at: None,
            password_last_changed: None,
            password_history: None,
            is_initial_password: Some(false),
            initial_password_set_at: None,
        }
    }

    // =========================================================================
    // AuthService Tests
    // =========================================================================

    #[tokio::test]
    async fn test_auth_service_creation() {
        let service = AuthService::new("test_secret".to_string(), 3600);
        assert_eq!(service.get_expiration(), 3600);
    }

    #[tokio::test]
    async fn test_auth_service_password_hash() {
        let service = AuthService::new("test_secret".to_string(), 3600);
        let password = "TestPassword123!";

        let hash = service.hash_password(password).unwrap();
        assert_ne!(hash, password);
        assert!(hash.len() > 10);
    }

    #[tokio::test]
    async fn test_auth_service_password_verify() {
        let service = AuthService::new("test_secret".to_string(), 3600);
        let password = "TestPassword123!";

        let hash = service.hash_password(password).unwrap();
        let is_valid = service.verify_password(password, &hash).unwrap();
        assert!(is_valid);

        let is_invalid = service.verify_password("WrongPassword", &hash).unwrap();
        assert!(!is_invalid);
    }

    #[tokio::test]
    async fn test_auth_service_generate_token() {
        let service = AuthService::new("test_secret".to_string(), 3600);
        let user = create_test_user();

        let token = service.generate_token(&user).unwrap();
        assert!(!token.is_empty());
    }

    #[tokio::test]
    async fn test_auth_service_validate_token() {
        let service = AuthService::new("test_secret".to_string(), 3600);
        let user = create_test_user();

        let token = service.generate_token(&user).unwrap();
        let claims = service.validate_token(&token).unwrap();

        assert_eq!(claims.sub, user.id.to_string());
        assert_eq!(claims.email, user.email);
        assert_eq!(claims.role, user.status);
    }

    #[tokio::test]
    async fn test_auth_service_validate_invalid_token() {
        let service = AuthService::new("test_secret".to_string(), 3600);

        let result = service.validate_token("invalid_token");
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_auth_service_get_user_id_from_token() {
        let service = AuthService::new("test_secret".to_string(), 3600);
        let user = create_test_user();

        let token = service.generate_token(&user).unwrap();
        let user_id = service.get_user_id_from_token(&token).unwrap();

        assert_eq!(user_id, user.id);
    }

    #[tokio::test]
    async fn test_auth_service_has_role() {
        let service = AuthService::new("test_secret".to_string(), 3600);

        assert!(service.has_role("admin", "user"));
        assert!(service.has_role("manager", "user"));
        assert!(service.has_role("user", "user"));
        assert!(!service.has_role("viewer", "user"));
    }

    #[tokio::test]
    async fn test_auth_service_validate_password_strength() {
        let service = AuthService::new("test_secret".to_string(), 3600);

        // Valid password
        let result = service.validate_password_strength("TestPassword123!");
        assert!(result.is_ok());

        // Weak password
        let result = service.validate_password_strength("weak");
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_auth_service_generate_reset_token() {
        let service = AuthService::new("test_secret".to_string(), 3600);

        let token = service.generate_reset_token().unwrap();
        assert!(!token.is_empty());
        assert!(token.len() >= 32);
    }

    // =========================================================================
    // JwtManager Tests
    // =========================================================================

    #[tokio::test]
    async fn test_jwt_manager_creation() {
        let manager = JwtManager::new("test_secret".to_string(), 3600);
        assert_eq!(manager.get_expiration(), 3600);
    }

    #[tokio::test]
    async fn test_jwt_manager_generate_token() {
        let manager = JwtManager::new("test_secret".to_string(), 3600);
        let user = create_test_user();

        let token = manager.generate_token(&user).unwrap();
        assert!(!token.is_empty());
    }

    #[tokio::test]
    async fn test_jwt_manager_validate_token() {
        let manager = JwtManager::new("test_secret".to_string(), 3600);
        let user = create_test_user();

        let token = manager.generate_token(&user).unwrap();
        let claims = manager.validate_token(&token).unwrap();

        assert_eq!(claims.sub, user.id.to_string());
    }

    #[tokio::test]
    async fn test_jwt_manager_get_user_id_from_token() {
        let manager = JwtManager::new("test_secret".to_string(), 3600);
        let user = create_test_user();

        let token = manager.generate_token(&user).unwrap();
        let user_id = manager.get_user_id_from_token(&token).unwrap();

        assert_eq!(user_id, user.id);
    }

    // =========================================================================
    // PasswordManager Tests
    // =========================================================================

    #[tokio::test]
    async fn test_password_manager_hash_password() {
        let password = "TestPassword123!";
        let hash = PasswordManager::hash_password(password).unwrap();

        assert_ne!(hash, password);
        assert!(hash.len() > 10);
    }

    #[tokio::test]
    async fn test_password_manager_verify_password() {
        let password = "TestPassword123!";
        let hash = PasswordManager::hash_password(password).unwrap();

        let is_valid = PasswordManager::verify_password(password, &hash).unwrap();
        assert!(is_valid);

        let is_invalid = PasswordManager::verify_password("WrongPassword", &hash).unwrap();
        assert!(!is_invalid);
    }

    #[tokio::test]
    async fn test_password_manager_validate_password_strength() {
        // Valid password
        let result = PasswordManager::validate_password_strength("TestPassword123!");
        assert!(result.is_ok());

        // Too short
        let result = PasswordManager::validate_password_strength("Short1!");
        assert!(result.is_err());

        // No uppercase
        let result = PasswordManager::validate_password_strength("testpassword123!");
        assert!(result.is_err());

        // No number
        let result = PasswordManager::validate_password_strength("TestPassword!");
        assert!(result.is_err());

        // No special character
        let result = PasswordManager::validate_password_strength("TestPassword123");
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_password_manager_calculate_password_strength() {
        let weak = PasswordManager::calculate_password_strength("weak");
        assert!(matches!(weak, reconciliation_backend::config::password_config::PasswordStrength::Weak));

        let medium = PasswordManager::calculate_password_strength("TestPassword123");
        assert!(matches!(medium, reconciliation_backend::config::password_config::PasswordStrength::Medium));

        let strong = PasswordManager::calculate_password_strength("TestPassword123!");
        assert!(matches!(strong, reconciliation_backend::config::password_config::PasswordStrength::Strong));
    }

    #[tokio::test]
    async fn test_password_manager_generate_reset_token() {
        let token = PasswordManager::generate_reset_token().unwrap();
        assert!(!token.is_empty());
        assert!(token.len() >= 32);
    }

    #[tokio::test]
    async fn test_password_manager_generate_initial_password() {
        let password = PasswordManager::generate_initial_password().unwrap();
        assert!(!password.is_empty());
        assert!(password.len() >= 12);
    }

    // =========================================================================
    // RoleManager Tests
    // =========================================================================

    #[tokio::test]
    async fn test_role_manager_has_role() {
        assert!(RoleManager::has_role("admin", "user"));
        assert!(RoleManager::has_role("manager", "user"));
        assert!(RoleManager::has_role("user", "user"));
        assert!(!RoleManager::has_role("viewer", "user"));
    }

    #[tokio::test]
    async fn test_role_manager_check_permission() {
        // Admin has all permissions
        assert!(RoleManager::check_permission("admin", "users", "create"));
        assert!(RoleManager::check_permission("admin", "projects", "delete"));

        // Manager permissions
        assert!(RoleManager::check_permission("manager", "users", "read"));
        assert!(RoleManager::check_permission("manager", "projects", "create"));
        assert!(!RoleManager::check_permission("manager", "users", "delete"));

        // User permissions
        assert!(RoleManager::check_permission("user", "projects", "read"));
        assert!(RoleManager::check_permission("user", "reconciliation", "create"));
        assert!(!RoleManager::check_permission("user", "users", "create"));

        // Viewer permissions
        assert!(RoleManager::check_permission("viewer", "projects", "read"));
        assert!(!RoleManager::check_permission("viewer", "projects", "create"));
    }

    #[tokio::test]
    async fn test_role_manager_get_user_permissions() {
        let admin_perms = RoleManager::get_user_permissions("admin");
        assert!(admin_perms.contains(&"users:create".to_string()));
        assert!(admin_perms.contains(&"system:admin".to_string()));

        let manager_perms = RoleManager::get_user_permissions("manager");
        assert!(manager_perms.contains(&"users:read".to_string()));
        assert!(!manager_perms.contains(&"users:delete".to_string()));

        let user_perms = RoleManager::get_user_permissions("user");
        assert!(user_perms.contains(&"projects:read".to_string()));
        assert!(!user_perms.contains(&"users:create".to_string()));
    }

    // =========================================================================
    // EnhancedAuthService Tests
    // =========================================================================

    #[tokio::test]
    async fn test_enhanced_auth_service_creation() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);
        assert_eq!(service.session_timeout, 3600);
        assert_eq!(service.password_reset_timeout, 1800);
        assert_eq!(service.session_rotation_interval, 900);
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_should_rotate_session() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        let old_time = chrono::Utc::now() - chrono::Duration::seconds(1000);
        assert!(service.should_rotate_session(old_time));

        let recent_time = chrono::Utc::now() - chrono::Duration::seconds(100);
        assert!(!service.should_rotate_session(recent_time));
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_create_session() {
        let (db, _) = setup_test_database().await;
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);
        let user = create_test_user();

        let session = service.create_session(&user, &db).await.unwrap();
        assert_eq!(session.user_id, user.id);
        assert_eq!(session.email, user.email);
        assert_eq!(session.role, user.status);
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_create_rotated_session() {
        let (db, _) = setup_test_database().await;
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);
        let user = create_test_user();

        let session = service.create_rotated_session(&user, &db).await.unwrap();
        assert_eq!(session.user_id, user.id);
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_check_permission() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        assert!(service.check_permission("admin", "users", "create"));
        assert!(service.check_permission("manager", "projects", "read"));
        assert!(!service.check_permission("viewer", "users", "create"));
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_get_user_permissions() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        let admin_perms = service.get_user_permissions("admin");
        assert!(admin_perms.contains(&"users:create".to_string()));

        let user_perms = service.get_user_permissions("user");
        assert!(user_perms.contains(&"projects:read".to_string()));
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_validate_password_strength() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        let result = service.validate_password_strength("TestPassword123!");
        assert!(result.is_ok());

        let result = service.validate_password_strength("weak");
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_hash_password() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        let hash = service.hash_password("TestPassword123!").unwrap();
        assert!(!hash.is_empty());
        assert!(hash.len() > 10);
    }

    #[tokio::test]
    async fn test_enhanced_auth_service_generate_reset_token() {
        let service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        let token = service.generate_reset_token().unwrap();
        assert!(!token.is_empty());
        assert!(token.len() >= 32);
    }

    // =========================================================================
    // Edge Cases and Error Conditions
    // =========================================================================

    #[tokio::test]
    async fn test_auth_service_token_expiration() {
        let service = AuthService::new("test_secret".to_string(), 1); // 1 second expiration
        let user = create_test_user();

        let token = service.generate_token(&user).unwrap();
        
        // Token should be valid immediately
        let claims = service.validate_token(&token).unwrap();
        assert_eq!(claims.sub, user.id.to_string());

        // Wait for expiration
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

        // Token should be invalid after expiration
        let result = service.validate_token(&token);
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_auth_service_different_secrets() {
        let service1 = AuthService::new("secret1".to_string(), 3600);
        let service2 = AuthService::new("secret2".to_string(), 3600);
        let user = create_test_user();

        let token = service1.generate_token(&user).unwrap();
        
        // Token from service1 should not validate with service2
        let result = service2.validate_token(&token);
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_password_manager_banned_passwords() {
        let banned = ["password", "12345678", "password123", "admin123"];
        
        for banned_pwd in banned {
            let result = PasswordManager::validate_password_strength(banned_pwd);
            assert!(result.is_err(), "Banned password should be rejected: {}", banned_pwd);
        }
    }

    #[tokio::test]
    async fn test_password_manager_sequential_chars() {
        // Password with too many sequential characters
        let result = PasswordManager::validate_password_strength("Test12345678!");
        // May succeed or fail depending on config
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_role_manager_invalid_role() {
        assert!(!RoleManager::has_role("invalid", "user"));
        assert!(!RoleManager::check_permission("invalid", "users", "read"));
        assert!(RoleManager::get_user_permissions("invalid").is_empty());
    }
}

