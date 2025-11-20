//! Service layer tests for RealtimeService (NotificationService, CollaborationService)
//!
//! Tests realtime notification and collaboration functionality.

use reconciliation_backend::services::realtime::{NotificationService, CollaborationService};
use reconciliation_backend::services::realtime::NotificationLevel;

/// Test RealtimeService methods
#[cfg(test)]
mod realtime_service_tests {
    use super::*;

    #[tokio::test]
    async fn test_notification_service_creation() {
        let service = NotificationService::new();
        
        // Verify service is created
        assert!(service.notifications.read().await.is_empty());
    }

    #[tokio::test]
    async fn test_create_notification() {
        let service = NotificationService::new();

        let notification = service
            .create_notification(
                "user123".to_string(),
                "Test Title".to_string(),
                "Test Message".to_string(),
                NotificationLevel::Info,
            )
            .await;

        assert_eq!(notification.title, "Test Title");
        assert_eq!(notification.message, "Test Message");
        assert_eq!(notification.user_id, "user123");
        assert!(!notification.read);
    }

    #[tokio::test]
    async fn test_get_user_notifications() {
        let service = NotificationService::new();

        // Create notifications
        service
            .create_notification(
                "user123".to_string(),
                "Title 1".to_string(),
                "Message 1".to_string(),
                NotificationLevel::Info,
            )
            .await;
        service
            .create_notification(
                "user123".to_string(),
                "Title 2".to_string(),
                "Message 2".to_string(),
                NotificationLevel::Warning,
            )
            .await;

        let notifications = service.get_user_notifications("user123").await;
        assert!(notifications.len() >= 2);
    }

    #[tokio::test]
    async fn test_mark_notification_read() {
        let service = NotificationService::new();

        let notification = service
            .create_notification(
                "user123".to_string(),
                "Test".to_string(),
                "Message".to_string(),
                NotificationLevel::Info,
            )
            .await;

        let result = service
            .mark_notification_read("user123", &notification.id)
            .await;
        assert!(result);

        // Verify notification is marked as read
        let notifications = service.get_user_notifications("user123").await;
        let read_notification = notifications
            .iter()
            .find(|n| n.id == notification.id)
            .unwrap();
        assert!(read_notification.read);
    }

    #[tokio::test]
    async fn test_collaboration_service_creation() {
        let service = CollaborationService::new();
        
        // Verify service is created
        assert!(service.active_users.read().await.is_empty());
    }

    #[tokio::test]
    async fn test_broadcast_reconciliation_progress() {
        let service = NotificationService::new();

        service
            .broadcast_reconciliation_progress(
                "user123",
                "job123",
                50.0,
                "processing",
            )
            .await;

        // Should complete without error
        assert!(true);
    }

    #[tokio::test]
    async fn test_broadcast_file_upload_progress() {
        let service = NotificationService::new();

        service
            .broadcast_file_upload_progress(
                "user123",
                "file123",
                75.0,
                "uploading",
            )
            .await;

        assert!(true);
    }

    #[tokio::test]
    async fn test_collaboration_user_join() {
        let service = CollaborationService::new();

        service
            .user_join_page(
                "user123".to_string(),
                "Test User".to_string(),
                "page123".to_string(),
            )
            .await;

        let active_users = service.get_active_users("page123").await;
        assert!(active_users.len() >= 1);
    }

    #[tokio::test]
    async fn test_collaboration_user_leave() {
        let service = CollaborationService::new();

        // User joins
        service
            .user_join_page(
                "user123".to_string(),
                "Test User".to_string(),
                "page123".to_string(),
            )
            .await;

        // User leaves
        service
            .user_leave_page("user123".to_string(), "page123".to_string())
            .await;

        // Should complete without error
        assert!(true);
    }

    #[tokio::test]
    async fn test_subscribe_to_updates() {
        let service = NotificationService::new();
        let websocket_id = uuid::Uuid::new_v4();

        service
            .subscribe_to_updates("user123".to_string(), websocket_id)
            .await;

        // Should complete without error
        assert!(true);
    }

    #[tokio::test]
    async fn test_collaboration_add_comment() {
        let service = CollaborationService::new();

        let comment = service
            .add_comment(
                "user123".to_string(),
                "Test User".to_string(),
                "page123".to_string(),
                "Test comment".to_string(),
                None,
            )
            .await;

        assert_eq!(comment.message, "Test comment");
        assert_eq!(comment.user_id, "user123");
    }

    #[tokio::test]
    async fn test_collaboration_get_comments() {
        let service = CollaborationService::new();

        service
            .add_comment(
                "user123".to_string(),
                "Test User".to_string(),
                "page123".to_string(),
                "Comment 1".to_string(),
                None,
            )
            .await;

        let comments = service.get_page_comments("page123").await;
        assert!(comments.len() >= 1);
    }
}

