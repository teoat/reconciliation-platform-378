#[cfg(test)]
mod unit_tests {
    use super::*;
    use crate::test_utils::*;
    use crate::handlers::types::ReconciliationResultsQuery;

    #[test]
    fn reconciliation_results_query_defaults() {
        let q = ReconciliationResultsQuery { page: None, per_page: None, match_type: None, lean: None };
        assert!(q.page.is_none());
        assert!(q.per_page.is_none());
        assert!(q.match_type.is_none());
        assert!(q.lean.is_none());
    }

    /// Test reconciliation service matching algorithms
    #[tokio::test]
    async fn test_reconciliation_service_matching_algorithms() {
        use crate::services::reconciliation::{ExactMatchingAlgorithm, FuzzyMatchingAlgorithm, ContainsMatchingAlgorithm};

        // Test exact matching
        let exact_algorithm = ExactMatchingAlgorithm;
        assert_eq!(exact_algorithm.calculate_similarity("hello", "hello"), 1.0);
        assert_eq!(exact_algorithm.calculate_similarity("Hello", "hello"), 1.0);
        assert_eq!(exact_algorithm.calculate_similarity("hello", "world"), 0.0);

        // Test fuzzy matching
        let fuzzy_algorithm = FuzzyMatchingAlgorithm::new(0.7);
        assert_eq!(fuzzy_algorithm.calculate_similarity("hello", "hello"), 1.0);
        assert!(fuzzy_algorithm.calculate_similarity("hello", "helo") > 0.7);
        assert_eq!(fuzzy_algorithm.calculate_similarity("hello", "xyz"), 0.0);

        // Test contains matching
        let contains_algorithm = ContainsMatchingAlgorithm;
        assert_eq!(contains_algorithm.calculate_similarity("hello world", "hello"), 0.8);
        assert_eq!(contains_algorithm.calculate_similarity("hello", "hello world"), 0.8);
        assert_eq!(contains_algorithm.calculate_similarity("hello", "world"), 0.0);
    }

    #[tokio::test]
    async fn test_reconciliation_service_levenshtein_distance() {
        use crate::services::reconciliation::levenshtein_distance;

        assert_eq!(levenshtein_distance("", ""), 0);
        assert_eq!(levenshtein_distance("hello", "hello"), 0);
        assert_eq!(levenshtein_distance("hello", "helo"), 1);
        assert_eq!(levenshtein_distance("hello", "world"), 4);
        assert_eq!(levenshtein_distance("kitten", "sitting"), 3);
    }

    /// Test file service validation
    #[tokio::test]
    async fn test_file_service_validation() {
        use crate::utils::file;

        // Test file extension validation
        let valid_extensions = vec!["csv", "xlsx", "json", "txt"];
        for ext in valid_extensions {
            assert!(file::is_valid_file_extension(&format!("test.{}", ext)));
        }

        let invalid_extensions = vec!["exe", "bat", "sh", "unknown"];
        for ext in invalid_extensions {
            assert!(!file::is_valid_file_extension(&format!("test.{}", ext)));
        }

        // Test file size formatting
        assert_eq!(file::format_file_size(1024), "1.0 KB");
        assert_eq!(file::format_file_size(1048576), "1.0 MB");
        assert_eq!(file::format_file_size(512), "512 B");
    }

    #[tokio::test]
    async fn test_file_service_unique_filename_generation() {
        use crate::utils::file;

        let original_filename = "test_file.csv";
        let unique_filename = file::generate_unique_filename(original_filename);

        assert!(unique_filename.contains("test_file"));
        assert!(unique_filename.ends_with(".csv"));
        assert!(unique_filename.len() > original_filename.len());

        // Test multiple generations are unique
        let filename1 = file::generate_unique_filename(original_filename);
        let filename2 = file::generate_unique_filename(original_filename);
        assert_ne!(filename1, filename2);
    }

    /// Test utility functions
    #[tokio::test]
    async fn test_utility_functions() {
        use crate::utils::string;
        use crate::utils::validation;

        // Test string utilities
        assert_eq!(string::truncate_string("Hello World", 5), "He...");
        assert_eq!(string::truncate_string("Hi", 5), "Hi");

        assert_eq!(string::to_title_case("hello world"), "Hello World");
        assert_eq!(string::to_title_case("HELLO WORLD"), "Hello World");

        // Test UUID validation
        let valid_uuid = Uuid::new_v4();
        assert!(validation::validate_uuid(&valid_uuid.to_string()).is_ok());

        let invalid_uuid = "not-a-uuid";
        assert!(validation::validate_uuid(invalid_uuid).is_err());
    }

    /// Test performance utilities
    #[tokio::test]
    async fn test_performance_utilities() {
        use crate::test_utils::performance;

        // Test time measurement
        let (result, duration) = performance::measure_time(|| {
            std::thread::sleep(Duration::from_millis(10));
            42
        });

        assert_eq!(result, 42);
        assert!(duration >= Duration::from_millis(10));

        // Test performance threshold
        let fast_duration = Duration::from_millis(5);
        let slow_duration = Duration::from_millis(100);
        let threshold = Duration::from_millis(50);

        performance::assert_performance_threshold(fast_duration, threshold);

        // Test data generation
        let test_data = performance::generate_test_data(5);
        assert_eq!(test_data.len(), 5);
        assert_eq!(test_data[0]["name"], "Test User 0");
        assert_eq!(test_data[4]["email"], "user4@example.com");
    }

    /// Test mock utilities
    #[tokio::test]
    async fn test_mock_utilities() {
        use crate::test_utils::mock::MockRedisClient;

        let mock_redis = MockRedisClient::new();

        // Test basic operations
        assert!(mock_redis.set("key1", "value1").is_ok());
        assert_eq!(mock_redis.get("key1").unwrap(), Some("value1".to_string()));
        assert!(mock_redis.exists("key1").unwrap());

        // Test deletion
        assert!(mock_redis.delete("key1").is_ok());
        assert_eq!(mock_redis.get("key1").unwrap(), None);
        assert!(!mock_redis.exists("key1").unwrap());

        // Test flushall
        assert!(mock_redis.set("key2", "value2").is_ok());
        assert!(mock_redis.flushall().is_ok());
        assert_eq!(mock_redis.get("key2").unwrap(), None);
    }

    /// Test error handling
    #[tokio::test]
    async fn test_error_handling() {
        use crate::errors::{AppError, AppResult};

        // Test error creation
        let auth_error = AppError::Authentication("Test error".to_string());
        assert!(matches!(auth_error, AppError::Authentication(_)));

        let validation_error = AppError::Validation("Test validation error".to_string());
        assert!(matches!(validation_error, AppError::Validation(_)));

        // Test error conversion
        let io_error = std::io::Error::new(std::io::ErrorKind::NotFound, "File not found");
        let app_error: AppError = io_error.into();
        assert!(matches!(app_error, AppError::Io(_)));
    }

    /// Test configuration
    #[tokio::test]
    async fn test_configuration() {
        use crate::config::Config;

        // Test default configuration
        std::env::set_var("HOST", "127.0.0.1");
        std::env::set_var("PORT", "3000");
        std::env::set_var("DATABASE_URL", "postgresql://test:test@localhost:5432/test");

        let config = Config::from_env().map_err(|e| {
            panic!("Failed to load config: {}", e);
        })?;

        assert_eq!(config.host, "127.0.0.1");
        assert_eq!(config.port, 3000);
        assert_eq!(config.database_url, "postgresql://test:test@localhost:5432/test");

        // Clean up environment
        std::env::remove_var("HOST");
        std::env::remove_var("PORT");
        std::env::remove_var("DATABASE_URL");
    }
}