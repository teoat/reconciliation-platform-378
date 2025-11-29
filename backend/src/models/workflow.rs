//! Workflow models

use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::schema::{workflows, workflow_instances, workflow_rules};

/// Workflow model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = workflows)]
pub struct Workflow {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub project_id: Option<Uuid>,
    pub definition: serde_json::Value,
    pub status: String,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New workflow (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = workflows)]
pub struct NewWorkflow {
    pub name: String,
    pub description: Option<String>,
    pub project_id: Option<Uuid>,
    pub definition: serde_json::Value,
    pub status: String,
    pub created_by: Uuid,
}

/// Update workflow
#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = workflows)]
pub struct UpdateWorkflow {
    pub name: Option<String>,
    pub description: Option<String>,
    pub definition: Option<serde_json::Value>,
    pub status: Option<String>,
}

/// Workflow instance model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = workflow_instances)]
pub struct WorkflowInstance {
    pub id: Uuid,
    pub workflow_id: Uuid,
    pub status: String,
    pub current_step: Option<String>,
    pub state: serde_json::Value,
    pub started_by: Option<Uuid>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub error_message: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New workflow instance (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = workflow_instances)]
pub struct NewWorkflowInstance {
    pub workflow_id: Uuid,
    pub status: String,
    pub current_step: Option<String>,
    pub state: serde_json::Value,
    pub started_by: Option<Uuid>,
    pub started_at: Option<DateTime<Utc>>,
}

/// Update workflow instance
#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = workflow_instances)]
pub struct UpdateWorkflowInstance {
    pub status: Option<String>,
    pub current_step: Option<String>,
    pub state: Option<serde_json::Value>,
    pub completed_at: Option<DateTime<Utc>>,
    pub error_message: Option<String>,
}

/// Workflow rule model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = workflow_rules)]
pub struct WorkflowRule {
    pub id: Uuid,
    pub workflow_id: Uuid,
    pub name: String,
    pub condition: serde_json::Value,
    pub action: serde_json::Value,
    pub priority: i32,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New workflow rule (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = workflow_rules)]
pub struct NewWorkflowRule {
    pub workflow_id: Uuid,
    pub name: String,
    pub condition: serde_json::Value,
    pub action: serde_json::Value,
    pub priority: i32,
    pub is_active: bool,
}

/// Update workflow rule
#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = workflow_rules)]
pub struct UpdateWorkflowRule {
    pub name: Option<String>,
    pub condition: Option<serde_json::Value>,
    pub action: Option<serde_json::Value>,
    pub priority: Option<i32>,
    pub is_active: Option<bool>,
}

