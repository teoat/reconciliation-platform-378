//! Reconciliation service main implementation
//! 
//! This module contains all the service methods that implement the public API
//! for reconciliation operations.

use uuid::Uuid;
use chrono::Utc;
use bigdecimal::BigDecimal;
use diesel::{RunQueryDsl, QueryDsl, ExpressionMethods, OptionalExtension};

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::{
    ReconciliationJob, NewReconciliationJob, UpdateReconciliationJob,
    ReconciliationResult,
};
use crate::models::schema::{reconciliation_jobs, reconciliation_results};

use super::job_management::{JobStatus, JobProgress};
use super::types::{
    CreateReconciliationJobRequest, ReconciliationJobStatus, ReconciliationResultDetail,
};
use super::{ReconciliationService};

/// Result of batch approval operation
#[derive(Debug, serde::Serialize)]
pub struct BatchApprovalResult {
    pub approved: i32,
    pub rejected: i32,
    pub errors: Option<Vec<String>>,
}

/// Updated match result
#[derive(Debug, serde::Serialize)]
pub struct UpdatedMatch {
    pub id: Uuid,
    pub status: String,
    pub confidence_score: Option<f64>,
    pub reviewed_by: Option<String>,
    pub updated_at: chrono::DateTime<Utc>,
}

/// Match resolve request (from handlers)
#[derive(Debug, Clone, serde::Deserialize)]
pub struct MatchResolve {
    pub match_id: Uuid,
    pub action: String, // "approve" | "reject"
    pub notes: Option<String>,
}

/// Get active reconciliation jobs
pub async fn get_active_jobs(service: &ReconciliationService) -> AppResult<Vec<Uuid>> {
    Ok(service.job_processor.active_jobs.read().await.keys().cloned().collect())
}

/// Get queued reconciliation jobs
pub async fn get_queued_jobs(service: &ReconciliationService) -> AppResult<Vec<Uuid>> {
    Ok(service.job_processor.job_queue.read().await.clone())
}
    
/// Get reconciliation job progress
pub async fn get_reconciliation_progress(
    service: &ReconciliationService,
    job_id: Uuid,
    user_id: Uuid,
    ) -> AppResult<JobProgress> {
        // Check permissions
        check_job_permission(service, job_id, user_id)?;

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
                    current_phase: if j.completed_at.is_some() { "completed".to_string() } else { "unknown".to_string() },
                    estimated_completion: None,
                })
            } else {
                Err(AppError::NotFound(format!("Reconciliation job {} not found", job_id)))
            }
        }
    }
    
/// Cancel reconciliation job
pub async fn cancel_reconciliation_job(
    service: &ReconciliationService,
    job_id: Uuid,
    user_id: Uuid,
    ) -> AppResult<()> {
        // Check permissions
        check_job_permission(service, job_id, user_id)?;

        // Cancel active job
        service.job_processor.stop_job(job_id).await?;

        // Update job status in database
        update_job_status(service, job_id, "cancelled").await?;
        
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

/// Get reconciliation job status (active or from DB)
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
            use bigdecimal::BigDecimal;
            use std::str::FromStr;
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
pub async fn delete_reconciliation_job(service: &ReconciliationService, job_id: Uuid) -> AppResult<()> {
    let mut conn = service.db.get_connection()?;
        diesel::delete(reconciliation_results::table.filter(reconciliation_results::job_id.eq(job_id)))
            .execute(&mut conn)
            .map_err(AppError::Database)?;
        diesel::delete(reconciliation_jobs::table.filter(reconciliation_jobs::id.eq(job_id)))
            .execute(&mut conn)
            .map_err(AppError::Database)?;
        Ok(())
    }

/// Start job via processor
pub async fn start_reconciliation_job(service: &ReconciliationService, job_id: Uuid) -> AppResult<()> {
    let _job_handle = service.job_processor.start_job(job_id).await;
    Ok(())
}

/// Stop job via processor
pub async fn stop_reconciliation_job(service: &ReconciliationService, job_id: Uuid) -> AppResult<()> {
    service.job_processor.stop_job(job_id).await
}

/// Paged reconciliation results for a job
pub async fn get_reconciliation_results(
    service: &ReconciliationService,
    job_id: Uuid,
    page: Option<i64>,
    per_page: Option<i64>,
    _lean: Option<bool>,
) -> AppResult<Vec<ReconciliationResultDetail>> {
    let page = page.unwrap_or(1).max(1);
    let per_page = per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;
    let mut conn = service.db.get_connection()?;
        let results = reconciliation_results::table
            .filter(reconciliation_results::job_id.eq(job_id))
            .order(reconciliation_results::confidence_score.desc())
            .limit(per_page)
            .offset(offset)
            .load::<ReconciliationResult>(&mut conn)
            .map_err(AppError::Database)?;
        let details = results
            .into_iter()
            .map(|r| ReconciliationResultDetail {
                id: r.id,
                job_id: r.job_id,
                record_a_id: r.record_a_id,
                record_b_id: r.record_b_id,
                match_type: r.match_type,
                confidence_score: r.confidence_score.map(|c| c.to_string().parse::<f64>().unwrap_or(0.0)),
                status: r.status.unwrap_or_else(|| "pending".to_string()),
                notes: r.notes,
                created_at: r.created_at,
                updated_at: r.updated_at.unwrap_or(r.created_at),
            })
            .collect();
        Ok(details)
    }

/// Batch approve or reject matches within a single transaction
pub async fn batch_approve_matches(
    service: &ReconciliationService,
    _user_id: Uuid,
    resolves: Vec<MatchResolve>,
) -> AppResult<BatchApprovalResult> {
    crate::database::transaction::with_transaction(service.db.get_pool(), |tx| {
            let mut approved = 0i32;
            let mut rejected = 0i32;
            let mut errors: Vec<String> = Vec::new();

            for item in &resolves {
                let action = item.action.to_lowercase();
                let status_val = match action.as_str() {
                    "approve" => { approved += 1; "approved" }
                    "reject" => { rejected += 1; "rejected" }
                    _ => {
                        errors.push(format!("Invalid action '{}' for match {}", item.action, item.match_id));
                        continue;
                    }
                };

                let rows = diesel::update(reconciliation_results::table
                        .filter(reconciliation_results::id.eq(item.match_id)))
                    .set((
                        reconciliation_results::status.eq(status_val),
                        reconciliation_results::updated_at.eq(Utc::now()),
                        reconciliation_results::notes.eq(item.notes.clone()),
                    ))
                    .execute(tx)
                    .map_err(AppError::Database)?;

                if rows == 0 {
                    errors.push(format!("Match {} not found", item.match_id));
                }
            }

            Ok(BatchApprovalResult {
                approved,
                rejected,
                errors: if errors.is_empty() { None } else { Some(errors) },
            })
        }).await
    }

/// Update individual reconciliation match
pub async fn update_match(
    service: &ReconciliationService,
    _user_id: Uuid,
    match_id: Uuid,
    status: Option<&str>,
    confidence_score: Option<f64>,
    reviewed_by: Option<&str>,
) -> AppResult<UpdatedMatch> {
    let mut conn = service.db.get_connection()?;

    // Build the update query dynamically
    // Convert parameters to proper types
    let status_val = status.map(|s| Some(s)).unwrap_or(None);
    let confidence_val = if let Some(confidence) = confidence_score {
        // Convert f64 to BigDecimal using string conversion
        use std::str::FromStr;
        Some(BigDecimal::from_str(&confidence.to_string())
            .map_err(|_| AppError::Validation("Invalid confidence score".to_string()))?)
    } else {
        None
    };
    let reviewer_val = if let Some(reviewer) = reviewed_by {
        Some(Uuid::parse_str(reviewer)
            .map_err(|_| AppError::Validation("Invalid reviewer UUID".to_string()))?)
    } else {
        None
    };

    let rows = diesel::update(reconciliation_results::table
        .filter(reconciliation_results::id.eq(match_id)))
        .set((
            reconciliation_results::status.eq(status_val),
            reconciliation_results::confidence_score.eq(confidence_val),
            reconciliation_results::reviewed_by.eq(reviewer_val),
            reconciliation_results::updated_at.eq(Utc::now()),
        ))
        .execute(&mut conn)
        .map_err(AppError::Database)?;

    if rows == 0 {
        return Err(AppError::NotFound("Match not found".to_string()));
    }

    // Fetch the updated match
    let updated_match: ReconciliationResult = reconciliation_results::table
        .find(match_id)
        .first(&mut conn)
        .map_err(AppError::Database)?;

    Ok(UpdatedMatch {
        id: updated_match.id,
        status: updated_match.status.unwrap_or_else(|| "pending".to_string()),
        confidence_score: updated_match.confidence_score.map(|c| c.to_string().parse::<f64>().unwrap_or(0.0)),
        reviewed_by: updated_match.reviewed_by.map(|u| u.to_string()),
        updated_at: updated_match.updated_at.unwrap_or(updated_match.created_at),
    })
}

/// Calculate estimated completion time
fn calculate_estimated_completion(_service: &ReconciliationService, status: &JobStatus) -> Option<chrono::DateTime<chrono::Utc>> {
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
    
/// Check if user has permission to access job
fn check_job_permission(service: &ReconciliationService, job_id: Uuid, user_id: Uuid) -> AppResult<()> {
    // Delegate to canonical authorization helper to ensure consistent policy
    crate::utils::authorization::check_job_access(&service.db, user_id, job_id)
}
    
/// Update job status in database
async fn update_job_status(service: &ReconciliationService, job_id: Uuid, status: &str) -> AppResult<()> {
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

/// Export job results to file
pub async fn export_job_results(
    db: &Database,
    job_id: Uuid,
    path: &std::path::Path,
    format: &str,
) -> AppResult<()> {
    use std::io::Write;
    use crate::models::ReconciliationResult;

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
                writeln!(writer, "{},{},{},{},{},{},{},{},{},{}",
                    result.id,
                    result.job_id,
                    result.record_a_id,
                    result.record_b_id.unwrap_or(Uuid::nil()),
                    result.match_type,
                    result.confidence_score.map(|c| c.to_string()).unwrap_or("0.0".to_string()),
                    result.status.as_ref().map(|s| s.as_str()).unwrap_or("unknown"),
                    result.notes.as_ref().map(|n| n.as_str()).unwrap_or(""),
                    result.created_at,
                    result.updated_at.unwrap_or(result.created_at)
                )?;
            }
        },
        "json" => {
            let json = serde_json::to_string_pretty(&results)?;
            std::fs::write(path, json)?;
        },
        _ => return Err(AppError::Validation(format!("Unsupported export format: {}", format))),
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
            return Err(AppError::NotFound(
                format!("Data source {} not found for project {}", request.source_a_id, request.project_id)
            ));
        }

        let source_b_exists = data_sources::table
            .filter(data_sources::id.eq(request.source_b_id))
            .filter(data_sources::project_id.eq(request.project_id))
            .count()
            .get_result::<i64>(tx)
            .map_err(AppError::Database)?;

        if source_b_exists == 0 {
            return Err(AppError::NotFound(
                format!("Data source {} not found for project {}", request.source_b_id, request.project_id)
            ));
        }

        // 2) Create the job
        let settings_json = serde_json::to_value(&request.matching_rules)
            .map_err(|e| AppError::Serialization(e))?;

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
    }).await
}

