// Database Sharding - Horizontal partitioning for 50K+ users
// Splits data across multiple database instances

use diesel::{PgConnection, Connection, RunQueryDsl};
use std::collections::HashMap;
use uuid::Uuid;

pub struct ShardManager {
    shards: Vec<ShardConfig>,
    shard_map: HashMap<String, usize>,
}

#[derive(Clone)]
pub struct ShardConfig {
    pub id: usize,
    pub name: String,
    pub connection_string: String,
    pub user_range_min: u64,
    pub user_range_max: u64,
}

impl ShardManager {
    /// Initialize shard manager with configuration
    pub fn new(shard_configs: Vec<ShardConfig>) -> Self {
        let mut shard_map = HashMap::new();
        
        for (idx, shard) in shard_configs.iter().enumerate() {
            shard_map.insert(shard.name.clone(), idx);
        }
        
        Self {
            shards: shard_configs,
            shard_map,
        }
    }

    /// Get shard for a specific user ID
    pub fn get_shard_for_user(&self, user_id: Uuid) -> Option<&ShardConfig> {
        let user_num = Self::uuid_to_number(user_id);
        self.shards.iter().find(|shard| {
            user_num >= shard.user_range_min && user_num <= shard.user_range_max
        })
    }

    /// Get shard connection by name
    pub fn get_connection(&self, shard_name: &str) -> Result<PgConnection, diesel::result::Error> {
        if let Some(&idx) = self.shard_map.get(shard_name) {
            if let Some(shard) = self.shards.get(idx) {
                return PgConnection::establish(&shard.connection_string);
            }
        }
        Err(diesel::result::Error::DatabaseError(
            diesel::result::DatabaseErrorKind::UnableToSendCommand,
            Box::new("Shard not found".to_string())
        ))
    }

    /// Get all shards (for cross-shard queries)
    pub fn get_all_shards(&self) -> &[ShardConfig] {
        &self.shards
    }

    /// Get shard count
    pub fn shard_count(&self) -> usize {
        self.shards.len()
    }

    /// Convert UUID to numeric hash for sharding
    fn uuid_to_number(uuid: Uuid) -> u64 {
        let bytes = uuid.as_bytes();
        let mut result: u64 = 0;
        
        // Simple hash: use first 8 bytes
        for (i, &byte) in bytes.iter().take(8).enumerate() {
            result |= (byte as u64) << (i * 8);
        }
        
        result
    }

    /// Create default shard configuration for development
    pub fn create_default_shards() -> Vec<ShardConfig> {
        vec![
            ShardConfig {
                id: 0,
                name: "shard_0".to_string(),
                connection_string: std::env::var("DATABASE_URL")
                    .unwrap_or_else(|_| "postgres://user:pass@localhost/shard_0".to_string()),
                user_range_min: 0,
                user_range_max: u64::MAX / 2,
            },
            ShardConfig {
                id: 1,
                name: "shard_1".to_string(),
                connection_string: std::env::var("DATABASE_SHARD_1_URL")
                    .unwrap_or_else(|_| "postgres://user:pass@localhost/shard_1".to_string()),
                user_range_min: u64::MAX / 2 + 1,
                user_range_max: u64::MAX,
            },
        ]
    }

    /// Migrate data to shards
    pub async fn migrate_to_shards(&self) -> Result<(), String> {
        for shard in &self.shards {
            // Run migrations on each shard
            // This would typically use diesel migrations
            println!("Migrating shard: {}", shard.name);
            
            let mut conn = self.get_connection(&shard.name)
                .map_err(|e| format!("Failed to connect to shard {}: {}", shard.name, e))?;
            
            // Run migrations (placeholder - would use diesel migrations in practice)
            diesel::sql_query("CREATE TABLE IF NOT EXISTS schema_migrations (version BIGINT PRIMARY KEY)")
                .execute(&mut conn)
                .map_err(|e| format!("Migration failed: {}", e))?;
        }
        
        Ok(())
    }
}

/// Shard-aware database pool
use diesel::r2d2::{Pool, ConnectionManager, PooledConnection};
use diesel::r2d2::PoolError;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct ShardedPoolManager {
    pools: Vec<Pool<ConnectionManager<PgConnection>>>,
    shard_manager: Arc<RwLock<ShardManager>>,
}

impl ShardedPoolManager {
    pub fn new(shard_configs: Vec<ShardConfig>) -> Result<Self, PoolError> {
        let mut pools = Vec::new();
        
        for shard in &shard_configs {
            let manager = ConnectionManager::<PgConnection>::new(&shard.connection_string);
            let pool = Pool::builder()
                .max_size(10)
                .build(manager)?;
            pools.push(pool);
        }
        
        let shard_manager = Arc::new(RwLock::new(ShardManager::new(shard_configs)));
        
        Ok(Self {
            pools,
            shard_manager,
        })
    }

    /// Get pooled connection for specific user
    pub async fn get_connection_for_user(
        &self,
        user_id: Uuid,
    ) -> Result<PooledConnection<ConnectionManager<PgConnection>>, PoolError> {
        let shard_manager = self.shard_manager.read().await;
        
        if let Some(shard) = shard_manager.get_shard_for_user(user_id) {
            let pool = self.pools.get(shard.id)
                .ok_or_else(|| PoolError::Closed)?;
            pool.get()
        } else {
            // Default to first shard if no match
            self.pools.first()
                .ok_or_else(|| PoolError::Closed)?
                .get()
        }
    }

    /// Get connection pool for specific shard
    pub fn get_pool(&self, shard_id: usize) -> Result<&Pool<ConnectionManager<PgConnection>>, PoolError> {
        self.pools.get(shard_id)
            .ok_or_else(|| PoolError::Closed)
    }
}

/// Helper trait for shard-aware queries
pub trait ShardAware {
    fn get_shard_key(&self) -> Uuid;
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_shard_assignment() {
        let shards = ShardManager::create_default_shards();
        let manager = ShardManager::new(shards.clone());
        
        let test_user_1 = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
        let test_user_2 = Uuid::parse_str("FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF").unwrap();
        
        let shard_1 = manager.get_shard_for_user(test_user_1);
        let shard_2 = manager.get_shard_for_user(test_user_2);
        
        assert!(shard_1.is_some());
        assert!(shard_2.is_some());
        assert_ne!(shard_1.unwrap().id, shard_2.unwrap().id);
    }
}

