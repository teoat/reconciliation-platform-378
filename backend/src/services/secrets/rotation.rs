//! Secret Rotation Service
//!
//! Handles automatic secret rotation with versioning and audit logging

use crate::errors::{AppError, AppResult};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Secret version information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecretVersion {
    pub version: u32,
    pub value: String,
    pub created_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub rotated_at: Option<DateTime<Utc>>,
}

/// Secret rotation metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecretRotationMetadata {
    pub name: String,
    pub current_version: u32,
    pub rotation_interval_days: u32,
    pub last_rotated: Option<DateTime<Utc>>,
    pub next_rotation: Option<DateTime<Utc>>,
    pub versions: Vec<SecretVersion>,
}

/// Secret rotation service
pub struct SecretRotationService {
    secrets: Arc<RwLock<HashMap<String, SecretRotationMetadata>>>,
    audit_log: Arc<RwLock<Vec<SecretAuditLog>>>,
}

/// Secret audit log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecretAuditLog {
    pub secret_name: String,
    pub action: String,
    pub version: Option<u32>,
    pub timestamp: DateTime<Utc>,
    pub user_id: Option<uuid::Uuid>,
    pub ip_address: Option<String>,
}

impl SecretRotationService {
    /// Create a new secret rotation service
    pub fn new() -> Self {
        Self {
            secrets: Arc::new(RwLock::new(HashMap::new())),
            audit_log: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Register a secret for rotation
    pub async fn register_secret(
        &self,
        name: String,
        initial_value: String,
        rotation_interval_days: u32,
    ) -> AppResult<()> {
        let mut secrets = self.secrets.write().await;
        
        let next_rotation = Utc::now() + chrono::Duration::days(rotation_interval_days as i64);
        
        let metadata = SecretRotationMetadata {
            name: name.clone(),
            current_version: 1,
            rotation_interval_days,
            last_rotated: Some(Utc::now()),
            next_rotation: Some(next_rotation),
            versions: vec![SecretVersion {
                version: 1,
                value: initial_value,
                created_at: Utc::now(),
                expires_at: Some(next_rotation),
                rotated_at: None,
            }],
        };

        secrets.insert(name.clone(), metadata);
        
        self.log_audit(name, "REGISTERED", Some(1), None, None).await;
        
        Ok(())
    }

    /// Rotate a secret
    pub async fn rotate_secret(&self, name: &str, new_value: String) -> AppResult<u32> {
        let mut secrets = self.secrets.write().await;
        
        let metadata = secrets.get_mut(name)
            .ok_or_else(|| AppError::NotFound(format!("Secret '{}' not found", name)))?;

        let new_version = metadata.current_version + 1;
        let next_rotation = Utc::now() + chrono::Duration::days(metadata.rotation_interval_days as i64);

        // Mark current version as rotated
        if let Some(current_version) = metadata.versions.iter_mut().find(|v| v.version == metadata.current_version) {
            current_version.rotated_at = Some(Utc::now());
        }

        // Add new version
        metadata.versions.push(SecretVersion {
            version: new_version,
            value: new_value,
            created_at: Utc::now(),
            expires_at: Some(next_rotation),
            rotated_at: None,
        });

        metadata.current_version = new_version;
        metadata.last_rotated = Some(Utc::now());
        metadata.next_rotation = Some(next_rotation);

        self.log_audit(name.to_string(), "ROTATED", Some(new_version), None, None).await;

        Ok(new_version)
    }

    /// Get current secret value
    pub async fn get_current_secret(&self, name: &str) -> AppResult<String> {
        let secrets = self.secrets.read().await;
        let metadata = secrets.get(name)
            .ok_or_else(|| AppError::NotFound(format!("Secret '{}' not found", name)))?;

        let current_version = metadata.versions.iter()
            .find(|v| v.version == metadata.current_version)
            .ok_or_else(|| AppError::NotFound(format!("Current version of secret '{}' not found", name)))?;

        self.log_audit(name.to_string(), "ACCESSED", Some(metadata.current_version), None, None).await;

        Ok(current_version.value.clone())
    }

    /// Check if secret needs rotation
    pub async fn needs_rotation(&self, name: &str) -> AppResult<bool> {
        let secrets = self.secrets.read().await;
        let metadata = secrets.get(name)
            .ok_or_else(|| AppError::NotFound(format!("Secret '{}' not found", name)))?;

        if let Some(next_rotation) = metadata.next_rotation {
            Ok(Utc::now() >= next_rotation)
        } else {
            Ok(false)
        }
    }

    /// Get rotation metadata
    pub async fn get_metadata(&self, name: &str) -> AppResult<SecretRotationMetadata> {
        let secrets = self.secrets.read().await;
        let metadata = secrets.get(name)
            .ok_or_else(|| AppError::NotFound(format!("Secret '{}' not found", name)))?
            .clone();
        Ok(metadata)
    }

    /// Get audit logs
    pub async fn get_audit_logs(&self, secret_name: Option<&str>) -> Vec<SecretAuditLog> {
        let logs = self.audit_log.read().await;
        if let Some(name) = secret_name {
            logs.iter()
                .filter(|log| log.secret_name == name)
                .cloned()
                .collect()
        } else {
            logs.clone()
        }
    }

    /// Log audit event
    async fn log_audit(
        &self,
        secret_name: String,
        action: &str,
        version: Option<u32>,
        user_id: Option<uuid::Uuid>,
        ip_address: Option<String>,
    ) {
        let mut logs = self.audit_log.write().await;
        logs.push(SecretAuditLog {
            secret_name,
            action: action.to_string(),
            version,
            timestamp: Utc::now(),
            user_id,
            ip_address,
        });

        // Keep only last 1000 entries
        if logs.len() > 1000 {
            logs.remove(0);
        }
    }
}

impl Default for SecretRotationService {
    fn default() -> Self {
        Self::new()
    }
}

