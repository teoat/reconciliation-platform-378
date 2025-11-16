//! User permissions and roles service
//!
//! Handles role and permission management for users.

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::users;
use diesel::prelude::*;

/// Permission service for managing user roles and permissions
pub struct PermissionService {
    db: Arc<Database>,
}

/// Permission definition
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct Permission {
    pub resource: String,
    pub action: String,
}

/// Role definition with permissions
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct Role {
    pub id: String,
    pub name: String,
    pub permissions: Vec<Permission>,
}

impl std::fmt::Display for Role {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.id)
    }
}

impl std::str::FromStr for Role {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(Role {
            id: s.to_string(),
            name: s.to_string(),
            permissions: Vec::new(),
        })
    }
}

impl PermissionService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    /// Internal: Get user's role
    async fn get_user_role_impl(&self, user_id: Uuid) -> AppResult<String> {
        let mut conn = self.db.get_connection()?;

        let role = users::table
            .filter(users::id.eq(user_id))
            .select(users::status)
            .first::<String>(&mut conn)
            .map_err(AppError::Database)?;

        Ok(role)
    }

    /// Internal: Update user's role
    async fn update_user_role_impl(&self, user_id: Uuid, role: &str) -> AppResult<()> {
        // Validate role format
        if !self.is_valid_role(role) {
            return Err(AppError::Validation(
                "Invalid role. Must be one of: user, admin, manager, viewer".to_string(),
            ));
        }

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

        // Update role
        diesel::update(users::table.filter(users::id.eq(user_id)))
            .set(users::status.eq(role))
            .execute(&mut conn)
            .map_err(AppError::Database)?;

        Ok(())
    }

    /// Check if role is valid
    pub fn is_valid_role(&self, role: &str) -> bool {
        matches!(role, "user" | "admin" | "manager" | "viewer")
    }

    /// Get permissions for a role
    pub fn get_role_permissions(&self, role: &str) -> Vec<Permission> {
        match role {
            "admin" => vec![Permission {
                resource: "*".to_string(),
                action: "*".to_string(),
            }],
            "manager" => vec![
                Permission {
                    resource: "projects".to_string(),
                    action: "create".to_string(),
                },
                Permission {
                    resource: "projects".to_string(),
                    action: "update".to_string(),
                },
                Permission {
                    resource: "projects".to_string(),
                    action: "delete".to_string(),
                },
                Permission {
                    resource: "reconciliation".to_string(),
                    action: "*".to_string(),
                },
            ],
            "viewer" => vec![
                Permission {
                    resource: "projects".to_string(),
                    action: "read".to_string(),
                },
                Permission {
                    resource: "reconciliation".to_string(),
                    action: "read".to_string(),
                },
            ],
            _ => vec![
                Permission {
                    resource: "projects".to_string(),
                    action: "read".to_string(),
                },
                Permission {
                    resource: "projects".to_string(),
                    action: "create".to_string(),
                },
                Permission {
                    resource: "reconciliation".to_string(),
                    action: "read".to_string(),
                },
            ],
        }
    }

    /// Internal: Check if user has permission
    async fn has_permission_impl(
        &self,
        user_id: Uuid,
        resource: &str,
        action: &str,
    ) -> AppResult<bool> {
        let role = self.get_user_role_impl(user_id).await?;
        let permissions = self.get_role_permissions(&role);

        // Check for wildcard permissions
        for permission in &permissions {
            if permission.resource == "*" && permission.action == "*" {
                return Ok(true);
            }
            if permission.resource == resource && permission.action == "*" {
                return Ok(true);
            }
            if permission.resource == resource && permission.action == action {
                return Ok(true);
            }
        }

        Ok(false)
    }

    /// Get role definition
    pub fn get_role(&self, role_id: &str) -> AppResult<Role> {
        if !self.is_valid_role(role_id) {
            return Err(AppError::Validation("Invalid role".to_string()));
        }

        let permissions = self.get_role_permissions(role_id);

        Ok(Role {
            id: role_id.to_string(),
            name: role_id.to_string(),
            permissions,
        })
    }
}

// Implement the trait for PermissionService
#[async_trait]
impl super::traits::PermissionServiceTrait for PermissionService {
    async fn get_user_role(&self, user_id: Uuid) -> AppResult<String> {
        self.get_user_role_impl(user_id).await
    }

    async fn update_user_role(&self, user_id: Uuid, role: &str) -> AppResult<()> {
        self.update_user_role_impl(user_id, role).await
    }

    fn is_valid_role(&self, role: &str) -> bool {
        self.is_valid_role(role)
    }

    fn get_role_permissions(&self, role: &str) -> Vec<Permission> {
        self.get_role_permissions(role)
    }

    async fn has_permission(&self, user_id: Uuid, resource: &str, action: &str) -> AppResult<bool> {
        self.has_permission_impl(user_id, resource, action).await
    }

    fn get_role(&self, role_id: &str) -> AppResult<Role> {
        self.get_role(role_id)
    }
}
