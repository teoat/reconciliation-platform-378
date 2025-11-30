use crate::models::schema::security_policies;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Insertable)]
#[diesel(table_name = security_policies)]
pub struct SecurityPolicy {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub category: String,
    pub is_active: bool,
    pub rules: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSecurityPolicy {
    pub name: String,
    pub description: String,
    pub category: String,
    pub rules: Vec<SecurityRule>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SecurityRule {
    pub id: String,
    pub name: String,
    pub description: String,
    pub r#type: String, // 'type' is a reserved keyword
    pub conditions: Vec<String>,
    pub actions: Vec<String>,
}
