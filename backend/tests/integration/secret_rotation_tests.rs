//! Integration tests for secret rotation service

use reconciliation_backend::services::secrets::rotation::SecretRotationService;

#[tokio::test]
async fn test_secret_registration() {
    let service = SecretRotationService::new();
    
    let result = service.register_secret(
        "TEST_SECRET".to_string(),
        "test-secret-value".to_string(),
        90, // 90 days rotation interval
    ).await;
    
    assert!(result.is_ok(), "Secret registration should succeed");
}

#[tokio::test]
async fn test_secret_rotation() {
    let service = SecretRotationService::new();
    
    // Register a secret first
    service.register_secret(
        "ROTATE_TEST".to_string(),
        "initial-value".to_string(),
        90,
    ).await.unwrap();
    
    // Rotate the secret
    let result = service.rotate_secret("ROTATE_TEST", "new-value".to_string()).await;
    assert!(result.is_ok(), "Secret rotation should succeed");
    
    let version = result.unwrap();
    assert_eq!(version, 2, "Rotated secret should be version 2");
}

#[tokio::test]
async fn test_get_current_secret() {
    let service = SecretRotationService::new();
    
    service.register_secret(
        "GET_TEST".to_string(),
        "test-value".to_string(),
        90,
    ).await.unwrap();
    
    let result = service.get_current_secret("GET_TEST").await;
    assert!(result.is_ok(), "Get current secret should succeed");
    assert_eq!(result.unwrap(), "test-value");
}

#[tokio::test]
async fn test_needs_rotation() {
    let service = SecretRotationService::new();
    
    service.register_secret(
        "ROTATION_TEST".to_string(),
        "test-value".to_string(),
        1, // 1 day rotation interval
    ).await.unwrap();
    
    // Should not need rotation immediately after registration
    let needs = service.needs_rotation("ROTATION_TEST").await.unwrap();
    assert!(!needs, "Secret should not need rotation immediately");
}

#[tokio::test]
async fn test_audit_logging() {
    let service = SecretRotationService::new();
    
    service.register_secret(
        "AUDIT_TEST".to_string(),
        "test-value".to_string(),
        90,
    ).await.unwrap();
    
    // Access the secret to generate audit log
    service.get_current_secret("AUDIT_TEST").await.unwrap();
    
    let logs = service.get_audit_logs(Some("AUDIT_TEST")).await;
    assert!(!logs.is_empty(), "Audit logs should contain entries");
    
    let registered_log = logs.iter().find(|log| log.action == "REGISTERED");
    assert!(registered_log.is_some(), "Should have REGISTERED log entry");
    
    let accessed_log = logs.iter().find(|log| log.action == "ACCESSED");
    assert!(accessed_log.is_some(), "Should have ACCESSED log entry");
}

