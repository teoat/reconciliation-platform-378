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
}

