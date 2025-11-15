// User service module
// Re-exports all user-related services and types

pub mod auth;
pub mod profile;
pub mod permissions;
pub mod sessions;

// Re-export main types and services
pub use auth::{AuthService, LoginRequest, RegisterRequest, AuthResponse};
pub use profile::{ProfileService, UserProfile, ProfileUpdateRequest};
pub use permissions::{PermissionService, UserPermissions, Role};
pub use sessions::{SessionService, UserSession, SessionInfo};

// Re-export error types
pub use auth::AuthError;
pub use profile::ProfileError;
pub use permissions::PermissionError;
pub use sessions::SessionError;