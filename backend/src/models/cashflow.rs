//! Cashflow models

use bigdecimal::BigDecimal;
use chrono::{DateTime, NaiveDate, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::schema::{cashflow_categories, cashflow_discrepancies, cashflow_transactions};

/// Cashflow category model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = cashflow_categories)]
pub struct CashflowCategory {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category_type: String,
    pub parent_id: Option<Uuid>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New cashflow category (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = cashflow_categories)]
pub struct NewCashflowCategory {
    pub project_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category_type: String,
    pub parent_id: Option<Uuid>,
    pub is_active: bool,
}

/// Update cashflow category
#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = cashflow_categories)]
pub struct UpdateCashflowCategory {
    pub name: Option<String>,
    pub description: Option<String>,
    pub is_active: Option<bool>,
}

/// Cashflow transaction model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = cashflow_transactions)]
pub struct CashflowTransaction {
    pub id: Uuid,
    pub project_id: Uuid,
    pub category_id: Option<Uuid>,
    pub amount: BigDecimal,
    pub currency: String,
    pub transaction_date: NaiveDate,
    pub description: Option<String>,
    pub reference_number: Option<String>,
    pub metadata: serde_json::Value,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New cashflow transaction (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = cashflow_transactions)]
pub struct NewCashflowTransaction {
    pub project_id: Uuid,
    pub category_id: Option<Uuid>,
    pub amount: BigDecimal,
    pub currency: String,
    pub transaction_date: NaiveDate,
    pub description: Option<String>,
    pub reference_number: Option<String>,
    pub metadata: serde_json::Value,
    pub created_by: Option<Uuid>,
}

/// Update cashflow transaction
#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = cashflow_transactions)]
pub struct UpdateCashflowTransaction {
    pub category_id: Option<Option<Uuid>>,
    pub amount: Option<BigDecimal>,
    pub description: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

/// Cashflow discrepancy model
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = cashflow_discrepancies)]
pub struct CashflowDiscrepancy {
    pub id: Uuid,
    pub project_id: Uuid,
    pub transaction_a_id: Option<Uuid>,
    pub transaction_b_id: Option<Uuid>,
    pub discrepancy_type: String,
    pub amount_difference: BigDecimal,
    pub description: Option<String>,
    pub status: String,
    pub resolved_by: Option<Uuid>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub resolution_notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New cashflow discrepancy (for inserts)
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = cashflow_discrepancies)]
pub struct NewCashflowDiscrepancy {
    pub project_id: Uuid,
    pub transaction_a_id: Option<Uuid>,
    pub transaction_b_id: Option<Uuid>,
    pub discrepancy_type: String,
    pub amount_difference: BigDecimal,
    pub description: Option<String>,
    pub status: String,
}

/// Update cashflow discrepancy
#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = cashflow_discrepancies)]
pub struct UpdateCashflowDiscrepancy {
    pub status: Option<String>,
    pub resolved_by: Option<Option<Uuid>>,
    pub resolved_at: Option<Option<DateTime<Utc>>>,
    pub resolution_notes: Option<String>,
}

