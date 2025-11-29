//! Visualization models

use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::schema::{charts, dashboards, reports};

/// Chart model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = charts)]
pub struct Chart {
    pub id: Uuid,
    pub project_id: Option<Uuid>,
    pub name: String,
    pub chart_type: String,
    pub data_source: serde_json::Value,
    pub configuration: serde_json::Value,
    pub is_public: bool,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New chart (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = charts)]
pub struct NewChart {
    pub project_id: Option<Uuid>,
    pub name: String,
    pub chart_type: String,
    pub data_source: serde_json::Value,
    pub configuration: serde_json::Value,
    pub is_public: bool,
    pub created_by: Uuid,
}

/// Update chart
#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = charts)]
pub struct UpdateChart {
    pub name: Option<String>,
    pub data_source: Option<serde_json::Value>,
    pub configuration: Option<serde_json::Value>,
    pub is_public: Option<bool>,
}

/// Dashboard model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = dashboards)]
pub struct Dashboard {
    pub id: Uuid,
    pub project_id: Option<Uuid>,
    pub name: String,
    pub description: Option<String>,
    pub layout: serde_json::Value,
    pub widgets: serde_json::Value,
    pub is_default: bool,
    pub is_public: bool,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New dashboard (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = dashboards)]
pub struct NewDashboard {
    pub project_id: Option<Uuid>,
    pub name: String,
    pub description: Option<String>,
    pub layout: serde_json::Value,
    pub widgets: serde_json::Value,
    pub is_default: bool,
    pub is_public: bool,
    pub created_by: Uuid,
}

/// Update dashboard
#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = dashboards)]
pub struct UpdateDashboard {
    pub name: Option<String>,
    pub description: Option<String>,
    pub layout: Option<serde_json::Value>,
    pub widgets: Option<serde_json::Value>,
    pub is_default: Option<bool>,
    pub is_public: Option<bool>,
}

/// Report model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = reports)]
pub struct Report {
    pub id: Uuid,
    pub project_id: Option<Uuid>,
    pub name: String,
    pub description: Option<String>,
    pub report_type: String,
    pub template: serde_json::Value,
    pub schedule: Option<serde_json::Value>,
    pub last_generated_at: Option<DateTime<Utc>>,
    pub status: String,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New report (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = reports)]
pub struct NewReport {
    pub project_id: Option<Uuid>,
    pub name: String,
    pub description: Option<String>,
    pub report_type: String,
    pub template: serde_json::Value,
    pub schedule: Option<serde_json::Value>,
    pub status: String,
    pub created_by: Uuid,
}

/// Update report
#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = reports)]
pub struct UpdateReport {
    pub name: Option<String>,
    pub description: Option<String>,
    pub template: Option<serde_json::Value>,
    pub schedule: Option<Option<serde_json::Value>>,
    pub status: Option<String>,
}

