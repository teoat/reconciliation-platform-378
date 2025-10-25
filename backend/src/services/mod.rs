//! Services module for the Reconciliation Backend
//! 
//! This module contains all business logic services including user management,
//! project management, reconciliation engine, and analytics services.

pub mod auth;
pub mod user;
pub mod enhanced_user_management;
pub mod project;
pub mod reconciliation;
pub mod advanced_reconciliation;
pub mod analytics;
pub mod file;
pub mod optimized_file_processing;
pub mod data_source;
pub mod cache;
pub mod advanced_cache;
pub mod backup_recovery;
pub mod realtime;
pub mod monitoring; // Added
pub mod monitoring_alerting;
pub mod performance;
pub mod validation;
pub mod schema_validation;
pub mod api_versioning;
pub mod internationalization;
pub mod accessibility;
pub mod mobile_optimization;

// Re-export commonly used services
pub use auth::AuthService;
pub use user::UserService;
pub use enhanced_user_management::{EnhancedUserManagementService, UserProfile, UserRole, Permission, UserActivityLog, ActivityType};
pub use project::ProjectService;
pub use reconciliation::ReconciliationService;
pub use advanced_reconciliation::{AdvancedReconciliationService, FuzzyMatchingAlgorithm, MLReconciliationModel, ReconciliationConfig, MatchingResult};
pub use analytics::AnalyticsService;
pub use file::FileService;
pub use optimized_file_processing::{StreamingFileProcessor, FileProcessingConfig, FileFormat, FileProcessingJob, ProcessingStatus};
pub use data_source::DataSourceService;
pub use cache::CacheService;
pub use advanced_cache::{AdvancedCacheService, QueryResultCache, CDNService, CacheStrategy};
pub use backup_recovery::{BackupService, DisasterRecoveryService, BackupConfig, BackupType};
pub use realtime::{NotificationService, CollaborationService};
pub use monitoring::MonitoringService; // Added
pub use monitoring_alerting::{MonitoringAlertingService, AlertDefinition, AlertInstance, AlertSeverity, NotificationChannel};
pub use performance::PerformanceService;
pub use validation::ValidationService;
pub use schema_validation::SchemaValidationService;
pub use api_versioning::{ApiVersioningService, ApiVersion, VersionStatus, ClientCompatibility, MigrationStrategy};
pub use internationalization::{InternationalizationService, Language, Locale, Translation, TimezoneInfo, LocalizationContext};
pub use accessibility::{AccessibilityService, AccessibilityGuideline, AccessibilityAudit, ComplianceLevel};
pub use mobile_optimization::{MobileOptimizationService, PWAConfig, ServiceWorkerConfig, OfflineConfig, MobileUIConfig};
