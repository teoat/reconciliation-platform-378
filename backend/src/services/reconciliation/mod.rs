//! Reconciliation service module
//!
//! This module provides the core reconciliation engine split into focused modules:
//! - `matching.rs`: Matching algorithms (exact, fuzzy, contains)
//! - `processing.rs`: Processing logic (chunking, result saving)
//! - `job_management.rs`: Job lifecycle management
//! - `types.rs`: Common types and data structures

pub mod job_management;
pub mod matching;
pub mod processing;
pub mod processing_config;
pub mod service;
pub mod types;

pub use job_management::{JobHandle, JobProcessor, JobProgress, JobStatus};
pub use matching::{
    build_exact_index, match_records, ContainsMatchingAlgorithm, ExactMatchingAlgorithm,
    FuzzyMatchingAlgorithm, MatchingAlgorithm,
};
pub use processing::{
    process_data_sources_chunked, save_reconciliation_results, send_progress, update_job_progress,
    update_job_status,
};
pub use types::FuzzyAlgorithmType;
pub use types::*;

// Re-export for backward compatibility
use crate::database::Database;
use crate::errors::AppResult;
use std::sync::Arc;
use uuid::Uuid;

use crate::models::ReconciliationJob;

/// Reconciliation service - Main entry point
pub struct ReconciliationService {
    db: Database,
    job_processor: Arc<JobProcessor>,
}

// Include all service methods from original file
// This file acts as a compatibility layer during refactoring

pub use self::processing::*;

// Re-export for backward compatibility
impl ReconciliationService {
    pub fn new(db: Database) -> Self {
        // Get timeout from environment or use default (2 hours)
        // Improved error handling with logging for invalid values
        let timeout_seconds = match std::env::var("RECONCILIATION_JOB_TIMEOUT_SECONDS") {
            Ok(val) => {
                match val.parse::<u64>() {
                    Ok(parsed) if parsed > 0 => {
                        log::info!("Using RECONCILIATION_JOB_TIMEOUT_SECONDS={} from environment", parsed);
                        parsed
                    }
                    Ok(0) => {
                        log::warn!(
                            "RECONCILIATION_JOB_TIMEOUT_SECONDS is 0, using default: {}",
                            job_management::DEFAULT_JOB_TIMEOUT_SECONDS
                        );
                        job_management::DEFAULT_JOB_TIMEOUT_SECONDS
                    }
                    Ok(parsed) => {
                        log::warn!(
                            "RECONCILIATION_JOB_TIMEOUT_SECONDS={} is invalid (must be > 0), using default: {}",
                            parsed,
                            job_management::DEFAULT_JOB_TIMEOUT_SECONDS
                        );
                        job_management::DEFAULT_JOB_TIMEOUT_SECONDS
                    }
                    Err(e) => {
                        log::warn!(
                            "Failed to parse RECONCILIATION_JOB_TIMEOUT_SECONDS='{}': {}. Using default: {}",
                            val,
                            e,
                            job_management::DEFAULT_JOB_TIMEOUT_SECONDS
                        );
                        job_management::DEFAULT_JOB_TIMEOUT_SECONDS
                    }
                }
            }
            Err(std::env::VarError::NotPresent) => {
                log::debug!(
                    "RECONCILIATION_JOB_TIMEOUT_SECONDS not set, using default: {}",
                    job_management::DEFAULT_JOB_TIMEOUT_SECONDS
                );
                job_management::DEFAULT_JOB_TIMEOUT_SECONDS
            }
            Err(e) => {
                log::warn!(
                    "Error reading RECONCILIATION_JOB_TIMEOUT_SECONDS: {}. Using default: {}",
                    e,
                    job_management::DEFAULT_JOB_TIMEOUT_SECONDS
                );
                job_management::DEFAULT_JOB_TIMEOUT_SECONDS
            }
        };
        
        let job_processor = Arc::new(JobProcessor::new_with_timeout(5, 100, timeout_seconds));
        let service = Self { db, job_processor };
        
        // Start background task to monitor for stuck jobs
        service.start_timeout_monitor();
        
        service
    }

    pub fn new_with_ws(db: Database, _ws_server: actix::Addr<crate::websocket::WsServer>) -> Self {
        // Get timeout from environment or use default (2 hours)
        // Improved error handling with logging for invalid values
        let timeout_seconds = match std::env::var("RECONCILIATION_JOB_TIMEOUT_SECONDS") {
            Ok(val) => {
                match val.parse::<u64>() {
                    Ok(parsed) if parsed > 0 => {
                        log::info!("Using RECONCILIATION_JOB_TIMEOUT_SECONDS={} from environment", parsed);
                        parsed
                    }
                    Ok(0) => {
                        log::warn!(
                            "RECONCILIATION_JOB_TIMEOUT_SECONDS is 0, using default: {}",
                            job_management::DEFAULT_JOB_TIMEOUT_SECONDS
                        );
                        job_management::DEFAULT_JOB_TIMEOUT_SECONDS
                    }
                    Ok(parsed) => {
                        log::warn!(
                            "RECONCILIATION_JOB_TIMEOUT_SECONDS={} is invalid (must be > 0), using default: {}",
                            parsed,
                            job_management::DEFAULT_JOB_TIMEOUT_SECONDS
                        );
                        job_management::DEFAULT_JOB_TIMEOUT_SECONDS
                    }
                    Err(e) => {
                        log::warn!(
                            "Failed to parse RECONCILIATION_JOB_TIMEOUT_SECONDS='{}': {}. Using default: {}",
                            val,
                            e,
                            job_management::DEFAULT_JOB_TIMEOUT_SECONDS
                        );
                        job_management::DEFAULT_JOB_TIMEOUT_SECONDS
                    }
                }
            }
            Err(std::env::VarError::NotPresent) => {
                log::debug!(
                    "RECONCILIATION_JOB_TIMEOUT_SECONDS not set, using default: {}",
                    job_management::DEFAULT_JOB_TIMEOUT_SECONDS
                );
                job_management::DEFAULT_JOB_TIMEOUT_SECONDS
            }
            Err(e) => {
                log::warn!(
                    "Error reading RECONCILIATION_JOB_TIMEOUT_SECONDS: {}. Using default: {}",
                    e,
                    job_management::DEFAULT_JOB_TIMEOUT_SECONDS
                );
                job_management::DEFAULT_JOB_TIMEOUT_SECONDS
            }
        };
        
        let job_processor = Arc::new(JobProcessor::new_with_timeout(5, 100, timeout_seconds));
        let service = Self { db, job_processor };
        
        // Start background task to monitor for stuck jobs
        service.start_timeout_monitor();
        
        service
    }
    
    /// Start background task to periodically check for stuck jobs
    fn start_timeout_monitor(&self) {
        let processor = Arc::clone(&self.job_processor);
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(60)); // Check every minute
            loop {
                interval.tick().await;
                
                let stuck_jobs = processor.check_stuck_jobs().await;
                if !stuck_jobs.is_empty() {
                    log::warn!("Found {} stuck job(s), forcing timeout", stuck_jobs.len());
                    for job_id in stuck_jobs {
                        if let Err(e) = processor.timeout_job(job_id).await {
                            log::error!("Failed to timeout stuck job {}: {}", job_id, e);
                        } else {
                            log::info!("Successfully timed out stuck job {}", job_id);
                        }
                    }
                }
            }
        });
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

    pub async fn cancel_reconciliation_job(&self, job_id: Uuid, user_id: Uuid) -> AppResult<()> {
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
        service::update_reconciliation_job(
            self,
            job_id,
            name,
            description,
            confidence_threshold,
            _settings,
        )
        .await
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
        service::update_match(
            self,
            user_id,
            match_id,
            status,
            confidence_score,
            reviewed_by,
        )
        .await
    }
}
