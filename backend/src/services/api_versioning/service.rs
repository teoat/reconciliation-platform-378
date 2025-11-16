//! API versioning service implementation

use crate::errors::{AppError, AppResult};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};
use semver::Version;

use crate::services::api_versioning::types::*;
use crate::services::api_versioning::resolver::VersionResolver;
use crate::services::api_versioning::migration::MigrationManager;

/// API versioning service
pub struct ApiVersioningService {
    pub versions: Arc<RwLock<HashMap<String, ApiVersion>>>,
    pub endpoint_versions: Arc<RwLock<HashMap<String, EndpointVersion>>>,
    pub migration_manager: MigrationManager,
    pub version_stats: Arc<RwLock<VersionStats>>,
}

impl ApiVersioningService {
    pub async fn new() -> Self {
        let mut service = Self {
            versions: Arc::new(RwLock::new(HashMap::new())),
            endpoint_versions: Arc::new(RwLock::new(HashMap::new())),
            migration_manager: MigrationManager::new(),
            version_stats: Arc::new(RwLock::new(VersionStats::default())),
        };
        
        service.initialize_default_versions().await;
        service
    }

    /// Initialize default API versions
    async fn initialize_default_versions(&mut self) {
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

        self.versions.write().await.insert("1.0.0".to_string(), v1_0_0);
        self.versions.write().await.insert("1.1.0".to_string(), v1_1_0);
        self.versions.write().await.insert("2.0.0".to_string(), v2_0_0);

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
        self.migration_manager.add_migration_strategy(strategy).await
    }

    /// Get migration strategy
    pub async fn get_migration_strategy(&self, from_version: &str, to_version: &str) -> AppResult<Option<MigrationStrategy>> {
        self.migration_manager.get_migration_strategy(from_version, to_version).await
    }

    /// List migration strategies
    pub async fn list_migration_strategies(&self) -> AppResult<Vec<MigrationStrategy>> {
        self.migration_manager.list_migration_strategies().await
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
        VersionResolver::validate_version_format(version)
    }

    /// Compare versions
    pub fn compare_versions(&self, version1: &str, version2: &str) -> AppResult<std::cmp::Ordering> {
        VersionResolver::compare_versions(version1, version2)
    }

    /// Get version range
    pub fn get_version_range(&self, version_req: &str) -> AppResult<semver::VersionReq> {
        VersionResolver::get_version_range(version_req)
    }

    /// Check if version satisfies requirement
    pub fn version_satisfies(&self, version: &str, requirement: &str) -> AppResult<bool> {
        VersionResolver::version_satisfies(version, requirement)
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
            for (_key, endpoint_version) in endpoint_versions.iter() {
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
        Self {
            versions: Arc::new(RwLock::new(HashMap::new())),
            endpoint_versions: Arc::new(RwLock::new(HashMap::new())),
            migration_manager: MigrationManager::new(),
            version_stats: Arc::new(RwLock::new(VersionStats::default())),
        }
    }
}

