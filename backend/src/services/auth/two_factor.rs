//! Two-factor authentication (2FA) service

use crate::database::{Database, transaction::with_transaction};
use crate::errors::{AppError, AppResult};
use crate::models::{User, TwoFactorAuth, NewTwoFactorAuth, UpdateTwoFactorAuth};
use crate::services::auth::password::PasswordManager;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
use crate::models::schema::two_factor_auth;
use std::sync::Arc;
use totp_rs::{Secret, TOTP};
use base64::{engine::general_purpose, Engine as _};
use qrcode_generator::QrCodeEcc;
use uuid::Uuid;
use std::collections::HashSet;

/// Two-Factor Authentication service
#[derive(Clone)]
pub struct TwoFactorAuthService {
    db: Arc<Database>,
}

impl TwoFactorAuthService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    /// Get or create 2FA record for a user
    pub async fn get_or_create_2fa_record(&self, user_id: Uuid) -> AppResult<TwoFactorAuth> {
        let mut conn = self.db.get_connection()?;
        let now = chrono::Utc::now();

        let record = two_factor_auth::table
            .filter(two_factor_auth::user_id.eq(user_id))
            .first::<TwoFactorAuth>(&mut conn);

        match record {
            Ok(r) => Ok(r),
            Err(diesel::NotFound) => {
                // Create a new record if not found, with 2FA disabled by default
                let new_record = NewTwoFactorAuth {
                    user_id,
                    method: "totp".to_string(), // Default to TOTP
                    secret: None,
                    backup_codes: None,
                    is_enabled: false,
                };
                with_transaction(self.db.get_pool(), |tx| {
                    diesel::insert_into(two_factor_auth::table)
                        .values(new_record)
                        .get_result::<TwoFactorAuth>(tx)
                        .map_err(AppError::Database)
                }).await
            },
            Err(e) => Err(AppError::Database(e)),
        }
    }

    /// Generate a new TOTP secret and QR code for a user.
    /// This does NOT enable 2FA, only prepares it.
    pub async fn generate_totp_secret_and_qr(
        &self,
        user_id: Uuid,
        user_email: &str,
    ) -> AppResult<(String, String)> {
        let mut conn = self.db.get_connection()?;

        let secret = Secret::generate_base32();
        let totp = TOTP::new(
            Secret::Encoded(secret.clone()),
            6, // 6 digits
            1, // 1 time step
            30, // 30 seconds validity
            None, // No specific algorithm (defaults to SHA1)
            Some("ReconciliationPlatform".to_string()), // Issuer
        ).map_err(|e| AppError::Internal(format!("Failed to create TOTP: {}", e)))?;

        let otpauth_url = totp.get_url_otpauth(user_email, "ReconciliationPlatform");

        // Generate QR code
        let png_bytes = qrcode_generator::to_png_to_vec(otpauth_url, QrCodeEcc::Medium, 200)
            .map_err(|e| AppError::Internal(format!("Failed to generate QR code: {}", e)))?;
        let qr_code_base64 = general_purpose::STANDARD.encode(&png_bytes);

        // Store the secret (but don't enable 2FA yet)
        with_transaction(self.db.get_pool(), |tx| {
            diesel::update(two_factor_auth::table)
                .filter(two_factor_auth::user_id.eq(user_id))
                .set(two_factor_auth::secret.eq(Some(secret.clone())))
                .execute(tx)
                .map_err(AppError::Database)
        }).await?;

        Ok((secret, qr_code_base64))
    }

    /// Verify a TOTP code provided by the user.
    pub async fn verify_totp_code(&self, user_id: Uuid, code: &str) -> AppResult<bool> {
        let mut conn = self.db.get_connection()?;

        let record = two_factor_auth::table
            .filter(two_factor_auth::user_id.eq(user_id))
            .first::<TwoFactorAuth>(&mut conn)
            .map_err(|_| AppError::NotFound("2FA record not found".to_string()))?;

        let secret = record.secret.ok_or_else(|| AppError::Internal("2FA secret not set".to_string()))?;
        
        let totp = TOTP::new(
            Secret::Encoded(secret),
            6, // 6 digits
            1, // 1 time step
            30, // 30 seconds validity
            None, // No specific algorithm (defaults to SHA1)
            Some("ReconciliationPlatform".to_string()), // Issuer
        ).map_err(|e| AppError::Internal(format!("Failed to create TOTP: {}", e)))?;

        Ok(totp.verify(code.to_string(), chrono::Utc::now().timestamp()))
    }

    /// Enable 2FA for a user. Assumes secret has been generated and verified.
    pub async fn enable_2fa(&self, user_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        let now = chrono::Utc::now();

        let record = two_factor_auth::table
            .filter(two_factor_auth::user_id.eq(user_id))
            .first::<TwoFactorAuth>(&mut conn)
            .map_err(|_| AppError::NotFound("2FA record not found".to_string()))?;

        if record.secret.is_none() {
            return Err(AppError::Validation("2FA secret not set. Generate secret first.".to_string()));
        }

        with_transaction(self.db.get_pool(), |tx| {
            diesel::update(two_factor_auth::table)
                .filter(two_factor_auth::user_id.eq(user_id))
                .set((two_factor_auth::is_enabled.eq(true), two_factor_auth::updated_at.eq(now)))
                .execute(tx)
                .map_err(AppError::Database)
        }).await?;

        Ok(())
    }

    /// Disable 2FA for a user.
    pub async fn disable_2fa(&self, user_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        let now = chrono::Utc::now();

        with_transaction(self.db.get_pool(), |tx| {
            diesel::update(two_factor_auth::table)
                .filter(two_factor_auth::user_id.eq(user_id))
                .set((
                    two_factor_auth::is_enabled.eq(false),
                    two_factor_auth::secret.eq(None), // Remove secret for security
                    two_factor_auth::backup_codes.eq(None), // Clear backup codes
                    two_factor_auth::updated_at.eq(now),
                ))
                .execute(tx)
                .map_err(AppError::Database)
        }).await?;

        Ok(())
    }

    /// Generate and store new recovery codes for a user.
    pub async fn generate_recovery_codes(&self, user_id: Uuid) -> AppResult<Vec<String>> {
        let mut conn = self.db.get_connection()?;
        let now = chrono::Utc::now();

        let mut codes = Vec::new();
        for _ in 0..10 { // Generate 10 recovery codes
            codes.push(PasswordManager::generate_reset_token()?);
        }

        let codes_json = serde_json::to_value(&codes)
            .map_err(|e| AppError::Internal(format!("Failed to serialize recovery codes: {}", e)))?;

        with_transaction(self.db.get_pool(), |tx| {
            diesel::update(two_factor_auth::table)
                .filter(two_factor_auth::user_id.eq(user_id))
                .set((two_factor_auth::backup_codes.eq(Some(codes_json)), two_factor_auth::updated_at.eq(now)))
                .execute(tx)
                .map_err(AppError::Database)
        }).await?;

        Ok(codes)
    }

    /// Verify a recovery code and invalidate it.
    pub async fn verify_recovery_code(&self, user_id: Uuid, code: &str) -> AppResult<bool> {
        let mut conn = self.db.get_connection()?;
        let now = chrono::Utc::now();

        let mut record = two_factor_auth::table
            .filter(two_factor_auth::user_id.eq(user_id))
            .first::<TwoFactorAuth>(&mut conn)
            .map_err(|_| AppError::NotFound("2FA record not found".to_string()))?;

        let mut backup_codes: HashSet<String> = if let Some(codes_json) = &record.backup_codes {
            serde_json::from_value(codes_json.clone())
                .map_err(|e| AppError::Internal(format!("Failed to parse backup codes: {}", e)))?
        } else {
            HashSet::new()
        };

        if backup_codes.contains(code) {
            // Remove the used code
            backup_codes.remove(code);
            let updated_codes_json = serde_json::to_value(&backup_codes)
                .map_err(|e| AppError::Internal(format!("Failed to serialize updated backup codes: {}", e)))?;

            with_transaction(self.db.get_pool(), |tx| {
                diesel::update(two_factor_auth::table)
                    .filter(two_factor_auth::user_id.eq(user_id))
                    .set((two_factor_auth::backup_codes.eq(Some(updated_codes_json)), two_factor_auth::updated_at.eq(now)))
                    .execute(tx)
                    .map_err(AppError::Database)
            }).await?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// Check if 2FA is enabled for a user.
    pub async fn is_2fa_enabled(&self, user_id: Uuid) -> AppResult<bool> {
        let mut conn = self.db.get_connection()?;
        let record = two_factor_auth::table
            .filter(two_factor_auth::user_id.eq(user_id))
            .first::<TwoFactorAuth>(&mut conn);
        
        match record {
            Ok(r) => Ok(r.is_enabled),
            Err(diesel::NotFound) => Ok(false), // 2FA not configured
            Err(e) => Err(AppError::Database(e)),
        }
    }

}
