// backend/src/services/backup_recovery.rs
use crate::errors::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use tokio::fs;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Backup configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupConfig {
    pub enabled: bool,
    pub schedule: BackupSchedule,
    pub retention_policy: RetentionPolicy,
    pub storage_config: StorageConfig,
    pub compression: bool,
    pub encryption: bool,
    pub encryption_key: Option<String>,
}

/// Backup schedule configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BackupSchedule {
    /// Backup every N minutes
    Interval(Duration),
    /// Backup at specific times (cron-like)
    Cron(String),
    /// Manual backup only
    Manual,
}

/// Data retention policy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetentionPolicy {
    /// Keep daily backups for N days
    pub daily_retention_days: u32,
    /// Keep weekly backups for N weeks
    pub weekly_retention_weeks: u32,
    /// Keep monthly backups for N months
    pub monthly_retention_months: u32,
    /// Keep yearly backups for N years
    pub yearly_retention_years: u32,
}

/// Storage configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StorageConfig {
    /// Local filesystem storage
    Local { path: PathBuf },
    /// AWS S3 storage
    S3 { bucket: String, region: String, prefix: String },
    /// Google Cloud Storage
    GCS { bucket: String, prefix: String },
    /// Azure Blob Storage
    Azure { container: String, prefix: String },
}

/// Backup metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupMetadata {
    pub id: Uuid,
    pub backup_type: BackupType,
    pub created_at: DateTime<Utc>,
    pub size_bytes: u64,
    pub checksum: String,
    pub status: BackupStatus,
    pub error_message: Option<String>,
    pub retention_until: DateTime<Utc>,
}

/// Types of backups
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BackupType {
    /// Full database backup
    Full,
    /// Incremental backup
    Incremental,
    /// Differential backup
    Differential,
    /// File system backup
    FileSystem,
    /// Configuration backup
    Configuration,
}

/// Backup status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BackupStatus {
    /// Backup in progress
    InProgress,
    /// Backup completed successfully
    Completed,
    /// Backup failed
    Failed,
    /// Backup is being restored
    Restoring,
}

/// Backup service
pub struct BackupService {
    config: BackupConfig,
    metadata_store: Arc<RwLock<HashMap<Uuid, BackupMetadata>>>,
    backup_stats: Arc<RwLock<BackupStats>>,
}

/// Backup statistics
#[derive(Debug, Clone, Default)]
pub struct BackupStats {
    pub total_backups: u64,
    pub successful_backups: u64,
    pub failed_backups: u64,
    pub total_size_bytes: u64,
    pub last_backup_time: Option<DateTime<Utc>>,
    pub last_restore_time: Option<DateTime<Utc>>,
}

impl BackupService {
    pub fn new(config: BackupConfig) -> Self {
        Self {
            config,
            metadata_store: Arc::new(RwLock::new(HashMap::new())),
            backup_stats: Arc::new(RwLock::new(BackupStats::default())),
        }
    }

    /// Create a full backup
    pub async fn create_full_backup(&self) -> AppResult<Uuid> {
        let backup_id = Uuid::new_v4();
        let start_time = Utc::now();

        // Create backup metadata
        let mut metadata = BackupMetadata {
            id: backup_id,
            backup_type: BackupType::Full,
            created_at: start_time,
            size_bytes: 0,
            checksum: String::new(),
            status: BackupStatus::InProgress,
            error_message: None,
            retention_until: self.calculate_retention_date(start_time),
        };

        // Store metadata
        self.metadata_store.write().await.insert(backup_id, metadata.clone());

        // Perform backup
        match self.perform_backup(&backup_id, BackupType::Full).await {
            Ok((size, checksum)) => {
                metadata.size_bytes = size;
                metadata.checksum = checksum;
                metadata.status = BackupStatus::Completed;
                
                // Update metadata
                self.metadata_store.write().await.insert(backup_id, metadata);
                
                // Update stats
                self.update_backup_stats(true, size).await;
                
                Ok(backup_id)
            }
            Err(e) => {
                metadata.status = BackupStatus::Failed;
                metadata.error_message = Some(e.to_string());
                
                // Update metadata
                self.metadata_store.write().await.insert(backup_id, metadata);
                
                // Update stats
                self.update_backup_stats(false, 0).await;
                
                Err(e)
            }
        }
    }

    /// Create an incremental backup
    pub async fn create_incremental_backup(&self, base_backup_id: Uuid) -> AppResult<Uuid> {
        let backup_id = Uuid::new_v4();
        let start_time = Utc::now();

        // Verify base backup exists
        if !self.metadata_store.read().await.contains_key(&base_backup_id) {
            return Err(AppError::ValidationError("Base backup not found".to_string()));
        }

        // Create backup metadata
        let mut metadata = BackupMetadata {
            id: backup_id,
            backup_type: BackupType::Incremental,
            created_at: start_time,
            size_bytes: 0,
            checksum: String::new(),
            status: BackupStatus::InProgress,
            error_message: None,
            retention_until: self.calculate_retention_date(start_time),
        };

        // Store metadata
        self.metadata_store.write().await.insert(backup_id, metadata.clone());

        // Perform incremental backup
        match self.perform_incremental_backup(&backup_id, base_backup_id).await {
            Ok((size, checksum)) => {
                metadata.size_bytes = size;
                metadata.checksum = checksum;
                metadata.status = BackupStatus::Completed;
                
                // Update metadata
                self.metadata_store.write().await.insert(backup_id, metadata);
                
                // Update stats
                self.update_backup_stats(true, size).await;
                
                Ok(backup_id)
            }
            Err(e) => {
                metadata.status = BackupStatus::Failed;
                metadata.error_message = Some(e.to_string());
                
                // Update metadata
                self.metadata_store.write().await.insert(backup_id, metadata);
                
                // Update stats
                self.update_backup_stats(false, 0).await;
                
                Err(e)
            }
        }
    }

    /// Restore from backup
    pub async fn restore_backup(&self, backup_id: Uuid) -> AppResult<()> {
        // Get backup metadata
        let metadata = self.metadata_store.read().await
            .get(&backup_id)
            .ok_or_else(|| AppError::ValidationError("Backup not found".to_string()))?
            .clone();

        // Update status
        let mut updated_metadata = metadata.clone();
        updated_metadata.status = BackupStatus::Restoring;
        self.metadata_store.write().await.insert(backup_id, updated_metadata);

        // Perform restore
        match self.perform_restore(&metadata).await {
            Ok(_) => {
                // Update stats
                let mut stats = self.backup_stats.write().await;
                stats.last_restore_time = Some(Utc::now());
                
                Ok(())
            }
            Err(e) => {
                // Update metadata with error
                let mut failed_metadata = metadata;
                failed_metadata.status = BackupStatus::Failed;
                failed_metadata.error_message = Some(e.to_string());
                self.metadata_store.write().await.insert(backup_id, failed_metadata);
                
                Err(e)
            }
        }
    }

    /// List available backups
    pub async fn list_backups(&self) -> AppResult<Vec<BackupMetadata>> {
        let metadata_store = self.metadata_store.read().await;
        Ok(metadata_store.values().cloned().collect())
    }

    /// Get backup metadata
    pub async fn get_backup_metadata(&self, backup_id: Uuid) -> AppResult<BackupMetadata> {
        let metadata_store = self.metadata_store.read().await;
        metadata_store.get(&backup_id)
            .ok_or_else(|| AppError::ValidationError("Backup not found".to_string()))
            .map(|m| m.clone())
    }

    /// Delete backup
    pub async fn delete_backup(&self, backup_id: Uuid) -> AppResult<()> {
        // Get metadata
        let metadata = self.get_backup_metadata(backup_id).await?;
        
        // Delete from storage
        self.delete_backup_from_storage(&metadata).await?;
        
        // Remove from metadata store
        self.metadata_store.write().await.remove(&backup_id);
        
        Ok(())
    }

    /// Clean up old backups based on retention policy
    pub async fn cleanup_old_backups(&self) -> AppResult<u32> {
        let mut deleted_count = 0;
        let now = Utc::now();
        
        let mut metadata_store = self.metadata_store.write().await;
        let mut to_delete = Vec::new();
        
        for (backup_id, metadata) in metadata_store.iter() {
            if metadata.retention_until < now {
                to_delete.push(*backup_id);
            }
        }
        
        for backup_id in to_delete {
            if let Some(metadata) = metadata_store.remove(&backup_id) {
                // Delete from storage
                if let Err(e) = self.delete_backup_from_storage(&metadata).await {
                    eprintln!("Failed to delete backup {} from storage: {}", backup_id, e);
                }
                deleted_count += 1;
            }
        }
        
        Ok(deleted_count)
    }

    /// Get backup statistics
    pub async fn get_backup_stats(&self) -> AppResult<BackupStats> {
        let stats = self.backup_stats.read().await.clone();
        Ok(stats)
    }

    /// Perform the actual backup
    async fn perform_backup(&self, backup_id: &Uuid, backup_type: BackupType) -> AppResult<(u64, String)> {
        match backup_type {
            BackupType::Full => self.perform_full_backup(backup_id).await,
            BackupType::Incremental => Err(AppError::InternalServerError("Incremental backup not implemented".to_string())),
            BackupType::Differential => Err(AppError::InternalServerError("Differential backup not implemented".to_string())),
            BackupType::FileSystem => self.perform_filesystem_backup(backup_id).await,
            BackupType::Configuration => self.perform_config_backup(backup_id).await,
        }
    }

    /// Perform full database backup
    async fn perform_full_backup(&self, backup_id: &Uuid) -> AppResult<(u64, String)> {
        // In a real implementation, this would:
        // 1. Connect to the database
        // 2. Create a database dump
        // 3. Compress and encrypt if configured
        // 4. Upload to storage
        
        // For now, we'll simulate this
        let backup_data = format!("Full database backup for {}", backup_id);
        let compressed_data = self.compress_data(backup_data.as_bytes())?;
        
        let size = compressed_data.len() as u64;
        let checksum = self.calculate_checksum(&compressed_data);
        
        // Store backup
        self.store_backup(backup_id, &compressed_data).await?;
        
        Ok((size, checksum))
    }

    /// Perform incremental backup
    async fn perform_incremental_backup(&self, backup_id: &Uuid, base_backup_id: Uuid) -> AppResult<(u64, String)> {
        // In a real implementation, this would:
        // 1. Compare with base backup
        // 2. Create incremental changes
        // 3. Compress and encrypt
        // 4. Upload to storage
        
        // For now, we'll simulate this
        let backup_data = format!("Incremental backup for {} based on {}", backup_id, base_backup_id);
        let compressed_data = self.compress_data(backup_data.as_bytes())?;
        
        let size = compressed_data.len() as u64;
        let checksum = self.calculate_checksum(&compressed_data);
        
        // Store backup
        self.store_backup(backup_id, &compressed_data).await?;
        
        Ok((size, checksum))
    }

    /// Perform filesystem backup
    async fn perform_filesystem_backup(&self, backup_id: &Uuid) -> AppResult<(u64, String)> {
        // In a real implementation, this would:
        // 1. Create tar archive of filesystem
        // 2. Compress and encrypt
        // 3. Upload to storage
        
        // For now, we'll simulate this
        let backup_data = format!("Filesystem backup for {}", backup_id);
        let compressed_data = self.compress_data(backup_data.as_bytes())?;
        
        let size = compressed_data.len() as u64;
        let checksum = self.calculate_checksum(&compressed_data);
        
        // Store backup
        self.store_backup(backup_id, &compressed_data).await?;
        
        Ok((size, checksum))
    }

    /// Perform configuration backup
    async fn perform_config_backup(&self, backup_id: &Uuid) -> AppResult<(u64, String)> {
        // In a real implementation, this would:
        // 1. Export configuration files
        // 2. Compress and encrypt
        // 3. Upload to storage
        
        // For now, we'll simulate this
        let backup_data = format!("Configuration backup for {}", backup_id);
        let compressed_data = self.compress_data(backup_data.as_bytes())?;
        
        let size = compressed_data.len() as u64;
        let checksum = self.calculate_checksum(&compressed_data);
        
        // Store backup
        self.store_backup(backup_id, &compressed_data).await?;
        
        Ok((size, checksum))
    }

    /// Perform restore operation
    async fn perform_restore(&self, metadata: &BackupMetadata) -> AppResult<()> {
        // Retrieve backup from storage
        let backup_data = self.retrieve_backup(metadata).await?;
        
        // Verify checksum
        let calculated_checksum = self.calculate_checksum(&backup_data);
        if calculated_checksum != metadata.checksum {
            return Err(AppError::InternalServerError("Backup checksum verification failed".to_string()));
        }
        
        // Decompress data
        let decompressed_data = self.decompress_data(&backup_data)?;
        
        // Restore based on backup type
        match metadata.backup_type {
            BackupType::Full => self.restore_full_backup(&decompressed_data).await,
            BackupType::Incremental => self.restore_incremental_backup(&decompressed_data).await,
            BackupType::Differential => self.restore_differential_backup(&decompressed_data).await,
            BackupType::FileSystem => self.restore_filesystem_backup(&decompressed_data).await,
            BackupType::Configuration => self.restore_config_backup(&decompressed_data).await,
        }
    }

    /// Restore full backup
    async fn restore_full_backup(&self, data: &[u8]) -> AppResult<()> {
        // In a real implementation, this would restore the full database
        println!("Restoring full backup with {} bytes", data.len());
        Ok(())
    }

    /// Restore incremental backup
    async fn restore_incremental_backup(&self, data: &[u8]) -> AppResult<()> {
        // In a real implementation, this would apply incremental changes
        println!("Restoring incremental backup with {} bytes", data.len());
        Ok(())
    }

    /// Restore differential backup
    async fn restore_differential_backup(&self, data: &[u8]) -> AppResult<()> {
        // In a real implementation, this would apply differential changes
        println!("Restoring differential backup with {} bytes", data.len());
        Ok(())
    }

    /// Restore filesystem backup
    async fn restore_filesystem_backup(&self, data: &[u8]) -> AppResult<()> {
        // In a real implementation, this would restore filesystem
        println!("Restoring filesystem backup with {} bytes", data.len());
        Ok(())
    }

    /// Restore configuration backup
    async fn restore_config_backup(&self, data: &[u8]) -> AppResult<()> {
        // In a real implementation, this would restore configuration
        println!("Restoring configuration backup with {} bytes", data.len());
        Ok(())
    }

    /// Store backup data
    async fn store_backup(&self, backup_id: &Uuid, data: &[u8]) -> AppResult<()> {
        match &self.config.storage_config {
            StorageConfig::Local { path } => {
                let backup_path = path.join(format!("{}.backup", backup_id));
                fs::write(&backup_path, data).await
                    .map_err(|e| AppError::InternalServerError(format!("Failed to write backup file: {}", e)))?;
            }
            StorageConfig::S3 { .. } => {
                // In a real implementation, this would upload to S3
                println!("Uploading backup {} to S3", backup_id);
            }
            StorageConfig::GCS { .. } => {
                // In a real implementation, this would upload to GCS
                println!("Uploading backup {} to GCS", backup_id);
            }
            StorageConfig::Azure { .. } => {
                // In a real implementation, this would upload to Azure
                println!("Uploading backup {} to Azure", backup_id);
            }
        }
        
        Ok(())
    }

    /// Retrieve backup data
    async fn retrieve_backup(&self, metadata: &BackupMetadata) -> AppResult<Vec<u8>> {
        match &self.config.storage_config {
            StorageConfig::Local { path } => {
                let backup_path = path.join(format!("{}.backup", metadata.id));
                fs::read(&backup_path).await
                    .map_err(|e| AppError::InternalServerError(format!("Failed to read backup file: {}", e)))
            }
            StorageConfig::S3 { .. } => {
                // In a real implementation, this would download from S3
                Ok(format!("S3 backup data for {}", metadata.id).into_bytes())
            }
            StorageConfig::GCS { .. } => {
                // In a real implementation, this would download from GCS
                Ok(format!("GCS backup data for {}", metadata.id).into_bytes())
            }
            StorageConfig::Azure { .. } => {
                // In a real implementation, this would download from Azure
                Ok(format!("Azure backup data for {}", metadata.id).into_bytes())
            }
        }
    }

    /// Delete backup from storage
    async fn delete_backup_from_storage(&self, metadata: &BackupMetadata) -> AppResult<()> {
        match &self.config.storage_config {
            StorageConfig::Local { path } => {
                let backup_path = path.join(format!("{}.backup", metadata.id));
                fs::remove_file(&backup_path).await
                    .map_err(|e| AppError::InternalServerError(format!("Failed to delete backup file: {}", e)))?;
            }
            StorageConfig::S3 { .. } => {
                // In a real implementation, this would delete from S3
                println!("Deleting backup {} from S3", metadata.id);
            }
            StorageConfig::GCS { .. } => {
                // In a real implementation, this would delete from GCS
                println!("Deleting backup {} from GCS", metadata.id);
            }
            StorageConfig::Azure { .. } => {
                // In a real implementation, this would delete from Azure
                println!("Deleting backup {} from Azure", metadata.id);
            }
        }
        
        Ok(())
    }

    /// Compress data
    fn compress_data(&self, data: &[u8]) -> AppResult<Vec<u8>> {
        if self.config.compression {
            // In a real implementation, this would use a compression library like flate2
            // For now, we'll just return the data as-is
            Ok(data.to_vec())
        } else {
            Ok(data.to_vec())
        }
    }

    /// Decompress data
    fn decompress_data(&self, data: &[u8]) -> AppResult<Vec<u8>> {
        if self.config.compression {
            // In a real implementation, this would use a decompression library
            // For now, we'll just return the data as-is
            Ok(data.to_vec())
        } else {
            Ok(data.to_vec())
        }
    }

    /// Calculate checksum
    fn calculate_checksum(&self, data: &[u8]) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        data.hash(&mut hasher);
        format!("{:x}", hasher.finish())
    }

    /// Calculate retention date
    fn calculate_retention_date(&self, created_at: DateTime<Utc>) -> DateTime<Utc> {
        // For now, we'll use daily retention
        created_at + chrono::Duration::days(self.config.retention_policy.daily_retention_days as i64)
    }

    /// Update backup statistics
    async fn update_backup_stats(&self, success: bool, size: u64) {
        let mut stats = self.backup_stats.write().await;
        stats.total_backups += 1;
        if success {
            stats.successful_backups += 1;
            stats.total_size_bytes += size;
            stats.last_backup_time = Some(Utc::now());
        } else {
            stats.failed_backups += 1;
        }
    }
}

/// Disaster recovery service
pub struct DisasterRecoveryService {
    backup_service: BackupService,
    recovery_procedures: Arc<RwLock<HashMap<String, RecoveryProcedure>>>,
}

/// Recovery procedure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryProcedure {
    pub id: String,
    pub name: String,
    pub description: String,
    pub steps: Vec<RecoveryStep>,
    pub estimated_time: Duration,
    pub dependencies: Vec<String>,
}

/// Recovery step
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryStep {
    pub id: String,
    pub name: String,
    pub description: String,
    pub step_type: RecoveryStepType,
    pub parameters: HashMap<String, serde_json::Value>,
    pub timeout: Duration,
}

/// Recovery step types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecoveryStepType {
    /// Restore from backup
    RestoreBackup,
    /// Restart service
    RestartService,
    /// Run command
    RunCommand,
    /// Wait for condition
    WaitForCondition,
    /// Send notification
    SendNotification,
}

impl DisasterRecoveryService {
    pub fn new(backup_service: BackupService) -> Self {
        Self {
            backup_service,
            recovery_procedures: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Execute disaster recovery procedure
    pub async fn execute_recovery(&self, procedure_id: &str) -> AppResult<()> {
        let procedure = self.recovery_procedures.read().await
            .get(procedure_id)
            .ok_or_else(|| AppError::ValidationError("Recovery procedure not found".to_string()))?
            .clone();

        for step in procedure.steps {
            self.execute_recovery_step(&step).await?;
        }

        Ok(())
    }

    /// Execute a single recovery step
    async fn execute_recovery_step(&self, step: &RecoveryStep) -> AppResult<()> {
        match step.step_type {
            RecoveryStepType::RestoreBackup => {
                if let Some(backup_id) = step.parameters.get("backup_id") {
                    if let Some(backup_id_str) = backup_id.as_str() {
                        if let Ok(backup_uuid) = Uuid::parse_str(backup_id_str) {
                            self.backup_service.restore_backup(backup_uuid).await?;
                        }
                    }
                }
            }
            RecoveryStepType::RestartService => {
                // In a real implementation, this would restart the service
                println!("Restarting service: {}", step.name);
            }
            RecoveryStepType::RunCommand => {
                // In a real implementation, this would run the command
                println!("Running command: {}", step.name);
            }
            RecoveryStepType::WaitForCondition => {
                // In a real implementation, this would wait for the condition
                println!("Waiting for condition: {}", step.name);
            }
            RecoveryStepType::SendNotification => {
                // In a real implementation, this would send notification
                println!("Sending notification: {}", step.name);
            }
        }

        Ok(())
    }

    /// Add recovery procedure
    pub async fn add_recovery_procedure(&self, procedure: RecoveryProcedure) -> AppResult<()> {
        self.recovery_procedures.write().await.insert(procedure.id.clone(), procedure);
        Ok(())
    }

    /// List recovery procedures
    pub async fn list_recovery_procedures(&self) -> AppResult<Vec<RecoveryProcedure>> {
        let procedures = self.recovery_procedures.read().await;
        Ok(procedures.values().cloned().collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[tokio::test]
    async fn test_backup_service() {
        let config = BackupConfig {
            enabled: true,
            schedule: BackupSchedule::Manual,
            retention_policy: RetentionPolicy {
                daily_retention_days: 7,
                weekly_retention_weeks: 4,
                monthly_retention_months: 12,
                yearly_retention_years: 5,
            },
            storage_config: StorageConfig::Local {
                path: std::env::temp_dir(),
            },
            compression: true,
            encryption: false,
            encryption_key: None,
        };

        let backup_service = BackupService::new(config);
        
        // Test full backup
        let backup_id = backup_service.create_full_backup().await.unwrap();
        assert!(!backup_id.is_nil());
        
        // Test listing backups
        let backups = backup_service.list_backups().await.unwrap();
        assert_eq!(backups.len(), 1);
        
        // Test getting backup metadata
        let metadata = backup_service.get_backup_metadata(backup_id).await.unwrap();
        assert_eq!(metadata.id, backup_id);
        assert!(matches!(metadata.status, BackupStatus::Completed));
    }

    #[tokio::test]
    async fn test_disaster_recovery_service() {
        let config = BackupConfig {
            enabled: true,
            schedule: BackupSchedule::Manual,
            retention_policy: RetentionPolicy {
                daily_retention_days: 7,
                weekly_retention_weeks: 4,
                monthly_retention_months: 12,
                yearly_retention_years: 5,
            },
            storage_config: StorageConfig::Local {
                path: std::env::temp_dir(),
            },
            compression: true,
            encryption: false,
            encryption_key: None,
        };

        let backup_service = BackupService::new(config);
        let recovery_service = DisasterRecoveryService::new(backup_service);
        
        // Test adding recovery procedure
        let procedure = RecoveryProcedure {
            id: "test_procedure".to_string(),
            name: "Test Recovery Procedure".to_string(),
            description: "A test recovery procedure".to_string(),
            steps: vec![
                RecoveryStep {
                    id: "step1".to_string(),
                    name: "Test Step".to_string(),
                    description: "A test step".to_string(),
                    step_type: RecoveryStepType::RunCommand,
                    parameters: HashMap::new(),
                    timeout: Duration::from_secs(30),
                }
            ],
            estimated_time: Duration::from_secs(60),
            dependencies: Vec::new(),
        };
        
        recovery_service.add_recovery_procedure(procedure).await.unwrap();
        
        // Test listing procedures
        let procedures = recovery_service.list_recovery_procedures().await.unwrap();
        assert_eq!(procedures.len(), 1);
    }
}
