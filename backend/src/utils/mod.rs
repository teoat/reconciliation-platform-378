// ============================================================================
// UTILITIES MODULE
// ============================================================================

pub mod authorization;
pub mod crypto;
pub mod date;
pub mod env_validation;
pub mod error_handling;
pub mod error_logging;
pub mod file;
pub mod string;

pub use authorization::{
    check_admin_permission, check_job_access, check_job_permission, check_project_permission,
};
pub use error_handling::{AppError, AppResult, OptionExt, ResultExt};

// Re-export extract_user_id from handlers::helpers for convenience
// This function extracts user ID from JWT token in request headers
pub fn extract_user_id(
    req: &actix_web::HttpRequest,
) -> Result<uuid::Uuid, crate::errors::AppError> {
    crate::handlers::helpers::extract_user_id(req)
}
