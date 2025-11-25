//! User service module for the Reconciliation Backend
//!
//! This module provides user management functionality split into sub-services:
//! - Profile: User profile management
//! - Permissions: Role and permission management
//! - Preferences: User preferences and settings

pub mod account;
pub mod analytics;
pub mod permissions;
pub mod preferences;
pub mod profile;
pub mod query;
pub mod traits;

// Re-export sub-service types for convenience
pub use account::UserAccountService;
pub use analytics::UserAnalyticsService;
pub use permissions::{Permission, PermissionService, Role};
pub use preferences::{PreferencesService, UserPreferences};
pub use profile::{ProfileService, UserProfile};
pub use query::UserQueryService;

// Re-export traits for external use
pub use traits::*;

// =========================================================================
// Main User Service Implementation
// =========================================================================

// Main user service that composes sub-services

use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
use uuid::Uuid;

use async_trait::async_trait;
use std::sync::Arc;

use crate::database::{transaction::with_transaction, Database};
use crate::errors::{AppError, AppResult};
use crate::models::{
    schema::{projects, users},
    NewUser, UpdateUser, User,
};
use crate::services::auth::{AuthService, ValidationUtils};

// Sub-services are already re-exported above, so they're available here

/// User service
pub struct UserService {
    db: Arc<Database>,
    auth_service: AuthService,
    profile_service: Arc<dyn ProfileServiceTrait>,
    permission_service: Arc<dyn PermissionServiceTrait>,
    preferences_service: Arc<dyn PreferencesServiceTrait>,
    query_service: Arc<UserQueryService>,
    account_service: Arc<UserAccountService>,
    analytics_service: Arc<UserAnalyticsService>,
}

// Types are re-exported from traits module above (line 25: pub use traits::*)

impl UserService {
    pub fn new(db: Arc<Database>, auth_service: AuthService) -> Self {
        Self {
            profile_service: Arc::new(ProfileService::new(Arc::clone(&db))),
            permission_service: Arc::new(PermissionService::new(Arc::clone(&db))),
            preferences_service: Arc::new(PreferencesService::new(Arc::clone(&db))),
            query_service: Arc::new(UserQueryService::new(Arc::clone(&db))),
            account_service: Arc::new(UserAccountService::new(
                Arc::clone(&db),
                auth_service.clone(),
            )),
            analytics_service: Arc::new(UserAnalyticsService::new(Arc::clone(&db))),
            db,
            auth_service,
        }
    }

    /// Create a new user
    pub async fn create_user(&self, request: CreateUserRequest) -> AppResult<UserInfo> {
        // Validate input
        ValidationUtils::validate_email(&request.email)?;
        self.auth_service
            .validate_password_strength(&request.password)?;

        // Hash password
        let password_hash = self.auth_service.hash_password(&request.password)?;
        
        // Set password expiration (90 days from now, configurable)
        let now = chrono::Utc::now();
        let password_expires_at = now + chrono::Duration::days(90);
        let password_last_changed = now;

        // Determine role
        let role = request.role.unwrap_or_else(|| "user".to_string());
        // Validate role format - standardize to match OAuth user validation
        if role != "user" && role != "admin" && role != "manager" && role != "viewer" {
            return Err(AppError::Validation(
                "Invalid role. Must be one of: user, admin, manager, viewer".to_string(),
            ));
        }

        // Create user - move duplicate check inside transaction to prevent race condition
        let sanitized_email = ValidationUtils::sanitize_string(&request.email);
        let new_user = NewUser {
            email: sanitized_email.clone(),
            password_hash,
            username: None,
            first_name: Some(ValidationUtils::sanitize_string(&request.first_name)),
            last_name: Some(ValidationUtils::sanitize_string(&request.last_name)),
            status: role.clone(),
            email_verified: false, // Email verification required for security
            password_expires_at: Some(password_expires_at),
            password_last_changed: Some(password_last_changed),
            password_history: Some(serde_json::json!([])), // Empty history for new users
            auth_provider: Some("password".to_string()),
        };

        let created_user_id = with_transaction(self.db.get_pool(), |tx| {
            // Check if user already exists inside transaction (atomic check)
            let count = users::table
                .filter(users::email.eq(&sanitized_email))
                .count()
                .get_result::<i64>(tx)
                .map_err(AppError::Database)?;

            if count > 0 {
                return Err(AppError::Conflict(
                    "User with this email already exists".to_string(),
                ));
            }

            // Insert user
            let result = diesel::insert_into(users::table)
                .values(&new_user)
                .returning(users::id)
                .get_result::<Uuid>(tx)
                .map_err(|e| {
                    // Handle database constraint violations (e.g., unique constraint on email)
                    if e.to_string().contains("duplicate key") || e.to_string().contains("unique") {
                        AppError::Conflict("User with this email already exists".to_string())
                    } else {
                        AppError::Database(e)
                    }
                })?;

            Ok(result)
        })
        .await?;

        // Get created user with project count
        self.get_user_by_id(created_user_id).await
    }

    /// Create a new OAuth user (no password validation)
    pub async fn create_oauth_user(&self, request: CreateOAuthUserRequest) -> AppResult<UserInfo> {
        // Validate input
        ValidationUtils::validate_email(&request.email)?;

        // For OAuth users, use a placeholder password hash (they won't use password auth)
        // Generate a random hash that won't match any password
        let password_hash = format!("oauth_user_{}", Uuid::new_v4());

        // Determine role - standardize to match regular user validation
        let role = request.role.unwrap_or_else(|| "user".to_string());
        // Validate role format - match regular user validation
        if role != "user" && role != "admin" && role != "manager" && role != "viewer" {
            return Err(AppError::Validation(
                "Invalid role. Must be one of: user, admin, manager, viewer".to_string(),
            ));
        }

        // Create user - check if exists inside transaction to prevent race condition
        let sanitized_email = ValidationUtils::sanitize_string(&request.email);
        let now = chrono::Utc::now();
        let password_expires_at = now + chrono::Duration::days(90);
        let new_user = NewUser {
            email: sanitized_email.clone(),
            password_hash,
            username: None,
            first_name: Some(ValidationUtils::sanitize_string(&request.first_name)),
            last_name: Some(ValidationUtils::sanitize_string(&request.last_name)),
            status: role.clone(),
            email_verified: true, // OAuth emails are pre-verified by provider
            password_expires_at: Some(password_expires_at),
            password_last_changed: Some(now),
            password_history: Some(serde_json::json!([])), // Empty history for new users
            auth_provider: Some("google".to_string()),
        };

        let result = with_transaction(self.db.get_pool(), |tx| {
            // Check if user already exists inside transaction (atomic check)
            let count = users::table
                .filter(users::email.eq(&sanitized_email))
                .count()
                .get_result::<i64>(tx)
                .map_err(AppError::Database)?;

            if count > 0 {
                // User exists, return existing user ID for retrieval
                let existing_user_id = users::table
                    .filter(users::email.eq(&sanitized_email))
                    .select(users::id)
                    .first::<Uuid>(tx)
                    .map_err(AppError::Database)?;
                return Ok(Some(existing_user_id));
            }

            // Insert new user
            let result = match diesel::insert_into(users::table)
                .values(&new_user)
                .returning(users::id)
                .get_result::<Uuid>(tx)
            {
                Ok(user_id) => Ok(Some(user_id)),
                Err(e) => {
                    // Handle database constraint violations (e.g., unique constraint on email)
                    let error_str = e.to_string();
                    if error_str.contains("duplicate key") || error_str.contains("unique") {
                        // If we get here, user was created between check and insert
                        // Try to get existing user ID
                        match users::table
                            .filter(users::email.eq(&sanitized_email))
                            .select(users::id)
                            .first::<Uuid>(tx)
                        {
                            Ok(user_id) => Ok(Some(user_id)),
                            Err(_) => Err(AppError::Conflict(
                                "User with this email already exists".to_string(),
                            )),
                        }
                    } else {
                        Err(AppError::Database(e))
                    }
                }
            }?;

            Ok(result)
        })
        .await?;

        // Get user (new or existing) with project count
        match result {
            Some(user_id) => self.get_user_by_id(user_id).await,
            None => Err(AppError::Internal(
                "Failed to create or retrieve user".to_string(),
            )),
        }
    }

    /// Get user by ID
    pub async fn get_user_by_id(&self, user_id: Uuid) -> AppResult<UserInfo> {
        let db = Arc::clone(&self.db);
        let user_id_clone = user_id;
        
        let (user, project_count) = tokio::task::spawn_blocking(move || {
            let mut conn = db.get_connection()?;
            
            let user = users::table
                .filter(users::id.eq(user_id_clone))
                .first::<User>(&mut conn)
                .map_err(AppError::Database)?;

            let project_count = projects::table
                .filter(projects::owner_id.eq(user_id_clone))
                .count()
                .get_result::<i64>(&mut conn)
                .map_err(AppError::Database)?;

            Ok::<_, AppError>((user, project_count))
        })
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))??;

        Ok(UserInfo {
            id: user.id,
            email: user.email,
            name: user
                .first_name
                .as_ref()
                .and_then(|f| user.last_name.as_ref().map(|l| format!("{} {}", f, l))),
            first_name: user.first_name.unwrap_or_default(),
            last_name: user.last_name.unwrap_or_default(),
            role: user.status.clone(),
            is_active: user.email_verified,
            created_at: user.created_at,
            updated_at: user.updated_at,
            last_login: user.last_login_at,
            project_count,
        })
    }

    /// Get user by email
    pub async fn get_user_by_email(&self, email: &str) -> AppResult<User> {
        let db = Arc::clone(&self.db);
        let email = email.to_string();
        
        tokio::task::spawn_blocking(move || {
            let mut conn = db.get_connection()?;
            users::table
                .filter(users::email.eq(&email))
                .first::<User>(&mut conn)
                .map_err(AppError::Database)
        })
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
    }

    /// Get user by ID (returns User struct, not UserInfo)
    pub async fn get_user_by_id_raw(&self, user_id: Uuid) -> AppResult<User> {
        let db = Arc::clone(&self.db);
        let user_id_clone = user_id;
        
        tokio::task::spawn_blocking(move || {
            let mut conn = db.get_connection()?;
            users::table
                .filter(users::id.eq(user_id_clone))
                .first::<User>(&mut conn)
                .map_err(AppError::Database)
        })
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
    }

    /// Check if user exists by email
    pub async fn user_exists_by_email(&self, email: &str) -> AppResult<bool> {
        let db = Arc::clone(&self.db);
        let email = email.to_string();
        
        let count = tokio::task::spawn_blocking(move || {
            let mut conn = db.get_connection()?;
            users::table
                .filter(users::email.eq(&email))
                .count()
                .get_result::<i64>(&mut conn)
                .map_err(AppError::Database)
        })
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))??;

        Ok(count > 0)
    }

    /// Update user (atomic operation within transaction)
    pub async fn update_user(
        &self,
        user_id: Uuid,
        request: UpdateUserRequest,
    ) -> AppResult<UserInfo> {
        // Use transaction to ensure validation and update are atomic
        with_transaction(self.db.get_pool(), |tx| {
            // Check if user exists
            let _existing_user = users::table
                .filter(users::id.eq(user_id))
                .first::<User>(tx)
                .map_err(AppError::Database)?;

            // Validate email if provided
            if let Some(ref email) = request.email {
                ValidationUtils::validate_email(email)?;

                // Check if email is already taken by another user
                let count = users::table
                    .filter(users::email.eq(email))
                    .filter(users::id.ne(user_id))
                    .count()
                    .get_result::<i64>(tx)
                    .map_err(AppError::Database)?;

                if count > 0 {
                    return Err(AppError::Conflict(
                        "Email already taken by another user".to_string(),
                    ));
                }
            }

            // Validate role if provided
            if let Some(ref role) = request.role {
                if role != "user" && role != "admin" && role != "manager" && role != "viewer" {
                    return Err(AppError::Validation(
                        "Invalid role. Must be one of: user, admin, manager, viewer".to_string(),
                    ));
                }
            }

            // Prepare update
            let update_data = UpdateUser {
                email: request.email.map(|e| ValidationUtils::sanitize_string(&e)),
                username: None,
                first_name: request
                    .first_name
                    .map(|f| ValidationUtils::sanitize_string(&f)),
                last_name: request
                    .last_name
                    .map(|l| ValidationUtils::sanitize_string(&l)),
                status: request.role,
                email_verified: request.is_active,
                last_login_at: None,
                last_active_at: None,
                password_expires_at: None,
                password_last_changed: None,
                password_history: None,
            };

            // Update user
            diesel::update(users::table.filter(users::id.eq(user_id)))
                .set(&update_data)
                .execute(tx)
                .map_err(AppError::Database)?;

            Ok(())
        })
        .await?;

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
            .map_err(AppError::Database)?;

        if count == 0 {
            return Err(AppError::NotFound("User not found".to_string()));
        }

        // Delete user (cascade will handle related records)
        diesel::delete(users::table.filter(users::id.eq(user_id)))
            .execute(&mut conn)
            .map_err(AppError::Database)?;

        Ok(())
    }

    /// List users with pagination
    pub async fn list_users(
        &self,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<UserListResponse> {
        self.query_service.list_users(page, per_page).await
    }

    /// Update user's last login time
    pub async fn update_last_login(&self, user_id: Uuid) -> AppResult<()> {
        self.account_service.update_last_login(user_id).await
    }

    /// Change user password
    pub async fn change_password(
        &self,
        user_id: Uuid,
        current_password: &str,
        new_password: &str,
        password_manager: Option<Arc<crate::services::password_manager::PasswordManager>>,
    ) -> AppResult<()> {
        self.account_service
            .change_password(user_id, current_password, new_password, password_manager)
            .await
    }

    /// Search users
    pub async fn search_users(
        &self,
        query: &str,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<UserListResponse> {
        self.query_service.search_users(query, page, per_page).await
    }

    /// Get users by role
    pub async fn get_users_by_role(
        &self,
        role: &str,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<UserListResponse> {
        self.query_service
            .get_users_by_role(role, page, per_page)
            .await
    }

    /// Get active users count
    pub async fn get_active_users_count(&self) -> AppResult<i64> {
        self.analytics_service.get_active_users_count().await
    }

    /// Get users created in date range
    pub async fn get_users_by_date_range(
        &self,
        start_date: chrono::DateTime<chrono::Utc>,
        end_date: chrono::DateTime<chrono::Utc>,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<UserListResponse> {
        self.query_service
            .get_users_by_date_range(start_date, end_date, page, per_page)
            .await
    }

    /// Bulk update user status
    pub async fn bulk_update_user_status(
        &self,
        user_ids: Vec<Uuid>,
        is_active: bool,
    ) -> AppResult<i64> {
        let mut conn = self.db.get_connection()?;

        let count = diesel::update(users::table.filter(users::id.eq_any(user_ids)))
            .set(users::email_verified.eq(is_active))
            .execute(&mut conn)
            .map_err(AppError::Database)?;

        Ok(count as i64)
    }

    /// Get user statistics
    pub async fn get_user_statistics(&self) -> AppResult<UserStatistics> {
        self.analytics_service.get_user_statistics().await
    }

    // =========================================================================
    // Sub-service delegation methods
    // =========================================================================

    /// Get profile service
    pub fn profile(&self) -> Arc<dyn ProfileServiceTrait> {
        Arc::clone(&self.profile_service)
    }

    /// Get permission service
    pub fn permissions(&self) -> Arc<dyn PermissionServiceTrait> {
        Arc::clone(&self.permission_service)
    }

    /// Get preferences service
    pub fn preferences(&self) -> Arc<dyn PreferencesServiceTrait> {
        Arc::clone(&self.preferences_service)
    }

    /// Delegate to profile service - get user profile
    pub async fn get_user_profile(&self, user_id: Uuid) -> AppResult<profile::UserProfile> {
        self.profile_service.get_profile_by_id(user_id).await
    }

    /// Delegate to profile service - update user profile
    pub async fn update_user_profile(
        &self,
        user_id: Uuid,
        email: Option<String>,
        first_name: Option<String>,
        last_name: Option<String>,
    ) -> AppResult<profile::UserProfile> {
        self.profile_service
            .update_profile(user_id, email, first_name, last_name)
            .await
    }

    /// Delegate to permission service - get user role
    pub async fn get_user_role(&self, user_id: Uuid) -> AppResult<String> {
        self.permission_service.get_user_role(user_id).await
    }

    /// Delegate to permission service - update user role
    pub async fn update_user_role(&self, user_id: Uuid, role: &str) -> AppResult<()> {
        self.permission_service
            .update_user_role(user_id, role)
            .await
    }

    /// Delegate to permission service - check permission
    pub async fn has_permission(
        &self,
        user_id: Uuid,
        resource: &str,
        action: &str,
    ) -> AppResult<bool> {
        self.permission_service
            .has_permission(user_id, resource, action)
            .await
    }

    /// Delegate to permission service - get role permissions
    pub fn get_role_permissions(&self, role: &str) -> Vec<permissions::Permission> {
        self.permission_service.get_role_permissions(role)
    }

    /// Delegate to permission service - get role definition
    pub fn get_role(&self, role_id: &str) -> AppResult<permissions::Role> {
        self.permission_service.get_role(role_id)
    }

    /// Delegate to preferences service - get user preferences
    pub async fn get_user_preferences(
        &self,
        user_id: Uuid,
    ) -> AppResult<preferences::UserPreferences> {
        self.preferences_service.get_preferences(user_id).await
    }

    /// Delegate to preferences service - update user preferences
    pub async fn update_user_preferences(
        &self,
        user_id: Uuid,
        preferences: preferences::UserPreferences,
    ) -> AppResult<preferences::UserPreferences> {
        self.preferences_service
            .update_preferences(user_id, preferences)
            .await
    }

    /// Delegate to preferences service - update specific preference
    pub async fn update_user_preference(
        &self,
        user_id: Uuid,
        key: &str,
        value: &str,
    ) -> AppResult<()> {
        self.preferences_service
            .update_preference(user_id, key, value)
            .await
    }

    /// Delegate to preferences service - get user settings
    pub async fn get_user_settings(&self, user_id: Uuid) -> AppResult<preferences::UserSettings> {
        self.preferences_service.get_settings(user_id).await
    }

    /// Delegate to preferences service - update user settings
    pub async fn update_user_settings(
        &self,
        user_id: Uuid,
        settings: preferences::UserSettings,
    ) -> AppResult<preferences::UserSettings> {
        self.preferences_service
            .update_settings(user_id, settings)
            .await
    }
}

// Implement the UserServiceTrait for UserService
// Since types are unified, we can directly delegate to implementation methods
#[async_trait]
impl traits::UserServiceTrait for UserService {
    async fn create_user(&self, request: traits::CreateUserRequest) -> AppResult<traits::UserInfo> {
        UserService::create_user(self, request).await
    }

    async fn create_oauth_user(
        &self,
        request: traits::CreateOAuthUserRequest,
    ) -> AppResult<traits::UserInfo> {
        UserService::create_oauth_user(self, request).await
    }

    async fn get_user_by_id(&self, user_id: Uuid) -> AppResult<traits::UserInfo> {
        UserService::get_user_by_id(self, user_id).await
    }

    async fn get_user_by_email(&self, email: &str) -> AppResult<crate::models::User> {
        UserService::get_user_by_email(self, email).await
    }

    async fn user_exists_by_email(&self, email: &str) -> AppResult<bool> {
        UserService::user_exists_by_email(self, email).await
    }

    async fn update_user(
        &self,
        user_id: Uuid,
        request: traits::UpdateUserRequest,
    ) -> AppResult<traits::UserInfo> {
        UserService::update_user(self, user_id, request).await
    }

    async fn delete_user(&self, user_id: Uuid) -> AppResult<()> {
        UserService::delete_user(self, user_id).await
    }

    async fn list_users(
        &self,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<traits::UserListResponse> {
        UserService::list_users(self, page, per_page).await
    }

    async fn update_last_login(&self, user_id: Uuid) -> AppResult<()> {
        UserService::update_last_login(self, user_id).await
    }

    async fn change_password(
        &self,
        user_id: Uuid,
        current_password: &str,
        new_password: &str,
    ) -> AppResult<()> {
        // Trait doesn't support password_manager, pass None
        // Password manager integration is handled at handler level
        UserService::change_password(self, user_id, current_password, new_password, None).await
    }

    async fn search_users(
        &self,
        query: &str,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<traits::UserListResponse> {
        UserService::search_users(self, query, page, per_page).await
    }

    async fn get_users_by_role(
        &self,
        role: &str,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<traits::UserListResponse> {
        UserService::get_users_by_role(self, role, page, per_page).await
    }

    async fn get_active_users_count(&self) -> AppResult<i64> {
        UserService::get_active_users_count(self).await
    }

    async fn get_users_by_date_range(
        &self,
        start_date: chrono::DateTime<chrono::Utc>,
        end_date: chrono::DateTime<chrono::Utc>,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<traits::UserListResponse> {
        UserService::get_users_by_date_range(self, start_date, end_date, page, per_page).await
    }

    async fn bulk_update_user_status(
        &self,
        user_ids: Vec<Uuid>,
        is_active: bool,
    ) -> AppResult<i64> {
        UserService::bulk_update_user_status(self, user_ids, is_active).await
    }

    async fn get_user_statistics(&self) -> AppResult<traits::UserStatistics> {
        UserService::get_user_statistics(self).await
    }

    fn profile(&self) -> Arc<dyn traits::ProfileServiceTrait> {
        Arc::clone(&self.profile_service)
    }

    fn permissions(&self) -> Arc<dyn traits::PermissionServiceTrait> {
        Arc::clone(&self.permission_service)
    }

    fn preferences(&self) -> Arc<dyn traits::PreferencesServiceTrait> {
        Arc::clone(&self.preferences_service)
    }
}
