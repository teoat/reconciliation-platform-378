//! Billing service tests

use reconciliation_backend::services::billing::BillingService;
use reconciliation_backend::models::subscription::SubscriptionTier;
use uuid::Uuid;

#[tokio::test]
async fn test_create_checkout_session() {
    let service = BillingService::new("".to_string()); // Development mode
    let user_id = Uuid::new_v4();
    
    let result = service.create_checkout_session(user_id, SubscriptionTier::Professional, "monthly").await;
    
    assert!(result.is_ok());
    let session = result.unwrap();
    assert!(!session.session_id.is_empty());
    assert!(!session.url.is_empty());
}

#[tokio::test]
async fn test_create_subscription() {
    let service = BillingService::new("".to_string());
    let user_id = Uuid::new_v4();
    
    let result = service.create_subscription(user_id, SubscriptionTier::Professional, "monthly", None).await;
    
    assert!(result.is_ok());
    let subscription = result.unwrap();
    assert_eq!(subscription.user_id, user_id);
    assert_eq!(subscription.status, "active");
}

#[tokio::test]
async fn test_cancel_subscription() {
    let service = BillingService::new("".to_string());
    let subscription_id = Uuid::new_v4();
    
    let result = service.cancel_subscription(subscription_id, false).await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_get_usage_metrics() {
    let service = BillingService::new("".to_string());
    let user_id = Uuid::new_v4();
    
    let result = service.get_usage_metrics(user_id).await;
    
    assert!(result.is_ok());
    let metrics = result.unwrap();
    assert!(metrics.reconciliation_count >= 0);
    assert!(metrics.storage_bytes >= 0);
}




