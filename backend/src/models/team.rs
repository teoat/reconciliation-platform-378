//! Team models

use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::schema::{teams, team_members};

/// Team model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = teams)]
pub struct Team {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub owner_id: Uuid,
    pub settings: serde_json::Value,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New team (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = teams)]
pub struct NewTeam {
    pub name: String,
    pub description: Option<String>,
    pub owner_id: Uuid,
    pub settings: serde_json::Value,
    pub is_active: bool,
}

/// Update team
#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = teams)]
pub struct UpdateTeam {
    pub name: Option<String>,
    pub description: Option<String>,
    pub settings: Option<serde_json::Value>,
    pub is_active: Option<bool>,
}

/// Team member model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = team_members)]
pub struct TeamMember {
    pub id: Uuid,
    pub team_id: Uuid,
    pub user_id: Uuid,
    pub role: String,
    pub permissions: serde_json::Value,
    pub joined_at: DateTime<Utc>,
    pub invited_by: Option<Uuid>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New team member (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = team_members)]
pub struct NewTeamMember {
    pub team_id: Uuid,
    pub user_id: Uuid,
    pub role: String,
    pub permissions: serde_json::Value,
    pub invited_by: Option<Uuid>,
    pub is_active: bool,
}

/// Update team member
#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = team_members)]
pub struct UpdateTeamMember {
    pub role: Option<String>,
    pub permissions: Option<serde_json::Value>,
    pub is_active: Option<bool>,
}

