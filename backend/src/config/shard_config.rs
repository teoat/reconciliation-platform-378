// Shard Configuration - Database sharding setup
// Environment-based shard connection strings

use crate::services::database_sharding::ShardConfig;
use std::env;

pub struct ShardConfiguration;

impl ShardConfiguration {
    /// Load shard configuration from environment variables
    pub fn load_shards() -> Vec<ShardConfig> {
        let mut shards = Vec::new();

        // Try to load multiple shards from environment
        let shard_count: usize = env::var("DATABASE_SHARD_COUNT")
            .unwrap_or_else(|_| "2".to_string())
            .parse()
            .unwrap_or(2);

        for i in 0..shard_count {
            let env_var = if i == 0 {
                "DATABASE_URL".to_string()
            } else {
                format!("DATABASE_SHARD_{}_URL", i)
            };

            if let Ok(connection_string) = env::var(&env_var) {
                // Parse connection string to extract database name, host, port
                // For now, use defaults - in production this should be properly parsed
                let database_name = format!("reconciliation_shard_{}", i);
                let host = "postgres".to_string();
                let port = 5432;

                shards.push(ShardConfig {
                    id: i,
                    name: format!("shard_{}", i),
                    connection_string,
                    user_range_min: (u64::MAX / shard_count as u64) * i as u64,
                    user_range_max: if i == shard_count - 1 {
                        u64::MAX
                    } else {
                        (u64::MAX / shard_count as u64) * (i + 1) as u64 - 1
                    },
                    database_name,
                    host,
                    port,
                });
            }
        }

        // Fallback to default if no shards configured
        shards
    }
}
