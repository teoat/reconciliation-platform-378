//! JWT token generation and validation

use super::types::Claims;
use crate::errors::{AppError, AppResult};
use crate::models::User;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

/// JWT token manager
#[derive(Clone)]
pub struct JwtManager {
    secret: String,
    expiration: i64,
}

impl JwtManager {
    pub fn new(secret: String, expiration: i64) -> Self {
        Self { secret, expiration }
    }

    /// Get configured JWT expiration seconds
    pub fn get_expiration(&self) -> i64 {
        self.expiration
    }

    /// Generate a JWT token for a user
    pub fn generate_token(&self, user: &User) -> AppResult<String> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as usize;

        let exp = now + (self.expiration as usize);

        let claims = Claims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            role: user.status.clone(), // Role stored in status field
            exp,
            iat: now,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.secret.as_ref()),
        )
        .map_err(AppError::Jwt)
    }

    /// Validate and decode a JWT token
    pub fn validate_token(&self, token: &str) -> AppResult<Claims> {
        let validation = Validation::default();

        decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.secret.as_ref()),
            &validation,
        )
        .map(|data| data.claims)
        .map_err(AppError::Jwt)
    }

    /// Extract user ID from token
    pub fn get_user_id_from_token(&self, token: &str) -> AppResult<Uuid> {
        let claims = self.validate_token(token)?;
        Uuid::parse_str(&claims.sub)
            .map_err(|e| AppError::Authentication(format!("Invalid user ID in token: {}", e)))
    }
}
