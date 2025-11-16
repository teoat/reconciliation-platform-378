//! Aggregation/reporting-focused facade for projects.

use crate::database::Database;
use crate::errors::AppResult;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct ProjectAggregates {
    pub total_jobs: i64,
    pub total_data_sources: i64,
}

pub struct ProjectAggregationService {
    db: Database,
}

impl ProjectAggregationService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    pub async fn aggregates(&self, project_id: Uuid) -> AppResult<ProjectAggregates> {
        // Delegate to AnalyticsService to avoid duplication
        let analytics = crate::services::analytics::AnalyticsService::new(self.db.clone());
        let stats = analytics.get_project_stats(project_id).await?;
        Ok(ProjectAggregates {
            total_jobs: stats.total_jobs,
            total_data_sources: stats.total_data_sources,
        })
    }
}
