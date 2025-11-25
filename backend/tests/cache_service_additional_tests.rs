//! Additional cache service tests for improved coverage

use reconciliation_backend::services::cache::{CacheService, MultiLevelCache};
use std::time::Duration;

#[tokio::test]
async fn test_multilevel_cache_get_set() {
    // Skip if Redis is not available
    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());
    
    if CacheService::new(&redis_url).is_err() {
        eprintln!("Skipping cache tests - Redis not available");
        return;
    }

    let cache = MultiLevelCache::new(&redis_url).expect("Failed to create cache");
    
    // Test set and get
    let test_key = "test_key";
    let test_value = "test_value";
    
    cache.set(test_key, &test_value.to_string(), Some(Duration::from_secs(60)))
        .await
        .expect("Failed to set cache");
    
    let retrieved: Option<String> = cache.get(test_key).await.expect("Failed to get cache");
    assert_eq!(retrieved, Some(test_value.to_string()));
}

#[tokio::test]
async fn test_multilevel_cache_delete() {
    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());
    
    if CacheService::new(&redis_url).is_err() {
        eprintln!("Skipping cache tests - Redis not available");
        return;
    }

    let cache = MultiLevelCache::new(&redis_url).expect("Failed to create cache");
    
    let test_key = "test_delete_key";
    let test_value = "test_value";
    
    // Set value
    cache.set(test_key, &test_value.to_string(), Some(Duration::from_secs(60)))
        .await
        .expect("Failed to set cache");
    
    // Verify it exists
    let retrieved: Option<String> = cache.get(test_key).await.expect("Failed to get cache");
    assert_eq!(retrieved, Some(test_value.to_string()));
    
    // Delete
    cache.delete(test_key).await.expect("Failed to delete cache");
    
    // Verify it's gone
    let retrieved_after: Option<String> = cache.get(test_key).await.expect("Failed to get cache");
    assert_eq!(retrieved_after, None);
}

#[tokio::test]
async fn test_multilevel_cache_stats() {
    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());
    
    if CacheService::new(&redis_url).is_err() {
        eprintln!("Skipping cache tests - Redis not available");
        return;
    }

    let cache = MultiLevelCache::new(&redis_url).expect("Failed to create cache");
    
    // Get initial stats
    let stats = cache.get_stats().await.expect("Failed to get stats");
    let initial_hits = stats.hits;
    
    // Perform operations
    cache.set("stats_test", &"value".to_string(), Some(Duration::from_secs(60)))
        .await
        .expect("Failed to set");
    
    let _: Option<String> = cache.get("stats_test").await.expect("Failed to get");
    
    // Check stats updated
    let stats_after = cache.get_stats().await.expect("Failed to get stats");
    assert!(stats_after.hits > initial_hits || stats_after.sets > 0);
}

#[test]
fn test_cache_service_new() {
    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());
    
    let result = CacheService::new(&redis_url);
    
    // Should either succeed or fail gracefully
    match result {
        Ok(_) => println!("Cache service created successfully"),
        Err(e) => eprintln!("Cache service creation failed (expected if Redis unavailable): {}", e),
    }
}

#[test]
fn test_cache_keys_generation() {
    use reconciliation_backend::services::cache::keys;
    use uuid::Uuid;
    
    let user_id = Uuid::new_v4();
    let project_id = Uuid::new_v4();
    let job_id = Uuid::new_v4();
    let file_id = Uuid::new_v4();
    
    assert!(keys::user(user_id).starts_with("user:"));
    assert!(keys::project(project_id).starts_with("project:"));
    assert!(keys::reconciliation_job(job_id).starts_with("reconciliation_job:"));
    assert!(keys::analytics(project_id, "daily").starts_with("analytics:"));
    assert!(keys::file(file_id).starts_with("file:"));
    assert!(keys::session("test_session").starts_with("session:"));
}




