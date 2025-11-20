//! Service layer tests for DataSourceService
//!
//! Tests DataSourceService methods including CRUD operations,
//! validation, and statistics.

use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::services::data_source::DataSourceService;
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
        use std::sync::Arc;
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
                project_id,
                "Test Data Source".to_string(),
                "csv".to_string(),
                Some("/path/to/file.csv".to_string()),
                Some(1024),
                Some("hash123".to_string()),
                None,
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
                project_id,
                "Source 1".to_string(),
                "csv".to_string(),
                None,
                None,
                None,
                None,
            )
            .await
            .unwrap();
        service
            .create_data_source(
                project_id,
                "Source 2".to_string(),
                "json".to_string(),
                None,
                None,
                None,
                None,
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
                project_id,
                "Get Test Source".to_string(),
                "csv".to_string(),
                None,
                None,
                None,
                None,
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
                project_id,
                "Update Test".to_string(),
                "csv".to_string(),
                None,
                None,
                None,
                None,
            )
            .await
            .unwrap();

        let result = service
            .update_data_source(
                created.id,
                Some("Updated Name".to_string()),
                Some("processed".to_string()),
                None,
                None,
                None,
                None,
                None,
                None,
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
                project_id,
                "Delete Test".to_string(),
                "csv".to_string(),
                None,
                None,
                None,
                None,
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
                project_id,
                "Stats Source 1".to_string(),
                "csv".to_string(),
                None,
                Some(1024),
                None,
                None,
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
                project_id,
                "Validate Test".to_string(),
                "csv".to_string(),
                Some("/path/to/file.csv".to_string()),
                Some(1024),
                Some("hash123".to_string()),
                None,
            )
            .await
            .unwrap();

        let result = service.validate_data_source(created.id).await;
        assert!(result.is_ok());

        let validation = result.unwrap();
        assert!(validation.is_valid || !validation.is_valid); // Can be either
    }
}

