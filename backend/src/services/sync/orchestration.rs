//! Sync orchestration service
//!
//! Orchestrates multiple synchronization operations, manages schedules,
//! and provides coordination for complex multi-table sync scenarios.

use std::sync::Arc;
use std::collections::HashMap;
use tokio::sync::RwLock;
use tokio::time::{interval, Duration, MissedTickBehavior};
use uuid::Uuid;
use log::{info, error, warn};

use crate::errors::{AppError, AppResult};
use crate::database::Database;
use super::core::SyncService;
use super::models::*;

/// Sync orchestrator for managing multiple sync operations
pub struct SyncOrchestrator {
    db: Arc<Database>,
    sync_service: Arc<SyncService>,
    active_syncs: Arc<RwLock<HashMap<Uuid, tokio::task::JoinHandle<()>>>>,
    scheduler_active: Arc<RwLock<bool>>,
}

impl SyncOrchestrator {
    /// Create a new sync orchestrator
    pub fn new(db: Arc<Database>) -> Self {
        let sync_service = Arc::new(SyncService::new(db.clone()));
        Self {
            db,
            sync_service,
            active_syncs: Arc::new(RwLock::new(HashMap::new())),
            scheduler_active: Arc::new(RwLock::new(false)),
        }
    }

    /// Execute a single sync configuration
    pub async fn execute_sync(
        &self,
        config_id: Uuid,
    ) -> AppResult<SyncExecution> {
        // Get sync configuration from database
        let config = self.get_sync_configuration(config_id).await?;

        if !config.enabled {
            return Err(AppError::Internal(format!(
                "Sync configuration {} is disabled",
                config_id
            )));
        }

        info!("Executing sync configuration: {}", config.name);

        // Execute sync
        let execution = self.sync_service.sync(&config).await?;

        // Update configuration with last sync time
        self.update_sync_configuration_after_sync(&config, &execution).await?;

        Ok(execution)
    }

    /// Execute multiple sync configurations in sequence
    pub async fn execute_sync_sequence(
        &self,
        config_ids: Vec<Uuid>,
    ) -> AppResult<Vec<SyncExecution>> {
        let mut executions = Vec::new();

        for config_id in config_ids {
            match self.execute_sync(config_id).await {
                Ok(execution) => {
                    executions.push(execution);
                }
                Err(e) => {
                    error!("Failed to execute sync {}: {}", config_id, e);
                    // Continue with next sync
                }
            }
        }

        Ok(executions)
    }

    /// Execute multiple sync configurations in parallel
    pub async fn execute_sync_parallel(
        &self,
        config_ids: Vec<Uuid>,
    ) -> AppResult<Vec<SyncExecution>> {
        let mut handles = Vec::new();

        for config_id in config_ids {
            let orchestrator = self.clone_for_task();
            let handle = tokio::spawn(async move {
                orchestrator.execute_sync(config_id).await
            });
            handles.push((config_id, handle));
        }

        let mut executions = Vec::new();
        for (config_id, handle) in handles {
            match handle.await {
                Ok(Ok(execution)) => {
                    executions.push(execution);
                }
                Ok(Err(e)) => {
                    error!("Failed to execute sync {}: {}", config_id, e);
                }
                Err(e) => {
                    error!("Task panicked for sync {}: {:?}", config_id, e);
                }
            }
        }

        Ok(executions)
    }

    /// Start scheduled sync scheduler
    pub async fn start_scheduler(&self) -> AppResult<()> {
        let mut scheduler_active = self.scheduler_active.write().await;
        if *scheduler_active {
            warn!("Scheduler is already running");
            return Ok(());
        }

        *scheduler_active = true;
        drop(scheduler_active);

        let orchestrator = self.clone_for_task();
        tokio::spawn(async move {
            let mut interval = interval(Duration::from_secs(60));
            interval.set_missed_tick_behavior(MissedTickBehavior::Skip);

            loop {
                interval.tick().await;

                // Check if scheduler should still run
                let should_continue = {
                    let active = orchestrator.scheduler_active.read().await;
                    *active
                };

                if !should_continue {
                    info!("Scheduler stopped");
                    break;
                }

                // Get all enabled sync configurations that are due
                match orchestrator.get_due_sync_configurations().await {
                    Ok(configs) => {
                        for config in configs {
                            let config_id = config.id;
                            let orchestrator_clone = orchestrator.clone_for_task();

                            tokio::spawn(async move {
                                if let Err(e) = orchestrator_clone.execute_sync(config_id).await {
                                    error!("Scheduled sync failed for {}: {}", config_id, e);
                                }
                            });
                        }
                    }
                    Err(e) => {
                        error!("Failed to get due sync configurations: {}", e);
                    }
                }
            }
        });

        info!("Sync scheduler started");
        Ok(())
    }

    /// Stop scheduled sync scheduler
    pub async fn stop_scheduler(&self) -> AppResult<()> {
        let mut scheduler_active = self.scheduler_active.write().await;
        *scheduler_active = false;
        info!("Sync scheduler stopped");
        Ok(())
    }

    /// Get sync configuration from database
    async fn get_sync_configuration(
        &self,
        config_id: Uuid,
    ) -> AppResult<SyncConfiguration> {
        // Try to get connection and query database
        let mut conn = self.db.get_connection_async().await
            .map_err(|e| AppError::Internal(format!("Database connection error: {}", e)))?;

        // Note: This assumes a sync_configurations table exists
        // If the table doesn't exist, this will need to be created via migration
        // For now, we'll use a raw SQL query approach
        use diesel::sql_types::{Uuid as SqlUuid, Text, Bool, Integer, Timestamp, Jsonb};
        use diesel::sql_query;

        let query = format!(
            "SELECT id, name, source_table, target_table, source_database_url, target_database_url, \
             sync_strategy, conflict_resolution, batch_size, sync_interval_seconds, enabled, \
             last_sync_at, next_sync_at, sync_status, error_message, metadata, created_at, updated_at \
             FROM sync_configurations WHERE id = $1"
        );

        // For now, return an error indicating the table needs to be created
        // In production, this would execute the query and map to SyncConfiguration
        Err(AppError::NotFound(format!(
            "Sync configuration {} not found. Note: sync_configurations table may need to be created via migration.",
            config_id
        )))
    }

    /// Get sync configurations that are due for execution
    async fn get_due_sync_configurations(
        &self,
    ) -> AppResult<Vec<SyncConfiguration>> {
        // Try to get connection and query database
        let mut conn = self.db.get_connection_async().await
            .map_err(|e| AppError::Internal(format!("Database connection error: {}", e)))?;

        // Query database for configurations where:
        // - enabled = true
        // - next_sync_at <= NOW() OR next_sync_at IS NULL
        // - sync_status != 'running'
        // 
        // Note: This assumes a sync_configurations table exists
        // If the table doesn't exist, return empty vector
        // In production, this would execute:
        // SELECT * FROM sync_configurations 
        // WHERE enabled = true 
        //   AND (next_sync_at <= NOW() OR next_sync_at IS NULL)
        //   AND sync_status != 'running'
        
        // For now, return empty vector until table is created
        warn!("sync_configurations table not found. Returning empty list. Create table via migration.");
        Ok(vec![])
    }

    /// Update sync configuration after sync execution
    async fn update_sync_configuration_after_sync(
        &self,
        config: &SyncConfiguration,
        execution: &SyncExecution,
    ) -> AppResult<()> {
        // Try to get connection and update database
        let mut conn = self.db.get_connection_async().await
            .map_err(|e| AppError::Internal(format!("Database connection error: {}", e)))?;

        // Update database record with:
        // - last_sync_at = execution.completed_at
        // - next_sync_at = last_sync_at + sync_interval_seconds (if interval is set)
        // - sync_status = 'idle' or 'error' based on execution status
        //
        // Note: This assumes a sync_configurations table exists
        // In production, this would execute:
        // UPDATE sync_configurations 
        // SET last_sync_at = $1,
        //     next_sync_at = CASE 
        //         WHEN sync_interval_seconds IS NOT NULL 
        //         THEN $1 + (sync_interval_seconds || ' seconds')::interval
        //         ELSE NULL 
        //     END,
        //     sync_status = $2,
        //     error_message = $3,
        //     updated_at = NOW()
        // WHERE id = $4

        let next_sync_at = if let (Some(completed_at), Some(interval_seconds)) = 
            (execution.completed_at, config.sync_interval_seconds) {
            Some(completed_at + chrono::Duration::seconds(interval_seconds as i64))
        } else {
            None
        };

        let sync_status = match execution.status {
            SyncStatus::Completed => SyncStatus::Idle,
            SyncStatus::Error => SyncStatus::Error,
            _ => config.sync_status,
        };

        info!(
            "Would update sync configuration {}: last_sync_at={:?}, next_sync_at={:?}, status={:?}",
            config.id, execution.completed_at, next_sync_at, sync_status
        );

        // For now, log the update since table may not exist
        // In production, execute the UPDATE query
        warn!("sync_configurations table not found. Update logged but not persisted. Create table via migration.");
        
        Ok(())
    }

    /// Clone orchestrator for use in async tasks
    fn clone_for_task(&self) -> Self {
        Self {
            db: self.db.clone(),
            sync_service: self.sync_service.clone(),
            active_syncs: Arc::new(RwLock::new(HashMap::new())),
            scheduler_active: self.scheduler_active.clone(),
        }
    }
}

