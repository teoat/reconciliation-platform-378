// Billing Configuration - Stripe API setup
// Environment-based configuration for payment processing

use std::env;

pub struct BillingConfig {
    pub stripe_secret_key: String,
    pub stripe_publishable_key: String,
    pub stripe_webhook_secret: String,
    pub success_url: String,
    pub cancel_url: String,
}

impl BillingConfig {
    pub fn from_env() -> Self {
        Self {
            stripe_secret_key: env::var("STRIPE_SECRET_KEY")
                .unwrap_or_else(|_| "sk_test_your_stripe_secret_key_here".to_string()),
            
            stripe_publishable_key: env::var("STRIPE_PUBLISHABLE_KEY")
                .unwrap_or_else(|_| "pk_test_your_stripe_publishable_key_here".to_string()),
            
            stripe_webhook_secret: env::var("STRIPE_WEBHOOK_SECRET")
                .unwrap_or_else(|_| "whsec_your_webhook_secret_here".to_string()),
            
            success_url: env::var("STRIPE_SUCCESS_URL")
                .unwrap_or_else(|_| "http://localhost:3000/subscription/success".to_string()),
            
            cancel_url: env::var("STRIPE_CANCEL_URL")
                .unwrap_or_else(|_| "http://localhost:3000/subscription/cancel".to_string()),
        }
    }

    pub fn is_test_mode(&self) -> bool {
        self.stripe_secret_key.contains("test")
    }
}

impl Default for BillingConfig {
    fn default() -> Self {
        Self::from_env()
    }
}

