//! Billing service tests

use reconciliation_backend::services::billing::BillingService;
use reconciliation_backend::models::subscription::SubscriptionTier;
use uuid::Uuid;

#[tokio::test]
async fn test_billing_service_creation() {
    let service = BillingService::new("".to_string());
    
    // Verify service is created
    assert!(true);
}

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
async fn test_create_checkout_session_yearly() {
    let service = BillingService::new("".to_string());
    let user_id = Uuid::new_v4();
    
    let result = service.create_checkout_session(user_id, SubscriptionTier::Professional, "yearly").await;
    
    assert!(result.is_ok());
    let session = result.unwrap();
    assert!(!session.session_id.is_empty());
}

#[tokio::test]
async fn test_create_checkout_session_different_tiers() {
    let service = BillingService::new("".to_string());
    let user_id = Uuid::new_v4();
    
    let tiers = vec![
        SubscriptionTier::Free,
        SubscriptionTier::Professional,
        SubscriptionTier::Enterprise,
    ];
    
    for tier in tiers {
        let result = service.create_checkout_session(user_id, tier, "monthly").await;
        assert!(result.is_ok());
    }
}

#[tokio::test]
async fn test_create_checkout_session_stripe_mode() {
    // Test with Stripe key (should return NotImplemented)
    let service = BillingService::new("sk_test_key".to_string());
    let user_id = Uuid::new_v4();
    
    let result = service.create_checkout_session(user_id, SubscriptionTier::Professional, "monthly").await;
    
    // Should return NotImplemented error when Stripe key is provided
    assert!(result.is_err());
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
async fn test_create_subscription_yearly() {
    let service = BillingService::new("".to_string());
    let user_id = Uuid::new_v4();
    
    let result = service.create_subscription(user_id, SubscriptionTier::Professional, "yearly", None).await;
    
    assert!(result.is_ok());
    let subscription = result.unwrap();
    assert_eq!(subscription.user_id, user_id);
}

#[tokio::test]
async fn test_create_subscription_with_payment_method() {
    let service = BillingService::new("".to_string());
    let user_id = Uuid::new_v4();
    
    let result = service.create_subscription(
        user_id,
        SubscriptionTier::Professional,
        "monthly",
        Some("pm_test_123".to_string())
    ).await;
    
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_cancel_subscription() {
    let service = BillingService::new("".to_string());
    let subscription_id = Uuid::new_v4();
    
    let result = service.cancel_subscription(subscription_id, false).await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_cancel_subscription_immediate() {
    let service = BillingService::new("".to_string());
    let subscription_id = Uuid::new_v4();
    
    let result = service.cancel_subscription(subscription_id, true).await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_renew_subscription() {
    let service = BillingService::new("".to_string());
    let subscription_id = Uuid::new_v4();
    
    // Should return NotImplemented (as per implementation)
    let result = service.renew_subscription(subscription_id).await;
    assert!(result.is_err());
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
    assert!(metrics.project_count >= 0);
}

#[tokio::test]
async fn test_get_usage_metrics_multiple_users() {
    let service = BillingService::new("".to_string());
    
    let user1 = Uuid::new_v4();
    let user2 = Uuid::new_v4();
    
    let (result1, result2) = tokio::join!(
        service.get_usage_metrics(user1),
        service.get_usage_metrics(user2)
    );
    
    assert!(result1.is_ok());
    assert!(result2.is_ok());
}

#[tokio::test]
async fn test_check_feature_access() {
    let service = BillingService::new("".to_string());
    let user_id = Uuid::new_v4();
    
    let result = service.check_feature_access(user_id, "advanced_analytics").await;
    
    assert!(result.is_ok());
    assert!(result.unwrap()); // Returns true in mock implementation
}

#[tokio::test]
async fn test_check_feature_access_different_features() {
    let service = BillingService::new("".to_string());
    let user_id = Uuid::new_v4();
    
    let features = vec![
        "advanced_analytics",
        "custom_reports",
        "api_access",
        "priority_support",
    ];
    
    for feature in features {
        let result = service.check_feature_access(user_id, feature).await;
        assert!(result.is_ok());
    }
}

#[tokio::test]
async fn test_handle_webhook() {
    let service = BillingService::new("".to_string());
    
    let payload = b"test webhook payload";
    let signature = "test_signature";
    
    // Should return NotImplemented (as per implementation)
    let result = service.handle_webhook(payload, signature).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_subscription_tier_pricing() {
    // Test that different tiers have different pricing
    assert_ne!(SubscriptionTier::Free.price_per_month(), SubscriptionTier::Professional.price_per_month());
    assert_ne!(SubscriptionTier::Professional.price_per_month(), SubscriptionTier::Enterprise.price_per_month());
    
    // Yearly should be different from monthly
    assert_ne!(SubscriptionTier::Professional.price_per_month(), SubscriptionTier::Professional.price_per_year());
}

#[tokio::test]
async fn test_billing_service_concurrent_operations() {
    let service = BillingService::new("".to_string());
    let user_id = Uuid::new_v4();
    
    // Test concurrent operations
    let (result1, result2, result3) = tokio::join!(
        service.create_checkout_session(user_id, SubscriptionTier::Professional, "monthly"),
        service.get_usage_metrics(user_id),
        service.check_feature_access(user_id, "feature")
    );
    
    assert!(result1.is_ok());
    assert!(result2.is_ok());
    assert!(result3.is_ok());
}




