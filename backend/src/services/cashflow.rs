//! Cashflow service module

use bigdecimal::BigDecimal;
use diesel::prelude::*;
use diesel::dsl::sum;
use std::sync::Arc;
use uuid::Uuid;

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::{cashflow_categories, cashflow_discrepancies, cashflow_transactions};
use crate::models::{
    CashflowCategory, CashflowDiscrepancy, CashflowTransaction, NewCashflowCategory,
    NewCashflowDiscrepancy, NewCashflowTransaction, UpdateCashflowCategory,
    UpdateCashflowDiscrepancy, UpdateCashflowTransaction,
};

allow_tables_to_appear_in_same_query!(cashflow_transactions, cashflow_categories);

/// Cashflow service
pub struct CashflowService {
    db: Arc<Database>,
}

impl CashflowService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    // Categories
    pub async fn list_categories(&self, project_id: Uuid, page: i64, per_page: i64) -> AppResult<(Vec<CashflowCategory>, i64)> {
        let mut conn = self.db.get_connection()?;
        let offset = (page - 1) * per_page;

        let total: i64 = cashflow_categories::table
            .filter(cashflow_categories::project_id.eq(project_id))
            .count()
            .get_result(&mut conn)
            .map_err(AppError::Database)?;

        let items = cashflow_categories::table
            .filter(cashflow_categories::project_id.eq(project_id))
            .order(cashflow_categories::name.asc())
            .limit(per_page)
            .offset(offset)
            .select(CashflowCategory::as_select())
            .load(&mut conn)
            .map_err(AppError::Database)?;

        Ok((items, total))
    }

    pub async fn get_category(&self, category_id: Uuid) -> AppResult<CashflowCategory> {
        let mut conn = self.db.get_connection()?;
        cashflow_categories::table
            .find(category_id)
            .select(CashflowCategory::as_select())
            .first(&mut conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => AppError::NotFound(format!("Category {} not found", category_id)),
                _ => AppError::Database(e),
            })
    }

    pub async fn create_category(&self, new_category: NewCashflowCategory) -> AppResult<CashflowCategory> {
        let mut conn = self.db.get_connection()?;
        diesel::insert_into(cashflow_categories::table)
            .values(&new_category)
            .get_result::<CashflowCategory>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn update_category(&self, category_id: Uuid, update: UpdateCashflowCategory) -> AppResult<CashflowCategory> {
        let mut conn = self.db.get_connection()?;
        diesel::update(cashflow_categories::table.find(category_id))
            .set(&update)
            .get_result::<CashflowCategory>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn delete_category(&self, category_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        diesel::delete(cashflow_categories::table.find(category_id))
            .execute(&mut conn)
            .map_err(AppError::Database)?;
        Ok(())
    }

    // Transactions
    pub async fn list_transactions(&self, project_id: Uuid, page: i64, per_page: i64) -> AppResult<(Vec<CashflowTransaction>, i64)> {
        let mut conn = self.db.get_connection()?;
        let offset = (page - 1) * per_page;

        let total: i64 = cashflow_transactions::table
            .filter(cashflow_transactions::project_id.eq(project_id))
            .count()
            .get_result(&mut conn)
            .map_err(AppError::Database)?;

        let items = cashflow_transactions::table
            .filter(cashflow_transactions::project_id.eq(project_id))
            .order(cashflow_transactions::transaction_date.desc())
            .limit(per_page)
            .offset(offset)
            .select(CashflowTransaction::as_select())
            .load(&mut conn)
            .map_err(AppError::Database)?;

        Ok((items, total))
    }

    pub async fn get_transaction(&self, transaction_id: Uuid) -> AppResult<CashflowTransaction> {
        let mut conn = self.db.get_connection()?;
        cashflow_transactions::table
            .find(transaction_id)
            .select(CashflowTransaction::as_select())
            .first(&mut conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => AppError::NotFound(format!("Transaction {} not found", transaction_id)),
                _ => AppError::Database(e),
            })
    }

    pub async fn create_transaction(&self, mut new_transaction: NewCashflowTransaction) -> AppResult<CashflowTransaction> {
        let mut conn = self.db.get_connection()?;
        
        // Fix Date<Utc> to NaiveDate
        if let Some(date_utc) = new_transaction.transaction_date.date() {
            new_transaction.transaction_date = date_utc;
        }
        
        diesel::insert_into(cashflow_transactions::table)
            .values(&new_transaction)
            .get_result(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn update_transaction(&self, transaction_id: Uuid, update: UpdateCashflowTransaction) -> AppResult<CashflowTransaction> {
        let mut conn = self.db.get_connection()?;
        diesel::update(cashflow_transactions::table.find(transaction_id))
            .set(&update)
            .get_result(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn delete_transaction(&self, transaction_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        diesel::delete(cashflow_transactions::table.find(transaction_id))
            .execute(&mut conn)
            .map_err(AppError::Database)?;
        Ok(())
    }

    // Discrepancies
    pub async fn list_discrepancies(&self, project_id: Uuid, page: i64, per_page: i64) -> AppResult<(Vec<CashflowDiscrepancy>, i64)> {
        let mut conn = self.db.get_connection()?;
        let offset = (page - 1) * per_page;

        let total: i64 = cashflow_discrepancies::table
            .filter(cashflow_discrepancies::project_id.eq(project_id))
            .count()
            .get_result(&mut conn)
            .map_err(AppError::Database)?;

        let items = cashflow_discrepancies::table
            .filter(cashflow_discrepancies::project_id.eq(project_id))
            .order(cashflow_discrepancies::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .select(CashflowDiscrepancy::as_select())
            .load(&mut conn)
            .map_err(AppError::Database)?;

        Ok((items, total))
    }

    pub async fn get_discrepancy(&self, discrepancy_id: Uuid) -> AppResult<CashflowDiscrepancy> {
        let mut conn = self.db.get_connection()?;
        cashflow_discrepancies::table
            .find(discrepancy_id)
            .select(CashflowDiscrepancy::as_select())
            .first(&mut conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => AppError::NotFound(format!("Discrepancy {} not found", discrepancy_id)),
                _ => AppError::Database(e),
            })
    }

    pub async fn create_discrepancy(&self, new_discrepancy: NewCashflowDiscrepancy) -> AppResult<CashflowDiscrepancy> {
        let mut conn = self.db.get_connection()?;
        diesel::insert_into(cashflow_discrepancies::table)
            .values(&new_discrepancy)
            .get_result::<CashflowDiscrepancy>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn update_discrepancy(&self, discrepancy_id: Uuid, update: UpdateCashflowDiscrepancy) -> AppResult<CashflowDiscrepancy> {
        let mut conn = self.db.get_connection()?;
        diesel::update(cashflow_discrepancies::table.find(discrepancy_id))
            .set(&update)
            .get_result::<CashflowDiscrepancy>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn resolve_discrepancy(&self, discrepancy_id: Uuid, resolved_by: Uuid, notes: Option<String>) -> AppResult<CashflowDiscrepancy> {
        let mut conn = self.db.get_connection()?;
        use chrono::Utc;
        diesel::update(cashflow_discrepancies::table.find(discrepancy_id))
            .set((
                cashflow_discrepancies::status.eq("resolved"),
                cashflow_discrepancies::resolved_by.eq(Some(resolved_by)),
                cashflow_discrepancies::resolved_at.eq(Some(Utc::now())),
                cashflow_discrepancies::resolution_notes.eq(notes),
            ))
            .get_result::<CashflowDiscrepancy>(&mut conn)
            .map_err(AppError::Database)
    }

    // Fix analysis query
    pub async fn get_analysis(&self, project_id: Uuid) -> AppResult<serde_json::Value> {
        let mut conn = self.db.get_connection()?;
        
        // Calculate total inflow
        let total_inflow: Option<BigDecimal> = cashflow_transactions::table
            .inner_join(cashflow_categories::table.on(cashflow_categories::id.eq(cashflow_transactions::category_id)))
            .filter(cashflow_transactions::project_id.eq(project_id))
            .filter(cashflow_categories::category_type.eq("income"))
            .select(sum(cashflow_transactions::amount))
            .first(&mut conn)
            .map_err(AppError::Database)?;

        // Calculate total outflow
        let total_outflow: Option<BigDecimal> = cashflow_transactions::table
            .inner_join(cashflow_categories::table.on(cashflow_categories::id.eq(cashflow_transactions::category_id)))
            .filter(cashflow_transactions::project_id.eq(project_id))
            .filter(cashflow_categories::category_type.eq("expense"))
            .select(sum(cashflow_transactions::amount))
            .first(&mut conn)
            .map_err(AppError::Database)?;

        let inflow = total_inflow.unwrap_or_else(BigDecimal::zero);
        let outflow = total_outflow.unwrap_or_else(BigDecimal::zero);

        Ok(serde_json::json!({
            "total_inflow": inflow,
            "total_outflow": outflow,
            "net_cashflow": &inflow - &outflow,
        }))
    }
}

