//! Project service for the Reconciliation Backend
//!
//! This module provides project management functionality including CRUD operations,
//! project validation, and project-related business logic.
//!
//! The service has been refactored into smaller modules:
//! - project_models.rs: Data structures and types
//! - project_crud.rs: CRUD operations
//! - project_queries.rs: Query and listing operations
//! - project_analytics.rs: Analytics and statistics (future)

use crate::database::Database;
use crate::errors::{AppResult, AppError};
use serde::Serialize;
use uuid::Uuid;
use crate::services::auth::ValidationUtils;
use diesel::prelude::*;
use crate::models::schema::{projects, users};
use crate::models::schema::{reconciliation_jobs, data_sources};

// Re-export types from models for backward compatibility
pub use crate::services::project_models::*;

// Import sub-modules
use crate::services::project_analytics::ProjectAnalyticsOps;
use crate::services::project_crud::ProjectCrudOps;
use crate::services::project_queries::ProjectQueryOps;

/// Project service - Main entry point that delegates to specialized modules
pub struct ProjectService {
    db: Database,
    crud_ops: ProjectCrudOps,
    query_ops: ProjectQueryOps,
    analytics_ops: ProjectAnalyticsOps,
}

impl ProjectService {
    pub fn new(db: Database) -> Self {
        Self {
            db: db.clone(),
            crud_ops: ProjectCrudOps::new(db.clone()),
            query_ops: ProjectQueryOps::new(db.clone()),
            analytics_ops: ProjectAnalyticsOps::new(db),
        }
    }

    /// Create a new project
    pub async fn create_project(&self, request: CreateProjectRequest) -> AppResult<ProjectInfo> {
        self.crud_ops.create_project(request).await
    }

    /// Get project by ID
    pub async fn get_project_by_id(&self, project_id: Uuid) -> AppResult<ProjectInfo> {
        self.crud_ops.get_project_by_id(project_id).await
    }

    /// Update project
    pub async fn update_project(&self, project_id: Uuid, request: UpdateProjectRequest) -> AppResult<ProjectInfo> {
        self.crud_ops.update_project(project_id, request).await
    }

    /// Delete project
    pub async fn delete_project(&self, project_id: Uuid) -> AppResult<()> {
        self.crud_ops.delete_project(project_id).await
    }

    /// List projects with pagination
    pub async fn list_projects(&self, page: Option<i64>, per_page: Option<i64>) -> AppResult<ProjectListResponse> {
        self.query_ops.list_projects(page, per_page).await
    }

    /// List projects by owner
    pub async fn list_projects_by_owner(&self, owner_id: Uuid, page: Option<i64>, per_page: Option<i64>) -> AppResult<ProjectListResponse> {
        self.query_ops.list_projects_by_owner(owner_id, page, per_page).await
    }
    
    /// Search projects
    pub async fn search_projects(&self, query: &str, page: Option<i64>, per_page: Option<i64>) -> AppResult<ProjectListResponse> {
        let (page, per_page) = ValidationUtils::validate_pagination(page, per_page)?;
        let offset = (page - 1) * per_page;
        
        let mut conn = self.db.get_connection()?;
        
        let search_pattern = format!("%{}%", query);
        
        // Get total count
        let total = projects::table
            .filter(
                projects::name.ilike(&search_pattern)
                    .or(projects::description.ilike(&search_pattern))
            )
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;
        
        // Get projects with additional info
        let projects_with_info = projects::table
            .inner_join(users::table)
            .filter(
                projects::name.ilike(&search_pattern)
                    .or(projects::description.ilike(&search_pattern))
            )
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
            .order(projects::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<ProjectQueryResult>(&mut conn)
            .map_err(AppError::Database)?;
        
        // OPTIMIZED: Get counts for all projects in 2 queries instead of N+1 queries
        use diesel::dsl::count_star;
        use crate::monitoring::metrics::DbQueryTimer;
        
        let _timer = DbQueryTimer::start("/api/projects", "search", "projects");
        
        // Get all project IDs
        let project_ids: Vec<uuid::Uuid> = projects_with_info.iter().map(|p| p.project_id).collect();
        
        // Get job counts for all projects in one query
        let job_counts: Vec<(uuid::Uuid, i64)> = reconciliation_jobs::table
            .filter(reconciliation_jobs::project_id.eq_any(&project_ids))
            .group_by(reconciliation_jobs::project_id)
            .select((reconciliation_jobs::project_id, count_star()))
            .load::<(uuid::Uuid, i64)>(&mut conn)
            .map_err(|e| {
                log::warn!("Failed to load job counts for projects: {}", e);
                AppError::Database(e)
            })?;
        
        // Create lookup map
        let job_count_map: std::collections::HashMap<uuid::Uuid, i64> = 
            job_counts.into_iter().collect();
        
        // Get data source counts for all projects in one query
        let data_source_counts: Vec<(uuid::Uuid, i64)> = data_sources::table
            .filter(data_sources::project_id.eq_any(&project_ids))
            .group_by(data_sources::project_id)
            .select((data_sources::project_id, count_star()))
            .load::<(uuid::Uuid, i64)>(&mut conn)
            .map_err(|e| {
                log::warn!("Failed to load data source counts for projects: {}", e);
                AppError::Database(e)
            })?;
        
        // Create lookup map
        let data_source_count_map: std::collections::HashMap<uuid::Uuid, i64> = 
            data_source_counts.into_iter().collect();
        
        // Build project infos with counts from maps
        let project_infos: Vec<ProjectInfo> = projects_with_info
            .into_iter()
            .map(|result| {
                let job_count = *job_count_map.get(&result.project_id).unwrap_or(&0);
                let data_source_count = *data_source_count_map.get(&result.project_id).unwrap_or(&0);
                
                ProjectInfo {
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
                    last_activity: None,
                }
            })
            .collect();
        
        Ok(ProjectListResponse {
            projects: project_infos,
            total,
            page,
            per_page,
        })
    }
    
    /// Get project statistics
    pub async fn get_project_stats(&self) -> AppResult<ProjectStats> {
        let mut conn = self.db.get_connection()?;
        
        // Get total projects
        let total_projects = projects::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;
        
        // Get projects by status
        let active_projects = projects::table
            .filter(projects::status.eq("active"))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;
        
        let inactive_projects = projects::table
            .filter(projects::status.eq("inactive"))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;
        
        let archived_projects = projects::table
            .filter(projects::status.eq("archived"))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;
        
        // Get total jobs
        let total_jobs = reconciliation_jobs::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;
        
        // Get total data sources
        let total_data_sources = data_sources::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;
        
        // Get recent projects with simplified query
        let recent_projects = projects::table
            .inner_join(users::table)
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
            .order(projects::created_at.desc())
            .limit(5)
            .load::<ProjectQueryResult>(&mut conn)
            .map_err(AppError::Database)?;
        
        // Get counts separately for each project
        let mut recent_project_infos = Vec::new();
        for result in recent_projects {
            let job_count = reconciliation_jobs::table
                .filter(reconciliation_jobs::project_id.eq(result.project_id))
                .count()
                .get_result::<i64>(&mut conn)
                .map_err(AppError::Database)?;
                
            let data_source_count = data_sources::table
                .filter(data_sources::project_id.eq(result.project_id))
                .count()
                .get_result::<i64>(&mut conn)
                .map_err(AppError::Database)?;
            
            recent_project_infos.push(ProjectInfo {
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
                last_activity: None,
            });
        }
        
        Ok(ProjectStats {
            total_projects,
            active_projects,
            inactive_projects,
            archived_projects,
            total_jobs,
            total_data_sources,
            recent_projects: recent_project_infos,
        })
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
    
    /// Get project analytics
    pub async fn get_project_analytics(&self, project_id: Uuid) -> AppResult<ProjectAnalytics> {
        self.analytics_ops.get_project_analytics(project_id).await
    }
    
    /// Get project performance metrics
    pub async fn get_project_performance(&self, project_id: Uuid) -> AppResult<ProjectPerformance> {
        self.analytics_ops.get_project_performance(project_id).await
    }
    
    /// Get project collaborators
    pub async fn get_project_collaborators(&self, project_id: Uuid) -> AppResult<Vec<ProjectCollaborator>> {
        self.analytics_ops.get_project_collaborators(project_id).await
    }
    
    /// Get project activity timeline
    pub async fn get_project_timeline(&self, project_id: Uuid, limit: Option<i64>) -> AppResult<Vec<ProjectActivity>> {
        self.analytics_ops.get_project_timeline(project_id, limit).await
    }
    
    /// Get project statistics summary
    pub async fn get_project_statistics(&self) -> AppResult<ProjectStatistics> {
        let mut conn = self.db.get_connection()?;
        
        // Get total projects count
        let total_projects = projects::table
            .count()
            .get_result::<i64>(&mut conn)?;
        
        // Get active projects count
        let active_projects = projects::table
            .filter(projects::status.eq("Active"))
            .count()
            .get_result::<i64>(&mut conn)?;
        
        // Get completed projects count
        let completed_projects = projects::table
            .filter(projects::status.eq("Completed"))
            .count()
            .get_result::<i64>(&mut conn)?;
        
        Ok(ProjectStatistics {
            total_projects: total_projects as u32,
            active_projects: active_projects as u32,
            completed_projects: completed_projects as u32,
            archived_projects: (total_projects - active_projects - completed_projects) as u32,
        })
    }
}


