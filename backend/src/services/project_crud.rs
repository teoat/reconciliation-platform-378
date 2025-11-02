//! Project service CRUD operations
//!
//! This module contains the basic Create, Read, Update, Delete operations
//! for projects, including validation and database transactions.

use diesel::prelude::*;
use uuid::Uuid;
use chrono::Utc;
use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::{
    Project, NewProject, UpdateProject, ProjectStatus,
    schema::{projects, users},
};
use crate::models::schema::projects::{reconciliation_jobs, data_sources};
use crate::services::auth::ValidationUtils;
use crate::services::project_models::{
    CreateProjectRequest, UpdateProjectRequest, ProjectInfo, ProjectQueryResult,
};

/// Project service CRUD operations
pub struct ProjectCrudOps {
    db: Database,
}

impl ProjectCrudOps {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    /// Create a new project
    pub async fn create_project(&self, request: CreateProjectRequest) -> AppResult<ProjectInfo> {
        // Validate input
        if request.name.trim().is_empty() {
            return Err(AppError::Validation("Project name cannot be empty".to_string()));
        }

        if request.name.len() > 255 {
            return Err(AppError::Validation("Project name is too long".to_string()));
        }

        // Validate owner exists
        let mut conn = self.db.get_connection()?;
        let owner_exists = users::table
            .filter(users::id.eq(request.owner_id))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;

        if owner_exists == 0 {
            return Err(AppError::NotFound("Project owner not found".to_string()));
        }

        // Determine status
        let status = request.status.unwrap_or_else(|| "active".to_string());
        let status_enum: ProjectStatus = status.parse()
            .map_err(|e| AppError::Validation(format!("Invalid project status: {}", e)))?;

        // Create project
        let project_id = Uuid::new_v4();
        let now = Utc::now();

        let new_project = NewProject {
            name: request.name.trim().to_string(),
            description: request.description.map(|d| d.trim().to_string()),
            owner_id: request.owner_id,
            status: status_enum.to_string(),
            settings: request.settings,
        };

        crate::database::transaction::with_transaction(self.db.get_pool(), |tx| {
            diesel::insert_into(projects::table)
                .values(&new_project)
                .execute(tx)
                .map_err(AppError::Database)?;

            Ok(())
        }).await?;

        // Get created project with additional info
        self.get_project_by_id(project_id).await
    }

    /// Get project by ID
    pub async fn get_project_by_id(&self, project_id: Uuid) -> AppResult<ProjectInfo> {
        let mut conn = self.db.get_connection()?;

        // Get project with owner info
        let result = projects::table
            .inner_join(users::table)
            .filter(projects::id.eq(project_id))
            .select((
                projects::id,
                projects::name,
                projects::description,
                projects::owner_id,
                projects::status,
                projects::settings,
                projects::created_at,
                projects::updated_at,
                users::email,
            ))
            .first::<ProjectQueryResult>(&mut conn)
            .map_err(AppError::Database)?;

        // Get job count
        let job_count = reconciliation_jobs::table
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;

        // Get data source count
        let data_source_count = data_sources::table
            .filter(data_sources::project_id.eq(project_id))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;

        // Get last activity
        let last_activity = reconciliation_jobs::table
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .order(reconciliation_jobs::updated_at.desc())
            .select(reconciliation_jobs::updated_at)
            .first::<chrono::DateTime<chrono::Utc>>(&mut conn)
            .optional()
            .map_err(AppError::Database)?;

        Ok(ProjectInfo {
            id: result.project_id,
            name: result.project_name,
            description: result.project_description,
            owner_id: result.owner_id,
            owner_email: result.owner_email,
            status: result.project_status,
            settings: result.settings,
            created_at: result.created_at,
            updated_at: result.updated_at,
            job_count,
            data_source_count,
            last_activity,
        })
    }

    /// Update project
    pub async fn update_project(&self, project_id: Uuid, request: UpdateProjectRequest) -> AppResult<ProjectInfo> {
        let mut conn = self.db.get_connection()?;

        // Check if project exists
        let existing_project = projects::table
            .filter(projects::id.eq(project_id))
            .first::<Project>(&mut conn)
            .map_err(AppError::Database)?;

        // Validate name if provided
        if let Some(ref name) = request.name {
            if name.trim().is_empty() {
                return Err(AppError::Validation("Project name cannot be empty".to_string()));
            }

            if name.len() > 255 {
                return Err(AppError::Validation("Project name is too long".to_string()));
            }
        }

        // Validate status if provided
        if let Some(ref status) = request.status {
            let _: ProjectStatus = status.parse()
                .map_err(|e| AppError::Validation(format!("Invalid project status: {}", e)))?;
        }

        // Prepare update
        let update_data = UpdateProject {
            name: request.name.map(|n| n.trim().to_string()),
            description: request.description.map(|d| d.trim().to_string()),
            status: request.status,
            settings: request.settings,
            is_active: None, // Not updating is_active in this function
        };

        // Update project
        diesel::update(projects::table.filter(projects::id.eq(project_id)))
            .set(&update_data)
            .execute(&mut conn)
            .map_err(AppError::Database)?;

        // Return updated project
        self.get_project_by_id(project_id).await
    }

    /// Delete project
    pub async fn delete_project(&self, project_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;

        // Check if project exists
        let count = projects::table
            .filter(projects::id.eq(project_id))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;

        if count == 0 {
            return Err(AppError::NotFound("Project not found".to_string()));
        }

        // Delete project (cascade will handle related records)
        diesel::delete(projects::table.filter(projects::id.eq(project_id)))
            .execute(&mut conn)
            .map_err(AppError::Database)?;

        Ok(())
    }

    /// Archive project
    pub async fn archive_project(&self, project_id: Uuid) -> AppResult<ProjectInfo> {
        let update_request = UpdateProjectRequest {
            name: None,
            description: None,
            status: Some("archived".to_string()),
            settings: None,
        };

        self.update_project(project_id, update_request).await
    }

    /// Activate project
    pub async fn activate_project(&self, project_id: Uuid) -> AppResult<ProjectInfo> {
        let update_request = UpdateProjectRequest {
            name: None,
            description: None,
            status: Some("active".to_string()),
            settings: None,
        };

        self.update_project(project_id, update_request).await
    }
}

