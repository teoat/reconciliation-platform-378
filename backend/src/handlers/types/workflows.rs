//! Workflows request/response types

use serde::Deserialize;
use uuid::Uuid;
use validator::Validate;

/// Create workflow instance request
#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct CreateInstanceRequest {
    pub workflow_id: Uuid,
    pub data: serde_json::Value,
}

/// Update workflow instance request
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct UpdateInstanceRequest {
    pub status: Option<String>,
    pub current_step: Option<String>,
    pub state: Option<serde_json::Value>,
    pub error_message: Option<String>,
}

/// Create workflow rule request
#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct CreateRuleRequest {
    pub workflow_id: Uuid,
    #[validate(length(min = 1, max = 255))]
    pub name: String,
    pub condition: serde_json::Value,
    pub action: serde_json::Value,
    pub priority: Option<i32>,
    pub active: Option<bool>,
}

/// Update workflow rule request
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct UpdateRuleRequest {
    pub name: Option<String>,
    pub condition: Option<serde_json::Value>,
    pub action: Option<serde_json::Value>,
    pub priority: Option<i32>,
    pub active: Option<bool>,
}

/// Test workflow rule request
#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct TestRuleRequest {
    pub rule: serde_json::Value,
    pub test_data: serde_json::Value,
}

