// Stub for Backup Recovery Service
// Needed to fix build errors.
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BackupConfig {}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BackupSchedule {}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RetentionPolicy {}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StorageConfig {}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum BackupType {
    Full,
    Incremental,
}

pub struct BackupService;

impl BackupService {
    pub fn new() -> Self {
        Self
    }
}

pub struct DisasterRecoveryService;

impl DisasterRecoveryService {
    pub fn new() -> Self {
        Self
    }
}
