//! Email service for sending authentication and notification emails

use crate::errors::{AppError, AppResult};
use crate::services::resilience::ResilienceManager;
use std::env;
use std::sync::Arc;

/// Email template types
#[derive(Debug, Clone)]
pub enum EmailTemplate {
    PasswordReset { token: String, user_name: String },
    EmailVerification { token: String, user_name: String },
    Welcome { user_name: String },
    Notification { message: String },
}

/// Email service
pub struct EmailService {
    smtp_host: String,
    #[allow(dead_code)]
    smtp_port: u16,
    #[allow(dead_code)]
    smtp_user: String,
    #[allow(dead_code)]
    smtp_password: String,
    from_email: String,
    resilience: Option<Arc<ResilienceManager>>,
}

impl Default for EmailService {
    fn default() -> Self {
        Self::new()
    }
}

impl EmailService {
    /// Create a new email service
    pub fn new() -> Self {
        Self {
            smtp_host: env::var("SMTP_HOST").unwrap_or_else(|_| "localhost".to_string()),
            smtp_port: env::var("SMTP_PORT")
                .unwrap_or_else(|_| "587".to_string())
                .parse()
                .unwrap_or(587),
            smtp_user: env::var("SMTP_USER").unwrap_or_else(|_| "".to_string()),
            smtp_password: crate::services::secrets::SecretsService::get_smtp_password()
                .unwrap_or_else(|_| "".to_string()),
            from_email: env::var("SMTP_FROM")
                .unwrap_or_else(|_| "noreply@reconciliation.com".to_string()),
            resilience: None,
        }
    }

    /// Create email service with resilience manager
    pub fn new_with_resilience(resilience: Arc<ResilienceManager>) -> Self {
        Self {
            smtp_host: env::var("SMTP_HOST").unwrap_or_else(|_| "localhost".to_string()),
            smtp_port: env::var("SMTP_PORT")
                .unwrap_or_else(|_| "587".to_string())
                .parse()
                .unwrap_or(587),
            smtp_user: env::var("SMTP_USER").unwrap_or_else(|_| "".to_string()),
            smtp_password: crate::services::secrets::SecretsService::get_smtp_password()
                .unwrap_or_else(|_| "".to_string()),
            from_email: env::var("SMTP_FROM")
                .unwrap_or_else(|_| "noreply@reconciliation.com".to_string()),
            resilience: Some(resilience),
        }
    }


    /// Get SMTP password (uses SecretsService)
    async fn get_smtp_password(&self) -> String {
        // Use SecretsService for consistent secret access
        crate::services::secrets::SecretsService::get_smtp_password()
            .unwrap_or_else(|_| {
                log::debug!("SMTP_PASSWORD not found, using stored value");
                self.smtp_password.clone()
            })
    }

    /// Send password reset email
    pub async fn send_password_reset(
        &self,
        to: &str,
        token: &str,
        user_name: &str,
    ) -> AppResult<()> {
        let subject = "Password Reset Request";
        let body = format!(
            r#"
Hello {},

You requested a password reset for your account.

Please use the following token to reset your password:
{}

This token will expire in 30 minutes.

If you didn't request this, please ignore this email.

Best regards,
Reconciliation Platform Team
"#,
            user_name, token
        );

        self.send_email(to, subject, &body).await
    }

    /// Send email verification
    pub async fn send_email_verification(
        &self,
        to: &str,
        token: &str,
        user_name: &str,
    ) -> AppResult<()> {
        let subject = "Verify Your Email Address";
        let body = format!(
            r#"
Hello {},

Thank you for signing up! Please verify your email address by clicking the link below or using this token:

Token: {}

This token will expire in 24 hours.

Best regards,
Reconciliation Platform Team
"#,
            user_name, token
        );

        self.send_email(to, subject, &body).await
    }

    /// Send welcome email
    pub async fn send_welcome_email(&self, to: &str, user_name: &str) -> AppResult<()> {
        let subject = "Welcome to Reconciliation Platform";
        let body = format!(
            r#"
Hello {},

Welcome to the Reconciliation Platform!

Your account has been successfully created and verified.

Best regards,
Reconciliation Platform Team
"#,
            user_name
        );

        self.send_email(to, subject, &body).await
    }

    /// Send generic email with resilience (circuit breaker and retry)
    pub async fn send_email(&self, to: &str, subject: &str, body: &str) -> AppResult<()> {
        self.send_email_with_correlation(to, subject, body, None)
            .await
    }

    /// Send email with correlation ID for tracing
    pub async fn send_email_with_correlation(
        &self,
        to: &str,
        subject: &str,
        body: &str,
        correlation_id: Option<String>,
    ) -> AppResult<()> {
        // If resilience manager is available, use it for SMTP operations
        if let Some(ref resilience) = self.resilience {
            return resilience
                .execute_api_with_correlation(
                    || async { self.send_email_internal(to, subject, body).await },
                    correlation_id,
                )
                .await;
        }

        // Fallback to direct call if no resilience manager
        let corr_id = correlation_id.as_deref().unwrap_or("unknown");
        log::debug!(
            "[{}] Sending email to {} with subject: {}",
            corr_id,
            to,
            subject
        );
        self.send_email_internal(to, subject, body).await
    }

    /// Internal email sending implementation
    async fn send_email_internal(&self, to: &str, subject: &str, _body: &str) -> AppResult<()> {
        // Get SMTP password from password manager if available
        // Reserved for future use when email sending is fully implemented
        let _smtp_password = self.get_smtp_password().await;
        
        // In production, integrate with lettre or similar
        // For now, log the email would be sent
        log::info!(
            "Email would be sent from {} to {} with subject: {} (using password manager: {})",
            self.from_email,
            to,
            subject,
            false // Password manager integration not implemented
        );

        // In production with lettre:
        /*
        use lettre::{Message, SmtpTransport, Transport};

        let email = Message::builder()
            .from(self.from_email.parse().map_err(|e| AppError::Internal(format!("Invalid from email: {}", e)))?)
            .to(to.parse().map_err(|e| AppError::Internal(format!("Invalid to email: {}", e)))?)
            .subject(subject)
            .body(body.to_string())
            .map_err(|e| AppError::Internal(format!("Failed to build email: {}", e)))?;

        let mailer = SmtpTransport::relay(&self.smtp_host)
            .map_err(|e| AppError::Internal(format!("Failed to create SMTP transport: {}", e)))?
            .port(self.smtp_port)
            .credentials((&self.smtp_user, &smtp_password))
            .build();

        mailer.send(&email)
            .map_err(|e| AppError::Internal(format!("Failed to send email: {}", e)))?;
        */

        // Simulate potential failure for testing resilience
        // In production, this would be the actual SMTP call
        if self.smtp_host == "fail.test" {
            return Err(AppError::Internal(
                "Simulated SMTP failure for testing".to_string(),
            ));
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_email_service_creation() {
        let service = EmailService::new();
        assert!(!service.smtp_host.is_empty());
    }
}
