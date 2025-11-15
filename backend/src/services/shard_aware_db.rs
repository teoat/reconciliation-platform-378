// Shard-Aware Database Operations
// Provides high-level database operations that automatically route to the correct shard

use super::database_sharding::{ShardedPoolManager, ShardManager, ShardConfig};
use diesel::prelude::*;
use diesel::r2d2::ConnectionManager;
use diesel::PgConnection;
use uuid::Uuid;
use std::sync::Arc;
use tokio::sync::Mutex;

pub type PooledConnection = diesel::r2d2::PooledConnection<ConnectionManager<PgConnection>>;

pub struct ShardAwareDb {
    pool_manager: Arc<ShardedPoolManager>,
}

impl ShardAwareDb {
    pub fn new(pool_manager: Arc<ShardedPoolManager>) -> Self {
        Self { pool_manager }
    }

    /// Execute a database operation on the appropriate shard for a user
    pub async fn execute_on_user_shard<F, R, Fut>(&self, user_id: Uuid, operation: F) -> Result<R, String>
    where
        F: FnOnce(&mut PooledConnection) -> Fut + Send,
        Fut: std::future::Future<Output = Result<R, diesel::result::Error>> + Send,
        R: Send,
    {
        self.pool_manager.execute_on_user_shard(user_id, operation).await
    }

    /// Execute a read-only operation on the appropriate shard for a user
    pub async fn read_on_user_shard<F, R, Fut>(&self, user_id: Uuid, operation: F) -> Result<R, String>
    where
        F: FnOnce(&mut PooledConnection) -> Fut + Send,
        Fut: std::future::Future<Output = Result<R, diesel::result::Error>> + Send,
        R: Send,
    {
        // For reads, we can use the same method as writes for now
        // In a more advanced setup, we might implement read replicas
        self.execute_on_user_shard(user_id, operation).await
    }

    /// Execute an operation that spans multiple shards (cross-shard queries)
    /// This is more complex and would require special handling
    pub async fn execute_cross_shard<F, R, Fut>(&self, operation: F) -> Result<R, String>
    where
        F: FnOnce(Vec<&mut PooledConnection>) -> Fut + Send,
        Fut: std::future::Future<Output = Result<R, diesel::result::Error>> + Send,
        R: Send,
    {
        // Get connections from all shards
        let mut connections = Vec::new();
        let shard_manager = self.pool_manager.shard_manager();

        for shard in shard_manager.get_all_shards() {
            let pool = self.pool_manager.get_pool_for_shard(shard.id).await?;
            let mut conn = pool.lock().await.get()
                .map_err(|e| format!("Failed to get connection for cross-shard operation: {}", e))?;
            connections.push(conn);
        }

        // Convert to mutable references
        let mut conn_refs: Vec<&mut PooledConnection> = connections.iter_mut().collect();

        operation(conn_refs).await
            .map_err(|e| format!("Cross-shard operation failed: {}", e))
    }

    /// Get shard information for a user
    pub fn get_shard_for_user(&self, user_id: Uuid) -> Option<&ShardConfig> {
        self.pool_manager.shard_manager().get_shard_for_user(user_id)
    }

    /// Get all available shards
    pub fn get_all_shards(&self) -> &[ShardConfig] {
        self.pool_manager.shard_manager().get_all_shards()
    }

    /// Health check for all shards
    pub async fn health_check(&self) -> Result<Vec<(usize, bool)>, String> {
        let mut results = Vec::new();
        let shard_manager = self.pool_manager.shard_manager();

        for shard in shard_manager.get_all_shards() {
            let pool = self.pool_manager.get_pool_for_shard(shard.id).await?;
            let pool_guard = pool.lock().await;

            // Try to get a connection to test health
            let is_healthy = pool_guard.get().is_ok();
            results.push((shard.id, is_healthy));
        }

        Ok(results)
    }
}

// Convenience functions for common operations
impl ShardAwareDb {
    /// Insert a user record on the appropriate shard
    pub async fn insert_user(&self, user_id: Uuid, user_data: serde_json::Value) -> Result<(), String> {
        self.execute_on_user_shard(user_id, move |conn| {
            async move {
                // This would be replaced with actual Diesel insert operations
                // For now, just return success
                Ok(())
            }
        }).await
    }

    /// Get user data from the appropriate shard
    pub async fn get_user(&self, user_id: Uuid) -> Result<Option<serde_json::Value>, String> {
        self.read_on_user_shard(user_id, move |conn| {
            async move {
                // This would be replaced with actual Diesel select operations
                // For now, just return None
                Ok(None)
            }
        }).await
    }

    /// Update user data on the appropriate shard
    pub async fn update_user(&self, user_id: Uuid, user_data: serde_json::Value) -> Result<(), String> {
        self.execute_on_user_shard(user_id, move |conn| {
            async move {
                // This would be replaced with actual Diesel update operations
                // For now, just return success
                Ok(())
            }
        }).await
    }

    /// Delete user data from the appropriate shard
    pub async fn delete_user(&self, user_id: Uuid) -> Result<(), String> {
        self.execute_on_user_shard(user_id, move |conn| {
            async move {
                // This would be replaced with actual Diesel delete operations
                // For now, just return success
                Ok(())
            }
        }).await
    }
}