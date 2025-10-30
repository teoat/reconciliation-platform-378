//! Services module for the Reconciliation Backend
//! 
//! This module contains all business logic services including user management,
//! project management, reconciliation engine, and analytics services.

pub mod auth;
pub mod email;
pub mod user;
// pub mod enhanced_user_management; // Deprecated - merged into user.rs
pub mod project;
pub mod project_crud;
pub mod project_permissions;
pub mod project_aggregations;
pub mod reconciliation;
// pub mod advanced_reconciliation; // Deprecated - merged into reconciliation.rs
pub mod analytics;
pub mod file;
// pub mod optimized_file_processing; // Deprecated - merged into file.rs
pub mod data_source;
pub mod cache;
pub mod database_sharding;

// Re-export cache types (limit public surface)
pub use cache::CacheStrategy;
// pub mod advanced_cache; // Deprecated - merged into cache.rs
pub mod backup_recovery;
pub mod realtime;
pub mod monitoring;
// pub mod monitoring_alerting; // Deprecated - merged into monitoring.rs
pub mod performance;
pub mod validation;
// pub mod schema_validation; // Deprecated - merged into validation.rs
pub mod api_versioning;
pub mod internationalization;
pub mod accessibility;
// pub mod mobile_optimization; // Deprecated - Low value, not utilized

// Add missing service modules
pub mod error_translation;
pub mod offline_persistence;
pub mod optimistic_ui;
pub mod critical_alerts;
pub mod database_migration;

// Add missing S-Tier service modules  
pub mod advanced_metrics;

// Re-export commonly used services
pub use auth::AuthService;
pub use email::EmailService;
pub use user::UserService;
// Note: enhanced_user_management types - removed to avoid conflicts
pub use project::ProjectService;
pub use reconciliation::ReconciliationService;
// Note: advanced_reconciliation types - removed to avoid conflicts
pub use analytics::AnalyticsService;
pub use file::FileService;
// Note: optimized_file_processing types - removed to avoid conflicts
pub use data_source::DataSourceService;
pub use cache::CacheService;
// Note: advanced_cache types - removed to avoid conflicts
pub use database_migration::{DatabaseMigrationService, ProductionMigrationRunner, MigrationResult, MigrationStatus};
pub use critical_alerts::{CriticalAlertManager, CriticalAlert, AlertThreshold, AlertSeverity};
pub use error_translation::{ErrorTranslationService, UserFriendlyError, ErrorContext, ErrorContextBuilder};
pub use offline_persistence::{OfflinePersistenceService, AutoSaveManager, AutoSaveConfig, RecoveryPrompt};
pub use backup_recovery::{BackupService, DisasterRecoveryService, BackupConfig, BackupSchedule, RetentionPolicy, StorageConfig, BackupType};
pub use realtime::{NotificationService, CollaborationService};
pub use monitoring::{MonitoringService, AlertDefinition, AlertInstance, AlertSeverity as MonitoringAlertSeverity, NotificationChannel};
// Note: monitoring_alerting types now exported from monitoring module
pub use performance::PerformanceService;
pub use validation::{ValidationService, SchemaValidator, ValidationRule, ValidationErrorType};
// Note: schema_validation types now exported from validation module
pub use api_versioning::{ApiVersioningService, ApiVersion, VersionStatus, ClientCompatibility, MigrationStrategy};
pub use internationalization::{InternationalizationService, Language, Locale, Translation, TimezoneInfo, LocalizationContext};
pub use accessibility::{AccessibilityService, AccessibilityGuideline, AccessibilityAudit, ComplianceLevel};
// pub use mobile_optimization::{MobileOptimizationService, PWAConfig, ServiceWorkerConfig, OfflineConfig, MobileUIConfig}; // Commented out - module deprecated

// Export S-Tier services
pub use advanced_metrics::AdvancedMetrics;
