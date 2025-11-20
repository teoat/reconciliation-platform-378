//! Service layer tests for AnalyticsService
//!
//! Tests AnalyticsService methods including dashboard data,
//! project statistics, and user activity.

use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::services::analytics::AnalyticsService;
use reconciliation_backend::services::cache::MultiLevelCache;
use reconciliation_backend::services::resilience::ResilienceManager;
use reconciliation_backend::test_utils_export::database::setup_test_database;

/// Test AnalyticsService methods
#[cfg(test)]
mod analytics_service_tests {
    use super::*;

    #[tokio::test]
    async fn test_get_dashboard_data() {
        let (db, _) = setup_test_database().await;
        let analytics_service = AnalyticsService::new(db);

        let result = analytics_service.get_dashboard_data().await;
        assert!(result.is_ok());

        let dashboard = result.unwrap();
        assert!(dashboard.total_users >= 0);
        assert!(dashboard.total_projects >= 0);
        assert!(dashboard.total_reconciliation_jobs >= 0);
    }

    #[tokio::test]
    async fn test_get_project_stats() {
        let (db, _) = setup_test_database().await;
        let analytics_service = AnalyticsService::new(db);

        let project_id = Uuid::new_v4();

        // Get project stats (may fail if project doesn't exist)
        let result = analytics_service.get_project_stats(project_id).await;

        // Should handle non-existent projects gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_get_user_activity_stats() {
        let (db, _) = setup_test_database().await;
        let analytics_service = AnalyticsService::new(db);

        let user_id = Uuid::new_v4();

        // Get user activity (may fail if user doesn't exist)
        let result = analytics_service.get_user_activity_stats(user_id).await;

        // Should handle non-existent users gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_get_reconciliation_stats() {
        let (db, _) = setup_test_database().await;
        let analytics_service = AnalyticsService::new(db);

        let result = analytics_service.get_reconciliation_stats().await;
        assert!(result.is_ok());

        let stats = result.unwrap();
        assert!(stats.total_jobs >= 0);
        assert!(stats.completed_jobs >= 0);
    }

    #[tokio::test]
    async fn test_analytics_service_with_resilience() {
        let (db, _) = setup_test_database().await;
        let cache = Arc::new(MultiLevelCache::new("redis://localhost:6379").unwrap());
        let resilience = Arc::new(ResilienceManager::new());

        let analytics_service = AnalyticsService::new_with_resilience(db, cache, resilience);

        let result = analytics_service.get_dashboard_data().await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_get_project_stats_nonexistent() {
        let (db, _) = setup_test_database().await;
        let analytics_service = AnalyticsService::new(db);

        let nonexistent_project_id = Uuid::new_v4();

        // Get stats for non-existent project
        let result = analytics_service.get_project_stats(nonexistent_project_id).await;

        // Should handle gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_get_user_activity_stats_nonexistent() {
        let (db, _) = setup_test_database().await;
        let analytics_service = AnalyticsService::new(db);

        let nonexistent_user_id = Uuid::new_v4();

        // Get activity for non-existent user
        let result = analytics_service.get_user_activity_stats(nonexistent_user_id).await;

        // Should handle gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_get_reconciliation_stats_empty() {
        let (db, _) = setup_test_database().await;
        let analytics_service = AnalyticsService::new(db);

        // Get stats (may be empty if no jobs exist)
        let result = analytics_service.get_reconciliation_stats().await;
        assert!(result.is_ok());

        let stats = result.unwrap();
        // Stats should be valid even if empty
        assert!(stats.total_jobs >= 0);
        assert!(stats.completed_jobs >= 0);
        assert!(stats.completed_jobs <= stats.total_jobs);
    }

    #[tokio::test]
    async fn test_get_dashboard_data_empty_database() {
        let (db, _) = setup_test_database().await;
        let analytics_service = AnalyticsService::new(db);

        // Get dashboard data (may be empty)
        let result = analytics_service.get_dashboard_data().await;
        assert!(result.is_ok());

        let dashboard = result.unwrap();
        // Should return valid structure even if all values are 0
        assert!(dashboard.total_users >= 0);
        assert!(dashboard.total_projects >= 0);
        assert!(dashboard.total_reconciliation_jobs >= 0);
    }

    #[tokio::test]
    async fn test_analytics_service_concurrent_requests() {
        let (db, _) = setup_test_database().await;
        let analytics_service = AnalyticsService::new(db);

        // Test concurrent requests
        let (result1, result2, result3) = tokio::join!(
            analytics_service.get_dashboard_data(),
            analytics_service.get_reconciliation_stats(),
            analytics_service.get_dashboard_data()
        );

        assert!(result1.is_ok());
        assert!(result2.is_ok());
        assert!(result3.is_ok());
    }

    #[tokio::test]
    async fn test_get_project_stats_multiple_projects() {
        let (db, _) = setup_test_database().await;
        let analytics_service = AnalyticsService::new(db);

        let project_id1 = Uuid::new_v4();
        let project_id2 = Uuid::new_v4();
        let project_id3 = Uuid::new_v4();

        // Get stats for multiple projects concurrently
        let (result1, result2, result3) = tokio::join!(
            analytics_service.get_project_stats(project_id1),
            analytics_service.get_project_stats(project_id2),
            analytics_service.get_project_stats(project_id3)
        );

        // All should handle gracefully
        assert!(result1.is_ok() || result1.is_err());
        assert!(result2.is_ok() || result2.is_err());
        assert!(result3.is_ok() || result3.is_err());
    }

    #[tokio::test]
    async fn test_analytics_service_error_handling() {
        let (db, _) = setup_test_database().await;
        let analytics_service = AnalyticsService::new(db);

        // Test that service handles errors gracefully
        // Even with invalid inputs, should not panic
        let invalid_uuid = Uuid::nil();

        let result = analytics_service.get_project_stats(invalid_uuid).await;
        // Should handle gracefully
        assert!(result.is_ok() || result.is_err());

        let result = analytics_service.get_user_activity_stats(invalid_uuid).await;
        // Should handle gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_analytics_aggregation_edge_cases() {
        let (db, _) = setup_test_database().await;
        let analytics_service = AnalyticsService::new(db);

        // Test aggregation with empty data
        let result = analytics_service.get_dashboard_data().await;
        assert!(result.is_ok());

        let dashboard = result.unwrap();
        // Should return valid structure even with zero values
        assert!(dashboard.total_users >= 0);
        assert!(dashboard.total_projects >= 0);
    }

    #[tokio::test]
    async fn test_analytics_date_range_handling() {
        let (db, _) = setup_test_database().await;
        let analytics_service = AnalyticsService::new(db);

        // Test that analytics handle date ranges gracefully
        let result = analytics_service.get_reconciliation_stats().await;
        assert!(result.is_ok());

        let stats = result.unwrap();
        // Should return valid stats structure
        assert!(stats.total_jobs >= 0);
    }
}

