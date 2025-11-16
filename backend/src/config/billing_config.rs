use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BillingConfig {
    pub stripe_secret_key: String,
    pub stripe_publishable_key: String,
    pub stripe_webhook_secret: String,
    pub default_currency: String,
}

impl BillingConfig {
    pub fn from_env() -> Result<Self, String> {
        // Use SecretsService for consistent secret access
        let stripe_secret_key = crate::services::secrets::SecretsService::get_stripe_secret_key()
            .map_err(|e| format!("STRIPE_SECRET_KEY: {}", e))?;
        let stripe_webhook_secret = crate::services::secrets::SecretsService::get_stripe_webhook_secret()
            .map_err(|e| format!("STRIPE_WEBHOOK_SECRET: {}", e))?;
        
        // Publishable key is not a secret, can use env::var
        let stripe_publishable_key = env::var("STRIPE_PUBLISHABLE_KEY")
            .map_err(|_| "Missing required environment variable: STRIPE_PUBLISHABLE_KEY".to_string())?;

        Ok(Self {
            stripe_secret_key,
            stripe_publishable_key,
            stripe_webhook_secret,
            default_currency: env::var("DEFAULT_CURRENCY").unwrap_or_else(|_| "usd".to_string()),
        })
    }
}

impl Default for BillingConfig {
    fn default() -> Self {
        Self {
            stripe_secret_key: String::new(),
            stripe_publishable_key: String::new(),
            stripe_webhook_secret: String::new(),
            default_currency: "usd".to_string(),
        }
    }
}
