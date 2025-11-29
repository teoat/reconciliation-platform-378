//! Ingestion service module

use chrono::Utc;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::{ingestion_errors, ingestion_jobs, ingestion_results};
use crate::models::{
    IngestionError, IngestionJob, IngestionResult, NewIngestionError, NewIngestionJob,
    NewIngestionResult, UpdateIngestionJob,
};

/// Ingestion service
pub struct IngestionService {
    db: Arc<Database>,
}

impl IngestionService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub async fn get_job(&self, job_id: Uuid) -> AppResult<IngestionJob> {
        let mut conn = self.db.get_connection()?;
        ingestion_jobs::table
            .find(job_id)
            .first::<IngestionJob>(&mut conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => AppError::NotFound(format!("Job {} not found", job_id)),
                _ => AppError::Database(e),
            })
    }

    pub async fn create_job(&self, new_job: NewIngestionJob) -> AppResult<IngestionJob> {
        let mut conn = self.db.get_connection()?;
        diesel::insert_into(ingestion_jobs::table)
            .values(&new_job)
            .get_result::<IngestionJob>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn update_job(&self, job_id: Uuid, update: UpdateIngestionJob) -> AppResult<IngestionJob> {
        let mut conn = self.db.get_connection()?;
        diesel::update(ingestion_jobs::table.find(job_id))
            .set(&update)
            .get_result::<IngestionJob>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn get_status(&self, job_id: Uuid) -> AppResult<serde_json::Value> {
        let job = self.get_job(job_id).await?;
        Ok(serde_json::json!({
            "id": job.id,
            "status": job.status,
            "progress": job.progress,
            "total_records": job.total_records,
            "processed_records": job.processed_records,
            "error_count": job.error_count,
            "started_at": job.started_at,
            "completed_at": job.completed_at,
        }))
    }

    pub async fn get_results(&self, job_id: Uuid, page: i64, per_page: i64) -> AppResult<(Vec<IngestionResult>, i64)> {
        let mut conn = self.db.get_connection()?;
        let offset = (page - 1) * per_page;

        let total: i64 = ingestion_results::table
            .filter(ingestion_results::job_id.eq(job_id))
            .count()
            .get_result(&mut conn)
            .map_err(AppError::Database)?;

        let items = ingestion_results::table
            .filter(ingestion_results::job_id.eq(job_id))
            .order(ingestion_results::record_index.asc())
            .limit(per_page)
            .offset(offset)
            .load::<IngestionResult>(&mut conn)
            .map_err(AppError::Database)?;

        Ok((items, total))
    }

    pub async fn get_errors(&self, job_id: Uuid, page: i64, per_page: i64) -> AppResult<(Vec<IngestionError>, i64)> {
        let mut conn = self.db.get_connection()?;
        let offset = (page - 1) * per_page;

        let total: i64 = ingestion_errors::table
            .filter(ingestion_errors::job_id.eq(job_id))
            .count()
            .get_result(&mut conn)
            .map_err(AppError::Database)?;

        let items = ingestion_errors::table
            .filter(ingestion_errors::job_id.eq(job_id))
            .order(ingestion_errors::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<IngestionError>(&mut conn)
            .map_err(AppError::Database)?;

        Ok((items, total))
    }

    pub async fn create_result(&self, new_result: NewIngestionResult) -> AppResult<IngestionResult> {
        let mut conn = self.db.get_connection()?;
        diesel::insert_into(ingestion_results::table)
            .values(&new_result)
            .get_result::<IngestionResult>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn create_error(&self, new_error: NewIngestionError) -> AppResult<IngestionError> {
        let mut conn = self.db.get_connection()?;
        diesel::insert_into(ingestion_errors::table)
            .values(&new_error)
            .get_result::<IngestionError>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn process_job(&self, job_id: Uuid) -> AppResult<IngestionJob> {
        // Update job status to processing
        let update = UpdateIngestionJob {
            status: Some("processing".to_string()),
            started_at: Some(Some(Utc::now())),
            ..Default::default()
        };
        self.update_job(job_id, update).await
    }
}

impl Default for UpdateIngestionJob {
    fn default() -> Self {
        Self {
            status: None,
            progress: None,
            total_records: None,
            processed_records: None,
            error_count: None,
            started_at: None,
            completed_at: None,
            error_message: None,
        }
    }
}

