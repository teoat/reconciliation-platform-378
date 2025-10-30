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
    pub fn from_env() -> Self {
        // Fail fast for required secrets to avoid insecure defaults
        let stripe_secret_key = env::var("STRIPE_SECRET_KEY")
            .expect("STRIPE_SECRET_KEY must be set");
        let stripe_publishable_key = env::var("STRIPE_PUBLISHABLE_KEY")
            .expect("STRIPE_PUBLISHABLE_KEY must be set");
        let stripe_webhook_secret = env::var("STRIPE_WEBHOOK_SECRET")
            .expect("STRIPE_WEBHOOK_SECRET must be set");

        Self {
            stripe_secret_key,
            stripe_publishable_key,
            stripe_webhook_secret,
            default_currency: env::var("DEFAULT_CURRENCY").unwrap_or_else(|_| "usd".to_string()),
        }
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
