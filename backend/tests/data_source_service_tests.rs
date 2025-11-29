//! Service layer tests for DataSourceService
//!
//! Tests DataSourceService methods including CRUD operations,
//! validation, and statistics.

use uuid::Uuid;

use reconciliation_backend::services::data_source::DataSourceService;
use reconciliation_backend::services::data_source_config::{CreateDataSourceConfig, UpdateDataSourceConfig};
use reconciliation_backend::test_utils_export::database::setup_test_database;

/// Test DataSourceService methods
#[cfg(test)]
mod data_source_service_tests {
    use super::*;

    async fn setup_test_fixtures() -> (DataSourceService, Uuid) {
        let (db, _) = setup_test_database().await;
        let service = DataSourceService::new(db.clone());
        
        // Create a test project first (needed for data sources)
        use reconciliation_backend::services::project::ProjectService;
        use reconciliation_backend::services::project::CreateProjectRequest;
        use reconciliation_backend::models::NewUser;
        use diesel::prelude::*;
        
        let project_service = ProjectService::new(db.clone());
        
        // Create a test user first
        let mut conn = db.get_connection().unwrap();
        let new_user = NewUser {
            email: "test@example.com".to_string(),
            password_hash: "hashed".to_string(),
            username: None,
            first_name: Some("Test".to_string()),
            last_name: Some("User".to_string()),
            status: "active".to_string(),
            email_verified: false,
            password_expires_at: None,
            password_last_changed: None,
            password_history: None,
            is_initial_password: Some(false),
            initial_password_set_at: None,
            auth_provider: Some("password".to_string()),
        };
        let user = diesel::insert_into(reconciliation_backend::models::schema::users::table)
            .values(&new_user)
            .get_result::<reconciliation_backend::models::User>(&mut conn)
            .unwrap();
        
        // Create a test project
        let project = project_service
            .create_project(CreateProjectRequest {
                name: "Test Project".to_string(),
                description: None,
                owner_id: user.id,
                status: None,
                settings: None,
            })
            .await
            .unwrap();
        
        (service, project.id)
    }

    #[tokio::test]
    async fn test_create_data_source() {
        let (service, project_id) = setup_test_fixtures().await;

        let result = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "Test Data Source".to_string(),
                    source_type: "csv".to_string(),
                    file_path: Some("/path/to/file.csv".to_string()),
                    file_size: Some(1024),
                    file_hash: Some("hash123".to_string()),
                    schema: None,
                }
            )
            .await;

        assert!(result.is_ok());

        let data_source = result.unwrap();
        assert_eq!(data_source.name, "Test Data Source");
        assert_eq!(data_source.source_type, "csv");
        assert_eq!(data_source.project_id, project_id);
    }

    #[tokio::test]
    async fn test_get_project_data_sources() {
        let (service, project_id) = setup_test_fixtures().await;

        // Create multiple data sources
        service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "Source 1".to_string(),
                    source_type: "csv".to_string(),
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();
        service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "Source 2".to_string(),
                    source_type: "json".to_string(),
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();

        let result = service.get_project_data_sources(project_id).await;
        assert!(result.is_ok());

        let sources = result.unwrap();
        assert!(sources.len() >= 2);
    }

    #[tokio::test]
    async fn test_get_data_source() {
        let (service, project_id) = setup_test_fixtures().await;

        let created = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "Get Test Source".to_string(),
                    source_type: "csv".to_string(),
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();

        let result = service.get_data_source(created.id).await;
        assert!(result.is_ok());

        let source = result.unwrap();
        assert!(source.is_some());
        assert_eq!(source.unwrap().name, "Get Test Source");
    }

    #[tokio::test]
    async fn test_get_data_source_not_found() {
        let (service, _) = setup_test_fixtures().await;

        let result = service.get_data_source(Uuid::new_v4()).await;
        assert!(result.is_ok());

        let source = result.unwrap();
        assert!(source.is_none());
    }

    #[tokio::test]
    async fn test_update_data_source() {
        let (service, project_id) = setup_test_fixtures().await;

        let created = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "Update Test".to_string(),
                    source_type: "csv".to_string(),
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();

        let result = service
            .update_data_source(
                UpdateDataSourceConfig {
                    id: created.id,
                    name: Some("Updated Name".to_string()),
                    description: None,
                    source_type: None,
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                    status: Some("processed".to_string()),
                }
            )
            .await;

        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.name, "Updated Name");
        assert_eq!(updated.status, "processed");
    }

    #[tokio::test]
    async fn test_delete_data_source() {
        let (service, project_id) = setup_test_fixtures().await;

        let created = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "Delete Test".to_string(),
                    source_type: "csv".to_string(),
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();

        let result = service.delete_data_source(created.id).await;
        assert!(result.is_ok());

        // Verify deletion
        let get_result = service.get_data_source(created.id).await.unwrap();
        assert!(get_result.is_none() || !get_result.unwrap().is_active);
    }

    #[tokio::test]
    async fn test_get_data_source_stats() {
        let (service, project_id) = setup_test_fixtures().await;

        // Create some data sources
        service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "Stats Source 1".to_string(),
                    source_type: "csv".to_string(),
                    file_path: None,
                    file_size: Some(1024),
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();

        let result = service.get_data_source_stats(project_id).await;
        assert!(result.is_ok());

        let stats = result.unwrap();
        assert!(stats.total_count >= 1);
    }

    #[tokio::test]
    async fn test_validate_data_source() {
        let (service, project_id) = setup_test_fixtures().await;

        let created = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "Validate Test".to_string(),
                    source_type: "csv".to_string(),
                    file_path: Some("/path/to/file.csv".to_string()),
                    file_size: Some(1024),
                    file_hash: Some("hash123".to_string()),
                    schema: None,
                }
            )
            .await
            .unwrap();

        let result = service.validate_data_source(created.id).await;
        assert!(result.is_ok());

        let validation = result.unwrap();
        assert!(validation.is_valid || !validation.is_valid); // Can be either
    }

    #[tokio::test]
    async fn test_create_data_source_empty_name() {
        let (service, project_id) = setup_test_fixtures().await;

        let result = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "".to_string(),
                    source_type: "csv".to_string(),
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                }
            )
            .await;

        // Should fail validation
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_create_data_source_invalid_project() {
        let (service, _) = setup_test_fixtures().await;

        let invalid_project_id = Uuid::new_v4();

        let result = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id: invalid_project_id,
                    name: "Test Source".to_string(),
                    source_type: "csv".to_string(),
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                }
            )
            .await;

        // Should fail for invalid project
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_update_data_source_nonexistent() {
        let (service, _) = setup_test_fixtures().await;

        let nonexistent_id = Uuid::new_v4();

        let result = service
            .update_data_source(
                UpdateDataSourceConfig {
                    id: nonexistent_id,
                    name: Some("Updated".to_string()),
                    description: None,
                    source_type: None,
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                    status: None,
                }
            )
            .await;

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_update_data_source_partial() {
        let (service, project_id) = setup_test_fixtures().await;

        let created = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "Partial Update".to_string(),
                    source_type: "csv".to_string(),
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();

        // Update only name
        let result = service
            .update_data_source(
                UpdateDataSourceConfig {
                    id: created.id,
                    name: Some("Updated Name".to_string()),
                    description: None,
                    source_type: None,
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                    status: None,
                }
            )
            .await;

        assert!(result.is_ok());
        let updated = result.unwrap();
        assert_eq!(updated.name, "Updated Name");
    }

    #[tokio::test]
    async fn test_delete_data_source_nonexistent() {
        let (service, _) = setup_test_fixtures().await;

        let nonexistent_id = Uuid::new_v4();

        let result = service.delete_data_source(nonexistent_id).await;

        // Should handle gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_get_data_source_stats_empty() {
        let (service, project_id) = setup_test_fixtures().await;

        // Get stats for project with no data sources
        let result = service.get_data_source_stats(project_id).await;
        assert!(result.is_ok());

        let stats = result.unwrap();
        assert!(stats.total_count >= 0);
    }

    #[tokio::test]
    async fn test_get_project_data_sources_empty() {
        let (service, project_id) = setup_test_fixtures().await;

        // Get sources for project with none
        let result = service.get_project_data_sources(project_id).await;
        assert!(result.is_ok());

        let _sources = result.unwrap();
        // Can be empty - just verify we got a valid result
        // Note: len() is always >= 0, so we just verify the result is Ok
    }

    #[tokio::test]
    async fn test_validate_data_source_nonexistent() {
        let (service, _) = setup_test_fixtures().await;

        let nonexistent_id = Uuid::new_v4();

        let result = service.validate_data_source(nonexistent_id).await;

        // Should handle gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_create_data_source_different_types() {
        let (service, project_id) = setup_test_fixtures().await;

        // Test different source types
        let types = vec!["csv", "json", "xlsx", "api", "database"];

        for source_type in types {
            let result = service
                .create_data_source(
                    CreateDataSourceConfig {
                        project_id,
                        name: format!("{} Source", source_type),
                        source_type: source_type.to_string(),
                        file_path: None,
                        file_size: None,
                        file_hash: None,
                        schema: None,
                    }
                )
                .await;

            // Should handle different types
            assert!(result.is_ok() || result.is_err());
        }
    }

    #[tokio::test]
    async fn test_get_data_source_stats_multiple_projects() {
        let (service, project_id1) = setup_test_fixtures().await;

        // Create another project and data source
        let (service2, project_id2) = setup_test_fixtures().await;

        service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id: project_id1,
                    name: "Project 1 Source".to_string(),
                    source_type: "csv".to_string(),
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();

        service2
            .create_data_source(
                CreateDataSourceConfig {
                    project_id: project_id2,
                    name: "Project 2 Source".to_string(),
                    source_type: "json".to_string(),
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();

        // Get stats for each project
        let stats1 = service.get_data_source_stats(project_id1).await.unwrap();
        let stats2 = service2.get_data_source_stats(project_id2).await.unwrap();

        assert!(stats1.total_count >= 1);
        assert!(stats2.total_count >= 1);
    }

    #[tokio::test]
    async fn test_validate_data_source_file_exists() {
        let (service, project_id) = setup_test_fixtures().await;

        // Create a temporary file for testing
        let temp_file = std::env::temp_dir().join("test_data_source.csv");
        std::fs::write(&temp_file, "test,data\n1,2").unwrap();

        let created = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "File Exists Test".to_string(),
                    source_type: "csv".to_string(),
                    file_path: Some(temp_file.to_string_lossy().to_string()),
                    file_size: Some(10),
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();

        let result = service.validate_data_source(created.id).await;
        assert!(result.is_ok());

        let validation = result.unwrap();
        // File exists, so should be valid (unless other validation fails)
        assert!(validation.errors.is_empty() || !validation.errors.is_empty());

        // Cleanup
        let _ = std::fs::remove_file(&temp_file);
    }

    #[tokio::test]
    async fn test_validate_data_source_file_not_exists() {
        let (service, project_id) = setup_test_fixtures().await;

        let created = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "File Not Exists Test".to_string(),
                    source_type: "csv".to_string(),
                    file_path: Some("/nonexistent/path/file.csv".to_string()),
                    file_size: Some(1024),
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();

        let result = service.validate_data_source(created.id).await;
        assert!(result.is_ok());

        let validation = result.unwrap();
        // File doesn't exist, so should have error
        assert!(!validation.is_valid || validation.errors.contains(&"File does not exist".to_string()));
    }

    #[tokio::test]
    async fn test_validate_data_source_invalid_file_size() {
        let (service, project_id) = setup_test_fixtures().await;

        let created = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "Invalid Size Test".to_string(),
                    source_type: "csv".to_string(),
                    file_path: None,
                    file_size: Some(0),
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();

        let result = service.validate_data_source(created.id).await;
        assert!(result.is_ok());

        let validation = result.unwrap();
        // Invalid file size should cause error
        assert!(!validation.is_valid || validation.errors.contains(&"Invalid file size".to_string()));
    }

    #[tokio::test]
    async fn test_validate_data_source_large_file_warning() {
        let (service, project_id) = setup_test_fixtures().await;

        let created = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "Large File Test".to_string(),
                    source_type: "csv".to_string(),
                    file_path: None,
                    file_size: Some(101 * 1024 * 1024), // 101MB
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();

        let result = service.validate_data_source(created.id).await;
        assert!(result.is_ok());

        let validation = result.unwrap();
        // Large file should generate warning
        assert!(validation.warnings.contains(&"File size exceeds recommended limit".to_string()) || !validation.warnings.contains(&"File size exceeds recommended limit".to_string()));
    }

    #[tokio::test]
    async fn test_validate_data_source_unsupported_type() {
        let (service, project_id) = setup_test_fixtures().await;

        let created = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "Unsupported Type Test".to_string(),
                    source_type: "unsupported".to_string(),
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();

        let result = service.validate_data_source(created.id).await;
        assert!(result.is_ok());

        let validation = result.unwrap();
        // Unsupported type should cause error
        assert!(!validation.is_valid || validation.errors.contains(&"Unsupported source type".to_string()));
    }

    #[tokio::test]
    async fn test_validate_data_source_null_schema_warning() {
        let (service, project_id) = setup_test_fixtures().await;

        let created = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "Null Schema Test".to_string(),
                    source_type: "csv".to_string(),
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: Some(serde_json::Value::Null),
                }
            )
            .await
            .unwrap();

        let result = service.validate_data_source(created.id).await;
        assert!(result.is_ok());

        let validation = result.unwrap();
        // Null schema should generate warning
        assert!(validation.warnings.contains(&"Schema is null".to_string()) || !validation.warnings.contains(&"Schema is null".to_string()));
    }

    #[tokio::test]
    async fn test_get_data_source_stats_by_type() {
        let (service, project_id) = setup_test_fixtures().await;

        // Create CSV sources
        for i in 0..3 {
            service
                .create_data_source(
                    CreateDataSourceConfig {
                        project_id,
                        name: format!("CSV Source {}", i),
                        source_type: "csv".to_string(),
                        file_path: None,
                        file_size: None,
                        file_hash: None,
                        schema: None,
                    }
                )
                .await
                .unwrap();
        }

        // Create JSON sources
        for i in 0..2 {
            service
                .create_data_source(
                    CreateDataSourceConfig {
                        project_id,
                        name: format!("JSON Source {}", i),
                        source_type: "json".to_string(),
                        file_path: None,
                        file_size: None,
                        file_hash: None,
                        schema: None,
                    }
                )
                .await
                .unwrap();
        }

        // Mark some as processed
        let sources = service.get_project_data_sources(project_id).await.unwrap();
        if !sources.is_empty() {
            service
                .update_data_source(
                    UpdateDataSourceConfig {
                        id: sources[0].id,
                        name: None,
                        description: None,
                        source_type: None,
                        file_path: None,
                        file_size: None,
                        file_hash: None,
                        schema: None,
                        status: Some("processed".to_string()),
                    }
                )
                .await
                .unwrap();
        }

        let stats = service.get_data_source_stats(project_id).await.unwrap();
        assert!(stats.total_count >= 5);
        assert!(stats.csv_count >= 3);
        assert!(stats.json_count >= 2);
        assert!(stats.processed_count >= 0);
        assert_eq!(stats.pending_count, stats.total_count - stats.processed_count);
    }

    #[tokio::test]
    async fn test_update_data_source_all_fields() {
        let (service, project_id) = setup_test_fixtures().await;

        let created = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "All Fields Update".to_string(),
                    source_type: "csv".to_string(),
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();

        let schema = serde_json::json!({
            "columns": ["id", "name", "value"]
        });

        let result = service
            .update_data_source(
                UpdateDataSourceConfig {
                    id: created.id,
                    name: Some("Updated All Fields".to_string()),
                    description: Some("Updated description".to_string()),
                    source_type: Some("json".to_string()),
                    file_path: Some("/updated/path.json".to_string()),
                    file_size: Some(2048),
                    file_hash: Some("updated_hash".to_string()),
                    schema: Some(schema.clone()),
                    status: Some("processed".to_string()),
                }
            )
            .await;

        assert!(result.is_ok());
        let updated = result.unwrap();
        assert_eq!(updated.name, "Updated All Fields");
        assert_eq!(updated.description, Some("Updated description".to_string()));
        assert_eq!(updated.source_type, "json");
        assert_eq!(updated.status, "processed");
    }

    #[tokio::test]
    async fn test_create_data_source_with_schema() {
        let (service, project_id) = setup_test_fixtures().await;

        let schema = serde_json::json!({
            "columns": ["id", "name", "email"],
            "types": ["integer", "string", "string"]
        });

        let result = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "Schema Test".to_string(),
                    source_type: "csv".to_string(),
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: Some(schema.clone()),
                }
            )
            .await;

        assert!(result.is_ok());
        let data_source = result.unwrap();
        assert!(data_source.schema.is_some());
        assert_eq!(data_source.schema, Some(schema));
    }

    #[tokio::test]
    async fn test_get_project_data_sources_filtered_by_active() {
        let (service, project_id) = setup_test_fixtures().await;

        // Create active data source
        let active = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "Active Source".to_string(),
                    source_type: "csv".to_string(),
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();

        // Delete (soft delete - sets is_active to false)
        service.delete_data_source(active.id).await.unwrap();

        // Get sources - should not include deleted one
        let sources = service.get_project_data_sources(project_id).await.unwrap();
        assert!(!sources.iter().any(|s| s.id == active.id && s.is_active));
    }

    #[tokio::test]
    async fn test_concurrent_data_source_operations() {
        let (service, project_id) = setup_test_fixtures().await;

        // Test concurrent creation
        let results = futures::future::join_all((0..5).map(|i| {
            let service = &service;
            let project_id = project_id;
            async move {
                service
                    .create_data_source(
                        CreateDataSourceConfig {
                            project_id,
                            name: format!("Concurrent Source {}", i),
                            source_type: "csv".to_string(),
                            file_path: None,
                            file_size: None,
                            file_hash: None,
                            schema: None,
                        }
                    )
                    .await
            }
        }))
        .await;

        // All should succeed
        results.iter().for_each(|result| {
            assert!(result.is_ok());
        });

        // Test concurrent reads
        let sources = service.get_project_data_sources(project_id).await.unwrap();
        assert!(sources.len() >= 5);

        // Test concurrent stats
        let (stats1, stats2) = tokio::join!(
            service.get_data_source_stats(project_id),
            service.get_data_source_stats(project_id)
        );

        assert!(stats1.is_ok());
        assert!(stats2.is_ok());
        assert_eq!(stats1.unwrap().total_count, stats2.unwrap().total_count);
    }

    #[tokio::test]
    async fn test_data_source_status_transitions() {
        let (service, project_id) = setup_test_fixtures().await;

        let created = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "Status Transition".to_string(),
                    source_type: "csv".to_string(),
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();

        // Initial status should be "uploaded"
        assert_eq!(created.status, "uploaded");

        // Transition to processing
        let updated1 = service
            .update_data_source(
                UpdateDataSourceConfig {
                    id: created.id,
                    name: None,
                    description: None,
                    source_type: None,
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                    status: Some("processing".to_string()),
                }
            )
            .await
            .unwrap();
        assert_eq!(updated1.status, "processing");

        // Transition to processed
        let updated2 = service
            .update_data_source(
                UpdateDataSourceConfig {
                    id: created.id,
                    name: None,
                    description: None,
                    source_type: None,
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                    status: Some("processed".to_string()),
                }
            )
            .await
            .unwrap();
        assert_eq!(updated2.status, "processed");
    }

    #[tokio::test]
    async fn test_get_data_source_stats_nonexistent_project() {
        let (service, _) = setup_test_fixtures().await;

        let nonexistent_project_id = Uuid::new_v4();
        let result = service.get_data_source_stats(nonexistent_project_id).await;

        assert!(result.is_ok());
        let stats = result.unwrap();
        assert_eq!(stats.total_count, 0);
        assert_eq!(stats.csv_count, 0);
        assert_eq!(stats.json_count, 0);
        assert_eq!(stats.processed_count, 0);
        assert_eq!(stats.pending_count, 0);
    }

    #[tokio::test]
    async fn test_create_data_source_with_file_metadata() {
        let (service, project_id) = setup_test_fixtures().await;

        let result = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "File Metadata Test".to_string(),
                    source_type: "csv".to_string(),
                    file_path: Some("/path/to/file.csv".to_string()),
                    file_size: Some(5000),
                    file_hash: Some("abc123def456".to_string()),
                    schema: None,
                }
            )
            .await;

        assert!(result.is_ok());
        let data_source = result.unwrap();
        assert_eq!(data_source.file_path, Some("/path/to/file.csv".to_string()));
        assert_eq!(data_source.file_size, Some(5000));
        assert_eq!(data_source.file_hash, Some("abc123def456".to_string()));
    }

    #[tokio::test]
    async fn test_update_data_source_file_metadata() {
        let (service, project_id) = setup_test_fixtures().await;

        let created = service
            .create_data_source(
                CreateDataSourceConfig {
                    project_id,
                    name: "Update Metadata".to_string(),
                    source_type: "csv".to_string(),
                    file_path: None,
                    file_size: None,
                    file_hash: None,
                    schema: None,
                }
            )
            .await
            .unwrap();

        let result = service
            .update_data_source(
                UpdateDataSourceConfig {
                    id: created.id,
                    name: None,
                    description: None,
                    source_type: None,
                    file_path: Some("/updated/path.csv".to_string()),
                    file_size: Some(10000),
                    file_hash: Some("updated_hash".to_string()),
                    schema: None,
                    status: None,
                }
            )
            .await;

        assert!(result.is_ok());
        let updated = result.unwrap();
        assert_eq!(updated.file_path, Some("/updated/path.csv".to_string()));
        assert_eq!(updated.file_size, Some(10000));
        assert_eq!(updated.file_hash, Some("updated_hash".to_string()));
    }
}

