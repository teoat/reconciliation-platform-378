//! Project service query operations
//!
//! This module contains operations for listing, searching, and querying projects
//! with pagination and filtering support.

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::{data_sources, reconciliation_jobs};
use crate::models::schema::{projects, users};
use crate::services::auth::ValidationUtils;
use crate::services::project_models::{
    ProjectInfo, ProjectListResponse, ProjectQueryResult, ProjectStats,
};
use diesel::prelude::*;
use uuid::Uuid;

/// Project service query operations
pub struct ProjectQueryOps {
    db: Database,
}

impl ProjectQueryOps {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    /// List projects with pagination
    pub async fn list_projects(
        &self,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<ProjectListResponse> {
        let (page, per_page) = ValidationUtils::validate_pagination(page, per_page)?;
        let offset = (page - 1) * per_page;

        let mut conn = self.db.get_connection()?;

        // Get total count
        let total = projects::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;

        // Get projects with owner info
        let projects_with_owner = projects::table
            .inner_join(users::table.on(projects::owner_id.eq(users::id)))
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

        // Get counts for all projects in bulk to avoid N+1 queries
        use diesel::dsl::count_star;
        let project_ids: Vec<uuid::Uuid> =
            projects_with_owner.iter().map(|p| p.project_id).collect();

        let job_counts: Vec<(uuid::Uuid, i64)> = reconciliation_jobs::table
            .filter(reconciliation_jobs::project_id.eq_any(&project_ids))
            .group_by(reconciliation_jobs::project_id)
            .select((reconciliation_jobs::project_id, count_star()))
            .load::<(uuid::Uuid, i64)>(&mut conn)
            .map_err(AppError::Database)?;

        let job_count_map: std::collections::HashMap<uuid::Uuid, i64> =
            job_counts.into_iter().collect();

        let data_source_counts: Vec<(uuid::Uuid, i64)> = data_sources::table
            .filter(data_sources::project_id.eq_any(&project_ids))
            .group_by(data_sources::project_id)
            .select((data_sources::project_id, count_star()))
            .load::<(uuid::Uuid, i64)>(&mut conn)
            .map_err(AppError::Database)?;

        let data_source_count_map: std::collections::HashMap<uuid::Uuid, i64> =
            data_source_counts.into_iter().collect();

        let project_infos: Vec<ProjectInfo> = projects_with_owner
            .into_iter()
            .map(|result| ProjectInfo {
                id: result.project_id,
                name: result.project_name,
                description: result.project_description,
                owner_id: result.owner_id,
                owner_email: result.owner_email,
                status: result.project_status,
                settings: Some(result.settings),
                created_at: result.created_at,
                updated_at: result.updated_at,
                job_count: job_count_map.get(&result.project_id).copied().unwrap_or(0),
                data_source_count: data_source_count_map
                    .get(&result.project_id)
                    .copied()
                    .unwrap_or(0),
                last_activity: None,
            })
            .collect();

        Ok(ProjectListResponse {
            projects: project_infos,
            total,
            page,
            per_page,
        })
    }

    /// List projects by owner
    pub async fn list_projects_by_owner(
        &self,
        owner_id: Uuid,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<ProjectListResponse> {
        let (page, per_page) = ValidationUtils::validate_pagination(page, per_page)?;
        let offset = (page - 1) * per_page;

        let mut conn = self.db.get_connection()?;

        // Get total count
        let total = projects::table
            .filter(projects::owner_id.eq(owner_id))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;

        // Get projects with owner info
        let projects_with_owner = projects::table
            .inner_join(users::table)
            .filter(projects::owner_id.eq(owner_id))
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

        // Bulk counts to avoid N+1
        use diesel::dsl::count_star;
        let project_ids: Vec<uuid::Uuid> =
            projects_with_owner.iter().map(|p| p.project_id).collect();

        let job_counts: Vec<(uuid::Uuid, i64)> = reconciliation_jobs::table
            .filter(reconciliation_jobs::project_id.eq_any(&project_ids))
            .group_by(reconciliation_jobs::project_id)
            .select((reconciliation_jobs::project_id, count_star()))
            .load::<(uuid::Uuid, i64)>(&mut conn)
            .map_err(|e| {
                log::warn!("Failed to load job counts for projects: {}", e);
                AppError::Database(e)
            })?;
        let job_count_map: std::collections::HashMap<uuid::Uuid, i64> =
            job_counts.into_iter().collect();

        let data_source_counts: Vec<(uuid::Uuid, i64)> = data_sources::table
            .filter(data_sources::project_id.eq_any(&project_ids))
            .group_by(data_sources::project_id)
            .select((data_sources::project_id, count_star()))
            .load::<(uuid::Uuid, i64)>(&mut conn)
            .map_err(|e| {
                log::warn!("Failed to load data source counts for projects: {}", e);
                AppError::Database(e)
            })?;
        let data_source_count_map: std::collections::HashMap<uuid::Uuid, i64> =
            data_source_counts.into_iter().collect();

        let project_infos = projects_with_owner
            .into_iter()
            .map(|result| ProjectInfo {
                id: result.project_id,
                name: result.project_name,
                description: result.project_description,
                owner_id: result.owner_id,
                owner_email: result.owner_email,
                status: result.project_status,
                settings: Some(result.settings),
                created_at: result.created_at,
                updated_at: result.updated_at,
                job_count: job_count_map.get(&result.project_id).copied().unwrap_or(0),
                data_source_count: data_source_count_map
                    .get(&result.project_id)
                    .copied()
                    .unwrap_or(0),
                last_activity: None,
            })
            .collect();

        Ok(ProjectListResponse {
            projects: project_infos,
            total,
            page,
            per_page,
        })
    }

    /// Search projects
    pub async fn search_projects(
        &self,
        query: &str,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<ProjectListResponse> {
        let (page, per_page) = ValidationUtils::validate_pagination(page, per_page)?;
        let offset = (page - 1) * per_page;

        let mut conn = self.db.get_connection()?;

        let search_pattern = format!("%{}%", query);

        // Get total count
        let total = projects::table
            .filter(
                projects::name
                    .ilike(&search_pattern)
                    .or(projects::description.ilike(&search_pattern)),
            )
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;

        // Get projects with additional info
        let projects_with_info = projects::table
            .inner_join(users::table.on(projects::owner_id.eq(users::id)))
            .filter(
                projects::name
                    .ilike(&search_pattern)
                    .or(projects::description.ilike(&search_pattern)),
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
        use crate::monitoring::metrics::DbQueryTimer;
        use diesel::dsl::count_star;

        let _timer = DbQueryTimer::start("/api/projects", "search", "projects");

        // Get all project IDs
        let project_ids: Vec<uuid::Uuid> =
            projects_with_info.iter().map(|p| p.project_id).collect();

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
                let data_source_count =
                    *data_source_count_map.get(&result.project_id).unwrap_or(&0);

                ProjectInfo {
                    id: result.project_id,
                    name: result.project_name,
                    description: result.project_description,
                    owner_id: result.owner_id,
                    owner_email: result.owner_email,
                    status: result.project_status,
                    settings: Some(result.settings),
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
            .inner_join(users::table.on(projects::owner_id.eq(users::id)))
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
                settings: Some(result.settings),
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
}
