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
        // Return Result instead of panicking for better error handling
        let stripe_secret_key = env::var("STRIPE_SECRET_KEY")
            .map_err(|_| "Missing required environment variable: STRIPE_SECRET_KEY".to_string())?;
        let stripe_publishable_key = env::var("STRIPE_PUBLISHABLE_KEY")
            .map_err(|_| "Missing required environment variable: STRIPE_PUBLISHABLE_KEY".to_string())?;
        let stripe_webhook_secret = env::var("STRIPE_WEBHOOK_SECRET")
            .map_err(|_| "Missing required environment variable: STRIPE_WEBHOOK_SECRET".to_string())?;

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
