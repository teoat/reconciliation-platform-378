//! Notification service module
//!
//! Handles notification creation, retrieval, and preferences management

use chrono::Utc;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::database::{transaction::with_transaction, Database};
use crate::errors::{AppError, AppResult};
use crate::models::schema::{notification_preferences, notifications};
use crate::models::{
    NewNotification, NewNotificationPreferences, Notification, NotificationPreferences,
    UpdateNotificationPreferences,
};

/// Notification service
pub struct NotificationService {
    db: Arc<Database>,
}

impl NotificationService {
    /// Create a new notification service
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    /// List notifications for a user
    pub async fn list_notifications(
        &self,
        user_id: Uuid,
        page: i64,
        per_page: i64,
        read_filter: Option<bool>,
    ) -> AppResult<(Vec<Notification>, i64)> {
        let mut conn = self.db.get_connection()?;
        let offset = (page - 1) * per_page;

        // Build query without moving
        let mut query = notifications::table
            .filter(notifications::user_id.eq(user_id))
            .into_boxed();

        if let Some(read) = read_filter {
            query = query.filter(notifications::read.eq(read));
        }

        // Clone query for count
        let count_query = query.clone();

        // Get total count
        let total: i64 = count_query
            .count()
            .get_result(&mut conn)
            .map_err(AppError::Database)?;

        // Get paginated results
        let items = query
            .order(notifications::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<Notification>(&mut conn)
            .map_err(AppError::Database)?;

        Ok((items, total))
    }

    /// Get notification by ID
    pub async fn get_notification(&self, notification_id: Uuid, user_id: Uuid) -> AppResult<Notification> {
        let mut conn = self.db.get_connection()?;

        notifications::table
            .filter(notifications::id.eq(notification_id))
            .filter(notifications::user_id.eq(user_id))
            .first::<Notification>(&mut conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => {
                    AppError::NotFound(format!("Notification {} not found", notification_id))
                }
                _ => AppError::Database(e),
            })
    }

    /// Create a new notification
    pub async fn create_notification(
        &self,
        user_id: Uuid,
        title: String,
        message: String,
        notification_type: String,
        metadata: Option<serde_json::Value>,
    ) -> AppResult<Notification> {
        let new_notification = NewNotification {
            user_id,
            title,
            message,
            notification_type,
            read: false,
            read_at: None,
            metadata,
        };

        let mut conn = self.db.get_connection()?;

        diesel::insert_into(notifications::table)
            .values(&new_notification)
            .get_result::<Notification>(&mut conn)
            .map_err(AppError::Database)
    }

    /// Mark notification as read
    pub async fn mark_as_read(&self, notification_id: Uuid, user_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        let now = Utc::now();

        diesel::update(
            notifications::table
                .filter(notifications::id.eq(notification_id))
                .filter(notifications::user_id.eq(user_id)),
        )
        .set((
            notifications::read.eq(true),
            notifications::read_at.eq(Some(now)),
        ))
        .execute(&mut conn)
        .map_err(AppError::Database)?;

        Ok(())
    }

    /// Mark notification as unread
    pub async fn mark_as_unread(&self, notification_id: Uuid, user_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;

        diesel::update(
            notifications::table
                .filter(notifications::id.eq(notification_id))
                .filter(notifications::user_id.eq(user_id)),
        )
        .set((
            notifications::read.eq(false),
            notifications::read_at.eq(None::<chrono::DateTime<chrono::Utc>>),
        ))
        .execute(&mut conn)
        .map_err(AppError::Database)?;

        Ok(())
    }

    /// Delete notification
    pub async fn delete_notification(&self, notification_id: Uuid, user_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;

        diesel::delete(
            notifications::table
                .filter(notifications::id.eq(notification_id))
                .filter(notifications::user_id.eq(user_id)),
        )
        .execute(&mut conn)
        .map_err(AppError::Database)?;

        Ok(())
    }

    /// Bulk mark as read
    pub async fn bulk_mark_as_read(&self, user_id: Uuid, notification_ids: &[Uuid]) -> AppResult<usize> {
        let mut conn = self.db.get_connection()?;
        let now = Utc::now();

        let count = diesel::update(
            notifications::table
                .filter(notifications::user_id.eq(user_id))
                .filter(notifications::id.eq_any(notification_ids)),
        )
        .set((
            notifications::read.eq(true),
            notifications::read_at.eq(Some(now)),
        ))
        .execute(&mut conn)
        .map_err(AppError::Database)?;

        Ok(count)
    }

    /// Bulk delete notifications
    pub async fn bulk_delete(&self, user_id: Uuid, notification_ids: &[Uuid]) -> AppResult<usize> {
        let mut conn = self.db.get_connection()?;

        let count = diesel::delete(
            notifications::table
                .filter(notifications::user_id.eq(user_id))
                .filter(notifications::id.eq_any(notification_ids)),
        )
        .execute(&mut conn)
        .map_err(AppError::Database)?;

        Ok(count)
    }

    /// Get notification preferences
    pub async fn get_preferences(&self, user_id: Uuid) -> AppResult<NotificationPreferences> {
        let mut conn = self.db.get_connection()?;

        notification_preferences::table
            .filter(notification_preferences::user_id.eq(user_id))
            .first::<NotificationPreferences>(&mut conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => {
                    // Create default preferences if not found
                    self.create_default_preferences(user_id).await
                }
                _ => Err(AppError::Database(e)),
            })
    }

    /// Create default preferences
    async fn create_default_preferences(&self, user_id: Uuid) -> AppResult<NotificationPreferences> {
        let new_prefs = NewNotificationPreferences {
            user_id,
            email: true,
            push: true,
            reconciliation_complete: true,
            job_failed: true,
            project_updated: false,
        };

        let mut conn = self.db.get_connection()?;

        // Use async transaction if available, or regular for now
        diesel::insert_into(notification_preferences::table)
            .values(&new_prefs)
            .get_result::<NotificationPreferences>(&mut conn)
            .map_err(AppError::Database)
    }

    /// Update notification preferences
    pub async fn update_preferences(
        &self,
        user_id: Uuid,
        update: UpdateNotificationPreferences,
    ) -> AppResult<NotificationPreferences> {
        let mut conn = self.db.get_connection()?;

        // Ensure preferences exist
        let _ = self.get_preferences(user_id).await?;

        diesel::update(
            notification_preferences::table.filter(notification_preferences::user_id.eq(user_id)),
        )
        .set(&update)
        .get_result::<NotificationPreferences>(&mut conn)
        .map_err(AppError::Database)
    }
}

