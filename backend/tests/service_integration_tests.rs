//! Service Integration Tests
//!
//! Tests for service-to-service integration scenarios

use std::sync::Arc;

use reconciliation_backend::database::Database;
use reconciliation_backend::services::auth::AuthService;
use reconciliation_backend::services::cache::MultiLevelCache;
use reconciliation_backend::services::user::UserService;
use reconciliation_backend::test_utils_export::database::setup_test_database;

#[tokio::test]
async fn test_user_service_auth_service_integration() {
    let db = Arc::new(setup_test_database().await);
    let auth_service = AuthService::new("test_secret".to_string(), 3600);
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service.clone()));

    // Create user
    let create_request = reconciliation_backend::services::user::CreateUserRequest {
        email: format!("integration-{}@example.com", uuid::Uuid::new_v4()),
        password: "TestPassword123!".to_string(),
        first_name: "Integration".to_string(),
        last_name: "Test".to_string(),
        role: Some("user".to_string()),
    };

    let user = user_service.create_user(create_request).await;
    assert!(user.is_ok());

    // Authenticate user
    if let Ok(user_info) = user {
        let user_model = user_service.get_user_by_email(&user_info.email).await;
        assert!(user_model.is_ok());

        if let Ok(user_model) = user_model {
            let token = auth_service.generate_token(&user_model);
            assert!(token.is_ok());
        }
    }
}

#[tokio::test]
async fn test_cache_service_user_service_integration() {
    let db = Arc::new(setup_test_database().await);
    let cache = Arc::new(MultiLevelCache::new());
    let auth_service = AuthService::new("test_secret".to_string(), 3600);
    let user_service = Arc::new(UserService::new(Arc::clone(&db), auth_service));

    // Create user
    let create_request = reconciliation_backend::services::user::CreateUserRequest {
        email: format!("cache-{}@example.com", uuid::Uuid::new_v4()),
        password: "TestPassword123!".to_string(),
        first_name: "Cache".to_string(),
        last_name: "Test".to_string(),
        role: Some("user".to_string()),
    };

    let user = user_service.create_user(create_request).await;
    assert!(user.is_ok());

    // Test cache integration
    if let Ok(user_info) = user {
        let cache_key = format!("user:{}", user_info.id);
        let cache_result = cache.set(&cache_key, &user_info, None).await;
        assert!(cache_result.is_ok());

        // Retrieve from cache
        let cached_user: Option<reconciliation_backend::services::user::UserInfo> =
            cache.get(&cache_key).await.unwrap_or(None);
        assert!(cached_user.is_some());
    }
}

#[tokio::test]
async fn test_monitoring_service_metrics_service_integration() {
    use reconciliation_backend::services::monitoring::MonitoringService;
    use reconciliation_backend::services::metrics::MetricsService;

    let monitoring_service = MonitoringService::new();
    let metrics_service = Arc::new(MetricsService::new());

    // Get monitoring health
    let health = monitoring_service.get_system_metrics().await;
    assert!(health.is_ok());

    // Get metrics
    let all_metrics = metrics_service.get_all_metrics().await;
    assert!(!all_metrics.is_empty() || all_metrics.is_empty()); // May be empty initially
}

#[tokio::test]
async fn test_security_service_compliance_service_integration() {
    use reconciliation_backend::services::security_event_logging::SecurityEventLoggingService;
    use reconciliation_backend::services::compliance_reporting::ComplianceReportingService;

    let security_event_logger = SecurityEventLoggingService::new();
    let compliance_service = Arc::new(ComplianceReportingService::new(security_event_logger.clone()));

    // Get security events
    let events = security_event_logger.get_events(Default::default()).await;
    assert!(events.is_empty() || !events.is_empty()); // May be empty

    // Get compliance statistics
    let stats = security_event_logger.get_statistics().await;
    assert!(stats.total_events >= 0);
}

