//! Data processing and aggregation for analytics

use diesel::prelude::*;
use uuid::Uuid;

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::reconciliation_jobs;
use crate::models::schema::reconciliation_results;

use crate::services::analytics::types::*;

/// Data processor for analytics
pub struct AnalyticsProcessor {
    db: Database,
}

impl AnalyticsProcessor {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    /// Process recent activity from query results
    pub fn process_recent_activity(
        &self,
        activities: Vec<ActivityItemQueryResult>,
    ) -> Vec<ActivityItem> {
        activities
            .into_iter()
            .map(|result| ActivityItem {
                id: result.id,
                action: result.action,
                resource_type: result.resource_type,
                user_email: result.user_email,
                timestamp: result.created_at,
                details: result.old_values,
            })
            .collect()
    }

    /// Process performance metrics
    pub fn process_performance_metrics(
        &self,
        conn: &mut diesel::PgConnection,
    ) -> AppResult<PerformanceMetrics> {
        // Get average processing time from completed jobs
        let avg_processing_time = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("completed"))
            .filter(reconciliation_jobs::processing_time_ms.is_not_null())
            .select(diesel::dsl::sql::<
                diesel::sql_types::Nullable<diesel::sql_types::Double>,
            >("AVG(processing_time_ms)"))
            .first::<Option<f64>>(conn)
            .map_err(AppError::Database)?
            .unwrap_or(0.0);

        // Get total processing time
        let total_processing_time = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("completed"))
            .filter(reconciliation_jobs::processing_time_ms.is_not_null())
            .select(diesel::dsl::sql::<
                diesel::sql_types::Nullable<diesel::sql_types::BigInt>,
            >("SUM(processing_time_ms)"))
            .first::<Option<i64>>(conn)
            .map_err(AppError::Database)?
            .unwrap_or(0);

        // Get average confidence score
        let avg_confidence = reconciliation_results::table
            .select(diesel::dsl::sql::<
                diesel::sql_types::Nullable<diesel::sql_types::Double>,
            >("AVG(confidence_score::float8)"))
            .first::<Option<f64>>(conn)
            .map_err(AppError::Database)?
            .unwrap_or(0.0);

        // Get match rate
        let total_results = reconciliation_results::table
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;

        let matches = reconciliation_results::table
            .filter(reconciliation_results::confidence_score.ge(diesel::dsl::sql("0.8")))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;

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
            .map_err(AppError::Database)?;

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

    /// Process jobs by status
    pub fn process_jobs_by_status(&self, status_counts: Vec<(String, i64)>) -> Vec<StatusCount> {
        status_counts
            .into_iter()
            .map(|(status, count)| StatusCount { status, count })
            .collect()
    }

    /// Process jobs by month
    pub fn process_jobs_by_month(&self, monthly_counts: Vec<String>) -> Vec<MonthlyJobCount> {
        let mut month_map: std::collections::HashMap<String, i64> =
            std::collections::HashMap::new();

        for month in monthly_counts {
            *month_map.entry(month).or_insert(0) += 1;
        }

        let mut monthly_job_counts: Vec<MonthlyJobCount> = month_map
            .into_iter()
            .map(|(month, count)| MonthlyJobCount { month, count })
            .collect();

        monthly_job_counts.sort_by(|a, b| a.month.cmp(&b.month));

        monthly_job_counts
    }

    /// Process user daily activity
    pub fn process_user_daily_activity(&self, dates: Vec<chrono::NaiveDate>) -> Vec<DailyActivity> {
        let mut activity_map: std::collections::HashMap<String, i64> =
            std::collections::HashMap::new();

        for date in dates {
            let date_str = date.format("%Y-%m-%d").to_string();
            *activity_map.entry(date_str).or_insert(0) += 1;
        }

        let mut daily_activities: Vec<DailyActivity> = activity_map
            .into_iter()
            .map(|(date, actions)| DailyActivity { date, actions })
            .collect();

        daily_activities.sort_by(|a, b| a.date.cmp(&b.date));

        daily_activities
    }

    /// Get average confidence score for project
    pub fn get_project_confidence_score(
        &self,
        project_id: Uuid,
        conn: &mut diesel::PgConnection,
    ) -> AppResult<f64> {
        let avg_confidence = reconciliation_results::table
            .inner_join(reconciliation_jobs::table)
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .select(diesel::dsl::sql::<
                diesel::sql_types::Nullable<diesel::sql_types::Double>,
            >("AVG(confidence_score::float8)"))
            .first::<Option<f64>>(conn)
            .map_err(AppError::Database)?
            .unwrap_or(0.0);

        Ok(avg_confidence)
    }

    /// Get match counts for project
    pub fn get_project_match_counts(
        &self,
        project_id: Uuid,
        conn: &mut diesel::PgConnection,
    ) -> AppResult<(i64, i64)> {
        let total_matches = reconciliation_results::table
            .inner_join(reconciliation_jobs::table)
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .filter(reconciliation_results::confidence_score.ge(diesel::dsl::sql("0.8")))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;

        let total_unmatched = reconciliation_results::table
            .inner_join(reconciliation_jobs::table)
            .filter(reconciliation_jobs::project_id.eq(project_id))
            .filter(reconciliation_results::confidence_score.lt(diesel::dsl::sql("0.8")))
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;

        Ok((total_matches, total_unmatched))
    }

    /// Get reconciliation statistics metrics
    pub fn get_reconciliation_metrics(
        &self,
        conn: &mut diesel::PgConnection,
    ) -> AppResult<(i64, f64, f64)> {
        let total_records_processed = reconciliation_results::table
            .count()
            .get_result::<i64>(conn)
            .map_err(AppError::Database)?;

        let avg_confidence = reconciliation_results::table
            .select(diesel::dsl::sql::<
                diesel::sql_types::Nullable<diesel::sql_types::Double>,
            >("AVG(confidence_score::float8)"))
            .first::<Option<f64>>(conn)
            .map_err(AppError::Database)?
            .unwrap_or(0.0);

        let avg_processing_time = reconciliation_jobs::table
            .filter(reconciliation_jobs::status.eq("completed"))
            .filter(reconciliation_jobs::processing_time_ms.is_not_null())
            .select(diesel::dsl::sql::<
                diesel::sql_types::Nullable<diesel::sql_types::Double>,
            >("AVG(processing_time_ms)"))
            .first::<Option<f64>>(conn)
            .map_err(AppError::Database)?
            .unwrap_or(0.0);

        Ok((total_records_processed, avg_confidence, avg_processing_time))
    }
}
