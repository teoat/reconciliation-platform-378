// Services module
// Main services entry point with re-exports

pub mod user;
pub mod project;
pub mod reconciliation;
pub mod analytics;
pub mod notification;
pub mod file;

// Re-export main services
pub use user::{AuthService, ProfileService, PermissionService, SessionService};
pub use project::ProjectService;
pub use reconciliation::ReconciliationService;
pub use analytics::AnalyticsService;
pub use notification::NotificationService;
pub use file::FileService;

// Re-export types
pub use user::*;
pub use project::*;
pub use reconciliation::*;
pub use analytics::*;
pub use notification::*;
pub use file::*;