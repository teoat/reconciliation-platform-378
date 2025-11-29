//! Visualization request/response types

use serde::Deserialize;
use validator::Validate;

/// Schedule report request
#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct ScheduleReportRequest {
    pub schedule: serde_json::Value,
}

/// Export visualization request
#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct ExportVisualizationRequest {
    pub format: Option<String>,
    pub data_type: Option<String>,
}

