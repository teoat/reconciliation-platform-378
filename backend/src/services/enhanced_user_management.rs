// backend/src/services/enhanced_user_management.rs
use crate::errors::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use std::sync::Arc;
use tokio::sync::RwLock;

/// User role with permissions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserRole {
    pub id: String,
    pub name: String,
    pub description: String,
    pub permissions: Vec<Permission>,
    pub is_system_role: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Permission definition
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct Permission {
    pub resource: String,
    pub action: String,
    pub conditions: Vec<PermissionCondition>,
}

/// Permission condition
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct PermissionCondition {
    pub field: String,
    pub operator: ConditionOperator,
    pub value: serde_json::Value,
}

/// Condition operators
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum ConditionOperator {
    Equals,
    NotEquals,
    In,
    NotIn,
    GreaterThan,
    LessThan,
    Contains,
    StartsWith,
    EndsWith,
}

/// User profile with enhanced information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: Uuid,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub phone: Option<String>,
    pub timezone: String,
    pub locale: String,
    pub roles: Vec<String>,
    pub permissions: Vec<Permission>,
    pub preferences: UserPreferences,
    pub account_status: AccountStatus,
    pub last_login: Option<DateTime<Utc>>,
    pub login_count: u64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// User preferences
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPreferences {
    pub theme: String,
    pub language: String,
    pub notifications: NotificationPreferences,
    pub privacy: PrivacyPreferences,
    pub dashboard: DashboardPreferences,
}

/// Notification preferences
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationPreferences {
    pub email_enabled: bool,
    pub push_enabled: bool,
    pub sms_enabled: bool,
    pub webhook_enabled: bool,
    pub notification_types: HashMap<String, bool>,
}

/// Privacy preferences
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacyPreferences {
    pub profile_visibility: ProfileVisibility,
    pub activity_tracking: bool,
    pub data_sharing: bool,
    pub analytics_opt_in: bool,
}

/// Profile visibility levels
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProfileVisibility {
    Public,
    Private,
    Team,
    Organization,
}

/// Dashboard preferences
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardPreferences {
    pub layout: String,
    pub widgets: Vec<String>,
    pub refresh_interval: u32,
    pub default_view: String,
}

/// Account status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AccountStatus {
    Active,
    Inactive,
    Suspended,
    Pending,
    Locked,
}

/// User activity log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserActivityLog {
    pub id: Uuid,
    pub user_id: Uuid,
    pub activity_type: ActivityType,
    pub description: String,
    pub resource_type: Option<String>,
    pub resource_id: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub timestamp: DateTime<Utc>,
}

/// Activity types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActivityType {
    Login,
    Logout,
    ProfileUpdate,
    PasswordChange,
    RoleChange,
    PermissionGranted,
    PermissionRevoked,
    ProjectCreated,
    ProjectUpdated,
    ProjectDeleted,
    FileUploaded,
    FileDownloaded,
    ReconciliationStarted,
    ReconciliationCompleted,
    DataSourceAdded,
    DataSourceRemoved,
    SettingsChanged,
    AccountLocked,
    AccountUnlocked,
    Custom(String),
}

/// User session information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSession {
    pub id: Uuid,
    pub user_id: Uuid,
    pub session_token: String,
    pub ip_address: String,
    pub user_agent: String,
    pub created_at: DateTime<Utc>,
    pub last_activity: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub is_active: bool,
}

/// Account management actions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AccountAction {
    Activate,
    Deactivate,
    Suspend { reason: String, duration: Option<Duration> },
    Unsuspend,
    Lock { reason: String },
    Unlock,
    Delete { reason: String },
    ChangeRole { new_role: String, reason: String },
    GrantPermission { permission: Permission, reason: String },
    RevokePermission { permission: Permission, reason: String },
}

/// Enhanced user management service
pub struct EnhancedUserManagementService {
    user_profiles: Arc<RwLock<HashMap<Uuid, UserProfile>>>,
    user_roles: Arc<RwLock<HashMap<String, UserRole>>>,
    user_sessions: Arc<RwLock<HashMap<Uuid, UserSession>>>,
    activity_logs: Arc<RwLock<Vec<UserActivityLog>>>,
    permission_cache: Arc<RwLock<HashMap<Uuid, Vec<Permission>>>>,
}

impl EnhancedUserManagementService {
    pub fn new() -> Self {
        let mut service = Self {
            user_profiles: Arc::new(RwLock::new(HashMap::new())),
            user_roles: Arc::new(RwLock::new(HashMap::new())),
            user_sessions: Arc::new(RwLock::new(HashMap::new())),
            activity_logs: Arc::new(RwLock::new(Vec::new())),
            permission_cache: Arc::new(RwLock::new(HashMap::new())),
        };
        
        // Initialize with default roles
        service.initialize_default_roles();
        service
    }

    /// Initialize default system roles
    fn initialize_default_roles(&mut self) {
        let admin_role = UserRole {
            id: "admin".to_string(),
            name: "Administrator".to_string(),
            description: "Full system access".to_string(),
            permissions: vec![
                Permission {
                    resource: "*".to_string(),
                    action: "*".to_string(),
                    conditions: vec![],
                }
            ],
            is_system_role: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let user_role = UserRole {
            id: "user".to_string(),
            name: "User".to_string(),
            description: "Standard user access".to_string(),
            permissions: vec![
                Permission {
                    resource: "projects".to_string(),
                    action: "read".to_string(),
                    conditions: vec![PermissionCondition {
                        field: "owner_id".to_string(),
                        operator: ConditionOperator::Equals,
                        value: serde_json::Value::String("{{user_id}}".to_string()),
                    }],
                },
                Permission {
                    resource: "projects".to_string(),
                    action: "create".to_string(),
                    conditions: vec![],
                },
            ],
            is_system_role: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let analyst_role = UserRole {
            id: "analyst".to_string(),
            name: "Analyst".to_string(),
            description: "Data analysis access".to_string(),
            permissions: vec![
                Permission {
                    resource: "projects".to_string(),
                    action: "read".to_string(),
                    conditions: vec![],
                },
                Permission {
                    resource: "reconciliation".to_string(),
                    action: "execute".to_string(),
                    conditions: vec![],
                },
                Permission {
                    resource: "analytics".to_string(),
                    action: "read".to_string(),
                    conditions: vec![],
                },
            ],
            is_system_role: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let viewer_role = UserRole {
            id: "viewer".to_string(),
            name: "Viewer".to_string(),
            description: "Read-only access".to_string(),
            permissions: vec![
                Permission {
                    resource: "projects".to_string(),
                    action: "read".to_string(),
                    conditions: vec![],
                },
                Permission {
                    resource: "analytics".to_string(),
                    action: "read".to_string(),
                    conditions: vec![],
                },
            ],
            is_system_role: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Store roles
        self.user_roles.write().unwrap().insert("admin".to_string(), admin_role);
        self.user_roles.write().unwrap().insert("user".to_string(), user_role);
        self.user_roles.write().unwrap().insert("analyst".to_string(), analyst_role);
        self.user_roles.write().unwrap().insert("viewer".to_string(), viewer_role);
    }

    /// Create user profile
    pub async fn create_user_profile(&self, profile: UserProfile) -> AppResult<Uuid> {
        let user_id = profile.id;
        
        // Validate roles exist
        for role_id in &profile.roles {
            if !self.user_roles.read().await.contains_key(role_id) {
                return Err(AppError::Validation(format!("Role '{}' does not exist", role_id)));
            }
        }

        // Calculate effective permissions
        let effective_permissions = self.calculate_effective_permissions(&profile.roles).await?;
        
        let mut user_profile = profile;
        user_profile.permissions = effective_permissions;
        user_profile.created_at = Utc::now();
        user_profile.updated_at = Utc::now();

        // Store profile
        self.user_profiles.write().await.insert(user_id, user_profile.clone());
        
        // Cache permissions
        self.permission_cache.write().await.insert(user_id, user_profile.permissions.clone());

        // Log activity
        self.log_user_activity(user_id, ActivityType::ProfileUpdate, "User profile created", None, None, None, None, HashMap::new()).await?;

        Ok(user_id)
    }

    /// Update user profile
    pub async fn update_user_profile(&self, user_id: Uuid, updates: HashMap<String, serde_json::Value>) -> AppResult<()> {
        let mut profiles = self.user_profiles.write().await;
        if let Some(profile) = profiles.get_mut(&user_id) {
            // Update fields
            for (key, value) in updates {
                match key.as_str() {
                    "first_name" => {
                        if let Some(name) = value.as_str() {
                            profile.first_name = name.to_string();
                        }
                    }
                    "last_name" => {
                        if let Some(name) = value.as_str() {
                            profile.last_name = name.to_string();
                        }
                    }
                    "display_name" => {
                        profile.display_name = value.as_str().map(|s| s.to_string());
                    }
                    "phone" => {
                        profile.phone = value.as_str().map(|s| s.to_string());
                    }
                    "timezone" => {
                        if let Some(tz) = value.as_str() {
                            profile.timezone = tz.to_string();
                        }
                    }
                    "locale" => {
                        if let Some(locale) = value.as_str() {
                            profile.locale = locale.to_string();
                        }
                    }
                    "preferences" => {
                        if let Ok(prefs) = serde_json::from_value::<UserPreferences>(value) {
                            profile.preferences = prefs;
                        }
                    }
                    _ => {} // Ignore unknown fields
                }
            }
            
            profile.updated_at = Utc::now();
            
            // Log activity
            self.log_user_activity(user_id, ActivityType::ProfileUpdate, "User profile updated", None, None, None, None, HashMap::new()).await?;
        } else {
            return Err(AppError::Validation("User profile not found".to_string()));
        }

        Ok(())
    }

    /// Get user profile
    pub async fn get_user_profile(&self, user_id: Uuid) -> AppResult<Option<UserProfile>> {
        let profiles = self.user_profiles.read().await;
        Ok(profiles.get(&user_id).cloned())
    }

    /// List user profiles
    pub async fn list_user_profiles(&self, limit: Option<usize>, offset: Option<usize>) -> AppResult<Vec<UserProfile>> {
        let profiles = self.user_profiles.read().await;
        let profiles_vec: Vec<_> = profiles.values().cloned().collect();
        
        let offset = offset.unwrap_or(0);
        let limit = limit.unwrap_or(100);
        
        Ok(profiles_vec.into_iter().skip(offset).take(limit).collect())
    }

    /// Check user permission
    pub async fn check_permission(&self, user_id: Uuid, resource: &str, action: &str, context: Option<HashMap<String, serde_json::Value>>) -> AppResult<bool> {
        let permissions = self.permission_cache.read().await
            .get(&user_id)
            .cloned()
            .unwrap_or_default();

        for permission in permissions {
            if self.matches_permission(&permission, resource, action, &context.unwrap_or_default()).await? {
                return Ok(true);
            }
        }

        Ok(false)
    }

    /// Check if permission matches
    async fn matches_permission(&self, permission: &Permission, resource: &str, action: &str, context: &HashMap<String, serde_json::Value>) -> AppResult<bool> {
        // Check resource match
        if permission.resource != "*" && permission.resource != resource {
            return Ok(false);
        }

        // Check action match
        if permission.action != "*" && permission.action != action {
            return Ok(false);
        }

        // Check conditions
        for condition in &permission.conditions {
            if !self.evaluate_condition(condition, context).await? {
                return Ok(false);
            }
        }

        Ok(true)
    }

    /// Evaluate permission condition
    async fn evaluate_condition(&self, condition: &PermissionCondition, context: &HashMap<String, serde_json::Value>) -> AppResult<bool> {
        let field_value = context.get(&condition.field);
        
        match &condition.operator {
            ConditionOperator::Equals => {
                Ok(field_value == Some(&condition.value))
            }
            ConditionOperator::NotEquals => {
                Ok(field_value != Some(&condition.value))
            }
            ConditionOperator::In => {
                if let Some(array) = condition.value.as_array() {
                    Ok(field_value.map_or(false, |v| array.contains(v)))
                } else {
                    Ok(false)
                }
            }
            ConditionOperator::NotIn => {
                if let Some(array) = condition.value.as_array() {
                    Ok(field_value.map_or(true, |v| !array.contains(v)))
                } else {
                    Ok(true)
                }
            }
            ConditionOperator::GreaterThan => {
                if let (Some(field_val), Some(condition_val)) = (field_value, condition.value.as_f64()) {
                    Ok(field_val.as_f64().unwrap_or(0.0) > condition_val)
                } else {
                    Ok(false)
                }
            }
            ConditionOperator::LessThan => {
                if let (Some(field_val), Some(condition_val)) = (field_value, condition.value.as_f64()) {
                    Ok(field_val.as_f64().unwrap_or(0.0) < condition_val)
                } else {
                    Ok(false)
                }
            }
            ConditionOperator::Contains => {
                if let (Some(field_val), Some(condition_str)) = (field_value, condition.value.as_str()) {
                    Ok(field_val.as_str().map_or(false, |s| s.contains(condition_str)))
                } else {
                    Ok(false)
                }
            }
            ConditionOperator::StartsWith => {
                if let (Some(field_val), Some(condition_str)) = (field_value, condition.value.as_str()) {
                    Ok(field_val.as_str().map_or(false, |s| s.starts_with(condition_str)))
                } else {
                    Ok(false)
                }
            }
            ConditionOperator::EndsWith => {
                if let (Some(field_val), Some(condition_str)) = (field_value, condition.value.as_str()) {
                    Ok(field_val.as_str().map_or(false, |s| s.ends_with(condition_str)))
                } else {
                    Ok(false)
                }
            }
        }
    }

    /// Calculate effective permissions for user roles
    async fn calculate_effective_permissions(&self, role_ids: &[String]) -> AppResult<Vec<Permission>> {
        let roles = self.user_roles.read().await;
        let mut permissions = Vec::new();

        for role_id in role_ids {
            if let Some(role) = roles.get(role_id) {
                permissions.extend(role.permissions.clone());
            }
        }

        // Remove duplicates
        permissions.sort_by(|a, b| {
            format!("{}:{}", a.resource, a.action).cmp(&format!("{}:{}", b.resource, b.action))
        });
        permissions.dedup();

        Ok(permissions)
    }

    /// Create user role
    pub async fn create_user_role(&self, role: UserRole) -> AppResult<()> {
        if self.user_roles.read().await.contains_key(&role.id) {
            return Err(AppError::Validation(format!("Role '{}' already exists", role.id)));
        }

        self.user_roles.write().await.insert(role.id.clone(), role);
        Ok(())
    }

    /// Update user role
    pub async fn update_user_role(&self, role_id: &str, role: UserRole) -> AppResult<()> {
        if !self.user_roles.read().await.contains_key(role_id) {
            return Err(AppError::Validation(format!("Role '{}' does not exist", role_id)));
        }

        self.user_roles.write().await.insert(role_id.to_string(), role);
        Ok(())
    }

    /// Get user role
    pub async fn get_user_role(&self, role_id: &str) -> AppResult<Option<UserRole>> {
        let roles = self.user_roles.read().await;
        Ok(roles.get(role_id).cloned())
    }

    /// List user roles
    pub async fn list_user_roles(&self) -> AppResult<Vec<UserRole>> {
        let roles = self.user_roles.read().await;
        Ok(roles.values().cloned().collect())
    }

    /// Assign role to user
    pub async fn assign_role_to_user(&self, user_id: Uuid, role_id: String, assigned_by: Uuid) -> AppResult<()> {
        let mut profiles = self.user_profiles.write().await;
        if let Some(profile) = profiles.get_mut(&user_id) {
            if !profile.roles.contains(&role_id) {
                profile.roles.push(role_id.clone());
                profile.updated_at = Utc::now();
                
                // Recalculate permissions
                let effective_permissions = self.calculate_effective_permissions(&profile.roles).await?;
                profile.permissions = effective_permissions.clone();
                
                // Update cache
                self.permission_cache.write().await.insert(user_id, effective_permissions);
                
                // Log activity
                self.log_user_activity(user_id, ActivityType::RoleChange, &format!("Role '{}' assigned", role_id), None, None, None, None, HashMap::new()).await?;
            }
        } else {
            return Err(AppError::Validation("User profile not found".to_string()));
        }

        Ok(())
    }

    /// Remove role from user
    pub async fn remove_role_from_user(&self, user_id: Uuid, role_id: String, removed_by: Uuid) -> AppResult<()> {
        let mut profiles = self.user_profiles.write().await;
        if let Some(profile) = profiles.get_mut(&user_id) {
            profile.roles.retain(|r| r != &role_id);
            profile.updated_at = Utc::now();
            
            // Recalculate permissions
            let effective_permissions = self.calculate_effective_permissions(&profile.roles).await?;
            profile.permissions = effective_permissions.clone();
            
            // Update cache
            self.permission_cache.write().await.insert(user_id, effective_permissions);
            
            // Log activity
            self.log_user_activity(user_id, ActivityType::RoleChange, &format!("Role '{}' removed", role_id), None, None, None, None, HashMap::new()).await?;
        } else {
            return Err(AppError::Validation("User profile not found".to_string()));
        }

        Ok(())
    }

    /// Perform account management action
    pub async fn perform_account_action(&self, user_id: Uuid, action: AccountAction, performed_by: Uuid, reason: String) -> AppResult<()> {
        let mut profiles = self.user_profiles.write().await;
        if let Some(profile) = profiles.get_mut(&user_id) {
            match action {
                AccountAction::Activate => {
                    profile.account_status = AccountStatus::Active;
                }
                AccountAction::Deactivate => {
                    profile.account_status = AccountStatus::Inactive;
                }
                AccountAction::Suspend { duration, .. } => {
                    profile.account_status = AccountStatus::Suspended;
                }
                AccountAction::Unsuspend => {
                    profile.account_status = AccountStatus::Active;
                }
                AccountAction::Lock { .. } => {
                    profile.account_status = AccountStatus::Locked;
                }
                AccountAction::Unlock => {
                    profile.account_status = AccountStatus::Active;
                }
                AccountAction::Delete { .. } => {
                    profiles.remove(&user_id);
                    self.permission_cache.write().await.remove(&user_id);
                }
                AccountAction::ChangeRole { new_role, .. } => {
                    profile.roles = vec![new_role];
                    let effective_permissions = self.calculate_effective_permissions(&profile.roles).await?;
                    profile.permissions = effective_permissions.clone();
                    self.permission_cache.write().await.insert(user_id, effective_permissions);
                }
                AccountAction::GrantPermission { permission, .. } => {
                    profile.permissions.push(permission);
                }
                AccountAction::RevokePermission { permission, .. } => {
                    profile.permissions.retain(|p| p != &permission);
                }
            }
            
            profile.updated_at = Utc::now();
            
            // Log activity
            self.log_user_activity(user_id, ActivityType::Custom(format!("Account action: {:?}", action)), &reason, None, None, None, None, HashMap::new()).await?;
        } else {
            return Err(AppError::Validation("User profile not found".to_string()));
        }

        Ok(())
    }

    /// Create user session
    pub async fn create_user_session(&self, user_id: Uuid, session_token: String, ip_address: String, user_agent: String, expires_at: DateTime<Utc>) -> AppResult<Uuid> {
        let session_id = Uuid::new_v4();
        let session = UserSession {
            id: session_id,
            user_id,
            session_token,
            ip_address,
            user_agent,
            created_at: Utc::now(),
            last_activity: Utc::now(),
            expires_at,
            is_active: true,
        };

        self.user_sessions.write().await.insert(session_id, session);
        
        // Log activity
        self.log_user_activity(user_id, ActivityType::Login, "User logged in", None, None, Some(ip_address), Some(user_agent), HashMap::new()).await?;

        Ok(session_id)
    }

    /// Update session activity
    pub async fn update_session_activity(&self, session_id: Uuid) -> AppResult<()> {
        let mut sessions = self.user_sessions.write().await;
        if let Some(session) = sessions.get_mut(&session_id) {
            session.last_activity = Utc::now();
        }
        Ok(())
    }

    /// Invalidate user session
    pub async fn invalidate_session(&self, session_id: Uuid) -> AppResult<()> {
        let mut sessions = self.user_sessions.write().await;
        if let Some(session) = sessions.get_mut(&session_id) {
            session.is_active = false;
            
            // Log activity
            self.log_user_activity(session.user_id, ActivityType::Logout, "User logged out", None, None, None, None, HashMap::new()).await?;
        }
        Ok(())
    }

    /// Get user sessions
    pub async fn get_user_sessions(&self, user_id: Uuid) -> AppResult<Vec<UserSession>> {
        let sessions = self.user_sessions.read().await;
        Ok(sessions.values().filter(|s| s.user_id == user_id).cloned().collect())
    }

    /// Log user activity
    pub async fn log_user_activity(&self, user_id: Uuid, activity_type: ActivityType, description: &str, resource_type: Option<String>, resource_id: Option<String>, ip_address: Option<String>, user_agent: Option<String>, metadata: HashMap<String, serde_json::Value>) -> AppResult<()> {
        let log_entry = UserActivityLog {
            id: Uuid::new_v4(),
            user_id,
            activity_type,
            description: description.to_string(),
            resource_type,
            resource_id,
            ip_address,
            user_agent,
            metadata,
            timestamp: Utc::now(),
        };

        self.activity_logs.write().await.push(log_entry);
        Ok(())
    }

    /// Get user activity logs
    pub async fn get_user_activity_logs(&self, user_id: Option<Uuid>, limit: Option<usize>, offset: Option<usize>) -> AppResult<Vec<UserActivityLog>> {
        let logs = self.activity_logs.read().await;
        let filtered_logs: Vec<_> = if let Some(user_id) = user_id {
            logs.iter().filter(|log| log.user_id == user_id).cloned().collect()
        } else {
            logs.clone()
        };

        let offset = offset.unwrap_or(0);
        let limit = limit.unwrap_or(100);

        Ok(filtered_logs.into_iter().skip(offset).take(limit).collect())
    }

    /// Get user statistics
    pub async fn get_user_statistics(&self) -> AppResult<UserStatistics> {
        let profiles = self.user_profiles.read().await;
        let sessions = self.user_sessions.read().await;
        let logs = self.activity_logs.read().await;

        let total_users = profiles.len();
        let active_users = profiles.values().filter(|p| p.account_status == AccountStatus::Active).count();
        let active_sessions = sessions.values().filter(|s| s.is_active).count();
        let total_logins = logs.iter().filter(|l| matches!(l.activity_type, ActivityType::Login)).count();

        let users_by_status: HashMap<AccountStatus, usize> = profiles.values()
            .fold(HashMap::new(), |mut acc, profile| {
                *acc.entry(profile.account_status.clone()).or_insert(0) += 1;
                acc
            });

        Ok(UserStatistics {
            total_users,
            active_users,
            active_sessions,
            total_logins,
            users_by_status,
        })
    }
}

/// User statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserStatistics {
    pub total_users: usize,
    pub active_users: usize,
    pub active_sessions: usize,
    pub total_logins: usize,
    pub users_by_status: HashMap<AccountStatus, usize>,
}

impl Default for EnhancedUserManagementService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[tokio::test]
    async fn test_user_management() {
        let service = EnhancedUserManagementService::new();
        
        // Test creating user profile
        let profile = UserProfile {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            first_name: "John".to_string(),
            last_name: "Doe".to_string(),
            display_name: None,
            avatar_url: None,
            phone: None,
            timezone: "UTC".to_string(),
            locale: "en".to_string(),
            roles: vec!["user".to_string()],
            permissions: vec![],
            preferences: UserPreferences {
                theme: "light".to_string(),
                language: "en".to_string(),
                notifications: NotificationPreferences {
                    email_enabled: true,
                    push_enabled: false,
                    sms_enabled: false,
                    webhook_enabled: false,
                    notification_types: HashMap::new(),
                },
                privacy: PrivacyPreferences {
                    profile_visibility: ProfileVisibility::Private,
                    activity_tracking: true,
                    data_sharing: false,
                    analytics_opt_in: true,
                },
                dashboard: DashboardPreferences {
                    layout: "default".to_string(),
                    widgets: vec![],
                    refresh_interval: 30,
                    default_view: "overview".to_string(),
                },
            },
            account_status: AccountStatus::Active,
            last_login: None,
            login_count: 0,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        let user_id = service.create_user_profile(profile).await.unwrap();
        assert!(!user_id.is_nil());
        
        // Test permission check
        let mut context = HashMap::new();
        context.insert("owner_id".to_string(), serde_json::Value::String(user_id.to_string()));
        
        let has_permission = service.check_permission(user_id, "projects", "read", Some(context)).await.unwrap();
        assert!(has_permission);
        
        // Test role assignment
        service.assign_role_to_user(user_id, "analyst".to_string(), user_id).await.unwrap();
        
        // Test activity logging
        service.log_user_activity(user_id, ActivityType::Login, "Test login", None, None, None, None, HashMap::new()).await.unwrap();
        
        // Test getting activity logs
        let logs = service.get_user_activity_logs(Some(user_id), Some(10), None).await.unwrap();
        assert!(!logs.is_empty());
    }

    #[tokio::test]
    async fn test_permission_system() {
        let service = EnhancedUserManagementService::new();
        
        // Test creating custom role
        let custom_role = UserRole {
            id: "custom_role".to_string(),
            name: "Custom Role".to_string(),
            description: "Custom role for testing".to_string(),
            permissions: vec![
                Permission {
                    resource: "projects".to_string(),
                    action: "read".to_string(),
                    conditions: vec![PermissionCondition {
                        field: "status".to_string(),
                        operator: ConditionOperator::Equals,
                        value: serde_json::Value::String("active".to_string()),
                    }],
                }
            ],
            is_system_role: false,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        service.create_user_role(custom_role).await.unwrap();
        
        // Test permission evaluation
        let mut context = HashMap::new();
        context.insert("status".to_string(), serde_json::Value::String("active".to_string()));
        
        // This would need a user with the custom role to test properly
        // For now, we'll just verify the role was created
        let roles = service.list_user_roles().await.unwrap();
        assert!(roles.iter().any(|r| r.id == "custom_role"));
    }
}
