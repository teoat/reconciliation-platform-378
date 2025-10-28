// Diesel Migration - Create Subscriptions Table

use diesel::prelude::*;
use diesel::pg::Pg;

#[derive(diesel::Migration)]
pub struct CreateSubscriptions;

diesel::table! {
    subscriptions (id) {
        id -> Uuid,
        user_id -> Uuid,
        tier -> Varchar,
        status -> Varchar,
        billing_cycle -> Varchar,
        starts_at -> Timestamp,
        ends_at -> Nullable<Timestamp>,
        cancel_at_period_end -> Bool,
        stripe_subscription_id -> Nullable<Varchar>,
        stripe_customer_id -> Nullable<Varchar>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

impl diesel::Migration for CreateSubscriptions {
    fn up(&self, conn: &mut PgConnection) -> diesel::MigrationResult<()> {
        diesel::sql_query(
            r#"
            CREATE TABLE IF NOT EXISTS subscriptions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                tier VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'active',
                billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
                starts_at TIMESTAMP NOT NULL DEFAULT NOW(),
                ends_at TIMESTAMP,
                cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
                stripe_subscription_id VARCHAR(255),
                stripe_customer_id VARCHAR(255),
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT unique_user_active_subscription UNIQUE (user_id, status) 
                    WHERE status = 'active'
            );

            CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
            CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
            CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
            
            COMMENT ON TABLE subscriptions IS 'User subscription management for monetization';
            "#,
        )
        .execute(conn)?;
        
        Ok(())
    }

    fn down(&self, conn: &mut PgConnection) -> diesel::MigrationResult<()> {
        diesel::sql_query("DROP TABLE IF EXISTS subscriptions CASCADE;")
            .execute(conn)?;
        
        Ok(())
    }
}

