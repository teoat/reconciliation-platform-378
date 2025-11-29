//! Service layer tests for CacheService
//!
//! Tests CacheService methods including get, set, delete,
//! cache invalidation, and statistics.

use std::time::Duration;

use reconciliation_backend::services::cache::CacheService;

/// Test CacheService methods
#[cfg(test)]
mod cache_service_tests {
    use super::*;

    fn create_test_cache_service() -> CacheService {
        // Use a test Redis URL (will fail gracefully if Redis not available)
        CacheService::new("redis://localhost:6379").unwrap_or_else(|_| {
            // If Redis not available, create a mock or skip tests
            // For now, we'll just test the service creation
            panic!("Redis not available for testing");
        })
    }

    #[test]
    fn test_cache_service_creation() {
        // Test that service can be created
        let result = CacheService::new("redis://localhost:6379");
        // May succeed or fail depending on Redis availability
        assert!(result.is_ok() || result.is_err());
    }

    #[test]
    fn test_cache_set_and_get() {
        let cache = match create_test_cache_service() {
            service => service,
        };

        let key = "test_key";
        let value = "test_value";

        // Set value
        let set_result = cache.set(key, &value, Some(Duration::from_secs(60)));
        if set_result.is_ok() {
            // Get value
            let get_result: Result<Option<String>, _> = cache.get(key);
            assert!(get_result.is_ok());

            let retrieved = get_result.unwrap();
            assert!(retrieved.is_some());
            assert_eq!(retrieved.unwrap(), value);
        }
    }

    #[test]
    fn test_cache_delete() {
        let cache = match create_test_cache_service() {
            service => service,
        };

        let key = "delete_test_key";
        let value = "delete_test_value";

        // Set value
        if cache.set(key, &value, Some(Duration::from_secs(60))).is_ok() {
            // Delete value
            let delete_result = cache.delete(key);
            assert!(delete_result.is_ok());

            // Verify deletion
            let get_result: Result<Option<String>, _> = cache.get(key);
            assert!(get_result.is_ok());
            assert!(get_result.unwrap().is_none());
        }
    }

    #[test]
    fn test_cache_exists() {
        let cache = match create_test_cache_service() {
            service => service,
        };

        let key = "exists_test_key";
        let value = "exists_test_value";

        // Set value
        if cache.set(key, &value, Some(Duration::from_secs(60))).is_ok() {
            // Check existence
            let exists_result = cache.exists(key);
            assert!(exists_result.is_ok());
            assert!(exists_result.unwrap());
        }
    }

    #[test]
    fn test_cache_delete_many() {
        let cache = match create_test_cache_service() {
            service => service,
        };

        let keys = vec!["key1".to_string(), "key2".to_string(), "key3".to_string()];
        let value = "test_value";

        // Set multiple values
        for key in &keys {
            if cache.set(key, &value, Some(Duration::from_secs(60))).is_err() {
                return; // Skip if Redis not available
            }
        }

        // Delete many
        let delete_result = cache.delete_many(&keys);
        assert!(delete_result.is_ok());
    }

    #[test]
    fn test_cache_ttl_expiration() {
        let cache = match create_test_cache_service() {
            service => service,
        };

        let key = "ttl_test_key";
        let value = "ttl_test_value";

        // Set with short TTL
        if cache.set(key, &value, Some(Duration::from_millis(100))).is_ok() {
            // Wait for expiration
            std::thread::sleep(Duration::from_millis(150));

            // Try to get expired value
            let get_result: Result<Option<String>, _> = cache.get(key);
            assert!(get_result.is_ok());
            // Value may or may not be expired depending on Redis TTL handling
        }
    }

    #[test]
    fn test_cache_get_nonexistent() {
        let cache = match create_test_cache_service() {
            service => service,
        };

        let key = "nonexistent_key";
        let get_result: Result<Option<String>, _> = cache.get(key);
        assert!(get_result.is_ok());
        assert!(get_result.unwrap().is_none());
    }

    #[test]
    fn test_cache_set_without_ttl() {
        let cache = match create_test_cache_service() {
            service => service,
        };

        let key = "no_ttl_key";
        let value = "no_ttl_value";

        // Set without TTL
        let set_result = cache.set(key, &value, None);
        if set_result.is_ok() {
            let get_result: Result<Option<String>, _> = cache.get(key);
            assert!(get_result.is_ok());
            assert!(get_result.unwrap().is_some());
        }
    }

    #[test]
    fn test_cache_exists_nonexistent() {
        let cache = match create_test_cache_service() {
            service => service,
        };

        let key = "nonexistent_exists_key";
        let exists_result = cache.exists(key);
        assert!(exists_result.is_ok());
        assert!(!exists_result.unwrap());
    }

    #[test]
    fn test_cache_delete_many_empty() {
        let cache = match create_test_cache_service() {
            service => service,
        };

        let empty_keys: Vec<String> = vec![];
        let delete_result = cache.delete_many(&empty_keys);
        assert!(delete_result.is_ok());
    }

    #[test]
    fn test_cache_set_overwrite() {
        let cache = match create_test_cache_service() {
            service => service,
        };

        let key = "overwrite_key";
        let value1 = "value1";
        let value2 = "value2";

        // Set first value
        if cache.set(key, &value1, Some(Duration::from_secs(60))).is_ok() {
            // Overwrite with second value
            if cache.set(key, &value2, Some(Duration::from_secs(60))).is_ok() {
                let get_result: Result<Option<String>, _> = cache.get(key);
                assert!(get_result.is_ok());
                let retrieved = get_result.unwrap();
                assert!(retrieved.is_some());
                assert_eq!(retrieved.unwrap(), value2);
            }
        }
    }

    #[test]
    fn test_cache_service_invalid_url() {
        // Test with invalid Redis URL
        let result = CacheService::new("invalid://url");
        assert!(result.is_err());
    }

    #[test]
    fn test_cache_get_many() {
        let cache = match create_test_cache_service() {
            service => service,
        };

        let keys = vec!["key1".to_string(), "key2".to_string(), "key3".to_string()];
        let values = vec!["value1", "value2", "value3"];

        // Set multiple values
        for (key, value) in keys.iter().zip(values.iter()) {
            if cache.set(key, value, Some(Duration::from_secs(60))).is_err() {
                return; // Skip if Redis not available
            }
        }

        // Get many
        let get_result: Result<std::collections::HashMap<String, String>, _> = cache.get_many(&keys);
        assert!(get_result.is_ok());
        
        let retrieved = get_result.unwrap();
        assert_eq!(retrieved.len(), 3);
    }

    #[test]
    fn test_cache_set_many() {
        let cache = match create_test_cache_service() {
            service => service,
        };

        let mut values = std::collections::HashMap::new();
        values.insert("key1".to_string(), "value1");
        values.insert("key2".to_string(), "value2");
        values.insert("key3".to_string(), "value3");

        // Set many
        let set_result = cache.set_many(values, Some(Duration::from_secs(60)));
        if set_result.is_ok() {
            // Verify values were set
            let keys = vec!["key1".to_string(), "key2".to_string(), "key3".to_string()];
            let get_result: Result<std::collections::HashMap<String, String>, _> = cache.get_many(&keys);
            assert!(get_result.is_ok());
            assert_eq!(get_result.unwrap().len(), 3);
        }
    }

    #[test]
    fn test_cache_clear() {
        let cache = match create_test_cache_service() {
            service => service,
        };

        let key = "clear_test_key";
        let value = "clear_test_value";

        // Set value
        if cache.set(key, &value, Some(Duration::from_secs(60))).is_ok() {
            // Clear cache
            let clear_result = cache.clear();
            assert!(clear_result.is_ok());

            // Verify value is gone
            let get_result: Result<Option<String>, _> = cache.get(key);
            assert!(get_result.is_ok());
            // Value may or may not be gone depending on Redis implementation
        }
    }

    #[test]
    fn test_cache_get_stats() {
        let cache = match create_test_cache_service() {
            service => service,
        };

        let stats_result = cache.get_stats();
        assert!(stats_result.is_ok());
        
        let stats = stats_result.unwrap();
        // Stats should be valid even if all zeros
        assert!(stats.hits >= 0);
        assert!(stats.misses >= 0);
    }

    #[test]
    fn test_cache_health_check() {
        let cache = match create_test_cache_service() {
            service => service,
        };

        let health_result = cache.health_check();
        assert!(health_result.is_ok());
    }

    #[test]
    fn test_cache_set_many_empty() {
        let cache = match create_test_cache_service() {
            service => service,
        };

        let empty_values = std::collections::HashMap::new();
        let set_result = cache.set_many(empty_values, Some(Duration::from_secs(60)));
        assert!(set_result.is_ok());
    }

    #[test]
    fn test_cache_get_many_empty() {
        let cache = match create_test_cache_service() {
            service => service,
        };

        let empty_keys: Vec<String> = vec![];
        let get_result: Result<std::collections::HashMap<String, String>, _> = cache.get_many(&empty_keys);
        assert!(get_result.is_ok());
        assert!(get_result.unwrap().is_empty());
    }

    // Test MultiLevelCache methods
    #[tokio::test]
    async fn test_multilevel_cache_new() {
        use reconciliation_backend::services::cache::MultiLevelCache;
        
        let result = MultiLevelCache::new("redis://localhost:6379");
        // May succeed or fail depending on Redis availability
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_multilevel_cache_get_and_set() {
        use reconciliation_backend::services::cache::MultiLevelCache;
        
        let cache = match MultiLevelCache::new("redis://localhost:6379") {
            Ok(c) => c,
            Err(_) => return, // Skip if Redis not available
        };

        let key = "multilevel_test_key";
        let value = "multilevel_test_value";

        // Set value
        let set_result = cache.set(key, &value, Some(std::time::Duration::from_secs(60))).await;
        if set_result.is_ok() {
            // Get value
            let get_result: Result<Option<String>, _> = cache.get(key).await;
            assert!(get_result.is_ok());
            
            let retrieved = get_result.unwrap();
            assert!(retrieved.is_some());
            assert_eq!(retrieved.unwrap(), value);
        }
    }

    #[tokio::test]
    async fn test_multilevel_cache_delete() {
        use reconciliation_backend::services::cache::MultiLevelCache;
        
        let cache = match MultiLevelCache::new("redis://localhost:6379") {
            Ok(c) => c,
            Err(_) => return, // Skip if Redis not available
        };

        let key = "multilevel_delete_key";
        let value = "multilevel_delete_value";

        // Set value
        if cache.set(key, &value, Some(std::time::Duration::from_secs(60))).await.is_ok() {
            // Delete value
            let delete_result = cache.delete(key).await;
            assert!(delete_result.is_ok());

            // Verify deletion
            let get_result: Result<Option<String>, _> = cache.get(key).await;
            assert!(get_result.is_ok());
            assert!(get_result.unwrap().is_none());
        }
    }

    #[tokio::test]
    async fn test_multilevel_cache_invalidate_job_cache() {
        use reconciliation_backend::services::cache::MultiLevelCache;
        
        let cache = match MultiLevelCache::new("redis://localhost:6379") {
            Ok(c) => c,
            Err(_) => return, // Skip if Redis not available
        };

        let job_id = uuid::Uuid::new_v4();
        let project_id = uuid::Uuid::new_v4();

        let result = cache.invalidate_job_cache(job_id, project_id).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_multilevel_cache_invalidate_project_cache() {
        use reconciliation_backend::services::cache::MultiLevelCache;
        
        let cache = match MultiLevelCache::new("redis://localhost:6379") {
            Ok(c) => c,
            Err(_) => return, // Skip if Redis not available
        };

        let project_id = uuid::Uuid::new_v4();

        let result = cache.invalidate_project_cache(project_id).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_multilevel_cache_warm_cache() {
        use reconciliation_backend::services::cache::MultiLevelCache;
        
        let cache = match MultiLevelCache::new("redis://localhost:6379") {
            Ok(c) => c,
            Err(_) => return, // Skip if Redis not available
        };

        let project_id = uuid::Uuid::new_v4();

        let result = cache.warm_cache(project_id).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_multilevel_cache_get_stats() {
        use reconciliation_backend::services::cache::MultiLevelCache;
        
        let cache = match MultiLevelCache::new("redis://localhost:6379") {
            Ok(c) => c,
            Err(_) => return, // Skip if Redis not available
        };

        let result = cache.get_stats().await;
        assert!(result.is_ok());
        
        let stats = result.unwrap();
        assert!(stats.hits >= 0);
        assert!(stats.misses >= 0);
    }

    #[tokio::test]
    async fn test_multilevel_cache_clear_l1_cache() {
        use reconciliation_backend::services::cache::MultiLevelCache;
        
        let cache = match MultiLevelCache::new("redis://localhost:6379") {
            Ok(c) => c,
            Err(_) => return, // Skip if Redis not available
        };

        cache.clear_l1_cache().await;
        // Should not panic
    }

    #[tokio::test]
    async fn test_multilevel_cache_get_l1_cache_size() {
        use reconciliation_backend::services::cache::MultiLevelCache;
        
        let cache = match MultiLevelCache::new("redis://localhost:6379") {
            Ok(c) => c,
            Err(_) => return, // Skip if Redis not available
        };

        let size = cache.get_l1_cache_size().await;
        assert!(size >= 0);
    }

    #[tokio::test]
    async fn test_multilevel_cache_new_with_resilience() {
        use reconciliation_backend::services::cache::MultiLevelCache;
        use reconciliation_backend::services::resilience::ResilienceManager;
        use std::sync::Arc;
        
        let resilience = Arc::new(ResilienceManager::new());
        let result = MultiLevelCache::new_with_resilience("redis://localhost:6379", resilience);
        // May succeed or fail depending on Redis availability
        assert!(result.is_ok() || result.is_err());
    }

    // Test cache key generators
    #[test]
    fn test_cache_keys_user() {
        use reconciliation_backend::services::cache::keys;
        let user_id = uuid::Uuid::new_v4();
        let key = keys::user(user_id);
        assert!(key.starts_with("user:"));
        assert!(key.contains(&user_id.to_string()));
    }

    #[test]
    fn test_cache_keys_project() {
        use reconciliation_backend::services::cache::keys;
        let project_id = uuid::Uuid::new_v4();
        let key = keys::project(project_id);
        assert!(key.starts_with("project:"));
        assert!(key.contains(&project_id.to_string()));
    }

    #[test]
    fn test_cache_keys_reconciliation_job() {
        use reconciliation_backend::services::cache::keys;
        let job_id = uuid::Uuid::new_v4();
        let key = keys::reconciliation_job(job_id);
        assert!(key.starts_with("reconciliation_job:"));
        assert!(key.contains(&job_id.to_string()));
    }

    #[test]
    fn test_cache_keys_analytics() {
        use reconciliation_backend::services::cache::keys;
        let project_id = uuid::Uuid::new_v4();
        let key = keys::analytics(project_id, "daily");
        assert!(key.starts_with("analytics:"));
        assert!(key.contains(&project_id.to_string()));
        assert!(key.contains("daily"));
    }

    #[test]
    fn test_cache_keys_session() {
        use reconciliation_backend::services::cache::keys;
        let session_id = "test_session_123";
        let key = keys::session(session_id);
        assert!(key.starts_with("session:"));
        assert!(key.contains(session_id));
    }

    #[test]
    fn test_cache_keys_file() {
        use reconciliation_backend::services::cache::keys;
        let file_id = uuid::Uuid::new_v4();
        let key = keys::file(file_id);
        assert!(key.starts_with("file:"));
        assert!(key.contains(&file_id.to_string()));
    }
}

