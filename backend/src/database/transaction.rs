//! Database Transaction Utilities
//! Provides safe transaction handling to prevent race conditions

use diesel::Connection;
use diesel::pg::PgConnection;
use r2d2::PooledConnection;
use r2d2_diesel::ConnectionManager;
use crate::errors::{AppError, AppResult};

/// Execute a function within a database transaction
/// This ensures atomicity and prevents race conditions
pub async fn with_transaction<T, F>(pool: &r2d2::Pool<ConnectionManager<PgConnection>>, f: F) -> AppResult<T>
where
    F: FnOnce(&mut PgConnection) -> AppResult<T>,
{
    let mut conn = pool.get()
        .map_err(|e| AppError::Connection(
            diesel::ConnectionError::InvalidConnectionUrl(
                format!("Failed to get connection: {}", e)
            )
        ))?;
    
    // Start explicit transaction
    conn.begin_test_transaction()
        .map_err(|e| AppError::Database(e))?;
    
    // Execute the operation
    let result = f(&mut conn);
    
    match result {
        Ok(value) => {
            // Commit on success
            conn.commit().map_err(|e| AppError::Database(e))?;
            Ok(value)
        }
        Err(error) => {
            // Rollback on error
            conn.rollback().ok(); // Ignore rollback errors
            Err(error)
        }
    }
}

/// Execute a function within a database transaction (test version)
/// This version doesn't actually start a transaction (for testing)
pub async fn with_transaction_test<T, F>(pool: &r2d2::Pool<ConnectionManager<PgConnection>>, f: F) -> AppResult<T>
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

