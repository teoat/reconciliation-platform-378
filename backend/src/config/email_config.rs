use serde::{Deserialize, Serialize};
use std::env;
use log::warn;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailConfig {
    pub smtp_server: String,
    pub smtp_port: u16,
    pub smtp_username: String,
    pub smtp_password: String,
    pub from_email: String,
    pub from_name: String,
}

impl EmailConfig {
    pub fn from_env() -> Self {
        Self {
            smtp_server: env::var("SMTP_SERVER").unwrap_or_else(|_| "smtp.gmail.com".to_string()),
            smtp_port: env::var("SMTP_PORT")
                .unwrap_or_else(|_| "587".to_string())
                .parse()
                .unwrap_or_else(|_| {
                    warn!("Invalid SMTP_PORT value, using default 587");
                    587
                }),
            smtp_username: env::var("SMTP_USERNAME").unwrap_or_default(),
            smtp_password: env::var("SMTP_PASSWORD")
                .unwrap_or_else(|_| {
                    warn!("SMTP_PASSWORD not set - email features will be disabled");
                    String::new()
                }),
            from_email: env::var("FROM_EMAIL").unwrap_or_else(|_| "noreply@reconciliation.app".to_string()),
            from_name: env::var("FROM_NAME").unwrap_or_else(|_| "Reconciliation Platform".to_string()),
        }
    }
}

impl Default for EmailConfig {
    fn default() -> Self {
        Self {
            smtp_server: "smtp.gmail.com".to_string(),
            smtp_port: 587,
            smtp_username: String::new(),
            smtp_password: String::new(),
            from_email: "noreply@reconciliation.app".to_string(),
            from_name: "Reconciliation Platform".to_string(),
        }
    }
}
