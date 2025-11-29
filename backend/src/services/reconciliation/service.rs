//! Reconciliation service main implementation
//!
//! This module contains all the service methods that implement the public API
//! for reconciliation operations.

pub mod jobs;
pub mod results;

use diesel::{ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl};
use uuid::Uuid;

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::{reconciliation_jobs, reconciliation_results};
use crate::models::{
    NewReconciliationJob, ReconciliationJob,
};
use super::types::{
    CreateReconciliationJobRequest, ReconciliationJobStatus,
};
use super::ReconciliationService;

// Re-export types and functions from sub-modules
pub use results::{BatchApprovalResult, MatchResolve, UpdatedMatch};
// Note: get_reconciliation_progress is in jobs module, not re-exported here to avoid conflicts


// Types are now in results module













// delete_reconciliation_job is defined in jobs.rs module



/// Stops a running reconciliation job.
///
/// This function gracefully stops a reconciliation job that is currently processing.
/// The job status will be updated to "stopped" and partial results will be saved.
///
/// # Arguments
/// * `service` - Reference to the reconciliation service
/// * `job_id` - UUID of the job to stop
///
/// # Returns
/// `AppResult<()>` - Ok if job stopped successfully
///
/// # Errors
/// Returns `AppError` if:
/// - Job not found
/// - Job is not running
/// - Insufficient permissions
///
/// # Example
/// ```rust
/// let job_id = Uuid::parse_str("123e4567-e89b-12d3-a456-426614174000")?;
/// stop_reconciliation_job(&service, job_id).await?;
/// ```
pub async fn stop_reconciliation_job(
    service: &ReconciliationService,
    job_id: Uuid,
) -> AppResult<()> {
    service.job_processor.stop_job(job_id).await
}

// Delegate to results module
pub use results::{
    batch_approve_matches, get_reconciliation_results, update_match,
};

// Re-export job functions from jobs module
pub use jobs::{
    delete_reconciliation_job,
    get_project_reconciliation_jobs,
    start_reconciliation_job,
    update_reconciliation_job,
    get_reconciliation_job_status,
};

/// Cancel a reconciliation job
pub async fn cancel_reconciliation_job(
    service: &ReconciliationService,
    job_id: Uuid,
    user_id: Uuid,
) -> AppResult<()> {
    // Check job permission - verify user has access to this job
    let mut conn = service.db.get_connection()?;
    let job = reconciliation_jobs::table
        .filter(reconciliation_jobs::id.eq(job_id))
        .first::<ReconciliationJob>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;
    
    if let Some(job) = job {
        // Verify user has access to the project (using created_by field)
        // Note: Access control should check project membership, not just created_by
        if job.created_by != user_id {
            return Err(AppError::Forbidden("User does not have access to this job".to_string()));
        }
    }
    
    // Update job status to cancelled
    diesel::update(reconciliation_jobs::table.filter(reconciliation_jobs::id.eq(job_id)))
        .set(reconciliation_jobs::status.eq("cancelled"))
        .execute(&mut conn)
        .map_err(AppError::Database)?;
    
    Ok(())
}

/// Get list of currently active reconciliation jobs.
pub async fn get_active_jobs(service: &ReconciliationService) -> AppResult<Vec<Uuid>> {
    Ok(service
        .job_processor
        .active_jobs
        .read()
        .await
        .keys()
        .cloned()
        .collect())
}

/// Get list of reconciliation jobs currently queued for processing.
pub async fn get_queued_jobs(service: &ReconciliationService) -> AppResult<Vec<Uuid>> {
    Ok(service.job_processor.job_queue.read().await.clone())
}







/// Export job results to file
pub async fn export_job_results(
    db: &Database,
    job_id: Uuid,
    path: &std::path::Path,
    format: &str,
) -> AppResult<()> {
    use crate::models::ReconciliationResult;
    use std::io::Write;

    let mut conn = db.get_connection()?;
    let results = reconciliation_results::table
        .filter(reconciliation_results::job_id.eq(job_id))
        .load::<ReconciliationResult>(&mut conn)
        .map_err(AppError::Database)?;

    match format {
        "csv" => {
            let mut writer = std::fs::File::create(path)?;
            writeln!(writer, "id,job_id,record_a_id,record_b_id,match_type,confidence_score,status,notes,created_at,updated_at")?;
            for result in results {
                writeln!(
                    writer,
                    "{},{},{},{},{},{},{},{},{},{}",
                    result.id,
                    result.job_id,
                    result.record_a_id,
                    result.record_b_id.unwrap_or(Uuid::nil()),
                    result.match_type,
                    result
                        .confidence_score
                        .map(|c| c.to_string())
                        .unwrap_or("0.0".to_string()),
                    result.status.as_deref().unwrap_or("unknown"),
                    result.notes.as_deref().unwrap_or(""),
                    result.created_at,
                    result.updated_at.unwrap_or(result.created_at)
                )?;
            }
        }
        "json" => {
            let json = serde_json::to_string_pretty(&results)?;
            std::fs::write(path, json)?;
        }
        _ => {
            return Err(AppError::Validation(format!(
                "Unsupported export format: {}",
                format
            )))
        }
    }

    Ok(())
}

/// Create reconciliation job implementation
pub async fn create_reconciliation_job_impl(
    db: &Database,
    user_id: Uuid,
    request: CreateReconciliationJobRequest,
) -> AppResult<ReconciliationJobStatus> {
    let job_id = Uuid::new_v4();
    crate::database::transaction::with_transaction(db.get_pool(), |tx| {
        use crate::models::schema::data_sources;

        // 1) Verify data sources belong to the same project and exist
        let source_a_exists = data_sources::table
            .filter(data_sources::id.eq(request.source_a_id))
            .filter(data_sources::project_id.eq(request.project_id))
            .count()
            .get_result::<i64>(tx)
            .map_err(AppError::Database)?;

        if source_a_exists == 0 {
            return Err(AppError::NotFound(format!(
                "Data source {} not found for project {}",
                request.source_a_id, request.project_id
            )));
        }

        let source_b_exists = data_sources::table
            .filter(data_sources::id.eq(request.source_b_id))
            .filter(data_sources::project_id.eq(request.project_id))
            .count()
            .get_result::<i64>(tx)
            .map_err(AppError::Database)?;

        if source_b_exists == 0 {
            return Err(AppError::NotFound(format!(
                "Data source {} not found for project {}",
                request.source_b_id, request.project_id
            )));
        }

        // 2) Create the job
        let settings_json =
            serde_json::to_value(&request.matching_rules).map_err(AppError::Serialization)?;

        use bigdecimal::BigDecimal;
        use std::str::FromStr;
        let confidence_bd = BigDecimal::from_str(&request.confidence_threshold.to_string())
            .map_err(|e| AppError::Validation(format!("Invalid confidence threshold: {}", e)))?;

        let new_job = NewReconciliationJob {
            project_id: request.project_id,
            name: request.name.clone(),
            description: request.description.clone(),
            status: "pending".to_string(),
            created_by: user_id,
            confidence_threshold: Some(confidence_bd),
            settings: Some(settings_json),
            started_at: None,
            completed_at: None,
            progress: Some(0),
            total_records: None,
            processed_records: Some(0),
            matched_records: Some(0),
            unmatched_records: Some(0),
            processing_time_ms: None,
        };

        diesel::insert_into(reconciliation_jobs::table)
            .values(&new_job)
            .execute(tx)
            .map_err(AppError::Database)?;

        Ok(ReconciliationJobStatus {
            id: job_id,
            name: request.name,
            status: "pending".to_string(),
            progress: 0,
            total_records: None,
            processed_records: 0,
            matched_records: 0,
            unmatched_records: 0,
            started_at: None,
            completed_at: None,
        })
    })
    .await
}
