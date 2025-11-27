//! Processing logic for reconciliation
//!
//! This module contains the core processing logic for reconciliation jobs
//! including chunk processing, result saving, and batch operations.

use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::reconciliation_results;
use crate::models::{DataSource, NewReconciliationResult, ReconciliationRecord as DbReconciliationRecord};
use diesel::RunQueryDsl;

use super::job_management::{JobProgress, JobStatus};
use super::matching::{ExactMatchingAlgorithm, FuzzyMatchingAlgorithm, MatchingAlgorithm};
use super::types::{FuzzyAlgorithmType, MatchingResult, MatchingRuleType, ReconciliationRecord};
use super::processing_config::{ChunkedProcessingConfig, ChunkProcessingConfig};
use crate::models::ReconciliationResult as ReconciliationResultType;

/// Process reconciliation job in chunks with timeout protection
pub async fn process_data_sources_chunked(
    config: ChunkedProcessingConfig,
) -> AppResult<Vec<ReconciliationResultType>> {
    // Wrap processing in timeout to prevent stuck jobs
    let timeout_duration = std::time::Duration::from_secs(7200); // 2 hours default
    let job_id = config.job_id; // Extract before move
    
    tokio::time::timeout(
        timeout_duration,
        process_data_sources_chunked_internal(config)
    ).await
    .map_err(|_| AppError::Internal(format!(
        "Job {} exceeded timeout of {} seconds",
        job_id,
        timeout_duration.as_secs()
    )))?
}

/// Internal processing function (without timeout wrapper)
async fn process_data_sources_chunked_internal(
    config: ChunkedProcessingConfig,
) -> AppResult<Vec<ReconciliationResultType>> {
    let mut results = Vec::new();

    // Load actual records from data sources
    let records_a = load_records_from_data_source(&config.db, &config.source_a).await?;
    let records_b = load_records_from_data_source(&config.db, &config.source_b).await?;

    let total_records = records_a.len(); // We iterate through records_a
    let total_chunks = total_records.div_ceil(config.chunk_size);

    // Update total records in job status
    {
        let mut status_guard = config.status.write().await;
        status_guard.total_records = Some(total_records as i32);
    }

    let exact_algorithm = ExactMatchingAlgorithm;
    let fuzzy_algorithm =
        FuzzyMatchingAlgorithm::new(config.confidence_threshold, FuzzyAlgorithmType::Levenshtein);

    for chunk_index in 0..total_chunks {
        let start_record = chunk_index * config.chunk_size;
        let end_record = ((chunk_index + 1) * config.chunk_size).min(total_records);
        
        let records_a_chunk = &records_a[start_record..end_record];

        // Update current phase
        let phase = format!("Processing chunk {}/{}", chunk_index + 1, total_chunks);
        update_job_status(
            &config.status,
            "processing",
            ((chunk_index as f64 / total_chunks as f64) * 80.0) as i32,
            &phase,
        )
        .await;

        // Process chunk
        let chunk_config = ChunkProcessingConfig {
            source_a: config.source_a.clone(),
            source_b: config.source_b.clone(),
            matching_rules: config.matching_rules.clone(),
            job_id: config.job_id,
            confidence_threshold: config.confidence_threshold,
            start_record,
            end_record,
        };
        let chunk_results = process_chunk(
            chunk_config,
            records_a_chunk,
            &records_b,
            &exact_algorithm,
            &fuzzy_algorithm,
        )
        .await?;

        results.extend(chunk_results);

        // Update progress
        let progress = ((end_record as f64 / total_records as f64) * 80.0) as i32;
        let processed_records = end_record as i32;
        
        let matched_records = results.iter().filter(|r| r.record_b_id.is_some()).count() as i32;
        let unmatched_records = results.iter().filter(|r| r.record_b_id.is_none()).count() as i32;

        update_job_progress(
            &config.status,
            progress,
            processed_records,
            matched_records,
            unmatched_records,
        )
        .await;

        // Update heartbeat to indicate job is still alive
        {
            let mut status_guard = config.status.write().await;
            status_guard.heartbeat();
        }

        // Small delay to prevent overwhelming the system
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
    }

    Ok(results)
}

/// Convert database reconciliation record to service reconciliation record
fn convert_db_record_to_service_record(db_record: &DbReconciliationRecord) -> ReconciliationRecord {
    // Extract fields from source_data JSON
    let fields = if let serde_json::Value::Object(map) = &db_record.source_data {
        map.iter()
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect()
    } else {
        std::collections::HashMap::new()
    };

    // Extract metadata from audit_trail or create empty
    let metadata = if let serde_json::Value::Object(map) = &db_record.audit_trail {
        map.iter()
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect()
    } else {
        std::collections::HashMap::new()
    };

    ReconciliationRecord {
        id: db_record.id,
        source_id: db_record.external_id.clone().unwrap_or_else(|| db_record.id.to_string()),
        fields,
        metadata,
    }
}

/// Process a single chunk of data
async fn process_chunk(
    config: ChunkProcessingConfig,
    records_a_chunk: &[DbReconciliationRecord],
    records_b: &[DbReconciliationRecord],
    exact_algorithm: &dyn MatchingAlgorithm,
    fuzzy_algorithm: &FuzzyMatchingAlgorithm,
) -> AppResult<Vec<ReconciliationResultType>> {
    let mut results = Vec::new();
    let fields_to_match: Vec<String> = config
        .matching_rules
        .iter()
        .map(|r| r.field.clone())
        .collect();

    for record_a in records_a_chunk {
        let mut best_match: Option<MatchingResult> = None;
        let service_record_a = convert_db_record_to_service_record(record_a);

        for record_b in records_b {
            let service_record_b = convert_db_record_to_service_record(record_b);
            
            // Determine which algorithm to use based on rules
            // For simplicity, we'll prefer exact and fallback to fuzzy
            // A more robust implementation would iterate through rules
            let algorithm: &dyn MatchingAlgorithm = if config
                .matching_rules
                .iter()
                .any(|r| matches!(r.rule_type, MatchingRuleType::Exact))
            {
                exact_algorithm
            } else {
                fuzzy_algorithm
            };

            if let Some(match_result) = super::matching::match_records(
                &service_record_a,
                &service_record_b,
                algorithm,
                &fields_to_match,
                config.confidence_threshold,
            ) {
                if best_match.as_ref().map_or(true, |current_best| {
                    match_result.confidence_score > current_best.confidence_score
                }) {
                    best_match = Some(match_result);
                }
            }
        }

        if let Some(matched_result) = best_match {
            use bigdecimal::BigDecimal;
            use std::str::FromStr;
            let conf_bd = BigDecimal::from_str(&matched_result.confidence_score.to_string())
                .unwrap_or_else(|_| BigDecimal::from(0));

            results.push(ReconciliationResultType {
                id: Uuid::new_v4(),
                job_id: config.job_id,
                record_a_id: record_a.id,
                record_b_id: Some(matched_result.target_record.id),
                match_type: matched_result.match_type.to_string(),
                confidence_score: Some(conf_bd),
                match_details: Some(serde_json::json!({
                    "matching_fields": matched_result.matching_fields,
                    "differences": matched_result.differences
                })),
                status: Some("matched".to_string()),
                updated_at: Some(chrono::Utc::now()),
                notes: None,
                reviewed_by: None,
                created_at: chrono::Utc::now(),
            });
        } else {
            // No match found for record_a in the entire source B
            results.push(ReconciliationResultType {
                id: Uuid::new_v4(),
                job_id: config.job_id,
                record_a_id: record_a.id,
                record_b_id: None,
                match_type: "unmatched".to_string(),
                confidence_score: None,
                match_details: None,
                status: Some("unmatched".to_string()),
                updated_at: Some(chrono::Utc::now()),
                notes: None,
                reviewed_by: None,
                created_at: chrono::Utc::now(),
            });
        }
    }

    Ok(results)
}

/// Save reconciliation results to database
pub async fn save_reconciliation_results(
    db: &Database,
    job_id: Uuid,
    results: &[ReconciliationResultType],
) -> AppResult<()> {
    let mut conn = db.get_connection()?;

    for result in results {
        let new_result = NewReconciliationResult {
            job_id,
            record_a_id: result.record_a_id,
            record_b_id: result.record_b_id,
            match_type: result.match_type.clone(),
            confidence_score: result.confidence_score.clone(),
            match_details: None,
            status: Some("pending".to_string()),
            notes: None,
            reviewed_by: None,
        };

        diesel::insert_into(reconciliation_results::table)
            .values(&new_result)
            .execute(&mut conn)
            .map_err(AppError::Database)?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn update_job_status_works() {
        let status = Arc::new(RwLock::new(JobStatus::new()));

        update_job_status(&status, "processing", 50, "Processing chunk 1/10").await;

        let status_guard = status.read().await;
        // JobStatus doesn't have a status field, check other fields instead
        assert_eq!(status_guard.progress, 50);
        assert_eq!(status_guard.current_phase, "Processing chunk 1/10");
    }

    #[tokio::test]
    async fn update_job_progress_tracks_records() {
        let status = Arc::new(RwLock::new(JobStatus::new()));

        update_job_progress(&status, 75, 750, 600, 150).await;

        let status_guard = status.read().await;
        assert_eq!(status_guard.progress, 75);
        assert_eq!(status_guard.processed_records, 750);
        assert_eq!(status_guard.matched_records, 600);
        assert_eq!(status_guard.unmatched_records, 150);
    }
}

/// Update job status
pub async fn update_job_status(
    status: &Arc<RwLock<JobStatus>>,
    new_status: &str,
    progress: i32,
    phase: &str,
) {
    let mut status_guard = status.write().await;
    status_guard.update(new_status, progress, phase);
}

/// Update job progress
pub async fn update_job_progress(
    status: &Arc<RwLock<JobStatus>>,
    progress: i32,
    processed_records: i32,
    matched_records: i32,
    unmatched_records: i32,
) {
    let mut status_guard = status.write().await;
    status_guard.update_progress(
        progress,
        processed_records,
        matched_records,
        unmatched_records,
    );
}

/// Send progress update
pub async fn send_progress(
    sender: &tokio::sync::mpsc::Sender<JobProgress>,
    job_id: Uuid,
    project_id: Uuid,
    status: &str,
    progress: i32,
    phase: &str,
) {
    let progress_update = JobProgress {
        job_id,
        project_id,
        status: status.to_string(),
        progress,
        total_records: None,
        processed_records: 0,
        matched_records: 0,
        unmatched_records: 0,
        current_phase: phase.to_string(),
        estimated_completion: None,
    };

    let _ = sender.send(progress_update).await;
}

/// Load reconciliation records from a data source
pub async fn load_records_from_data_source(
    db: &Database,
    data_source: &DataSource,
) -> AppResult<Vec<DbReconciliationRecord>> {
    let mut conn = db.get_connection()?;
    use crate::models::schema::reconciliation_records::dsl::*;
    use diesel::prelude::*;
    let records = reconciliation_records
        .filter(project_id.eq(&data_source.project_id))
        .select(DbReconciliationRecord::as_select())
        .load(&mut conn)
        .map_err(AppError::Database)?;
    Ok(records)
}
