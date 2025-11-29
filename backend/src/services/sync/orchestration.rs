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
        // In production, query database
        // For now, return a mock configuration
        Err(AppError::Internal("Not implemented".to_string()))
    }

    /// Get sync configurations that are due for execution
    async fn get_due_sync_configurations(
        &self,
    ) -> AppResult<Vec<SyncConfiguration>> {
        // Query database for configurations where:
        // - enabled = true
        // - next_sync_at <= NOW()
        // - sync_status != 'running'
        Ok(vec![])
    }

    /// Update sync configuration after sync execution
    async fn update_sync_configuration_after_sync(
        &self,
        _config: &SyncConfiguration,
        _execution: &SyncExecution,
    ) -> AppResult<()> {
        // Update database record with:
        // - last_sync_at = execution.completed_at
        // - next_sync_at = last_sync_at + sync_interval_seconds
        // - sync_status = 'idle' or 'error'
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

