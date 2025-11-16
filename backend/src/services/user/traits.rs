//! Service traits for better testability and dependency injection
//!
//! This module defines traits for all user-related services to enable:
//! - Dependency injection
//! - Mock implementations for testing
//! - Interface-based programming

use async_trait::async_trait;
use uuid::Uuid;
use std::sync::Arc;

use crate::errors::AppResult;

// Re-export types from sub-services for convenience
pub use super::profile::UserProfile;
pub use super::permissions::{Permission, Role};
pub use super::preferences::{UserPreferences, UserSettings};

/// Trait for user profile operations
#[async_trait]
pub trait ProfileServiceTrait: Send + Sync {
    /// Get user profile by ID
    async fn get_profile_by_id(&self, user_id: Uuid) -> AppResult<UserProfile>;

    /// Get user profile by email
    async fn get_profile_by_email(&self, email: &str) -> AppResult<UserProfile>;

    /// Update user profile
    async fn update_profile(
        &self,
        user_id: Uuid,
        email: Option<String>,
        first_name: Option<String>,
        last_name: Option<String>,
    ) -> AppResult<UserProfile>;
}

/// Trait for user permissions and roles
#[async_trait]
pub trait PermissionServiceTrait: Send + Sync {
    /// Get user's role
    async fn get_user_role(&self, user_id: Uuid) -> AppResult<String>;

    /// Update user's role
    async fn update_user_role(&self, user_id: Uuid, role: &str) -> AppResult<()>;

    /// Check if role is valid
    fn is_valid_role(&self, role: &str) -> bool;

    /// Get permissions for a role
    fn get_role_permissions(&self, role: &str) -> Vec<Permission>;

    /// Check if user has permission
    async fn has_permission(
        &self,
        user_id: Uuid,
        resource: &str,
        action: &str,
    ) -> AppResult<bool>;

    /// Get role definition
    fn get_role(&self, role_id: &str) -> AppResult<Role>;
}

/// Trait for user preferences management
#[async_trait]
pub trait PreferencesServiceTrait: Send + Sync {
    /// Get user preferences
    async fn get_preferences(&self, user_id: Uuid) -> AppResult<UserPreferences>;

    /// Update user preferences
    async fn update_preferences(
        &self,
        user_id: Uuid,
        preferences: UserPreferences,
    ) -> AppResult<UserPreferences>;

    /// Update a specific preference
    async fn update_preference(
        &self,
        user_id: Uuid,
        key: &str,
        value: &str,
    ) -> AppResult<()>;

    /// Get user settings (comprehensive)
    async fn get_settings(&self, user_id: Uuid) -> AppResult<UserSettings>;

    /// Update user settings (comprehensive)
    async fn update_settings(
        &self,
        user_id: Uuid,
        settings: UserSettings,
    ) -> AppResult<UserSettings>;
}

// UserInfo, UserListResponse, and UserStatistics - defined here for use across services

/// User information for responses
#[derive(Debug, Clone, serde::Serialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub first_name: String,
    pub last_name: String,
    pub role: String,
    pub is_active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub last_login: Option<chrono::DateTime<chrono::Utc>>,
    pub project_count: i64,
}

/// User list response
#[derive(Debug, Clone, serde::Serialize)]
pub struct UserListResponse {
    pub users: Vec<UserInfo>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
}

/// User statistics response
#[derive(Debug, Clone, serde::Serialize)]
pub struct UserStatistics {
    pub total_users: i64,
    pub active_users: i64,
    pub inactive_users: i64,
    pub recent_users: i64,
    pub users_by_role: std::collections::HashMap<String, i64>,
}

/// User creation request
#[derive(Debug, serde::Deserialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub password: String,
    pub first_name: String,
    pub last_name: String,
    pub role: Option<String>,
}

/// OAuth user creation request (no password)
#[derive(Debug, serde::Deserialize)]
pub struct CreateOAuthUserRequest {
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub role: Option<String>,
}

/// User update request
#[derive(Debug, serde::Deserialize)]
pub struct UpdateUserRequest {
    pub email: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub role: Option<String>,
    pub is_active: Option<bool>,
}

// Types are now re-exported from sub-services above

/// Main user service trait
#[async_trait]
pub trait UserServiceTrait: Send + Sync {
    /// Create a new user
    async fn create_user(&self, request: CreateUserRequest) -> AppResult<UserInfo>;

    /// Create a new OAuth user (no password validation)
    async fn create_oauth_user(&self, request: CreateOAuthUserRequest) -> AppResult<UserInfo>;

    /// Get user by ID
    async fn get_user_by_id(&self, user_id: Uuid) -> AppResult<UserInfo>;

    /// Get user by email
    async fn get_user_by_email(&self, email: &str) -> AppResult<crate::models::User>;

    /// Check if user exists by email
    async fn user_exists_by_email(&self, email: &str) -> AppResult<bool>;

    /// Update user
    async fn update_user(&self, user_id: Uuid, request: UpdateUserRequest) -> AppResult<UserInfo>;

    /// Delete user
    async fn delete_user(&self, user_id: Uuid) -> AppResult<()>;

    /// List users with pagination
    async fn list_users(&self, page: Option<i64>, per_page: Option<i64>) -> AppResult<UserListResponse>;

    /// Update user's last login time
    async fn update_last_login(&self, user_id: Uuid) -> AppResult<()>;

    /// Change user password
    async fn change_password(&self, user_id: Uuid, current_password: &str, new_password: &str) -> AppResult<()>;

    /// Search users
    async fn search_users(&self, query: &str, page: Option<i64>, per_page: Option<i64>) -> AppResult<UserListResponse>;

    /// Get users by role
    async fn get_users_by_role(&self, role: &str, page: Option<i64>, per_page: Option<i64>) -> AppResult<UserListResponse>;

    /// Get active users count
    async fn get_active_users_count(&self) -> AppResult<i64>;

    /// Get users created in date range
    async fn get_users_by_date_range(
        &self,
        start_date: chrono::DateTime<chrono::Utc>,
        end_date: chrono::DateTime<chrono::Utc>,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<UserListResponse>;

    /// Bulk update user status
    async fn bulk_update_user_status(&self, user_ids: Vec<Uuid>, is_active: bool) -> AppResult<i64>;

    /// Get user statistics
    async fn get_user_statistics(&self) -> AppResult<UserStatistics>;

    // =========================================================================
    // Sub-service delegation methods
    // =========================================================================

    /// Get profile service
    fn profile(&self) -> Arc<dyn ProfileServiceTrait>;

    /// Get permission service
    fn permissions(&self) -> Arc<dyn PermissionServiceTrait>;

    /// Get preferences service
    fn preferences(&self) -> Arc<dyn PreferencesServiceTrait>;

    /// Delegate to profile service - get user profile
    async fn get_user_profile(&self, user_id: Uuid) -> AppResult<UserProfile> {
        self.profile().get_profile_by_id(user_id).await
    }

    /// Delegate to profile service - update user profile
    async fn update_user_profile(
        &self,
        user_id: Uuid,
        email: Option<String>,
        first_name: Option<String>,
        last_name: Option<String>,
    ) -> AppResult<UserProfile> {
        self.profile().update_profile(user_id, email, first_name, last_name).await
    }

    /// Delegate to permission service - get user role
    async fn get_user_role(&self, user_id: Uuid) -> AppResult<String> {
        self.permissions().get_user_role(user_id).await
    }

    /// Delegate to permission service - update user role
    async fn update_user_role(&self, user_id: Uuid, role: &str) -> AppResult<()> {
        self.permissions().update_user_role(user_id, role).await
    }

    /// Delegate to permission service - check permission
    async fn has_permission(
        &self,
        user_id: Uuid,
        resource: &str,
        action: &str,
    ) -> AppResult<bool> {
        self.permissions().has_permission(user_id, resource, action).await
    }

    /// Delegate to permission service - get role permissions
    fn get_role_permissions(&self, role: &str) -> Vec<Permission> {
        self.permissions().get_role_permissions(role)
    }

    /// Delegate to permission service - get role definition
    fn get_role(&self, role_id: &str) -> AppResult<Role> {
        self.permissions().get_role(role_id)
    }

    /// Delegate to preferences service - get user preferences
    async fn get_user_preferences(&self, user_id: Uuid) -> AppResult<UserPreferences> {
        self.preferences().get_preferences(user_id).await
    }

    /// Delegate to preferences service - update user preferences
    async fn update_user_preferences(
        &self,
        user_id: Uuid,
        preferences: UserPreferences,
    ) -> AppResult<UserPreferences> {
        self.preferences().update_preferences(user_id, preferences).await
    }

    /// Delegate to preferences service - get user settings
    async fn get_user_settings(&self, user_id: Uuid) -> AppResult<UserSettings> {
        self.preferences().get_settings(user_id).await
    }

    /// Delegate to preferences service - update user settings
    async fn update_user_settings(
        &self,
        user_id: Uuid,
        settings: UserSettings,
    ) -> AppResult<UserSettings> {
        self.preferences().update_settings(user_id, settings).await
    }

    /// Delegate to preferences service - update specific preference
    async fn update_user_preference(
        &self,
        user_id: Uuid,
        key: &str,
        value: &str,
    ) -> AppResult<()> {
        self.preferences().update_preference(user_id, key, value).await
    }
}