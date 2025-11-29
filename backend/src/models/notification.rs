//! Notification models

use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::schema::{notifications, notification_preferences};

/// Notification model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = notifications)]
pub struct Notification {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub message: String,
    pub notification_type: String,
    pub read: bool,
    pub read_at: Option<DateTime<Utc>>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New notification (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = notifications)]
pub struct NewNotification {
    pub user_id: Uuid,
    pub title: String,
    pub message: String,
    pub notification_type: String,
    pub read: bool,
    pub read_at: Option<DateTime<Utc>>,
    pub metadata: Option<serde_json::Value>,
}

/// Notification preferences model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = notification_preferences)]
pub struct NotificationPreferences {
    pub id: Uuid,
    pub user_id: Uuid,
    pub email: bool,
    pub push: bool,
    pub reconciliation_complete: bool,
    pub job_failed: bool,
    pub project_updated: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New notification preferences (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = notification_preferences)]
pub struct NewNotificationPreferences {
    pub user_id: Uuid,
    pub email: bool,
    pub push: bool,
    pub reconciliation_complete: bool,
    pub job_failed: bool,
    pub project_updated: bool,
}

/// Update notification preferences
#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = notification_preferences)]
pub struct UpdateNotificationPreferences {
    pub email: Option<bool>,
    pub push: Option<bool>,
    pub reconciliation_complete: Option<bool>,
    pub job_failed: Option<bool>,
    pub project_updated: Option<bool>,
}

