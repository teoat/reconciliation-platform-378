//! Ingestion request/response types

use serde::Deserialize;
use uuid::Uuid;
use validator::Validate;

/// Upload data request
#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct UploadDataRequest {
    pub project_id: Uuid,
    #[validate(length(min = 1))]
    pub filename: String,
    pub metadata: Option<serde_json::Value>,
}

/// Process data request
#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct ProcessDataRequest {
    pub job_id: Uuid,
}

/// Validate data request
#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct ValidateDataRequest {
    pub job_id: Uuid,
}

/// Transform data request
#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct TransformDataRequest {
    pub job_id: Uuid,
    pub transformation_rules: Option<serde_json::Value>,
}

