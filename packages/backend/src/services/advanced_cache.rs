// backend/src/services/advanced_cache.rs
use crate::errors::{AppError, AppResult};
use redis::{Client, Connection, Commands};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{Duration, Instant};
use uuid::Uuid;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::hash::{Hash, Hasher};
use std::collections::hash_map::DefaultHasher;

/// Advanced caching strategies
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CacheStrategy {
    /// Cache with TTL (Time To Live)
    TTL(Duration),
    /// Cache until explicitly invalidated
    Persistent,
    /// Cache with write-through strategy
    WriteThrough,
    /// Cache with write-behind strategy
    WriteBehind,
    /// Cache with read-through strategy
    ReadThrough,
    /// Cache with refresh-ahead strategy
    RefreshAhead(Duration),
}

/// Cache entry with metadata
#[derive(Debug, Clone)]
pub struct CacheEntry<T> {
    pub data: T,
    pub created_at: Instant,
    pub last_accessed: Instant,
    pub access_count: u64,
    pub strategy: CacheStrategy,
    pub tags: Vec<String>,
}

impl<T> CacheEntry<T> {
    pub fn new(data: T, strategy: CacheStrategy) -> Self {
        let now = Instant::now();
        Self {
            data,
            created_at: now,
            last_accessed: now,
            access_count: 1,
            strategy,
            tags: Vec::new(),
        }
    }

    pub fn is_expired(&self) -> bool {
        match &self.strategy {
            CacheStrategy::TTL(ttl) => Instant::now() > self.created_at + *ttl,
            CacheStrategy::Persistent => false,
            CacheStrategy::WriteThrough => false,
            CacheStrategy::WriteBehind => false,
            CacheStrategy::ReadThrough => false,
            CacheStrategy::RefreshAhead(refresh_interval) => {
                Instant::now() > self.last_accessed + *refresh_interval
            }
        }
    }

    pub fn should_refresh(&self) -> bool {
        match &self.strategy {
            CacheStrategy::RefreshAhead(refresh_interval) => {
                Instant::now() > self.last_accessed + *refresh_interval
            }
            _ => false,
        }
    }
}

/// Advanced cache service with multiple strategies
#[derive(Clone)]
pub struct AdvancedCacheService {
    redis_client: Client,
    local_cache: Arc<RwLock<HashMap<String, CacheEntry<serde_json::Value>>>>,
    cache_stats: Arc<RwLock<AdvancedCacheStats>>,
    max_local_size: usize,
    refresh_workers: Arc<RwLock<HashMap<String, tokio::task::JoinHandle<()>>>>,
}

/// Advanced cache statistics
#[derive(Debug, Clone, Default)]
pub struct AdvancedCacheStats {
    pub hits: u64,
    pub misses: u64,
    pub sets: u64,
    pub deletes: u64,
    pub evictions: u64,
    pub refreshes: u64,
    pub errors: u64,
    pub local_hits: u64,
    pub redis_hits: u64,
    pub write_through_operations: u64,
    pub write_behind_operations: u64,
}

impl AdvancedCacheService {
    pub fn new(redis_url: &str) -> AppResult<Self> {
        let redis_client = Client::open(redis_url)
            .map_err(|e| AppError::InternalServerError(format!("Failed to connect to Redis: {}", e)))?;

        Ok(Self {
            redis_client,
            local_cache: Arc::new(RwLock::new(HashMap::new())),
            cache_stats: Arc::new(RwLock::new(AdvancedCacheStats::default())),
            max_local_size: 1000,
            refresh_workers: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    /// Get value with advanced caching strategies
    pub async fn get<T>(&self, key: &str) -> AppResult<Option<T>>
    where
        T: for<'de> Deserialize<'de> + Clone + Serialize + Send + Sync + 'static,
    {
        // Check local cache first
        if let Some(entry) = self.local_cache.read().await.get(key) {
            if !entry.is_expired() {
                // Update access statistics
                let mut local_cache = self.local_cache.write().await;
                if let Some(entry) = local_cache.get_mut(key) {
                    entry.last_accessed = Instant::now();
                    entry.access_count += 1;
                }
                
                self.record_local_hit().await;
                
                let deserialized: T = serde_json::from_value(entry.data.clone())
                    .map_err(|e| AppError::InternalServerError(format!("Failed to deserialize local cache value: {}", e)))?;
                
                return Ok(Some(deserialized));
            } else {
                // Remove expired entry
                self.local_cache.write().await.remove(key);
            }
        }

        // Check Redis cache
        if let Some(value) = self.get_from_redis::<T>(key)? {
            // Store in local cache for next time
            let json_value = serde_json::to_value(&value)
                .map_err(|e| AppError::InternalServerError(format!("Failed to serialize for local cache: {}", e)))?;
            
            let entry = CacheEntry::new(json_value, CacheStrategy::TTL(Duration::from_secs(300)));
            self.store_in_local_cache(key, entry).await;
            
            self.record_redis_hit().await;
            return Ok(Some(value));
        }

        self.record_miss().await;
        Ok(None)
    }

    /// Set value with advanced caching strategies
    pub async fn set<T>(&self, key: &str, value: &T, strategy: CacheStrategy) -> AppResult<()>
    where
        T: Serialize + Send + Sync + 'static,
    {
        match strategy {
            CacheStrategy::WriteThrough => {
                // Write to both cache and underlying storage
                self.write_through(key, value).await?;
            }
            CacheStrategy::WriteBehind => {
                // Write to cache immediately, queue for underlying storage
                self.write_behind(key, value).await?;
            }
            _ => {
                // Standard cache write
                self.standard_set(key, value, strategy).await?;
            }
        }

        Ok(())
    }

    /// Standard cache set operation
    async fn standard_set<T>(&self, key: &str, value: &T, strategy: CacheStrategy) -> AppResult<()>
    where
        T: Serialize,
    {
        // Set in Redis
        self.set_in_redis(key, value, &strategy)?;

        // Set in local cache
        let json_value = serde_json::to_value(value)
            .map_err(|e| AppError::InternalServerError(format!("Failed to serialize for local cache: {}", e)))?;
        
        let entry = CacheEntry::new(json_value, strategy);
        self.store_in_local_cache(key, entry).await;

        self.record_set().await;
        Ok(())
    }

    /// Write-through strategy implementation
    async fn write_through<T>(&self, key: &str, value: &T) -> AppResult<()>
    where
        T: Serialize + Send + Sync + 'static,
    {
        // Write to underlying storage first (this would be implemented with actual storage service)
        // For now, we'll simulate this
        self.simulate_storage_write(key, value).await?;

        // Then write to cache
        self.standard_set(key, value, CacheStrategy::Persistent).await?;

        self.record_write_through().await;
        Ok(())
    }

    /// Write-behind strategy implementation
    async fn write_behind<T>(&self, key: &str, value: &T) -> AppResult<()>
    where
        T: Serialize + Send + Sync + 'static,
    {
        // Write to cache immediately
        self.standard_set(key, value, CacheStrategy::Persistent).await?;

        // Queue for background write to storage
        self.queue_write_behind(key, value).await?;

        self.record_write_behind().await;
        Ok(())
    }

    /// Queue write-behind operation
    async fn queue_write_behind<T>(&self, key: &str, value: &T) -> AppResult<()>
    where
        T: Serialize + Send + Sync + 'static,
    {
        // In a real implementation, this would queue the operation for background processing
        // For now, we'll simulate this
        let key = key.to_string();
        let value_json = serde_json::to_value(value)
            .map_err(|e| AppError::InternalServerError(format!("Failed to serialize for write-behind: {}", e)))?;

        tokio::spawn(async move {
            // Simulate background write
            tokio::time::sleep(Duration::from_millis(100)).await;
            // Actual storage write would happen here
            println!("Write-behind operation completed for key: {}", key);
        });

        Ok(())
    }

    /// Simulate storage write operation
    async fn simulate_storage_write<T>(&self, _key: &str, _value: &T) -> AppResult<()> {
        // Simulate storage write delay
        tokio::time::sleep(Duration::from_millis(50)).await;
        Ok(())
    }

    /// Get value from Redis
    fn get_from_redis<T>(&self, key: &str) -> AppResult<Option<T>>
    where
        T: for<'de> Deserialize<'de>,
    {
        let mut conn = self.get_redis_connection()?;
        let result: Result<Option<String>, _> = conn.get(key);
        
        match result {
            Ok(Some(value)) => {
                let deserialized: T = serde_json::from_str(&value)
                    .map_err(|e| AppError::InternalServerError(format!("Failed to deserialize Redis value: {}", e)))?;
                Ok(Some(deserialized))
            }
            Ok(None) => Ok(None),
            Err(e) => Err(AppError::InternalServerError(format!("Redis get error: {}", e))),
        }
    }

    /// Set value in Redis
    fn set_in_redis<T>(&self, key: &str, value: &T, strategy: &CacheStrategy) -> AppResult<()>
    where
        T: Serialize,
    {
        let mut conn = self.get_redis_connection()?;
        let serialized = serde_json::to_string(value)
            .map_err(|e| AppError::InternalServerError(format!("Failed to serialize Redis value: {}", e)))?;
        
        match strategy {
            CacheStrategy::TTL(ttl) => {
                conn.set_ex::<_, _, ()>(key, serialized, ttl.as_secs() as usize)
                    .map_err(|e| AppError::InternalServerError(format!("Redis set_ex error: {}", e)))?;
            }
            _ => {
                conn.set::<_, _, ()>(key, serialized)
                    .map_err(|e| AppError::InternalServerError(format!("Redis set error: {}", e)))?;
            }
        }
        
        Ok(())
    }

    /// Store entry in local cache
    async fn store_in_local_cache(&self, key: &str, entry: CacheEntry<serde_json::Value>) {
        let mut local_cache = self.local_cache.write().await;
        
        // Check if we need to evict entries
        if local_cache.len() >= self.max_local_size {
            self.evict_least_recently_used(&mut local_cache).await;
        }
        
        local_cache.insert(key.to_string(), entry);
    }

    /// Evict least recently used entries
    async fn evict_least_recently_used(&self, cache: &mut HashMap<String, CacheEntry<serde_json::Value>>) {
        let evict_count = (self.max_local_size * 20) / 100; // Evict 20%
        let mut entries: Vec<_> = cache.iter().map(|(k, v)| (k.clone(), v.last_accessed)).collect();
        entries.sort_by_key(|(_, last_accessed)| *last_accessed);
        
        for (key, _) in entries.iter().take(evict_count) {
            cache.remove(key);
        }
        
        self.record_eviction().await;
    }

    /// Get Redis connection
    fn get_redis_connection(&self) -> AppResult<Connection> {
        self.redis_client.get_connection()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get Redis connection: {}", e)))
    }

    /// Delete value from cache
    pub async fn delete(&self, key: &str) -> AppResult<()> {
        // Delete from Redis
        let mut conn = self.get_redis_connection()?;
        conn.del::<_, ()>(key)
            .map_err(|e| AppError::InternalServerError(format!("Redis delete error: {}", e)))?;

        // Delete from local cache
        self.local_cache.write().await.remove(key);

        self.record_delete().await;
        Ok(())
    }

    /// Delete by tags
    pub async fn delete_by_tags(&self, tags: &[String]) -> AppResult<()> {
        let mut keys_to_delete = Vec::new();
        
        // Find keys with matching tags
        {
            let local_cache = self.local_cache.read().await;
            for (key, entry) in local_cache.iter() {
                if tags.iter().any(|tag| entry.tags.contains(tag)) {
                    keys_to_delete.push(key.clone());
                }
            }
        }

        // Delete found keys
        for key in keys_to_delete {
            self.delete(&key).await?;
        }

        Ok(())
    }

    /// Invalidate cache by pattern
    pub async fn invalidate_pattern(&self, pattern: &str) -> AppResult<()> {
        let mut conn = self.get_redis_connection()?;
        let keys: Result<Vec<String>, _> = conn.keys(pattern);
        
        match keys {
            Ok(keys) => {
                if !keys.is_empty() {
                    conn.del::<_, ()>(keys)
                        .map_err(|e| AppError::InternalServerError(format!("Redis delete pattern error: {}", e)))?;
                }
            }
            Err(e) => return Err(AppError::InternalServerError(format!("Redis keys error: {}", e))),
        }

        Ok(())
    }

    /// Warm cache with frequently accessed data
    pub async fn warm_cache(&self, warmup_data: HashMap<String, serde_json::Value>) -> AppResult<()> {
        for (key, value) in warmup_data {
            let entry = CacheEntry::new(value, CacheStrategy::TTL(Duration::from_secs(3600)));
            self.store_in_local_cache(&key, entry).await;
        }

        Ok(())
    }

    /// Get cache statistics
    pub async fn get_stats(&self) -> AppResult<AdvancedCacheStats> {
        let stats = self.cache_stats.read().await.clone();
        Ok(stats)
    }

    /// Clear all cache
    pub async fn clear(&self) -> AppResult<()> {
        // Clear Redis
        let mut conn = self.get_redis_connection()?;
        redis::cmd("FLUSHDB").execute(&mut conn);

        // Clear local cache
        self.local_cache.write().await.clear();

        Ok(())
    }

    /// Health check
    pub fn health_check(&self) -> AppResult<()> {
        let mut conn = self.get_redis_connection()?;
        redis::cmd("PING").execute(&mut conn);
        Ok(())
    }

    // Statistics recording methods
    async fn record_hit(&self) {
        let mut stats = self.cache_stats.write().await;
        stats.hits += 1;
    }

    async fn record_local_hit(&self) {
        let mut stats = self.cache_stats.write().await;
        stats.hits += 1;
        stats.local_hits += 1;
    }

    async fn record_redis_hit(&self) {
        let mut stats = self.cache_stats.write().await;
        stats.hits += 1;
        stats.redis_hits += 1;
    }

    async fn record_miss(&self) {
        let mut stats = self.cache_stats.write().await;
        stats.misses += 1;
    }

    async fn record_set(&self) {
        let mut stats = self.cache_stats.write().await;
        stats.sets += 1;
    }

    async fn record_delete(&self) {
        let mut stats = self.cache_stats.write().await;
        stats.deletes += 1;
    }

    async fn record_eviction(&self) {
        let mut stats = self.cache_stats.write().await;
        stats.evictions += 1;
    }

    async fn record_refresh(&self) {
        let mut stats = self.cache_stats.write().await;
        stats.refreshes += 1;
    }

    async fn record_write_through(&self) {
        let mut stats = self.cache_stats.write().await;
        stats.write_through_operations += 1;
    }

    async fn record_write_behind(&self) {
        let mut stats = self.cache_stats.write().await;
        stats.write_behind_operations += 1;
    }
}

/// Query result cache for database queries
pub struct QueryResultCache {
    cache_service: AdvancedCacheService,
    query_stats: Arc<RwLock<QueryCacheStats>>,
}

/// Query cache statistics
#[derive(Debug, Clone, Default)]
pub struct QueryCacheStats {
    pub query_hits: u64,
    pub query_misses: u64,
    pub query_sets: u64,
    pub query_invalidations: u64,
}

impl QueryResultCache {
    pub fn new(cache_service: AdvancedCacheService) -> Self {
        Self {
            cache_service,
            query_stats: Arc::new(RwLock::new(QueryCacheStats::default())),
        }
    }

    /// Cache query result
    pub async fn cache_query<T>(&self, query_hash: u64, result: &T, ttl: Duration) -> AppResult<()>
    where
        T: Serialize + Send + Sync + 'static,
    {
        let key = format!("query:{}", query_hash);
        self.cache_service.set(&key, result, CacheStrategy::TTL(ttl)).await?;
        
        let mut stats = self.query_stats.write().await;
        stats.query_sets += 1;
        
        Ok(())
    }

    /// Get cached query result
    pub async fn get_cached_query<T>(&self, query_hash: u64) -> AppResult<Option<T>>
    where
        T: for<'de> Deserialize<'de> + Clone + Serialize + Send + Sync + 'static,
    {
        let key = format!("query:{}", query_hash);
        let result = self.cache_service.get(&key).await?;
        
        let mut stats = self.query_stats.write().await;
        if result.is_some() {
            stats.query_hits += 1;
        } else {
            stats.query_misses += 1;
        }
        
        Ok(result)
    }

    /// Generate query hash
    pub fn hash_query(&self, query: &str, params: &[serde_json::Value]) -> u64 {
        let mut hasher = DefaultHasher::new();
        query.hash(&mut hasher);
        for param in params {
            param.to_string().hash(&mut hasher);
        }
        hasher.finish()
    }

    /// Invalidate query cache by pattern
    pub async fn invalidate_query_pattern(&self, pattern: &str) -> AppResult<()> {
        let full_pattern = format!("query:*{}*", pattern);
        self.cache_service.invalidate_pattern(&full_pattern).await?;
        
        let mut stats = self.query_stats.write().await;
        stats.query_invalidations += 1;
        
        Ok(())
    }

    /// Get query cache statistics
    pub async fn get_query_stats(&self) -> AppResult<QueryCacheStats> {
        let stats = self.query_stats.read().await.clone();
        Ok(stats)
    }
}

/// CDN integration service
pub struct CDNService {
    cache_service: AdvancedCacheService,
    cdn_endpoint: String,
    cdn_api_key: String,
}

impl CDNService {
    pub fn new(cache_service: AdvancedCacheService, cdn_endpoint: String, cdn_api_key: String) -> Self {
        Self {
            cache_service,
            cdn_endpoint,
            cdn_api_key,
        }
    }

    /// Purge CDN cache
    pub async fn purge_cache(&self, paths: &[String]) -> AppResult<()> {
        // In a real implementation, this would make API calls to the CDN service
        // For now, we'll simulate this
        for path in paths {
            println!("Purging CDN cache for path: {}", path);
            // Simulate API call delay
            tokio::time::sleep(Duration::from_millis(100)).await;
        }

        Ok(())
    }

    /// Preload CDN cache
    pub async fn preload_cache(&self, paths: &[String]) -> AppResult<()> {
        // In a real implementation, this would make API calls to preload the CDN cache
        for path in paths {
            println!("Preloading CDN cache for path: {}", path);
            // Simulate API call delay
            tokio::time::sleep(Duration::from_millis(100)).await;
        }

        Ok(())
    }

    /// Get CDN cache status
    pub async fn get_cache_status(&self, path: &str) -> AppResult<bool> {
        // In a real implementation, this would check CDN cache status
        // For now, we'll simulate this
        tokio::time::sleep(Duration::from_millis(50)).await;
        Ok(true)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[tokio::test]
    async fn test_advanced_cache_service() {
        // This test would require a Redis instance
        // For now, we'll just test the structure
        let cache_service = AdvancedCacheService::new("redis://localhost:6379").unwrap();
        
        // Test basic operations
        let test_data = json!({"test": "data"});
        let strategy = CacheStrategy::TTL(Duration::from_secs(60));
        
        // Note: These operations would require Redis to be running
        // cache_service.set("test_key", &test_data, strategy).await.unwrap();
        // let result = cache_service.get::<serde_json::Value>("test_key").await.unwrap();
        // assert!(result.is_some());
    }

    #[test]
    fn test_query_hash() {
        let cache_service = AdvancedCacheService::new("redis://localhost:6379").unwrap();
        let query_cache = QueryResultCache::new(cache_service);
        
        let query = "SELECT * FROM users WHERE id = ?";
        let params = vec![json!("123")];
        
        let hash1 = query_cache.hash_query(query, &params);
        let hash2 = query_cache.hash_query(query, &params);
        
        assert_eq!(hash1, hash2);
    }
}
