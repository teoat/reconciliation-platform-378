//! Cashflow service module

use bigdecimal::{BigDecimal, Zero};
use diesel::dsl::sum;
use diesel::prelude::*;
use std::collections::HashMap;
use std::sync::Arc;
use uuid::Uuid;

// Add caching
use once_cell::sync::Lazy;
use std::sync::Mutex;
use redis::AsyncCommands; // Assuming Redis integration

// Static cache for categories (frequently accessed, changes infrequently)
static CATEGORY_CACHE: Lazy<Mutex<HashMap<Uuid, Vec<CashflowCategory>>>> = 
    Lazy::new(|| Mutex::new(HashMap::new()));

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::{cashflow_categories, cashflow_discrepancies, cashflow_transactions};
use crate::models::{
    CashflowCategory, CashflowDiscrepancy, CashflowTransaction, NewCashflowCategory,
    NewCashflowDiscrepancy, NewCashflowTransaction, UpdateCashflowCategory,
    UpdateCashflowDiscrepancy, UpdateCashflowTransaction,
};

diesel::allow_tables_to_appear_in_same_query!(cashflow_transactions, cashflow_categories);

/// Cashflow service
pub struct CashflowService {
    db: Arc<Database>,
    redis_client: Option<redis::Client>, // Optional Redis for distributed caching
}

impl CashflowService {
    pub fn new(db: Arc<Database>, redis_url: Option<&str>) -> Result<Self, redis::RedisError> {
        let redis_client = if let Some(url) = redis_url {
            Some(redis::Client::open(url)?)
        } else {
            None
        };

        Ok(Self { db, redis_client })
    }

    // Categories
    pub async fn list_categories(&self, project_id: Uuid, page: i64, per_page: i64) -> AppResult<(Vec<CashflowCategory>, i64)> {
        // Check cache first
        {
            let cache = CATEGORY_CACHE.lock().map_err(|e| {
                AppError::InternalServerError(format!("Cache lock poisoned: {}", e))
            })?;
            if let Some(cached) = cache.get(&project_id) {
                let total = cached.len() as i64;
                let offset = ((page - 1) * per_page) as usize;
                let end = (offset + per_page as usize).min(total as usize);
                let items = cached[offset..end].to_vec();
                return Ok((items, total));
            }
        }

        // Cache miss - query database
        let mut conn = self.db.get_connection()?;
        let offset = (page - 1) * per_page;

        // Get total count efficiently
        let total: i64 = cashflow_categories::table
            .select(cashflow_categories::id) // Only select ID for count
            .filter(cashflow_categories::project_id.eq(project_id))
            .count()
            .get_result(&mut conn)
            .map_err(AppError::Database)?;

        // Get paginated results with explicit field selection
        let items = cashflow_categories::table
            .select((
                cashflow_categories::id,
                cashflow_categories::project_id,
                cashflow_categories::name,
                cashflow_categories::description,
                cashflow_categories::category_type,
                cashflow_categories::parent_id,
                cashflow_categories::is_active,
                cashflow_categories::created_at,
                cashflow_categories::updated_at,
            ))
            .filter(cashflow_categories::project_id.eq(project_id))
            .order(cashflow_categories::name.asc())
            .limit(per_page)
            .offset(offset)
            .load::<CashflowCategory>(&mut conn)
            .map_err(AppError::Database)?;

        // Cache the full list (without pagination) for next request
        if page == 1 && per_page >= total { // Cache only if we got all results
            let mut cache = CATEGORY_CACHE.lock().map_err(|e| {
                AppError::InternalServerError(format!("Cache lock poisoned: {}", e))
            })?;
            cache.insert(project_id, items.clone());
        }

        // Optional: Cache in Redis for distributed access
        if let Some(ref client) = self.redis_client {
            let mut con = client
                .get_multiplexed_async_connection()
                .await
                .map_err(|e| AppError::Internal(format!("Redis connection error: {}", e)))?;
            let cache_key = format!("categories:project:{}", project_id);
            con.set_ex::<_, _, ()>(
                &cache_key,
                serde_json::to_string(&items)?,
                3600 // 1 hour TTL
            )
            .await
            .map_err(|e| AppError::Internal(format!("Redis cache error: {}", e)))?;
        }

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

    pub async fn create_transaction(&self, new_transaction: NewCashflowTransaction) -> AppResult<CashflowTransaction> {
        let mut conn = self.db.get_connection()?;
        
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

    // Batch transaction operations
    pub async fn create_multiple_transactions(
        &self, 
        transactions: Vec<NewCashflowTransaction>
    ) -> AppResult<Vec<CashflowTransaction>> {
        if transactions.is_empty() {
            return Ok(vec![]);
        }

        let mut conn = self.db.get_connection()?;
        
        // Extract project_ids for batch filtering
        let _project_ids: Vec<Uuid> = transactions.iter()
            .map(|t| t.project_id)
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();

        // Batch insert with explicit selection
        let result = diesel::insert_into(cashflow_transactions::table)
            .values(&transactions)
            .get_results::<CashflowTransaction>(&mut conn)
            .map_err(AppError::Database)?;

        Ok(result)
    }

    // Optimized analysis with aggregated queries
    pub async fn get_analysis(&self, project_id: Uuid) -> AppResult<serde_json::Value> {
        let mut conn = self.db.get_connection()?;
        
        let inflow: Option<BigDecimal> = cashflow_transactions::table
            .inner_join(cashflow_categories::table)
            .filter(cashflow_transactions::project_id.eq(project_id))
            .filter(cashflow_categories::category_type.eq("income"))
            .select(sum(cashflow_transactions::amount))
            .first(&mut conn)
            .map_err(AppError::Database)?;

        let outflow: Option<BigDecimal> = cashflow_transactions::table
            .inner_join(cashflow_categories::table)
            .filter(cashflow_transactions::project_id.eq(project_id))
            .filter(cashflow_categories::category_type.eq("expense"))
            .select(sum(cashflow_transactions::amount))
            .first(&mut conn)
            .map_err(AppError::Database)?;

        let inflow = inflow.unwrap_or_else(BigDecimal::zero);
        let outflow = outflow.unwrap_or_else(BigDecimal::zero);

        Ok(serde_json::json!({
            "total_inflow": inflow,
            "total_outflow": outflow,
            "net_cashflow": &inflow - &outflow,
            "cashflow_ratio": if outflow != BigDecimal::zero() { &inflow / &outflow } else { BigDecimal::zero() },
        }))
    }
}

