//! Unit tests for ReconciliationService
//!
//! This module contains comprehensive tests for the reconciliation service functionality.

use crate::services::reconciliation::ReconciliationService;
use crate::database::Database;
use crate::test_utils::database::setup_test_database;
use uuid::Uuid;

#[cfg(test)]
mod reconciliation_service_tests {
    use super::*;

    /// Test reconciliation service create job
    #[tokio::test]
    async fn test_reconciliation_service_create_job() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);

        let project_id = Uuid::new_v4();
        let source_data_source_id = Uuid::new_v4();
        let target_data_source_id = Uuid::new_v4();

        let job = service.create_reconciliation_job(
            project_id,
            "Test Reconciliation Job".to_string(),
            Some("Test description".to_string()),
            source_data_source_id,
            target_data_source_id,
            0.8,
            None,
        ).await;

        assert!(job.is_ok());
        let job = job.unwrap();
        assert_eq!(job.name, "Test Reconciliation Job");
        assert_eq!(job.status, "pending");
        assert_eq!(job.confidence_threshold, 0.8);
    }

    /// Test reconciliation service get job
    #[tokio::test]
    async fn test_reconciliation_service_get_job() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);

        let project_id = Uuid::new_v4();
        let source_data_source_id = Uuid::new_v4();
        let target_data_source_id = Uuid::new_v4();

        let created_job = service.create_reconciliation_job(
            project_id,
            "Test Job".to_string(),
            None,
            source_data_source_id,
            target_data_source_id,
            0.8,
            None,
        ).await.unwrap();

        let retrieved_job = service.get_reconciliation_job(created_job.id).await;
        assert!(retrieved_job.is_ok());
        let retrieved_job = retrieved_job.unwrap();
        assert_eq!(retrieved_job.id, created_job.id);
        assert_eq!(retrieved_job.name, "Test Job");
    }

    /// Test reconciliation service update job
    #[tokio::test]
    async fn test_reconciliation_service_update_job() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);

        let project_id = Uuid::new_v4();
        let source_data_source_id = Uuid::new_v4();
        let target_data_source_id = Uuid::new_v4();

        let job = service.create_reconciliation_job(
            project_id,
            "Original Name".to_string(),
            None,
            source_data_source_id,
            target_data_source_id,
            0.8,
            None,
        ).await.unwrap();

        let update_result = service.update_reconciliation_job(
            job.id,
            Some("Updated Name".to_string()),
            Some("Updated description".to_string()),
            Some(0.9),
            None,
        ).await;

        assert!(update_result.is_ok());
        let updated_job = service.get_reconciliation_job(job.id).await.unwrap();
        assert_eq!(updated_job.name, "Updated Name");
        assert_eq!(updated_job.description, Some("Updated description".to_string()));
        assert_eq!(updated_job.confidence_threshold, 0.9);
    }

    /// Test reconciliation service get progress
    #[tokio::test]
    async fn test_reconciliation_service_get_progress() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);

        let project_id = Uuid::new_v4();
        let source_data_source_id = Uuid::new_v4();
        let target_data_source_id = Uuid::new_v4();

        let job = service.create_reconciliation_job(
            project_id,
            "Progress Test Job".to_string(),
            None,
            source_data_source_id,
            target_data_source_id,
            0.8,
            None,
        ).await.unwrap();

        let progress = service.get_reconciliation_progress(job.id).await;
        assert!(progress.is_ok());
        let progress = progress.unwrap();
        assert_eq!(progress.job_id, job.id);
        assert_eq!(progress.status, "pending");
        assert_eq!(progress.progress_percentage, 0.0);
    }

    /// Test reconciliation service cancel job
    #[tokio::test]
    async fn test_reconciliation_service_cancel_job() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);

        let project_id = Uuid::new_v4();
        let source_data_source_id = Uuid::new_v4();
        let target_data_source_id = Uuid::new_v4();

        let job = service.create_reconciliation_job(
            project_id,
            "Cancel Test Job".to_string(),
            None,
            source_data_source_id,
            target_data_source_id,
            0.8,
            None,
        ).await.unwrap();

        let cancel_result = service.cancel_reconciliation_job(job.id).await;
        assert!(cancel_result.is_ok());

        let updated_job = service.get_reconciliation_job(job.id).await.unwrap();
        assert_eq!(updated_job.status, "cancelled");
    }

    /// Test reconciliation service get project jobs
    #[tokio::test]
    async fn test_reconciliation_service_get_project_jobs() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);

        let project_id = Uuid::new_v4();
        let source_data_source_id = Uuid::new_v4();
        let target_data_source_id = Uuid::new_v4();

        // Create multiple jobs for the same project
        for i in 0..3 {
            service.create_reconciliation_job(
                project_id,
                format!("Job {}", i),
                None,
                source_data_source_id,
                target_data_source_id,
                0.8,
                None,
            ).await.unwrap();
        }

        let jobs = service.get_project_reconciliation_jobs(project_id, None, None).await;
        assert!(jobs.is_ok());
        let jobs = jobs.unwrap();
        assert_eq!(jobs.jobs.len(), 3);
        assert_eq!(jobs.total, 3);
    }

    /// Test reconciliation service delete job
    #[tokio::test]
    async fn test_reconciliation_service_delete_job() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);

        let project_id = Uuid::new_v4();
        let source_data_source_id = Uuid::new_v4();
        let target_data_source_id = Uuid::new_v4();

        let job = service.create_reconciliation_job(
            project_id,
            "Delete Test Job".to_string(),
            None,
            source_data_source_id,
            target_data_source_id,
            0.8,
            None,
        ).await.unwrap();

        let delete_result = service.delete_reconciliation_job(job.id).await;
        assert!(delete_result.is_ok());

        let get_result = service.get_reconciliation_job(job.id).await;
        assert!(get_result.is_err()); // Should not find the deleted job
    }

    /// Test reconciliation service matching algorithms
    #[tokio::test]
    async fn test_reconciliation_service_matching_algorithms() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);

        // Test exact matching
        let exact_match = service.exact_match("test", "test");
        assert!(exact_match);

        let no_exact_match = service.exact_match("test", "different");
        assert!(!no_exact_match);

        // Test fuzzy matching
        let fuzzy_match = service.fuzzy_match("test", "tset", 0.8);
        assert!(fuzzy_match);

        let no_fuzzy_match = service.fuzzy_match("test", "completely_different", 0.8);
        assert!(!no_fuzzy_match);
    }

    /// Test reconciliation service levenshtein distance
    #[tokio::test]
    async fn test_reconciliation_service_levenshtein_distance() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);

        let distance = service.levenshtein_distance("kitten", "sitting");
        assert_eq!(distance, 3);

        let same_distance = service.levenshtein_distance("test", "test");
        assert_eq!(same_distance, 0);

        let one_distance = service.levenshtein_distance("test", "tset");
        assert_eq!(one_distance, 2);
    }
}