//! Ingestion models

use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::schema::{ingestion_errors, ingestion_jobs, ingestion_results};

/// Ingestion job model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = ingestion_jobs)]
pub struct IngestionJob {
    pub id: Uuid,
    pub project_id: Uuid,
    pub job_name: String,
    pub source_type: String,
    pub source_config: serde_json::Value,
    pub status: String,
    pub progress: i32,
    pub total_records: Option<i32>,
    pub processed_records: i32,
    pub error_count: i32,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub error_message: Option<String>,
    pub metadata: serde_json::Value,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New ingestion job (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = ingestion_jobs)]
pub struct NewIngestionJob {
    pub project_id: Uuid,
    pub job_name: String,
    pub source_type: String,
    pub source_config: serde_json::Value,
    pub status: String,
    pub progress: i32,
    pub metadata: serde_json::Value,
    pub created_by: Uuid,
}

/// Update ingestion job
#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = ingestion_jobs)]
pub struct UpdateIngestionJob {
    pub status: Option<String>,
    pub progress: Option<i32>,
    pub total_records: Option<Option<i32>>,
    pub processed_records: Option<i32>,
    pub error_count: Option<i32>,
    pub started_at: Option<Option<DateTime<Utc>>>,
    pub completed_at: Option<Option<DateTime<Utc>>>,
    pub error_message: Option<String>,
}

/// Ingestion result model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = ingestion_results)]
pub struct IngestionResult {
    pub id: Uuid,
    pub job_id: Uuid,
    pub record_data: serde_json::Value,
    pub record_index: i32,
    pub status: String,
    pub validation_errors: Option<serde_json::Value>,
    pub transformation_applied: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

/// New ingestion result (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = ingestion_results)]
pub struct NewIngestionResult {
    pub job_id: Uuid,
    pub record_data: serde_json::Value,
    pub record_index: i32,
    pub status: String,
    pub validation_errors: Option<serde_json::Value>,
    pub transformation_applied: Option<serde_json::Value>,
}

/// Ingestion error model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = ingestion_errors)]
pub struct IngestionError {
    pub id: Uuid,
    pub job_id: Uuid,
    pub error_type: String,
    pub error_message: String,
    pub record_data: Option<serde_json::Value>,
    pub record_index: Option<i32>,
    pub stack_trace: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// New ingestion error (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = ingestion_errors)]
pub struct NewIngestionError {
    pub job_id: Uuid,
    pub error_type: String,
    pub error_message: String,
    pub record_data: Option<serde_json::Value>,
    pub record_index: Option<i32>,
    pub stack_trace: Option<String>,
}

