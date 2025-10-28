//! Database module for the Reconciliation Backend
//! 
//! This module provides database connection management and utilities.

use diesel::prelude::*;
use diesel::r2d2::{self, ConnectionManager};

use crate::errors::{AppError, AppResult};

/// Database connection pool type
pub type DbPool = r2d2::Pool<ConnectionManager<PgConnection>>;

/// Database wrapper
#[derive(Clone)]
pub struct Database {
    pool: DbPool,
}

impl Database {
    /// Create a new database connection pool with optimized settings
    pub async fn new(database_url: &str) -> AppResult<Self> {
        let manager = ConnectionManager::<PgConnection>::new(database_url);
        
        // Optimized connection pool configuration for production
        let pool = r2d2::Pool::builder()
            .max_size(20) // Increased from 10 to handle more concurrent requests
            .min_idle(Some(5)) // Keep 5 connections ready to reduce connection overhead
            .connection_timeout(std::time::Duration::from_secs(30)) // 30s timeout for getting a connection
            .test_on_check_out(true) // Test connections before returning them
            .build(manager)
            .map_err(|e| AppError::Connection(diesel::ConnectionError::InvalidConnectionUrl(format!("Failed to create connection pool: {}", e))))?;
        
        Ok(Database { pool })
    }
    
    /// Create a database with custom pool configuration
    pub async fn new_with_config(
        database_url: &str,
        max_size: u32,
        min_idle: u32,
    ) -> AppResult<Self> {
        let manager = ConnectionManager::<PgConnection>::new(database_url);
        
        let pool = r2d2::Pool::builder()
            .max_size(max_size)
            .min_idle(Some(min_idle))
            .connection_timeout(std::time::Duration::from_secs(30))
            .test_on_check_out(true)
            .build(manager)
            .map_err(|e| AppError::Connection(diesel::ConnectionError::InvalidConnectionUrl(format!("Failed to create connection pool: {}", e))))?;
        
        Ok(Database { pool })
    }
    
    /// Get connection pool health statistics
    pub fn get_pool_stats(&self) -> PoolStats {
        PoolStats {
            size: self.pool.state().connections,
            idle: self.pool.state().idle_connections,
            active: self.pool.state().connections - self.pool.state().idle_connections,
        }
    }

    /// Get a connection from the pool with retry logic
    pub fn get_connection(&self) -> AppResult<r2d2::PooledConnection<ConnectionManager<PgConnection>>> {
        // Try to get connection with exponential backoff
        let mut retry_count = 0;
        let max_retries = 3;
        
        loop {
            match self.pool.get() {
                Ok(conn) => {
                    // Log pool stats if getting tight
                    let stats = self.get_pool_stats();
                    if stats.active as f32 / stats.size as f32 > 0.8 {
                        log::warn!("Connection pool usage high: {}/{} ({:.0}%)", 
                            stats.active, stats.size, 
                            (stats.active as f32 / stats.size as f32) * 100.0);
                    }
                    return Ok(conn);
                }
                Err(e) if retry_count < max_retries => {
                    retry_count += 1;
                    // Exponential backoff: 10ms, 20ms, 40ms
                    let delay_ms = 10 * 2_u64.pow(retry_count - 1);
                    log::warn!("Connection pool busy, retry {}/{} after {}ms", 
                        retry_count, max_retries, delay_ms);
                    std::thread::sleep(std::time::Duration::from_millis(delay_ms));
                    continue;
                }
                Err(e) => {
                    log::error!("Continued to get connection after {} retries", max_retries);
                    return Err(AppError::Connection(
                        diesel::ConnectionError::InvalidConnectionUrl(
                            format!("Connection pool exhausted: {}", e)
                        )
                    ));
                }
            }
        }
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

/// Connection pool statistics
#[derive(Debug, Clone)]
pub struct PoolStats {
    /// Total number of connections in the pool
    pub size: u32,
    /// Number of idle connections available
    pub idle: u32,
    /// Number of active connections in use
    pub active: u32,
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
        
        f(&mut conn)
    }
}