//! Unit tests for FileService
//!
//! This module contains comprehensive tests for the file service functionality.

use crate::services::file::FileService;
use crate::database::Database;
use crate::test_utils::database::setup_test_database;
use uuid::Uuid;

#[cfg(test)]
mod file_service_tests {
    use super::*;

    /// Test file service upload
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

    /// Test file service get file
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

    /// Test file service list project files
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

    /// Test file service delete file
    #[tokio::test]
    async fn test_file_service_delete_file() {
        let (db, _) = setup_test_database().await;
        let service = FileService::new(db, "/tmp/uploads".to_string());

        let project_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();

        // Create a file
        let file = service.create_file_record(
            "delete_test.csv".to_string(),
            100,
            "text/csv".to_string(),
            project_id,
            Some(user_id),
            Some("Delete test file".to_string()),
        ).await.unwrap();

        // Delete the file
        let delete_result = service.delete_file(file.id).await;
        assert!(delete_result.is_ok());

        // Verify file is deleted
        let get_result = service.get_file(file.id).await;
        assert!(get_result.is_err());
    }

    /// Test file service update status
    #[tokio::test]
    async fn test_file_service_update_status() {
        let (db, _) = setup_test_database().await;
        let service = FileService::new(db, "/tmp/uploads".to_string());

        let project_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();

        // Create a file
        let created_file = service.create_file_record(
            "status_test.csv".to_string(),
            100,
            "text/csv".to_string(),
            project_id,
            Some(user_id),
            Some("Status test file".to_string()),
        ).await.unwrap();

        // Update status
        let update_result = service.update_file_status(created_file.id, "processing").await;
        assert!(update_result.is_ok());

        // Verify status is updated
        let updated_file = service.get_file(created_file.id).await.unwrap();
        assert_eq!(updated_file.status, "processing");
    }

    /// Test file service validation
    #[tokio::test]
    async fn test_file_service_validation() {
        let (db, _) = setup_test_database().await;
        let service = FileService::new(db, "/tmp/uploads".to_string());

        let project_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();

        // Test valid file types
        let valid_types = vec!["text/csv", "application/json", "text/plain"];
        for content_type in valid_types {
            let result = service.create_file_record(
                "test.csv".to_string(),
                100,
                content_type.to_string(),
                project_id,
                Some(user_id),
                None,
            ).await;
            assert!(result.is_ok(), "Failed for content type: {}", content_type);
        }

        // Test invalid file types
        let invalid_types = vec!["application/exe", "application/msword"];
        for content_type in invalid_types {
            let result = service.create_file_record(
                "test.exe".to_string(),
                100,
                content_type.to_string(),
                project_id,
                Some(user_id),
                None,
            ).await;
            assert!(result.is_err(), "Should fail for content type: {}", content_type);
        }
    }

    /// Test file service unique filename generation
    #[tokio::test]
    async fn test_file_service_unique_filename_generation() {
        let (db, _) = setup_test_database().await;
        let service = FileService::new(db, "/tmp/uploads".to_string());

        let project_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();

        // Create a file with a specific name
        let original_filename = "test.csv";
        service.create_file_record(
            original_filename.to_string(),
            100,
            "text/csv".to_string(),
            project_id,
            Some(user_id),
            None,
        ).await.unwrap();

        // Try to create another file with the same name
        let duplicate_file = service.create_file_record(
            original_filename.to_string(),
            200,
            "text/csv".to_string(),
            project_id,
            Some(user_id),
            None,
        ).await.unwrap();

        // The filename should be modified to be unique
        assert_ne!(duplicate_file.filename, original_filename);
        assert!(duplicate_file.filename.starts_with("test"));
        assert!(duplicate_file.filename.ends_with(".csv"));
    }
}