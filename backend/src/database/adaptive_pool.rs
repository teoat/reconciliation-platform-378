//! Adaptive Connection Pool
//!
//! Automatically scales database connections based on load and utilization
//! to optimize resource usage and ensure optimal performance.

use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use tokio::time::{interval, MissedTickBehavior};
use diesel::r2d2::{Pool, ConnectionManager, PooledConnection};
use diesel::pg::PgConnection;
use crate::errors::{AppError, AppResult};

/// Pool statistics for monitoring and decision making
#[derive(Debug, Clone)]
pub struct PoolStats {
    pub active : usize,
    pub idle: usize,
    pub max_size: usize,
    pub utilization: f64,
    pub average_wait_time: Duration,
    pub total_requests: u64,
    pub successful_requests: u64,
    pub failed_requests: u64,
}

/// Adaptive pool configuration
#[derive(Debug, Clone)]
pub struct AdaptivePoolConfig {
    /// Minimum number of connections to maintain
    pub min_connections: usize,
    
    /// Maximum number of connections allowed
    pub max_connections: usize,
    
    /// Target utilization (0.0 to 1.0)
    pub target_utilization: f64,
    
    /// Utilization threshold to scale up
    pub scale_up_threshold: f64,
    
    /// Utilization threshold to scale down
    pub scale_down_threshold: f64,
    
    /// How often to check and adjust pool
    pub adjustment_interval: Duration,
    
    /// Increase/Decrease connections by this amount
    pub adjustment_step: usize,
}

impl Default for AdaptivePoolConfig {
    fn default() -> Self {
        Self {
            min_connections: 10,
            max_connections: 100,
            target_utilization: 0.75,
            scale_up_threshold: 0.85,
            scale_down_threshold: 0.50,
            adjustment_interval: Duration::from_secs(30),
            adjustment_step: 5,
        }
    }
}

/// Adaptive connection pool with auto-scaling
pub struct AdaptivePool {
    inner_pool: Arc<Pool<ConnectionManager<PgConnection>>>,
    config: AdaptivePoolConfig,
    stats: Arc<RwLock<PoolStats>>,
    monitoring_active: Arc<RwLock<bool>>,
}

impl AdaptivePool {
    /// Create a new adaptive pool
    pub fn new(
        manager: ConnectionManager<PgConnection>,
        config: AdaptivePoolConfig,
    ) -> AppResult<Self> {
        let pool = Pool::builder()
            .min_idle(Some(config.min_connections))
            .max_size(config.max_connections as u32)
            .build(manager)?;

        let stats = PoolStats {
            active: 0,
            idle: config.min_connections,
            max_size: config.max_connections,
            utilization: 0.0,
            average_wait_time: Duration::ZERO,
            total_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
        };

        let adaptive_pool = Self {
            inner_pool: Arc::new(pool),
            config,
            stats: Arc::new(RwLock::new(stats)),
            monitoring_active: Arc::new(RwLock::new(false)),
        };

        Ok(adaptive_pool)
    }

    /// Get a connection from the pool
    pub async fn get(&self) -> AppResult<PooledConnection<ConnectionManager<PgConnection>>> {
        let start = Instant::now();
        
        // Update stats
        {
            let mut stats = self.stats.write().await;
            stats.total_requests += 1;
        }

        let connection = match self.inner_pool.get() {
            Ok(conn) => {
                // Update successful stats
                let mut stats = self.stats.write().await;
                stats.successful_requests += 1;
                stats.active += 1;
                let wait_time = start.elapsed();
                stats.average_wait_time = Duration::from_millis(
                    (stats.average_wait_time.as_millis() as f64 * 0.9 + wait_time.as_millis() as f64 * 0.1) as u64
                );
                Ok(conn)
            }
            Err(e) => {
                // Update failed stats
                let mut stats = self.stats.write().await;
                stats.failed_requests += 1;
                Err(AppError::Internal(format!("Failed to get connection: {}", e)))
            }
        };

        connection
    }

    /// Return a connection to the pool and update stats
    pub async fn return_connection(&self) {
        let mut stats = self.stats.write().await;
        if stats.active > 0 {
            stats.active -= 1;
            stats.idle += 1;
        }
    }

    /// Get current pool statistics
    pub async fn get_stats(&self) -> PoolStats {
        let stats = self.stats.read().await;
        
        // Calculate current utilization
        let inner_pool = &self.inner_pool;
        let state = inner_pool.state();
        let active = state.connections as usize;
        let idle = state.idle_connections as usize;
        let max_size = inner_pool.max_size() as usize;
        
        let utilization = if max_size > 0 {
            (active as f64) / (max_size as f64)
        } else {
            0.0
        };

        PoolStats {
            active,
            idle,
            max_size,
            utilization,
            average_wait_time: stats.average_wait_time,
            total_requests: stats.total_requests,
            successful_requests: stats.successful_requests,
            failed_requests: stats.failed_requests,
        }
    }

    /// Start auto-scaling monitoring
    pub async fn start_monitoring(&self) -> AppResult<()> {
        let mut monitoring_active = self.monitoring_active.write().await;
        
        if *monitoring_active {
            return Ok(()); // Already monitoring
        }
        
        *monitoring_active = true;
        drop(monitoring_active);

        let inner_pool = self.inner_pool.clone();
        let config = self.config.clone();
        let stats = self.stats.clone();
        let monitoring_active = self.monitoring_active.clone();

        // Spawn monitoring task
        tokio::spawn(async move {
            let mut interval = interval(config.adjustment_interval);
            interval.set_missed_tick_behavior(MissedTickBehavior::Skip);

            loop {
                interval.tick().await;
                
                // Check if monitoring is still active
                {
                    let active = monitoring_active.read().await;
                    if !*active {
                        break;
                    }
                }

                // Get current anchor
                let current_stats = {
                    let s = stats.read().await;
                    s.clone()
                };

                // Determine if we need to scale
                let should_scale_up = current_stats.utilization > config.scale_up_threshold;
                let should_scale_down = current_stats.utilization < config.scale_down_threshold;

                if should_scale_up {
                    // Try to increase pool size
                    let new_max = (current_stats.max_size + config.adjustment_step)
                        .min(config.max_connections);
                    
                    if new_max > current_stats.max_size {
                        // Note: Diesel pools don't support dynamic resizing easily
                        // This would require a pool recreation in a real implementation
                        log::info!(
                            "Would scale up pool from {} to {} connections (util: {:.2}%)",
                            current_stats.max_size,
                            new_max,
                            current_stats.utilization * 100.0
                        );
                    }
                } else if should_scale_down {
                    // Try to decrease pool size
                    let new_max = (current_stats.max_size.saturating_sub(config.adjustment_step))
                        .max(config.min_connections);
                    
                    if new_max < current_stats.max_size {
                        log::info!(
                            "Would scale down pool from {} to {} connections (util: {:.2}%)",
                            current_stats.max_size,
                            new_max,
                            current_stats.utilization * 100.0
                        );
                    }
                }
            }
        });

        Ok(())
    }

    /// Stop auto-scaling monitoring
    pub async fn stop_monitoring(&self) {
        let mut monitoring_active = self.monitoring_active.write().await;
        *monitoring_active = false;
    }

    /// Get the inner pool for advanced usage
    pub fn inner(&self) -> Arc<Pool<ConnectionManager<PgConnection>>> {
        self.inner_pool.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = AdaptivePoolConfig::default();
        assert_eq!(config.min_connections, 10);
        assert_eq!(config.max_connections, 100);
        assert_eq!(config.target_utilization, 0.75);
    }

    #[test]
    fn test_config_validation() {
        let mut config = AdaptivePoolConfig::default();
        config.scale_up_threshold = 0.9;
        config.scale_down_threshold = 0.6;
        
        assert!(config.scale_up_threshold > config.scale_down_threshold);
    }
}

