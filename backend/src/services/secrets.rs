//! AWS Secrets Manager integration for secure secret storage
//! 
//! Provides secure access to secrets stored in AWS Secrets Manager

use aws_config::Region;
use aws_sdk_secretsmanager::Client as SecretsManagerClient;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;

use crate::errors::{AppError, AppResult};

/// Secrets manager service for secure secret retrieval
#[derive(Clone)]
pub struct SecretsManager {
    client: SecretsManagerClient,
    cache: Arc<RwLock<std::collections::HashMap<String, (String, std::time::Instant)>>>,
    ttl: Duration,
}

impl SecretsManager {
    /// Create a new secrets manager
    pub async fn new(region: impl Into<String>) -> AppResult<Self> {
        let region = Region::new(region.into());
        let config = aws_config::from_env()
            .region(region)
            .load()
            .await;
        
        let client = SecretsManagerClient::new(&config);
        
        Ok(Self {
            client,
            cache: Arc::new(RwLock::new(std::collections::HashMap::new())),
            ttl: Duration::from_secs(300), // 5 minute cache TTL
        })
    }
    
    /// Get a secret value by name
    pub async fn get_secret(&self, secret_name: &str) -> AppResult<String> {
        // Check cache first
        {
            let cache = self.cache.read().await;
            if let Some((value, cached_at)) = cache.get(secret_name) {
                if cached_at.elapsed() < self.ttl {
                    return Ok(value.clone());
                }
            }
        }
        
        // Fetch from AWS Secrets Manager
        let response = self.client
            .get_secret_value()
            .secret_id(secret_name)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to get secret {}: {}", secret_name, e)))?;
        
        let secret_value = response.secret_string()
            .ok_or_else(|| AppError::InternalServerError(format!("Secret {} is empty", secret_name)))?
            .to_string();
        
        // Update cache
        {
            let mut cache = self.cache.write().await;
            cache.insert(secret_name.to_string(), (secret_value.clone(), std::time::Instant::now()));
        }
        
        Ok(secret_value)
    }
    
    /// Get JWT secret
    pub async fn get_jwt_secret(&self) -> AppResult<String> {
        self.get_secret("production/jwt_secret").await
    }
    
    /// Get database URL
    pub async fn get_database_url(&self) -> AppResult<String> {
        self.get_secret("production/database_url").await
    }
    
    /// Clear the cache
    pub async fn clear_cache(&self) {
        let mut cache = self.cache.write().await;
        cache.clear();
    }
}

/// Default secrets manager (fallback to environment variables)
pub struct DefaultSecretsManager;

impl DefaultSecretsManager {
    /// Get secret from environment variable with fallback
    pub fn get_secret(&self, secret_name: &str, fallback: impl Into<String>) -> String {
        std::env::var(secret_name)
            .unwrap_or_else(|_| fallback.into())
    }
    
    /// Get JWT secret
    /// In production, JWT_SECRET must be set or the application will fail to start
    pub fn get_jwt_secret(&self) -> String {
        // In production, fail if JWT_SECRET is not set
        #[cfg(not(debug_assertions))]
        {
            std::env::var("JWT_SECRET")
                .expect("JWT_SECRET environment variable must be set in production")
        }
        
        // In development, allow fallback
        #[cfg(debug_assertions)]
        {
            self.get_secret("JWT_SECRET", "development-secret-key-only")
        }
    }
    
    /// Get database URL
    pub fn get_database_url(&self) -> String {
        #[cfg(not(debug_assertions))]
        {
            std::env::var("DATABASE_URL")
                .expect("DATABASE_URL environment variable must be set in production")
        }
        
        #[cfg(debug_assertions)]
        {
            self.get_secret("DATABASE_URL", "postgresql://reconciliation_user:reconciliation_pass@localhost:5432/reconciliation_app")
        }
    }
}

