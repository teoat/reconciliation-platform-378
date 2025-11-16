// Database Sharding - Multi-shard implementation

use std::collections::HashMap;
use uuid::Uuid;

#[derive(Clone, Debug)]
pub struct ShardConfig {
    pub id: usize,
    pub name: String,
    pub connection_string: String,
    pub user_range_min: u64,
    pub user_range_max: u64,
    pub database_name: String,
    pub host: String,
    pub port: u16,
}

impl ShardConfig {
    pub fn create_default_shards() -> Vec<Self> {
        let base_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
            "postgres://postgres:postgres_pass@postgres:5432/reconciliation_app".to_string()
        });

        // Parse base connection string to create shard-specific ones
        let shards = vec![
            ShardConfig {
                id: 0,
                name: "shard_0".to_string(),
                connection_string: format!(
                    "{}?sslmode=disable",
                    base_url.replace("reconciliation_app", "reconciliation_shard_0")
                ),
                user_range_min: 0,
                user_range_max: u64::MAX / 4,
                database_name: "reconciliation_shard_0".to_string(),
                host: "postgres".to_string(),
                port: 5432,
            },
            ShardConfig {
                id: 1,
                name: "shard_1".to_string(),
                connection_string: format!(
                    "{}?sslmode=disable",
                    base_url.replace("reconciliation_app", "reconciliation_shard_1")
                ),
                user_range_min: (u128::MAX / 4 + 1) as u64,
                user_range_max: (u128::MAX / 2) as u64,
                database_name: "reconciliation_shard_1".to_string(),
                host: "postgres".to_string(),
                port: 5432,
            },
            ShardConfig {
                id: 2,
                name: "shard_2".to_string(),
                connection_string: format!(
                    "{}?sslmode=disable",
                    base_url.replace("reconciliation_app", "reconciliation_shard_2")
                ),
                user_range_min: (u128::MAX / 2 + 1) as u64,
                user_range_max: ((u128::MAX / 4) * 3) as u64,
                database_name: "reconciliation_shard_2".to_string(),
                host: "postgres".to_string(),
                port: 5432,
            },
            ShardConfig {
                id: 3,
                name: "shard_3".to_string(),
                connection_string: format!(
                    "{}?sslmode=disable",
                    base_url.replace("reconciliation_app", "reconciliation_shard_3")
                ),
                user_range_min: ((u128::MAX / 4) * 3 + 1) as u64,
                user_range_max: u64::MAX,
                database_name: "reconciliation_shard_3".to_string(),
                host: "postgres".to_string(),
                port: 5432,
            },
        ];

        shards
    }
}

pub struct ShardManager {
    pub shards: Vec<ShardConfig>,
    shard_map: HashMap<usize, ShardConfig>,
}

impl ShardManager {
    pub fn new(shard_configs: Vec<ShardConfig>) -> Self {
        let shard_map = shard_configs
            .iter()
            .map(|config| (config.id, config.clone()))
            .collect();

        Self {
            shards: shard_configs,
            shard_map,
        }
    }

    /// Get shard for user based on consistent hashing of user ID
    pub fn get_shard_for_user(&self, user_id: Uuid) -> Option<&ShardConfig> {
        // Convert UUID to u128, then to u64 for sharding
        let user_hash = user_id.as_u128() as u64;

        // Find the shard where user_hash falls within the range
        for shard in &self.shards {
            if user_hash >= shard.user_range_min && user_hash <= shard.user_range_max {
                return Some(shard);
            }
        }

        // Fallback to first shard if no range matches (shouldn't happen with proper config)
        self.shards.first()
    }

    /// Get shard by ID
    pub fn get_shard_by_id(&self, shard_id: usize) -> Option<&ShardConfig> {
        self.shard_map.get(&shard_id)
    }

    /// Get all shards
    pub fn get_all_shards(&self) -> &[ShardConfig] {
        &self.shards
    }

    /// Get shard count
    pub fn shard_count(&self) -> usize {
        self.shards.len()
    }
}

use diesel::r2d2::{ConnectionManager, Pool};
use diesel::PgConnection;
use std::sync::Arc;
use tokio::sync::Mutex;

pub type PgPool = Pool<ConnectionManager<PgConnection>>;

pub struct ShardedPoolManager {
    pools: HashMap<usize, Arc<Mutex<PgPool>>>,
    shard_manager: ShardManager,
}

impl ShardedPoolManager {
    pub fn new(shard_configs: Vec<ShardConfig>) -> Result<Self, String> {
        let mut pools = HashMap::new();
        let shard_manager = ShardManager::new(shard_configs.clone());

        for shard_config in shard_configs {
            let manager = ConnectionManager::<PgConnection>::new(&shard_config.connection_string);

            let pool = Pool::builder()
                .max_size(10) // Adjust based on needs
                .min_idle(Some(1))
                .build(manager)
                .map_err(|e| {
                    format!("Failed to create pool for shard {}: {}", shard_config.id, e)
                })?;

            pools.insert(shard_config.id, Arc::new(Mutex::new(pool)));
        }

        Ok(Self {
            pools,
            shard_manager,
        })
    }

    /// Get a connection pool for a specific user
    pub async fn get_pool_for_user(&self, user_id: Uuid) -> Result<Arc<Mutex<PgPool>>, String> {
        let shard = self
            .shard_manager
            .get_shard_for_user(user_id)
            .ok_or_else(|| "No shard found for user".to_string())?;

        self.pools
            .get(&shard.id)
            .cloned()
            .ok_or_else(|| format!("No pool found for shard {}", shard.id))
    }

    /// Get a connection for a specific user
    pub async fn get_connection_for_user(
        &self,
        user_id: Uuid,
    ) -> Result<diesel::r2d2::PooledConnection<ConnectionManager<PgConnection>>, String> {
        let pool = self.get_pool_for_user(user_id).await?;
        let pool_guard = pool.lock().await;

        pool_guard
            .get()
            .map_err(|e| format!("Failed to get connection from pool: {}", e))
    }

    /// Get pool for a specific shard
    pub async fn get_pool_for_shard(&self, shard_id: usize) -> Result<Arc<Mutex<PgPool>>, String> {
        self.pools
            .get(&shard_id)
            .cloned()
            .ok_or_else(|| format!("No pool found for shard {}", shard_id))
    }

    /// Execute a query on the appropriate shard for a user
    pub async fn execute_on_user_shard<F, R, Fut>(
        &self,
        user_id: Uuid,
        operation: F,
    ) -> Result<R, String>
    where
        F: FnOnce(&mut diesel::r2d2::PooledConnection<ConnectionManager<PgConnection>>) -> Fut,
        Fut: std::future::Future<Output = Result<R, diesel::result::Error>>,
    {
        let mut conn = self.get_connection_for_user(user_id).await?;
        operation(&mut conn)
            .await
            .map_err(|e| format!("Database operation failed: {}", e))
    }

    /// Get shard manager reference
    pub fn shard_manager(&self) -> &ShardManager {
        &self.shard_manager
    }
}

pub trait ShardAware {
    fn get_shard_key(&self) -> Uuid;
}
