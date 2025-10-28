// Database Schema - Add subscriptions table
// This extends the existing schema

pub mod subscriptions {
    diesel::table! {
        subscriptions (id) {
            id -> diesel::sql_types::Uuid,
            user_id -> diesel::sql_types::Uuid,
            tier -> diesel::sql_types::Varchar,
            status -> diesel::sql_types::Varchar,
            billing_cycle -> diesel::sql_types::Varchar,
            starts_at -> diesel::sql_types::Timestamp,
            ends_at -> diesel::sql_types::Nullable<diesel::sql_types::Timestamp>,
            cancel_at_period_end -> diesel::sql_types::Bool,
            stripe_subscription_id -> diesel::sql_types::Nullable<diesel::sql_types::Varchar>,
            stripe_customer_id -> diesel::sql_types::Nullable<diesel::sql_types::Varchar>,
            created_at -> diesel::sql_types::Timestamp,
            updated_at -> diesel::sql_types::Timestamp,
        }
    }
}

