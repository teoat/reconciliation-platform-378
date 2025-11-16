//! User account service
//!
//! Handles authentication-related user operations like password changes
//! and login tracking.

use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::{schema::users, UpdateUser, User};
use crate::services::auth::AuthService;

/// User account service for authentication-related operations
pub struct UserAccountService {
    db: Arc<Database>,
    auth_service: AuthService,
}

impl UserAccountService {
    pub fn new(db: Arc<Database>, auth_service: AuthService) -> Self {
        Self { db, auth_service }
    }

    /// Update user's last login time
    pub async fn update_last_login(&self, user_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;

        let update_data = UpdateUser {
            email: None,
            username: None,
            first_name: None,
            last_name: None,
            status: None,
            email_verified: None,
            last_login_at: Some(chrono::Utc::now()),
            last_active_at: Some(chrono::Utc::now()),
            password_expires_at: None,
            password_last_changed: None,
            password_history: None,
        };

        diesel::update(users::table.filter(users::id.eq(user_id)))
            .set(&update_data)
            .execute(&mut conn)
            .map_err(AppError::Database)?;

        Ok(())
    }

    /// Change user password
    pub async fn change_password(
        &self,
        user_id: Uuid,
        current_password: &str,
        new_password: &str,
        password_manager: Option<std::sync::Arc<crate::services::password_manager::PasswordManager>>,
    ) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;

        // Get user
        let user = users::table
            .filter(users::id.eq(user_id))
            .first::<User>(&mut conn)
            .map_err(AppError::Database)?;

        // Verify current password
        if !self
            .auth_service
            .verify_password(current_password, &user.password_hash)?
        {
            return Err(AppError::Authentication(
                "Current password is incorrect".to_string(),
            ));
        }

        // Validate new password
        self.auth_service.validate_password_strength(new_password)?;

        // Check password history to prevent reuse
        if let Some(history) = &user.password_history {
            if let Ok(history_array) = serde_json::from_value::<Vec<String>>(history.clone()) {
                // Check last 5 passwords (configurable)
                for old_hash in history_array.iter().take(5) {
                    if self.auth_service.verify_password(new_password, old_hash)? {
                        return Err(AppError::Validation(
                            "You cannot reuse a recently used password. Please choose a different password.".to_string(),
                        ));
                    }
                }
            }
        }

        // Hash new password
        let new_password_hash = self.auth_service.hash_password(new_password)?;

        // Update password history (keep last 5)
        let mut password_history = if let Some(history) = &user.password_history {
            serde_json::from_value::<Vec<String>>(history.clone()).unwrap_or_default()
        } else {
            Vec::new()
        };
        
        // Add current password hash to history
        password_history.insert(0, user.password_hash.clone());
        // Keep only last 5 passwords
        password_history.truncate(5);
        
        let password_history_json = serde_json::to_value(password_history)
            .map_err(|e| AppError::Internal(format!("Failed to serialize password history: {}", e)))?;

        // Calculate new expiration (90 days from now, configurable)
        let now = chrono::Utc::now();
        let password_expires_at = now + chrono::Duration::days(90);

        // Update password with history and expiration
        diesel::update(users::table.filter(users::id.eq(user_id)))
            .set((
                users::password_hash.eq(&new_password_hash),
                users::password_last_changed.eq(now),
                users::password_expires_at.eq(password_expires_at),
                users::password_history.eq(password_history_json),
                users::updated_at.eq(now),
            ))
            .execute(&mut conn)
            .map_err(AppError::Database)?;

        // Password manager master keys are now separate from login passwords
        // Users must set a separate master password for password manager
        // See: docs/architecture/PASSWORD_SYSTEM_ORCHESTRATION.md
        if password_manager.is_some() {
            log::debug!("Password manager provided but master key update skipped (deprecated)");
        }

        Ok(())
    }
}
