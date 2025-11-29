//! Cashflow request/response types

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

/// Create cashflow category request
#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct CreateCategoryRequest {
    pub project_id: Uuid,
    #[validate(length(min = 1, max = 255))]
    pub name: String,
    #[validate(length(max = 1000))]
    pub description: Option<String>,
    pub category_type: Option<String>,
    pub parent_id: Option<Uuid>,
}

/// Update cashflow category request
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct UpdateCategoryRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub is_active: Option<bool>,
}

/// Create cashflow transaction request
#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct CreateTransactionRequest {
    pub project_id: Uuid,
    pub category_id: Option<Uuid>,
    pub amount: f64,
    pub currency: Option<String>,
    pub transaction_date: Option<chrono::NaiveDate>,
    pub description: Option<String>,
    pub reference_number: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

/// Update cashflow transaction request
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct UpdateTransactionRequest {
    pub category_id: Option<Uuid>,
    pub amount: Option<f64>,
    pub description: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

/// Create cashflow discrepancy request
#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct CreateDiscrepancyRequest {
    pub project_id: Uuid,
    pub transaction_a_id: Option<Uuid>,
    pub transaction_b_id: Option<Uuid>,
    pub discrepancy_type: Option<String>,
    pub expected_amount: Option<f64>,
    pub actual_amount: Option<f64>,
    pub description: Option<String>,
}

/// Update cashflow discrepancy request
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct UpdateDiscrepancyRequest {
    pub status: Option<String>,
    pub resolved_by: Option<Uuid>,
    pub resolution_notes: Option<String>,
}

/// Resolve discrepancy request
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct ResolveDiscrepancyRequest {
    pub notes: Option<String>,
}

