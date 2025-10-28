// backend/src/services/api_versioning.rs
use crate::errors::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};
use std::sync::Arc;
use tokio::sync::RwLock;
use semver::{Version, VersionReq};

/// API version information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiVersion {
    pub version: String,
    pub release_date: DateTime<Utc>,
    pub status: VersionStatus,
    pub deprecation_date: Option<DateTime<Utc>>,
    pub sunset_date: Option<DateTime<Utc>>,
    pub changelog: Vec<VersionChange>,
    pub breaking_changes: Vec<BreakingChange>,
    pub migration_guide: Option<String>,
}

/// Version status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VersionStatus {
    Development,
    Beta,
    Stable,
    Deprecated,
    Sunset,
}

/// Version change
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionChange {
    pub change_type: ChangeType,
    pub description: String,
    pub affected_endpoints: Vec<String>,
    pub severity: ChangeSeverity,
}

/// Change types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChangeType {
    Added,
    Changed,
    Deprecated,
    Removed,
    Fixed,
    Security,
}

/// Change severity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChangeSeverity {
    Low,
    Medium,
    High,
    Critical,
}

/// Breaking change
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BreakingChange {
    pub endpoint: String,
    pub change_description: String,
    pub migration_steps: Vec<String>,
    pub affected_fields: Vec<String>,
    pub alternative_endpoint: Option<String>,
}

/// API endpoint version mapping
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EndpointVersion {
    pub endpoint: String,
    pub method: String,
    pub versions: Vec<String>,
    pub default_version: String,
    pub deprecated_versions: Vec<String>,
}

/// Client version compatibility
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientCompatibility {
    pub client_version: String,
    pub api_version: String,
    pub is_compatible: bool,
    pub compatibility_issues: Vec<CompatibilityIssue>,
    pub recommended_action: RecommendedAction,
}

/// Compatibility issue
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompatibilityIssue {
    pub issue_type: CompatibilityIssueType,
    pub description: String,
    pub severity: ChangeSeverity,
    pub affected_endpoints: Vec<String>,
}

/// Compatibility issue types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CompatibilityIssueType {
    DeprecatedEndpoint,
    RemovedEndpoint,
    ChangedRequestFormat,
    ChangedResponseFormat,
    ChangedAuthentication,
    ChangedPermissions,
}

/// Recommended actions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecommendedAction {
    UpdateClient,
    UseAlternativeEndpoint,
    MigrateData,
    ContactSupport,
    NoActionRequired,
}

/// Version migration strategy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationStrategy {
    pub from_version: String,
    pub to_version: String,
    pub migration_steps: Vec<MigrationStep>,
    pub estimated_duration: String,
    pub rollback_plan: Option<String>,
}

/// Migration step
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationStep {
    pub step_number: u32,
    pub description: String,
    pub commands: Vec<String>,
    pub validation_checks: Vec<String>,
    pub rollback_commands: Option<Vec<String>>,
}

/// API versioning service
pub struct ApiVersioningService {
    versions: Arc<RwLock<HashMap<String, ApiVersion>>>,
    endpoint_versions: Arc<RwLock<HashMap<String, EndpointVersion>>>,
    migration_strategies: Arc<RwLock<HashMap<String, MigrationStrategy>>>,
    version_stats: Arc<RwLock<VersionStats>>,
}

/// Version statistics
#[derive(Debug, Clone, Default)]
pub struct VersionStats {
    pub total_versions: u32,
    pub active_versions: u32,
    pub deprecated_versions: u32,
    pub sunset_versions: u32,
    pub total_endpoints: u32,
    pub breaking_changes_count: u32,
}

impl ApiVersioningService {
    pub async fn new() -> Self {
        let mut service = Self {
            versions: Arc::new(RwLock::new(HashMap::new())),
            endpoint_versions: Arc::new(RwLock::new(HashMap::new())),
            migration_strategies: Arc::new(RwLock::new(HashMap::new())),
            version_stats: Arc::new(RwLock::new(VersionStats::default())),
        };
        
        // Initialize with default versions
        service.initialize_default_versions().await;
        service
    }

    /// Initialize default API versions
    async fn initialize_default_versions(&mut self) {
        // Version 1.0.0
        let v1_0_0 = ApiVersion {
            version: "1.0.0".to_string(),
            release_date: Utc::now() - chrono::Duration::days(365),
            status: VersionStatus::Stable,
            deprecation_date: None,
            sunset_date: None,
            changelog: vec![
                VersionChange {
                    change_type: ChangeType::Added,
                    description: "Initial API release".to_string(),
                    affected_endpoints: vec!["*".to_string()],
                    severity: ChangeSeverity::Low,
                }
            ],
            breaking_changes: vec![],
            migration_guide: None,
        };

        // Version 1.1.0
        let v1_1_0 = ApiVersion {
            version: "1.1.0".to_string(),
            release_date: Utc::now() - chrono::Duration::days(300),
            status: VersionStatus::Stable,
            deprecation_date: None,
            sunset_date: None,
            changelog: vec![
                VersionChange {
                    change_type: ChangeType::Added,
                    description: "Added new reconciliation endpoints".to_string(),
                    affected_endpoints: vec!["/api/reconciliation".to_string()],
                    severity: ChangeSeverity::Low,
                },
                VersionChange {
                    change_type: ChangeType::Changed,
                    description: "Enhanced user management endpoints".to_string(),
                    affected_endpoints: vec!["/api/users".to_string()],
                    severity: ChangeSeverity::Medium,
                }
            ],
            breaking_changes: vec![],
            migration_guide: None,
        };

        // Version 2.0.0
        let v2_0_0 = ApiVersion {
            version: "2.0.0".to_string(),
            release_date: Utc::now() - chrono::Duration::days(180),
            status: VersionStatus::Stable,
            deprecation_date: None,
            sunset_date: None,
            changelog: vec![
                VersionChange {
                    change_type: ChangeType::Changed,
                    description: "Major API restructuring".to_string(),
                    affected_endpoints: vec!["*".to_string()],
                    severity: ChangeSeverity::Critical,
                }
            ],
            breaking_changes: vec![
                BreakingChange {
                    endpoint: "/api/v1/users".to_string(),
                    change_description: "User endpoint moved to /api/v2/users".to_string(),
                    migration_steps: vec![
                        "Update client to use new endpoint".to_string(),
                        "Update authentication headers".to_string(),
                    ],
                    affected_fields: vec!["id".to_string(), "email".to_string()],
                    alternative_endpoint: Some("/api/v2/users".to_string()),
                }
            ],
            migration_guide: Some("See migration guide for v2.0.0".to_string()),
        };

        // Store versions
        self.versions.write().await.insert("1.0.0".to_string(), v1_0_0);
        self.versions.write().await.insert("1.1.0".to_string(), v1_1_0);
        self.versions.write().await.insert("2.0.0".to_string(), v2_0_0);

        // Initialize endpoint versions
        self.initialize_endpoint_versions().await;
    }

    /// Initialize endpoint version mappings
    async fn initialize_endpoint_versions(&mut self) {
        let endpoints = vec![
            EndpointVersion {
                endpoint: "/api/users".to_string(),
                method: "GET".to_string(),
                versions: vec!["1.0.0".to_string(), "1.1.0".to_string(), "2.0.0".to_string()],
                default_version: "2.0.0".to_string(),
                deprecated_versions: vec!["1.0.0".to_string()],
            },
            EndpointVersion {
                endpoint: "/api/projects".to_string(),
                method: "GET".to_string(),
                versions: vec!["1.0.0".to_string(), "1.1.0".to_string(), "2.0.0".to_string()],
                default_version: "2.0.0".to_string(),
                deprecated_versions: vec![],
            },
            EndpointVersion {
                endpoint: "/api/reconciliation".to_string(),
                method: "POST".to_string(),
                versions: vec!["1.1.0".to_string(), "2.0.0".to_string()],
                default_version: "2.0.0".to_string(),
                deprecated_versions: vec![],
            },
        ];

        for endpoint in endpoints {
            let key = format!("{}:{}", endpoint.method, endpoint.endpoint);
            self.endpoint_versions.write().await.insert(key, endpoint);
        }
    }

    /// Add new API version
    pub async fn add_version(&self, version: ApiVersion) -> AppResult<()> {
        let version_str = version.version.clone();
        self.versions.write().await.insert(version_str, version);
        self.update_version_stats().await;
        Ok(())
    }

    /// Update API version
    pub async fn update_version(&self, version: String, updated_version: ApiVersion) -> AppResult<()> {
        self.versions.write().await.insert(version, updated_version);
        self.update_version_stats().await;
        Ok(())
    }

    /// Get API version
    pub async fn get_version(&self, version: &str) -> AppResult<Option<ApiVersion>> {
        let versions = self.versions.read().await;
        Ok(versions.get(version).cloned())
    }

    /// List all API versions
    pub async fn list_versions(&self) -> AppResult<Vec<ApiVersion>> {
        let versions = self.versions.read().await;
        Ok(versions.values().cloned().collect())
    }

    /// Get latest stable version
    pub async fn get_latest_stable_version(&self) -> AppResult<Option<ApiVersion>> {
        let versions = self.versions.read().await;
        let stable_versions: Vec<_> = versions.values()
            .filter(|v| matches!(v.status, VersionStatus::Stable))
            .cloned()
            .collect();

        if stable_versions.is_empty() {
            return Ok(None);
        }

        // Sort by version number and return the latest
        let mut sorted_versions = stable_versions;
        sorted_versions.sort_by(|a, b| {
            let version_a = Version::parse(&a.version).unwrap_or_else(|_| Version::new(0, 0, 0));
            let version_b = Version::parse(&b.version).unwrap_or_else(|_| Version::new(0, 0, 0));
            version_b.cmp(&version_a)
        });

        Ok(sorted_versions.first().cloned())
    }

    /// Check client compatibility
    pub async fn check_client_compatibility(&self, client_version: &str, api_version: &str) -> AppResult<ClientCompatibility> {
        let versions = self.versions.read().await;
        let api_version_info = versions.get(api_version);
        
        let mut compatibility_issues = Vec::new();
        let mut is_compatible = true;
        let mut recommended_action = RecommendedAction::NoActionRequired;

        if let Some(version_info) = api_version_info {
            // Check if API version is deprecated or sunset
            match version_info.status {
                VersionStatus::Deprecated => {
                    compatibility_issues.push(CompatibilityIssue {
                        issue_type: CompatibilityIssueType::DeprecatedEndpoint,
                        description: format!("API version {} is deprecated", api_version),
                        severity: ChangeSeverity::Medium,
                        affected_endpoints: vec!["*".to_string()],
                    });
                    recommended_action = RecommendedAction::UpdateClient;
                }
                VersionStatus::Sunset => {
                    compatibility_issues.push(CompatibilityIssue {
                        issue_type: CompatibilityIssueType::RemovedEndpoint,
                        description: format!("API version {} has been sunset", api_version),
                        severity: ChangeSeverity::Critical,
                        affected_endpoints: vec!["*".to_string()],
                    });
                    is_compatible = false;
                    recommended_action = RecommendedAction::UpdateClient;
                }
                _ => {}
            }

            // Check for breaking changes
            for breaking_change in &version_info.breaking_changes {
                compatibility_issues.push(CompatibilityIssue {
                    issue_type: CompatibilityIssueType::ChangedRequestFormat,
                    description: breaking_change.change_description.clone(),
                    severity: ChangeSeverity::High,
                    affected_endpoints: vec![breaking_change.endpoint.clone()],
                });
                is_compatible = false;
                recommended_action = RecommendedAction::UpdateClient;
            }
        } else {
            compatibility_issues.push(CompatibilityIssue {
                issue_type: CompatibilityIssueType::RemovedEndpoint,
                description: format!("API version {} not found", api_version),
                severity: ChangeSeverity::Critical,
                affected_endpoints: vec!["*".to_string()],
            });
            is_compatible = false;
            recommended_action = RecommendedAction::ContactSupport;
        }

        Ok(ClientCompatibility {
            client_version: client_version.to_string(),
            api_version: api_version.to_string(),
            is_compatible,
            compatibility_issues,
            recommended_action,
        })
    }

    /// Get endpoint version information
    pub async fn get_endpoint_version(&self, method: &str, endpoint: &str) -> AppResult<Option<EndpointVersion>> {
        let key = format!("{}:{}", method, endpoint);
        let endpoint_versions = self.endpoint_versions.read().await;
        Ok(endpoint_versions.get(&key).cloned())
    }

    /// Add endpoint version mapping
    pub async fn add_endpoint_version(&self, endpoint_version: EndpointVersion) -> AppResult<()> {
        let key = format!("{}:{}", endpoint_version.method, endpoint_version.endpoint);
        self.endpoint_versions.write().await.insert(key, endpoint_version);
        Ok(())
    }

    /// Get supported versions for endpoint
    pub async fn get_supported_versions(&self, method: &str, endpoint: &str) -> AppResult<Vec<String>> {
        let key = format!("{}:{}", method, endpoint);
        let endpoint_versions = self.endpoint_versions.read().await;
        
        if let Some(endpoint_version) = endpoint_versions.get(&key) {
            Ok(endpoint_version.versions.clone())
        } else {
            Ok(vec![])
        }
    }

    /// Check if version is supported for endpoint
    pub async fn is_version_supported(&self, method: &str, endpoint: &str, version: &str) -> AppResult<bool> {
        let supported_versions = self.get_supported_versions(method, endpoint).await?;
        Ok(supported_versions.contains(&version.to_string()))
    }

    /// Add migration strategy
    pub async fn add_migration_strategy(&self, strategy: MigrationStrategy) -> AppResult<()> {
        let key = format!("{}:{}", strategy.from_version, strategy.to_version);
        self.migration_strategies.write().await.insert(key, strategy);
        Ok(())
    }

    /// Get migration strategy
    pub async fn get_migration_strategy(&self, from_version: &str, to_version: &str) -> AppResult<Option<MigrationStrategy>> {
        let key = format!("{}:{}", from_version, to_version);
        let strategies = self.migration_strategies.read().await;
        Ok(strategies.get(&key).cloned())
    }

    /// List migration strategies
    pub async fn list_migration_strategies(&self) -> AppResult<Vec<MigrationStrategy>> {
        let strategies = self.migration_strategies.read().await;
        Ok(strategies.values().cloned().collect())
    }

    /// Deprecate API version
    pub async fn deprecate_version(&self, version: &str, deprecation_date: DateTime<Utc>, sunset_date: Option<DateTime<Utc>>) -> AppResult<()> {
        let mut versions = self.versions.write().await;
        if let Some(version_info) = versions.get_mut(version) {
            version_info.status = VersionStatus::Deprecated;
            version_info.deprecation_date = Some(deprecation_date);
            version_info.sunset_date = sunset_date;
        }
        self.update_version_stats().await;
        Ok(())
    }

    /// Sunset API version
    pub async fn sunset_version(&self, version: &str) -> AppResult<()> {
        let mut versions = self.versions.write().await;
        if let Some(version_info) = versions.get_mut(version) {
            version_info.status = VersionStatus::Sunset;
            version_info.sunset_date = Some(Utc::now());
        }
        self.update_version_stats().await;
        Ok(())
    }

    /// Get version statistics
    pub async fn get_version_stats(&self) -> AppResult<VersionStats> {
        let stats = self.version_stats.read().await.clone();
        Ok(stats)
    }

    /// Update version statistics
    async fn update_version_stats(&self) {
        let versions = self.versions.read().await;
        let endpoint_versions = self.endpoint_versions.read().await;
        
        let mut stats = VersionStats::default();
        stats.total_versions = versions.len() as u32;
        stats.total_endpoints = endpoint_versions.len() as u32;
        
        for version in versions.values() {
            match version.status {
                VersionStatus::Stable => stats.active_versions += 1,
                VersionStatus::Deprecated => stats.deprecated_versions += 1,
                VersionStatus::Sunset => stats.sunset_versions += 1,
                _ => {}
            }
            stats.breaking_changes_count += version.breaking_changes.len() as u32;
        }
        
        *self.version_stats.write().await = stats;
    }

    /// Validate version format
    pub fn validate_version_format(&self, version: &str) -> AppResult<()> {
        if Version::parse(version).is_err() {
            return Err(AppError::Validation(format!("Invalid version format: {}", version)));
        }
        Ok(())
    }

    /// Compare versions
    pub fn compare_versions(&self, version1: &str, version2: &str) -> AppResult<std::cmp::Ordering> {
        let v1 = Version::parse(version1)
            .map_err(|_| AppError::Validation(format!("Invalid version format: {}", version1)))?;
        let v2 = Version::parse(version2)
            .map_err(|_| AppError::Validation(format!("Invalid version format: {}", version2)))?;
        
        Ok(v1.cmp(&v2))
    }

    /// Get version range
    pub fn get_version_range(&self, version_req: &str) -> AppResult<VersionReq> {
        VersionReq::parse(version_req)
            .map_err(|_| AppError::Validation(format!("Invalid version requirement: {}", version_req)))
    }

    /// Check if version satisfies requirement
    pub fn version_satisfies(&self, version: &str, requirement: &str) -> AppResult<bool> {
        let version = Version::parse(version)
            .map_err(|_| AppError::Validation(format!("Invalid version format: {}", version)))?;
        let requirement = VersionReq::parse(requirement)
            .map_err(|_| AppError::Validation(format!("Invalid version requirement: {}", requirement)))?;
        
        Ok(requirement.matches(&version))
    }

    /// Generate API documentation for version
    pub async fn generate_version_docs(&self, version: &str) -> AppResult<String> {
        let versions = self.versions.read().await;
        let endpoint_versions = self.endpoint_versions.read().await;
        
        if let Some(version_info) = versions.get(version) {
            let mut docs = format!("# API Version {}\n\n", version);
            docs.push_str(&format!("**Status:** {:?}\n", version_info.status));
            docs.push_str(&format!("**Release Date:** {}\n\n", version_info.release_date));
            
            if let Some(deprecation_date) = version_info.deprecation_date {
                docs.push_str(&format!("**Deprecation Date:** {}\n", deprecation_date));
            }
            
            if let Some(sunset_date) = version_info.sunset_date {
                docs.push_str(&format!("**Sunset Date:** {}\n", sunset_date));
            }
            
            docs.push_str("\n## Changelog\n\n");
            for change in &version_info.changelog {
                docs.push_str(&format!("- **{:?}** {} ({:?})\n", change.change_type, change.description, change.severity));
            }
            
            if !version_info.breaking_changes.is_empty() {
                docs.push_str("\n## Breaking Changes\n\n");
                for breaking_change in &version_info.breaking_changes {
                    docs.push_str(&format!("### {}\n", breaking_change.endpoint));
                    docs.push_str(&format!("{}\n", breaking_change.change_description));
                    docs.push_str("**Migration Steps:**\n");
                    for step in &breaking_change.migration_steps {
                        docs.push_str(&format!("- {}\n", step));
                    }
                }
            }
            
            docs.push_str("\n## Supported Endpoints\n\n");
            for (key, endpoint_version) in endpoint_versions.iter() {
                if endpoint_version.versions.contains(&version.to_string()) {
                    docs.push_str(&format!("- **{}** {}\n", endpoint_version.method, endpoint_version.endpoint));
                }
            }
            
            Ok(docs)
        } else {
            Err(AppError::Validation(format!("Version {} not found", version)))
        }
    }
}

impl Default for ApiVersioningService {
    fn default() -> Self {
        // Create a synchronous version for Default
        Self {
            versions: Arc::new(RwLock::new(HashMap::new())),
            endpoint_versions: Arc::new(RwLock::new(HashMap::new())),
            migration_strategies: Arc::new(RwLock::new(HashMap::new())),
            version_stats: Arc::new(RwLock::new(VersionStats::default())),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_api_versioning() {
        let service = ApiVersioningService::new().await;
        
        // Test getting version
        let version = service.get_version("1.0.0").await.unwrap();
        assert!(version.is_some());
        
        // Test listing versions
        let versions = service.list_versions().await.unwrap();
        assert!(!versions.is_empty());
        
        // Test getting latest stable version
        let latest = service.get_latest_stable_version().await.unwrap();
        assert!(latest.is_some());
        
        // Test client compatibility
        let compatibility = service.check_client_compatibility("1.0.0", "1.0.0").await.unwrap();
        assert!(compatibility.is_compatible);
        
        // Test endpoint version
        let endpoint_version = service.get_endpoint_version("GET", "/api/users").await.unwrap();
        assert!(endpoint_version.is_some());
        
        // Test supported versions
        let supported = service.get_supported_versions("GET", "/api/users").await.unwrap();
        assert!(!supported.is_empty());
        
        // Test version format validation
        assert!(service.validate_version_format("1.0.0").is_ok());
        assert!(service.validate_version_format("invalid").is_err());
        
        // Test version comparison
        let ordering = service.compare_versions("1.0.0", "1.1.0").unwrap();
        assert_eq!(ordering, std::cmp::Ordering::Less);
        
        // Test version satisfaction
        assert!(service.version_satisfies("1.0.0", ">=1.0.0").unwrap());
        assert!(!service.version_satisfies("1.0.0", ">=2.0.0").unwrap());
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
        
        service.add_migration_strategy(strategy).await.unwrap();
        
        let retrieved = service.get_migration_strategy("1.0.0", "2.0.0").await.unwrap();
        assert!(retrieved.is_some());
        
        let strategies = service.list_migration_strategies().await.unwrap();
        assert!(!strategies.is_empty());
    }

    #[tokio::test]
    async fn test_version_management() {
        let service = ApiVersioningService::new().await;
        
        // Test deprecating version
        service.deprecate_version("1.0.0", Utc::now(), Some(Utc::now() + chrono::Duration::days(90))).await.unwrap();
        
        let version = service.get_version("1.0.0").await.unwrap().unwrap();
        assert!(matches!(version.status, VersionStatus::Deprecated));
        
        // Test sunsetting version
        service.sunset_version("1.0.0").await.unwrap();
        
        let version = service.get_version("1.0.0").await.unwrap().unwrap();
        assert!(matches!(version.status, VersionStatus::Sunset));
        
        // Test version stats
        let stats = service.get_version_stats().await.unwrap();
        assert!(stats.total_versions > 0);
    }
}
