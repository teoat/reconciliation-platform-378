//! Database module for the Reconciliation Backend
//!
//! This module provides database connection management and utilities.

use diesel::prelude::*;
use diesel::r2d2::{self, ConnectionManager};
use std::sync::Arc;
use std::time::Duration;

use crate::errors::{AppError, AppResult};

/// Database connection pool type
pub type DbPool = r2d2::Pool<ConnectionManager<PgConnection>>;

/// Database wrapper - now uses Arc for efficient sharing across services
#[derive(Clone)]
pub struct Database {
    pool: Arc<DbPool>,
    resilience: Option<Arc<crate::services::resilience::ResilienceManager>>,
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
            .map_err(|e| {
                AppError::Connection(diesel::ConnectionError::InvalidConnectionUrl(format!(
                    "Failed to create connection pool: {}",
                    e
                )))
            })?;

        Ok(Database {
            pool: Arc::new(pool),
            resilience: None,
        })
    }

    /// Create a database with resilience manager (circuit breaker enabled)
    pub async fn new_with_resilience(
        database_url: &str,
        resilience: Arc<crate::services::resilience::ResilienceManager>,
    ) -> AppResult<Self> {
        let manager = ConnectionManager::<PgConnection>::new(database_url);

        let pool = r2d2::Pool::builder()
            .max_size(20)
            .min_idle(Some(5))
            .connection_timeout(std::time::Duration::from_secs(30))
            .test_on_check_out(true)
            .build(manager)
            .map_err(|e| {
                AppError::Connection(diesel::ConnectionError::InvalidConnectionUrl(format!(
                    "Failed to create connection pool: {}",
                    e
                )))
            })?;

        Ok(Database {
            pool: Arc::new(pool),
            resilience: Some(resilience),
        })
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
            .map_err(|e| {
                AppError::Connection(diesel::ConnectionError::InvalidConnectionUrl(format!(
                    "Failed to create connection pool: {}",
                    e
                )))
            })?;

        Ok(Database {
            pool: Arc::new(pool),
            resilience: None,
        })
    }

    /// Set resilience manager for circuit breaker support
    pub fn with_resilience(
        mut self,
        resilience: Arc<crate::services::resilience::ResilienceManager>,
    ) -> Self {
        self.resilience = Some(resilience);
        self
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
    /// This is the synchronous version for backward compatibility
    pub fn get_connection(
        &self,
    ) -> AppResult<r2d2::PooledConnection<ConnectionManager<PgConnection>>> {
        // Try to get connection with exponential backoff
        let mut retry_count = 0;
        let max_retries = 3;

        loop {
            match self.pool.get() {
                Ok(conn) => {
                    // Update Prometheus metrics
                    let stats = self.get_pool_stats();
                    crate::monitoring::metrics::update_pool_metrics(
                        stats.active as usize,
                        stats.idle as usize,
                        stats.size as usize,
                    );

                    // Log pool stats if getting tight
                    if stats.active as f32 / stats.size as f32 > 0.8 {
                        log::warn!(
                            "Connection pool usage high: {}/{} ({:.0}%)",
                            stats.active,
                            stats.size,
                            (stats.active as f32 / stats.size as f32) * 100.0
                        );
                    }
                    return Ok(conn);
                }
                Err(e) if retry_count < max_retries => {
                    retry_count += 1;
                    // Exponential backoff: 10ms, 20ms, 40ms
                    let delay_ms = 10 * 2_u64.pow(retry_count - 1);
                    log::warn!(
                        "Connection pool busy, retry {}/{} after {}ms",
                        retry_count,
                        max_retries,
                        delay_ms
                    );
                    // Avoid starving Tokio's async runtime threads if present
                    let delay = Duration::from_millis(delay_ms);
                    if tokio::runtime::Handle::try_current().is_ok() {
                        // If inside a Tokio runtime, move blocking sleep to blocking pool
                        tokio::task::block_in_place(|| std::thread::sleep(delay));
                    } else {
                        // Fallback when not in a Tokio runtime
                        std::thread::sleep(delay);
                    }
                    continue;
                }
                Err(e) => {
                    log::error!("Connection pool exhausted after {} retries", max_retries);
                    // Record pool exhaustion metric for alerting
                    crate::monitoring::metrics::record_pool_exhaustion();
                    return Err(AppError::Connection(
                        diesel::ConnectionError::InvalidConnectionUrl(format!(
                            "Connection pool exhausted: {}",
                            e
                        )),
                    ));
                }
            }
        }
    }

    /// Get a connection with circuit breaker protection (async)
    /// Use this method when resilience manager is configured
    pub async fn get_connection_async(
        &self,
    ) -> AppResult<r2d2::PooledConnection<ConnectionManager<PgConnection>>> {
        // If resilience manager is available, use circuit breaker
        if let Some(resilience) = &self.resilience {
            return resilience
                .execute_database(async {
                    // Wrap the sync call in async block
                    tokio::task::spawn_blocking({
                        let pool = Arc::clone(&self.pool);
                        move || pool.get()
                    })
                    .await
                    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
                    .map_err(|e| {
                        AppError::Connection(diesel::ConnectionError::InvalidConnectionUrl(
                            format!("Failed to get connection: {}", e),
                        ))
                    })
                })
                .await;
        }

        // Fallback to sync method if no resilience manager
        tokio::task::spawn_blocking({
            let db = self.clone();
            move || db.get_connection()
        })
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
    }

    /// Execute a database operation with circuit breaker protection
    pub async fn execute_with_resilience<F, T>(&self, operation: F) -> AppResult<T>
    where
        F: std::future::Future<Output = AppResult<T>> + Send,
        T: Send,
    {
        if let Some(resilience) = &self.resilience {
            resilience.execute_database(operation).await
        } else {
            operation.await
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

/// Database transaction utilities
pub mod transaction;

/// Database utilities
/// NOTE: For transactions, use database::transaction::with_transaction() instead
/// This utils module is reserved for future database utilities if needed
pub mod utils {
    // Previously contained a fake transaction function - removed
    // Use database::transaction::with_transaction() for real transactions
}
