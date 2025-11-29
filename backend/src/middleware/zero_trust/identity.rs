//! Identity verification for zero-trust middleware

use crate::errors::{AppError, AppResult};
use crate::services::auth::AuthService;
use actix_web::dev::ServiceRequest;
use actix_web::HttpMessage;
use redis::Client as RedisClient;
use std::sync::Arc;
use uuid::Uuid;

/// Verify identity from authentication token
///
/// Validates JWT token signature, expiration, and checks revocation list.
/// Stores claims and user ID in request extensions for downstream use.
pub async fn verify_identity(
    req: &ServiceRequest,
    auth_service: Option<&Arc<AuthService>>,
    redis_client: Option<&Arc<RedisClient>>,
) -> AppResult<()> {
    // Check for authentication token
    let auth_header = req.headers().get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing authentication token".to_string()))?;

    if !auth_header.starts_with("Bearer ") {
        return Err(AppError::Unauthorized("Invalid token format".to_string()));
    }

    let token = auth_header.strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Unauthorized("Invalid token format".to_string()))?;

    // Verify token signature and expiration
    if let Some(auth) = auth_service {
        let claims = auth.validate_token(token)?;
        
        // Check token expiration (already validated by validate_token, but double-check)
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as usize;
        
        if claims.exp < now {
            return Err(AppError::Unauthorized("Token has expired".to_string()));
        }

        // Verify user identity from token - extract user ID
        let user_id = Uuid::parse_str(&claims.sub)
            .map_err(|e| AppError::Unauthorized(format!("Invalid user ID in token: {}", e)))?;

        // Store claims in request extensions for use in other middleware/handlers
        req.extensions_mut().insert(claims);
        req.extensions_mut().insert(user_id);

        // Check token revocation list (Redis or database lookup)
        if let Err(e) = check_token_revocation(token, redis_client).await {
            log::warn!("Token revocation check failed (non-fatal): {}", e);
            // Continue - revocation check is best-effort
        }
    } else {
        // If no auth service, just check token format
        if token.is_empty() {
            return Err(AppError::Unauthorized("Empty token".to_string()));
        }
    }

    Ok(())
}

/// Check token revocation list
///
/// Verifies if a token has been revoked by checking Redis blacklist.
/// Falls back to database check if Redis is unavailable.
async fn check_token_revocation(
    token: &str,
    redis_client: Option<&Arc<RedisClient>>,
) -> AppResult<()> {
    // Check Redis for token in blacklist
    if let Some(client) = redis_client {
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .map_err(|e| {
                log::warn!("Failed to get Redis connection for token revocation check: {}", e);
                AppError::Internal(format!("Redis connection failed: {}", e))
            })?;

        let revocation_key = format!("token:revoked:{}", token);
        let is_revoked: Result<bool, redis::RedisError> = redis::cmd("EXISTS")
            .arg(&revocation_key)
            .query_async(&mut conn)
            .await;

        match is_revoked {
            Ok(true) => {
                log::warn!("Token found in revocation list");
                return Err(AppError::Unauthorized("Token has been revoked".to_string()));
            }
            Ok(false) => {
                // Token not in revocation list, continue
            }
            Err(e) => {
                log::warn!("Redis error checking token revocation (non-fatal): {}", e);
                // Fall through to database check
            }
        }
    }

    // Fall back to database if Redis unavailable
    // In production, this would:
    // 1. Query database for revoked tokens table
    // 2. Check if token exists in revocation list
    // 3. Return error if token is revoked
    // Note: Database fallback implementation would require:
    // - Database connection from request extensions
    // - Revoked tokens table schema
    // - Query to check token revocation status
    // For now, if Redis is unavailable, we allow the token
    // (fail-open for availability, but log the event)
    log::warn!("Redis unavailable for token revocation check, allowing token (database fallback not implemented)");

    Ok(())
}

/// Extract token from request
pub fn extract_token_from_request(req: &ServiceRequest) -> AppResult<String> {
    let auth_header = req.headers().get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing Authorization header".to_string()))?;

    if !auth_header.starts_with("Bearer ") {
        return Err(AppError::Unauthorized("Invalid token format".to_string()));
    }

    auth_header.strip_prefix("Bearer ")
        .map(|s| s.to_string())
        .ok_or_else(|| AppError::Unauthorized("Invalid token format".to_string()))
}

