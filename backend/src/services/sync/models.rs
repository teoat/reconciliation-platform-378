//! Sync service data models

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Sync strategy type
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SyncStrategy {
    /// Full sync - replace all data
    Full,
    /// Incremental sync - only sync changed records
    Incremental,
    /// Merge sync - merge source and target data
    Merge,
}

impl std::fmt::Display for SyncStrategy {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SyncStrategy::Full => write!(f, "full"),
            SyncStrategy::Incremental => write!(f, "incremental"),
            SyncStrategy::Merge => write!(f, "merge"),
        }
    }
}

/// Conflict resolution strategy
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ConflictResolutionStrategy {
    /// Source data always wins
    SourceWins,
    /// Target data always wins
    TargetWins,
    /// Use timestamp to determine winner
    Timestamp,
    /// Manual resolution required
    Manual,
}

impl std::fmt::Display for ConflictResolutionStrategy {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConflictResolutionStrategy::SourceWins => write!(f, "source_wins"),
            ConflictResolutionStrategy::TargetWins => write!(f, "target_wins"),
            ConflictResolutionStrategy::Timestamp => write!(f, "timestamp"),
            ConflictResolutionStrategy::Manual => write!(f, "manual"),
        }
    }
}

/// Sync status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SyncStatus {
    Idle,
    Running,
    Paused,
    Error,
    Completed,
}

/// Change type for tracking
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ChangeType {
    Insert,
    Update,
    Delete,
}

impl std::fmt::Display for ChangeType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ChangeType::Insert => write!(f, "insert"),
            ChangeType::Update => write!(f, "update"),
            ChangeType::Delete => write!(f, "delete"),
        }
    }
}

/// Sync configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfiguration {
    pub id: Uuid,
    pub name: String,
    pub source_table: String,
    pub target_table: String,
    pub source_database_url: Option<String>,
    pub target_database_url: Option<String>,
    pub sync_strategy: SyncStrategy,
    pub conflict_resolution: ConflictResolutionStrategy,
    pub batch_size: i32,
    pub sync_interval_seconds: Option<i32>,
    pub enabled: bool,
    pub last_sync_at: Option<DateTime<Utc>>,
    pub next_sync_at: Option<DateTime<Utc>>,
    pub sync_status: SyncStatus,
    pub error_message: Option<String>,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Sync execution record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncExecution {
    pub id: Uuid,
    pub sync_configuration_id: Uuid,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub status: SyncStatus,
    pub records_processed: i64,
    pub records_inserted: i64,
    pub records_updated: i64,
    pub records_deleted: i64,
    pub records_failed: i64,
    pub duration_ms: Option<i64>,
    pub error_message: Option<String>,
    pub metadata: serde_json::Value,
}

/// Sync statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatistics {
    pub total_records: i64,
    pub inserted: i64,
    pub updated: i64,
    pub deleted: i64,
    pub failed: i64,
    pub conflicts: i64,
    pub duration_ms: i64,
    pub throughput_per_second: f64,
}

/// Sync conflict record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConflict {
    pub id: Uuid,
    pub sync_configuration_id: Uuid,
    pub sync_execution_id: Option<Uuid>,
    pub table_name: String,
    pub record_id: String,
    pub source_data: Option<serde_json::Value>,
    pub target_data: Option<serde_json::Value>,
    pub conflict_type: String,
    pub resolution: Option<String>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub resolved_by: Option<Uuid>,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

/// Sync request for API
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncRequest {
    pub sync_configuration_id: Option<Uuid>,
    pub name: Option<String>,
    pub source_table: String,
    pub target_table: String,
    pub source_database_url: Option<String>,
    pub target_database_url: Option<String>,
    pub sync_strategy: Option<SyncStrategy>,
    pub conflict_resolution: Option<ConflictResolutionStrategy>,
    pub batch_size: Option<i32>,
    pub force_full_sync: Option<bool>,
}

/// Sync response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResponse {
    pub execution_id: Uuid,
    pub sync_configuration_id: Uuid,
    pub status: SyncStatus,
    pub statistics: SyncStatistics,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

