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

        // Hash new password
        let new_password_hash = self.auth_service.hash_password(new_password)?;

        // Update password
        diesel::update(users::table.filter(users::id.eq(user_id)))
            .set(users::password_hash.eq(new_password_hash))
            .execute(&mut conn)
            .map_err(AppError::Database)?;

        Ok(())
    }
}
