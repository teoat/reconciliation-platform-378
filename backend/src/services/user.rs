//! User service for the Reconciliation Backend
//! 
//! This module provides user management functionality including CRUD operations,
//! user validation, and user-related business logic.

use diesel::prelude::*;
use diesel::{QueryDsl, ExpressionMethods, RunQueryDsl};
use uuid::Uuid;
use chrono::Utc;
use serde::{Deserialize, Serialize};

use crate::database::{Database, utils::with_transaction};
use crate::errors::{AppError, AppResult};
use crate::models::{
    User, NewUser, UpdateUser,
    schema::{users, projects},
};
use crate::services::auth::{AuthService, ValidationUtils, UserRole};

/// User service
pub struct UserService {
    db: Database,
    auth_service: AuthService,
}

/// User creation request
#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub password: String,
    pub first_name: String,
    pub last_name: String,
    pub role: Option<String>,
}

/// User update request
#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub email: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub role: Option<String>,
    pub is_active: Option<bool>,
}

/// User list response
#[derive(Debug, Serialize)]
pub struct UserListResponse {
    pub users: Vec<UserInfo>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
}

/// User information for responses
#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub role: String,
    pub is_active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub last_login: Option<chrono::DateTime<chrono::Utc>>,
    pub project_count: i64,
}

/// User statistics response
#[derive(Debug, Serialize)]
pub struct UserStatistics {
    pub total_users: i64,
    pub active_users: i64,
    pub inactive_users: i64,
    pub recent_users: i64,
    pub users_by_role: std::collections::HashMap<String, i64>,
}

impl UserService {
    pub fn new(db: Database, auth_service: AuthService) -> Self {
        Self { db, auth_service }
    }
    
    /// Create a new user
    pub async fn create_user(&self, request: CreateUserRequest) -> AppResult<UserInfo> {
        // Validate input
        ValidationUtils::validate_email(&request.email)?;
        self.auth_service.validate_password_strength(&request.password)?;
        
        // Check if user already exists
        if self.user_exists_by_email(&request.email).await? {
            return Err(AppError::Conflict("User with this email already exists".to_string()));
        }
        
        // Hash password
        let password_hash = self.auth_service.hash_password(&request.password)?;
        
        // Determine role
        let role = request.role.unwrap_or_else(|| "user".to_string());
        let role_enum: UserRole = role.parse()
            .map_err(|e| AppError::Validation(format!("Invalid role: {}", e)))?;
        
        // Create user
        let now = Utc::now();
        
        let new_user = NewUser {
            email: ValidationUtils::sanitize_string(&request.email),
            password_hash,
            first_name: ValidationUtils::sanitize_string(&request.first_name),
            last_name: ValidationUtils::sanitize_string(&request.last_name),
            role: role_enum.to_string(),
        };
        
        let created_user_id = with_transaction(self.db.get_pool(), |tx| {
            let result = diesel::insert_into(users::table)
                .values(&new_user)
                .returning(users::id)
                .get_result::<Uuid>(tx)
                .map_err(|e| AppError::Database(e))?;
            
            Ok(result)
        }).await?;
        
        // Get created user with project count
        self.get_user_by_id(created_user_id).await
    }
    
    /// Get user by ID
    pub async fn get_user_by_id(&self, user_id: Uuid) -> AppResult<UserInfo> {
        let mut conn = self.db.get_connection()?;
        
        let user = users::table
            .filter(users::id.eq(user_id))
            .first::<User>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get project count
        let project_count = projects::table
            .filter(projects::owner_id.eq(user_id))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        Ok(UserInfo {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at,
            last_login: user.last_login,
            project_count,
        })
    }
    
    /// Get user by email
    pub async fn get_user_by_email(&self, email: &str) -> AppResult<User> {
        let mut conn = self.db.get_connection()?;
        
        users::table
            .filter(users::email.eq(email))
            .first::<User>(&mut conn)
            .map_err(|e| AppError::Database(e))
    }
    
    /// Check if user exists by email
    pub async fn user_exists_by_email(&self, email: &str) -> AppResult<bool> {
        let mut conn = self.db.get_connection()?;
        
        let count = users::table
            .filter(users::email.eq(email))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        Ok(count > 0)
    }
    
    /// Update user
    pub async fn update_user(&self, user_id: Uuid, request: UpdateUserRequest) -> AppResult<UserInfo> {
        let mut conn = self.db.get_connection()?;
        
        // Check if user exists
        let existing_user = users::table
            .filter(users::id.eq(user_id))
            .first::<User>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Validate email if provided
        if let Some(ref email) = request.email {
            ValidationUtils::validate_email(email)?;
            
            // Check if email is already taken by another user
            let count = users::table
                .filter(users::email.eq(email))
                .filter(users::id.ne(user_id))
                .count()
                .get_result::<i64>(&mut conn)
                .map_err(|e| AppError::Database(e))?;
            
            if count > 0 {
                return Err(AppError::Conflict("Email already taken by another user".to_string()));
            }
        }
        
        // Validate role if provided
        if let Some(ref role) = request.role {
            let _: UserRole = role.parse()
                .map_err(|e| AppError::Validation(format!("Invalid role: {}", e)))?;
        }
        
        // Prepare update
        let update_data = UpdateUser {
            email: request.email.map(|e| ValidationUtils::sanitize_string(&e)),
            first_name: request.first_name.map(|f| ValidationUtils::sanitize_string(&f)),
            last_name: request.last_name.map(|l| ValidationUtils::sanitize_string(&l)),
            role: request.role,
            is_active: request.is_active,
            last_login: None, // Don't update last_login here
        };
        
        // Update user
        diesel::update(users::table.filter(users::id.eq(user_id)))
            .set(&update_data)
            .execute(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Return updated user
        self.get_user_by_id(user_id).await
    }
    
    /// Delete user
    pub async fn delete_user(&self, user_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        
        // Check if user exists
        let count = users::table
            .filter(users::id.eq(user_id))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        if count == 0 {
            return Err(AppError::NotFound("User not found".to_string()));
        }
        
        // Delete user (cascade will handle related records)
        diesel::delete(users::table.filter(users::id.eq(user_id)))
            .execute(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        Ok(())
    }
    
    /// List users with pagination
    pub async fn list_users(&self, page: Option<i64>, per_page: Option<i64>) -> AppResult<UserListResponse> {
        let (page, per_page) = ValidationUtils::validate_pagination(page, per_page)?;
        let offset = (page - 1) * per_page;
        
        let mut conn = self.db.get_connection()?;
        
        // Get total count
        let total = users::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get users
        let users = users::table
            .select((
                users::id,
                users::email,
                users::first_name,
                users::last_name,
                users::role,
                users::is_active,
                users::created_at,
                users::updated_at,
                users::last_login,
            ))
            .order(users::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<(Uuid, String, String, String, String, bool, chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>)>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get project counts for each user
        let mut user_infos = Vec::new();
        for (id, email, first_name, last_name, role, is_active, created_at, updated_at, last_login) in users {
            let project_count = projects::table
                .filter(projects::owner_id.eq(id))
                .count()
                .get_result::<i64>(&mut conn)
                .map_err(|e| AppError::Database(e))?;
            
            user_infos.push(UserInfo {
                id,
                email,
                first_name,
                last_name,
                role,
                is_active,
                created_at,
                updated_at,
                last_login,
                project_count,
            });
        }
        
        Ok(UserListResponse {
            users: user_infos,
            total,
            page,
            per_page,
        })
    }
    
    /// Update user's last login time
    pub async fn update_last_login(&self, user_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        
        let update_data = UpdateUser {
            email: None,
            first_name: None,
            last_name: None,
            role: None,
            is_active: None,
            last_login: Some(Utc::now()),
        };
        
        diesel::update(users::table.filter(users::id.eq(user_id)))
            .set(&update_data)
            .execute(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        Ok(())
    }
    
    /// Change user password
    pub async fn change_password(&self, user_id: Uuid, current_password: &str, new_password: &str) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        
        // Get user
        let user = users::table
            .filter(users::id.eq(user_id))
            .first::<User>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Verify current password
        if !self.auth_service.verify_password(current_password, &user.password_hash)? {
            return Err(AppError::Authentication("Current password is incorrect".to_string()));
        }
        
        // Validate new password
        self.auth_service.validate_password_strength(new_password)?;
        
        // Hash new password
        let new_password_hash = self.auth_service.hash_password(new_password)?;
        
        // Update password
        diesel::update(users::table.filter(users::id.eq(user_id)))
            .set(users::password_hash.eq(new_password_hash))
            .execute(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        Ok(())
    }
    
    /// Search users
    pub async fn search_users(&self, query: &str, page: Option<i64>, per_page: Option<i64>) -> AppResult<UserListResponse> {
        let (page, per_page) = ValidationUtils::validate_pagination(page, per_page)?;
        let offset = (page - 1) * per_page;
        
        let mut conn = self.db.get_connection()?;
        
        let search_pattern = format!("%{}%", query);
        
        // Get total count
        let total = users::table
            .filter(
                users::email.ilike(&search_pattern)
                    .or(users::first_name.ilike(&search_pattern))
                    .or(users::last_name.ilike(&search_pattern))
            )
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get users
        let users = users::table
            .filter(
                users::email.ilike(&search_pattern)
                    .or(users::first_name.ilike(&search_pattern))
                    .or(users::last_name.ilike(&search_pattern))
            )
            .select((
                users::id,
                users::email,
                users::first_name,
                users::last_name,
                users::role,
                users::is_active,
                users::created_at,
                users::updated_at,
                users::last_login,
            ))
            .order(users::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<(Uuid, String, String, String, String, bool, chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>)>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get project counts for each user
        let mut user_infos = Vec::new();
        for (id, email, first_name, last_name, role, is_active, created_at, updated_at, last_login) in users {
            let project_count = projects::table
                .filter(projects::owner_id.eq(id))
                .count()
                .get_result::<i64>(&mut conn)
                .map_err(|e| AppError::Database(e))?;
            
            user_infos.push(UserInfo {
                id,
                email,
                first_name,
                last_name,
                role,
                is_active,
                created_at,
                updated_at,
                last_login,
                project_count,
            });
        }
        
        Ok(UserListResponse {
            users: user_infos,
            total,
            page,
            per_page,
        })
    }
    
    /// Get users by role
    pub async fn get_users_by_role(&self, role: &str, page: Option<i64>, per_page: Option<i64>) -> AppResult<UserListResponse> {
        let (page, per_page) = ValidationUtils::validate_pagination(page, per_page)?;
        let offset = (page - 1) * per_page;
        
        let mut conn = self.db.get_connection()?;
        
        // Validate role
        let _: UserRole = role.parse()
            .map_err(|e| AppError::Validation(format!("Invalid role: {}", e)))?;
        
        // Get total count
        let total = users::table
            .filter(users::role.eq(role))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get users
        let users = users::table
            .filter(users::role.eq(role))
            .select((
                users::id,
                users::email,
                users::first_name,
                users::last_name,
                users::role,
                users::is_active,
                users::created_at,
                users::updated_at,
                users::last_login,
            ))
            .order(users::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<(Uuid, String, String, String, String, bool, chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>)>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get project counts for each user
        let mut user_infos = Vec::new();
        for (id, email, first_name, last_name, role, is_active, created_at, updated_at, last_login) in users {
            let project_count = projects::table
                .filter(projects::owner_id.eq(id))
                .count()
                .get_result::<i64>(&mut conn)
                .map_err(|e| AppError::Database(e))?;
            
            user_infos.push(UserInfo {
                id,
                email,
                first_name,
                last_name,
                role,
                is_active,
                created_at,
                updated_at,
                last_login,
                project_count,
            });
        }
        
        Ok(UserListResponse {
            users: user_infos,
            total,
            page,
            per_page,
        })
    }
    
    /// Get active users count
    pub async fn get_active_users_count(&self) -> AppResult<i64> {
        let mut conn = self.db.get_connection()?;
        
        let count = users::table
            .filter(users::is_active.eq(true))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        Ok(count)
    }
    
    /// Get users created in date range
    pub async fn get_users_by_date_range(
        &self,
        start_date: chrono::DateTime<chrono::Utc>,
        end_date: chrono::DateTime<chrono::Utc>,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<UserListResponse> {
        let (page, per_page) = ValidationUtils::validate_pagination(page, per_page)?;
        let offset = (page - 1) * per_page;
        
        let mut conn = self.db.get_connection()?;
        
        // Get total count
        let total = users::table
            .filter(users::created_at.ge(start_date))
            .filter(users::created_at.le(end_date))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get users
        let users = users::table
            .filter(users::created_at.ge(start_date))
            .filter(users::created_at.le(end_date))
            .select((
                users::id,
                users::email,
                users::first_name,
                users::last_name,
                users::role,
                users::is_active,
                users::created_at,
                users::updated_at,
                users::last_login,
            ))
            .order(users::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<(Uuid, String, String, String, String, bool, chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>)>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get project counts for each user
        let mut user_infos = Vec::new();
        for (id, email, first_name, last_name, role, is_active, created_at, updated_at, last_login) in users {
            let project_count = projects::table
                .filter(projects::owner_id.eq(id))
                .count()
                .get_result::<i64>(&mut conn)
                .map_err(|e| AppError::Database(e))?;
            
            user_infos.push(UserInfo {
                id,
                email,
                first_name,
                last_name,
                role,
                is_active,
                created_at,
                updated_at,
                last_login,
                project_count,
            });
        }
        
        Ok(UserListResponse {
            users: user_infos,
            total,
            page,
            per_page,
        })
    }
    
    /// Bulk update user status
    pub async fn bulk_update_user_status(&self, user_ids: Vec<Uuid>, is_active: bool) -> AppResult<i64> {
        let mut conn = self.db.get_connection()?;
        
        let count = diesel::update(users::table.filter(users::id.eq_any(user_ids)))
            .set(users::is_active.eq(is_active))
            .execute(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        Ok(count as i64)
    }
    
    /// Get user statistics
    pub async fn get_user_statistics(&self) -> AppResult<UserStatistics> {
        let mut conn = self.db.get_connection()?;
        
        // Get total users
        let total_users = users::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get active users
        let active_users = users::table
            .filter(users::is_active.eq(true))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get users by role
        let users_by_role = users::table
            .group_by(users::role)
            .select((users::role, diesel::dsl::count(users::id)))
            .load::<(String, i64)>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get users created in last 30 days
        let thirty_days_ago = Utc::now() - chrono::Duration::days(30);
        let recent_users = users::table
            .filter(users::created_at.ge(thirty_days_ago))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        Ok(UserStatistics {
            total_users,
            active_users,
            inactive_users: total_users - active_users,
            recent_users,
            users_by_role: users_by_role.into_iter().collect(),
        })
    }
}
