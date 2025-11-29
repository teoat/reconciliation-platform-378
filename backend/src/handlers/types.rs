//! Shared types and DTOs for API handlers

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

/// Generic API response wrapper
#[derive(Serialize, utoipa::ToSchema)]
#[schema(as = ApiResponse)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
    pub error: Option<String>,
}

/// Paginated response wrapper
#[derive(Serialize, utoipa::ToSchema)]
#[schema(as = PaginatedResponse)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub total: i64,
    pub page: i32,
    pub per_page: i32,
    pub total_pages: i32,
}

/// Search query parameters
#[derive(Deserialize, utoipa::ToSchema)]
pub struct SearchQueryParams {
    pub q: Option<String>,
    pub page: Option<i32>,
    pub per_page: Option<i32>,
}

/// User query parameters
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct UserQueryParams {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

/// Reconciliation results query parameters
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct ReconciliationResultsQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub match_type: Option<String>,
    pub lean: Option<bool>,
}

/// Reconciliation query parameters
#[derive(Debug, Deserialize)]
pub struct ReconciliationQueryParams {
    pub project_id: Option<Uuid>,
    pub status: Option<String>,
    pub page: Option<i32>,
    pub per_page: Option<i32>,
}

/// File query parameters
#[derive(Debug, Deserialize)]
pub struct FileQueryParams {
    pub project_id: Option<Uuid>,
    pub status: Option<String>,
    pub page: Option<i32>,
    pub per_page: Option<i32>,
}

// Project-related DTOs
#[derive(Deserialize, Validate)]
pub struct CreateProjectRequest {
    #[validate(length(
        min = 1,
        max = 255,
        message = "Project name must be between 1 and 255 characters"
    ))]
    pub name: String,
    #[validate(length(max = 1000, message = "Description cannot exceed 1000 characters"))]
    pub description: Option<String>,
    /// Owner ID - optional, defaults to authenticated user (admin can specify different owner)
    pub owner_id: Option<Uuid>,
    pub status: Option<String>,
    pub settings: Option<serde_json::Value>,
}

#[derive(Deserialize)]
pub struct UpdateProjectRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub settings: Option<serde_json::Value>,
}

// Data source DTOs
#[derive(Deserialize)]
pub struct CreateDataSourceRequest {
    pub name: String,
    pub description: Option<String>,
    pub source_type: String,
    pub file_path: Option<String>,
    pub file_size: Option<i64>,
    pub file_hash: Option<String>,
    pub schema: Option<serde_json::Value>,
}

// Reconciliation job DTOs
#[derive(Deserialize, Validate)]
pub struct CreateReconciliationJobRequest {
    #[validate(length(
        min = 1,
        max = 255,
        message = "Job name must be between 1 and 255 characters"
    ))]
    pub name: String,
    #[validate(length(max = 1000, message = "Description cannot exceed 1000 characters"))]
    pub description: Option<String>,
    pub project_id: Uuid,
    pub source_data_source_id: Uuid,
    pub target_data_source_id: Uuid,
    #[validate(range(
        min = 0.0,
        max = 1.0,
        message = "Confidence threshold must be between 0 and 1"
    ))]
    pub confidence_threshold: f64,
    pub settings: Option<serde_json::Value>,
}

#[derive(Deserialize)]
pub struct UpdateReconciliationJobRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub confidence_threshold: Option<f64>,
    pub settings: Option<serde_json::Value>,
}

// File upload DTOs
#[derive(Deserialize, utoipa::ToSchema)]
pub struct FileUploadRequest {
    pub name: String,
    pub description: Option<String>,
    pub project_id: Uuid,
    pub source_type: String,
}

// Health check response types
#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub timestamp: String,
    pub version: String,
}

#[derive(Debug, Serialize)]
pub struct ReadinessResponse {
    pub status: String,
    pub checks: SystemChecks,
}

#[derive(Debug, Serialize)]
pub struct SystemChecks {
    pub database: String,
    pub cache: String,
    pub memory: String,
}

/// Error response type - re-export from errors module
pub use crate::errors::ErrorResponse;

/// Login response type - alias for AuthResponse
pub use crate::services::auth::AuthResponse as LoginResponse;
