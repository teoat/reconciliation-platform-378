//! Startup Error Handler with Tier-Based Fallbacks
//!
//! Provides comprehensive error handling during application startup with
//! tier-based fallback mechanisms for graceful degradation.

use crate::errors::{AppError, AppResult};
use crate::utils::tiered_error_handling::{ErrorHandlingTier, TieredErrorConfig, TieredErrorHandler};
use crate::services::error_logging::ErrorContext;
use std::time::Duration;
use tokio::time::sleep;

/// Startup error handler with tier-based fallbacks
pub struct StartupErrorHandler {
    tiered_handler: TieredErrorHandler,
}

impl StartupErrorHandler {
    /// Create new startup error handler
    pub fn new() -> Self {
        Self {
            tiered_handler: TieredErrorHandler::new(None),
        }
    }

    /// Execute startup operation with tier-based error handling and fallbacks
    pub async fn execute_startup_operation<F, T>(
        &self,
        operation: F,
        tier: ErrorHandlingTier,
        operation_name: &str,
        fallback: Option<Box<dyn Fn() -> std::pin::Pin<Box<dyn std::future::Future<Output = AppResult<T>> + Send>>>>,
    ) -> AppResult<T>
    where
        F: std::future::Future<Output = AppResult<T>> + Send,
    {
        let config = match tier {
            ErrorHandlingTier::Critical => TieredErrorConfig::critical(),
            ErrorHandlingTier::Important => TieredErrorConfig::important(),
            ErrorHandlingTier::Standard => TieredErrorConfig::standard(),
        };

        let mut context = ErrorContext::new();
        context.operation = Some(operation_name.to_string());
        context.request_id = Some(uuid::Uuid::new_v4().to_string());

        // Attempt primary operation
        let result = self.tiered_handler.execute_with_tier(operation, config.clone(), context.clone()).await;

        match result {
            Ok(value) => Ok(value),
            Err(error) => {
                // Log the error
                eprintln!("❌ Startup operation '{}' failed: {}", operation_name, error);
                log::error!("Startup operation '{}' failed: {}", operation_name, error);

                // Attempt fallback if available and tier allows
                if let Some(fallback_fn) = fallback {
                    if config.enable_graceful_degradation {
                        eprintln!("🔄 Attempting fallback for '{}'...", operation_name);
                        log::warn!("Attempting fallback for startup operation: {}", operation_name);
                        
                        // Execute fallback with retry logic
                        let fallback_result = self.execute_with_retry(
                            || fallback_fn(),
                            config.max_retries,
                            Duration::from_millis(1000),
                        ).await;

                        match fallback_result {
                            Ok(value) => {
                                eprintln!("✅ Fallback succeeded for '{}'", operation_name);
                                log::info!("Fallback succeeded for startup operation: {}", operation_name);
                                Ok(value)
                            }
                            Err(fallback_error) => {
                                eprintln!("❌ Fallback also failed for '{}': {}", operation_name, fallback_error);
                                log::error!("Fallback failed for startup operation '{}': {}", operation_name, fallback_error);
                                
                                // For critical operations, fail hard
                                if tier == ErrorHandlingTier::Critical {
                                    eprintln!("💥 Critical startup operation '{}' failed - cannot continue", operation_name);
                                    Err(error) // Return original error
                                } else {
                                    // For non-critical, return fallback error
                                    Err(fallback_error)
                                }
                            }
                        }
                    } else {
                        // No fallback or graceful degradation disabled
                        Err(error)
                    }
                } else {
                    // No fallback available
                    Err(error)
                }
            }
        }
    }

    /// Execute operation with retry logic
    async fn execute_with_retry<F, T>(
        &self,
        operation: F,
        max_retries: u32,
        initial_delay: Duration,
    ) -> AppResult<T>
    where
        F: Fn() -> std::pin::Pin<Box<dyn std::future::Future<Output = AppResult<T>> + Send>>,
    {
        let mut last_error = None;
        let mut delay = initial_delay;

        for attempt in 0..=max_retries {
            match operation().await {
                Ok(value) => return Ok(value),
                Err(e) => {
                    last_error = Some(e);
                    if attempt < max_retries {
                        eprintln!("⚠️  Retry {}/{} after {:?}...", attempt + 1, max_retries, delay);
                        sleep(delay).await;
                        delay = delay * 2; // Exponential backoff
                    }
                }
            }
        }

        Err(last_error.unwrap_or_else(|| AppError::Internal("Retry exhausted".to_string())))
    }

    /// Validate critical startup requirements with fallbacks
    pub async fn validate_startup_requirements(&self) -> AppResult<()> {
        // Tier 1: Critical - Database connection
        self.execute_startup_operation(
            async {
                // Validate database connection
                let db_url = std::env::var("DATABASE_URL")
                    .map_err(|_| AppError::Config("DATABASE_URL not set".to_string()))?;
                
                // Try to establish connection
                use diesel::prelude::*;
                use diesel::PgConnection;
                
                PgConnection::establish(&db_url)
                    .map_err(|e| AppError::Connection(diesel::ConnectionError::InvalidConnectionUrl(format!("Failed to connect: {}", e))))?;
                
                Ok(())
            },
            ErrorHandlingTier::Critical,
            "database_connection",
            Some(Box::new(|| {
                Box::pin(async {
                    // Fallback: Wait and retry
                    eprintln!("⏳ Waiting 5 seconds before retry...");
                    sleep(Duration::from_secs(5)).await;
                    Err(AppError::Connection(diesel::ConnectionError::InvalidConnectionUrl("Fallback retry failed".to_string())))
                })
            })),
        ).await?;

        // Tier 2: Important - Redis connection (with fallback to in-memory cache)
        let _redis_result = self.execute_startup_operation(
            async {
                let redis_url = std::env::var("REDIS_URL")
                    .unwrap_or_else(|_| "redis://localhost:6379".to_string());
                
                // Try to connect to Redis (async)
                let client = redis::Client::open(redis_url.as_str())
                    .map_err(|e| AppError::Redis(redis::RedisError::from((redis::ErrorKind::IoError, "Connection failed", e.to_string()))))?;
                
                // Use async connection for testing
                let mut conn = client.get_multiplexed_async_connection().await
                    .map_err(|e| AppError::Redis(redis::RedisError::from((redis::ErrorKind::IoError, "Get connection failed", e.to_string()))))?;
                
                // Test connection
                let _: String = redis::cmd("PING").query_async(&mut conn).await
                    .map_err(|e| AppError::Redis(redis::RedisError::from((redis::ErrorKind::IoError, "PING failed", e.to_string()))))?;
                
                Ok(())
            },
            ErrorHandlingTier::Important,
            "redis_connection",
            Some(Box::new(|| {
                Box::pin(async {
                    // Fallback: Continue without Redis (will use in-memory cache)
                    eprintln!("⚠️  Redis unavailable - continuing with in-memory cache");
                    log::warn!("Redis unavailable - using in-memory cache fallback");
                    Ok(())
                })
            })),
        ).await;

        // Tier 3: Standard - Environment validation
        self.execute_startup_operation(
            async {
                crate::utils::env_validation::validate_environment_result()?;
                Ok(())
            },
            ErrorHandlingTier::Standard,
            "environment_validation",
            None,
        ).await?;

        Ok(())
    }
}

impl Default for StartupErrorHandler {
    fn default() -> Self {
        Self::new()
    }
}

