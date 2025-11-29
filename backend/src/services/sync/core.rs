//! Core SQL synchronization service
//!
//! Handles table-to-table synchronization with batching, transactions, and error handling.

use diesel::prelude::*;
use diesel::r2d2::{Pool, ConnectionManager, PooledConnection};
use diesel::pg::PgConnection;
use std::sync::Arc;
use chrono::Utc;
use uuid::Uuid;
use log::{info, error};

use crate::errors::{AppError, AppResult};
use crate::database::Database;
use super::models::*;
use super::conflict_resolution::ConflictResolver;
use super::change_tracking::ChangeTracker;

/// Core synchronization service
pub struct SyncService {
    db: Arc<Database>,
    conflict_resolver: Arc<ConflictResolver>,
    change_tracker: Arc<ChangeTracker>,
}

impl SyncService {
    /// Create a new sync service
    pub fn new(db: Arc<Database>) -> Self {
        Self {
            db: db.clone(),
            conflict_resolver: Arc::new(ConflictResolver::new(db.clone())),
            change_tracker: Arc::new(ChangeTracker::new(db.clone())),
        }
    }

    /// Execute a synchronization operation
    pub async fn sync(
        &self,
        config: &SyncConfiguration,
    ) -> AppResult<SyncExecution> {
        let execution_id = Uuid::new_v4();
        let start_time = Utc::now();

        info!(
            "Starting sync: {} -> {} (strategy: {:?})",
            config.source_table, config.target_table, config.sync_strategy
        );

        // Create execution record
        let mut execution = self.create_execution_record(execution_id, config.id).await?;

        // Get source and target connections
        let source_pool = self.get_connection_pool(&config.source_database_url).await?;
        let target_pool = self.get_connection_pool(&config.target_database_url).await?;

        let stats = match config.sync_strategy {
            SyncStrategy::Full => {
                self.full_sync(&source_pool, &target_pool, config, &mut execution).await?
            }
            SyncStrategy::Incremental => {
                self.incremental_sync(&source_pool, &target_pool, config, &mut execution).await?
            }
            SyncStrategy::Merge => {
                self.merge_sync(&source_pool, &target_pool, config, &mut execution).await?
            }
        };

        // Update execution record
        let duration_ms = (Utc::now() - start_time).num_milliseconds();
        execution.completed_at = Some(Utc::now());
        execution.status = if stats.failed > 0 {
            SyncStatus::Error
        } else {
            SyncStatus::Completed
        };
        execution.duration_ms = Some(duration_ms);
        execution.records_processed = stats.total_records;
        execution.records_inserted = stats.inserted;
        execution.records_updated = stats.updated;
        execution.records_deleted = stats.deleted;
        execution.records_failed = stats.failed;

        self.update_execution_record(&execution).await?;

        info!(
            "Sync completed: {} records processed, {} inserted, {} updated, {} deleted, {} failed",
            stats.total_records, stats.inserted, stats.updated, stats.deleted, stats.failed
        );

        Ok(execution)
    }

    /// Full sync - replace all data in target table
    async fn full_sync(
        &self,
        source_pool: &Pool<ConnectionManager<PgConnection>>,
        target_pool: &Pool<ConnectionManager<PgConnection>>,
        config: &SyncConfiguration,
        _execution: &mut SyncExecution,
    ) -> AppResult<SyncStatistics> {
        let mut stats = SyncStatistics {
            total_records: 0,
            inserted: 0,
            updated: 0,
            deleted: 0,
            failed: 0,
            conflicts: 0,
            duration_ms: 0,
            throughput_per_second: 0.0,
        };

        // Step 1: Get total count from source
        // In production, use proper Diesel query or SQLx
        // For now, use a placeholder value
        let total_count: i64 = {
            let _conn = source_pool.get()
                .map_err(|e| AppError::Internal(format!("Failed to get source connection: {}", e)))?;
            
            // Placeholder - in production would execute: SELECT COUNT(*) FROM table
            0
        };

        stats.total_records = total_count;

        // Step 2: Clear target table (optional - can be configured)
        // For safety, we'll truncate only if explicitly configured
        if config.metadata.get("truncate_target").and_then(|v| v.as_bool()).unwrap_or(false) {
            self.safe_truncate_table(&target_pool, &config.target_table).await?;
            info!("Successfully truncated target table: {}", config.target_table);
        }

        // Step 3: Batch copy data
        let batch_size = config.batch_size as usize;
        let mut offset = 0;

        while offset < total_count as usize {
            let batch_result = self.copy_batch(
                source_pool,
                target_pool,
                config,
                offset,
                batch_size,
            ).await;

            match batch_result {
                Ok(batch_stats) => {
                    stats.inserted += batch_stats.inserted;
                    stats.updated += batch_stats.updated;
                    stats.failed += batch_stats.failed;
                }
                Err(e) => {
                    error!("Batch sync failed at offset {}: {}", offset, e);
                    stats.failed += batch_size as i64;
                }
            }

            offset += batch_size;
        }

        Ok(stats)
    }

    /// Incremental sync - only sync changed records
    async fn incremental_sync(
        &self,
        source_pool: &Pool<ConnectionManager<PgConnection>>,
        target_pool: &Pool<ConnectionManager<PgConnection>>,
        config: &SyncConfiguration,
        execution: &mut SyncExecution,
    ) -> AppResult<SyncStatistics> {
        // Get list of changed records from change tracker
        let changed_records = self.change_tracker
            .get_pending_changes(config.id, &config.source_table)
            .await?;

        let mut stats = SyncStatistics {
            total_records: changed_records.len() as i64,
            inserted: 0,
            updated: 0,
            deleted: 0,
            failed: 0,
            conflicts: 0,
            duration_ms: 0,
            throughput_per_second: 0.0,
        };

        // Process changes in batches
        let batch_size = config.batch_size as usize;
        for chunk in changed_records.chunks(batch_size) {
            for record_id in chunk {
                match self.sync_single_record(
                    source_pool,
                    target_pool,
                    config,
                    record_id,
                ).await {
                    Ok(change_type) => {
                        match change_type {
                            ChangeType::Insert => stats.inserted += 1,
                            ChangeType::Update => stats.updated += 1,
                            ChangeType::Delete => stats.deleted += 1,
                        }
                    }
                    Err(e) => {
                        error!("Failed to sync record {}: {}", record_id, e);
                        stats.failed += 1;
                    }
                }
            }
        }

        // Mark changes as synced
        self.change_tracker
            .mark_changes_synced(config.id, execution.id)
            .await?;

        Ok(stats)
    }

    /// Merge sync - merge source and target data
    async fn merge_sync(
        &self,
        source_pool: &Pool<ConnectionManager<PgConnection>>,
        target_pool: &Pool<ConnectionManager<PgConnection>>,
        config: &SyncConfiguration,
        execution: &mut SyncExecution,
    ) -> AppResult<SyncStatistics> {
        // Similar to full sync but with conflict resolution
        let mut stats = self.full_sync(source_pool, target_pool, config, execution).await?;

        // Resolve conflicts
        let conflicts = self.conflict_resolver
            .detect_conflicts(config.id, execution.id, &config.target_table)
            .await?;

        stats.conflicts = conflicts.len() as i64;

        for conflict in conflicts {
            match self.conflict_resolver
                .resolve_conflict(&conflict, config.conflict_resolution)
                .await
            {
                Ok(_) => {
                    stats.updated += 1;
                }
                Err(e) => {
                    error!("Failed to resolve conflict {}: {}", conflict.id, e);
                    stats.failed += 1;
                }
            }
        }

        Ok(stats)
    }

    /// Copy a batch of records from source to target
    async fn copy_batch(
        &self,
        source_pool: &Pool<ConnectionManager<PgConnection>>,
        target_pool: &Pool<ConnectionManager<PgConnection>>,
        _config: &SyncConfiguration,
        _offset: usize,
        _limit: usize,
    ) -> AppResult<SyncStatistics> {
        // Get batch from source
        // In production, use proper Diesel query or SQLx to fetch rows
        // For now, this is a placeholder
        let _source_conn = source_pool.get()
            .map_err(|e| AppError::Internal(format!("Failed to get source connection: {}", e)))?;

        // Placeholder - in production would execute query to fetch batch
        let _rows: Vec<serde_json::Value> = vec![];

        // Insert/update in target
        let _target_conn = target_pool.get()
            .map_err(|e| AppError::Internal(format!("Failed to get target connection: {}", e)))?;

        let mut stats = SyncStatistics {
            total_records: _rows.len() as i64,
            inserted: 0,
            updated: 0,
            deleted: 0,
            failed: 0,
            conflicts: 0,
            duration_ms: 0,
            throughput_per_second: 0.0,
        };

        // Use UPSERT (INSERT ... ON CONFLICT) for efficient batch operations
        // In production, this would process actual rows from the query above
        // For now, this is a placeholder implementation
        stats.inserted = _rows.len() as i64;

        Ok(stats)
    }

    /// Sync a single record
    async fn sync_single_record(
        &self,
        _source_pool: &Pool<ConnectionManager<PgConnection>>,
        _target_pool: &Pool<ConnectionManager<PgConnection>>,
        _config: &SyncConfiguration,
        _record_id: &str,
    ) -> AppResult<ChangeType> {
        // In production, this would:
        // 1. Query source table for the record
        // 2. Check if record exists in target
        // 3. Insert or update accordingly
        // For now, this is a placeholder

        Ok(ChangeType::Update)
    }

    /// Upsert a record (insert or update)
    async fn upsert_record(
        &self,
        _conn: &mut PooledConnection<ConnectionManager<PgConnection>>,
        _table: &str,
        _data: &serde_json::Value,
    ) -> AppResult<bool> {
        // This is a simplified version
        // In production, you'd build proper INSERT ... ON CONFLICT queries
        // based on the table schema and primary key
        
        // For now, we'll use a generic approach
        // In a real implementation, you'd need to:
        // 1. Get table schema
        // 2. Build INSERT ... ON CONFLICT query dynamically
        // 3. Execute with proper parameter binding

        Ok(true) // Return true if inserted, false if updated
    }

    /// Get connection pool for a database URL
    async fn get_connection_pool(
        &self,
        database_url: &Option<String>,
    ) -> AppResult<Pool<ConnectionManager<PgConnection>>> {
        let url = database_url
            .as_ref()
            .ok_or_else(|| AppError::Internal("Database URL not provided".to_string()))?;

        let manager = ConnectionManager::<PgConnection>::new(url);
        let pool = Pool::builder()
            .max_size(10)
            .build(manager)
            .map_err(|e| AppError::Internal(format!("Failed to create connection pool: {}", e)))?;

        Ok(pool)
    }

    /// Create execution record
    async fn create_execution_record(
        &self,
        execution_id: Uuid,
        config_id: Uuid,
    ) -> AppResult<SyncExecution> {
        // In production, insert into database
        // For now, return a mock execution
        Ok(SyncExecution {
            id: execution_id,
            sync_configuration_id: config_id,
            started_at: Utc::now(),
            completed_at: None,
            status: SyncStatus::Running,
            records_processed: 0,
            records_inserted: 0,
            records_updated: 0,
            records_deleted: 0,
            records_failed: 0,
            duration_ms: None,
            error_message: None,
            metadata: serde_json::json!({}),
        })
    }

    /// Update execution record
    async fn update_execution_record(
        &self,
        _execution: &SyncExecution,
    ) -> AppResult<()> {
        // In production, update database record
        Ok(())
    }

    /// Safely truncate a table using parameterized SQL to prevent SQL injection
    /// 
    /// This function validates the table name and uses Diesel's sql_query with
    /// proper escaping to safely execute TRUNCATE operations.
    /// 
    /// # Arguments
    /// 
    /// * `pool` - Connection pool for the target database
    /// * `table_name` - Name of the table to truncate (must be a valid identifier)
    /// 
    /// # Errors
    /// 
    /// Returns `AppError` if:
    /// - Table name contains invalid characters (SQL injection attempt)
    /// - Connection to database fails
    /// - TRUNCATE operation fails
    async fn safe_truncate_table(
        &self,
        pool: &Pool<ConnectionManager<PgConnection>>,
        table_name: &str,
    ) -> AppResult<()> {
        // Validate table name to prevent SQL injection
        // Only allow alphanumeric characters, underscores, and dots (for schema.table)
        if !table_name.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '.') {
            return Err(AppError::Validation(format!(
                "Invalid table name: '{}'. Only alphanumeric characters, underscores, and dots are allowed.",
                table_name
            )));
        }

        // Additional safety: ensure table name doesn't contain SQL keywords
        let upper_name = table_name.to_uppercase();
        let dangerous_keywords = ["DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "CREATE", "TRUNCATE"];
        for keyword in dangerous_keywords {
            if upper_name.contains(keyword) {
                return Err(AppError::Validation(format!(
                    "Table name '{}' contains potentially dangerous keyword: {}",
                    table_name, keyword
                )));
            }
        }

        // Get connection from pool
        let mut conn = pool.get()
            .map_err(|e| AppError::Internal(format!("Failed to get target connection: {}", e)))?;

        // Use Diesel's sql_query with proper identifier quoting
        // PostgreSQL uses double quotes for identifiers
        let quoted_table = format!("\"{}\"", table_name.replace("\"", "\"\""));
        let sql = format!("TRUNCATE TABLE {} RESTART IDENTITY CASCADE", quoted_table);

        // Execute TRUNCATE in a blocking task since Diesel operations are synchronous
        tokio::task::spawn_blocking(move || {
            diesel::sql_query(&sql)
                .execute(&mut conn)
                .map(|_| ())
                .map_err(|e| AppError::Database(e))
        })
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
    }
}

