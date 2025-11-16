// Real-time Notification Service
// This service handles real-time notifications and updates

use chrono::Utc;
use log::info;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Notification {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub message: String,
    pub level: NotificationLevel,
    pub read: bool,
    pub created_at: String,
    pub expires_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NotificationLevel {
    Info,
    Warning,
    Error,
    Success,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RealtimeUpdate {
    pub id: String,
    pub user_id: String,
    pub update_type: UpdateType,
    pub data: serde_json::Value,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UpdateType {
    ReconciliationProgress,
    FileUploadProgress,
    SystemAlert,
    UserActivity,
    DataChange,
}

// Notification service actor
pub struct NotificationService {
    pub notifications: Arc<RwLock<HashMap<String, Vec<Notification>>>>,
    pub subscribers: Arc<RwLock<HashMap<String, Vec<Uuid>>>>,
}

impl NotificationService {
    pub fn new() -> Self {
        Self {
            notifications: Arc::new(RwLock::new(HashMap::new())),
            subscribers: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn create_notification(
        &self,
        user_id: String,
        title: String,
        message: String,
        level: NotificationLevel,
    ) -> Notification {
        let notification = Notification {
            id: Uuid::new_v4().to_string(),
            user_id: user_id.clone(),
            title,
            message,
            level,
            read: false,
            created_at: Utc::now().to_rfc3339(),
            expires_at: None,
        };

        let mut notifications = self.notifications.write().await;
        notifications
            .entry(user_id)
            .or_insert_with(Vec::new)
            .push(notification.clone());

        notification
    }

    pub async fn get_user_notifications(&self, user_id: &str) -> Vec<Notification> {
        let notifications = self.notifications.read().await;
        notifications.get(user_id).cloned().unwrap_or_default()
    }

    pub async fn mark_notification_read(&self, user_id: &str, notification_id: &str) -> bool {
        let mut notifications = self.notifications.write().await;
        if let Some(user_notifications) = notifications.get_mut(user_id) {
            if let Some(notification) = user_notifications
                .iter_mut()
                .find(|n| n.id == notification_id)
            {
                notification.read = true;
                return true;
            }
        }
        false
    }

    pub async fn subscribe_to_updates(&self, user_id: String, websocket_id: Uuid) {
        let mut subscribers = self.subscribers.write().await;
        subscribers
            .entry(user_id)
            .or_insert_with(Vec::new)
            .push(websocket_id);
    }

    pub async fn unsubscribe_from_updates(&self, user_id: &str, websocket_id: Uuid) {
        let mut subscribers = self.subscribers.write().await;
        if let Some(user_subscribers) = subscribers.get_mut(user_id) {
            user_subscribers.retain(|&id| id != websocket_id);
        }
    }

    pub async fn broadcast_update(&self, user_id: &str, _update: RealtimeUpdate) {
        let subscribers = self.subscribers.read().await;
        if let Some(user_subscribers) = subscribers.get(user_id) {
            for &websocket_id in user_subscribers {
                // Send update to WebSocket
                // This would integrate with the WebSocket service
                info!("Broadcasting update to WebSocket: {}", websocket_id);
            }
        }
    }

    pub async fn broadcast_reconciliation_progress(
        &self,
        user_id: &str,
        job_id: &str,
        progress: f32,
        status: &str,
    ) {
        let update = RealtimeUpdate {
            id: Uuid::new_v4().to_string(),
            user_id: user_id.to_string(),
            update_type: UpdateType::ReconciliationProgress,
            data: serde_json::json!({
                "job_id": job_id,
                "progress": progress,
                "status": status,
            }),
            timestamp: Utc::now().to_rfc3339(),
        };

        self.broadcast_update(user_id, update).await;
    }

    pub async fn broadcast_file_upload_progress(
        &self,
        user_id: &str,
        file_id: &str,
        progress: f32,
        status: &str,
    ) {
        let update = RealtimeUpdate {
            id: Uuid::new_v4().to_string(),
            user_id: user_id.to_string(),
            update_type: UpdateType::FileUploadProgress,
            data: serde_json::json!({
                "file_id": file_id,
                "progress": progress,
                "status": status,
            }),
            timestamp: Utc::now().to_rfc3339(),
        };

        self.broadcast_update(user_id, update).await;
    }

    pub async fn broadcast_system_alert(
        &self,
        user_id: &str,
        title: &str,
        message: &str,
        level: NotificationLevel,
    ) {
        let notification = self
            .create_notification(
                user_id.to_string(),
                title.to_string(),
                message.to_string(),
                level,
            )
            .await;

        let update = RealtimeUpdate {
            id: Uuid::new_v4().to_string(),
            user_id: user_id.to_string(),
            update_type: UpdateType::SystemAlert,
            data: serde_json::to_value(notification).unwrap_or(serde_json::Value::Null),
            timestamp: Utc::now().to_rfc3339(),
        };

        self.broadcast_update(user_id, update).await;
    }
}

impl Default for NotificationService {
    fn default() -> Self {
        Self::new()
    }
}

// Real-time collaboration service
pub struct CollaborationService {
    pub active_users: Arc<RwLock<HashMap<String, Vec<ActiveUser>>>>,
    pub comments: Arc<RwLock<HashMap<String, Vec<Comment>>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveUser {
    pub user_id: String,
    pub username: String,
    pub page: String,
    pub last_seen: String,
    pub cursor_position: Option<CursorPosition>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CursorPosition {
    pub x: f32,
    pub y: f32,
    pub element: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comment {
    pub id: String,
    pub user_id: String,
    pub username: String,
    pub page: String,
    pub message: String,
    pub position: Option<CursorPosition>,
    pub created_at: String,
    pub updated_at: Option<String>,
}

impl CollaborationService {
    pub fn new() -> Self {
        Self {
            active_users: Arc::new(RwLock::new(HashMap::new())),
            comments: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn user_join_page(&self, user_id: String, username: String, page: String) {
        let active_user = ActiveUser {
            user_id: user_id.clone(),
            username,
            page: page.clone(),
            last_seen: Utc::now().to_rfc3339(),
            cursor_position: None,
        };

        let mut active_users = self.active_users.write().await;
        active_users
            .entry(page)
            .or_insert_with(Vec::new)
            .push(active_user);
    }

    pub async fn user_leave_page(&self, user_id: String, page: String) {
        let mut active_users = self.active_users.write().await;
        if let Some(page_users) = active_users.get_mut(&page) {
            page_users.retain(|user| user.user_id != user_id);
        }
    }

    pub async fn update_cursor_position(
        &self,
        user_id: String,
        page: String,
        position: CursorPosition,
    ) {
        let mut active_users = self.active_users.write().await;
        if let Some(page_users) = active_users.get_mut(&page) {
            if let Some(user) = page_users.iter_mut().find(|u| u.user_id == user_id) {
                user.cursor_position = Some(position);
                user.last_seen = Utc::now().to_rfc3339();
            }
        }
    }

    pub async fn add_comment(
        &self,
        user_id: String,
        username: String,
        page: String,
        message: String,
        position: Option<CursorPosition>,
    ) -> Comment {
        let comment = Comment {
            id: Uuid::new_v4().to_string(),
            user_id,
            username,
            page: page.clone(),
            message,
            position,
            created_at: Utc::now().to_rfc3339(),
            updated_at: None,
        };

        let mut comments = self.comments.write().await;
        comments
            .entry(page)
            .or_insert_with(Vec::new)
            .push(comment.clone());

        comment
    }

    pub async fn get_page_comments(&self, page: &str) -> Vec<Comment> {
        let comments = self.comments.read().await;
        comments.get(page).cloned().unwrap_or_default()
    }

    pub async fn get_active_users(&self, page: &str) -> Vec<ActiveUser> {
        let active_users = self.active_users.read().await;
        active_users.get(page).cloned().unwrap_or_default()
    }
}

impl Default for CollaborationService {
    fn default() -> Self {
        Self::new()
    }
}
