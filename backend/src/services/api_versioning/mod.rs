//! API versioning service
//!
//! This module provides API versioning functionality including version management,
//! compatibility checking, and migration strategies.

pub mod types;
pub mod resolver;
pub mod migration;
pub mod service;

pub use types::*;
pub use resolver::VersionResolver;
pub use migration::MigrationManager;
pub use service::ApiVersioningService;

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    #[tokio::test]
    async fn test_api_versioning() {
        let service = ApiVersioningService::new().await;
        
        let version = service.get_version("1.0.0").await.expect("Failed to get version");
        assert!(version.is_some());
        
        let versions = service.list_versions().await.expect("Failed to list versions");
        assert!(!versions.is_empty());
        
        let latest = service.get_latest_stable_version().await.expect("Failed to get latest version");
        assert!(latest.is_some());
        
        let compatibility = service.check_client_compatibility("1.0.0", "1.0.0").await.expect("Failed to check compatibility");
        assert!(compatibility.is_compatible);
        
        let endpoint_version = service.get_endpoint_version("GET", "/api/users").await.expect("Failed to get endpoint version");
        assert!(endpoint_version.is_some());
        
        let supported = service.get_supported_versions("GET", "/api/users").await.expect("Failed to get supported versions");
        assert!(!supported.is_empty());
        
        assert!(service.validate_version_format("1.0.0").is_ok());
        assert!(service.validate_version_format("invalid").is_err());
        
        let ordering = service.compare_versions("1.0.0", "1.1.0").expect("Failed to compare versions");
        assert_eq!(ordering, std::cmp::Ordering::Less);
        
        assert!(service.version_satisfies("1.0.0", ">=1.0.0").expect("Failed to check version satisfies"));
        assert!(!service.version_satisfies("1.0.0", ">=2.0.0").expect("Failed to check version satisfies"));
    }

    #[tokio::test]
    async fn test_migration_strategies() {
        let service = ApiVersioningService::new().await;
        
        let strategy = MigrationStrategy {
            from_version: "1.0.0".to_string(),
            to_version: "2.0.0".to_string(),
            migration_steps: vec![
                MigrationStep {
                    step_number: 1,
                    description: "Update client code".to_string(),
                    commands: vec!["npm update".to_string()],
                    validation_checks: vec!["Test API calls".to_string()],
                    rollback_commands: Some(vec!["npm install old-version".to_string()]),
                }
            ],
            estimated_duration: "2 hours".to_string(),
            rollback_plan: Some("Revert to previous version".to_string()),
        };
        
        service.add_migration_strategy(strategy).await.expect("Failed to add migration strategy");
        
        let retrieved = service.get_migration_strategy("1.0.0", "2.0.0").await.expect("Failed to get migration strategy");
        assert!(retrieved.is_some());
        
        let strategies = service.list_migration_strategies().await.expect("Failed to list migration strategies");
        assert!(!strategies.is_empty());
    }

    #[tokio::test]
    async fn test_version_management() {
        let service = ApiVersioningService::new().await;
        
        service.deprecate_version("1.0.0", Utc::now(), Some(Utc::now() + chrono::Duration::days(90))).await.expect("Failed to deprecate version");

        let version = service.get_version("1.0.0").await.expect("Failed to get version").expect("Version not found");
        assert!(matches!(version.status, VersionStatus::Deprecated));
        
        service.sunset_version("1.0.0").await.expect("Failed to sunset version");
        
        let version = service.get_version("1.0.0").await.expect("Failed to get version").expect("Version not found");
        assert!(matches!(version.status, VersionStatus::Sunset));
        
        let stats = service.get_version_stats().await.expect("Failed to get version stats");
        assert!(stats.total_versions > 0);
    }
}

