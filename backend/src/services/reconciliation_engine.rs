// Reconciliation Engine - Focused Functions (KISS Principle)
// Split from large reconciliation service into single-responsibility functions

use diesel::{RunQueryDsl, QueryDsl, ExpressionMethods, OptionalExtension};
use uuid::Uuid;
use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::utils::string::levenshtein_distance;

use crate::models::DataSource;
use crate::models::schema::data_sources;

/// Extract records from data sources
/// Single responsibility: Data extraction only
pub struct RecordExtractor;

impl RecordExtractor {
    pub fn extract_records(
        db: &Database,
        data_source_id: Uuid,
    ) -> AppResult<Vec<serde_json::Value>> {
        let mut conn = db.get_connection()?;
        
        let data_source = data_sources::table
            .filter(data_sources::id.eq(data_source_id))
            .first::<DataSource>(&mut conn)
            .optional()
            .map_err(AppError::Database)?;
        
        match data_source {
            Some(ds) => {
                // Parse data from file or database
                let file_path = ds.file_path.clone()
                    .ok_or_else(|| AppError::Validation("Data source file path is missing".to_string()))?;
                
                let records: Vec<serde_json::Value> = serde_json::from_str(&file_path)
                    .map_err(|e| AppError::Validation(format!("Failed to parse data source file: {}", e)))?;
                
                Ok(records)
            }
            None => Err(AppError::NotFound("Data source not found".to_string()))
        }
    }
    
    /// Extract records with resilience protection (async version)
    pub async fn extract_records_with_resilience(
        db: &Database,
        data_source_id: Uuid,
        resilience: &Arc<ResilienceManager>,
    ) -> AppResult<Vec<serde_json::Value>> {
        // Use resilience manager for database operations
        let data_source = resilience.execute_database(async {
            let conn = db.get_connection_async().await?;
            
            Ok::<_, AppError>(data_sources::table
                .filter(data_sources::id.eq(data_source_id))
                .first::<DataSource>(&mut *conn)
                .optional()
                .map_err(AppError::Database)?)
        }).await?;
        
        match data_source {
            Some(ds) => {
                // Parse data from file or database
                let file_path = ds.file_path.clone()
                    .ok_or_else(|| AppError::Validation("Data source file path is missing".to_string()))?;
                
                let records: Vec<serde_json::Value> = serde_json::from_str(&file_path)
                    .map_err(|e| AppError::Validation(format!("Failed to parse data source file: {}", e)))?;
                
                Ok(records)
            }
            None => Err(AppError::NotFound("Data source not found".to_string()))
        }
    }
}

/// Calculation of match scores
/// Single responsibility: Confidence scoring only
pub struct ConfidenceCalculator;

impl ConfidenceCalculator {
    pub fn calculate_confidence(
        source_record: &serde_json::Value,
        target_record: &serde_json::Value,
    ) -> f64 {
        let mut score = 0.0;
        let mut total_fields = 0.0;
        
        if let (Some(src_obj), Some(tgt_obj)) = (source_record.as_object(), target_record.as_object()) {
            for (key, src_value) in src_obj {
                total_fields += 1.0;
                
                if let Some(tgt_value) = tgt_obj.get(key) {
                    if src_value == tgt_value {
                        score += 1.0;
                    } else if let (Some(src_str), Some(tgt_str)) = (src_value.as_str(), tgt_value.as_str()) {
                        // Simple similarity check
                        let similarity = Self::string_similarity(src_str, tgt_str);
                        score += similarity;
                    }
                }
            }
        }
        
        if total_fields > 0.0 {
            score / total_fields
        } else {
            0.0
        }
    }
    
    fn string_similarity(a: &str, b: &str) -> f64 {
        if a == b {
            return 1.0;
        }
        
        let longer = a.len().max(b.len());
        if longer == 0 {
            return 1.0;
        }
        
        // Simple Levenshtein-based similarity
        let distance = levenshtein_distance(a, b);
        1.0 - (distance as f64 / longer as f64)
    }
}

/// Find matches between records
/// Single responsibility: Match finding only
pub struct MatchFinder;

impl MatchFinder {
    pub fn find_exact_matches(
        source_records: &[serde_json::Value],
        target_records: &[serde_json::Value],
    ) -> Vec<MatchResult> {
        let mut matches = Vec::new();
        
        for (src_idx, src_record) in source_records.iter().enumerate() {
            for (tgt_idx, tgt_record) in target_records.iter().enumerate() {
                if src_record == tgt_record {
                    matches.push(MatchResult {
                        source_index: src_idx,
                        target_index: tgt_idx,
                        confidence: 1.0,
                        match_type: "exact".to_string(),
                    });
                }
            }
        }
        
        matches
    }
    
    pub fn find_fuzzy_matches(
        source_records: &[serde_json::Value],
        target_records: &[serde_json::Value],
        threshold: f64,
    ) -> Vec<MatchResult> {
        let mut matches = Vec::new();
        
        for (src_idx, src_record) in source_records.iter().enumerate() {
            for (tgt_idx, tgt_record) in target_records.iter().enumerate() {
                let confidence = ConfidenceCalculator::calculate_confidence(src_record, tgt_record);
                
                if confidence >= threshold {
                    matches.push(MatchResult {
                        source_index: src_idx,
                        target_index: tgt_idx,
                        confidence,
                        match_type: "fuzzy".to_string(),
                    });
                }
            }
        }
        
        matches
    }
}

/// Store reconciliation results
/// Single responsibility: Result persistence only
pub struct ResultStorage;

impl ResultStorage {
    pub fn store_results(
        db: &Database,
        job_id: Uuid,
        results: Vec<MatchResult>,
    ) -> AppResult<()> {
        let mut conn = db.get_connection()?;
        
        // Batch insert results
        for result in results {
            // Insert into reconciliation_results table
            diesel::insert_into(crate::models::schema::reconciliation_results::table)
                .values(crate::models::NewReconciliationResult {
                    job_id,
                    record_a_id: Uuid::new_v4(), // Would map to actual record ID
                    record_b_id: Some(Uuid::new_v4()),
                    match_type: result.match_type.clone(),
                    confidence_score: Some(result.confidence),
                    status: "matched".to_string(),
                    notes: Some("".to_string()),
                })
                .execute(&mut conn)
                .map_err(AppError::Database)?;
        }
        
        Ok(())
    }
    
    /// Store results with resilience protection (async version)
    pub async fn store_results_with_resilience(
        db: &Database,
        job_id: Uuid,
        results: Vec<MatchResult>,
        resilience: &Arc<ResilienceManager>,
    ) -> AppResult<()> {
        // Use resilience manager for database operations
        for result in results {
            resilience.execute_database(async {
                let conn = db.get_connection_async().await?;
                
                diesel::insert_into(crate::models::schema::reconciliation_results::table)
                    .values(crate::models::NewReconciliationResult {
                        job_id,
                        record_a_id: Uuid::new_v4(), // Would map to actual record ID
                        record_b_id: Some(Uuid::new_v4()),
                        match_type: result.match_type.clone(),
                        confidence_score: Some(result.confidence),
                        status: "matched".to_string(),
                        notes: Some("".to_string()),
                    })
                    .execute(&mut *conn)
                    .map_err(AppError::Database)?;
                
                Ok::<_, AppError>(())
            }).await?;
        }
        
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct MatchResult {
    pub source_index: usize,
    pub target_index: usize,
    pub confidence: f64,
    pub match_type: String,
}

