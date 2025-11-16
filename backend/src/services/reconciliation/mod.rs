//! Reconciliation service module
//! 
//! This module provides the core reconciliation engine split into focused modules:
//! - `matching.rs`: Matching algorithms (exact, fuzzy, contains)
//! - `processing.rs`: Processing logic (chunking, result saving)
//! - `job_management.rs`: Job lifecycle management
//! - `types.rs`: Common types and data structures

pub mod matching;
pub mod processing;
pub mod job_management;
pub mod service;
pub mod types;

pub use matching::{MatchingAlgorithm, ExactMatchingAlgorithm, ContainsMatchingAlgorithm, FuzzyMatchingAlgorithm, build_exact_index, match_records};
pub use types::FuzzyAlgorithmType;
pub use processing::{process_data_sources_chunked, save_reconciliation_results, update_job_status, update_job_progress, send_progress};
pub use job_management::{JobProcessor, JobHandle, JobProgress, JobStatus};
pub use types::*;

// Re-export for backward compatibility
use crate::database::Database;
use crate::errors::AppResult;
use uuid::Uuid;
use std::sync::Arc;




use crate::models::{
    ReconciliationJob, NewReconciliationJob, UpdateReconciliationJob,
    NewReconciliationResult,
    DataSource, MatchType,
};


/// Reconciliation service - Main entry point
pub struct ReconciliationService {
    db: Database,
    job_processor: Arc<JobProcessor>,
}

// Include all service methods from original file
// This file acts as a compatibility layer during refactoring

pub use self::processing::*;
pub use self::job_management::*;

// Re-export for backward compatibility
impl ReconciliationService {
    pub fn new(db: Database) -> Self {
        let job_processor = Arc::new(JobProcessor::new(5, 100)); // 5 concurrent jobs, 100 records per chunk
        Self { 
            db,
            job_processor,
        }
    }
    
    pub fn new_with_ws(db: Database, _ws_server: actix::Addr<crate::websocket::WsServer>) -> Self {
        let job_processor = Arc::new(JobProcessor::new(5, 100));
        Self { db, job_processor }
    }
    
    /// Create a new reconciliation job
    pub async fn create_reconciliation_job(
        &self,
        user_id: Uuid,
        request: CreateReconciliationJobRequest,
    ) -> AppResult<ReconciliationJobStatus> {
        // Delegate to service module
        service::create_reconciliation_job_impl(&self.db, user_id, request).await
    }
}

// Forward all service methods to service module
pub use service::*;

// Include all service methods from service.rs as methods on ReconciliationService
impl ReconciliationService {
    pub async fn get_active_jobs(&self) -> AppResult<Vec<Uuid>> {
        service::get_active_jobs(self).await
    }

    pub async fn get_queued_jobs(&self) -> AppResult<Vec<Uuid>> {
        service::get_queued_jobs(self).await
    }

    pub async fn get_reconciliation_progress(
        &self,
        job_id: Uuid,
        user_id: Uuid,
    ) -> AppResult<JobProgress> {
        service::get_reconciliation_progress(self, job_id, user_id).await
    }

    pub async fn cancel_reconciliation_job(
        &self,
        job_id: Uuid,
        user_id: Uuid,
    ) -> AppResult<()> {
        service::cancel_reconciliation_job(self, job_id, user_id).await
    }

    pub async fn get_project_reconciliation_jobs(
        &self,
        project_id: Uuid,
    ) -> AppResult<Vec<ReconciliationJob>> {
        service::get_project_reconciliation_jobs(self, project_id).await
    }

    pub async fn get_reconciliation_job_status(
        &self,
        job_id: Uuid,
    ) -> AppResult<ReconciliationJobStatus> {
        service::get_reconciliation_job_status(self, job_id).await
    }

    pub async fn update_reconciliation_job(
        &self,
        job_id: Uuid,
        name: Option<String>,
        description: Option<String>,
        confidence_threshold: Option<f64>,
        _settings: Option<serde_json::Value>,
    ) -> AppResult<ReconciliationJob> {
        service::update_reconciliation_job(self, job_id, name, description, confidence_threshold, _settings).await
    }

    pub async fn delete_reconciliation_job(&self, job_id: Uuid) -> AppResult<()> {
        service::delete_reconciliation_job(self, job_id).await
    }

    pub async fn start_reconciliation_job(&self, job_id: Uuid) -> AppResult<()> {
        service::start_reconciliation_job(self, job_id).await
    }

    pub async fn stop_reconciliation_job(&self, job_id: Uuid) -> AppResult<()> {
        service::stop_reconciliation_job(self, job_id).await
    }

    pub async fn get_reconciliation_results(
        &self,
        job_id: Uuid,
        page: Option<i64>,
        per_page: Option<i64>,
        _lean: Option<bool>,
    ) -> AppResult<Vec<ReconciliationResultDetail>> {
        service::get_reconciliation_results(self, job_id, page, per_page, _lean).await
    }

    pub async fn batch_approve_matches(
        &self,
        user_id: Uuid,
        resolves: Vec<service::MatchResolve>,
    ) -> AppResult<service::BatchApprovalResult> {
        service::batch_approve_matches(self, user_id, resolves).await
    }

    pub async fn update_match(
        &self,
        user_id: Uuid,
        match_id: Uuid,
        status: Option<&str>,
        confidence_score: Option<f64>,
        reviewed_by: Option<&str>,
    ) -> AppResult<service::UpdatedMatch> {
        service::update_match(self, user_id, match_id, status, confidence_score, reviewed_by).await
    }
}

