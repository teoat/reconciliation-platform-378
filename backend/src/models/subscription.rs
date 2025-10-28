// Subscription and Monetization Models
// Handles subscription tiers and billing

use diesel::{Queryable, Insertable, Identifiable, AsChangeset};
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::schema::subscriptions;

/// Subscription Tier
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SubscriptionTier {
    Free,
    Starter,
    Professional,
    Enterprise,
}

impl SubscriptionTier {
    pub fn features(&self) -> Vec<SubscriptionFeature> {
        match self {
            SubscriptionTier::Free => vec![
                SubscriptionFeature::Projects(1),
                SubscriptionFeature::ReconciliationsPerMonth(10),
                SubscriptionFeature::StorageGb(1),
            ],
            SubscriptionTier::Starter => vec![
                SubscriptionFeature::Projects(5),
                SubscriptionFeature::ReconciliationsPerMonth(100),
                SubscriptionFeature::StorageGb(10),
                SubscriptionFeature::EmailSupport,
                SubscriptionFeature::BasicAnalytics,
            ],
            SubscriptionTier::Professional => vec![
                SubscriptionFeature::Projects(50),
                SubscriptionFeature::ReconciliationsPerMonth(1000),
                SubscriptionFeature::StorageGb(100),
                SubscriptionFeature::EmailSupport,
                SubscriptionFeature::PrioritySupport,
                SubscriptionFeature::AdvancedAnalytics,
                SubscriptionFeature::ApiAccess,
                SubscriptionFeature::CustomIntegrations,
            ],
            SubscriptionTier::Enterprise => vec![
                SubscriptionFeature::UnlimitedProjects,
                SubscriptionFeature::UnlimitedReconciliations,
                SubscriptionFeature::StorageGb(1000),
                SubscriptionFeature::EmailSupport,
                SubscriptionFeature::PrioritySupport,
                SubscriptionFeature::AdvancedAnalytics,
                SubscriptionFeature::ApiAccess,
                SubscriptionFeature::CustomIntegrations,
                SubscriptionFeature::Sla99,
                SubscriptionFeature::DedicatedSupport,
            ],
        }
    }

    pub fn price_per_month(&self) -> f64 {
        match self {
            SubscriptionTier::Free => 0.0,
            SubscriptionTier::Starter => 29.0,
            SubscriptionTier::Professional => 99.0,
            SubscriptionTier::Enterprise => 499.0,
        }
    }

    pub fn price_per_year(&self) -> f64 {
        // 20% discount for annual
        self.price_per_month() * 12.0 * 0.8
    }
}

/// Subscription Features
#[derive(Debug, Clone, PartialEq)]
pub enum SubscriptionFeature {
    Projects(usize),
    UnlimitedProjects,
    ReconciliationsPerMonth(usize),
    UnlimitedReconciliations,
    StorageGb(usize),
    EmailSupport,
    PrioritySupport,
    BasicAnalytics,
    AdvancedAnalytics,
    ApiAccess,
    CustomIntegrations,
    Sla99,
    DedicatedSupport,
}

/// Subscription Model
#[derive(Debug, Queryable, Identifiable, Serialize, AsChangeset)]
#[diesel(table_name = subscriptions)]
pub struct Subscription {
    pub id: Uuid,
    pub user_id: Uuid,
    pub tier: String,
    pub status: String,
    pub billing_cycle: String,
    pub starts_at: DateTime<Utc>,
    pub ends_at: Option<DateTime<Utc>>,
    pub cancel_at_period_end: bool,
    pub stripe_subscription_id: Option<String>,
    pub stripe_customer_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New Subscription
#[derive(Debug, Insertable, Deserialize)]
#[diesel(table_name = subscriptions)]
pub struct NewSubscription {
    pub user_id: Uuid,
    pub tier: String,
    pub status: String,
    pub billing_cycle: String,
    pub starts_at: DateTime<Utc>,
    pub ends_at: Option<DateTime<Utc>>,
    pub cancel_at_period_end: bool,
}

/// Billing Information
#[derive(Debug, Serialize, Deserialize)]
pub struct BillingInfo {
    pub customer_id: String,
    pub email: String,
    pub payment_method: PaymentMethod,
    pub address: Option<Address>,
}

/// Payment Method
#[derive(Debug, Serialize, Deserialize)]
pub struct PaymentMethod {
    pub last4: String,
    pub brand: String,
    pub exp_month: u32,
    pub exp_year: u32,
}

/// Address
#[derive(Debug, Serialize, Deserialize)]
pub struct Address {
    pub line1: String,
    pub line2: Option<String>,
    pub city: String,
    pub state: String,
    pub postal_code: String,
    pub country: String,
}

/// Subscription Usage Metrics
#[derive(Debug, Serialize, Deserialize)]
pub struct UsageMetrics {
    pub reconciliation_count: usize,
    pub reconciliation_limit: Option<usize>,
    pub storage_bytes: u64,
    pub storage_limit_bytes: u64,
    pub project_count: usize,
    pub project_limit: Option<usize>,
}

impl UsageMetrics {
    pub fn is_within_limits(&self) -> bool {
        let reconciliation_ok = match self.reconciliation_limit {
            Some(limit) => self.reconciliation_count <= limit,
            None => true,
        };
        
        let storage_ok = self.storage_bytes <= self.storage_limit_bytes;
        
        let project_ok = match self.project_limit {
            Some(limit) => self.project_count <= limit,
            None => true,
        };
        
        reconciliation_ok && storage_ok && project_ok
    }

    pub fn reconciliation_usage_percent(&self) -> Option<f64> {
        self.reconciliation_limit.map(|limit| {
            (self.reconciliation_count as f64 / limit as f64) * 100.0
        })
    }

    pub fn storage_usage_percent(&self) -> f64 {
        (self.storage_bytes as f64 / self.storage_limit_bytes as f64) * 100.0
    }
}

/// Invoice
#[derive(Debug, Serialize, Deserialize)]
pub struct Invoice {
    pub id: String,
    pub subscription_id: Uuid,
    pub amount: f64,
    pub currency: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub due_date: DateTime<Utc>,
    pub line_items: Vec<InvoiceLineItem>,
}

/// Invoice Line Item
#[derive(Debug, Serialize, Deserialize)]
pub struct InvoiceLineItem {
    pub description: String,
    pub amount: f64,
    pub quantity: usize,
}

