//! Zero-trust configuration

/// Zero-trust configuration
///
/// Configures zero-trust security middleware behavior including mTLS requirements,
/// identity verification, least privilege enforcement, and network segmentation.
#[derive(Debug, Clone)]
pub struct ZeroTrustConfig {
    /// Require mTLS for internal communication
    pub require_mtls: bool,
    /// Require identity verification
    pub require_identity_verification: bool,
    /// Least privilege enforcement
    pub enforce_least_privilege: bool,
    /// Network segmentation enabled
    pub network_segmentation: bool,
}

impl Default for ZeroTrustConfig {
    fn default() -> Self {
        Self {
            require_mtls: false, // Disabled by default, enable in production
            require_identity_verification: true,
            enforce_least_privilege: true,
            network_segmentation: true,
        }
    }
}

