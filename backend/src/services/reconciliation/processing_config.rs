//! Configuration structs for reconciliation processing
//!
//! This module provides configuration structs to reduce function argument complexity

use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::database::Database;
use crate::models::DataSource;
use super::job_management::JobStatus;
use super::types::MatchingRule;
use tokio::sync::mpsc::Sender;
use super::job_management::JobProgress;

/// Configuration for chunked processing
#[derive(Clone)]
pub struct ChunkedProcessingConfig {
    pub db: Database,
    pub job_id: Uuid,
    pub source_a: DataSource,
    pub source_b: DataSource,
    pub matching_rules: Vec<MatchingRule>,
    pub confidence_threshold: f64,
    pub chunk_size: usize,
    pub progress_sender: Option<Sender<JobProgress>>,
    pub status: Arc<RwLock<JobStatus>>,
}

/// Configuration for chunk processing
#[derive(Debug, Clone)]
pub struct ChunkProcessingConfig {
    pub source_a: DataSource,
    pub source_b: DataSource,
    pub matching_rules: Vec<MatchingRule>,
    pub job_id: Uuid,
    pub confidence_threshold: f64,
    pub start_record: usize,
    pub end_record: usize,
}

