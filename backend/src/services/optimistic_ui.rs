//! Optimistic UI Updates Service
//!
//! Handles optimistic updates with rollback and conflict resolution

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Optimistic update manager
pub struct OptimisticUpdateManager {
    pending_updates: Arc<RwLock<HashMap<String, PendingUpdate>>>,
    rollback_queue: Arc<RwLock<Vec<RollbackAction>>>,
    conflict_resolver: Arc<ConflictResolver>,
}

/// Pending update information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PendingUpdate {
    pub id: String,
    pub operation: UpdateOperation,
    pub data: serde_json::Value,
    pub timestamp: DateTime<Utc>,
    pub user_id: Uuid,
    pub project_id: Option<Uuid>,
    pub retry_count: u32,
    pub max_retries: u32,
}

/// Update operation types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UpdateOperation {
    Create,
    Update,
    Delete,
    Move,
    Duplicate,
}

/// Rollback action for failed updates
#[derive(Debug, Clone)]
pub struct RollbackAction {
    pub id: String,
    pub operation: RollbackOperation,
    pub original_data: Option<serde_json::Value>,
    pub timestamp: DateTime<Utc>,
    pub reason: String,
}

/// Rollback operation types
#[derive(Debug, Clone)]
pub enum RollbackOperation {
    Restore,
    Delete,
    Revert,
}

/// Conflict resolution strategies
#[derive(Debug, Clone)]
pub enum ConflictStrategy {
    LastWriteWins,
    FirstWriteWins,
    Merge,
    UserChoice,
    ServerWins,
}

/// Conflict resolver
pub struct ConflictResolver {
    strategies: HashMap<String, ConflictStrategy>,
}

impl Default for ConflictResolver {
    fn default() -> Self {
        Self::new()
    }
}

impl ConflictResolver {
    pub fn new() -> Self {
        let mut strategies = HashMap::new();

        // Default strategies for different data types
        strategies.insert("project".to_string(), ConflictStrategy::LastWriteWins);
        strategies.insert("reconciliation".to_string(), ConflictStrategy::UserChoice);
        strategies.insert("file".to_string(), ConflictStrategy::ServerWins);
        strategies.insert(
            "user_preferences".to_string(),
            ConflictStrategy::LastWriteWins,
        );

        Self { strategies }
    }

    pub fn resolve_conflict(
        &self,
        data_type: &str,
        local_data: &serde_json::Value,
        server_data: &serde_json::Value,
        _user_id: Uuid,
    ) -> ConflictResolution {
        let strategy = self
            .strategies
            .get(data_type)
            .cloned()
            .unwrap_or(ConflictStrategy::LastWriteWins);

        match strategy {
            ConflictStrategy::LastWriteWins => {
                // Compare timestamps and use the newer one
                let local_time = self.extract_timestamp(local_data);
                let server_time = self.extract_timestamp(server_data);

                if local_time > server_time {
                    ConflictResolution::UseLocal
                } else {
                    ConflictResolution::UseServer
                }
            }
            ConflictStrategy::FirstWriteWins => {
                let local_time = self.extract_timestamp(local_data);
                let server_time = self.extract_timestamp(server_data);

                if local_time < server_time {
                    ConflictResolution::UseLocal
                } else {
                    ConflictResolution::UseServer
                }
            }
            ConflictStrategy::Merge => {
                ConflictResolution::Merge(self.merge_data(local_data, server_data))
            }
            ConflictStrategy::UserChoice => ConflictResolution::RequiresUserChoice {
                local_data: local_data.clone(),
                server_data: server_data.clone(),
            },
            ConflictStrategy::ServerWins => ConflictResolution::UseServer,
        }
    }

    fn extract_timestamp(&self, data: &serde_json::Value) -> DateTime<Utc> {
        data.get("updated_at")
            .and_then(|v| v.as_str())
            .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or_else(Utc::now)
    }

    fn merge_data(
        &self,
        local: &serde_json::Value,
        server: &serde_json::Value,
    ) -> serde_json::Value {
        // Simple merge strategy - prefer non-null values
        let mut merged = local.clone();

        if let (Some(local_obj), Some(server_obj)) = (local.as_object(), server.as_object()) {
            for (key, server_value) in server_obj {
                if !local_obj.contains_key(key) || local_obj[key].is_null() {
                    merged[key] = server_value.clone();
                }
            }
        }

        merged
    }
}

/// Conflict resolution result
#[derive(Debug, Clone)]
pub enum ConflictResolution {
    UseLocal,
    UseServer,
    Merge(serde_json::Value),
    RequiresUserChoice {
        local_data: serde_json::Value,
        server_data: serde_json::Value,
    },
}

impl OptimisticUpdateManager {
    pub fn new() -> Self {
        Self {
            pending_updates: Arc::new(RwLock::new(HashMap::new())),
            rollback_queue: Arc::new(RwLock::new(Vec::new())),
            conflict_resolver: Arc::new(ConflictResolver::new()),
        }
    }

    /// Apply optimistic update
    pub async fn apply_optimistic_update(
        &self,
        id: String,
        operation: UpdateOperation,
        data: serde_json::Value,
        user_id: Uuid,
        project_id: Option<Uuid>,
    ) -> Result<(), OptimisticUpdateError> {
        let pending_update = PendingUpdate {
            id: id.clone(),
            operation: operation.clone(),
            data: data.clone(),
            timestamp: Utc::now(),
            user_id,
            project_id,
            retry_count: 0,
            max_retries: 3,
        };

        // Store the pending update
        {
            let mut updates = self.pending_updates.write().await;
            updates.insert(id.clone(), pending_update);
        }

        // Apply the update optimistically
        self.apply_update_locally(&id, &operation, &data).await?;

        // Try to sync with server
        self.sync_with_server(&id).await?;

        Ok(())
    }

    /// Sync pending update with server
    async fn sync_with_server(&self, id: &str) -> Result<(), OptimisticUpdateError> {
        let pending_update = {
            let updates = self.pending_updates.read().await;
            updates.get(id).cloned()
        };

        let Some(update) = pending_update else {
            return Ok(());
        };

        match self.send_to_server(&update).await {
            Ok(_) => {
                // Success - remove from pending
                let mut updates = self.pending_updates.write().await;
                updates.remove(id);
            }
            Err(e) => {
                // Failed - increment retry count
                let mut updates = self.pending_updates.write().await;
                if let Some(pending) = updates.get_mut(id) {
                    pending.retry_count += 1;

                    if pending.retry_count >= pending.max_retries {
                        // Max retries reached - rollback
                        self.rollback_update(id).await?;
                        updates.remove(id);
                    }
                }

                return Err(e);
            }
        }

        Ok(())
    }

    /// Apply update locally (optimistic)
    async fn apply_update_locally(
        &self,
        id: &str,
        operation: &UpdateOperation,
        _data: &serde_json::Value,
    ) -> Result<(), OptimisticUpdateError> {
        // In a real implementation, this would update the local state
        log::debug!("Applying optimistic update: {} {:?}", id, operation);
        Ok(())
    }

    /// Send update to server
    async fn send_to_server(&self, update: &PendingUpdate) -> Result<(), OptimisticUpdateError> {
        // In a real implementation, this would make HTTP requests
        log::debug!("Sending update to server: {}", update.id);

        // Simulate network delay and potential failure
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        // Simulate occasional failures
        if update.retry_count > 0 && update.retry_count.is_multiple_of(2) {
            return Err(OptimisticUpdateError::NetworkError(
                "Simulated network failure".to_string(),
            ));
        }

        Ok(())
    }

    /// Rollback failed update
    async fn rollback_update(&self, id: &str) -> Result<(), OptimisticUpdateError> {
        let pending_update = {
            let updates = self.pending_updates.read().await;
            updates.get(id).cloned()
        };

        let Some(update) = pending_update else {
            return Ok(());
        };

        // Create rollback action
        let rollback_action = RollbackAction {
            id: id.to_string(),
            operation: match update.operation {
                UpdateOperation::Create => RollbackOperation::Delete,
                UpdateOperation::Update => RollbackOperation::Revert,
                UpdateOperation::Delete => RollbackOperation::Restore,
                UpdateOperation::Move => RollbackOperation::Revert,
                UpdateOperation::Duplicate => RollbackOperation::Delete,
            },
            original_data: None, // Would be stored when applying the update
            timestamp: Utc::now(),
            reason: format!("Failed after {} retries", update.max_retries),
        };

        // Add to rollback queue
        {
            let mut queue = self.rollback_queue.write().await;
            queue.push(rollback_action);
        }

        // Apply rollback
        self.apply_rollback(id).await?;

        Ok(())
    }

    /// Apply rollback action
    async fn apply_rollback(&self, id: &str) -> Result<(), OptimisticUpdateError> {
        log::debug!("Applying rollback for: {}", id);
        // In a real implementation, this would revert the local changes
        Ok(())
    }

    /// Handle conflict resolution
    pub async fn handle_conflict(
        &self,
        _id: &str,
        local_data: &serde_json::Value,
        server_data: &serde_json::Value,
        user_id: Uuid,
    ) -> Result<ConflictResolution, OptimisticUpdateError> {
        let data_type = self.extract_data_type(local_data);
        let resolution =
            self.conflict_resolver
                .resolve_conflict(&data_type, local_data, server_data, user_id);

        Ok(resolution)
    }

    /// Get pending updates count
    pub async fn get_pending_count(&self) -> usize {
        let updates = self.pending_updates.read().await;
        updates.len()
    }

    /// Get rollback queue count
    pub async fn get_rollback_count(&self) -> usize {
        let queue = self.rollback_queue.read().await;
        queue.len()
    }

    /// Retry failed updates
    pub async fn retry_failed_updates(&self) -> Result<usize, OptimisticUpdateError> {
        let failed_updates: Vec<String> = {
            let updates = self.pending_updates.read().await;
            updates
                .iter()
                .filter(|(_, update)| update.retry_count > 0)
                .map(|(id, _)| id.clone())
                .collect()
        };

        let mut retry_count = 0;

        for id in failed_updates {
            if self.sync_with_server(&id).await.is_err() {
                retry_count += 1;
            }
        }

        Ok(retry_count)
    }

    /// Clear completed updates
    pub async fn clear_completed_updates(&self) -> Result<usize, OptimisticUpdateError> {
        let mut updates = self.pending_updates.write().await;
        let initial_count = updates.len();

        updates.retain(|_, update| update.retry_count < update.max_retries);

        Ok(initial_count - updates.len())
    }

    fn extract_data_type(&self, data: &serde_json::Value) -> String {
        data.get("type")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| "unknown".to_string())
    }
}

impl Default for OptimisticUpdateManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Optimistic update error types
#[derive(Debug, thiserror::Error)]
pub enum OptimisticUpdateError {
    #[error("Network error: {0}")]
    NetworkError(String),

    #[error("Conflict error: {0}")]
    ConflictError(String),

    #[error("Rollback error: {0}")]
    RollbackError(String),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
}
