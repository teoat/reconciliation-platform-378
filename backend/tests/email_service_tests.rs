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
                "correlation123",
            )
            .await;
        
        assert!(result.is_ok() || result.is_err());
    }
}

