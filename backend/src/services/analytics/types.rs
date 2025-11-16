//! Analytics types and data structures

use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
// Using serde_json::Value directly


/// Dashboard data
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardData {
    pub total_users: i64,
    pub total_projects: i64,
    pub total_reconciliation_jobs: i64,
    pub total_data_sources: i64,
    pub active_jobs: i64,
    pub completed_jobs: i64,
    pub failed_jobs: i64,
    pub total_matches: i64,
    pub total_unmatched: i64,
    pub recent_activity: Vec<ActivityItem>,
    pub performance_metrics: PerformanceMetrics,
}

/// Activity item query result
#[derive(Debug, Serialize, Deserialize, Clone, diesel::Queryable)]
pub struct ActivityItemQueryResult {
    pub id: Uuid,
    pub action: String,
    pub resource_type: String,
    pub user_email: Option<String>,
    pub created_at: DateTime<Utc>,
    pub old_values: Option<serde_json::Value>,
}

/// Activity item
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ActivityItem {
    pub id: Uuid,
    pub action: String,
    pub resource_type: String,
    pub user_email: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub details: Option<serde_json::Value>,
}

/// Performance metrics
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PerformanceMetrics {
    pub average_processing_time_ms: f64,
    pub total_processing_time_ms: i64,
    pub average_confidence_score: f64,
    pub match_rate: f64,
    pub throughput_per_hour: f64,
}

/// Project statistics
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectStats {
    pub project_id: Uuid,
    pub project_name: String,
    pub total_jobs: i64,
    pub completed_jobs: i64,
    pub failed_jobs: i64,
    pub total_data_sources: i64,
    pub total_matches: i64,
    pub total_unmatched: i64,
    pub average_confidence_score: f64,
    pub last_activity: Option<DateTime<Utc>>,
}

/// User activity statistics
#[derive(Debug, Serialize)]
pub struct UserActivityStats {
    pub user_id: Uuid,
    pub user_email: String,
    pub total_actions: i64,
    pub projects_created: i64,
    pub jobs_created: i64,
    pub files_uploaded: i64,
    pub last_activity: Option<DateTime<Utc>>,
    pub activity_by_day: Vec<DailyActivity>,
}

/// Daily activity
#[derive(Debug, Serialize)]
pub struct DailyActivity {
    pub date: String,
    pub actions: i64,
}

/// Reconciliation statistics
#[derive(Debug, Serialize)]
pub struct ReconciliationStats {
    pub total_jobs: i64,
    pub completed_jobs: i64,
    pub failed_jobs: i64,
    pub pending_jobs: i64,
    pub running_jobs: i64,
    pub total_records_processed: i64,
    pub total_matches: i64,
    pub total_unmatched: i64,
    pub average_confidence_score: f64,
    pub average_processing_time_ms: f64,
    pub jobs_by_status: Vec<StatusCount>,
    pub jobs_by_month: Vec<MonthlyJobCount>,
}

/// Status count
#[derive(Debug, Serialize)]
pub struct StatusCount {
    pub status: String,
    pub count: i64,
}

/// Monthly job count
#[derive(Debug, Serialize)]
pub struct MonthlyJobCount {
    pub month: String,
    pub count: i64,
}


