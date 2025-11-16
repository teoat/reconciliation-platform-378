//! Types and data structures for reconciliation service

use chrono::DateTime;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

use crate::models::MatchType;

/// Reconciliation record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReconciliationRecord {
    pub id: Uuid,
    pub source_id: String,
    pub fields: HashMap<String, serde_json::Value>,
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Matching result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchingResult {
    pub source_record: ReconciliationRecord,
    pub target_record: ReconciliationRecord,
    pub confidence_score: f64,
    pub match_type: MatchType,
    pub matching_fields: Vec<String>,
    pub differences: Vec<FieldDifference>,
}

/// Field difference
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldDifference {
    pub field_name: String,
    pub source_value: serde_json::Value,
    pub target_value: serde_json::Value,
    pub difference_type: DifferenceType,
    pub similarity_score: f64,
}

/// Difference types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DifferenceType {
    Exact,
    Similar,
    Different,
    Missing,
}

/// Fuzzy algorithm types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FuzzyAlgorithmType {
    Levenshtein,
    JaroWinkler,
    Jaccard,
    Cosine,
    Soundex,
    Metaphone,
}

/// Matching rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchingRule {
    pub field: String,
    pub rule_type: MatchingRuleType,
    pub weight: f64,
    pub threshold: f64,
}

/// Matching rule types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MatchingRuleType {
    Exact,
    Fuzzy,
    Contains,
    NumericRange,
    DateRange,
}

/// Create reconciliation job request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateReconciliationJobRequest {
    pub project_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub source_a_id: Uuid,
    pub source_b_id: Uuid,
    pub matching_rules: Vec<MatchingRule>,
    pub confidence_threshold: f64,
}

/// Reconciliation job status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReconciliationJobStatus {
    pub id: Uuid,
    pub name: String,
    pub status: String,
    pub progress: i32,
    pub total_records: Option<i32>,
    pub processed_records: i32,
    pub matched_records: i32,
    pub unmatched_records: i32,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
}

/// Reconciliation result detail
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReconciliationResultDetail {
    pub id: Uuid,
    pub job_id: Uuid,
    pub record_a_id: Uuid,
    pub record_b_id: Option<Uuid>,
    pub match_type: String,
    pub confidence_score: Option<f64>,
    pub status: String,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
