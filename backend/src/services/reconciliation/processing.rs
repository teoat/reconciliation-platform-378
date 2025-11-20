//! Processing logic for reconciliation
//! 
//! This module contains the core processing logic for reconciliation jobs
//! including chunk processing, result saving, and batch operations.

use uuid::Uuid;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::{DataSource, ReconciliationResult, NewReconciliationResult, MatchType, ReconciliationRecord};
use crate::models::schema::{reconciliation_results, data_sources, reconciliation_records};
use diesel::{RunQueryDsl, QueryDsl, ExpressionMethods, BelongingToDsl};

use super::types::MatchingRule;
use crate::models::ReconciliationResult as ReconciliationResultType;
use super::job_management::{JobProgress, JobStatus};
use super::matching::{MatchingAlgorithm, ExactMatchingAlgorithm, FuzzyMatchingAlgorithm};
use super::types::FuzzyAlgorithmType;

/// Process reconciliation job in chunks
pub async fn process_data_sources_chunked(
    db: &Database,
    source_a: &DataSource,
    source_b: &DataSource,
    matching_rules: &[MatchingRule],
    confidence_threshold: f64,
    chunk_size: usize,
    progress_sender: &tokio::sync::mpsc::Sender<JobProgress>,
    status: &Arc<RwLock<JobStatus>>,
) -> AppResult<Vec<ReconciliationResultType>> {
    let mut results = Vec::new();
    
    // Load actual records from data sources
    let records_a = load_records_from_data_source(db, source_a).await?;
    let records_b = load_records_from_data_source(db, source_b).await?;

    let total_records = records_a.len().max(records_b.len());
    let total_chunks = (total_records + chunk_size - 1) / chunk_size;

    // Update total records in job status
    {
        let mut status_guard = status.write().await;
        status_guard.total_records = Some(total_records as i32);
    }
    
    let exact_algorithm = ExactMatchingAlgorithm;
    let fuzzy_algorithm = FuzzyMatchingAlgorithm::new(confidence_threshold, FuzzyAlgorithmType::Levenshtein);
    
    for chunk_index in 0..total_chunks {
        let start_record = chunk_index * chunk_size;
        let end_record = ((chunk_index + 1) * chunk_size).min(total_records);
        
        // Update current phase
        let phase = format!("Processing chunk {}/{}", chunk_index + 1, total_chunks);
        update_job_status(status, "processing", 
            ((chunk_index as f64 / total_chunks as f64) * 80.0) as i32, &phase).await;
        
        // Process chunk
        let chunk_results = process_chunk(
            &records_a,
            &records_b,
            matching_rules,
            confidence_threshold,
            start_record,
            end_record,
            &exact_algorithm,
            &fuzzy_algorithm,
        ).await?;
        
        results.extend(chunk_results);
        
        // Update progress
        let progress = ((end_record as f64 / total_records as f64) * 80.0) as i32;
        let processed_records = end_record as i32;
        let matched_records = results.iter().filter(|r| {
            r.confidence_score.unwrap_or(0.0) >= confidence_threshold
        }).count() as i32;
        let unmatched_records = processed_records - matched_records;
        
        update_job_progress(status, progress, processed_records, matched_records, unmatched_records).await;
        
        // Small delay to prevent overwhelming the system
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
    }
    
    Ok(results)
}

/// Process a single chunk of data
async fn process_chunk(
    records_a: &[ReconciliationRecord],
    records_b: &[ReconciliationRecord],
    _matching_rules: &[MatchingRule],
    confidence_threshold: f64,
    start_record: usize,
    end_record: usize,
    exact_algorithm: &dyn MatchingAlgorithm,
    _fuzzy_algorithm: &FuzzyMatchingAlgorithm,
) -> AppResult<Vec<ReconciliationResultType>> {
    let mut results = Vec::new();
    
    // Iterate through the chunk of source A records
    for i in start_record..end_record {
        if i >= records_a.len() {
            break;
        }
        let record_a = &records_a[i];
        
        // Compare with ALL records in source B (Naive O(N^2) for chunk)
        // In production, this should use blocking/indexing (see build_exact_index)
        for record_b in records_b {
            // Try exact match on external_id first
            if let (Some(id_a), Some(id_b)) = (&record_a.external_id, &record_b.external_id) {
                let similarity = exact_algorithm.calculate_similarity(id_a, id_b);
                if similarity >= confidence_threshold {
                    results.push(ReconciliationResultType {
                        id: Uuid::new_v4(),
                        job_id: Uuid::new_v4(),
                        record_a_id: record_a.id,
                        record_b_id: Some(record_b.id),
                        match_type: MatchType::Exact.to_string(),
                        confidence_score: Some(similarity),
                        status: "matched".to_string(),
                        notes: Some("Exact match on external_id".to_string()),
                        created_at: chrono::Utc::now(),
                        updated_at: chrono::Utc::now(),
                        match_details: None,
                        reviewed_by: None,
                    });
                    // Found a match, move to next record_a
                    continue;
                }
            }

            // Fallback to simple amount matching if IDs don't match
            if let (Some(amt_a), Some(amt_b)) = (record_a.amount, record_b.amount) {
                if (amt_a - amt_b).abs() < 0.01 {
                     results.push(ReconciliationResultType {
                        id: Uuid::new_v4(),
                        job_id: Uuid::new_v4(),
                        record_a_id: record_a.id,
                        record_b_id: Some(record_b.id),
                        match_type: MatchType::Manual.to_string(), // Mark as manual/potential
                        confidence_score: Some(0.8),
                        status: "matched".to_string(),
                        notes: Some("Match on amount".to_string()),
                        created_at: chrono::Utc::now(),
                        updated_at: chrono::Utc::now(),
                        match_details: None,
                        reviewed_by: None,
                    });
                }
            }
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
            confidence_score: result.confidence_score,
            status: result.status.clone(),
            notes: result.notes.clone(),
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
    use uuid::Uuid;

    #[tokio::test]
    async fn update_job_status_works() {
        let status = Arc::new(RwLock::new(JobStatus::new()));
        
        update_job_status(&status, "processing", 50, "Processing chunk 1/10").await;
        
        let status_guard = status.read().await;
        assert_eq!(status_guard.status, "processing");
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
    status_guard.update_progress(progress, processed_records, matched_records, unmatched_records);
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
) -> AppResult<Vec<ReconciliationRecord>> {
    let mut conn = db.get_connection()?;
    let records = ReconciliationRecord::belonging_to(data_source)
        .load::<ReconciliationRecord>(&mut conn)
        .map_err(AppError::Database)?;
    Ok(records)
}

