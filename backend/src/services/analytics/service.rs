//! Analytics service implementation

use diesel::prelude::*;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::sync::Arc;
use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::services::cache::MultiLevelCache;
use crate::services::resilience::ResilienceManager;
use crate::models::schema::{users, projects, reconciliation_jobs, audit_logs};
use crate::models::Project;
use crate::models::User;

use crate::services::analytics::types::*;
use crate::services::analytics::collector::AnalyticsCollector;
use crate::services::analytics::processor::AnalyticsProcessor;

/// Analytics service
pub struct AnalyticsService {
    db: Database,
    cache: Arc<MultiLevelCache>,
    resilience: Option<Arc<ResilienceManager>>,
    collector: AnalyticsCollector,
    processor: AnalyticsProcessor,
}

impl AnalyticsService {
    pub fn new(db: Database) -> Self {
        // Initialize cache with Redis URL from environment
        let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| {
            log::warn!("REDIS_URL not set, using default localhost for development");
            "redis://localhost:6379".to_string()
        });
        let cache = Arc::new(MultiLevelCache::new(&redis_url).unwrap_or_else(|e| {
            log::error!("Failed to initialize cache with Redis URL {}, falling back to localhost: {}", redis_url, e);
            MultiLevelCache::new("redis://localhost:6379").unwrap_or_else(|fallback_err| {
                log::error!("Failed to initialize fallback cache: {}", fallback_err);
                panic!("Cannot initialize cache: both primary and fallback Redis connections failed");
            })
        }));
        
        let collector = AnalyticsCollector::new(db.clone());
        let processor = AnalyticsProcessor::new(db.clone());
        
        Self {
            db,
            cache,
            resilience: None,
            collector,
            processor,
        }
    }
    
    /// Create analytics service with resilience support
    pub fn new_with_resilience(
        db: Database,
        cache: Arc<MultiLevelCache>,
        resilience: Arc<ResilienceManager>,
    ) -> Self {
        let collector = AnalyticsCollector::new(db.clone());
        let processor = AnalyticsProcessor::new(db.clone());
        
        Self {
            db,
            cache,
            resilience: Some(resilience),
            collector,
            processor,
        }
    }
    
    /// Get dashboard data
    pub async fn get_dashboard_data(&self) -> AppResult<DashboardData> {
        // Check cache first with circuit breaker if available
        let cache_key = "dashboard_data";
        if let Some(ref resilience) = self.resilience {
            if let Some(cached_data) = resilience.execute_cache(async {
                self.cache.get::<DashboardData>(cache_key).await
            }).await? {
                return Ok(cached_data);
            }
        } else {
            if let Some(cached_data) = self.cache.get::<DashboardData>(cache_key).await? {
                return Ok(cached_data);
            }
        }
        
        // Get database connection with circuit breaker if available
        let mut conn = if let Some(ref resilience) = self.resilience {
            resilience.execute_database(async {
                self.db.get_connection_async().await
            }).await?
        } else {
            self.db.get_connection_async().await
            .map_err(|e| AppError::Internal(format!("Database connection error: {}", e)))?
        };
        
        // Get basic counts
        let (total_users, total_projects, total_reconciliation_jobs, total_data_sources) =
            self.collector.get_basic_counts(&mut conn)?;
        
        // Get job status counts
        let (active_jobs, completed_jobs, failed_jobs, _, _) =
            self.collector.get_job_status_counts(&mut conn)?;
        
        // Get match counts
        let (total_matches, total_unmatched) = self.collector.get_match_counts(&mut conn)?;
        
        // Get recent activity
        let activity_results = self.collector.get_recent_activity(&mut conn)?;
        let recent_activity = self.processor.process_recent_activity(activity_results);
        
        // Get performance metrics
        let performance_metrics = self.processor.process_performance_metrics(&mut conn)?;
        
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
        
        // Cache the result for 5 minutes with circuit breaker if available
        if let Some(ref resilience) = self.resilience {
            resilience.execute_cache(async {
                self.cache.set(cache_key, &dashboard_data, Some(std::time::Duration::from_secs(300))).await
            }).await?;
        } else {
            self.cache.set(cache_key, &dashboard_data, Some(std::time::Duration::from_secs(300))).await?;
        }
        
        Ok(dashboard_data)
    }
    
    /// Get project statistics
    pub async fn get_project_stats(&self, project_id: Uuid) -> AppResult<ProjectStats> {
        // Check cache first with circuit breaker if available
        let cache_key = format!("project_stats_{}", project_id);
        if let Some(ref resilience) = self.resilience {
            if let Some(cached_stats) = resilience.execute_cache(async {
                self.cache.get::<ProjectStats>(&cache_key).await
            }).await? {
                return Ok(cached_stats);
            }
        } else {
            if let Some(cached_stats) = self.cache.get::<ProjectStats>(&cache_key).await? {
                return Ok(cached_stats);
            }
        }
        
        // Get database connection with circuit breaker if available
        let mut conn = if let Some(ref resilience) = self.resilience {
            resilience.execute_database(async {
                self.db.get_connection_async().await
            }).await?
        } else {
            self.db.get_connection_async().await
            .map_err(|e| AppError::Internal(format!("Database connection error: {}", e)))?
        };
        
        // Get project info
        let project = projects::table
            .filter(projects::id.eq(project_id))
            .first::<Project>(&mut conn)
            .map_err(AppError::Database)?;
        
        let project_name = project.name;
        
        // Get project counts
        let (total_jobs, completed_jobs, failed_jobs, total_data_sources) =
            self.collector.get_project_counts(project_id, &mut conn)?;
        
        // Get match counts
        let (total_matches, total_unmatched) =
            self.processor.get_project_match_counts(project_id, &mut conn)?;
        
        // Get average confidence score
        let avg_confidence = self.processor.get_project_confidence_score(project_id, &mut conn)?;
        
        // Get last activity
        let last_activity = reconciliation_jobs::table
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .order(reconciliation_jobs::updated_at.desc())
            .select(reconciliation_jobs::updated_at)
            .first::<DateTime<Utc>>(&mut conn)
            .optional()
            .map_err(AppError::Database)?;
        
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
        
        // Cache the result for 10 minutes with circuit breaker if available
        if let Some(ref resilience) = self.resilience {
            resilience.execute_cache(async {
                self.cache.set(&cache_key, &project_stats, Some(std::time::Duration::from_secs(600))).await
            }).await?;
        } else {
            self.cache.set(&cache_key, &project_stats, Some(std::time::Duration::from_secs(600))).await?;
        }
        
        Ok(project_stats)
    }
    
    /// Get user activity statistics
    pub async fn get_user_activity_stats(&self, user_id: Uuid) -> AppResult<UserActivityStats> {
        // Get database connection with circuit breaker if available
        let mut conn = if let Some(ref resilience) = self.resilience {
            resilience.execute_database(async {
                self.db.get_connection_async().await
            }).await?
        } else {
            self.db.get_connection_async().await
            .map_err(|e| AppError::Internal(format!("Database connection error: {}", e)))?
        };
        
        // Get user info
        let user = users::table
            .filter(users::id.eq(user_id))
            .first::<User>(&mut conn)
            .map_err(AppError::Database)?;
        
        let user_email = user.email;
        
        // Get user activity counts
        let (total_actions, projects_created, jobs_created, files_uploaded) =
            self.collector.get_user_activity_counts(user_id, &mut conn)?;
        
        // Get last activity
        let last_activity = audit_logs::table
            .filter(audit_logs::user_id.eq(user_id))
            .order(audit_logs::created_at.desc())
            .select(audit_logs::created_at)
            .first::<DateTime<Utc>>(&mut conn)
            .optional()
            .map_err(AppError::Database)?;
        
        // Get activity by day
        let activity_dates = self.collector.get_user_daily_activity_dates(user_id, &mut conn)?;
        let activity_by_day = self.processor.process_user_daily_activity(activity_dates);
        
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
        // Get database connection with circuit breaker if available
        let mut conn = if let Some(ref resilience) = self.resilience {
            resilience.execute_database(async {
                self.db.get_connection_async().await
            }).await?
        } else {
            self.db.get_connection_async().await
            .map_err(|e| AppError::Internal(format!("Database connection error: {}", e)))?
        };
        
        // Get job status counts
        let (_, completed_jobs, failed_jobs, pending_jobs, running_jobs) =
            self.collector.get_job_status_counts(&mut conn)?;
        
        // Get basic job count
        let total_jobs = reconciliation_jobs::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;
        
        // Get match counts
        let (total_matches, total_unmatched) = self.collector.get_match_counts(&mut conn)?;
        
        // Get reconciliation metrics
        let (total_records_processed, average_confidence_score, average_processing_time_ms) =
            self.processor.get_reconciliation_metrics(&mut conn)?;
        
        // Get jobs by status
        let status_counts_raw = self.collector.get_jobs_by_status_raw(&mut conn)?;
        let jobs_by_status = self.processor.process_jobs_by_status(status_counts_raw);
        
        // Get jobs by month
        let monthly_counts_raw = self.collector.get_jobs_by_month_raw(&mut conn)?;
        let jobs_by_month = self.processor.process_jobs_by_month(monthly_counts_raw);
        
        Ok(ReconciliationStats {
            total_jobs,
            completed_jobs,
            failed_jobs,
            pending_jobs,
            running_jobs,
            total_records_processed,
            total_matches,
            total_unmatched,
            average_confidence_score,
            average_processing_time_ms,
            jobs_by_status,
            jobs_by_month,
        })
    }
}

