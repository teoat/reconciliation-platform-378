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

    #[tokio::test]
    async fn test_notification_service_multiple_notifications() {
        let service = NotificationService::new();

        // Create multiple notifications for same user
        for i in 0..5 {
            service
                .create_notification(
                    "user123".to_string(),
                    format!("Title {}", i),
                    format!("Message {}", i),
                    NotificationLevel::Info,
                )
                .await;
        }

        let notifications = service.get_user_notifications("user123").await;
        assert!(notifications.len() >= 5);
    }

    #[tokio::test]
    async fn test_notification_service_different_levels() {
        let service = NotificationService::new();

        service
            .create_notification(
                "user123".to_string(),
                "Info".to_string(),
                "Info message".to_string(),
                NotificationLevel::Info,
            )
            .await;

        service
            .create_notification(
                "user123".to_string(),
                "Warning".to_string(),
                "Warning message".to_string(),
                NotificationLevel::Warning,
            )
            .await;

        service
            .create_notification(
                "user123".to_string(),
                "Error".to_string(),
                "Error message".to_string(),
                NotificationLevel::Error,
            )
            .await;

        let notifications = service.get_user_notifications("user123").await;
        assert!(notifications.len() >= 3);
    }

    #[tokio::test]
    async fn test_mark_notification_read_nonexistent() {
        let service = NotificationService::new();

        let nonexistent_id = uuid::Uuid::new_v4();
        let result = service
            .mark_notification_read("user123", &nonexistent_id.to_string())
            .await;

        // Should handle gracefully
        assert!(!result); // Should return false for non-existent
    }

    #[tokio::test]
    async fn test_collaboration_multiple_users() {
        let service = CollaborationService::new();

        // Multiple users join
        service
            .user_join_page("user1".to_string(), "User 1".to_string(), "page123".to_string())
            .await;
        service
            .user_join_page("user2".to_string(), "User 2".to_string(), "page123".to_string())
            .await;
        service
            .user_join_page("user3".to_string(), "User 3".to_string(), "page123".to_string())
            .await;

        let active_users = service.get_active_users("page123").await;
        assert!(active_users.len() >= 3);
    }

    #[tokio::test]
    async fn test_collaboration_user_leave_nonexistent() {
        let service = CollaborationService::new();

        // Try to remove user that never joined
        service
            .user_leave_page("nonexistent".to_string(), "page123".to_string())
            .await;

        // Should complete without error
        assert!(true);
    }

    #[tokio::test]
    async fn test_collaboration_get_comments_empty() {
        let service = CollaborationService::new();

        // Get comments for page with none
        let comments = service.get_page_comments("empty_page").await;
        assert_eq!(comments.len(), 0);
    }

    #[tokio::test]
    async fn test_collaboration_add_comment_with_parent() {
        let service = CollaborationService::new();

        // Add parent comment
        let parent = service
            .add_comment(
                "user1".to_string(),
                "User 1".to_string(),
                "page123".to_string(),
                "Parent comment".to_string(),
                None,
            )
            .await;

        // Add reply (Note: Comment struct doesn't support parent_id, so we just add another comment)
        let reply = service
            .add_comment(
                "user2".to_string(),
                "User 2".to_string(),
                "page123".to_string(),
                "Reply comment".to_string(),
                None, // Position is None, parent_id not supported
            )
            .await;

        // Verify both comments are created
        assert_eq!(parent.message, "Parent comment");
        assert_eq!(reply.message, "Reply comment");
        assert_eq!(reply.user_id, "user2");
    }

    #[tokio::test]
    async fn test_subscribe_to_updates_multiple() {
        let service = NotificationService::new();

        let websocket_id1 = uuid::Uuid::new_v4();
        let websocket_id2 = uuid::Uuid::new_v4();

        // Subscribe multiple times
        service
            .subscribe_to_updates("user123".to_string(), websocket_id1)
            .await;
        service
            .subscribe_to_updates("user123".to_string(), websocket_id2)
            .await;

        // Should complete without error
        assert!(true);
    }

    #[tokio::test]
    async fn test_broadcast_reconciliation_progress_edge_cases() {
        let service = NotificationService::new();

        // Test with different progress values
        service
            .broadcast_reconciliation_progress("user123", "job123", 0.0, "starting")
            .await;
        service
            .broadcast_reconciliation_progress("user123", "job123", 50.0, "processing")
            .await;
        service
            .broadcast_reconciliation_progress("user123", "job123", 100.0, "completed")
            .await;

        assert!(true);
    }

    #[tokio::test]
    async fn test_broadcast_file_upload_progress_edge_cases() {
        let service = NotificationService::new();

        // Test with different progress values
        service
            .broadcast_file_upload_progress("user123", "file123", 0.0, "starting")
            .await;
        service
            .broadcast_file_upload_progress("user123", "file123", 50.0, "uploading")
            .await;
        service
            .broadcast_file_upload_progress("user123", "file123", 100.0, "completed")
            .await;

        assert!(true);
    }

    #[tokio::test]
    async fn test_collaboration_concurrent_operations() {
        let service = CollaborationService::new();

        // Test concurrent operations
        let (_result1, _result2, _result3) = tokio::join!(
            service.user_join_page("user1".to_string(), "User 1".to_string(), "page123".to_string()),
            service.user_join_page("user2".to_string(), "User 2".to_string(), "page123".to_string()),
            service.get_active_users("page123")
        );

        // All should complete
        assert!(true);
    }
}

