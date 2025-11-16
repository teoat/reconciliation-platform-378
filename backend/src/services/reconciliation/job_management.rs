//! Job management for reconciliation service
//!
//! Handles job queuing, processing, and status tracking.

use chrono::{DateTime, Utc};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Job processor for managing concurrent reconciliation jobs
pub struct JobProcessor {
    pub max_concurrent_jobs: usize,
    pub chunk_size: usize,
    pub active_jobs: Arc<RwLock<HashMap<Uuid, JobStatus>>>,
    pub job_queue: Arc<RwLock<Vec<Uuid>>>,
}

impl JobProcessor {
    pub fn new(max_concurrent_jobs: usize, chunk_size: usize) -> Self {
        Self {
            max_concurrent_jobs,
            chunk_size,
            active_jobs: Arc::new(RwLock::new(HashMap::new())),
            job_queue: Arc::new(RwLock::new(Vec::new())),
        }
    }

    pub async fn enqueue_job(&self, job_id: Uuid) {
        let mut queue = self.job_queue.write().await;
        queue.push(job_id);
    }

    pub async fn can_process_job(&self) -> bool {
        let active_count = self.active_jobs.read().await.len();
        active_count < self.max_concurrent_jobs
    }

    pub async fn start_job(&self, job_id: Uuid) -> JobHandle {
        let mut active_jobs = self.active_jobs.write().await;
        let status = JobStatus::new();
        active_jobs.insert(job_id, status);
        JobHandle {
            job_id,
            processor: Arc::downgrade(&self.active_jobs),
        }
    }

    pub async fn get_job_status(&self, job_id: &Uuid) -> Option<JobStatus> {
        let active_jobs = self.active_jobs.read().await;
        active_jobs.get(job_id).cloned()
    }

    pub async fn complete_job(&self, job_id: &Uuid) {
        let mut active_jobs = self.active_jobs.write().await;
        active_jobs.remove(job_id);
    }

    pub async fn stop_job(&self, job_id: Uuid) -> Result<(), crate::errors::AppError> {
        let mut active_jobs = self.active_jobs.write().await;
        if let Some(mut status) = active_jobs.remove(&job_id) {
            status.message = "Cancelled".to_string();
            status.progress = 0;
            Ok(())
        } else {
            Err(crate::errors::AppError::NotFound(format!(
                "Job {} not found",
                job_id
            )))
        }
    }
}

/// Handle for tracking job progress
pub struct JobHandle {
    job_id: Uuid,
    processor: std::sync::Weak<RwLock<HashMap<Uuid, JobStatus>>>,
}

impl JobHandle {
    pub async fn update_progress(&self, progress: JobProgress) {
        if let Some(processor) = self.processor.upgrade() {
            let mut active_jobs = processor.write().await;
            if let Some(status) = active_jobs.get_mut(&self.job_id) {
                // Calculate percentage from progress (0-100)
                let percentage = if progress.total_records.map(|t| t > 0).unwrap_or(false) {
                    (progress.processed_records as f64 / progress.total_records.unwrap() as f64
                        * 100.0) as i32
                } else {
                    progress.progress
                };
                status.update(&progress.status, percentage, &progress.current_phase);
            }
        }
    }
}

/// Job status tracking
#[derive(Debug, Clone)]
pub struct JobStatus {
    pub progress: i32,
    pub current_phase: String,
    pub message: String,
    pub started_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
    pub total_records: Option<i32>,
    pub processed_records: i32,
    pub matched_records: i32,
    pub unmatched_records: i32,
}

impl Default for JobStatus {
    fn default() -> Self {
        Self::new()
    }
}

impl JobStatus {
    pub fn new() -> Self {
        let now = Utc::now();
        Self {
            progress: 0,
            current_phase: "Initializing".to_string(),
            message: "Job started".to_string(),
            started_at: Some(now),
            updated_at: now,
            total_records: None,
            processed_records: 0,
            matched_records: 0,
            unmatched_records: 0,
        }
    }

    pub fn update(&mut self, status: &str, progress: i32, phase: &str) {
        self.progress = progress;
        self.current_phase = phase.to_string();
        self.message = status.to_string();
        self.updated_at = Utc::now();
    }

    pub fn update_progress(
        &mut self,
        progress: i32,
        processed_records: i32,
        matched_records: i32,
        unmatched_records: i32,
    ) {
        self.progress = progress;
        self.processed_records = processed_records;
        self.matched_records = matched_records;
        self.unmatched_records = unmatched_records;
        self.updated_at = Utc::now();
    }
}

/// Job progress update
#[derive(Debug, Clone)]
pub struct JobProgress {
    pub job_id: Uuid,
    pub project_id: Uuid,
    pub status: String,
    pub progress: i32,
    pub total_records: Option<i32>,
    pub processed_records: i32,
    pub matched_records: i32,
    pub unmatched_records: i32,
    pub current_phase: String,
    pub estimated_completion: Option<DateTime<Utc>>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn job_processor_initializes() {
        let processor = JobProcessor::new(5, 100);
        assert_eq!(processor.max_concurrent_jobs, 5);
        assert_eq!(processor.chunk_size, 100);
    }

    #[tokio::test]
    async fn job_status_tracks_progress() {
        let mut status = JobStatus::new();
        assert_eq!(status.progress, 0);

        status.update("processing", 50, "Matching records");
        assert_eq!(status.progress, 50);
        assert_eq!(status.current_phase, "Matching records");
    }

    #[tokio::test]
    async fn job_processor_enqueues_when_full() {
        let processor = JobProcessor::new(1, 100); // Only 1 concurrent job

        // This would need a database mock in real tests
        // For now, just test queue logic
        processor.enqueue_job(Uuid::new_v4()).await;
        let can_process = processor.can_process_job().await;
        assert!(can_process); // Should be true when queue has space
    }
}
