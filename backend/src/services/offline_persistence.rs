//! Offline Data Persistence Service
//!
//! Handles local storage, auto-save, and recovery for offline functionality

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Offline data storage service
pub struct OfflinePersistenceService {
    storage: Arc<RwLock<HashMap<String, StoredData>>>,
    #[allow(dead_code)]
    auto_save_interval: std::time::Duration,
}

/// Stored data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredData {
    pub id: String,
    pub data: serde_json::Value,
    pub data_type: String,
    pub user_id: Option<Uuid>,
    pub project_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub version: u32,
    pub is_synced: bool,
}

/// Auto-save configuration
#[derive(Debug, Clone)]
pub struct AutoSaveConfig {
    pub enabled: bool,
    pub interval_ms: u64,
    pub max_items: usize,
    pub sync_on_reconnect: bool,
}

impl Default for AutoSaveConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            interval_ms: 5000, // 5 seconds
            max_items: 1000,
            sync_on_reconnect: true,
        }
    }
}

impl OfflinePersistenceService {
    /// Create new offline persistence service
    pub fn new() -> Self {
        Self {
            storage: Arc::new(RwLock::new(HashMap::new())),
            auto_save_interval: std::time::Duration::from_millis(5000),
        }
    }

    /// Store data locally
    pub async fn store_data(
        &self,
        key: &str,
        data: serde_json::Value,
        data_type: &str,
        user_id: Option<Uuid>,
        project_id: Option<Uuid>,
    ) -> Result<(), OfflineError> {
        let mut storage = self.storage.write().await;

        let stored_data = StoredData {
            id: key.to_string(),
            data: data.clone(),
            data_type: data_type.to_string(),
            user_id,
            project_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            version: 1,
            is_synced: false,
        };

        storage.insert(key.to_string(), stored_data);

        // Persist to browser storage (in frontend)
        self.persist_to_browser_storage(key, &data).await?;

        Ok(())
    }

    /// Retrieve data from local storage
    pub async fn get_data(&self, key: &str) -> Result<Option<StoredData>, OfflineError> {
        let storage = self.storage.read().await;
        Ok(storage.get(key).cloned())
    }

    /// Update existing data
    pub async fn update_data(
        &self,
        key: &str,
        data: serde_json::Value,
    ) -> Result<(), OfflineError> {
        let mut storage = self.storage.write().await;

        if let Some(existing) = storage.get_mut(key) {
            existing.data = data.clone();
            existing.updated_at = Utc::now();
            existing.version += 1;
            existing.is_synced = false;

            // Persist to browser storage
            self.persist_to_browser_storage(key, &data).await?;
        }

        Ok(())
    }

    /// Mark data as synced
    pub async fn mark_synced(&self, key: &str) -> Result<(), OfflineError> {
        let mut storage = self.storage.write().await;

        if let Some(data) = storage.get_mut(key) {
            data.is_synced = true;
        }

        Ok(())
    }

    /// Get all unsynced data
    pub async fn get_unsynced_data(&self) -> Vec<StoredData> {
        let storage = self.storage.read().await;
        storage
            .values()
            .filter(|data| !data.is_synced)
            .cloned()
            .collect()
    }

    /// Clear old data
    pub async fn cleanup_old_data(&self, max_age_hours: i64) -> Result<usize, OfflineError> {
        let mut storage = self.storage.write().await;
        let cutoff = Utc::now() - chrono::Duration::hours(max_age_hours);

        let keys_to_remove: Vec<String> = storage
            .iter()
            .filter(|(_, data)| data.updated_at < cutoff && data.is_synced)
            .map(|(key, _)| key.clone())
            .collect();

        for key in &keys_to_remove {
            storage.remove(key);
            self.remove_from_browser_storage(key).await?;
        }

        Ok(keys_to_remove.len())
    }

    /// Auto-save data (called periodically)
    pub async fn auto_save(&self, key: &str, data: serde_json::Value) -> Result<(), OfflineError> {
        if let Some(_existing) = self.get_data(key).await? {
            self.update_data(key, data).await?;
        } else {
            self.store_data(key, data, "auto_save", None, None).await?;
        }
        Ok(())
    }

    /// Recover data after reconnection
    pub async fn recover_unsynced_data(&self) -> Result<Vec<StoredData>, OfflineError> {
        let unsynced = self.get_unsynced_data().await;

        // Try to sync each item
        for data in &unsynced {
            match self.sync_data_to_server(data).await {
                Ok(_) => {
                    self.mark_synced(&data.id).await?;
                }
                Err(e) => {
                    log::warn!("Failed to sync data {}: {}", data.id, e);
                }
            }
        }

        Ok(unsynced)
    }

    /// Show recovery prompt to user
    pub async fn show_recovery_prompt(&self) -> Result<RecoveryPrompt, OfflineError> {
        let unsynced = self.get_unsynced_data().await;

        if unsynced.is_empty() {
            return Ok(RecoveryPrompt::NoData);
        }

        let prompt = RecoveryPrompt::DataFound {
            count: unsynced.len(),
            items: unsynced
                .iter()
                .map(|data| RecoveryItem {
                    id: data.id.clone(),
                    data_type: data.data_type.clone(),
                    updated_at: data.updated_at,
                    size_bytes: serde_json::to_string(&data.data)
                        .map(|s| s.len())
                        .unwrap_or(0),
                })
                .collect(),
        };

        Ok(prompt)
    }

    // Private helper methods

    async fn persist_to_browser_storage(
        &self,
        key: &str,
        _data: &serde_json::Value,
    ) -> Result<(), OfflineError> {
        // In a real implementation, this would use web_sys to access localStorage
        // For now, we'll just log the action
        log::debug!("Persisting data to browser storage: {}", key);
        Ok(())
    }

    async fn remove_from_browser_storage(&self, key: &str) -> Result<(), OfflineError> {
        log::debug!("Removing data from browser storage: {}", key);
        Ok(())
    }

    async fn sync_data_to_server(&self, data: &StoredData) -> Result<(), OfflineError> {
        // In a real implementation, this would make HTTP requests to sync data
        log::debug!("Syncing data to server: {}", data.id);
        Ok(())
    }
}

/// Recovery prompt for user
#[derive(Debug, Clone)]
pub enum RecoveryPrompt {
    NoData,
    DataFound {
        count: usize,
        items: Vec<RecoveryItem>,
    },
}

/// Recovery item details
#[derive(Debug, Clone)]
pub struct RecoveryItem {
    pub id: String,
    pub data_type: String,
    pub updated_at: DateTime<Utc>,
    pub size_bytes: usize,
}

/// Offline error types
#[derive(Debug, thiserror::Error)]
pub enum OfflineError {
    #[error("Storage error: {0}")]
    Storage(String),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Sync error: {0}")]
    Sync(String),

    #[error("Browser storage error: {0}")]
    BrowserStorage(String),
}

impl Default for OfflinePersistenceService {
    fn default() -> Self {
        Self::new()
    }
}

/// Auto-save manager for automatic data persistence
pub struct AutoSaveManager {
    service: Arc<OfflinePersistenceService>,
    config: AutoSaveConfig,
    timers: Arc<RwLock<HashMap<String, tokio::task::JoinHandle<()>>>>,
}

impl AutoSaveManager {
    pub fn new(service: Arc<OfflinePersistenceService>, config: AutoSaveConfig) -> Self {
        Self {
            service,
            config,
            timers: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Start auto-saving for a data key
    pub async fn start_auto_save(
        &self,
        key: String,
        data_provider: impl Fn() -> serde_json::Value + Send + Sync + 'static,
    ) -> Result<(), OfflineError> {
        if !self.config.enabled {
            return Ok(());
        }

        let service = Arc::clone(&self.service);
        let interval = std::time::Duration::from_millis(self.config.interval_ms);
        let key_clone = key.clone();

        let handle = tokio::spawn(async move {
            let mut interval_timer = tokio::time::interval(interval);

            loop {
                interval_timer.tick().await;

                let data = data_provider();
                if let Err(e) = service.auto_save(&key_clone, data).await {
                    log::error!("Auto-save failed for {}: {}", key_clone, e);
                }
            }
        });

        let mut timers = self.timers.write().await;
        timers.insert(key, handle);

        Ok(())
    }

    /// Stop auto-saving for a data key
    pub async fn stop_auto_save(&self, key: &str) -> Result<(), OfflineError> {
        let mut timers = self.timers.write().await;

        if let Some(handle) = timers.remove(key) {
            handle.abort();
        }

        Ok(())
    }

    /// Stop all auto-save timers
    pub async fn stop_all_auto_save(&self) -> Result<(), OfflineError> {
        let mut timers = self.timers.write().await;

        for (_, handle) in timers.drain() {
            handle.abort();
        }

        Ok(())
    }
}
