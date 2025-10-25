#[cfg(test)]
mod unit_tests {
    use super::*;
    use crate::test_utils::*;
    use crate::services::auth::AuthService;
    use crate::services::user::UserService;
    use crate::services::project::ProjectService;
    use crate::services::reconciliation::ReconciliationService;
    use crate::services::analytics::AnalyticsService;
    use crate::services::file::FileService;
    use crate::database::Database;
    use crate::config::Config;
    use std::time::Duration;

    /// Test reconciliation service
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
        assert_eq!(job.project_id, project_id);
    }
    
    #[tokio::test]
    async fn test_reconciliation_service_get_job() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);
        
        let project_id = Uuid::new_v4();
        let source_data_source_id = Uuid::new_v4();
        let target_data_source_id = Uuid::new_v4();
        
        // Create a job
        let created_job = service.create_reconciliation_job(
            project_id,
            "Test Job".to_string(),
            None,
            source_data_source_id,
            target_data_source_id,
            0.8,
            None,
        ).await.unwrap();
        
        // Get the job
        let retrieved_job = service.get_reconciliation_job(created_job.id, Uuid::new_v4()).await;
        
        assert!(retrieved_job.is_ok());
        let retrieved_job = retrieved_job.unwrap();
        assert_eq!(retrieved_job.id, created_job.id);
        assert_eq!(retrieved_job.name, "Test Job");
    }
    
    #[tokio::test]
    async fn test_reconciliation_service_update_job() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);
        
        let project_id = Uuid::new_v4();
        let source_data_source_id = Uuid::new_v4();
        let target_data_source_id = Uuid::new_v4();
        
        // Create a job
        let created_job = service.create_reconciliation_job(
            project_id,
            "Original Name".to_string(),
            None,
            source_data_source_id,
            target_data_source_id,
            0.8,
            None,
        ).await.unwrap();
        
        // Update the job
        let updated_job = service.update_reconciliation_job(
            created_job.id,
            Some("Updated Name".to_string()),
            Some("Updated description".to_string()),
            Some(0.9),
            None,
        ).await;
        
        assert!(updated_job.is_ok());
        let updated_job = updated_job.unwrap();
        assert_eq!(updated_job.name, "Updated Name");
        assert_eq!(updated_job.confidence_threshold, 0.9);
    }
    
    #[tokio::test]
    async fn test_reconciliation_service_get_progress() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);
        
        let project_id = Uuid::new_v4();
        let source_data_source_id = Uuid::new_v4();
        let target_data_source_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        
        // Create a job
        let created_job = service.create_reconciliation_job(
            project_id,
            "Test Job".to_string(),
            None,
            source_data_source_id,
            target_data_source_id,
            0.8,
            None,
        ).await.unwrap();
        
        // Get progress (should be 0 for pending job)
        let progress = service.get_reconciliation_progress(created_job.id, user_id).await;
        
        assert!(progress.is_ok());
        let progress = progress.unwrap();
        assert_eq!(progress.job_id, created_job.id);
        assert_eq!(progress.status, "pending");
        assert_eq!(progress.progress, 0);
    }
    
    #[tokio::test]
    async fn test_reconciliation_service_cancel_job() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);
        
        let project_id = Uuid::new_v4();
        let source_data_source_id = Uuid::new_v4();
        let target_data_source_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        
        // Create a job
        let created_job = service.create_reconciliation_job(
            project_id,
            "Test Job".to_string(),
            None,
            source_data_source_id,
            target_data_source_id,
            0.8,
            None,
        ).await.unwrap();
        
        // Cancel the job
        let result = service.cancel_reconciliation_job(created_job.id, user_id).await;
        
        assert!(result.is_ok());
        
        // Verify job status is cancelled
        let updated_job = service.get_reconciliation_job(created_job.id, user_id).await.unwrap();
        assert_eq!(updated_job.status, "cancelled");
    }
    
    #[tokio::test]
    async fn test_reconciliation_service_get_project_jobs() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);
        
        let project_id = Uuid::new_v4();
        let source_data_source_id = Uuid::new_v4();
        let target_data_source_id = Uuid::new_v4();
        
        // Create multiple jobs for the same project
        let job1 = service.create_reconciliation_job(
            project_id,
            "Job 1".to_string(),
            None,
            source_data_source_id,
            target_data_source_id,
            0.8,
            None,
        ).await.unwrap();
        
        let job2 = service.create_reconciliation_job(
            project_id,
            "Job 2".to_string(),
            None,
            source_data_source_id,
            target_data_source_id,
            0.9,
            None,
        ).await.unwrap();
        
        // Get all jobs for the project
        let jobs = service.get_project_reconciliation_jobs(project_id).await;
        
        assert!(jobs.is_ok());
        let jobs = jobs.unwrap();
        assert_eq!(jobs.len(), 2);
        
        let job_names: Vec<String> = jobs.iter().map(|j| j.name.clone()).collect();
        assert!(job_names.contains(&"Job 1".to_string()));
        assert!(job_names.contains(&"Job 2".to_string()));
    }
    
    #[tokio::test]
    async fn test_reconciliation_service_delete_job() {
        let (db, _) = setup_test_database().await;
        let service = ReconciliationService::new(db);
        
        let project_id = Uuid::new_v4();
        let source_data_source_id = Uuid::new_v4();
        let target_data_source_id = Uuid::new_v4();
        
        // Create a job
        let created_job = service.create_reconciliation_job(
            project_id,
            "Test Job".to_string(),
            None,
            source_data_source_id,
            target_data_source_id,
            0.8,
            None,
        ).await.unwrap();
        
        // Delete the job
        let result = service.delete_reconciliation_job(created_job.id).await;
        
        assert!(result.is_ok());
        
        // Verify job is deleted
        let get_result = service.get_reconciliation_job(created_job.id, Uuid::new_v4()).await;
        assert!(get_result.is_err());
    }

    /// Test file service
    #[tokio::test]
    async fn test_file_service_upload() {
        let (db, _) = setup_test_database().await;
        let service = FileService::new(db, "/tmp/uploads".to_string());
        
        let project_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        
        // Create a mock multipart payload
        let file_data = b"test,data\n1,2\n3,4";
        let filename = "test.csv";
        let content_type = "text/csv";
        
        // This would need to be implemented with actual multipart handling
        // For now, we'll test the service methods directly
        let file_info = service.create_file_record(
            filename.to_string(),
            file_data.len() as u64,
            content_type.to_string(),
            project_id,
            Some(user_id),
            Some("Test file".to_string()),
        ).await;
        
        assert!(file_info.is_ok());
        let file_info = file_info.unwrap();
        assert_eq!(file_info.filename, filename);
        assert_eq!(file_info.size, file_data.len() as u64);
        assert_eq!(file_info.content_type, content_type);
        assert_eq!(file_info.status, "uploaded");
    }
    
    #[tokio::test]
    async fn test_file_service_get_file() {
        let (db, _) = setup_test_database().await;
        let service = FileService::new(db, "/tmp/uploads".to_string());
        
        let project_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        
        // Create a file record
        let created_file = service.create_file_record(
            "test.csv".to_string(),
            100,
            "text/csv".to_string(),
            project_id,
            Some(user_id),
            Some("Test file".to_string()),
        ).await.unwrap();
        
        // Get the file
        let retrieved_file = service.get_file(created_file.id).await;
        
        assert!(retrieved_file.is_ok());
        let retrieved_file = retrieved_file.unwrap();
        assert_eq!(retrieved_file.id, created_file.id);
        assert_eq!(retrieved_file.filename, "test.csv");
    }
    
    #[tokio::test]
    async fn test_file_service_list_project_files() {
        let (db, _) = setup_test_database().await;
        let service = FileService::new(db, "/tmp/uploads".to_string());
        
        let project_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        
        // Create multiple files for the same project
        let file1 = service.create_file_record(
            "file1.csv".to_string(),
            100,
            "text/csv".to_string(),
            project_id,
            Some(user_id),
            Some("File 1".to_string()),
        ).await.unwrap();
        
        let file2 = service.create_file_record(
            "file2.csv".to_string(),
            200,
            "text/csv".to_string(),
            project_id,
            Some(user_id),
            Some("File 2".to_string()),
        ).await.unwrap();
        
        // List project files
        let files = service.list_project_files(project_id).await;
        
        assert!(files.is_ok());
        let files = files.unwrap();
        assert_eq!(files.len(), 2);
        
        let filenames: Vec<String> = files.iter().map(|f| f.filename.clone()).collect();
        assert!(filenames.contains(&"file1.csv".to_string()));
        assert!(filenames.contains(&"file2.csv".to_string()));
    }
    
    #[tokio::test]
    async fn test_file_service_delete_file() {
        let (db, _) = setup_test_database().await;
        let service = FileService::new(db, "/tmp/uploads".to_string());
        
        let project_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        
        // Create a file record
        let created_file = service.create_file_record(
            "test.csv".to_string(),
            100,
            "text/csv".to_string(),
            project_id,
            Some(user_id),
            Some("Test file".to_string()),
        ).await.unwrap();
        
        // Delete the file
        let result = service.delete_file(created_file.id).await;
        
        assert!(result.is_ok());
        
        // Verify file is deleted
        let get_result = service.get_file(created_file.id).await;
        assert!(get_result.is_err());
    }
    
    #[tokio::test]
    async fn test_file_service_update_status() {
        let (db, _) = setup_test_database().await;
        let service = FileService::new(db, "/tmp/uploads".to_string());
        
        let project_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        
        // Create a file record
        let created_file = service.create_file_record(
            "test.csv".to_string(),
            100,
            "text/csv".to_string(),
            project_id,
            Some(user_id),
            Some("Test file".to_string()),
        ).await.unwrap();
        
        // Update file status
        let result = service.update_file_status(created_file.id, "processing".to_string()).await;
        
        assert!(result.is_ok());
        
        // Verify status is updated
        let updated_file = service.get_file(created_file.id).await.unwrap();
        assert_eq!(updated_file.status, "processing");
    }

    /// Test authentication service
    #[tokio::test]
    async fn test_auth_service_password_hashing() {
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        
        // Test password hashing
        let password = "TestPassword123!";
        let hash = auth_service.hash_password(password).expect("Failed to hash password");
        
        assert!(!hash.is_empty());
        assert_ne!(hash, password);
        
        // Test password verification
        let is_valid = auth_service.verify_password(password, &hash).expect("Failed to verify password");
        assert!(is_valid);
        
        // Test invalid password
        let is_invalid = auth_service.verify_password("WrongPassword", &hash).expect("Failed to verify password");
        assert!(!is_invalid);
    }
    
    #[tokio::test]
    async fn test_auth_service_jwt_token() {
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        let test_user = TestUser::new();
        
        // Create a mock user
        let user = crate::models::User {
            id: test_user.id,
            email: test_user.email.clone(),
            password_hash: "hashed_password".to_string(),
            first_name: test_user.first_name.clone(),
            last_name: test_user.last_name.clone(),
            role: test_user.role.to_string(),
            is_active: true,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            last_login: None,
        };
        
        // Test token generation
        let token = auth_service.generate_token(&user).expect("Failed to generate token");
        assert!(!token.is_empty());
        
        // Test token validation
        let claims = auth_service.validate_token(&token).expect("Failed to validate token");
        assert_eq!(claims.sub, user.id.to_string());
        assert_eq!(claims.email, user.email);
        assert_eq!(claims.role, user.role);
        
        // Test user ID extraction
        let user_id = auth_service.get_user_id_from_token(&token).expect("Failed to get user ID");
        assert_eq!(user_id, user.id);
    }
    
    #[tokio::test]
    async fn test_auth_service_password_validation() {
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        
        // Test valid password
        let valid_password = "ValidPassword123!";
        assert!(auth_service.validate_password_strength(valid_password).is_ok());
        
        // Test invalid passwords
        let invalid_passwords = vec![
            "short",                    // Too short
            "nouppercase123!",          // No uppercase
            "NOLOWERCASE123!",          // No lowercase
            "NoNumbers!",               // No numbers
            "NoSpecialChars123",        // No special characters
        ];
        
        for invalid_password in invalid_passwords {
            assert!(auth_service.validate_password_strength(invalid_password).is_err());
        }
    }
    
    #[tokio::test]
    async fn test_auth_service_role_checking() {
        let auth_service = AuthService::new("test_secret".to_string(), 3600);
        
        // Test admin role
        assert!(auth_service.has_role("admin", "user"));
        assert!(auth_service.has_role("admin", "manager"));
        assert!(auth_service.has_role("admin", "admin"));
        
        // Test manager role
        assert!(auth_service.has_role("manager", "user"));
        assert!(auth_service.has_role("manager", "manager"));
        assert!(!auth_service.has_role("manager", "admin"));
        
        // Test user role
        assert!(auth_service.has_role("user", "user"));
        assert!(!auth_service.has_role("user", "manager"));
        assert!(!auth_service.has_role("user", "admin"));
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
        
        let config = Config::from_env().expect("Failed to load config");
        
        assert_eq!(config.host, "127.0.0.1");
        assert_eq!(config.port, 3000);
        assert_eq!(config.database_url, "postgresql://test:test@localhost:5432/test");
        
        // Clean up environment
        std::env::remove_var("HOST");
        std::env::remove_var("PORT");
        std::env::remove_var("DATABASE_URL");
    }
}
