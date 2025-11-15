//! Database Transaction Utilities
//! Provides safe transaction handling to prevent race conditions

use diesel::Connection;
use diesel::pg::PgConnection;
use diesel::r2d2::ConnectionManager;
use crate::errors::{AppError, AppResult};

/// Execute a function within a database transaction
/// This ensures atomicity and prevents race conditions
/// 
/// **CRITICAL**: Uses real transaction (not test transaction) for production safety
/// 
/// Note: Diesel operations are blocking but typically fast (<10ms), so blocking the async
/// runtime is acceptable. For truly long-running operations, consider using spawn_blocking
/// at the call site.
pub async fn with_transaction<T, F>(pool: &diesel::r2d2::Pool<ConnectionManager<PgConnection>>, f: F) -> AppResult<T>
where
    F: FnOnce(&mut PgConnection) -> AppResult<T>,
{
    // Get connection synchronously (r2d2 handles pooling efficiently)
    let mut conn = pool.get()
        .map_err(|e| AppError::Connection(
            diesel::ConnectionError::InvalidConnectionUrl(
                format!("Failed to get connection: {}", e)
            )
        ))?;
    
    // Use Diesel's built-in transaction support (proper production transaction)
    // This is blocking but Diesel transactions are fast and r2d2 pool handles contention well
    tokio::task::block_in_place(|| {
        conn.transaction(|tx| {
            // Execute the operation within transaction
            // Convert AppResult to Result<_, diesel::result::Error> for Diesel
            match f(tx) {
                Ok(val) => Ok(val),
                Err(e) => match e {
                    AppError::Database(err) => Err(err),
                    _ => {
                        // For non-database errors in transaction, convert to QueryBuilderError
                        // This should be rare - most transaction operations should return Database errors
                        log::error!("Non-database error in transaction: {}", e);
                        Err(diesel::result::Error::QueryBuilderError(
                            format!("Transaction error: {}", e).into()
                        ))
                    }
                },
            }
        })
        .map_err(AppError::Database)
    })
}

/// Execute a function within a database transaction (test version)
/// This version doesn't actually start a transaction (for testing)
pub async fn with_transaction_test<T, F>(pool: &diesel::r2d2::Pool<ConnectionManager<PgConnection>>, f: F) -> AppResult<T>
where
    F: FnOnce(&mut PgConnection) -> AppResult<T>,
{
    let mut conn = pool.get()
        .map_err(|e| AppError::Connection(
            diesel::ConnectionError::InvalidConnectionUrl(
                format!("Failed to get connection: {}", e)
            )
        ))?;
    
    // No transaction for testing
    f(&mut conn)
}

