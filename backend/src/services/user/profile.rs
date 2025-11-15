//! User profile service
//!
//! Handles user profile management including profile retrieval and updates.

use diesel::prelude::*;
use diesel::{QueryDsl, ExpressionMethods, RunQueryDsl};
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use async_trait::async_trait;

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::{
    User, UpdateUser,
    schema::users,
};
use crate::services::auth::ValidationUtils;

/// Profile service for managing user profiles
pub struct ProfileService {
    db: Arc<Database>,
}

/// User profile information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: Uuid,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
}

impl ProfileService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    /// Internal: Get user profile by ID
    async fn get_profile_by_id_impl(&self, user_id: Uuid) -> AppResult<UserProfile> {
        let mut conn = self.db.get_connection()?;
        
        let user = users::table
            .filter(users::id.eq(user_id))
            .select((
                users::id,
                users::email,
                users::first_name,
                users::last_name,
            ))
            .first::<(Uuid, String, String, String)>(&mut conn)
            .map_err(AppError::Database)?;
        
        Ok(UserProfile {
            id: user.0,
            email: user.1,
            first_name: user.2,
            last_name: user.3,
        })
    }

    /// Internal: Get user profile by email
    async fn get_profile_by_email_impl(&self, email: &str) -> AppResult<UserProfile> {
        let mut conn = self.db.get_connection()?;
        
        let user = users::table
            .filter(users::email.eq(email))
            .select((
                users::id,
                users::email,
                users::first_name,
                users::last_name,
            ))
            .first::<(Uuid, String, String, String)>(&mut conn)
            .map_err(AppError::Database)?;
        
        Ok(UserProfile {
            id: user.0,
            email: user.1,
            first_name: user.2,
            last_name: user.3,
        })
    }

    /// Internal: Update user profile
    async fn update_profile_impl(
        &self,
        user_id: Uuid,
        email: Option<String>,
        first_name: Option<String>,
        last_name: Option<String>,
    ) -> AppResult<UserProfile> {
        let mut conn = self.db.get_connection()?;
        
        // Check if user exists
        let existing_user = users::table
            .filter(users::id.eq(user_id))
            .first::<User>(&mut conn)
            .map_err(AppError::Database)?;
        
        // Validate email if provided
        if let Some(ref email) = email {
            ValidationUtils::validate_email(email)?;
            
            // Check if email is already taken by another user
            let count = users::table
                .filter(users::email.eq(email))
                .filter(users::id.ne(user_id))
                .count()
                .get_result::<i64>(&mut conn)
                .map_err(AppError::Database)?;
            
            if count > 0 {
                return Err(AppError::Conflict("Email already taken by another user".to_string()));
            }
        }
        
        // Prepare update
        let update_data = UpdateUser {
            email: email.map(|e| ValidationUtils::sanitize_string(&e)),
            first_name: first_name.map(|f| ValidationUtils::sanitize_string(&f)),
            last_name: last_name.map(|l| ValidationUtils::sanitize_string(&l)),
            role: None,
            is_active: None,
            last_login: None,
        };
        
        // Update user
        diesel::update(users::table.filter(users::id.eq(user_id)))
            .set(&update_data)
            .execute(&mut conn)
            .map_err(AppError::Database)?;
        
        // Return updated profile
        self.get_profile_by_id_impl(user_id).await
    }
}

// Implement the trait for ProfileService
#[async_trait::async_trait]
impl super::traits::ProfileServiceTrait for ProfileService {
    async fn get_profile_by_id(&self, user_id: Uuid) -> AppResult<UserProfile> {
        self.get_profile_by_id_impl(user_id).await
    }

    async fn get_profile_by_email(&self, email: &str) -> AppResult<UserProfile> {
        self.get_profile_by_email_impl(email).await
    }

    async fn update_profile(
        &self,
        user_id: Uuid,
        email: Option<String>,
        first_name: Option<String>,
        last_name: Option<String>,
    ) -> AppResult<UserProfile> {
        self.update_profile_impl(user_id, email, first_name, last_name).await
    }
}

