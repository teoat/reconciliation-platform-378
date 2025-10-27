//! Analytics service for the Reconciliation Backend
//! 
//! This module provides analytics and reporting functionality including
//! data collection, metrics calculation, and dashboard data generation.

use diesel::prelude::*;
use diesel::sql_types::Json;
use diesel::pg::sql_types::Jsonb;
use crate::models::{JsonValue, User};
use uuid::Uuid;
use chrono::{DateTime, Utc, Duration};
use serde::{Serialize, Deserialize};

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::services::cache::MultiLevelCache;
use crate::models::schema::{
    users, projects, reconciliation_jobs, data_sources, reconciliation_results, audit_logs,
};
use std::sync::Arc;
use std::time::Duration as StdDuration;

/// Analytics service
pub struct AnalyticsService {
    db: Database,
    cache: Arc<MultiLevelCache>,
}

/// Dashboard data
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardData {
    pub total_users: i64,
    pub total_projects: i64,
    pub total_reconciliation_jobs: i64,
    pub total_data_sources: i64,
    pub active_jobs: i64,
    pub completed_jobs: i64,
    pub failed_jobs: i64,
    pub total_matches: i64,
    pub total_unmatched: i64,
    pub recent_activity: Vec<ActivityItem>,
    pub performance_metrics: PerformanceMetrics,
}

/// Activity item
#[derive(Debug, Serialize, Deserialize, Clone, Queryable)]
pub struct ActivityItemQueryResult {
    pub id: Uuid,
    pub action: String,
    pub resource_type: String,
    pub user_email: Option<String>,
    pub created_at: DateTime<Utc>,
    pub old_values: Option<JsonValue>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ActivityItem {
    pub id: Uuid,
    pub action: String,
    pub resource_type: String,
    pub user_email: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub details: Option<JsonValue>,
}

/// Performance metrics
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PerformanceMetrics {
    pub average_processing_time_ms: f64,
    pub total_processing_time_ms: i64,
    pub average_confidence_score: f64,
    pub match_rate: f64,
    pub throughput_per_hour: f64,
}

/// Project statistics
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectStats {
    pub project_id: Uuid,
    pub project_name: String,
    pub total_jobs: i64,
    pub completed_jobs: i64,
    pub failed_jobs: i64,
    pub total_data_sources: i64,
    pub total_matches: i64,
    pub total_unmatched: i64,
    pub average_confidence_score: f64,
    pub last_activity: Option<DateTime<Utc>>,
}

/// User activity statistics
#[derive(Debug, Serialize)]
pub struct UserActivityStats {
    pub user_id: Uuid,
    pub user_email: String,
    pub total_actions: i64,
    pub projects_created: i64,
    pub jobs_created: i64,
    pub files_uploaded: i64,
    pub last_activity: Option<DateTime<Utc>>,
    pub activity_by_day: Vec<DailyActivity>,
}

/// Daily activity
#[derive(Debug, Serialize)]
pub struct DailyActivity {
    pub date: String,
    pub actions: i64,
}

/// Reconciliation statistics
#[derive(Debug, Serialize)]
pub struct ReconciliationStats {
    pub total_jobs: i64,
    pub completed_jobs: i64,
    pub failed_jobs: i64,
    pub pending_jobs: i64,
    pub running_jobs: i64,
    pub total_records_processed: i64,
    pub total_matches: i64,
    pub total_unmatched: i64,
    pub average_confidence_score: f64,
    pub average_processing_time_ms: f64,
    pub jobs_by_status: Vec<StatusCount>,
    pub jobs_by_month: Vec<MonthlyJobCount>,
}

/// Status count
#[derive(Debug, Serialize)]
pub struct StatusCount {
    pub status: String,
    pub count: i64,
}

/// Monthly job count
#[derive(Debug, Serialize)]
pub struct MonthlyJobCount {
    pub month: String,
    pub count: i64,
}

impl AnalyticsService {
    pub fn new(db: Database) -> Self {
        // Initialize cache with Redis URL from environment
        let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());
        let cache = Arc::new(MultiLevelCache::new(&redis_url).unwrap_or_else(|_| {
            // Fallback to in-memory only cache if Redis fails
            MultiLevelCache::new("redis://localhost:6379").unwrap()
        }));
        
        Self { db, cache }
    }
    
    /// Get dashboard data
    pub async fn get_dashboard_data(&self) -> AppResult<DashboardData> {
        // Check cache first
        let cache_key = "dashboard_data";
        if let Some(cached_data) = self.cache.get::<DashboardData>(cache_key).await? {
            return Ok(cached_data);
        }
        
        let mut conn = self.db.get_connection()?;
        
        // Get basic counts
        let total_users = users::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let total_projects = projects::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let total_reconciliation_jobs = reconciliation_jobs::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let total_data_sources = data_sources::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get job status counts
        let active_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("running"))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let completed_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("completed"))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let failed_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("failed"))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get match counts
        let total_matches = reconciliation_results::table
            .filter(reconciliation_results::confidence_score.ge(diesel::dsl::sql("0.8")))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let total_unmatched = reconciliation_results::table
            .filter(reconciliation_results::confidence_score.lt(diesel::dsl::sql("0.8")))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get recent activity
        let recent_activity = self.get_recent_activity(&mut conn).await?;
        
        // Get performance metrics
        let performance_metrics = self.get_performance_metrics(&mut conn).await?;
        
        // Create dashboard data
        let dashboard_data = DashboardData {
            total_users,
            total_projects,
            total_reconciliation_jobs,
            total_data_sources,
            active_jobs,
            completed_jobs,
            failed_jobs,
            total_matches,
            total_unmatched,
            recent_activity,
            performance_metrics,
        };
        
        // Cache the result for 5 minutes
        self.cache.set(cache_key, &dashboard_data, Some(std::time::Duration::from_secs(300))).await?;
        
        Ok(dashboard_data)
    }
    
    /// Get project statistics
    pub async fn get_project_stats(&self, project_id: Uuid) -> AppResult<ProjectStats> {
        // Check cache first
        let cache_key = format!("project_stats_{}", project_id);
        if let Some(cached_stats) = self.cache.get::<ProjectStats>(&cache_key).await? {
            return Ok(cached_stats);
        }
        
        let mut conn = self.db.get_connection()?;
        
        // Get project info
        use crate::models::Project;
        let project = projects::table
            .filter(projects::id.eq(project_id))
            .first::<Project>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let project_name = project.name;
        
        // Get job counts
        let total_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let completed_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .filter(reconciliation_jobs::status.eq("completed"))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let failed_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .filter(reconciliation_jobs::status.eq("failed"))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get data source count
        let total_data_sources = data_sources::table
            .filter(data_sources::project_id.eq(project_id))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get match counts
        let total_matches = reconciliation_results::table
            .inner_join(reconciliation_jobs::table)
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .filter(reconciliation_results::confidence_score.ge(diesel::dsl::sql("0.8")))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let total_unmatched = reconciliation_results::table
            .inner_join(reconciliation_jobs::table)
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .filter(reconciliation_results::confidence_score.lt(diesel::dsl::sql("0.8")))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get average confidence score
        let avg_confidence = reconciliation_results::table
            .inner_join(reconciliation_jobs::table)
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .select(diesel::dsl::sql::<diesel::sql_types::Nullable<diesel::sql_types::Double>>("AVG(confidence_score::float8)"))
            .first::<Option<f64>>(&mut conn)
            .map_err(|e| AppError::Database(e))?
            .unwrap_or(0.0);
        
        // Get last activity
        let last_activity = reconciliation_jobs::table
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .order(reconciliation_jobs::updated_at.desc())
            .select(reconciliation_jobs::updated_at)
            .first::<DateTime<Utc>>(&mut conn)
            .map_err(|e| AppError::Database(e))
            .ok();
        
        // Create project stats
        let project_stats = ProjectStats {
            project_id,
            project_name,
            total_jobs,
            completed_jobs,
            failed_jobs,
            total_data_sources,
            total_matches,
            total_unmatched,
            average_confidence_score: avg_confidence,
            last_activity,
        };
        
        // Cache the result for 10 minutes
        self.cache.set(&cache_key, &project_stats, Some(std::time::Duration::from_secs(600))).await?;
        
        Ok(project_stats)
    }
    
    /// Get user activity statistics
    pub async fn get_user_activity_stats(&self, user_id: Uuid) -> AppResult<UserActivityStats> {
        let mut conn = self.db.get_connection()?;
        
        // Get user info
        let user = users::table
            .filter(users::id.eq(user_id))
            .first::<User>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let user_email = user.email;
        
        // Get total actions
        let total_actions = audit_logs::table
            .filter(audit_logs::user_id.eq(user_id))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get projects created
        let projects_created = projects::table
            .filter(projects::owner_id.eq(user_id))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get jobs created
        let jobs_created = reconciliation_jobs::table
            .inner_join(projects::table)
            .filter(projects::owner_id.eq(user_id))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get files uploaded
        let files_uploaded = data_sources::table
            .inner_join(projects::table)
            .filter(projects::owner_id.eq(user_id))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get last activity
        let last_activity = audit_logs::table
            .filter(audit_logs::user_id.eq(user_id))
            .order(audit_logs::created_at.desc())
            .select(audit_logs::created_at)
            .first::<DateTime<Utc>>(&mut conn)
            .map_err(|e| AppError::Database(e))
            .ok();
        
        // Get activity by day (last 30 days)
        let activity_by_day = self.get_user_daily_activity(user_id, &mut conn).await?;
        
        Ok(UserActivityStats {
            user_id,
            user_email,
            total_actions,
            projects_created,
            jobs_created,
            files_uploaded,
            last_activity,
            activity_by_day,
        })
    }
    
    /// Get reconciliation statistics
    pub async fn get_reconciliation_stats(&self) -> AppResult<ReconciliationStats> {
        let mut conn = self.db.get_connection()?;
        
        // Get basic counts
        let total_jobs = reconciliation_jobs::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let completed_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("completed"))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let failed_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("failed"))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let pending_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("pending"))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let running_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("running"))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get record counts from reconciliation results
        let total_records_processed = reconciliation_results::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let total_matches = reconciliation_results::table
            .filter(reconciliation_results::confidence_score.ge(diesel::dsl::sql("0.8")))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let total_unmatched = reconciliation_results::table
            .filter(reconciliation_results::confidence_score.lt(diesel::dsl::sql("0.8")))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Get average confidence score
        let avg_confidence = reconciliation_results::table
            .select(diesel::dsl::sql::<diesel::sql_types::Nullable<diesel::sql_types::Double>>("AVG(confidence_score::float8)"))
            .first::<Option<f64>>(&mut conn)
            .map_err(|e| AppError::Database(e))?
            .unwrap_or(0.0);
        
        // Get average processing time from completed jobs
        let avg_processing_time = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("completed"))
            .filter(reconciliation_jobs::processing_time_ms.is_not_null())
            .select(diesel::dsl::sql::<diesel::sql_types::Nullable<diesel::sql_types::Double>>("AVG(processing_time_ms)"))
            .first::<Option<f64>>(&mut conn)
            .map_err(|e| AppError::Database(e))?
            .unwrap_or(0.0);
        
        // Get jobs by status
        let jobs_by_status = self.get_jobs_by_status(&mut conn).await?;
        
        // Get jobs by month
        let jobs_by_month = self.get_jobs_by_month(&mut conn).await?;
        
        Ok(ReconciliationStats {
            total_jobs,
            completed_jobs,
            failed_jobs,
            pending_jobs,
            running_jobs,
            total_records_processed,
            total_matches,
            total_unmatched,
            average_confidence_score: avg_confidence,
            average_processing_time_ms: avg_processing_time,
            jobs_by_status,
            jobs_by_month,
        })
    }
    
    /// Get recent activity
    async fn get_recent_activity(&self, conn: &mut diesel::PgConnection) -> AppResult<Vec<ActivityItem>> {
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
            .map_err(|e| AppError::Database(e))?;
        
        let activity_items: Vec<ActivityItem> = activities
            .into_iter()
            .map(|result| {
                ActivityItem {
                    id: result.id,
                    action: result.action,
                    resource_type: result.resource_type,
                    user_email: result.user_email,
                    timestamp: result.created_at,
                    details: result.old_values,
                }
            })
            .collect();
        
        Ok(activity_items)
    }
    
    /// Get performance metrics
    async fn get_performance_metrics(&self, conn: &mut diesel::PgConnection) -> AppResult<PerformanceMetrics> {
        // Get average processing time from completed jobs
        let avg_processing_time = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("completed"))
            .filter(reconciliation_jobs::processing_time_ms.is_not_null())
            .select(diesel::dsl::sql::<diesel::sql_types::Nullable<diesel::sql_types::Double>>("AVG(processing_time_ms)"))
            .first::<Option<f64>>(conn)
            .map_err(|e| AppError::Database(e))?
            .unwrap_or(0.0);
        
        // Get total processing time
        let total_processing_time = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("completed"))
            .filter(reconciliation_jobs::processing_time_ms.is_not_null())
            .select(diesel::dsl::sql::<diesel::sql_types::Nullable<diesel::sql_types::BigInt>>("SUM(processing_time_ms)"))
            .first::<Option<i64>>(conn)
            .map_err(|e| AppError::Database(e))?
            .unwrap_or(0);
        
        // Get average confidence score
        let avg_confidence = reconciliation_results::table
            .select(diesel::dsl::sql::<diesel::sql_types::Nullable<diesel::sql_types::Double>>("AVG(confidence_score::float8)"))
            .first::<Option<f64>>(conn)
            .map_err(|e| AppError::Database(e))?
            .unwrap_or(0.0);
        
        // Get match rate
        let total_results = reconciliation_results::table
            .count()
            .get_result::<i64>(conn)
            .map_err(|e| AppError::Database(e))?;
        
        let matches = reconciliation_results::table
            .filter(reconciliation_results::confidence_score.ge(diesel::dsl::sql("0.8")))
            .count()
            .get_result::<i64>(conn)
            .map_err(|e| AppError::Database(e))?;
        
        let match_rate = if total_results > 0 {
            matches as f64 / total_results as f64
        } else {
            0.0
        };
        
        // Calculate throughput per hour
        let completed_jobs = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("completed"))
            .count()
            .get_result::<i64>(conn)
            .map_err(|e| AppError::Database(e))?;
        
        let throughput_per_hour = if completed_jobs > 0 {
            completed_jobs as f64 / 24.0 // Assuming 24 hours
        } else {
            0.0
        };
        
        Ok(PerformanceMetrics {
            average_processing_time_ms: avg_processing_time,
            total_processing_time_ms: total_processing_time,
            average_confidence_score: avg_confidence,
            match_rate,
            throughput_per_hour,
        })
    }
    
    /// Get user daily activity
    async fn get_user_daily_activity(&self, user_id: Uuid, conn: &mut diesel::PgConnection) -> AppResult<Vec<DailyActivity>> {
        // Get activity for last 30 days
        let thirty_days_ago = Utc::now() - Duration::days(30);
        
        let activities = audit_logs::table
            .filter(audit_logs::user_id.eq(user_id))
            .filter(audit_logs::created_at.ge(thirty_days_ago))
            .select(diesel::dsl::sql::<diesel::sql_types::Date>("DATE(created_at)"))
            .load::<chrono::NaiveDate>(conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Group by date and count
        let mut activity_map: std::collections::HashMap<String, i64> = std::collections::HashMap::new();
        
        for date in activities {
            let date_str = date.format("%Y-%m-%d").to_string();
            *activity_map.entry(date_str).or_insert(0) += 1;
        }
        
        // Convert to vector
        let mut daily_activities: Vec<DailyActivity> = activity_map
            .into_iter()
            .map(|(date, actions)| DailyActivity { date, actions })
            .collect();
        
        daily_activities.sort_by(|a, b| a.date.cmp(&b.date));
        
        Ok(daily_activities)
    }
    
    /// Get jobs by status
    async fn get_jobs_by_status(&self, conn: &mut diesel::PgConnection) -> AppResult<Vec<StatusCount>> {
        let status_counts = reconciliation_jobs::table
            .group_by(reconciliation_jobs::status)
            .select((reconciliation_jobs::status, diesel::dsl::count(reconciliation_jobs::id)))
            .load::<(String, i64)>(conn)
            .map_err(|e| AppError::Database(e))?;
        
        let status_counts = status_counts
            .into_iter()
            .map(|(status, count)| StatusCount { status, count })
            .collect();
        
        Ok(status_counts)
    }
    
    /// Get jobs by month
    async fn get_jobs_by_month(&self, conn: &mut diesel::PgConnection) -> AppResult<Vec<MonthlyJobCount>> {
        // Get jobs created in the last 12 months
        let twelve_months_ago = Utc::now() - Duration::days(365);
        
        let monthly_counts = reconciliation_jobs::table
            .filter(reconciliation_jobs::created_at.ge(twelve_months_ago))
            .select(diesel::dsl::sql::<diesel::sql_types::Text>("TO_CHAR(created_at, 'YYYY-MM')"))
            .load::<String>(conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Group by month and count
        let mut month_map: std::collections::HashMap<String, i64> = std::collections::HashMap::new();
        
        for month in monthly_counts {
            *month_map.entry(month).or_insert(0) += 1;
        }
        
        // Convert to vector and sort
        let mut monthly_job_counts: Vec<MonthlyJobCount> = month_map
            .into_iter()
            .map(|(month, count)| MonthlyJobCount { month, count })
            .collect();
        
        monthly_job_counts.sort_by(|a, b| a.month.cmp(&b.month));
        
        Ok(monthly_job_counts)
    }
}
