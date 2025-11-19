//! Unit tests for AuthService
//!
//! This module contains comprehensive tests for the authentication service functionality.

use crate::services::auth::{AuthService, EnhancedAuthService, SessionInfo};
use crate::test_utils::TestUser;
use crate::database::Database;

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

    /// Test authentication service reset token generation
    #[tokio::test]
    async fn test_auth_service_reset_token_generation() {
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        // Test reset token generation
        let token1 = auth_service.generate_reset_token().unwrap();
        let token2 = auth_service.generate_reset_token().unwrap();

        assert!(!token1.is_empty());
        assert!(!token2.is_empty());
        assert_ne!(token1, token2); // Tokens should be unique
        assert!(token1.len() >= 32); // Should be reasonably long
    }

    /// Test authentication service invalid token handling
    #[tokio::test]
    async fn test_auth_service_invalid_token_handling() {
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        // Test invalid token
        let result = auth_service.validate_token("invalid_token");
        assert!(result.is_err());

        // Test empty token
        let result = auth_service.validate_token("");
        assert!(result.is_err());

        // Test malformed token
        let result = auth_service.validate_token("header.payload");
        assert!(result.is_err());
    }

    /// Test authentication service expired token handling
    #[tokio::test]
    async fn test_auth_service_expired_token_handling() {
        let auth_service = AuthService::new("test_secret".to_string(), -1); // Negative expiration
        let test_user = TestUser::new();

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

        // Generate token (should work)
        let token = auth_service.generate_token(&user).unwrap();
        assert!(!token.is_empty());

        // Validate token (should fail due to expiration)
        let result = auth_service.validate_token(&token);
        assert!(result.is_err());
    }
}

/// Tests for EnhancedAuthService
#[cfg(test)]
mod enhanced_auth_service_tests {
    use super::*;
    use crate::test_utils::database::setup_test_database;

    /// Test session creation
    #[tokio::test]
    async fn test_enhanced_auth_service_create_session() {
        let (db, _) = setup_test_database().await;
        let auth_service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        let test_user = TestUser::new();
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

        let session = auth_service.create_session(&user, &db).await.unwrap();

        assert_eq!(session.user_id, user.id);
        assert_eq!(session.email, user.email);
        assert_eq!(session.role, user.status); // Role stored in status field
        assert!(session.expires_at > session.created_at);
        assert_eq!(session.last_activity, session.created_at);
    }

    /// Test session rotation logic
    #[tokio::test]
    async fn test_enhanced_auth_service_session_rotation() {
        let auth_service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        // Test session that should not rotate (recent)
        let recent_time = chrono::Utc::now() - chrono::Duration::minutes(5);
        assert!(!auth_service.should_rotate_session(recent_time));

        // Test session that should rotate (old)
        let old_time = chrono::Utc::now() - chrono::Duration::minutes(20);
        assert!(auth_service.should_rotate_session(old_time));
    }

    /// Test password reset token generation
    #[tokio::test]
    async fn test_enhanced_auth_service_password_reset_token() {
        let (db, _) = setup_test_database().await;
        let auth_service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        // Create test user
        let test_user = TestUser::new();
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

        // Insert user into database
        {
            use diesel::prelude::*;
            use crate::models::schema::users;
            use crate::models::NewUser;

            let mut conn = db.get_connection().unwrap();
            let new_user = NewUser {
                id: user.id,
                email: user.email.clone(),
                password_hash: user.password_hash.clone(),
                first_name: user.first_name.clone(),
                last_name: user.last_name.clone(),
                role: user.role.clone(),
                is_active: user.is_active,
                created_at: user.created_at,
                updated_at: user.updated_at,
                last_login: user.last_login,
            };

            diesel::insert_into(users::table)
                .values(&new_user)
                .execute(&mut conn)
                .unwrap();
        }

        // Generate reset token
        let token = auth_service.generate_password_reset_token(&user.email, &db).await.unwrap();
        assert!(!token.is_empty());
        assert!(token.len() >= 32);
    }

    /// Test password reset confirmation
    #[tokio::test]
    async fn test_enhanced_auth_service_password_reset_confirmation() {
        let (db, _) = setup_test_database().await;
        let auth_service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        // Create test user
        let test_user = TestUser::new();
        let user = crate::models::User {
            id: test_user.id,
            email: test_user.email.clone(),
            password_hash: "old_hash".to_string(),
            first_name: test_user.first_name.clone(),
            last_name: test_user.last_name.clone(),
            role: test_user.role.to_string(),
            is_active: true,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            last_login: None,
        };

        // Insert user into database
        {
            use diesel::prelude::*;
            use crate::models::schema::users;
            use crate::models::NewUser;

            let mut conn = db.get_connection().unwrap();
            let new_user = NewUser {
                id: user.id,
                email: user.email.clone(),
                password_hash: user.password_hash.clone(),
                first_name: user.first_name.clone(),
                last_name: user.last_name.clone(),
                role: user.role.clone(),
                is_active: user.is_active,
                created_at: user.created_at,
                updated_at: user.updated_at,
                last_login: user.last_login,
            };

            diesel::insert_into(users::table)
                .values(&new_user)
                .execute(&mut conn)
                .unwrap();
        }

        // Generate reset token
        let token = auth_service.generate_password_reset_token(&user.email, &db).await.unwrap();

        // Confirm password reset
        let new_password = "NewPassword123!";
        auth_service.confirm_password_reset(&token, new_password, &db).await.unwrap();

        // Verify password was changed
        {
            use diesel::prelude::*;
            use crate::models::schema::users;

            let mut conn = db.get_connection().unwrap();
            let updated_user = users::table
                .filter(users::id.eq(user.id))
                .first::<crate::models::User>(&mut conn)
                .unwrap();

            assert_ne!(updated_user.password_hash, "old_hash");
            // Verify new password works
            let auth_service_basic = AuthService::new("test_secret".to_string(), 3600);
            assert!(auth_service_basic.verify_password(new_password, &updated_user.password_hash).unwrap());
        }
    }

    /// Test password reset with invalid token
    #[tokio::test]
    async fn test_enhanced_auth_service_invalid_reset_token() {
        let (db, _) = setup_test_database().await;
        let auth_service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        // Try to reset with invalid token
        let result = auth_service.confirm_password_reset("invalid_token", "NewPassword123!", &db).await;
        assert!(result.is_err());
    }

    /// Test password reset with expired token
    #[tokio::test]
    async fn test_enhanced_auth_service_expired_reset_token() {
        let (db, _) = setup_test_database().await;
        let auth_service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        // Create test user
        let test_user = TestUser::new();
        let user = crate::models::User {
            id: test_user.id,
            email: test_user.email.clone(),
            password_hash: "old_hash".to_string(),
            first_name: test_user.first_name.clone(),
            last_name: test_user.last_name.clone(),
            role: test_user.role.to_string(),
            is_active: true,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            last_login: None,
        };

        // Insert user into database
        {
            use diesel::prelude::*;
            use crate::models::schema::users;
            use crate::models::NewUser;

            let mut conn = db.get_connection().unwrap();
            let new_user = NewUser {
                id: user.id,
                email: user.email.clone(),
                password_hash: user.password_hash.clone(),
                first_name: user.first_name.clone(),
                last_name: user.last_name.clone(),
                role: user.role.clone(),
                is_active: user.is_active,
                created_at: user.created_at,
                updated_at: user.updated_at,
                last_login: user.last_login,
            };

            diesel::insert_into(users::table)
                .values(&new_user)
                .execute(&mut conn)
                .unwrap();
        }

        // Manually insert expired token
        {
            use diesel::prelude::*;
            use crate::models::schema::password_reset_tokens;
            use crate::models::NewPasswordResetToken;
            use sha2::{Digest, Sha256};

            let mut conn = db.get_connection().unwrap();
            let token = "expired_token";
            let mut hasher = Sha256::new();
            hasher.update(token.as_bytes());
            let token_hash = format!("{:x}", hasher.finalize());

            let expired_token = NewPasswordResetToken {
                user_id: user.id,
                token_hash,
                expires_at: chrono::Utc::now() - chrono::Duration::hours(1), // Already expired
            };

            diesel::insert_into(password_reset_tokens::table)
                .values(&expired_token)
                .execute(&mut conn)
                .unwrap();
        }

        // Try to reset with expired token
        let result = auth_service.confirm_password_reset("expired_token", "NewPassword123!", &db).await;
        assert!(result.is_err());
    }

    /// Test email verification token generation
    #[tokio::test]
    async fn test_enhanced_auth_service_email_verification_token() {
        let (db, _) = setup_test_database().await;
        let auth_service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        let user_id = uuid::Uuid::new_v4();
        let email = "test@example.com";

        // Generate verification token
        let token = auth_service.generate_email_verification_token(user_id, email, &db).await.unwrap();
        assert!(!token.is_empty());
        assert!(token.len() >= 32);
    }

    /// Test email verification
    #[tokio::test]
    async fn test_enhanced_auth_service_email_verification() {
        let (db, _) = setup_test_database().await;
        let auth_service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        let user_id = uuid::Uuid::new_v4();
        let email = "test@example.com";

        // Generate verification token
        let token = auth_service.generate_email_verification_token(user_id, email, &db).await.unwrap();

        // Verify email
        auth_service.verify_email(&token, &db).await.unwrap();
    }

    /// Test email verification with invalid token
    #[tokio::test]
    async fn test_enhanced_auth_service_invalid_email_verification() {
        let (db, _) = setup_test_database().await;
        let auth_service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        // Try to verify with invalid token
        let result = auth_service.verify_email("invalid_token", &db).await;
        assert!(result.is_err());
    }

    /// Test permission checking
    #[tokio::test]
    async fn test_enhanced_auth_service_permissions() {
        let auth_service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        // Test admin permissions
        assert!(auth_service.check_permission("admin", "users", "read"));
        assert!(auth_service.check_permission("admin", "users", "write"));
        assert!(auth_service.check_permission("admin", "projects", "delete"));

        // Test manager permissions
        assert!(auth_service.check_permission("manager", "projects", "read"));
        assert!(auth_service.check_permission("manager", "projects", "write"));
        assert!(!auth_service.check_permission("manager", "users", "delete"));

        // Test user permissions
        assert!(auth_service.check_permission("user", "projects", "read"));
        assert!(!auth_service.check_permission("user", "projects", "delete"));
        assert!(!auth_service.check_permission("user", "users", "write"));
    }

    /// Test getting user permissions
    #[tokio::test]
    async fn test_enhanced_auth_service_get_user_permissions() {
        let auth_service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        // Test admin permissions
        let admin_perms = auth_service.get_user_permissions("admin");
        assert!(admin_perms.contains(&"users:read".to_string()));
        assert!(admin_perms.contains(&"users:write".to_string()));
        assert!(admin_perms.contains(&"projects:delete".to_string()));

        // Test user permissions
        let user_perms = auth_service.get_user_permissions("user");
        assert!(user_perms.contains(&"projects:read".to_string()));
        assert!(!user_perms.contains(&"users:write".to_string()));
    }

    /// Test API key generation
    #[tokio::test]
    async fn test_enhanced_auth_service_api_key_generation() {
        let (db, _) = setup_test_database().await;
        let auth_service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        let user_id = uuid::Uuid::new_v4();
        let description = "Test API key";

        // Generate API key
        let api_key = auth_service.generate_api_key(user_id, description, &db).await.unwrap();
        assert!(!api_key.is_empty());
        assert!(api_key.len() >= 32);
    }

    /// Test password strength validation in enhanced service
    #[tokio::test]
    async fn test_enhanced_auth_service_password_validation() {
        let auth_service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        // Test valid password
        assert!(auth_service.validate_password_strength("ValidPassword123!").is_ok());

        // Test invalid passwords
        assert!(auth_service.validate_password_strength("short").is_err());
        assert!(auth_service.validate_password_strength("nouppercase123!").is_err());
        assert!(auth_service.validate_password_strength("NOLOWERCASE123!").is_err());
        assert!(auth_service.validate_password_strength("NoNumbers!").is_err());
        assert!(auth_service.validate_password_strength("NoSpecialChars123").is_err());
    }

    /// Test password hashing in enhanced service
    #[tokio::test]
    async fn test_enhanced_auth_service_password_hashing() {
        let auth_service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        let password = "TestPassword123!";
        let hash = auth_service.hash_password(password).unwrap();

        assert!(!hash.is_empty());
        assert_ne!(hash, password);

        // Verify password works
        let basic_auth = AuthService::new("test_secret".to_string(), 3600);
        assert!(basic_auth.verify_password(password, &hash).unwrap());
    }

    /// Test reset token generation in enhanced service
    #[tokio::test]
    async fn test_enhanced_auth_service_reset_token_generation() {
        let auth_service = EnhancedAuthService::new("test_secret".to_string(), 3600);

        let token1 = auth_service.generate_reset_token().unwrap();
        let token2 = auth_service.generate_reset_token().unwrap();

        assert!(!token1.is_empty());
        assert!(!token2.is_empty());
        assert_ne!(token1, token2);
        assert!(token1.len() >= 32);
    }
}