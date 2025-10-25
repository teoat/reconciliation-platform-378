//! Project service for the Reconciliation Backend
//! 
//! This module provides project management functionality including CRUD operations,
//! project validation, and project-related business logic.

use diesel::prelude::*;
use diesel::sql_types::Jsonb;
use diesel::{QueryDsl, ExpressionMethods, RunQueryDsl};
use uuid::Uuid;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use diesel::sql_types::Json;
use crate::services::auth::ValidationUtils;

use crate::database::{Database, utils::with_transaction};
use crate::errors::{AppError, AppResult};
use crate::models::{
    Project, NewProject, UpdateProject, ProjectStatus,
    schema::{projects, users, reconciliation_jobs, data_sources},
};
use crate::utils::validation;

/// Project service
pub struct ProjectService {
    db: Database,
}

/// Project creation request
#[derive(Debug, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: Option<String>,
    pub owner_id: Uuid,
    pub status: Option<String>,
    pub settings: Option<serde_json::Value>,
}

/// Project update request
#[derive(Debug, Deserialize)]
pub struct UpdateProjectRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub settings: Option<serde_json::Value>,
}

/// Project list response
#[derive(Debug, Serialize)]
pub struct ProjectListResponse {
    pub projects: Vec<ProjectInfo>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
}

/// Project information for responses
#[derive(Debug, Serialize)]
pub struct ProjectInfo {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub owner_id: Uuid,
    pub owner_email: String,
    pub status: String,
    pub settings: Option<serde_json::Value>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub job_count: i64,
    pub data_source_count: i64,
    pub last_activity: Option<chrono::DateTime<chrono::Utc>>,
}

/// Project statistics
#[derive(Debug, Serialize)]
pub struct ProjectStats {
    pub total_projects: i64,
    pub active_projects: i64,
    pub inactive_projects: i64,
    pub archived_projects: i64,
    pub total_jobs: i64,
    pub total_data_sources: i64,
    pub recent_projects: Vec<ProjectInfo>,
}

impl ProjectService {
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
            .map_err(|e| AppError::Database(e))?;
        
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
            id: project_id,
            name: request.name.trim().to_string(),
            description: request.description.map(|d| d.trim().to_string()),
            owner_id: request.owner_id,
            status: status_enum.to_string(),
            settings: request.settings,
        };
        
        with_transaction(&self.db, |tx| {
            diesel::insert_into(projects::table)
                .values(&new_project)
                .execute(tx.connection())
                .map_err(|e| AppError::Database(e))?;
            
            Ok(())
        })?;
        
        // Get created project with additional info
        self.get_project_by_id(project_id).await
    }
    
    /// Get project by ID
    pub async fn get_project_by_id(&self, project_id: Uuid) -> AppResult<ProjectInfo> {
        let mut conn = self.db.get_connection()?;
        
        // Get project with owner info
        let (project, owner_email) = projects::table
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
            .first::<(Uuid, String, Option<String>, Uuid, String, Option<serde_json::Value>, chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>, String)>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get job count
        let job_count = reconciliation_jobs::table
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get data source count
        let data_source_count = data_sources::table
            .filter(data_sources::project_id.eq(project_id))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get last activity
        let last_activity = reconciliation_jobs::table
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .order(reconciliation_jobs::updated_at.desc())
            .select(reconciliation_jobs::updated_at)
            .first::<Option<chrono::DateTime<chrono::Utc>>>(&mut conn)
            .map_err(|e| AppError::Database(e))?
            .flatten();
        
        Ok(ProjectInfo {
            id: project.0,
            name: project.1,
            description: project.2,
            owner_id: project.3,
            owner_email,
            status: project.4,
            settings: project.5,
            created_at: project.6,
            updated_at: project.7,
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
            .map_err(|e| AppError::Database(e))?;
        
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
        };
        
        // Update project
        diesel::update(projects::table.filter(projects::id.eq(project_id)))
            .set(&update_data)
            .execute(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
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
            .map_err(|e| AppError::Database(e))?;
        
        if count == 0 {
            return Err(AppError::NotFound("Project not found".to_string()));
        }
        
        // Delete project (cascade will handle related records)
        diesel::delete(projects::table.filter(projects::id.eq(project_id)))
            .execute(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        Ok(())
    }
    
    /// List projects with pagination
    pub async fn list_projects(&self, page: Option<i64>, per_page: Option<i64>) -> AppResult<ProjectListResponse> {
        let (page, per_page) = ValidationUtils::validate_pagination(page, per_page)?;
        let offset = (page - 1) * per_page;
        
        let mut conn = self.db.get_connection()?;
        
        // Get total count
        let total = projects::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get projects with additional info
        let projects_with_info = projects::table
            .inner_join(users::table)
            .left_join(reconciliation_jobs::table)
            .left_join(data_sources::table)
            .group_by(projects::id)
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
                diesel::dsl::count(reconciliation_jobs::id),
                diesel::dsl::count(data_sources::id),
            ))
            .order(projects::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<(Uuid, String, Option<String>, Uuid, String, Option<serde_json::Value>, chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>, String, i64, i64)>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let project_infos = projects_with_info
            .into_iter()
            .map(|(id, name, description, owner_id, status, settings, created_at, updated_at, owner_email, job_count, data_source_count)| {
                ProjectInfo {
                    id,
                    name,
                    description,
                    owner_id,
                    owner_email,
                    status,
                    settings,
                    created_at,
                    updated_at,
                    job_count,
                    data_source_count,
                    last_activity: None, // Would need additional query for this
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
    
    /// List projects by owner
    pub async fn list_projects_by_owner(&self, owner_id: Uuid, page: Option<i64>, per_page: Option<i64>) -> AppResult<ProjectListResponse> {
        let (page, per_page) = ValidationUtils::validate_pagination(page, per_page)?;
        let offset = (page - 1) * per_page;
        
        let mut conn = self.db.get_connection()?;
        
        // Get total count
        let total = projects::table
            .filter(projects::owner_id.eq(owner_id))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
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
            .load::<(Uuid, String, Option<String>, Uuid, String, Option<Json<serde_json::Value>>, chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>, String)>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let project_infos = projects_with_owner
            .into_iter()
            .map(|(id, name, description, owner_id, status, settings, created_at, updated_at, owner_email)| {
                // Get job count for this project
                let job_count = reconciliation_jobs::table
                    .filter(reconciliation_jobs::project_id.eq(id))
                    .count()
                    .get_result::<i64>(&mut conn)
                    .unwrap_or(0);
                
                // Get data source count for this project
                let data_source_count = data_sources::table
                    .filter(data_sources::project_id.eq(id))
                    .count()
                    .get_result::<i64>(&mut conn)
                    .unwrap_or(0);
                
                ProjectInfo {
                    id,
                    name,
                    description,
                    owner_id,
                    owner_email,
                    status,
                    settings,
                    created_at,
                    updated_at,
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
            .map_err(|e| AppError::Database(e))?;
        
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
            .load::<(Uuid, String, Option<String>, Uuid, String, Option<Jsonb>, chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>, String)>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let project_infos = projects_with_info
            .into_iter()
            .map(|(id, name, description, owner_id, status, settings, created_at, updated_at, owner_email)| {
                // Get counts separately for each project
                let job_count = reconciliation_jobs::table
                    .filter(reconciliation_jobs::project_id.eq(id))
                    .count()
                    .get_result::<i64>(&mut conn)
                    .map_err(|e| AppError::Database(e))
                    .unwrap_or(0);
                    
                let data_source_count = data_sources::table
                    .filter(data_sources::project_id.eq(id))
                    .count()
                    .get_result::<i64>(&mut conn)
                    .map_err(|e| AppError::Database(e))
                    .unwrap_or(0);

                ProjectInfo {
                    id,
                    name,
                    description,
                    owner_id,
                    owner_email,
                    status,
                    settings: settings.map(|j| serde_json::Value::Null), // TODO: Fix Jsonb conversion
                    created_at,
                    updated_at,
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
            .map_err(|e| AppError::Database(e))?;
        
        // Get projects by status
        let active_projects = projects::table
            .filter(projects::status.eq("active"))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let inactive_projects = projects::table
            .filter(projects::status.eq("inactive"))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let archived_projects = projects::table
            .filter(projects::status.eq("archived"))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get total jobs
        let total_jobs = reconciliation_jobs::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get total data sources
        let total_data_sources = data_sources::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
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
            .load::<(Uuid, String, Option<String>, Uuid, String, Option<Json<serde_json::Value>>, chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>, String)>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get counts separately for each project
        let mut recent_project_infos = Vec::new();
        for (id, name, description, owner_id, status, settings, created_at, updated_at, owner_email) in recent_projects {
            let job_count = reconciliation_jobs::table
                .filter(reconciliation_jobs::project_id.eq(id))
                .count()
                .get_result::<i64>(&mut conn)
                .map_err(|e| AppError::Database(e))?;
                
            let data_source_count = data_sources::table
                .filter(data_sources::project_id.eq(id))
                .count()
                .get_result::<i64>(&mut conn)
                .map_err(|e| AppError::Database(e))?;
            
            recent_project_infos.push(ProjectInfo {
                id,
                name,
                description,
                owner_id,
                owner_email,
                status,
                settings,
                created_at,
                updated_at,
                job_count: job_count,
                data_source_count: data_source_count,
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
        let mut conn = self.db.get_connection()?;
        
        // Get project info
        let project = self.get_project_by_id(project_id).await?;
        
        // Get reconciliation job statistics
        let job_stats = diesel::sql_query(
            "SELECT 
                COUNT(*) as total_jobs,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs,
                COUNT(CASE WHEN status = 'running' THEN 1 END) as running_jobs,
                AVG(CASE WHEN status = 'completed' THEN EXTRACT(EPOCH FROM (updated_at - created_at)) END) as avg_duration_seconds
             FROM reconciliation_jobs 
             WHERE project_id = $1"
        )
        .bind::<diesel::sql_types::Uuid, _>(project_id)
        .get_result::<(i64, i64, i64, i64, Option<f64>)>(&mut conn)
        .map_err(|e| AppError::Database(e))?;
        
        // Get file statistics
        let file_stats = diesel::sql_query(
            "SELECT 
                COUNT(*) as total_files,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_files,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_files,
                SUM(CASE WHEN status = 'completed' THEN size ELSE 0 END) as total_size_bytes
             FROM files 
             WHERE project_id = $1"
        )
        .bind::<diesel::sql_types::Uuid, _>(project_id)
        .get_result::<(i64, i64, i64, Option<i64>)>(&mut conn)
        .map_err(|e| AppError::Database(e))?;
        
        // Get reconciliation record statistics
        let record_stats = diesel::sql_query(
            "SELECT 
                COUNT(*) as total_records,
                COUNT(CASE WHEN status = 'matched' THEN 1 END) as matched_records,
                COUNT(CASE WHEN status = 'unmatched' THEN 1 END) as unmatched_records,
                AVG(confidence_score) as avg_confidence_score
             FROM reconciliation_records 
             WHERE project_id = $1"
        )
        .bind::<diesel::sql_types::Uuid, _>(project_id)
        .get_result::<(i64, i64, i64, Option<f64>)>(&mut conn)
        .map_err(|e| AppError::Database(e))?;
        
        // Get recent activity
        let recent_activity = diesel::sql_query(
            "SELECT 
                'job' as activity_type,
                name as activity_name,
                created_at as activity_time,
                status as activity_status
             FROM reconciliation_jobs 
             WHERE project_id = $1
             UNION ALL
             SELECT 
                'file' as activity_type,
                filename as activity_name,
                created_at as activity_time,
                status as activity_status
             FROM files 
             WHERE project_id = $1
             ORDER BY activity_time DESC 
             LIMIT 10"
        )
        .bind::<diesel::sql_types::Uuid, _>(project_id)
        .load::<(String, String, chrono::DateTime<chrono::Utc>, String)>(&mut conn)
        .map_err(|e| AppError::Database(e))?;
        
        // Get monthly job trends
        let monthly_trends = diesel::sql_query(
            "SELECT 
                DATE_TRUNC('month', created_at) as month,
                COUNT(*) as job_count,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
             FROM reconciliation_jobs 
             WHERE project_id = $1 
             AND created_at >= NOW() - INTERVAL '12 months'
             GROUP BY DATE_TRUNC('month', created_at)
             ORDER BY month"
        )
        .bind::<diesel::sql_types::Uuid, _>(project_id)
        .load::<(chrono::DateTime<chrono::Utc>, i64, i64)>(&mut conn)
        .map_err(|e| AppError::Database(e))?;
        
        Ok(ProjectAnalytics {
            project,
            job_statistics: JobStatistics {
                total_jobs: job_stats.0,
                completed_jobs: job_stats.1,
                failed_jobs: job_stats.2,
                running_jobs: job_stats.3,
                average_duration_seconds: job_stats.4,
                success_rate: if job_stats.0 > 0 {
                    Some(job_stats.1 as f64 / job_stats.0 as f64)
                } else {
                    None
                },
            },
            file_statistics: FileStatistics {
                total_files: file_stats.0,
                completed_files: file_stats.1,
                failed_files: file_stats.2,
                total_size_bytes: file_stats.3.unwrap_or(0),
                success_rate: if file_stats.0 > 0 {
                    Some(file_stats.1 as f64 / file_stats.0 as f64)
                } else {
                    None
                },
            },
            record_statistics: RecordStatistics {
                total_records: record_stats.0,
                matched_records: record_stats.1,
                unmatched_records: record_stats.2,
                average_confidence_score: record_stats.3,
                match_rate: if record_stats.0 > 0 {
                    Some(record_stats.1 as f64 / record_stats.0 as f64)
                } else {
                    None
                },
            },
            recent_activity: recent_activity.into_iter().map(|(activity_type, activity_name, activity_time, activity_status)| {
                RecentActivity {
                    activity_type,
                    activity_name,
                    activity_time,
                    activity_status,
                }
            }).collect(),
            monthly_trends: monthly_trends.into_iter().map(|(month, job_count, completed_count)| {
                MonthlyTrend {
                    month,
                    job_count,
                    completed_count,
                }
            }).collect(),
            generated_at: chrono::Utc::now(),
        })
    }
    
    /// Get project performance metrics
    pub async fn get_project_performance(&self, project_id: Uuid) -> AppResult<ProjectPerformance> {
        let mut conn = self.db.get_connection()?;
        
        // Get performance metrics for the last 30 days
        let performance_data = diesel::sql_query(
            "SELECT 
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_job_duration,
                MIN(EXTRACT(EPOCH FROM (updated_at - created_at))) as min_job_duration,
                MAX(EXTRACT(EPOCH FROM (updated_at - created_at))) as max_job_duration,
                COUNT(*) as total_jobs,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_jobs,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs
             FROM reconciliation_jobs 
             WHERE project_id = $1 
             AND created_at >= NOW() - INTERVAL '30 days'"
        )
        .bind::<diesel::sql_types::Uuid, _>(project_id)
        .get_result::<(Option<f64>, Option<f64>, Option<f64>, i64, i64, i64)>(&mut conn)
        .map_err(|e| AppError::Database(e))?;
        
        // Get file processing performance
        let file_performance = diesel::sql_query(
            "SELECT 
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time,
                SUM(size) as total_size_processed,
                COUNT(*) as total_files_processed
             FROM files 
             WHERE project_id = $1 
             AND created_at >= NOW() - INTERVAL '30 days'
             AND status = 'completed'"
        )
        .bind::<diesel::sql_types::Uuid, _>(project_id)
        .get_result::<(Option<f64>, Option<i64>, i64)>(&mut conn)
        .map_err(|e| AppError::Database(e))?;
        
        Ok(ProjectPerformance {
            job_performance: JobPerformance {
                average_duration_seconds: performance_data.0,
                min_duration_seconds: performance_data.1,
                max_duration_seconds: performance_data.2,
                total_jobs: performance_data.3,
                successful_jobs: performance_data.4,
                failed_jobs: performance_data.5,
                success_rate: if performance_data.3 > 0 {
                    Some(performance_data.4 as f64 / performance_data.3 as f64)
                } else {
                    None
                },
            },
            file_performance: FilePerformance {
                average_processing_time_seconds: file_performance.0,
                total_size_processed_bytes: file_performance.1.unwrap_or(0),
                total_files_processed: file_performance.2,
                average_file_size_bytes: if file_performance.2 > 0 {
                    Some(file_performance.1.unwrap_or(0) as f64 / file_performance.2 as f64)
                } else {
                    None
                },
            },
            generated_at: chrono::Utc::now(),
        })
    }
    
    /// Get project collaborators
    pub async fn get_project_collaborators(&self, project_id: Uuid) -> AppResult<Vec<ProjectCollaborator>> {
        let mut conn = self.db.get_connection()?;
        
        // Get project collaborators (users who have access to the project)
        let collaborators = diesel::sql_query(
            "SELECT DISTINCT
                u.id,
                u.email,
                u.first_name,
                u.last_name,
                u.role,
                u.is_active,
                u.last_login_at,
                COUNT(rj.id) as job_count,
                MAX(rj.created_at) as last_activity
             FROM users u
             LEFT JOIN reconciliation_jobs rj ON rj.created_by = u.id AND rj.project_id = $1
             WHERE u.id IN (
                 SELECT DISTINCT created_by FROM reconciliation_jobs WHERE project_id = $1
                 UNION
                 SELECT DISTINCT owner_id FROM projects WHERE id = $1
             )
             GROUP BY u.id, u.email, u.first_name, u.last_name, u.role, u.is_active, u.last_login_at
             ORDER BY last_activity DESC NULLS LAST"
        )
        .bind::<diesel::sql_types::Uuid, _>(project_id)
        .load::<(Uuid, String, Option<String>, Option<String>, String, bool, Option<chrono::DateTime<chrono::Utc>>, i64, Option<chrono::DateTime<chrono::Utc>>)>(&mut conn)
        .map_err(|e| AppError::Database(e))?;
        
        Ok(collaborators.into_iter().map(|(id, email, first_name, last_name, role, is_active, last_login_at, job_count, last_activity)| {
            ProjectCollaborator {
                id,
                email,
                first_name,
                last_name,
                role,
                is_active,
                last_login_at,
                job_count,
                last_activity,
            }
        }).collect())
    }
    
    /// Get project activity timeline
    pub async fn get_project_timeline(&self, project_id: Uuid, limit: Option<i64>) -> AppResult<Vec<ProjectActivity>> {
        let mut conn = self.db.get_connection()?;
        let limit = limit.unwrap_or(50);
        
        let activities = diesel::sql_query(
            "SELECT 
                'project_created' as activity_type,
                'Project created' as activity_description,
                created_at as activity_time,
                owner_id as user_id,
                NULL as job_id,
                NULL as file_id
             FROM projects 
             WHERE id = $1
             UNION ALL
             SELECT 
                'job_created' as activity_type,
                'Reconciliation job created: ' || name as activity_description,
                created_at as activity_time,
                created_by as user_id,
                id as job_id,
                NULL as file_id
             FROM reconciliation_jobs 
             WHERE project_id = $1
             UNION ALL
             SELECT 
                'job_completed' as activity_type,
                'Reconciliation job completed: ' || name as activity_description,
                updated_at as activity_time,
                created_by as user_id,
                id as job_id,
                NULL as file_id
             FROM reconciliation_jobs 
             WHERE project_id = $1 AND status = 'completed'
             UNION ALL
             SELECT 
                'file_uploaded' as activity_type,
                'File uploaded: ' || filename as activity_description,
                created_at as activity_time,
                uploaded_by as user_id,
                NULL as job_id,
                id as file_id
             FROM files 
             WHERE project_id = $1
             ORDER BY activity_time DESC 
             LIMIT $2"
        )
        .bind::<diesel::sql_types::Uuid, _>(project_id)
        .bind::<diesel::sql_types::BigInt, _>(limit)
        .load::<(String, String, chrono::DateTime<chrono::Utc>, Option<Uuid>, Option<Uuid>, Option<Uuid>)>(&mut conn)
        .map_err(|e| AppError::Database(e))?;
        
        Ok(activities.into_iter().map(|(activity_type, activity_description, activity_time, user_id, job_id, file_id)| {
            ProjectActivity {
                activity_type,
                activity_description,
                activity_time,
                user_id,
                job_id,
                file_id,
            }
        }).collect())
    }
}

// ============================================================================
// ADDITIONAL DATA STRUCTURES FOR PROJECT ANALYTICS
// ============================================================================

#[derive(Debug, Serialize)]
pub struct ProjectAnalytics {
    pub project: ProjectInfo,
    pub job_statistics: JobStatistics,
    pub file_statistics: FileStatistics,
    pub record_statistics: RecordStatistics,
    pub recent_activity: Vec<RecentActivity>,
    pub monthly_trends: Vec<MonthlyTrend>,
    pub generated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct JobStatistics {
    pub total_jobs: i64,
    pub completed_jobs: i64,
    pub failed_jobs: i64,
    pub running_jobs: i64,
    pub average_duration_seconds: Option<f64>,
    pub success_rate: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct FileStatistics {
    pub total_files: i64,
    pub completed_files: i64,
    pub failed_files: i64,
    pub total_size_bytes: i64,
    pub success_rate: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct RecordStatistics {
    pub total_records: i64,
    pub matched_records: i64,
    pub unmatched_records: i64,
    pub average_confidence_score: Option<f64>,
    pub match_rate: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct RecentActivity {
    pub activity_type: String,
    pub activity_name: String,
    pub activity_time: chrono::DateTime<chrono::Utc>,
    pub activity_status: String,
}

#[derive(Debug, Serialize)]
pub struct MonthlyTrend {
    pub month: chrono::DateTime<chrono::Utc>,
    pub job_count: i64,
    pub completed_count: i64,
}

#[derive(Debug, Serialize)]
pub struct ProjectPerformance {
    pub job_performance: JobPerformance,
    pub file_performance: FilePerformance,
    pub generated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct JobPerformance {
    pub average_duration_seconds: Option<f64>,
    pub min_duration_seconds: Option<f64>,
    pub max_duration_seconds: Option<f64>,
    pub total_jobs: i64,
    pub successful_jobs: i64,
    pub failed_jobs: i64,
    pub success_rate: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct FilePerformance {
    pub average_processing_time_seconds: Option<f64>,
    pub total_size_processed_bytes: i64,
    pub total_files_processed: i64,
    pub average_file_size_bytes: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct ProjectCollaborator {
    pub id: Uuid,
    pub email: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub role: String,
    pub is_active: bool,
    pub last_login_at: Option<chrono::DateTime<chrono::Utc>>,
    pub job_count: i64,
    pub last_activity: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Serialize)]
pub struct ProjectActivity {
    pub activity_type: String,
    pub activity_description: String,
    pub activity_time: chrono::DateTime<chrono::Utc>,
    pub user_id: Option<Uuid>,
    pub job_id: Option<Uuid>,
    pub file_id: Option<Uuid>,
}
