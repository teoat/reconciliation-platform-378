//! Project service analytics and performance metrics
//!
//! This module contains analytics, statistics, and performance monitoring
//! functionality for projects.

use diesel::prelude::*;
use uuid::Uuid;
use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::{projects, reconciliation_jobs, data_sources};
use crate::services::project_models::{
    ProjectAnalytics, JobStatistics, FileStatistics, RecordStatistics, RecentActivity,
    MonthlyTrend, ProjectPerformance, JobPerformance, FilePerformance, ProjectCollaborator,
    ActivityData,
};

/// Project service analytics operations
pub struct ProjectAnalyticsOps {
    db: Database,
}

impl ProjectAnalyticsOps {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    /// Get project analytics
    pub async fn get_project_analytics(&self, project_id: Uuid) -> AppResult<ProjectAnalytics> {
        let mut conn = self.db.get_connection()?;

        // Get project info
        let project = self.get_project_info(project_id).await?;

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
        .get_result::<crate::services::project_models::JobStats>(&mut conn)
        .map_err(AppError::Database)?;

        // Get file statistics
        let file_stats = diesel::sql_query(
            "SELECT
                COUNT(*) as total_files,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_files,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_files,
                COALESCE(SUM(file_size), 0) as total_size
             FROM uploaded_files
             WHERE project_id = $1"
        )
        .bind::<diesel::sql_types::Uuid, _>(project_id)
        .get_result::<crate::services::project_models::FileStats>(&mut conn)
        .map_err(AppError::Database)?;

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
        .get_result::<crate::services::project_models::RecordStats>(&mut conn)
        .map_err(AppError::Database)?;

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
              FROM uploaded_files
              WHERE project_id = $1
              ORDER BY activity_time DESC
              LIMIT 10"
        )
        .bind::<diesel::sql_types::Uuid, _>(project_id)
        .load::<RecentActivity>(&mut conn)
        .map_err(AppError::Database)?;

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
        .load::<MonthlyTrend>(&mut conn)
        .map_err(AppError::Database)?;

        Ok(ProjectAnalytics {
            project,
            job_statistics: JobStatistics {
                total_jobs: job_stats.total_jobs,
                completed_jobs: job_stats.completed_jobs,
                failed_jobs: job_stats.failed_jobs,
                running_jobs: job_stats.running_jobs,
                average_duration_seconds: job_stats.avg_duration_seconds,
                success_rate: if job_stats.total_jobs > 0 {
                    Some(job_stats.completed_jobs as f64 / job_stats.total_jobs as f64)
                } else {
                    None
                },
            },
            file_statistics: FileStatistics {
                total_files: file_stats.total_files,
                completed_files: file_stats.completed_files,
                failed_files: file_stats.failed_files,
                total_size_bytes: file_stats.total_size_bytes.unwrap_or(0),
                success_rate: if file_stats.total_files > 0 {
                    Some(file_stats.completed_files as f64 / file_stats.total_files as f64)
                } else {
                    None
                },
            },
            record_statistics: RecordStatistics {
                total_records: record_stats.total_records,
                matched_records: record_stats.matched_records,
                unmatched_records: record_stats.unmatched_records,
                average_confidence_score: record_stats.avg_confidence_score,
                match_rate: if record_stats.total_records > 0 {
                    Some(record_stats.matched_records as f64 / record_stats.total_records as f64)
                } else {
                    None
                },
            },
            recent_activity,
            monthly_trends,
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
        .get_result::<crate::services::project_models::PerformanceData>(&mut conn)
        .map_err(AppError::Database)?;

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
        .get_result::<crate::services::project_models::FilePerformanceData>(&mut conn)
        .map_err(AppError::Database)?;

        Ok(ProjectPerformance {
            job_performance: JobPerformance {
                average_duration_seconds: performance_data.avg_job_duration,
                min_duration_seconds: performance_data.min_job_duration,
                max_duration_seconds: performance_data.max_job_duration,
                total_jobs: performance_data.total_jobs,
                successful_jobs: performance_data.successful_jobs,
                failed_jobs: performance_data.failed_jobs,
                success_rate: if performance_data.total_jobs > 0 {
                    Some(performance_data.successful_jobs as f64 / performance_data.total_jobs as f64)
                } else {
                    None
                },
            },
            file_performance: FilePerformance {
                average_processing_time_seconds: file_performance.avg_processing_time,
                total_size_processed_bytes: file_performance.total_size_processed.unwrap_or(0),
                total_files_processed: file_performance.total_files_processed,
                average_file_size_bytes: if file_performance.total_files_processed > 0 {
                    Some(file_performance.total_size_processed.unwrap_or(0) as f64 / file_performance.total_files_processed as f64)
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
        .load::<crate::services::project_models::CollaboratorData>(&mut conn)
        .map_err(AppError::Database)?;

        Ok(collaborators.into_iter().map(|collaborator| {
            ProjectCollaborator {
                id: collaborator.id,
                email: collaborator.email,
                first_name: collaborator.first_name,
                last_name: collaborator.last_name,
                role: collaborator.role,
                is_active: collaborator.is_active,
                last_login_at: collaborator.last_login_at,
                job_count: collaborator.job_count,
                last_activity: collaborator.last_activity,
            }
        }).collect())
    }

    /// Get project activity timeline
    pub async fn get_project_timeline(&self, project_id: Uuid, limit: Option<i64>) -> AppResult<Vec<crate::services::project_models::ProjectActivity>> {
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
        .load::<ActivityData>(&mut conn)
        .map_err(AppError::Database)?;

        Ok(activities.into_iter().map(|activity| {
            crate::services::project_models::ProjectActivity {
                activity_type: activity.activity_type,
                activity_description: activity.activity_description,
                activity_time: activity.activity_time,
                user_id: activity.user_id,
                job_id: activity.job_id,
                file_id: activity.file_id,
            }
        }).collect())
    }

    /// Helper method to get project info
    async fn get_project_info(&self, project_id: Uuid) -> AppResult<crate::services::project_models::ProjectInfo> {
        use crate::services::project_crud::ProjectCrudOps;
        let crud_ops = ProjectCrudOps::new(self.db.clone());
        crud_ops.get_project_by_id(project_id).await
    }
}