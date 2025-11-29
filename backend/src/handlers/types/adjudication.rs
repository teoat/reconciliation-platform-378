//! Adjudication request/response types

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

/// Create adjudication case request
#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct CreateCaseRequest {
    pub project_id: Option<Uuid>,
    #[validate(length(min = 1, max = 255))]
    pub title: String,
    #[validate(length(max = 2000))]
    pub description: Option<String>,
    pub case_type: Option<String>,
    pub priority: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

/// Update adjudication case request
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct UpdateCaseRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

/// Assign case request
#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct AssignCaseRequest {
    pub user_id: Uuid,
}

/// Resolve case request
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct ResolveCaseRequest {
    pub notes: Option<String>,
}

/// Create adjudication workflow request
#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct CreateAdjudicationWorkflowRequest {
    pub project_id: Option<Uuid>,
    #[validate(length(min = 1, max = 255))]
    pub name: String,
    pub definition: serde_json::Value,
}

/// Update adjudication workflow request
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct UpdateAdjudicationWorkflowRequest {
    pub name: Option<String>,
    pub definition: Option<serde_json::Value>,
    pub active: Option<bool>,
}

/// Create decision request
#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct CreateDecisionRequest {
    pub case_id: Uuid,
    #[validate(length(min = 1))]
    pub decision: String,
    pub rationale: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

/// Update decision request
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct UpdateDecisionRequest {
    pub decision: Option<String>,
    pub rationale: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

/// Appeal decision request
#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct AppealDecisionRequest {
    #[validate(length(min = 1))]
    pub reason: String,
}

