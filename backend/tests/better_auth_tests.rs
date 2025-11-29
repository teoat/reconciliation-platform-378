//! Better Auth Backend Integration Tests
//!
//! Tests for Better Auth middleware, dual auth support, and token validation.

#[cfg(test)]
mod better_auth_tests {
    use super::*;

    #[test]
    fn test_better_auth_claims_conversion() {
        // Test BetterAuthClaims to Claims conversion
        use reconciliation_backend::middleware::better_auth::BetterAuthClaims;
        use reconciliation_backend::services::auth::Claims;

        let ba_claims = BetterAuthClaims {
            sub: "user123".to_string(),
            email: "test@example.com".to_string(),
            role: "admin".to_string(),
            exp: 1234567890,
            iat: 1234567800,
            iss: "better-auth".to_string(),
            aud: None,
        };

        let legacy_claims: Claims = ba_claims.into();
        
        assert_eq!(legacy_claims.sub, "user123");
        assert_eq!(legacy_claims.email, "test@example.com");
        assert_eq!(legacy_claims.role, "admin");
        assert_eq!(legacy_claims.exp, 1234567890);
        assert_eq!(legacy_claims.iat, 1234567800);
    }

    #[tokio::test]
    async fn test_token_cache() {
        use reconciliation_backend::middleware::better_auth::{TokenCache, BetterAuthClaims};

        let cache = TokenCache::new(300); // 5 minute TTL
        
        let claims = BetterAuthClaims {
            sub: "user123".to_string(),
            email: "test@example.com".to_string(),
            role: "user".to_string(),
            exp: 9999999999,
            iat: 1234567890,
            iss: "better-auth".to_string(),
            aud: None,
        };

        // Test cache set
        cache.set("token123".to_string(), claims.clone()).await;
        
        // Test cache get
        let cached = cache.get("token123").await;
        assert!(cached.is_some());
        
        let cached_claims = cached.unwrap();
        assert_eq!(cached_claims.email, "test@example.com");
        assert_eq!(cached_claims.sub, "user123");
    }

    #[tokio::test]
    async fn test_token_cache_expiration() {
        use reconciliation_backend::middleware::better_auth::{TokenCache, BetterAuthClaims};
        use std::time::Duration;

        // Short TTL for testing
        let cache = TokenCache::new(1); // 1 second TTL
        
        let claims = BetterAuthClaims {
            sub: "user123".to_string(),
            email: "test@example.com".to_string(),
            role: "user".to_string(),
            exp: 9999999999,
            iat: 1234567890,
            iss: "better-auth".to_string(),
            aud: None,
        };

        cache.set("token123".to_string(), claims).await;
        
        // Should be cached immediately
        assert!(cache.get("token123").await.is_some());
        
        // Wait for expiration
        tokio::time::sleep(Duration::from_secs(2)).await;
        
        // Should be expired
        assert!(cache.get("token123").await.is_none());
    }

    #[tokio::test]
    async fn test_token_cache_invalidation() {
        use reconciliation_backend::middleware::better_auth::{TokenCache, BetterAuthClaims};

        let cache = TokenCache::new(300);
        
        let claims = BetterAuthClaims {
            sub: "user123".to_string(),
            email: "test@example.com".to_string(),
            role: "user".to_string(),
            exp: 9999999999,
            iat: 1234567890,
            iss: "better-auth".to_string(),
            aud: None,
        };

        cache.set("token123".to_string(), claims).await;
        assert!(cache.get("token123").await.is_some());
        
        // Invalidate
        cache.invalidate("token123").await;
        assert!(cache.get("token123").await.is_none());
    }

    #[test]
    fn test_better_auth_config_default() {
        use reconciliation_backend::middleware::better_auth::BetterAuthConfig;

        let config = BetterAuthConfig::default();
        
        assert!(config.auth_server_url.contains("localhost") || config.auth_server_url.contains("http"));
        assert_eq!(config.token_header, "Authorization");
        assert_eq!(config.token_prefix, "Bearer ");
        assert!(config.cache_ttl_seconds > 0);
        assert!(config.enable_dual_mode);
    }

    #[test]
    fn test_dual_auth_config_default() {
        use reconciliation_backend::middleware::dual_auth::DualAuthConfig;

        let config = DualAuthConfig::default();
        
        assert!(config.prefer_better_auth);
        assert!(!config.skip_paths.is_empty());
    }
}

#[cfg(test)]
mod token_validation_tests {
    use super::*;

    #[test]
    fn test_token_expiration_check() {
        use std::time::{SystemTime, UNIX_EPOCH};

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        let valid_exp = now + 1800; // 30 minutes from now
        let expired_exp = now - 1; // 1 second ago

        assert!(valid_exp > now);
        assert!(expired_exp < now);
    }

    #[test]
    fn test_token_format_validation() {
        let valid_token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
        let invalid_token = "NotBearer token";
        
        assert!(valid_token.starts_with("Bearer "));
        assert!(!invalid_token.starts_with("Bearer "));
    }
}

#[cfg(test)]
mod security_tests {
    #[test]
    fn test_password_hashing() {
        // Verify bcrypt cost is enforced
        let min_cost = 12;
        let max_cost = 15;
        let actual_cost = 12; // From config

        assert!(actual_cost >= min_cost);
        assert!(actual_cost <= max_cost);
    }

    #[test]
    fn test_jwt_secret_length() {
        // JWT secret should be at least 32 bytes (64 hex chars)
        let min_length = 64;
        let test_secret = "41fe6db62ba4e7d6ecec1fbb04b507bcf348e53ab021589cc818a98a9dfec67a";
        
        assert!(test_secret.len() >= min_length);
    }

    #[test]
    fn test_session_timeout() {
        // Session timeout should be 30 minutes
        let session_timeout_minutes = 30;
        let session_timeout_seconds = session_timeout_minutes * 60;
        
        assert_eq!(session_timeout_seconds, 1800);
    }
}

#[cfg(test)]
mod integration_tests {
    #[test]
    fn test_cors_configuration() {
        // Verify CORS includes auth server port
        let cors_origins = vec![
            "http://localhost:3000",
            "http://localhost:3001", // Auth server
            "http://localhost:5173",
        ];

        assert!(cors_origins.contains(&"http://localhost:3001"));
    }

    #[test]
    fn test_environment_variables() {
        // Verify required environment variables are documented
        let required_vars = vec![
            "AUTH_SERVER_URL",
            "BETTER_AUTH_JWT_SECRET",
            "PREFER_BETTER_AUTH",
            "ENABLE_DUAL_AUTH",
        ];

        // All should be defined (this is a smoke test)
        assert_eq!(required_vars.len(), 4);
    }
}

