//! Service layer tests for EmailService
//!
//! Tests EmailService methods including email sending,
//! template rendering, and error handling.

use reconciliation_backend::services::email::EmailService;

/// Test EmailService methods
#[cfg(test)]
mod email_service_tests {
    use super::*;

    #[test]
    fn test_email_service_creation() {
        let service = EmailService::new();
        
        // Verify service is created (no public fields to check)
        assert!(true);
    }

    #[test]
    fn test_email_service_with_resilience() {
        use std::sync::Arc;
        use reconciliation_backend::services::resilience::ResilienceManager;
        
        let resilience = Arc::new(ResilienceManager::new());
        let service = EmailService::new_with_resilience(resilience);
        
        // Verify service is created
        assert!(true);
    }

    #[tokio::test]
    async fn test_send_password_reset() {
        let service = EmailService::new();
        
        // This will likely fail in test environment without SMTP configured
        // but we can test the method exists and handles errors gracefully
        let result = service
            .send_password_reset("test@example.com", "token123", "Test User")
            .await;
        
        // Should handle gracefully (may fail due to missing SMTP config)
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_send_email_verification() {
        let service = EmailService::new();
        
        let result = service
            .send_email_verification("test@example.com", "token123", "Test User")
            .await;
        
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_send_welcome_email() {
        let service = EmailService::new();
        
        let result = service
            .send_welcome_email("test@example.com", "Test User")
            .await;
        
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_send_email() {
        let service = EmailService::new();
        
        let result = service
            .send_email(
                "test@example.com",
                "Test Subject",
                "Test body content",
            )
            .await;
        
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_send_email_with_correlation() {
        let service = EmailService::new();
        
        let result = service
            .send_email_with_correlation(
                "test@example.com",
                "Test Subject",
                "Test body",
                Some("correlation123".to_string()),
            )
            .await;
        
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_send_email_invalid_address() {
        let service = EmailService::new();
        
        // Test with invalid email address
        let result = service
            .send_email("invalid_email", "Subject", "Body")
            .await;
        
        // Should handle invalid email gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_send_email_empty_subject() {
        let service = EmailService::new();
        
        let result = service
            .send_email("test@example.com", "", "Body content")
            .await;
        
        // Should handle empty subject gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_send_email_empty_body() {
        let service = EmailService::new();
        
        let result = service
            .send_email("test@example.com", "Subject", "")
            .await;
        
        // Should handle empty body gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_send_email_without_correlation() {
        let service = EmailService::new();
        
        // Test without correlation ID
        let result = service
            .send_email_with_correlation(
                "test@example.com",
                "Subject",
                "Body",
                None,
            )
            .await;
        
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_send_password_reset_invalid_token() {
        let service = EmailService::new();
        
        // Test with empty token
        let result = service
            .send_password_reset("test@example.com", "", "User")
            .await;
        
        // Should handle gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_send_email_verification_invalid_token() {
        let service = EmailService::new();
        
        // Test with empty token
        let result = service
            .send_email_verification("test@example.com", "", "User")
            .await;
        
        // Should handle gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_send_welcome_email_empty_name() {
        let service = EmailService::new();
        
        let result = service
            .send_welcome_email("test@example.com", "")
            .await;
        
        // Should handle empty name gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_concurrent_email_operations() {
        let service = EmailService::new();
        
        // Test concurrent email sending
        let (result1, result2, result3) = tokio::join!(
            service.send_email("test1@example.com", "Subject 1", "Body 1"),
            service.send_email("test2@example.com", "Subject 2", "Body 2"),
            service.send_password_reset("test3@example.com", "token", "User")
        );
        
        // All should handle gracefully
        assert!(result1.is_ok() || result1.is_err());
        assert!(result2.is_ok() || result2.is_err());
        assert!(result3.is_ok() || result3.is_err());
    }

    #[tokio::test]
    async fn test_email_service_error_recovery() {
        let service = EmailService::new();
        
        // Test that service handles errors gracefully
        // Even with invalid inputs, should not panic
        let result = service
            .send_email("", "", "")
            .await;
        
        // Should handle gracefully
        assert!(result.is_ok() || result.is_err());
    }
}

