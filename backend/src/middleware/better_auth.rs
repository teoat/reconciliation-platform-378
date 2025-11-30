//! Better Auth Token Validation Middleware
//!
//! Provides middleware to validate JWT tokens from Better Auth server.
//! Supports dual-token validation during migration (legacy + Better Auth).

use crate::errors::{AppError, AppResult};
use crate::services::auth::types::Claims;
use actix_web::dev::ServiceRequest;
use actix_web::HttpMessage;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

/// Better Auth token validation response
#[derive(Debug, Serialize, Deserialize)]
pub struct TokenValidationResponse {
    pub valid: bool,
    pub claims: Option<TokenClaims>,
    pub error: Option<String>,
}

/// Token claims from Better Auth
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenClaims {
    pub sub: String,   // User ID
    pub email: String, // User email
    pub role: String,  // User role
    pub exp: usize,    // Expiration timestamp
    pub iat: usize,    // Issued at timestamp
}

impl From<TokenClaims> for Claims {
    fn from(claims: TokenClaims) -> Self {
        Self {
            sub: claims.sub,
            email: claims.email,
            role: claims.role,
            exp: claims.exp,
            iat: claims.iat,
        }
    }
}

/// Better Auth validator
pub struct BetterAuthValidator {
    auth_server_url: String,
    client: reqwest::Client,
    cache: Arc<tokio::sync::RwLock<std::collections::HashMap<String, (TokenClaims, SystemTime)>>>,
}

impl BetterAuthValidator {
    /// Create a new Better Auth validator
    pub fn new(auth_server_url: String) -> Self {
        Self {
            auth_server_url,
            client: reqwest::Client::builder()
                .timeout(Duration::from_secs(5))
                .build()
                .unwrap(),
            cache: Arc::new(tokio::sync::RwLock::new(std::collections::HashMap::new())),
        }
    }

    /// Validate token with Better Auth server
    pub async fn validate_token(&self, token: &str) -> AppResult<TokenClaims> {
        // Check cache first
        {
            let cache = self.cache.read().await;
            if let Some((claims, cached_at)) = cache.get(token) {
                let now = SystemTime::now();
                let cache_age = now
                    .duration_since(*cached_at)
                    .unwrap_or(Duration::from_secs(0));

                // Cache for 5 minutes
                if cache_age < Duration::from_secs(300) {
                    // Check if token is still valid
                    let now_timestamp =
                        now.duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as usize;

                    if claims.exp > now_timestamp {
                        return Ok(claims.clone());
                    }
                }
            }
        }

        // Validate with Better Auth server
        let response = self
            .client
            .get(format!("{}/api/auth/session", self.auth_server_url))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .map_err(|e| {
                log::error!("Better Auth validation request failed: {}", e);
                AppError::Authentication("Token validation failed".to_string())
            })?;

        if !response.status().is_success() {
            return Err(AppError::Authentication("Invalid token".to_string()));
        }

        let session_data: serde_json::Value = response.json().await.map_err(|e| {
            log::error!("Failed to parse Better Auth response: {}", e);
            AppError::Authentication("Invalid token response".to_string())
        })?;

        // Extract claims from session data
        let user = session_data["user"]
            .as_object()
            .ok_or_else(|| AppError::Authentication("Invalid session data".to_string()))?;

        let claims = TokenClaims {
            sub: user["id"]
                .as_str()
                .ok_or_else(|| AppError::Authentication("Missing user ID".to_string()))?
                .to_string(),
            email: user["email"]
                .as_str()
                .ok_or_else(|| AppError::Authentication("Missing email".to_string()))?
                .to_string(),
            role: user
                .get("role")
                .and_then(|r| r.as_str())
                .unwrap_or("user")
                .to_string(),
            exp: session_data["expires"].as_u64().unwrap_or(0) as usize,
            iat: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() as usize,
        };

        // Cache the validated token
        {
            let mut cache = self.cache.write().await;
            cache.insert(token.to_string(), (claims.clone(), SystemTime::now()));
        }

        Ok(claims)
    }

    /// Clear expired entries from cache
    pub async fn cleanup_cache(&self) {
        let mut cache = self.cache.write().await;
        let now = SystemTime::now();

        cache.retain(|_, (claims, cached_at)| {
            let cache_age = now
                .duration_since(*cached_at)
                .unwrap_or(Duration::from_secs(0));
            let now_timestamp =
                now.duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as usize;

            // Keep if cache is recent and token not expired
            cache_age < Duration::from_secs(300) && claims.exp > now_timestamp
        });
    }
}

/// Verify identity using Better Auth token
pub async fn verify_identity_better_auth(
    req: &ServiceRequest,
    validator: &BetterAuthValidator,
) -> AppResult<()> {
    // Check for authentication token
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing authentication token".to_string()))?;

    if !auth_header.starts_with("Bearer ") {
        return Err(AppError::Unauthorized("Invalid token format".to_string()));
    }

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Unauthorized("Invalid token format".to_string()))?;

    // Validate token with Better Auth
    let claims = validator.validate_token(token).await?;

    // Check token expiration (already validated, but double-check)
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as usize;

    if claims.exp < now {
        return Err(AppError::Unauthorized("Token has expired".to_string()));
    }

    // Convert to our internal Claims format for compatibility
    let internal_claims = Claims {
        sub: claims.sub.clone(),
        email: claims.email.clone(),
        role: claims.role.clone(),
        exp: claims.exp,
        iat: claims.iat,
        iss: None,
        aud: None,
    };

    // Store claims in request extensions for use in handlers
    req.extensions_mut().insert(internal_claims);

    // Also store user ID as UUID if possible
    if let Ok(user_id) = uuid::Uuid::parse_str(&claims.sub) {
        req.extensions_mut().insert(user_id);
    }

    Ok(())
}

/// Dual token validation (supports both legacy JWT and Better Auth tokens)
///
/// This allows gradual migration by supporting both authentication systems.
/// Tries Better Auth first, falls back to legacy JWT if needed.
pub async fn verify_identity_dual(
    req: &ServiceRequest,
    legacy_validator: Option<&crate::services::auth::AuthService>,
    better_auth_validator: Option<&BetterAuthValidator>,
) -> AppResult<()> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing authentication token".to_string()))?;

    if !auth_header.starts_with("Bearer ") {
        return Err(AppError::Unauthorized("Invalid token format".to_string()));
    }

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Unauthorized("Invalid token format".to_string()))?;

    // Try Better Auth first if available
    if let Some(validator) = better_auth_validator {
        if let Ok(claims) = validator.validate_token(token).await {
            // Convert to internal Claims format
            let internal_claims = Claims {
                sub: claims.sub.clone(),
                email: claims.email.clone(),
                role: claims.role.clone(),
                exp: claims.exp,
                iat: claims.iat,
                iss: None,
                aud: None,
            };

            req.extensions_mut().insert(internal_claims);

            if let Ok(user_id) = uuid::Uuid::parse_str(&claims.sub) {
                req.extensions_mut().insert(user_id);
            }

            log::debug!("Token validated with Better Auth");
            return Ok(());
        }
    }

    // Fall back to legacy JWT validation
    if let Some(auth_service) = legacy_validator {
        let claims = auth_service.validate_token(token)?;

        // Check expiration
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as usize;

        if claims.exp < now {
            return Err(AppError::Unauthorized("Token has expired".to_string()));
        }

        req.extensions_mut().insert(claims.clone());

        if let Ok(user_id) = uuid::Uuid::parse_str(&claims.sub) {
            req.extensions_mut().insert(user_id);
        }

        log::debug!("Token validated with legacy JWT");
        return Ok(());
    }

    Err(AppError::Unauthorized(
        "Token validation failed".to_string(),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_better_auth_validator_creation() {
        let validator = BetterAuthValidator::new("http://localhost:4000".to_string());
        assert_eq!(validator.auth_server_url, "http://localhost:4000");
    }

    #[tokio::test]
    async fn test_cache_cleanup() {
        let validator = BetterAuthValidator::new("http://localhost:4000".to_string());
        validator.cleanup_cache().await;
        // Should not panic
    }
}
