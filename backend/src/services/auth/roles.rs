//! User roles and role-based access control

use crate::errors::AppError;

/// User role enumeration
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum UserRole {
    Admin,
    User,
    Viewer,
    Manager,
}

impl std::str::FromStr for UserRole {
    type Err = AppError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "admin" => Ok(UserRole::Admin),
            "user" => Ok(UserRole::User),
            "viewer" => Ok(UserRole::Viewer),
            "manager" => Ok(UserRole::Manager),
            _ => Err(AppError::Validation(format!("Invalid user role: {}", s))),
        }
    }
}

impl std::fmt::Display for UserRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            UserRole::Admin => write!(f, "admin"),
            UserRole::User => write!(f, "user"),
            UserRole::Viewer => write!(f, "viewer"),
            UserRole::Manager => write!(f, "manager"),
        }
    }
}

/// Role-based access control utilities
pub struct RoleManager;

impl RoleManager {
    /// Check if user has required role
    pub fn has_role(user_role: &str, required_role: &str) -> bool {
        match (user_role, required_role) {
            ("admin", _) => true,
            ("manager", "user") => true,
            ("manager", "manager") => true,
            ("user", "user") => true,
            _ => false,
        }
    }

    /// Check if user has permission for specific action
    pub fn check_permission(user_role: &str, resource: &str, action: &str) -> bool {
        match user_role {
            "admin" => true, // Admin has all permissions
            "manager" => match resource {
                "users" => action == "read" || action == "update",
                "projects" => true,
                "reconciliation" => true,
                "analytics" => true,
                _ => false,
            },
            "user" => match resource {
                "projects" => action == "read" || action == "create",
                "reconciliation" => action == "read" || action == "create",
                "analytics" => action == "read",
                _ => false,
            },
            "viewer" => match resource {
                "projects" => action == "read",
                "reconciliation" => action == "read",
                "analytics" => action == "read",
                _ => false,
            },
            _ => false,
        }
    }

    /// Get user permissions
    pub fn get_user_permissions(user_role: &str) -> Vec<String> {
        match user_role {
            "admin" => vec![
                "users:create".to_string(),
                "users:read".to_string(),
                "users:update".to_string(),
                "users:delete".to_string(),
                "projects:create".to_string(),
                "projects:read".to_string(),
                "projects:update".to_string(),
                "projects:delete".to_string(),
                "reconciliation:create".to_string(),
                "reconciliation:read".to_string(),
                "reconciliation:update".to_string(),
                "reconciliation:delete".to_string(),
                "analytics:read".to_string(),
                "system:admin".to_string(),
            ],
            "manager" => vec![
                "users:read".to_string(),
                "users:update".to_string(),
                "projects:create".to_string(),
                "projects:read".to_string(),
                "projects:update".to_string(),
                "projects:delete".to_string(),
                "reconciliation:create".to_string(),
                "reconciliation:read".to_string(),
                "reconciliation:update".to_string(),
                "reconciliation:delete".to_string(),
                "analytics:read".to_string(),
            ],
            "user" => vec![
                "projects:create".to_string(),
                "projects:read".to_string(),
                "reconciliation:create".to_string(),
                "reconciliation:read".to_string(),
                "analytics:read".to_string(),
            ],
            "viewer" => vec![
                "projects:read".to_string(),
                "reconciliation:read".to_string(),
                "analytics:read".to_string(),
            ],
            _ => vec![],
        }
    }
}

