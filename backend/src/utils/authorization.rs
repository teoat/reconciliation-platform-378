//! Authorization utilities for the Reconciliation Backend
//! 
//! Provides helper functions for checking user permissions on resources

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use diesel::{QueryDsl, RunQueryDsl, ExpressionMethods};
use diesel::OptionalExtension;
use uuid::Uuid;

// Import models and schema
use crate::models::{Project, User};
use crate::models::schema::projects;
use crate::models::schema::users;

/// Check if a user has permission to access a project
pub fn check_project_permission(
    db: &Database,
    user_id: Uuid,
    project_id: Uuid,
) -> AppResult<()> {
    let mut conn = db.get_connection()?;
    
    // Get the project
    let project = projects::table
        .filter(projects::id.eq(project_id))
        .first::<Project>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;
    
    if let Some(p) = project {
        // Get the user to check their role
        let user = users::table
            .filter(users::id.eq(user_id))
            .first::<User>(&mut conn)
            .optional()
            .map_err(AppError::Database)?;
        
        if let Some(u) = user {
            // Check if user owns the project or is an admin
            if u.role == "admin" || p.owner_id == user_id {
                return Ok(());
            }
        }
    }
    
    // Record unauthorized access attempt
    crate::middleware::security::UNAUTHORIZED_ACCESS_ATTEMPTS.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    Err(AppError::Forbidden("Access denied to this project".to_string()))
}

/// Check if a user can manage reconciliation jobs for a project
pub fn check_job_permission(
    db: &Database,
    user_id: Uuid,
    project_id: Uuid,
) -> AppResult<()> {
    check_project_permission(db, user_id, project_id)
}

/// Check if a user is an admin
pub fn check_admin_permission(
    db: &Database,
    user_id: Uuid,
) -> AppResult<()> {
    let mut conn = db.get_connection()?;
    
    let user = users::table
        .filter(users::id.eq(user_id))
        .first::<User>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;
    
    match user {
        Some(u) if u.role == "admin" => Ok(()),
        _ => {
            // Record auth denied
            crate::middleware::security::AUTH_DENIED.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
            Err(AppError::Forbidden("Admin access required".to_string()))
        }
    }
}

/// Get project_id from a reconciliation job_id
pub fn get_project_id_from_job(
    db: &Database,
    job_id: Uuid,
) -> AppResult<Uuid> {
    use crate::models::schema::reconciliation_jobs;
    use diesel::QueryDsl;
    
    let mut conn = db.get_connection()?;
    
    let project_id = reconciliation_jobs::table
        .filter(reconciliation_jobs::id.eq(job_id))
        .select(reconciliation_jobs::project_id)
        .first::<Uuid>(&mut conn)
        .map_err(AppError::Database)?;
    
    Ok(project_id)
}

/// Check authorization for a reconciliation job by job_id
pub fn check_job_access(
    db: &Database,
    user_id: Uuid,
    job_id: Uuid,
) -> AppResult<()> {
    let project_id = get_project_id_from_job(db, job_id)?;
    check_project_permission(db, user_id, project_id)
}

