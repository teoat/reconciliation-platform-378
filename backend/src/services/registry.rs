//! Service Registry for Dependency Injection
//!
//! Reduces service interdependencies by providing a centralized service registry.

use crate::database::Database;
use crate::services::cache::MultiLevelCache;
use crate::services::resilience::ResilienceManager;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Service registry for dependency injection
pub struct ServiceRegistry {
    database: Arc<Database>,
    cache: Arc<MultiLevelCache>,
    resilience: Arc<ResilienceManager>,
    // Add more services as needed
}

impl ServiceRegistry {
    /// Create a new service registry
    pub fn new(
        database: Arc<Database>,
        cache: Arc<MultiLevelCache>,
        resilience: Arc<ResilienceManager>,
    ) -> Self {
        Self {
            database,
            cache,
            resilience,
        }
    }

    /// Get database service
    pub fn database(&self) -> &Arc<Database> {
        &self.database
    }

    /// Get cache service
    pub fn cache(&self) -> &Arc<MultiLevelCache> {
        &self.cache
    }

    /// Get resilience manager
    pub fn resilience(&self) -> &Arc<ResilienceManager> {
        &self.resilience
    }
}

/// Global service registry (thread-safe)
pub struct GlobalServiceRegistry {
    registry: Arc<RwLock<Option<ServiceRegistry>>>,
}

impl GlobalServiceRegistry {
    /// Create a new global service registry
    pub fn new() -> Self {
        Self {
            registry: Arc::new(RwLock::new(None)),
        }
    }

    /// Initialize the global registry
    pub async fn initialize(&self, registry: ServiceRegistry) {
        let mut reg = self.registry.write().await;
        *reg = Some(registry);
    }

    /// Get the database service
    pub async fn database(&self) -> Option<Arc<Database>> {
        let reg = self.registry.read().await;
        reg.as_ref().map(|r| Arc::clone(r.database()))
    }

    /// Get the cache service
    pub async fn cache(&self) -> Option<Arc<MultiLevelCache>> {
        let reg = self.registry.read().await;
        reg.as_ref().map(|r| Arc::clone(r.cache()))
    }

    /// Get the resilience manager
    pub async fn resilience(&self) -> Option<Arc<ResilienceManager>> {
        let reg = self.registry.read().await;
        reg.as_ref().map(|r| Arc::clone(r.resilience()))
    }
}

impl Default for GlobalServiceRegistry {
    fn default() -> Self {
        Self::new()
    }
}

