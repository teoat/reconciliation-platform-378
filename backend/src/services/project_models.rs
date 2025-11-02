//! Project service data models and query result structs
//!
//! This module contains all the data structures used by the project service,
//! including database query results and API response types.

use diesel::prelude::*;
use uuid::Uuid;
use serde::{Serialize, Deserialize};
use chrono::DateTime;
use crate::models::JsonValue;

// Query result structs for Diesel queries
#[derive(Queryable)]
pub struct ProjectQueryResult {
    pub project_id: Uuid,
    pub project_name: String,
    pub project_description: Option<String>,
    pub owner_id: Uuid,
    pub project_status: String,
    pub settings: Option<JsonValue>,
    pub created_at: DateTime<chrono::Utc>,
    pub updated_at: DateTime<chrono::Utc>,
    pub owner_email: String,
}

#[derive(Queryable)]
pub struct ProjectWithStatsResult {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub owner_id: Uuid,
    pub status: String,
    pub settings: Option<JsonValue>,
    pub created_at: DateTime<chrono::Utc>,
    pub updated_at: DateTime<chrono::Utc>,
    pub owner_email: String,
    pub total_jobs: i64,
    pub total_data_sources: i64,
}

#[derive(QueryableByName, Debug)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct JobStats {
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub total_jobs: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub completed_jobs: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub failed_jobs: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub running_jobs: i64,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Double>)]
    pub avg_duration_seconds: Option<f64>,
}

#[derive(QueryableByName, Debug)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct FileStats {
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub total_files: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub completed_files: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub failed_files: i64,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::BigInt>)]
    pub total_size_bytes: Option<i64>,
}

#[derive(QueryableByName, Debug)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct RecordStats {
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub total_records: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub matched_records: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub unmatched_records: i64,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Double>)]
    pub avg_confidence_score: Option<f64>,
}

#[derive(QueryableByName, Debug, Serialize)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct RecentActivity {
    #[diesel(sql_type = diesel::sql_types::Text)]
    pub activity_type: String,
    #[diesel(sql_type = diesel::sql_types::Text)]
    pub activity_name: String,
    #[diesel(sql_type = diesel::sql_types::Timestamptz)]
    pub activity_time: DateTime<chrono::Utc>,
    #[diesel(sql_type = diesel::sql_types::Text)]
    pub activity_status: String,
}

#[derive(QueryableByName, Debug, Serialize)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct MonthlyTrend {
    #[diesel(sql_type = diesel::sql_types::Timestamptz)]
    pub month: DateTime<chrono::Utc>,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub job_count: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub completed_count: i64,
}

#[derive(QueryableByName, Debug)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct PerformanceData {
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Double>)]
    pub avg_job_duration: Option<f64>,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Double>)]
    pub min_job_duration: Option<f64>,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Double>)]
    pub max_job_duration: Option<f64>,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub total_jobs: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub successful_jobs: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub failed_jobs: i64,
}

#[derive(QueryableByName, Debug)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct FilePerformanceData {
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Double>)]
    pub avg_processing_time: Option<f64>,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::BigInt>)]
    pub total_size_processed: Option<i64>,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub total_files_processed: i64,
}

#[derive(QueryableByName, Debug)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct CollaboratorData {
    #[diesel(sql_type = diesel::sql_types::Uuid)]
    pub id: Uuid,
    #[diesel(sql_type = diesel::sql_types::Text)]
    pub email: String,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Text>)]
    pub first_name: Option<String>,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Text>)]
    pub last_name: Option<String>,
    #[diesel(sql_type = diesel::sql_types::Text)]
    pub role: String,
    #[diesel(sql_type = diesel::sql_types::Bool)]
    pub is_active: bool,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Timestamptz>)]
    pub last_login_at: Option<DateTime<chrono::Utc>>,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub job_count: i64,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Timestamptz>)]
    pub last_activity: Option<DateTime<chrono::Utc>>,
}

#[derive(QueryableByName, Debug)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct ActivityData {
    #[diesel(sql_type = diesel::sql_types::Text)]
    pub activity_type: String,
    #[diesel(sql_type = diesel::sql_types::Text)]
    pub activity_description: String,
    #[diesel(sql_type = diesel::sql_types::Timestamptz)]
    pub activity_time: DateTime<chrono::Utc>,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Uuid>)]
    pub user_id: Option<Uuid>,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Uuid>)]
    pub job_id: Option<Uuid>,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Uuid>)]
    pub file_id: Option<Uuid>,
}

// API Request/Response structs

/// Project creation request
#[derive(Debug, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: Option<String>,
    pub owner_id: Uuid,
    pub status: Option<String>,
    pub settings: Option<JsonValue>,
}

/// Project update request
#[derive(Debug, Deserialize)]
pub struct UpdateProjectRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub settings: Option<JsonValue>,
}

/// Project list response
#[derive(Debug, Serialize)]
pub struct ProjectListResponse {
    pub projects: Vec<ProjectInfo>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
}

/// Project information for responses
#[derive(Debug, Serialize)]
pub struct ProjectInfo {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub owner_id: Uuid,
    pub owner_email: String,
    pub status: String,
    pub settings: Option<JsonValue>,
    pub created_at: DateTime<chrono::Utc>,
    pub updated_at: DateTime<chrono::Utc>,
    pub job_count: i64,
    pub data_source_count: i64,
    pub last_activity: Option<DateTime<chrono::Utc>>,
}

/// Project statistics
#[derive(Debug, Serialize)]
pub struct ProjectStats {
    pub total_projects: i64,
    pub active_projects: i64,
    pub inactive_projects: i64,
    pub archived_projects: i64,
    pub total_jobs: i64,
    pub total_data_sources: i64,
    pub recent_projects: Vec<ProjectInfo>,
}

// Analytics and Performance structs

#[derive(Debug, Serialize)]
pub struct ProjectAnalytics {
    pub project: ProjectInfo,
    pub job_statistics: JobStatistics,
    pub file_statistics: FileStatistics,
    pub record_statistics: RecordStatistics,
    pub recent_activity: Vec<RecentActivity>,
    pub monthly_trends: Vec<MonthlyTrend>,
    pub generated_at: DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct JobStatistics {
    pub total_jobs: i64,
    pub completed_jobs: i64,
    pub failed_jobs: i64,
    pub running_jobs: i64,
    pub average_duration_seconds: Option<f64>,
    pub success_rate: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct FileStatistics {
    pub total_files: i64,
    pub completed_files: i64,
    pub failed_files: i64,
    pub total_size_bytes: i64,
    pub success_rate: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct RecordStatistics {
    pub total_records: i64,
    pub matched_records: i64,
    pub unmatched_records: i64,
    pub average_confidence_score: Option<f64>,
    pub match_rate: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct ProjectPerformance {
    pub job_performance: JobPerformance,
    pub file_performance: FilePerformance,
    pub generated_at: DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct JobPerformance {
    pub average_duration_seconds: Option<f64>,
    pub min_duration_seconds: Option<f64>,
    pub max_duration_seconds: Option<f64>,
    pub total_jobs: i64,
    pub successful_jobs: i64,
    pub failed_jobs: i64,
    pub success_rate: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct FilePerformance {
    pub average_processing_time_seconds: Option<f64>,
    pub total_size_processed_bytes: i64,
    pub total_files_processed: i64,
    pub average_file_size_bytes: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct ProjectCollaborator {
    pub id: Uuid,
    pub email: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub role: String,
    pub is_active: bool,
    pub last_login_at: Option<DateTime<chrono::Utc>>,
    pub job_count: i64,
    pub last_activity: Option<DateTime<chrono::Utc>>,
}

/// Project statistics summary
#[derive(Debug, Serialize)]
pub struct ProjectStatistics {
    pub total_projects: u32,
    pub active_projects: u32,
    pub completed_projects: u32,
    pub archived_projects: u32,
}

/// Activity event for project analytics
#[derive(Debug, Serialize)]
pub struct ActivityEvent {
    pub id: Uuid,
    pub timestamp: DateTime<chrono::Utc>,
    pub event_type: String,
    pub description: String,
    pub user_id: Option<Uuid>,
    pub job_id: Option<Uuid>,
    pub file_id: Option<Uuid>,
}

/// Project activity data
#[derive(Debug, Serialize)]
pub struct ProjectActivity {
    pub activity_type: String,
    pub activity_description: String,
    pub activity_time: DateTime<chrono::Utc>,
    pub user_id: Option<Uuid>,
    pub job_id: Option<Uuid>,
    pub file_id: Option<Uuid>,
}