//! API versioning types and data structures

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// API version information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiVersion {
    pub version: String,
    pub release_date: DateTime<Utc>,
    pub status: VersionStatus,
    pub deprecation_date: Option<DateTime<Utc>>,
    pub sunset_date: Option<DateTime<Utc>>,
    pub changelog: Vec<VersionChange>,
    pub breaking_changes: Vec<BreakingChange>,
    pub migration_guide: Option<String>,
}

/// Version status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VersionStatus {
    Development,
    Beta,
    Stable,
    Deprecated,
    Sunset,
}

/// Version change
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionChange {
    pub change_type: ChangeType,
    pub description: String,
    pub affected_endpoints: Vec<String>,
    pub severity: ChangeSeverity,
}

/// Change types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChangeType {
    Added,
    Changed,
    Deprecated,
    Removed,
    Fixed,
    Security,
}

/// Change severity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChangeSeverity {
    Low,
    Medium,
    High,
    Critical,
}

/// Breaking change
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BreakingChange {
    pub endpoint: String,
    pub change_description: String,
    pub migration_steps: Vec<String>,
    pub affected_fields: Vec<String>,
    pub alternative_endpoint: Option<String>,
}

/// API endpoint version mapping
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EndpointVersion {
    pub endpoint: String,
    pub method: String,
    pub versions: Vec<String>,
    pub default_version: String,
    pub deprecated_versions: Vec<String>,
}

/// Client version compatibility
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientCompatibility {
    pub client_version: String,
    pub api_version: String,
    pub is_compatible: bool,
    pub compatibility_issues: Vec<CompatibilityIssue>,
    pub recommended_action: RecommendedAction,
}

/// Compatibility issue
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompatibilityIssue {
    pub issue_type: CompatibilityIssueType,
    pub description: String,
    pub severity: ChangeSeverity,
    pub affected_endpoints: Vec<String>,
}

/// Compatibility issue types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CompatibilityIssueType {
    DeprecatedEndpoint,
    RemovedEndpoint,
    ChangedRequestFormat,
    ChangedResponseFormat,
    ChangedAuthentication,
    ChangedPermissions,
}

/// Recommended actions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecommendedAction {
    UpdateClient,
    UseAlternativeEndpoint,
    MigrateData,
    ContactSupport,
    NoActionRequired,
}

/// Version migration strategy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationStrategy {
    pub from_version: String,
    pub to_version: String,
    pub migration_steps: Vec<MigrationStep>,
    pub estimated_duration: String,
    pub rollback_plan: Option<String>,
}

/// Migration step
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationStep {
    pub step_number: u32,
    pub description: String,
    pub commands: Vec<String>,
    pub validation_checks: Vec<String>,
    pub rollback_commands: Option<Vec<String>>,
}

/// Version statistics
#[derive(Debug, Clone, Default)]
pub struct VersionStats {
    pub total_versions: u32,
    pub active_versions: u32,
    pub deprecated_versions: u32,
    pub sunset_versions: u32,
    pub total_endpoints: u32,
    pub breaking_changes_count: u32,
}

