//! Email service for sending authentication and notification emails

use std::env;
use crate::errors::AppResult;

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
    smtp_port: u16,
    smtp_user: String,
    smtp_password: String,
    from_email: String,
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
            smtp_password: env::var("SMTP_PASSWORD").unwrap_or_else(|_| "".to_string()),
            from_email: env::var("SMTP_FROM").unwrap_or_else(|_| "noreply@reconciliation.com".to_string()),
        }
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
    
    /// Send generic email
    pub async fn send_email(&self, to: &str, subject: &str, body: &str) -> AppResult<()> {
        // In production, integrate with lettre or similar
        // For now, log the email would be sent
        log::info!(
            "Email would be sent from {} to {} with subject: {}",
            self.from_email,
            to,
            subject
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
        
        let mailer = SmtpTransport::relay(&self.smtp_host)?
            .port(self.smtp_port)
            .credentials((&self.smtp_user, &self.smtp_password))
            .build();
        
        mailer.send(&email)?;
        */
        
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

