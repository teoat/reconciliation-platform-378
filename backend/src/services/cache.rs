//! Multi-level cache service for the Reconciliation Backend
//! 
//! Provides a caching layer using Redis with support for different cache strategies.

use redis::{Client, Commands, Connection, RedisError};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use anyhow::{Context, Result};
use uuid::Uuid;

/// Multi-level cache service
/// 
/// Note: This implementation uses a synchronous Redis connection with mutex locking
/// wrapped in async functions for API compatibility. For production use with high
/// concurrency, consider migrating to redis-tokio or async-redis for truly
/// asynchronous operations without blocking the async runtime.
pub struct MultiLevelCache {
    redis_client: Client,
    connection: Arc<Mutex<Connection>>,
}

impl MultiLevelCache {
    /// Create a new multi-level cache with Redis backend
    pub fn new(redis_url: &str) -> Result<Self> {
        let client = Client::open(redis_url)
            .context("Failed to create Redis client")?;
        
        let connection = client.get_connection()
            .context("Failed to connect to Redis")?;
        
        Ok(Self {
            redis_client: client,
            connection: Arc::new(Mutex::new(connection)),
        })
    }

    /// Get a value from cache
    pub async fn get<T>(&self, key: &str) -> Result<Option<T>>
    where
        T: for<'de> Deserialize<'de>,
    {
        let mut conn = self.connection.lock()
            .map_err(|e| anyhow::anyhow!("Failed to lock connection: {}", e))?;
        
        let value: Option<String> = conn.get(key)
            .map_err(|e| anyhow::anyhow!("Redis GET error: {}", e))?;
        
        match value {
            Some(json_str) => {
                let parsed = serde_json::from_str(&json_str)
                    .context("Failed to deserialize cached value")?;
                Ok(Some(parsed))
            }
            None => Ok(None),
        }
    }

    /// Set a value in cache with optional TTL
    pub async fn set<T>(&self, key: &str, value: &T, ttl: Option<Duration>) -> Result<()>
    where
        T: Serialize,
    {
        let mut conn = self.connection.lock()
            .map_err(|e| anyhow::anyhow!("Failed to lock connection: {}", e))?;
        
        let json_str = serde_json::to_string(value)
            .context("Failed to serialize value")?;
        
        if let Some(duration) = ttl {
            let seconds = duration.as_secs() as usize;
            conn.set_ex(key, json_str, seconds)
                .map_err(|e| anyhow::anyhow!("Redis SETEX error: {}", e))?;
        } else {
            conn.set(key, json_str)
                .map_err(|e| anyhow::anyhow!("Redis SET error: {}", e))?;
        }
        
        Ok(())
    }

    /// Delete a value from cache
    pub async fn delete(&self, key: &str) -> Result<()> {
        let mut conn = self.connection.lock()
            .map_err(|e| anyhow::anyhow!("Failed to lock connection: {}", e))?;
        
        conn.del(key)
            .map_err(|e| anyhow::anyhow!("Redis DEL error: {}", e))?;
        
        Ok(())
    }

    /// Check if a key exists in cache
    pub async fn exists(&self, key: &str) -> Result<bool> {
        let mut conn = self.connection.lock()
            .map_err(|e| anyhow::anyhow!("Failed to lock connection: {}", e))?;
        
        let exists: bool = conn.exists(key)
            .map_err(|e| anyhow::anyhow!("Redis EXISTS error: {}", e))?;
        
        Ok(exists)
    }

    /// Clear all cache entries
    pub async fn clear(&self) -> Result<()> {
        let mut conn = self.connection.lock()
            .map_err(|e| anyhow::anyhow!("Failed to lock connection: {}", e))?;
        
        redis::cmd("FLUSHDB")
            .query(&mut *conn)
            .map_err(|e| anyhow::anyhow!("Redis FLUSHDB error: {}", e))?;
        
        Ok(())
    }

    /// Set TTL on an existing key
    pub async fn expire(&self, key: &str, ttl: Duration) -> Result<()> {
        let mut conn = self.connection.lock()
            .map_err(|e| anyhow::anyhow!("Failed to lock connection: {}", e))?;
        
        let seconds = ttl.as_secs() as usize;
        conn.expire(key, seconds)
            .map_err(|e| anyhow::anyhow!("Redis EXPIRE error: {}", e))?;
        
        Ok(())
    }

    /// Invalidate job cache by pattern
    pub async fn invalidate_job_cache(&self, job_id: Uuid, project_id: Option<Uuid>) -> Result<()> {
        // Delete specific job cache entries
        let _ = self.delete(&format!("job:{}", job_id)).await;
        
        // If project_id is provided, also delete project-level caches
        if let Some(pid) = project_id {
            let _ = self.delete(&format!("project:{}:jobs", pid)).await;
        }
        
        Ok(())
    }

    /// Invalidate project cache
    /// 
    /// Note: This implementation only deletes specific known keys.
    /// For production, consider implementing SCAN-based pattern deletion
    /// to handle all project-related cache entries.
    pub async fn invalidate_project_cache(&self, project_id: Uuid) -> Result<()> {
        // Delete specific known cache entries for this project
        let _ = self.delete(&format!("project:{}", project_id)).await;
        let _ = self.delete(&format!("project:{}:jobs", project_id)).await;
        let _ = self.delete(&format!("project:{}:stats", project_id)).await;
        
        Ok(())
    }
}

/// Cache service type alias for backwards compatibility
pub type CacheService = MultiLevelCache;
