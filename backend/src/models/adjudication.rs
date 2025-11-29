//! Adjudication models

use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::schema::{adjudication_cases, adjudication_decisions, adjudication_workflows};

/// Adjudication case model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = adjudication_cases)]
pub struct AdjudicationCase {
    pub id: Uuid,
    pub project_id: Uuid,
    pub case_number: String,
    pub title: String,
    pub description: Option<String>,
    pub case_type: String,
    pub status: String,
    pub priority: String,
    pub assigned_to: Option<Uuid>,
    pub assigned_at: Option<DateTime<Utc>>,
    pub resolved_by: Option<Uuid>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub resolution_notes: Option<String>,
    pub metadata: serde_json::Value,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New adjudication case (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = adjudication_cases)]
pub struct NewAdjudicationCase {
    pub project_id: Uuid,
    pub case_number: String,
    pub title: String,
    pub description: Option<String>,
    pub case_type: String,
    pub status: String,
    pub priority: String,
    pub metadata: serde_json::Value,
    pub created_by: Uuid,
}

/// Update adjudication case
#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = adjudication_cases)]
pub struct UpdateAdjudicationCase {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub assigned_to: Option<Option<Uuid>>,
    pub assigned_at: Option<Option<DateTime<Utc>>>,
    pub resolved_by: Option<Option<Uuid>>,
    pub resolved_at: Option<Option<DateTime<Utc>>>,
    pub resolution_notes: Option<String>,
}

/// Adjudication decision model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = adjudication_decisions)]
pub struct AdjudicationDecision {
    pub id: Uuid,
    pub case_id: Uuid,
    pub decision_type: String,
    pub decision_text: String,
    pub status: String,
    pub appealed: bool,
    pub appeal_reason: Option<String>,
    pub appealed_at: Option<DateTime<Utc>>,
    pub decided_by: Uuid,
    pub decided_at: DateTime<Utc>,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New adjudication decision (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = adjudication_decisions)]
pub struct NewAdjudicationDecision {
    pub case_id: Uuid,
    pub decision_type: String,
    pub decision_text: String,
    pub status: String,
    pub decided_by: Uuid,
    pub metadata: serde_json::Value,
}

/// Update adjudication decision
#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = adjudication_decisions)]
pub struct UpdateAdjudicationDecision {
    pub status: Option<String>,
    pub appealed: Option<bool>,
    pub appeal_reason: Option<String>,
    pub appealed_at: Option<Option<DateTime<Utc>>>,
}

/// Adjudication workflow model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = adjudication_workflows)]
pub struct AdjudicationWorkflow {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub project_id: Option<Uuid>,
    pub definition: serde_json::Value,
    pub is_active: bool,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New adjudication workflow (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = adjudication_workflows)]
pub struct NewAdjudicationWorkflow {
    pub name: String,
    pub description: Option<String>,
    pub project_id: Option<Uuid>,
    pub definition: serde_json::Value,
    pub is_active: bool,
    pub created_by: Uuid,
}

/// Update adjudication workflow
#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = adjudication_workflows)]
pub struct UpdateAdjudicationWorkflow {
    pub name: Option<String>,
    pub description: Option<String>,
    pub definition: Option<serde_json::Value>,
    pub is_active: Option<bool>,
}

