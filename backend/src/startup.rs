//! Application Startup Module
//!
//! Provides initialization and configuration helpers for the application,
//! including resilience manager, database, cache, and service setup.

pub mod error_handler;

use crate::config::Config;
use crate::database::Database;
use crate::errors::AppResult;
use crate::services::cache::MultiLevelCache;
use crate::services::resilience::{ResilienceConfig, ResilienceManager};
use actix_web::web;
use std::sync::Arc;

/// Application startup configuration
pub struct AppStartup {
    pub resilience: Arc<ResilienceManager>,
    pub database: Database,
    pub cache: Arc<MultiLevelCache>,
}

impl AppStartup {
    /// Initialize application with default configuration
    pub async fn new(config: &Config) -> AppResult<Self> {
        Self::with_resilience_config(config, ResilienceConfig::default()).await
    }

    /// Initialize application with custom resilience configuration
    pub async fn with_resilience_config(
        config: &Config,
        resilience_config: ResilienceConfig,
    ) -> AppResult<Self> {
        log::info!("Initializing application startup...");

        // Initialize resilience manager
        let resilience = Arc::new(ResilienceManager::with_config(resilience_config));
        log::info!("Resilience manager initialized");

        // Initialize database with resilience
        let database =
            Database::new_with_resilience(&config.database_url, resilience.clone()).await?;
        log::info!("Database initialized with circuit breaker protection");

        // Initialize cache with resilience
        let cache = Arc::new(MultiLevelCache::new_with_resilience(
            &config.redis_url,
            resilience.clone(),
        )?);
        log::info!("Cache initialized with circuit breaker protection");

        Ok(Self {
            resilience,
            database,
            cache,
        })
    }

    /// Get resilience manager reference
    pub fn resilience(&self) -> &Arc<ResilienceManager> {
        &self.resilience
    }

    /// Get database reference
    pub fn database(&self) -> &Database {
        &self.database
    }

    /// Get cache reference
    pub fn cache(&self) -> &Arc<MultiLevelCache> {
        &self.cache
    }

    /// Configure Actix-web app data
    pub fn configure_app_data(&self, cfg: &mut web::ServiceConfig) {
        cfg.app_data(web::Data::new(self.database.clone()));
        cfg.app_data(web::Data::new(self.cache.clone()));
        cfg.app_data(web::Data::new(self.resilience.clone()));
    }
}

/// Helper to create resilience config from environment
pub fn resilience_config_from_env() -> ResilienceConfig {
    use std::env;

    ResilienceConfig {
        database: crate::services::resilience::CircuitBreakerServiceConfig {
            failure_threshold: env::var("DB_CIRCUIT_BREAKER_FAILURE_THRESHOLD")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(5),
            success_threshold: env::var("DB_CIRCUIT_BREAKER_SUCCESS_THRESHOLD")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(2),
            timeout_seconds: env::var("DB_CIRCUIT_BREAKER_TIMEOUT_SECONDS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(30),
            enable_fallback: env::var("DB_CIRCUIT_BREAKER_ENABLE_FALLBACK")
                .ok()
                .map(|v| v == "true")
                .unwrap_or(true),
        },
        cache: crate::services::resilience::CircuitBreakerServiceConfig {
            failure_threshold: env::var("CACHE_CIRCUIT_BREAKER_FAILURE_THRESHOLD")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(10),
            success_threshold: env::var("CACHE_CIRCUIT_BREAKER_SUCCESS_THRESHOLD")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(3),
            timeout_seconds: env::var("CACHE_CIRCUIT_BREAKER_TIMEOUT_SECONDS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(15),
            enable_fallback: env::var("CACHE_CIRCUIT_BREAKER_ENABLE_FALLBACK")
                .ok()
                .map(|v| v == "true")
                .unwrap_or(true),
        },
        api: crate::services::resilience::CircuitBreakerServiceConfig {
            failure_threshold: env::var("API_CIRCUIT_BREAKER_FAILURE_THRESHOLD")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(5),
            success_threshold: env::var("API_CIRCUIT_BREAKER_SUCCESS_THRESHOLD")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(2),
            timeout_seconds: env::var("API_CIRCUIT_BREAKER_TIMEOUT_SECONDS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(60),
            enable_fallback: env::var("API_CIRCUIT_BREAKER_ENABLE_FALLBACK")
                .ok()
                .map(|v| v == "true")
                .unwrap_or(true),
        },
        retry: crate::services::resilience::RetryConfig {
            max_retries: env::var("RETRY_MAX_RETRIES")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(3),
            initial_delay_ms: env::var("RETRY_INITIAL_DELAY_MS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(100),
            max_delay_ms: env::var("RETRY_MAX_DELAY_MS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(5000),
            backoff_multiplier: env::var("RETRY_BACKOFF_MULTIPLIER")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(2.0),
        },
    }
}
