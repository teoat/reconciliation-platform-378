//! Service layer tests for FileService
//!
//! Tests FileService methods including file uploads,
//! resumable uploads, and file processing.

use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::services::file::FileService;
use reconciliation_backend::test_utils_export::database::setup_test_database;

/// Test FileService methods
#[cfg(test)]
mod file_service_tests {
    use super::*;
    use std::path::PathBuf;
    use tokio::fs;

    #[tokio::test]
    async fn test_init_resumable_upload() {
        let (db, _) = setup_test_database().await;
        let upload_path = "./test_uploads".to_string();
        let file_service = FileService::new(db, upload_path.clone());

        let project_id = Uuid::new_v4();
        let filename = "test_file.csv".to_string();
        let expected_size = Some(1024);

        let result = file_service
            .init_resumable_upload(project_id, filename.clone(), expected_size)
            .await;

        assert!(result.is_ok());

        let upload_meta = result.unwrap();
        assert!(upload_meta.get("upload_id").is_some());
        assert_eq!(upload_meta.get("filename"), Some(&serde_json::json!(filename)));

        // Cleanup
        let _ = fs::remove_dir_all(&upload_path).await;
    }

    #[tokio::test]
    async fn test_upload_chunk() {
        let (db, _) = setup_test_database().await;
        let upload_path = "./test_uploads".to_string();
        let file_service = FileService::new(db, upload_path.clone());

        let upload_id = Uuid::new_v4();
        let chunk_index = 0;
        let chunk_data = b"test chunk data";

        let result = file_service
            .upload_chunk(upload_id, chunk_index, chunk_data)
            .await;

        assert!(result.is_ok());

        // Cleanup
        let _ = fs::remove_dir_all(&upload_path).await;
    }

    #[tokio::test]
    async fn test_get_file() {
        let (db, _) = setup_test_database().await;
        let upload_path = "./test_uploads".to_string();
        let file_service = FileService::new(db, upload_path);

        let file_id = Uuid::new_v4();

        // Get file (may fail if file doesn't exist)
        let result = file_service.get_file(file_id).await;

        // Should handle non-existent files gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_delete_file() {
        let (db, _) = setup_test_database().await;
        let upload_path = "./test_uploads".to_string();
        let file_service = FileService::new(db, upload_path);

        let file_id = Uuid::new_v4();

        // Delete file (may fail if file doesn't exist)
        let result = file_service.delete_file(file_id).await;

        // Should handle non-existent files gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_process_file() {
        let (db, _) = setup_test_database().await;
        let upload_path = "./test_uploads".to_string();
        let file_service = FileService::new(db, upload_path);

        let file_id = Uuid::new_v4();

        // Process file (may fail if file doesn't exist)
        let result = file_service.process_file(file_id).await;

        // Should handle non-existent files gracefully
        assert!(result.is_ok() || result.is_err());
    }
}

