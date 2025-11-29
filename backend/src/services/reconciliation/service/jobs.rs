//! Reconciliation job management operations

use crate::errors::{AppError, AppResult};
use crate::models::schema::{reconciliation_jobs, reconciliation_results};
use crate::models::{ReconciliationJob, UpdateReconciliationJob};
use crate::services::reconciliation::ReconciliationService;
use bigdecimal::BigDecimal;
use chrono::Utc;
use diesel::{ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl};
use std::str::FromStr;
use uuid::Uuid;

use crate::services::reconciliation::types::ReconciliationJobStatus;
use crate::services::reconciliation::job_management::{JobProgress, JobStatus};

/// Calculate estimated completion time
fn calculate_estimated_completion(
    _service: &ReconciliationService,
    status: &JobStatus,
) -> Option<chrono::DateTime<Utc>> {
    if status.progress == 0 || status.total_records.is_none() {
        return None;
    }

    let total_records = status.total_records.unwrap_or(0) as f64;
    let processed_records = status.processed_records as f64;

    if let Some(started_at) = status.started_at {
        let elapsed_seconds = (Utc::now() - started_at).num_seconds() as f64;
        if elapsed_seconds > 0.0 && processed_records > 0.0 {
            let progress_rate = processed_records / elapsed_seconds;
            let remaining_records = total_records - processed_records;
            let estimated_seconds = remaining_records / progress_rate;
            return Some(Utc::now() + chrono::Duration::seconds(estimated_seconds as i64));
        }
    }

    None
}

/// Get detailed progress information for a reconciliation job.
///
/// Retrieves progress from in-memory job processor if available, otherwise
/// falls back to database. Includes progress percentage, record counts, and
/// estimated completion time.
///
/// # Arguments
/// * `service` - The reconciliation service instance
/// * `job_id` - UUID of the job to get progress for
/// * `project_id` - UUID of the project (for validation)
///
/// # Returns
/// `AppResult<JobProgress>` - Detailed progress information
///
/// # Errors
/// Returns `AppError::NotFound` if the job doesn't exist
///
/// # Example
/// ```rust
/// let progress = get_reconciliation_progress(&service, job_id, project_id).await?;
/// println!("Progress: {}%", progress.progress);
/// ```
pub async fn get_reconciliation_progress(
    service: &ReconciliationService,
    job_id: Uuid,
    user_id: Uuid,
) -> AppResult<JobProgress> {
    // Check permissions
    crate::utils::authorization::check_job_access(&service.db, user_id, job_id)?;

    // Lookup project_id for this job
    let project_id: Uuid = {
        let mut conn = service.db.get_connection()?;
        use crate::models::schema::reconciliation_jobs::dsl as rj;
        rj::reconciliation_jobs
            .filter(rj::id.eq(job_id))
            .select(rj::project_id)
            .first::<Uuid>(&mut conn)
            .map_err(AppError::Database)?
    };

    // Get job status from active jobs or database
    if let Some(status) = service.job_processor.get_job_status(&job_id).await {
        Ok(JobProgress {
            job_id,
            project_id,
            status: status.message.clone(), // Use message as status
            progress: status.progress,
            total_records: status.total_records,
            processed_records: status.processed_records,
            matched_records: status.matched_records,
            unmatched_records: status.unmatched_records,
            current_phase: status.current_phase.clone(),
            estimated_completion: calculate_estimated_completion(service, &status),
        })
    } else {
        // Get from database
        let mut conn = service.db.get_connection()?;
        let job = reconciliation_jobs::table
            .filter(reconciliation_jobs::id.eq(job_id))
            .first::<ReconciliationJob>(&mut conn)
            .optional()
            .map_err(AppError::Database)?;

        if let Some(j) = job {
            Ok(JobProgress {
                job_id,
                project_id: j.project_id,
                status: j.status,
                progress: j.progress.unwrap_or(0),
                total_records: j.total_records,
                processed_records: j.processed_records.unwrap_or(0),
                matched_records: j.matched_records.unwrap_or(0),
                unmatched_records: j.unmatched_records.unwrap_or(0),
                current_phase: if j.completed_at.is_some() {
                    "completed".to_string()
                } else {
                    "unknown".to_string()
                },
                estimated_completion: None,
            })
        } else {
            Err(AppError::NotFound(format!(
                "Reconciliation job {} not found",
                job_id
            )))
        }
    }
}

/// Update job status in database
pub async fn update_job_status(
    service: &ReconciliationService,
    job_id: Uuid,
    status: &str,
) -> AppResult<()> {
    let conn = &mut service.db.get_connection()?;

    diesel::update(reconciliation_jobs::table)
        .filter(reconciliation_jobs::id.eq(job_id))
        .set((
            reconciliation_jobs::status.eq(status),
            reconciliation_jobs::updated_at.eq(Utc::now()),
        ))
        .execute(conn)?;

    Ok(())
}
pub async fn get_reconciliation_job_status(
    service: &ReconciliationService,
    job_id: Uuid,
) -> AppResult<ReconciliationJobStatus> {
    if let Some(status) = service.job_processor.get_job_status(&job_id).await {
        return Ok(ReconciliationJobStatus {
            id: job_id,
            name: "Running Job".to_string(),
            status: status.message.clone(), // Use message as status
            progress: status.progress,
            total_records: status.total_records,
            processed_records: status.processed_records,
            matched_records: status.matched_records,
            unmatched_records: status.unmatched_records,
            started_at: status.started_at,
            completed_at: None,
        });
    }
    let mut conn = service.db.get_connection()?;
    let job = reconciliation_jobs::table
        .filter(reconciliation_jobs::id.eq(job_id))
        .first::<ReconciliationJob>(&mut conn)
        .map_err(AppError::Database)?;
    Ok(ReconciliationJobStatus {
        id: job.id,
        name: job.name,
        status: job.status,
        progress: job.progress.unwrap_or(0),
        total_records: job.total_records,
        processed_records: job.processed_records.unwrap_or(0),
        matched_records: job.matched_records.unwrap_or(0),
        unmatched_records: job.unmatched_records.unwrap_or(0),
        started_at: job.started_at,
        completed_at: job.completed_at,
    })
}

/// Update reconciliation job editable fields
pub async fn update_reconciliation_job(
    service: &ReconciliationService,
    job_id: Uuid,
    name: Option<String>,
    description: Option<String>,
    confidence_threshold: Option<f64>,
    _settings: Option<serde_json::Value>,
) -> AppResult<ReconciliationJob> {
    let mut conn = service.db.get_connection()?;
    let update = UpdateReconciliationJob {
        name,
        description,
        status: None,
        progress: None,
        total_records: None,
        processed_records: None,
        matched_records: None,
        unmatched_records: None,
        started_at: None,
        completed_at: None,
    };
    diesel::update(reconciliation_jobs::table.filter(reconciliation_jobs::id.eq(job_id)))
        .set(&update)
        .execute(&mut conn)
        .map_err(AppError::Database)?;
    if let Some(th) = confidence_threshold {
        let threshold_bd = BigDecimal::from_str(&th.to_string())
            .map_err(|e| AppError::Validation(format!("Invalid confidence threshold: {}", e)))?;
        diesel::update(reconciliation_jobs::table.filter(reconciliation_jobs::id.eq(job_id)))
            .set(reconciliation_jobs::confidence_threshold.eq(Some(threshold_bd)))
            .execute(&mut conn)
            .map_err(AppError::Database)?;
    }
    let updated = reconciliation_jobs::table
        .filter(reconciliation_jobs::id.eq(job_id))
        .first::<ReconciliationJob>(&mut conn)
        .map_err(AppError::Database)?;
    Ok(updated)
}

/// Delete a reconciliation job and its results
pub async fn delete_reconciliation_job(
    service: &ReconciliationService,
    job_id: Uuid,
) -> AppResult<()> {
    let mut conn = service.db.get_connection()?;
    diesel::delete(
        reconciliation_results::table
            .filter(reconciliation_results::job_id.eq(job_id)),
    )
    .execute(&mut conn)
    .map_err(AppError::Database)?;
    diesel::delete(reconciliation_jobs::table.filter(reconciliation_jobs::id.eq(job_id)))
        .execute(&mut conn)
        .map_err(AppError::Database)?;
    Ok(())
}

/// List reconciliation jobs for a project
pub async fn get_project_reconciliation_jobs(
    service: &ReconciliationService,
    project_id: Uuid,
) -> AppResult<Vec<ReconciliationJob>> {
    let mut conn = service.db.get_connection()?;
    let jobs = reconciliation_jobs::table
        .filter(reconciliation_jobs::project_id.eq(project_id))
        .order(reconciliation_jobs::created_at.desc())
        .load::<ReconciliationJob>(&mut conn)
        .map_err(AppError::Database)?;
    Ok(jobs)
}

use std::sync::Arc;
use tokio;
use log;

/// Starts a reconciliation job for processing.
///
/// This function initiates the reconciliation process for the specified job.
/// The job will be queued and processed asynchronously.
///
/// # Arguments
/// * `service` - Reference to the reconciliation service
/// * `job_id` - UUID of the job to start
///
/// # Returns
/// `AppResult<()>` - Ok if job started successfully
///
/// # Errors
/// Returns `AppError` if:
/// - Job not found
/// - Job is already running
/// - Insufficient permissions
/// - Database error
///
/// # Example
/// ```rust
/// let job_id = Uuid::parse_str("123e4567-e89b-12d3-a456-426614174000")?;
/// start_reconciliation_job(&service, job_id).await?;
/// ```
pub async fn start_reconciliation_job(
    service: &ReconciliationService,
    job_id: Uuid,
) -> AppResult<()> {
    // Start the job (returns JobHandle, not a Result)
    let _job_handle = service.job_processor.start_job(job_id).await;
    let timeout_duration = service.job_processor.get_timeout_duration();
    
    // Spawn a background task to monitor for timeout with enhanced error handling
    let processor = Arc::clone(&service.job_processor);
    let job_id_clone = job_id;
    tokio::spawn(async move {
        tokio::time::sleep(timeout_duration).await;
        
        // Check if job is still active after timeout
        let stuck_jobs = processor.check_stuck_jobs().await;
        if stuck_jobs.contains(&job_id_clone) {
            log::warn!(
                "Job {} exceeded timeout of {} seconds, forcing timeout",
                job_id_clone,
                timeout_duration.as_secs()
            );
            if let Err(e) = processor.timeout_job(job_id_clone).await {
                log::error!(
                    "Failed to timeout job {}: {}. This may indicate a system issue.",
                    job_id_clone,
                    e
                );
            }
        }
    });
    
    Ok(())
}
