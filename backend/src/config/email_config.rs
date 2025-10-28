// Email Service Configuration
// SSOT for email/SMTP configuration

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct EmailConfig {
    pub smtp_host: String,
    pub smtp_port: u16,
    pub smtp_username: String,
    pub smtp_password: String,
    pub smtp_from: String,
    pub smtp_from_name: String,
    pub smtp_use_tls: bool,
    pub smtp_timeout_seconds: u64,
}

impl Default for EmailConfig {
    fn default() -> Self {
        Self {
            smtp_host: std::env::var("SMTP_HOST")
                .unwrap_or_else(|_| "smtp.gmail.com".to_string()),
            smtp_port: std::env::var("SMTP_PORT")
                .unwrap_or_else(|_| "587".to_string())
                .parse()
                .unwrap_or(587),
            smtp_username: std::env::var("SMTP_USERNAME")
                .unwrap_or_else(|_| "".to_string()),
            smtp_password: std::env::var("SMTP_PASSWORD")
                .unwrap_or_else(|_| "".to_string()),
            smtp_from: std::env::var("SMTP_FROM")
                .unwrap_or_else(|_| "noreply@reconciliation.app".to_string()),
            smtp_from_name: std::env::var("SMTP_FROM_NAME")
                .unwrap_or_else(|_| "Reconciliation Platform".to_string()),
            smtp_use_tls: std::env::var("SMTP_USE_TLS")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .unwrap_or(true),
            smtp_timeout_seconds: std::env::var("SMTP_TIMEOUT")
                .unwrap_or_else(|_| "30".to_string())
                .parse()
                .unwrap_or(30),
        }
    }
}

impl EmailConfig {
    pub fn from_env() -> Self {
        Self::default()
    }

    pub fn is_configured(&self) -> bool {
        !self.smtp_username.is_empty() && !self.smtp_password.is_empty()
    }

    pub fn get_smtp_url(&self) -> String {
        format!("smtp://{}:{}", self.smtp_host, self.smtp_port)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_email_config_default() {
        let config = EmailConfig::default();
        assert_eq!(config.smtp_port, 587);
        assert_eq!(config.smtp_use_tls, true);
    }

    #[test]
    fn test_is_configured() {
        let mut config = EmailConfig::default();
        assert!(!config.is_configured());
        
        config.smtp_username = "test@example.com".to_string();
        config.smtp_password = "password".to_string();
        assert!(config.is_configured());
    }
}

