//! Database models for the Reconciliation Backend
//! 
//! This module contains Diesel model definitions and database operations.

pub mod schema;

use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use diesel::sql_types::{Jsonb, Numeric};
use bigdecimal::BigDecimal;
use uuid::Uuid;
use chrono::{DateTime, Utc};

use crate::models::schema::*;

// Diesel-compatible types
pub type JsonValue = serde_json::Value;
pub type NumericValue = BigDecimal;

/// Match type enumeration
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum MatchType {
    Exact,
    Fuzzy,
    Manual,
    Auto,
}

impl std::str::FromStr for MatchType {
    type Err = String;
    
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "exact" => Ok(MatchType::Exact),
            "fuzzy" => Ok(MatchType::Fuzzy),
            "manual" => Ok(MatchType::Manual),
            "auto" => Ok(MatchType::Auto),
            _ => Err(format!("Invalid match type: {}", s)),
        }
    }
}

impl std::fmt::Display for MatchType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MatchType::Exact => write!(f, "exact"),
            MatchType::Fuzzy => write!(f, "fuzzy"),
            MatchType::Manual => write!(f, "manual"),
            MatchType::Auto => write!(f, "auto"),
        }
    }
}

/// Project status enumeration
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ProjectStatus {
    Active,
    Inactive,
    Archived,
    Draft,
}

impl std::str::FromStr for ProjectStatus {
    type Err = String;
    
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "active" => Ok(ProjectStatus::Active),
            "inactive" => Ok(ProjectStatus::Inactive),
            "archived" => Ok(ProjectStatus::Archived),
            "draft" => Ok(ProjectStatus::Draft),
            _ => Err(format!("Invalid project status: {}", s)),
        }
    }
}

impl std::fmt::Display for ProjectStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ProjectStatus::Active => write!(f, "active"),
            ProjectStatus::Inactive => write!(f, "inactive"),
            ProjectStatus::Archived => write!(f, "archived"),
            ProjectStatus::Draft => write!(f, "draft"),
        }
    }
}

/// User role enumeration
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum UserRole {
    Admin,
    User,
    Viewer,
    Manager,
}

impl std::str::FromStr for UserRole {
    type Err = String;
    
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "admin" => Ok(UserRole::Admin),
            "user" => Ok(UserRole::User),
            "viewer" => Ok(UserRole::Viewer),
            "manager" => Ok(UserRole::Manager),
            _ => Err(format!("Invalid role: {}", s)),
        }
    }
}

impl std::fmt::Display for UserRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            UserRole::Admin => write!(f, "admin"),
            UserRole::User => write!(f, "user"),
            UserRole::Viewer => write!(f, "viewer"),
            UserRole::Manager => write!(f, "manager"),
        }
    }
}

/// User model
#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = users)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub first_name: String,
    pub last_name: String,
    pub role: String,
    pub is_active: bool,
    pub last_login: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New user model for inserts
#[derive(Insertable, Deserialize)]
#[diesel(table_name = users)]
pub struct NewUser {
    pub email: String,
    pub password_hash: String,
    pub first_name: String,
    pub last_name: String,
    pub role: String,
}

/// Update user model for updates
#[derive(AsChangeset, Deserialize)]
#[diesel(table_name = users)]
pub struct UpdateUser {
    pub email: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub role: Option<String>,
    pub is_active: Option<bool>,
    pub last_login: Option<DateTime<Utc>>,
}

/// Project model
#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = projects)]
pub struct Project {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub owner_id: Uuid,
    pub settings: Option<serde_json::Value>,
    pub status: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New project model for inserts
#[derive(Insertable, Deserialize)]
#[diesel(table_name = projects)]
pub struct NewProject {
    pub name: String,
    pub description: Option<String>,
    pub owner_id: Uuid,
    pub settings: Option<serde_json::Value>,
    pub status: String,
}

/// Reconciliation record model
#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = reconciliation_records)]
pub struct ReconciliationRecord {
    pub id: Uuid,
    pub project_id: Uuid,
    pub source_system: String,
    pub external_id: String,
    pub amount: Option<BigDecimal>,
    pub currency: Option<String>,
    pub transaction_date: Option<DateTime<Utc>>,
    pub description: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New reconciliation record model for inserts
#[derive(Insertable, Deserialize)]
#[diesel(table_name = reconciliation_records)]
pub struct NewReconciliationRecord {
    pub project_id: Uuid,
    pub source_system: String,
    pub external_id: String,
    pub amount: Option<BigDecimal>,
    pub currency: Option<String>,
    pub transaction_date: Option<DateTime<Utc>>,
    pub description: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

/// Reconciliation match model
#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = reconciliation_matches)]
pub struct ReconciliationMatch {
    pub id: Uuid,
    pub project_id: Uuid,
    pub record_a_id: Uuid,
    pub record_b_id: Uuid,
    pub match_type: String,
    pub confidence_score: Option<f64>,
    pub status: String,
    pub notes: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New reconciliation match model for inserts
#[derive(Insertable, Deserialize)]
#[diesel(table_name = reconciliation_matches)]
pub struct NewReconciliationMatch {
    pub project_id: Uuid,
    pub record_a_id: Uuid,
    pub record_b_id: Uuid,
    pub match_type: String,
    pub confidence_score: Option<f64>,
    pub notes: Option<String>,
    pub created_by: Option<Uuid>,
}

/// Reconciliation job model
#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = reconciliation_jobs)]
pub struct ReconciliationJob {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub source_a_id: Uuid,
    pub source_b_id: Uuid,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub settings: Option<String>,
    pub confidence_threshold: Option<f64>,
    pub progress: Option<i32>,
    pub total_records: Option<i32>,
    pub processed_records: Option<i32>,
    pub matched_records: Option<i32>,
    pub unmatched_records: Option<i32>,
}

/// New reconciliation job model for inserts
#[derive(Insertable, Deserialize)]
#[diesel(table_name = reconciliation_jobs)]
pub struct NewReconciliationJob {
    pub project_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub source_a_id: Uuid,
    pub source_b_id: Uuid,
    pub created_by: Uuid,
    pub settings: Option<String>,
    pub confidence_threshold: Option<f64>,
}

/// Update reconciliation job model for updates
#[derive(AsChangeset, Deserialize)]
#[diesel(table_name = reconciliation_jobs)]
pub struct UpdateReconciliationJob {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub source_a_id: Option<Uuid>,
    pub source_b_id: Option<Uuid>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub progress: Option<i32>,
    pub total_records: Option<i32>,
    pub processed_records: Option<i32>,
    pub matched_records: Option<i32>,
    pub unmatched_records: Option<i32>,
}

/// Data source model
#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = data_sources)]
pub struct DataSource {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub source_type: String,
    pub connection_config: Option<serde_json::Value>,
    pub file_path: Option<String>,
    pub file_size: Option<i64>,
    pub file_hash: Option<String>,
    pub record_count: Option<i32>,
    pub schema: Option<serde_json::Value>,
    pub status: String,
    pub uploaded_at: Option<DateTime<Utc>>,
    pub processed_at: Option<DateTime<Utc>>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New data source model for inserts
#[derive(Insertable, Deserialize)]
#[diesel(table_name = data_sources)]
pub struct NewDataSource {
    pub project_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub source_type: String,
    pub connection_config: Option<serde_json::Value>,
    pub file_path: Option<String>,
    pub file_size: Option<i64>,
    pub file_hash: Option<String>,
    pub record_count: Option<i32>,
    pub schema: Option<serde_json::Value>,
    pub status: String,
    pub uploaded_at: Option<DateTime<Utc>>,
    pub processed_at: Option<DateTime<Utc>>,
    pub is_active: bool,
}

/// Update data source model for updates
#[derive(AsChangeset, Deserialize)]
#[diesel(table_name = data_sources)]
pub struct UpdateDataSource {
    pub name: Option<String>,
    pub description: Option<String>,
    pub source_type: Option<String>,
    pub connection_config: Option<serde_json::Value>,
    pub file_path: Option<String>,
    pub file_size: Option<i64>,
    pub file_hash: Option<String>,
    pub record_count: Option<i32>,
    pub schema: Option<serde_json::Value>,
    pub status: Option<String>,
    pub uploaded_at: Option<DateTime<Utc>>,
    pub processed_at: Option<DateTime<Utc>>,
    pub is_active: Option<bool>,
}

/// Reconciliation result model
#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = reconciliation_results)]
pub struct ReconciliationResult {
    pub id: Uuid,
    pub job_id: Uuid,
    pub record_a_id: Uuid,
    pub record_b_id: Option<Uuid>,
    pub match_type: String,
    pub confidence_score: Option<f64>,
    pub status: String,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New reconciliation result model for inserts
#[derive(Insertable, Deserialize)]
#[diesel(table_name = reconciliation_results)]
pub struct NewReconciliationResult {
    pub job_id: Uuid,
    pub record_a_id: Uuid,
    pub record_b_id: Option<Uuid>,
    pub match_type: String,
    pub confidence_score: Option<f64>,
    pub status: String,
    pub notes: Option<String>,
}

/// Audit log model
#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = audit_logs)]
pub struct AuditLog {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub action: String,
    pub resource_type: String,
    pub resource_id: Option<Uuid>,
    pub old_values: Option<serde_json::Value>,
    pub new_values: Option<serde_json::Value>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// New audit log model for inserts
#[derive(Insertable, Deserialize)]
#[diesel(table_name = audit_logs)]
pub struct NewAuditLog {
    pub user_id: Option<Uuid>,
    pub action: String,
    pub resource_type: String,
    pub resource_id: Option<Uuid>,
    pub old_values: Option<serde_json::Value>,
    pub new_values: Option<serde_json::Value>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
}

/// Uploaded file model
#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = uploaded_files)]
pub struct UploadedFile {
    pub id: Uuid,
    pub project_id: Uuid,
    pub filename: String,
    pub original_filename: String,
    pub file_size: i64,
    pub content_type: String,
    pub file_path: String,
    pub status: String,
    pub uploaded_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New uploaded file model for inserts
#[derive(Insertable, Deserialize)]
#[diesel(table_name = uploaded_files)]
pub struct NewUploadedFile {
    pub project_id: Uuid,
    pub filename: String,
    pub original_filename: String,
    pub file_size: i64,
    pub content_type: String,
    pub file_path: String,
    pub status: String,
    pub uploaded_by: Uuid,
}

// Response DTOs
/// User response DTO
#[derive(Serialize, Deserialize, Debug)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub role: String,
    pub is_active: bool,
    pub last_login: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        UserResponse {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            is_active: user.is_active,
            last_login: user.last_login,
            created_at: user.created_at,
        }
    }
}

/// Update project model for updates
#[derive(AsChangeset, Deserialize)]
#[diesel(table_name = projects)]
pub struct UpdateProject {
    pub name: Option<String>,
    pub description: Option<String>,
    pub settings: Option<serde_json::Value>,
    pub status: Option<String>,
    pub is_active: Option<bool>,
}

/// Project response DTO
#[derive(Serialize, Deserialize, Debug)]
pub struct ProjectResponse {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub owner_id: Uuid,
    pub settings: Option<serde_json::Value>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

impl From<Project> for ProjectResponse {
    fn from(project: Project) -> Self {
        ProjectResponse {
            id: project.id,
            name: project.name,
            description: project.description,
            owner_id: project.owner_id,
            settings: project.settings,
            is_active: project.is_active,
            created_at: project.created_at,
        }
    }
}