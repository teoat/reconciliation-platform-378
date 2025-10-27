//! Services module for the Reconciliation Backend
//! 
//! This module contains all business logic services including user management,
//! project management, reconciliation engine, and analytics services.

pub mod auth;
pub mod user;
// pub mod enhanced_user_management; // Deprecated - merged into user.rs
pub mod project;
pub mod reconciliation;
// pub mod advanced_reconciliation; // Deprecated - merged into reconciliation.rs
pub mod analytics;
pub mod file;
// pub mod optimized_file_processing; // Deprecated - merged into file.rs
pub mod data_source;
pub mod cache;

// Re-export cache types
pub use cache::{AdvancedCacheService, CacheStrategy};
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
pub mod mobile_optimization;

// Add new S-Tier services
pub mod advanced_metrics;
pub mod structured_logging;
pub mod security_monitor;
pub mod query_optimizer;

// Re-export commonly used services
pub use auth::AuthService;
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
pub use backup_recovery::{BackupService, DisasterRecoveryService, BackupConfig, BackupType};
pub use realtime::{NotificationService, CollaborationService};
pub use monitoring::{MonitoringService, AlertDefinition, AlertInstance, AlertSeverity, NotificationChannel};
// Note: monitoring_alerting types now exported from monitoring module
pub use performance::PerformanceService;
pub use validation::{ValidationService, SchemaValidator, ValidationRule, ValidationErrorType};
// Note: schema_validation types now exported from validation module
pub use api_versioning::{ApiVersioningService, ApiVersion, VersionStatus, ClientCompatibility, MigrationStrategy};
pub use internationalization::{InternationalizationService, Language, Locale, Translation, TimezoneInfo, LocalizationContext};
pub use accessibility::{AccessibilityService, AccessibilityGuideline, AccessibilityAudit, ComplianceLevel};
pub use mobile_optimization::{MobileOptimizationService, PWAConfig, ServiceWorkerConfig, OfflineConfig, MobileUIConfig};

// Export S-Tier services
pub use advanced_metrics::AdvancedMetrics;
pub use structured_logging::StructuredLogging;
pub use security_monitor::{SecurityMonitor, AnomalyDetectionConfig};
pub use query_optimizer::{QueryOptimizer, QueryOptimizerConfig};
