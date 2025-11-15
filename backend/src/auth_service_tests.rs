//! Unit tests for AuthService
//!
//! This module contains comprehensive tests for the authentication service functionality.

use crate::services::auth::AuthService;
use crate::test_utils::TestUser;

#[cfg(test)]
mod auth_service_tests {
    use super::*;

    /// Test authentication service password hashing
    #[tokio::test]
    async fn test_auth_service_password_hashing() {
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        // Test password hashing
        let password = "TestPassword123!";
        let hash = auth_service.hash_password(password).unwrap();

        assert!(!hash.is_empty());
        assert_ne!(hash, password);

        // Test password verification
        let is_valid = auth_service.verify_password(password, &hash).unwrap();
        assert!(is_valid);

        // Test invalid password
        let is_invalid = auth_service.verify_password("WrongPassword", &hash).unwrap();
        assert!(!is_invalid);
    }

    /// Test authentication service JWT token
    #[tokio::test]
    async fn test_auth_service_jwt_token() {
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let test_user = TestUser::new();

        // Create a mock user
        let user = crate::models::User {
            id: test_user.id,
            email: test_user.email.clone(),
            password_hash: "hashed_password".to_string(),
            first_name: test_user.first_name.clone(),
            last_name: test_user.last_name.clone(),
            role: test_user.role.to_string(),
            is_active: true,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            last_login: None,
        };

        // Test token generation
        let token = auth_service.generate_token(&user).unwrap();
        assert!(!token.is_empty());

        // Test token validation
        let claims = auth_service.validate_token(&token).unwrap();
        assert_eq!(claims.sub, user.id.to_string());
        assert_eq!(claims.email, user.email);
        assert_eq!(claims.role, user.role);

        // Test user ID extraction
        let user_id = auth_service.get_user_id_from_token(&token).unwrap();
        assert_eq!(user_id, user.id);
    }

    /// Test authentication service password validation
    #[tokio::test]
    async fn test_auth_service_password_validation() {
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        // Test valid password
        let valid_password = "ValidPassword123!";
        assert!(auth_service.validate_password_strength(valid_password).is_ok());

        // Test invalid passwords
        let invalid_passwords = vec![
            "short",                    // Too short
            "nouppercase123!",          // No uppercase
            "NOLOWERCASE123!",          // No lowercase
            "NoNumbers!",               // No numbers
            "NoSpecialChars123",        // No special characters
        ];

        for invalid_password in invalid_passwords {
            assert!(auth_service.validate_password_strength(invalid_password).is_err());
        }
    }

    /// Test authentication service role checking
    #[tokio::test]
    async fn test_auth_service_role_checking() {
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        // Test admin role
        assert!(auth_service.has_role("admin", "user"));
        assert!(auth_service.has_role("admin", "manager"));
        assert!(auth_service.has_role("admin", "admin"));

        // Test manager role
        assert!(auth_service.has_role("manager", "user"));
        assert!(auth_service.has_role("manager", "manager"));
        assert!(!auth_service.has_role("manager", "admin"));

        // Test user role
        assert!(auth_service.has_role("user", "user"));
        assert!(!auth_service.has_role("user", "manager"));
        assert!(!auth_service.has_role("user", "admin"));
    }
}