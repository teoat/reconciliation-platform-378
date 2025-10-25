//! Database module for the Reconciliation Backend
//! 
//! This module provides database connection management and utilities.

use diesel::prelude::*;
use diesel::r2d2::{self, ConnectionManager};
use std::env;

use crate::errors::{AppError, AppResult};

/// Database connection pool type
pub type DbPool = r2d2::Pool<ConnectionManager<PgConnection>>;

/// Database wrapper
#[derive(Clone)]
pub struct Database {
    pool: DbPool,
}

impl Database {
    /// Create a new database connection
    pub async fn new(database_url: &str) -> AppResult<Self> {
        let manager = ConnectionManager::<PgConnection>::new(database_url);
        let pool = r2d2::Pool::builder()
            .max_size(10)
            .build(manager)
            .map_err(|e| AppError::Connection(diesel::ConnectionError::InvalidConnectionUrl(format!("Failed to create connection pool: {}", e))))?;
        
        Ok(Database { pool })
    }

    /// Get a connection from the pool
    pub fn get_connection(&self) -> AppResult<r2d2::PooledConnection<ConnectionManager<PgConnection>>> {
        self.pool.get()
            .map_err(|e| AppError::Connection(diesel::ConnectionError::InvalidConnectionUrl(format!("Failed to get connection: {}", e))))
    }

    /// Get the connection pool
    pub fn get_pool(&self) -> &DbPool {
        &self.pool
    }

    /// Run database migrations
    pub async fn run_migrations(&self) -> AppResult<()> {
        // For now, just return Ok
        // In a real implementation, you would run Diesel migrations here
        Ok(())
    }
}

/// Database utilities
pub mod utils {
    use super::*;
    
    /// Execute a function within a database transaction
    pub async fn with_transaction<F, R>(pool: &DbPool, f: F) -> AppResult<R>
    where
        F: FnOnce(&mut PgConnection) -> AppResult<R>,
    {
        let mut conn = pool.get()
            .map_err(|e| AppError::Connection(diesel::ConnectionError::InvalidConnectionUrl(format!("Failed to get connection: {}", e))))?;
        
        conn.transaction(|conn| f(conn))
            .map_err(|e| AppError::Database(e))
    }
}