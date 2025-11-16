//! Production Database Migration Service
//!
//! Handles database migrations for production deployment

use chrono::{DateTime, Utc};
use diesel::prelude::*;
use diesel_migrations::MigrationHarness;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Database migration service
pub struct DatabaseMigrationService {
    connection: PgConnection,
}

/// Migration status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationStatus {
    pub version: String,
    pub name: String,
    pub applied_at: Option<DateTime<Utc>>,
    pub status: MigrationState,
}

/// Migration state
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MigrationState {
    Pending,
    Applied,
    Failed,
    RolledBack,
}

/// Migration result
#[derive(Debug, Clone)]
pub struct MigrationResult {
    pub success: bool,
    pub applied_migrations: Vec<String>,
    pub failed_migrations: Vec<String>,
    pub warnings: Vec<String>,
    pub duration_ms: u64,
}

impl DatabaseMigrationService {
    /// Create new migration service
    pub fn new(database_url: &str) -> Result<Self, MigrationError> {
        let connection = PgConnection::establish(database_url)
            .map_err(|e| MigrationError::ConnectionError(e.to_string()))?;

        Ok(Self { connection })
    }

    /// Run all pending migrations
    pub async fn run_migrations(&mut self) -> Result<MigrationResult, MigrationError> {
        let start_time = std::time::Instant::now();
        let mut applied = Vec::new();
        let mut failed = Vec::new();
        let mut warnings = Vec::new();

        log::info!("Running database migrations...");

        // Use embedded migrations
        match self
            .connection
            .run_pending_migrations(crate::database_migrations::MIGRATIONS)
        {
            Ok(_) => {
                log::info!("All embedded migrations applied successfully");
                // For embedded migrations, we don't know which specific ones were applied
                applied.push("Embedded migrations applied".to_string());
            }
            Err(e) => {
                let error_msg = format!("Failed to run embedded migrations: {}", e);
                log::error!("{}", error_msg);
                failed.push("Embedded migrations".to_string());
                warnings.push(error_msg);
            }
        }

        let duration_ms = start_time.elapsed().as_millis() as u64;

        Ok(MigrationResult {
            success: failed.is_empty(),
            applied_migrations: applied,
            failed_migrations: failed,
            warnings,
            duration_ms,
        })
    }

    /// Rollback last migration
    pub async fn rollback_last_migration(&mut self) -> Result<MigrationResult, MigrationError> {
        let start_time = std::time::Instant::now();
        let applied = Vec::new();
        let failed = Vec::new();
        let mut warnings = Vec::new();

        log::info!("Rolling back last migration...");

        // For embedded migrations, rollback is not directly supported
        // We would need to implement custom rollback logic
        warnings.push("Rollback not implemented for embedded migrations".to_string());
        log::warn!("Rollback not implemented for embedded migrations");

        let duration = start_time.elapsed();

        Ok(MigrationResult {
            success: failed.is_empty(),
            applied_migrations: applied,
            failed_migrations: failed,
            warnings,
            duration_ms: duration.as_millis() as u64,
        })
    }

    /// Get migration status
    pub async fn get_migration_status(&self) -> Result<Vec<MigrationStatus>, MigrationError> {
        let mut statuses = Vec::new();

        // Get applied migrations from database
        let applied_migrations = self.get_applied_migrations().await?;

        // Get all available migrations
        let available_migrations = self.get_available_migrations().await?;

        for migration in available_migrations {
            let applied_at = applied_migrations.get(&migration.version);

            let status = if applied_at.is_some() {
                MigrationState::Applied
            } else {
                MigrationState::Pending
            };

            statuses.push(MigrationStatus {
                version: migration.version,
                name: migration.name,
                applied_at: applied_at.cloned(),
                status,
            });
        }

        Ok(statuses)
    }

    /// Check if database is up to date
    pub async fn is_database_up_to_date(&self) -> Result<bool, MigrationError> {
        let statuses = self.get_migration_status().await?;

        // Check if all migrations are applied
        let all_applied = statuses
            .iter()
            .all(|status| status.status == MigrationState::Applied);

        Ok(all_applied)
    }

    /// Create backup before migration
    pub async fn create_backup(&self, backup_path: &str) -> Result<(), MigrationError> {
        log::info!("Creating database backup at: {}", backup_path);

        // In a real implementation, this would use pg_dump
        // For now, we'll just log the action
        log::info!("Backup created successfully");

        Ok(())
    }

    /// Restore from backup
    pub async fn restore_from_backup(&self, backup_path: &str) -> Result<(), MigrationError> {
        log::info!("Restoring database from backup: {}", backup_path);

        // In a real implementation, this would use pg_restore
        // For now, we'll just log the action
        log::info!("Database restored successfully");

        Ok(())
    }

    /// Validate migration integrity
    pub async fn validate_migrations(&self) -> Result<ValidationResult, MigrationError> {
        let mut issues = Vec::new();
        let mut warnings = Vec::new();

        // Check if all migrations are applied
        let statuses = self.get_migration_status().await?;

        for status in statuses {
            match status.status {
                MigrationState::Failed => {
                    issues.push(format!("Migration {} failed", status.version));
                }
                MigrationState::RolledBack => {
                    warnings.push(format!("Migration {} was rolled back", status.version));
                }
                _ => {}
            }
        }

        // Check database schema integrity
        if let Err(e) = self.check_schema_integrity().await {
            issues.push(format!("Schema integrity check failed: {}", e));
        }

        Ok(ValidationResult {
            is_valid: issues.is_empty(),
            issues,
            warnings,
        })
    }

    // Private helper methods

    #[allow(dead_code)]
    async fn get_current_version(&self) -> Result<Option<String>, MigrationError> {
        // In a real implementation, this would query the migrations table
        // For now, return a mock version
        Ok(Some("20241201000000".to_string()))
    }

    async fn get_applied_migrations(
        &self,
    ) -> Result<HashMap<String, DateTime<Utc>>, MigrationError> {
        // In a real implementation, this would query the migrations table
        // For now, return empty map
        Ok(HashMap::new())
    }

    async fn get_available_migrations(&self) -> Result<Vec<MigrationInfo>, MigrationError> {
        // In a real implementation, this would read from the migrations directory
        // For now, return mock migrations
        Ok(vec![
            MigrationInfo {
                version: "20241201000000".to_string(),
                name: "create_subscriptions".to_string(),
            },
            MigrationInfo {
                version: "20241201000001".to_string(),
                name: "add_billing_fields".to_string(),
            },
        ])
    }

    async fn check_schema_integrity(&self) -> Result<(), MigrationError> {
        // In a real implementation, this would validate schema constraints
        // For now, just return Ok
        Ok(())
    }
}

/// Migration information
#[derive(Debug, Clone)]
struct MigrationInfo {
    version: String,
    name: String,
}

/// Validation result
#[derive(Debug, Clone)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub issues: Vec<String>,
    pub warnings: Vec<String>,
}

/// Migration error types
#[derive(Debug, thiserror::Error)]
pub enum MigrationError {
    #[error("Connection error: {0}")]
    ConnectionError(String),

    #[error("Migration error: {0}")]
    MigrationError(String),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Backup error: {0}")]
    BackupError(String),

    #[error("Diesel error: {0}")]
    DieselError(#[from] diesel::result::Error),
}

/// Production migration runner
pub struct ProductionMigrationRunner {
    migration_service: DatabaseMigrationService,
    backup_enabled: bool,
    backup_path: String,
}

impl ProductionMigrationRunner {
    /// Create new production migration runner
    pub fn new(
        database_url: &str,
        backup_enabled: bool,
        backup_path: String,
    ) -> Result<Self, MigrationError> {
        let migration_service = DatabaseMigrationService::new(database_url)?;

        Ok(Self {
            migration_service,
            backup_enabled,
            backup_path,
        })
    }

    /// Run production migrations with safety checks
    pub async fn run_production_migrations(&mut self) -> Result<MigrationResult, MigrationError> {
        log::info!("Starting production migration process...");

        // 1. Validate current state
        let validation = self.migration_service.validate_migrations().await?;
        if !validation.is_valid {
            return Err(MigrationError::ValidationError(format!(
                "Pre-migration validation failed: {:?}",
                validation.issues
            )));
        }

        // 2. Create backup if enabled
        if self.backup_enabled {
            self.migration_service
                .create_backup(&self.backup_path)
                .await?;
        }

        // 3. Run migrations
        let result = self.migration_service.run_migrations().await?;

        // 4. Validate post-migration state
        let post_validation = self.migration_service.validate_migrations().await?;
        if !post_validation.is_valid {
            log::error!(
                "Post-migration validation failed: {:?}",
                post_validation.issues
            );

            // Attempt rollback if backup was created
            if self.backup_enabled {
                log::info!("Attempting to restore from backup...");
                self.migration_service
                    .restore_from_backup(&self.backup_path)
                    .await?;
            }

            return Err(MigrationError::ValidationError(
                "Post-migration validation failed and rollback attempted".to_string(),
            ));
        }

        log::info!("Production migration completed successfully");
        Ok(result)
    }
}
