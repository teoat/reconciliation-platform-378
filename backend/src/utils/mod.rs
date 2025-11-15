// ============================================================================
// UTILITIES MODULE
// ============================================================================

pub mod error_handling;
pub mod error_logging;
pub mod date;
pub mod authorization;
pub mod validation;
pub mod string;
pub mod file;
pub mod crypto;

pub use error_handling::{AppError, AppResult, OptionExt, ResultExt};
pub use authorization::{check_project_permission, check_admin_permission, check_job_permission, check_job_access};

// Re-export extract_user_id from handlers::helpers for convenience
// This function extracts user ID from JWT token in request headers
pub fn extract_user_id(req: &actix_web::HttpRequest) -> Result<uuid::Uuid, crate::errors::AppError> {
    crate::handlers::helpers::extract_user_id(req)
}
