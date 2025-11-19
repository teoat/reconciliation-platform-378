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

    /// Test reconciliation core matching algorithms comprehensive
    #[tokio::test]
    async fn test_reconciliation_core_matching_algorithms_comprehensive() {
        use crate::services::reconciliation::matching::{
            ExactMatchingAlgorithm, ContainsMatchingAlgorithm, FuzzyMatchingAlgorithm,
            FuzzyAlgorithmType, MatchingAlgorithm, match_records
        };
        use crate::services::reconciliation::types::ReconciliationRecord;

        // Test Exact Matching Algorithm
        let exact_alg = ExactMatchingAlgorithm;

        // Exact matches
        assert_eq!(exact_alg.calculate_similarity("ABC123", "ABC123"), 1.0);
        assert_eq!(exact_alg.calculate_similarity("invoice-001", "invoice-001"), 1.0);

        // No matches
        assert_eq!(exact_alg.calculate_similarity("ABC123", "DEF456"), 0.0);
        assert_eq!(exact_alg.calculate_similarity("invoice-001", "receipt-001"), 0.0);

        // Case sensitivity
        assert_eq!(exact_alg.calculate_similarity("ABC123", "abc123"), 0.0);

        // Test Contains Matching Algorithm
        let contains_alg = ContainsMatchingAlgorithm;

        // Contains matches
        assert_eq!(contains_alg.calculate_similarity("Invoice-12345", "12345"), 0.8);
        assert_eq!(contains_alg.calculate_similarity("ABC-DEF", "DEF"), 0.8);
        assert_eq!(contains_alg.calculate_similarity("DEF", "ABC-DEF"), 0.8);

        // No contains matches
        assert_eq!(contains_alg.calculate_similarity("ABC123", "DEF456"), 0.0);
        assert_eq!(contains_alg.calculate_similarity("invoice", "receipt"), 0.0);

        // Test Fuzzy Matching Algorithm - Levenshtein
        let fuzzy_levenshtein = FuzzyMatchingAlgorithm::new(0.7, FuzzyAlgorithmType::Levenshtein);

        // Exact matches
        assert_eq!(fuzzy_levenshtein.calculate_similarity("test", "test"), 1.0);

        // Close matches
        let sim1 = fuzzy_levenshtein.calculate_similarity("invoice-123", "invoice123");
        assert!(sim1 > 0.8); // Should be high similarity

        let sim2 = fuzzy_levenshtein.calculate_similarity("kitten", "sitting");
        assert!(sim2 > 0.5); // Should be moderate similarity

        // Different strings
        let sim3 = fuzzy_levenshtein.calculate_similarity("invoice", "receipt");
        assert!(sim3 < 0.5); // Should be low similarity

        // Test Fuzzy Matching Algorithm - Jaro-Winkler
        let fuzzy_jaro = FuzzyMatchingAlgorithm::new(0.7, FuzzyAlgorithmType::JaroWinkler);

        // Jaro-Winkler should give good results for similar strings
        let jaro_sim = fuzzy_jaro.calculate_similarity("invoice", "invoce"); // typo
        assert!(jaro_sim > 0.8);

        // Test record matching
        let mut source_fields = std::collections::HashMap::new();
        source_fields.insert("id".to_string(), serde_json::json!("INV001"));
        source_fields.insert("amount".to_string(), serde_json::json!(100.50));
        source_fields.insert("description".to_string(), serde_json::json!("Invoice for services"));

        let mut target_fields = std::collections::HashMap::new();
        target_fields.insert("id".to_string(), serde_json::json!("INV001"));
        target_fields.insert("amount".to_string(), serde_json::json!(100.50));
        target_fields.insert("description".to_string(), serde_json::json!("Invoice for services"));

        let source_record = ReconciliationRecord {
            id: uuid::Uuid::new_v4(),
            fields: source_fields,
        };

        let target_record = ReconciliationRecord {
            id: uuid::Uuid::new_v4(),
            fields: target_fields,
        };

        let fields = vec!["id".to_string(), "amount".to_string(), "description".to_string()];

        // Test exact matching on records
        let exact_result = match_records(&source_record, &target_record, &exact_alg, &fields, 0.8);
        assert!(exact_result.is_some());
        let result = exact_result.unwrap();
        assert_eq!(result.confidence_score, 1.0);
        assert_eq!(result.matching_fields.len(), 3);

        // Test with partial match
        let mut partial_target_fields = target_fields.clone();
        partial_target_fields.insert("description".to_string(), serde_json::json!("Different description"));

        let partial_target_record = ReconciliationRecord {
            id: uuid::Uuid::new_v4(),
            fields: partial_target_fields,
        };

        let partial_result = match_records(&source_record, &partial_target_record, &exact_alg, &fields, 0.8);
        assert!(partial_result.is_none()); // Exact match should fail

        let fuzzy_result = match_records(&source_record, &partial_target_record, &fuzzy_levenshtein, &fields, 0.3);
        assert!(fuzzy_result.is_some()); // Fuzzy should succeed
    }

    /// Test reconciliation processing chunk logic
    #[tokio::test]
    async fn test_reconciliation_processing_chunk_logic() {
        use crate::services::reconciliation::processing::process_chunk;
        use crate::services::reconciliation::types::MatchingRule;
        use crate::models::DataSource;
        use std::sync::Arc;
        use tokio::sync::RwLock;
        use crate::services::reconciliation::job_management::JobStatus;

        let (db, _) = setup_test_database().await;

        // Create test data sources
        let source_a = DataSource {
            id: uuid::Uuid::new_v4(),
            project_id: uuid::Uuid::new_v4(),
            name: "Source A".to_string(),
            source_type: "csv".to_string(),
            file_path: Some("test_a.csv".to_string()),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        let source_b = DataSource {
            id: uuid::Uuid::new_v4(),
            project_id: source_a.project_id,
            name: "Source B".to_string(),
            source_type: "csv".to_string(),
            file_path: Some("test_b.csv".to_string()),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        // Create matching rules
        let matching_rules = vec![
            MatchingRule {
                field_name: "id".to_string(),
                weight: 1.0,
                algorithm: crate::services::reconciliation::types::MatchingAlgorithm::Exact,
            }
        ];

        let job_id = uuid::Uuid::new_v4();
        let confidence_threshold = 0.8;
        let start_record = 0;
        let end_record = 10;

        let exact_algorithm = crate::services::reconciliation::matching::ExactMatchingAlgorithm;
        let fuzzy_algorithm = crate::services::reconciliation::matching::FuzzyMatchingAlgorithm::new(
            confidence_threshold,
            crate::services::reconciliation::types::FuzzyAlgorithmType::Levenshtein
        );

        // Test processing chunk (this will fail due to missing data, but tests the logic)
        let result = process_chunk(
            &source_a,
            &source_b,
            &matching_rules,
            job_id,
            confidence_threshold,
            start_record,
            end_record,
            &exact_algorithm,
            &fuzzy_algorithm,
        ).await;

        // Should return empty results for non-existent data sources
        assert!(result.is_ok());
        let results = result.unwrap();
        assert_eq!(results.len(), 0);
    }

    /// Test reconciliation job status updates
    #[tokio::test]
    async fn test_reconciliation_job_status_updates() {
        use crate::services::reconciliation::processing::update_job_status;
        use crate::services::reconciliation::job_management::JobStatus;
        use std::sync::Arc;
        use tokio::sync::RwLock;

        let status = Arc::new(RwLock::new(JobStatus {
            job_id: uuid::Uuid::new_v4(),
            status: "pending".to_string(),
            progress_percentage: 0,
            current_phase: "Starting".to_string(),
            total_records: None,
            processed_records: 0,
            matched_records: 0,
            unmatched_records: 0,
            error_message: None,
            started_at: None,
            completed_at: None,
        }));

        // Test status update
        update_job_status(&status, "processing", 25, "Processing records").await;

        let updated_status = status.read().await;
        assert_eq!(updated_status.status, "processing");
        assert_eq!(updated_status.progress_percentage, 25);
        assert_eq!(updated_status.current_phase, "Processing records");
    }

    /// Test reconciliation result saving
    #[tokio::test]
    async fn test_reconciliation_result_saving() {
        use crate::services::reconciliation::processing::save_reconciliation_results;
        use crate::models::ReconciliationResult;

        let (db, _) = setup_test_database().await;
        let job_id = uuid::Uuid::new_v4();

        // Create test results
        let results = vec![
            ReconciliationResult {
                id: uuid::Uuid::new_v4(),
                job_id,
                source_record_id: uuid::Uuid::new_v4(),
                target_record_id: Some(uuid::Uuid::new_v4()),
                match_type: MatchType::Exact,
                confidence_score: Some(bigdecimal::BigDecimal::from(1)),
                matching_fields: Some(vec!["id".to_string()]),
                differences: None,
                created_at: chrono::Utc::now(),
                updated_at: chrono::Utc::now(),
            }
        ];

        // Test saving results
        let save_result = save_reconciliation_results(&db, &results).await;
        assert!(save_result.is_ok());

        // Verify results were saved (count should be 1)
        let saved_count = save_result.unwrap();
        assert_eq!(saved_count, 1);
    }

    /// Test reconciliation record loading from data sources
    #[tokio::test]
    async fn test_reconciliation_record_loading() {
        use crate::services::reconciliation::processing::load_records_from_data_source;
        use crate::models::DataSource;

        let (db, _) = setup_test_database().await;

        // Create test data source
        let data_source = DataSource {
            id: uuid::Uuid::new_v4(),
            project_id: uuid::Uuid::new_v4(),
            name: "Test Source".to_string(),
            source_type: "csv".to_string(),
            file_path: Some("nonexistent.csv".to_string()),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        // Test loading records (should handle missing file gracefully)
        let result = load_records_from_data_source(&db, &data_source).await;
        assert!(result.is_ok());
        let records = result.unwrap();
        assert_eq!(records.len(), 0); // No records for nonexistent file
    }

    /// Test reconciliation job lifecycle edge cases
    #[tokio::test]
    async fn test_reconciliation_job_lifecycle_edge_cases() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);

        // Test operations on non-existent job
        let nonexistent_id = uuid::Uuid::new_v4();

        let get_result = service.get_reconciliation_job(nonexistent_id).await;
        assert!(get_result.is_err());

        let update_result = service.update_reconciliation_job(
            nonexistent_id,
            Some("Updated".to_string()),
            None,
            Some(0.9),
            None,
        ).await;
        assert!(update_result.is_err());

        let cancel_result = service.cancel_reconciliation_job(nonexistent_id, uuid::Uuid::new_v4()).await;
        assert!(cancel_result.is_err());

        let delete_result = service.delete_reconciliation_job(nonexistent_id).await;
        assert!(delete_result.is_err());

        let start_result = service.start_reconciliation_job(nonexistent_id).await;
        assert!(start_result.is_err());

        let stop_result = service.stop_reconciliation_job(nonexistent_id).await;
        assert!(stop_result.is_err());
    }

    /// Test reconciliation matching with empty fields
    #[tokio::test]
    async fn test_reconciliation_matching_empty_fields() {
        use crate::services::reconciliation::matching::{match_records, ExactMatchingAlgorithm};
        use crate::services::reconciliation::types::ReconciliationRecord;

        let exact_alg = ExactMatchingAlgorithm;

        // Test with empty fields
        let source_record = ReconciliationRecord {
            id: uuid::Uuid::new_v4(),
            fields: std::collections::HashMap::new(),
        };

        let target_record = ReconciliationRecord {
            id: uuid::Uuid::new_v4(),
            fields: std::collections::HashMap::new(),
        };

        let fields = vec!["id".to_string(), "amount".to_string()];

        // Should return None for empty records
        let result = match_records(&source_record, &target_record, &exact_alg, &fields, 0.8);
        assert!(result.is_none());
    }

    /// Test reconciliation progress calculation
    #[tokio::test]
    async fn test_reconciliation_progress_calculation() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);

        let project_id = uuid::Uuid::new_v4();
        let source_data_source_id = uuid::Uuid::new_v4();
        let target_data_source_id = uuid::Uuid::new_v4();

        let job = service.create_reconciliation_job(
            project_id,
            "Progress Test".to_string(),
            None,
            source_data_source_id,
            target_data_source_id,
            0.8,
            None,
        ).await.unwrap();

        // Test progress retrieval
        let progress = service.get_reconciliation_progress(job.id).await;
        assert!(progress.is_ok());

        let progress = progress.unwrap();
        assert_eq!(progress.job_id, job.id);
        assert_eq!(progress.status, "pending");
        assert_eq!(progress.progress_percentage, 0.0);
    }

    /// Test reconciliation batch operations
    #[tokio::test]
    async fn test_reconciliation_batch_operations() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);

        let project_id = uuid::Uuid::new_v4();
        let source_data_source_id = uuid::Uuid::new_v4();
        let target_data_source_id = uuid::Uuid::new_v4();

        let job = service.create_reconciliation_job(
            project_id,
            "Batch Test".to_string(),
            None,
            source_data_source_id,
            target_data_source_id,
            0.8,
            None,
        ).await.unwrap();

        // Test batch approve matches (should work even with no matches)
        let approve_result = service.batch_approve_matches(job.id, &[]).await;
        assert!(approve_result.is_ok());

        // Test update match (should work even with invalid IDs)
        let update_result = service.update_match(job.id, uuid::Uuid::new_v4(), None, None).await;
        assert!(update_result.is_ok()); // Should not error for non-existent matches
    }

    /// Test reconciliation export functionality
    #[tokio::test]
    async fn test_reconciliation_export_functionality() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);

        let project_id = uuid::Uuid::new_v4();
        let source_data_source_id = uuid::Uuid::new_v4();
        let target_data_source_id = uuid::Uuid::new_v4();

        let job = service.create_reconciliation_job(
            project_id,
            "Export Test".to_string(),
            None,
            source_data_source_id,
            target_data_source_id,
            0.8,
            None,
        ).await.unwrap();

        // Test export (should work even with no results)
        let export_result = service.export_job_results(job.id, "json").await;
        assert!(export_result.is_ok());

        let export_data = export_result.unwrap();
        assert!(export_data.contains("results") || export_data.is_empty());
    }
}