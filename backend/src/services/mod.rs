//! Services module for the Reconciliation Backend
//! 
//! This module contains all business logic services including user management,
//! project management, reconciliation engine, and analytics services.

pub mod auth;
pub mod email;
#[path = "user/mod.rs"]
pub mod user;
// Project modules - must be declared before project.rs which imports them
pub mod project_models;
pub mod project_crud;
pub mod project_queries;
pub mod project_analytics;
pub mod project;
pub mod project_permissions;
pub mod project_aggregations;
// Reconciliation service - now split into modules
#[path = "reconciliation/mod.rs"]
pub mod reconciliation;
pub mod analytics;
pub mod file;
pub mod data_source;
pub mod data_source_config;
pub mod cache;
pub mod database_sharding;
pub mod shard_aware_db;

// Re-export cache types (limit public surface)
// Note: CacheStrategy may not exist, using CacheStats if available
pub mod backup_recovery;
pub mod realtime;
pub mod monitoring;
pub mod performance;
pub mod validation;
pub mod api_versioning;
// Internationalization modules - must be declared before internationalization.rs which imports them
pub mod internationalization_models;
pub mod internationalization_data;
pub mod internationalization;
pub mod accessibility;

// Add missing service modules
pub mod error_translation;
pub mod error_logging;
pub mod offline_persistence;
pub mod optimistic_ui;
pub mod critical_alerts;
pub mod database_migration;

// Add missing S-Tier service modules
pub mod advanced_metrics;
pub mod ai;

// Add missing service modules
pub mod security;
pub mod security_monitor;
pub mod secrets;
pub mod secret_manager;
pub mod structured_logging;
pub mod billing;
pub mod query_optimizer;
pub mod reconciliation_engine;
pub mod registry;
pub mod metrics;

// Cache enhancements
#[path = "cache/warming.rs"]
pub mod cache_warming;
#[path = "cache/analytics.rs"]
pub mod cache_analytics;

// Performance enhancements
#[path = "performance/query_tuning.rs"]
pub mod query_tuning;

// Re-export commonly used services
pub use auth::AuthService;
pub use email::EmailService;
pub use user::UserService;
pub use project::ProjectService;
pub use reconciliation::ReconciliationService;
pub use analytics::AnalyticsService;
pub use file::FileService;
pub use data_source::DataSourceService;
pub use cache::CacheService;
pub use database_sharding::{ShardManager, ShardedPoolManager, ShardConfig};
pub use shard_aware_db::ShardAwareDb;
pub use database_migration::{DatabaseMigrationService, ProductionMigrationRunner, MigrationResult, MigrationStatus};
pub use critical_alerts::{CriticalAlertManager, CriticalAlert, AlertThreshold, AlertSeverity};
pub use error_translation::{ErrorTranslationService, UserFriendlyError, ErrorContext, ErrorContextBuilder};
pub use error_logging::{ErrorLoggingService, ErrorLoggingConfig, ErrorContext as ErrorLoggingContext, ErrorLevel};
pub use offline_persistence::{OfflinePersistenceService, AutoSaveManager, AutoSaveConfig, RecoveryPrompt};
pub use backup_recovery::{BackupService, DisasterRecoveryService, BackupConfig, BackupSchedule, RetentionPolicy, StorageConfig, BackupType};
pub use realtime::{NotificationService, CollaborationService};
pub use monitoring::{MonitoringService, AlertDefinition, AlertInstance, AlertSeverity as MonitoringAlertSeverity, NotificationChannel};
pub use performance::PerformanceService;
pub use validation::{ValidationService, SchemaValidator, ValidationRule, ValidationErrorType};
pub use api_versioning::{ApiVersioningService, ApiVersion, VersionStatus, ClientCompatibility, MigrationStrategy};
pub use internationalization::{InternationalizationService, Language, Locale, Translation, TimezoneInfo, LocalizationContext};
pub use accessibility::{AccessibilityService, AccessibilityGuideline, AccessibilityAudit, ComplianceLevel};

// Export S-Tier services
pub use advanced_metrics::AdvancedMetrics;

// Resilience patterns
pub mod resilience;
pub use resilience::{ResilienceManager, graceful_degradation};

// Password management
pub mod password_manager;

// SQL Data Synchronization
pub mod sync;
// Extracted password manager utilities (rotation, audit, encryption)
// Note: These are separate modules that can be used independently
// The main password_manager.rs file contains the core implementation
#[path = "password_manager_utils_dir/mod.rs"]
pub mod password_manager_utils;

// Re-export main types
pub use password_manager::{
    PasswordManager, PasswordEntry, RotationSchedule,
};
