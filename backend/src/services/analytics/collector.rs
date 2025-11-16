//! Data collection for analytics

use diesel::prelude::*;
use uuid::Uuid;
use chrono::{Utc, Duration};
use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::{
    users, projects, audit_logs,
    reconciliation_jobs, data_sources, reconciliation_results,
};

use crate::services::analytics::types::*;

/// Data collector for analytics
pub struct AnalyticsCollector {
    db: Database,
}

impl AnalyticsCollector {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    /// Get basic counts for dashboard
    pub fn get_basic_counts(&self, conn: &mut diesel::PgConnection) -> AppResult<(i64, i64, i64, i64)> {
        let total_users = users::table
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        let total_projects = projects::table
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        let total_reconciliation_jobs = reconciliation_jobs::table
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        let total_data_sources = data_sources::table
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        Ok((total_users, total_projects, total_reconciliation_jobs, total_data_sources))
    }

    /// Get job status counts
    pub fn get_job_status_counts(&self, conn: &mut diesel::PgConnection) -> AppResult<(i64, i64, i64, i64, i64)> {
        let active_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("running"))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        let completed_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("completed"))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        let failed_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("failed"))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        let pending_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("pending"))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        let running_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("running"))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        Ok((active_jobs, completed_jobs, failed_jobs, pending_jobs, running_jobs))
    }

    /// Get match counts
    pub fn get_match_counts(&self, conn: &mut diesel::PgConnection) -> AppResult<(i64, i64)> {
        let total_matches = reconciliation_results::table
            .filter(reconciliation_results::confidence_score.ge(diesel::dsl::sql("0.8")))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        let total_unmatched = reconciliation_results::table
            .filter(reconciliation_results::confidence_score.lt(diesel::dsl::sql("0.8")))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        Ok((total_matches, total_unmatched))
    }

    /// Get recent activity
    pub fn get_recent_activity(&self, conn: &mut diesel::PgConnection) -> AppResult<Vec<ActivityItemQueryResult>> {
        let activities = audit_logs::table
            .left_join(users::table)
            .order(audit_logs::created_at.desc())
            .limit(10)
            .select((
                audit_logs::id,
                audit_logs::action,
                audit_logs::resource_type,
                users::email.nullable(),
                audit_logs::created_at,
                audit_logs::old_values,
            ))
            .load::<ActivityItemQueryResult>(conn)
            .map_err(AppError::Database)?;
        
        Ok(activities)
    }

    /// Get project counts for a specific project
    pub fn get_project_counts(&self, project_id: Uuid, conn: &mut diesel::PgConnection) -> AppResult<(i64, i64, i64, i64)> {
        let total_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        let completed_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .filter(reconciliation_jobs::status.eq("completed"))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        let failed_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .filter(reconciliation_jobs::status.eq("failed"))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        let total_data_sources = data_sources::table
            .filter(data_sources::project_id.eq(project_id))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        Ok((total_jobs, completed_jobs, failed_jobs, total_data_sources))
    }

    /// Get user activity counts
    pub fn get_user_activity_counts(&self, user_id: Uuid, conn: &mut diesel::PgConnection) -> AppResult<(i64, i64, i64, i64)> {
        let total_actions = audit_logs::table
            .filter(audit_logs::user_id.eq(user_id))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        let projects_created = projects::table
            .filter(projects::owner_id.eq(user_id))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        let jobs_created = reconciliation_jobs::table
            .inner_join(projects::table.on(reconciliation_jobs::project_id.eq(projects::id)))
            .filter(projects::owner_id.eq(user_id))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        let files_uploaded = data_sources::table
            .inner_join(projects::table.on(data_sources::project_id.eq(projects::id)))
            .filter(projects::owner_id.eq(user_id))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;
        
        Ok((total_actions, projects_created, jobs_created, files_uploaded))
    }

    /// Get jobs by status
    pub fn get_jobs_by_status_raw(&self, conn: &mut diesel::PgConnection) -> AppResult<Vec<(String, i64)>> {
        let status_counts = reconciliation_jobs::table
            .group_by(reconciliation_jobs::status)
            .select((reconciliation_jobs::status, diesel::dsl::count(reconciliation_jobs::id)))
            .load::<(String, i64)>(conn)
            .map_err(AppError::Database)?;
        
        Ok(status_counts)
    }

    /// Get jobs by month (raw data)
    pub fn get_jobs_by_month_raw(&self, conn: &mut diesel::PgConnection) -> AppResult<Vec<String>> {
        let twelve_months_ago = Utc::now() - Duration::days(365);
        
        let monthly_counts = reconciliation_jobs::table
            .filter(reconciliation_jobs::created_at.ge(twelve_months_ago))
            .select(diesel::dsl::sql::<diesel::sql_types::Text>("TO_CHAR(created_at, 'YYYY-MM')"))
            .load::<String>(conn)
            .map_err(AppError::Database)?;
        
        Ok(monthly_counts)
    }

    /// Get user daily activity dates
    pub fn get_user_daily_activity_dates(&self, user_id: Uuid, conn: &mut diesel::PgConnection) -> AppResult<Vec<chrono::NaiveDate>> {
        let thirty_days_ago = Utc::now() - Duration::days(30);
        
        let activities = audit_logs::table
            .filter(audit_logs::user_id.eq(user_id))
            .filter(audit_logs::created_at.ge(thirty_days_ago))
            .select(diesel::dsl::sql::<diesel::sql_types::Date>("DATE(created_at)"))
            .load::<chrono::NaiveDate>(conn)
            .map_err(AppError::Database)?;
        
        Ok(activities)
    }
}


