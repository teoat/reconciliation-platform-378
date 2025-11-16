//! Cache service for the Reconciliation Backend
//! 
//! This module provides caching functionality using Redis for improved performance.

use redis::{Client, Connection, Commands};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{Duration, Instant};
use uuid::Uuid;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::errors::{AppError, AppResult};

/// Cached value with expiration
#[derive(Debug, Clone)]
pub struct CachedValue<T> {
    pub data: T,
    pub expires_at: Instant,
}

impl<T> CachedValue<T> {
    pub fn new(data: T, ttl: Duration) -> Self {
        Self {
            data,
            expires_at: Instant::now() + ttl,
        }
    }
    
    pub fn is_expired(&self) -> bool {
        Instant::now() > self.expires_at
    }
}

/// Multi-level cache service
pub struct MultiLevelCache {
    pub l1_cache: Arc<RwLock<HashMap<String, CachedValue<serde_json::Value>>>>,
    pub l2_cache: CacheService,
    pub cache_stats: Arc<RwLock<CacheStats>>,
    pub l1_max_size: usize,
    pub l1_default_ttl: Duration,
}

impl MultiLevelCache {
    pub fn new(redis_url: &str) -> AppResult<Self> {
        let l2_cache = CacheService::new(redis_url)?;
        
        Ok(Self {
            l1_cache: Arc::new(RwLock::new(HashMap::new())),
            l2_cache,
            cache_stats: Arc::new(RwLock::new(CacheStats::default())),
            l1_max_size: 1000,
            l1_default_ttl: Duration::from_secs(300), // 5 minutes
        })
    }
    
    /// Create cache with resilience manager (for startup)
    pub fn new_with_resilience(
        redis_url: &str,
        _resilience: std::sync::Arc<crate::services::resilience::ResilienceManager>,
    ) -> AppResult<Self> {
        // For now, just use regular new - resilience can be added later
        Self::new(redis_url)
    }
    
    pub async fn get<T>(&self, key: &str) -> AppResult<Option<T>>
    where
        T: for<'de> Deserialize<'de> + Clone + Serialize,
    {
        // L1 Cache (In-memory) - Fastest
        if let Some(value) = self.l1_cache.read().await.get(key) {
            if !value.is_expired() {
                self.record_cache_hit("l1").await;
                let deserialized: T = serde_json::from_value(value.data.clone())
                    .map_err(|e| AppError::InternalServerError(format!("Failed to deserialize L1 cache value: {}", e)))?;
                return Ok(Some(deserialized));
            } else {
                // Remove expired entry
                self.l1_cache.write().await.remove(key);
            }
        }
        
        // L2 Cache (Redis) - Fast
        if let Some(value) = self.l2_cache.get::<T>(key)? {
            // Store in L1 for next time
            let json_value = serde_json::to_value(&value)
                .map_err(|e| AppError::InternalServerError(format!("Failed to serialize for L1 cache: {}", e)))?;
            
            self.l1_cache.write().await.insert(
                key.to_string(), 
                CachedValue::new(json_value, self.l1_default_ttl)
            );
            
            self.record_cache_hit("l2").await;
            return Ok(Some(value));
        }
        
        self.record_cache_miss().await;
        Ok(None)
    }
    
    pub async fn set<T>(&self, key: &str, value: &T, ttl: Option<Duration>) -> AppResult<()>
    where
        T: Serialize,
    {
        let ttl = ttl.unwrap_or(self.l1_default_ttl);
        
        // Set in L2 cache (Redis)
        self.l2_cache.set(key, value, Some(ttl))?;
        
        // Set in L1 cache (in-memory)
        let json_value = serde_json::to_value(value)
            .map_err(|e| AppError::InternalServerError(format!("Failed to serialize for L1 cache: {}", e)))?;
        
        let mut l1_cache = self.l1_cache.write().await;
        
        // Check if we need to evict entries
        if l1_cache.len() >= self.l1_max_size {
            self.evict_oldest_entries(&mut l1_cache).await;
        }
        
        l1_cache.insert(
            key.to_string(),
            CachedValue::new(json_value, ttl)
        );
        
        self.record_cache_set().await;
        Ok(())
    }
    
    pub async fn delete(&self, key: &str) -> AppResult<()> {
        // Delete from both caches
        self.l2_cache.delete(key)?;
        self.l1_cache.write().await.remove(key);
        self.record_cache_delete().await;
        Ok(())
    }
    
    /// Invalidate cache for a specific job
    pub async fn invalidate_job_cache(&self, job_id: Uuid, project_id: Uuid) -> AppResult<()> {
        let job_key = format!("job:{}:{}", project_id, job_id);
        self.delete(&job_key).await?;
        
        // Also invalidate related caches
        let results_key = format!("job_results:{}:{}", project_id, job_id);
        self.delete(&results_key).await?;
        
        Ok(())
    }
    
    /// Invalidate cache for a specific project
    pub async fn invalidate_project_cache(&self, project_id: Uuid) -> AppResult<()> {
        let project_key = format!("project:{}", project_id);
        self.delete(&project_key).await?;
        
        // Also invalidate related caches
        let jobs_key = format!("project_jobs:{}", project_id);
        self.delete(&jobs_key).await?;
        
        Ok(())
    }
    
    pub async fn warm_cache(&self, project_id: Uuid) -> AppResult<()> {
        // This would integrate with other services to warm frequently accessed data
        // For now, we'll implement a basic warming strategy
        
        // Warm project data
        let _project_key = keys::project(project_id);
        // Note: In a real implementation, you would fetch from the actual service
        // let project = self.project_service.get_project(project_id).await?;
        // self.set(&project_key, &project, Some(Duration::from_secs(1800))).await?;
        
        // Warm user data for the project
        let _users_key = format!("project_users:{}", project_id);
        // let users = self.user_service.get_project_users(project_id).await?;
        // self.set(&users_key, &users, Some(Duration::from_secs(3600))).await?;
        
        // Warm analytics data
        let _analytics_key = keys::analytics(project_id, "daily");
        // let analytics = self.analytics_service.get_project_analytics(project_id).await?;
        // self.set(&analytics_key, &analytics, Some(Duration::from_secs(600))).await?;
        
        Ok(())
    }
    
    async fn evict_oldest_entries(&self, cache: &mut HashMap<String, CachedValue<serde_json::Value>>) {
        // Simple LRU eviction - remove 20% of entries
        let evict_count = (self.l1_max_size * 20) / 100;
        let mut entries: Vec<_> = cache.iter().map(|(k, v)| (k.clone(), v.expires_at)).collect();
        entries.sort_by_key(|(_, expires_at)| *expires_at);
        
        for (key, _) in entries.iter().take(evict_count) {
            cache.remove(key);
        }
        
        self.record_cache_eviction().await;
    }
    
    async fn record_cache_hit(&self, _level: &str) {
        let mut stats = self.cache_stats.write().await;
        stats.hits += 1;
        // Could add level-specific hit tracking here
    }
    
    async fn record_cache_miss(&self) {
        let mut stats = self.cache_stats.write().await;
        stats.misses += 1;
    }
    
    async fn record_cache_set(&self) {
        let mut stats = self.cache_stats.write().await;
        stats.sets += 1;
    }
    
    async fn record_cache_delete(&self) {
        let mut stats = self.cache_stats.write().await;
        stats.deletes += 1;
    }
    
    async fn record_cache_eviction(&self) {
        let mut stats = self.cache_stats.write().await;
        stats.evictions += 1;
    }
    
    pub async fn get_stats(&self) -> AppResult<CacheStats> {
        let stats = self.cache_stats.read().await.clone();
        Ok(stats)
    }
    
    pub async fn clear_l1_cache(&self) {
        self.l1_cache.write().await.clear();
    }
    
    pub async fn get_l1_cache_size(&self) -> usize {
        self.l1_cache.read().await.len()
    }
}

/// Cache service
pub struct CacheService {
    client: Client,
}

/// Cache statistics
#[derive(Debug, Clone, Default)]
pub struct CacheStats {
    pub hits: u64,
    pub misses: u64,
    pub sets: u64,
    pub deletes: u64,
    pub errors: u64,
    pub evictions: u64,
}

impl CacheService {
    /// Create a new cache service
    pub fn new(redis_url: &str) -> AppResult<Self> {
        let client = Client::open(redis_url)
            .map_err(|e| AppError::InternalServerError(format!("Failed to connect to Redis: {}", e)))?;
        
        Ok(CacheService { client })
    }

    /// Get a connection to Redis
    fn get_connection(&self) -> AppResult<Connection> {
        self.client.get_connection()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get Redis connection: {}", e)))
    }

    /// Get a value from cache
    pub fn get<T>(&self, key: &str) -> AppResult<Option<T>>
    where
        T: for<'de> Deserialize<'de>,
    {
        let mut conn = self.get_connection()?;
        let result: Result<Option<String>, _> = conn.get(key);
        
        match result {
            Ok(Some(value)) => {
                let deserialized: T = serde_json::from_str(&value)
                    .map_err(|e| AppError::InternalServerError(format!("Failed to deserialize cache value: {}", e)))?;
                Ok(Some(deserialized))
            }
            Ok(None) => Ok(None),
            Err(e) => Err(AppError::InternalServerError(format!("Redis get error: {}", e))),
        }
    }

    /// Set a value in cache
    pub fn set<T>(&self, key: &str, value: &T, ttl: Option<Duration>) -> AppResult<()>
    where
        T: Serialize,
    {
        let mut conn = self.get_connection()?;
        let serialized = serde_json::to_string(value)
            .map_err(|e| AppError::InternalServerError(format!("Failed to serialize cache value: {}", e)))?;
        
        match ttl {
            Some(duration) => {
                conn.set_ex::<_, _, ()>(key, serialized, duration.as_secs() as usize)
                    .map_err(|e| AppError::InternalServerError(format!("Redis set_ex error: {}", e)))?;
            }
            None => {
                conn.set::<_, _, ()>(key, serialized)
                    .map_err(|e| AppError::InternalServerError(format!("Redis set error: {}", e)))?;
            }
        }
        
        Ok(())
    }

    /// Delete a value from cache
    pub fn delete(&self, key: &str) -> AppResult<()> {
        let mut conn = self.get_connection()?;
        conn.del::<_, ()>(key)
            .map_err(|e| AppError::InternalServerError(format!("Redis delete error: {}", e)))?;
        Ok(())
    }

    /// Delete multiple keys
    pub fn delete_many(&self, keys: &[String]) -> AppResult<()> {
        if keys.is_empty() {
            return Ok(());
        }
        
        let mut conn = self.get_connection()?;
        conn.del::<_, ()>(keys)
            .map_err(|e| AppError::InternalServerError(format!("Redis delete_many error: {}", e)))?;
        Ok(())
    }

    /// Check if a key exists
    pub fn exists(&self, key: &str) -> AppResult<bool> {
        let mut conn = self.get_connection()?;
        let result: Result<bool, _> = conn.exists(key);
        result.map_err(|e| AppError::InternalServerError(format!("Redis exists error: {}", e)))
    }

    /// Get multiple values
    pub fn get_many<T>(&self, keys: &[String]) -> AppResult<HashMap<String, T>>
    where
        T: for<'de> Deserialize<'de>,
    {
        if keys.is_empty() {
            return Ok(HashMap::new());
        }
        
        let mut conn = self.get_connection()?;
        let result: Result<Vec<Option<String>>, _> = conn.mget(keys);
        
        match result {
            Ok(values) => {
                let mut map = HashMap::new();
                for (key, value) in keys.iter().zip(values.iter()) {
                    if let Some(value_str) = value {
                        if let Ok(deserialized) = serde_json::from_str::<T>(value_str) {
                            map.insert(key.clone(), deserialized);
                        }
                    }
                }
                Ok(map)
            }
            Err(e) => Err(AppError::InternalServerError(format!("Redis mget error: {}", e))),
        }
    }

    /// Set multiple values
    pub fn set_many<T>(&self, values: HashMap<String, T>, ttl: Option<Duration>) -> AppResult<()>
    where
        T: Serialize,
    {
        if values.is_empty() {
            return Ok(());
        }
        
        let mut conn = self.get_connection()?;
        let mut serialized_values = HashMap::new();
        
        for (key, value) in values {
            let serialized = serde_json::to_string(&value)
                .map_err(|e| AppError::InternalServerError(format!("Failed to serialize cache value: {}", e)))?;
            serialized_values.insert(key, serialized);
        }
        
        let serialized_pairs: Vec<(&String, &String)> = serialized_values.iter().collect();
        conn.mset::<_, _, ()>(&serialized_pairs)
            .map_err(|e| AppError::InternalServerError(format!("Redis mset error: {}", e)))?;
        
        if let Some(duration) = ttl {
            for key in serialized_values.keys() {
                conn.expire::<_, ()>(key, duration.as_secs() as usize)
                    .map_err(|e| AppError::InternalServerError(format!("Redis expire error: {}", e)))?;
            }
        }
        
        Ok(())
    }

    /// Clear all cache
    pub fn clear(&self) -> AppResult<()> {
        let mut conn = self.get_connection()?;
        // Use FLUSHDB command instead of flushdb method
        redis::cmd("FLUSHDB")
            .execute(&mut conn);
        Ok(())
    }

    /// Get cache statistics
    pub fn get_stats(&self) -> AppResult<CacheStats> {
        // For now, return default stats
        // In a real implementation, you would track these metrics
        Ok(CacheStats::default())
    }

    /// Health check
    pub fn health_check(&self) -> AppResult<()> {
        let mut conn = self.get_connection()?;
        // Use PING command instead of ping method
        redis::cmd("PING")
            .execute(&mut conn);
        Ok(())
    }
}

/// Cache key generators
pub mod keys {
    use super::*;

    /// Generate user cache key
    pub fn user(user_id: Uuid) -> String {
        format!("user:{}", user_id)
    }

    /// Generate project cache key
    pub fn project(project_id: Uuid) -> String {
        format!("project:{}", project_id)
    }

    /// Generate reconciliation job cache key
    pub fn reconciliation_job(job_id: Uuid) -> String {
        format!("reconciliation_job:{}", job_id)
    }

    /// Generate analytics cache key
    pub fn analytics(project_id: Uuid, period: &str) -> String {
        format!("analytics:{}:{}", project_id, period)
    }

    /// Generate session cache key
    pub fn session(session_id: &str) -> String {
        format!("session:{}", session_id)
    }

    /// Generate file cache key
    pub fn file(file_id: Uuid) -> String {
        format!("file:{}", file_id)
    }
}
