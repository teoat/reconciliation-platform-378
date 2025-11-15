//! API version resolution logic

use crate::errors::{AppError, AppResult};
use semver::{Version, VersionReq};

use crate::services::api_versioning::types::*;

/// Version resolver utility
pub struct VersionResolver;

impl VersionResolver {
    /// Validate version format
    pub fn validate_version_format(version: &str) -> AppResult<()> {
        if Version::parse(version).is_err() {
            return Err(AppError::Validation(format!("Invalid version format: {}", version)));
        }
        Ok(())
    }

    /// Compare versions
    pub fn compare_versions(version1: &str, version2: &str) -> AppResult<std::cmp::Ordering> {
        let v1 = Version::parse(version1)
            .map_err(|_| AppError::Validation(format!("Invalid version format: {}", version1)))?;
        let v2 = Version::parse(version2)
            .map_err(|_| AppError::Validation(format!("Invalid version format: {}", version2)))?;
        
        Ok(v1.cmp(&v2))
    }

    /// Get version range
    pub fn get_version_range(version_req: &str) -> AppResult<VersionReq> {
        VersionReq::parse(version_req)
            .map_err(|_| AppError::Validation(format!("Invalid version requirement: {}", version_req)))
    }

    /// Check if version satisfies requirement
    pub fn version_satisfies(version: &str, requirement: &str) -> AppResult<bool> {
        let version = Version::parse(version)
            .map_err(|_| AppError::Validation(format!("Invalid version format: {}", version)))?;
        let requirement = VersionReq::parse(requirement)
            .map_err(|_| AppError::Validation(format!("Invalid version requirement: {}", requirement)))?;
        
        Ok(requirement.matches(&version))
    }
}

