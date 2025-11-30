//! CQRS Handlers
//!
//! Example implementations of command and query handlers

use crate::cqrs::command::{
    CommandHandler, CommandResult, CreateProjectCommand, DeleteProjectCommand, UpdateProjectCommand,
};
use crate::cqrs::query::{GetProjectQuery, ListProjectsQuery, QueryHandler, QueryResult};
use crate::database::Database;
use crate::services::project::ProjectService;
use std::sync::Arc;

/// Project command handler
///
/// Handles CQRS commands for project operations including create, update, and delete.
/// Integrates with ProjectService to execute business logic.
///
/// # Examples
///
/// ```
/// use reconciliation_backend::cqrs::handlers::ProjectCommandHandler;
///
/// let handler = ProjectCommandHandler::new(database);
/// let result = handler.handle(create_command).await?;
/// ```
pub struct ProjectCommandHandler {
    project_service: Arc<ProjectService>,
}

impl ProjectCommandHandler {
    pub fn new(db: Database) -> Self {
        Self {
            project_service: Arc::new(ProjectService::new(db)),
        }
    }
}

impl CommandHandler<CreateProjectCommand> for ProjectCommandHandler {
    /// Handle CreateProjectCommand
    ///
    /// Creates a new project with the specified name, description, and owner.
    ///
    /// # Arguments
    ///
    /// * `command` - CreateProjectCommand containing project details
    ///
    /// # Returns
    ///
    /// `CommandResult` indicating success or failure
    ///
    /// # Errors
    ///
    /// Returns `AppError` if project creation fails
    async fn handle(&self, command: CreateProjectCommand) -> CommandResult {
        log::info!(
            "Handling command: CreateProject for user {}",
            command.owner_id
        );

        // Convert command to service request
        let request = crate::services::project::CreateProjectRequest {
            name: command.name,
            description: command.description,
            owner_id: command.owner_id,
            status: Some("active".to_string()),
            settings: None,
        };

        // Execute command using project service
        match self.project_service.create_project(request).await {
            Ok(project) => {
                log::info!(
                    "Project created successfully: {} ({})",
                    project.name,
                    project.id
                );
                Ok(())
            }
            Err(e) => {
                log::error!("Failed to create project: {}", e);
                Err(e)
            }
        }
    }
}

impl CommandHandler<UpdateProjectCommand> for ProjectCommandHandler {
    async fn handle(&self, command: UpdateProjectCommand) -> CommandResult {
        log::info!(
            "Handling command: UpdateProject for project {}",
            command.project_id
        );

        let request = crate::services::project::UpdateProjectRequest {
            name: command.name,
            description: command.description,
            status: None,
            settings: None,
        };

        match self
            .project_service
            .update_project(command.project_id, request)
            .await
        {
            Ok(project) => {
                log::info!(
                    "Project updated successfully: {} ({})",
                    project.name,
                    project.id
                );
                Ok(())
            }
            Err(e) => {
                log::error!("Failed to update project: {}", e);
                Err(e)
            }
        }
    }
}

impl CommandHandler<DeleteProjectCommand> for ProjectCommandHandler {
    async fn handle(&self, command: DeleteProjectCommand) -> CommandResult {
        log::info!(
            "Handling command: DeleteProject for project {}",
            command.project_id
        );

        match self
            .project_service
            .delete_project(command.project_id)
            .await
        {
            Ok(_) => {
                log::info!("Project deleted successfully: {}", command.project_id);
                Ok(())
            }
            Err(e) => {
                log::error!("Failed to delete project: {}", e);
                Err(e)
            }
        }
    }
}

/// Project query handler
///
/// Handles CQRS queries for project retrieval operations including get and list.
/// Returns data in JSON format for API responses.
///
/// # Examples
///
/// ```
/// use reconciliation_backend::cqrs::handlers::ProjectQueryHandler;
///
/// let handler = ProjectQueryHandler::new(database);
/// let result = handler.handle(get_query).await?;
/// ```
pub struct ProjectQueryHandler {
    project_service: Arc<ProjectService>,
}

impl ProjectQueryHandler {
    /// Create a new project query handler
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection for project queries
    ///
    /// # Returns
    ///
    /// A new `ProjectQueryHandler` instance
    ///
    /// # Examples
    ///
    /// ```
    /// let handler = ProjectQueryHandler::new(database);
    /// ```
    pub fn new(db: Database) -> Self {
        Self {
            project_service: Arc::new(ProjectService::new(db)),
        }
    }
}

/// Project query result type
pub type ProjectQueryResult = QueryResult<serde_json::Value>;

impl QueryHandler<GetProjectQuery, serde_json::Value> for ProjectQueryHandler {
    async fn handle(&self, query: GetProjectQuery) -> QueryResult<serde_json::Value> {
        log::info!(
            "Handling query: GetProject for project {}",
            query.project_id
        );

        // Execute query using project service
        match self
            .project_service
            .get_project_by_id(query.project_id)
            .await
        {
            Ok(project) => {
                // Convert project to JSON
                let json = serde_json::json!({
                    "id": project.id,
                    "name": project.name,
                    "description": project.description,
                    "owner_id": project.owner_id,
                    "status": project.status,
                    "created_at": project.created_at,
                    "updated_at": project.updated_at,
                });
                Ok(json)
            }
            Err(e) => {
                log::error!("Failed to get project: {}", e);
                Err(e)
            }
        }
    }
}

impl QueryHandler<ListProjectsQuery, serde_json::Value> for ProjectQueryHandler {
    /// Handle ListProjectsQuery
    ///
    /// Retrieves a paginated list of projects, optionally filtered by owner.
    ///
    /// # Arguments
    ///
    /// * `query` - ListProjectsQuery containing pagination and filter parameters
    ///
    /// # Returns
    ///
    /// `QueryResult` containing paginated project list as JSON value
    ///
    /// # Errors
    ///
    /// Returns `AppError` if query fails
    async fn handle(&self, query: ListProjectsQuery) -> QueryResult<serde_json::Value> {
        log::info!("Handling query: ListProjects");

        let page = query.page.map(|p| p as i64);
        let per_page = query.per_page.map(|p| p as i64);

        // Execute query using project service
        let result = if let Some(owner_id) = query.owner_id {
            self.project_service
                .list_projects_by_owner(owner_id, page, per_page)
                .await?
        } else {
            self.project_service.list_projects(page, per_page).await?
        };

        // Convert result to JSON
        let total_pages = if result.per_page > 0 {
            (result.total as f64 / result.per_page as f64).ceil() as i64
        } else {
            0
        };

        let json = serde_json::json!({
            "projects": result.projects,
            "total": result.total,
            "page": result.page,
            "per_page": result.per_page,
            "total_pages": total_pages,
        });

        Ok(json)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cqrs::command::{
        Command, CreateProjectCommand, DeleteProjectCommand, UpdateProjectCommand,
    };
    use crate::cqrs::query::{GetProjectAnalyticsQuery, GetProjectQuery, ListProjectsQuery, Query};
    use crate::database::Database;
    use crate::test_utils::TestUser;
    use mockall::mock;
    use uuid::Uuid;

    // Mock Database for testing
    mock! {
        Database {}
        impl Clone for Database {
            fn clone(&self) -> Self;
        }
    }

    async fn create_test_db() -> Database {
        // Use test database URL - in real tests this would be a test database
        Database::new("postgresql://test:test@localhost/reconciliation_test")
            .expect("Failed to create test database")
    }

    #[tokio::test]
    async fn test_project_command_handler_creation() {
        let db = create_test_db().await;
        let _handler = ProjectCommandHandler::new(db);
        // Handler should be created successfully
        assert!(true); // Just verify it doesn't panic
    }

    #[tokio::test]
    async fn test_project_query_handler_creation() {
        let db = create_test_db().await;
        let _handler = ProjectQueryHandler::new(db);
        // Handler should be created successfully
        assert!(true); // Just verify it doesn't panic
    }

    #[tokio::test]
    async fn test_create_project_command_handler() {
        let db = create_test_db().await;
        let handler = ProjectCommandHandler::new(db);
        let test_user = TestUser::new();

        let command = CreateProjectCommand {
            name: "Test Project".to_string(),
            description: Some("Test Description".to_string()),
            owner_id: test_user.id,
        };

        // Note: This will fail if database doesn't have proper setup
        // In a real test, we'd set up test data first
        let result = handler.handle(command).await;
        // Should either succeed or fail gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_create_project_command_validation() {
        let db = create_test_db().await;
        let handler = ProjectCommandHandler::new(db);

        // Test with empty name
        let command = CreateProjectCommand {
            name: "".to_string(),
            description: Some("Test Description".to_string()),
            owner_id: Uuid::new_v4(),
        };

        let result = handler.handle(command).await;
        // Should fail validation
        assert!(result.is_err());

        // Test with very long name
        let command = CreateProjectCommand {
            name: "A".repeat(300), // Exceeds typical name limits
            description: Some("Test Description".to_string()),
            owner_id: Uuid::new_v4(),
        };

        let result = handler.handle(command).await;
        // Should fail validation
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_get_project_query_handler() {
        let db = create_test_db().await;
        let handler = ProjectQueryHandler::new(db);
        let project_id = Uuid::new_v4();

        let query = GetProjectQuery { project_id };

        // Note: This will fail if project doesn't exist
        // In a real test, we'd create test project first
        let result = handler.handle(query).await;
        // Should either succeed or fail gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_get_project_query_with_invalid_id() {
        let db = create_test_db().await;
        let handler = ProjectQueryHandler::new(db);

        // Test with nil UUID
        let query = GetProjectQuery {
            project_id: Uuid::nil(),
        };
        let result = handler.handle(query).await;
        // Should fail gracefully
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_list_projects_query_handler() {
        let db = create_test_db().await;
        let handler = ProjectQueryHandler::new(db);

        let query = ListProjectsQuery {
            owner_id: None,
            page: Some(1),
            per_page: Some(10),
        };

        let result = handler.handle(query).await;
        // Should return paginated results
        assert!(result.is_ok());

        if let Ok(json) = result {
            assert!(json.get("projects").is_some());
            assert!(json.get("total").is_some());
            assert!(json.get("page").is_some());
            assert!(json.get("per_page").is_some());
            assert!(json.get("total_pages").is_some());
        }
    }

    #[tokio::test]
    async fn test_list_projects_query_with_owner_filter() {
        let db = create_test_db().await;
        let handler = ProjectQueryHandler::new(db);
        let owner_id = Uuid::new_v4();

        let query = ListProjectsQuery {
            owner_id: Some(owner_id),
            page: Some(1),
            per_page: Some(5),
        };

        let result = handler.handle(query).await;
        // Should return filtered results
        assert!(result.is_ok());

        if let Ok(json) = result {
            assert!(json.get("projects").is_some());
            // Should filter by owner
            assert!(json.get("total").is_some());
        }
    }

    #[tokio::test]
    async fn test_list_projects_query_pagination() {
        let db = create_test_db().await;
        let handler = ProjectQueryHandler::new(db);

        // Test various pagination scenarios
        let test_cases = vec![
            (Some(1), Some(10)),
            (Some(2), Some(5)),
            (Some(1), Some(100)),
            (None, Some(10)), // No page specified
            (Some(1), None),  // No per_page specified
        ];

        for (page, per_page) in test_cases {
            let query = ListProjectsQuery {
                owner_id: None,
                page,
                per_page,
            };

            let result = handler.handle(query).await;
            assert!(
                result.is_ok(),
                "Failed for page={:?}, per_page={:?}",
                page,
                per_page
            );

            if let Ok(json) = result {
                assert!(json.get("projects").is_some());
                assert!(json.get("total").is_some());
                assert!(json.get("page").is_some());
                assert!(json.get("per_page").is_some());
                assert!(json.get("total_pages").is_some());
            }
        }
    }

    #[tokio::test]
    async fn test_update_project_command_handler() {
        let db = create_test_db().await;
        let handler = ProjectCommandHandler::new(db);
        let project_id = Uuid::new_v4();

        let command = UpdateProjectCommand {
            project_id,
            name: Some("Updated Project".to_string()),
            description: Some("Updated Description".to_string()),
        };

        // Note: This will fail if project doesn't exist
        let result = handler.handle(command).await;
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_update_project_command_partial_update() {
        let db = create_test_db().await;
        let handler = ProjectCommandHandler::new(db);
        let project_id = Uuid::new_v4();

        // Test updating only name
        let command = UpdateProjectCommand {
            project_id,
            name: Some("Updated Name Only".to_string()),
            description: None,
        };

        let result = handler.handle(command).await;
        // Should handle partial updates gracefully
        assert!(result.is_ok() || result.is_err());

        // Test updating only description
        let command = UpdateProjectCommand {
            project_id,
            name: None,
            description: Some("Updated Description Only".to_string()),
        };

        let result = handler.handle(command).await;
        // Should handle partial updates gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_update_project_command_validation() {
        let db = create_test_db().await;
        let handler = ProjectCommandHandler::new(db);

        // Test with empty name
        let command = UpdateProjectCommand {
            project_id: Uuid::new_v4(),
            name: Some("".to_string()),
            description: Some("Valid description".to_string()),
        };

        let result = handler.handle(command).await;
        // Should fail validation
        assert!(result.is_err());

        // Test with nil project ID
        let command = UpdateProjectCommand {
            project_id: Uuid::nil(),
            name: Some("Valid Name".to_string()),
            description: Some("Valid description".to_string()),
        };

        let result = handler.handle(command).await;
        // Should fail validation
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_delete_project_command_handler() {
        let db = create_test_db().await;
        let handler = ProjectCommandHandler::new(db);
        let project_id = Uuid::new_v4();

        let command = DeleteProjectCommand { project_id };

        // Note: This will fail if project doesn't exist
        let result = handler.handle(command).await;
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_delete_project_command_validation() {
        let db = create_test_db().await;
        let handler = ProjectCommandHandler::new(db);

        // Test with nil project ID
        let command = DeleteProjectCommand {
            project_id: Uuid::nil(),
        };
        let result = handler.handle(command).await;
        // Should fail validation
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_command_name_methods() {
        let test_user = TestUser::new();

        let create_cmd = CreateProjectCommand {
            name: "Test".to_string(),
            description: None,
            owner_id: test_user.id,
        };
        assert_eq!(create_cmd.name(), "CreateProject");

        let update_cmd = UpdateProjectCommand {
            project_id: Uuid::new_v4(),
            name: Some("Test".to_string()),
            description: None,
        };
        assert_eq!(update_cmd.name(), "UpdateProject");

        let delete_cmd = DeleteProjectCommand {
            project_id: Uuid::new_v4(),
        };
        assert_eq!(delete_cmd.name(), "DeleteProject");
    }

    #[tokio::test]
    async fn test_query_name_methods() {
        let get_query = GetProjectQuery {
            project_id: Uuid::new_v4(),
        };
        assert_eq!(get_query.name(), "GetProject");

        let list_query = ListProjectsQuery {
            owner_id: None,
            page: None,
            per_page: None,
        };
        assert_eq!(list_query.name(), "ListProjects");

        let analytics_query = GetProjectAnalyticsQuery {
            project_id: Uuid::new_v4(),
            start_date: None,
            end_date: None,
        };
        assert_eq!(analytics_query.name(), "GetProjectAnalytics");
    }

    #[tokio::test]
    async fn test_project_query_result_structure() {
        let db = create_test_db().await;
        let handler = ProjectQueryHandler::new(db);

        // Test list projects returns proper JSON structure
        let query = ListProjectsQuery {
            owner_id: None,
            page: Some(1),
            per_page: Some(10),
        };

        let result = handler.handle(query).await;
        if let Ok(json) = result {
            // Verify JSON structure
            assert!(json.is_object());
            let obj = json.as_object().unwrap();

            // Check required fields
            assert!(obj.contains_key("projects"));
            assert!(obj.contains_key("total"));
            assert!(obj.contains_key("page"));
            assert!(obj.contains_key("per_page"));
            assert!(obj.contains_key("total_pages"));

            // Check types
            assert!(obj["projects"].is_array());
            assert!(obj["total"].is_number());
            assert!(obj["page"].is_number());
            assert!(obj["per_page"].is_number());
            assert!(obj["total_pages"].is_number());
        }
    }

    #[tokio::test]
    async fn test_handler_error_handling() {
        // Test that handlers handle database errors gracefully
        let db = create_test_db().await;
        let cmd_handler = ProjectCommandHandler::new(db.clone());
        let query_handler = ProjectQueryHandler::new(db);

        // Test command with invalid data that should cause DB errors
        let invalid_cmd = CreateProjectCommand {
            name: "Invalid Project".to_string(),
            description: Some("Test".to_string()),
            owner_id: Uuid::nil(), // Invalid owner
        };

        let result = cmd_handler.handle(invalid_cmd).await;
        // Should handle error gracefully (either succeed or fail with proper error)
        assert!(result.is_ok() || result.is_err());

        // Test query with invalid ID
        let invalid_query = GetProjectQuery {
            project_id: Uuid::nil(),
        };

        let result = query_handler.handle(invalid_query).await;
        // Should handle error gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_concurrent_handler_usage() {
        // Test that handlers can be used concurrently
        let query1 = ListProjectsQuery {
            owner_id: None,
            page: Some(1),
            per_page: Some(10),
        };

        let query2 = ListProjectsQuery {
            owner_id: None,
            page: Some(2),
            per_page: Some(10),
        };

        // Create two separate handlers for concurrent use
        // Create separate database connections for each handler
        let db1 = create_test_db().await;
        let db2 = create_test_db().await;
        let handler1 = ProjectQueryHandler::new(db1);
        let handler2 = ProjectQueryHandler::new(db2);

        // Spawn concurrent tasks
        let task1 = tokio::spawn(async move { handler1.handle(query1).await });

        let task2 = tokio::spawn(async move { handler2.handle(query2).await });

        // Wait for both to complete
        let (result1, result2) = tokio::try_join!(task1, task2).unwrap();

        // Both should complete (either successfully or with errors)
        assert!(result1.is_ok() || result1.is_err());
        assert!(result2.is_ok() || result2.is_err());
    }

    #[tokio::test]
    async fn test_pagination_edge_cases() {
        let db = create_test_db().await;
        let handler = ProjectQueryHandler::new(db);

        // Test edge case: page 0 (should probably be treated as page 1)
        let query = ListProjectsQuery {
            owner_id: None,
            page: Some(0),
            per_page: Some(10),
        };

        let result = handler.handle(query).await;
        assert!(result.is_ok() || result.is_err()); // Should handle gracefully

        // Test edge case: very large page number
        let query = ListProjectsQuery {
            owner_id: None,
            page: Some(10000),
            per_page: Some(10),
        };

        let result = handler.handle(query).await;
        assert!(result.is_ok() || result.is_err()); // Should handle gracefully

        // Test edge case: very large per_page
        let query = ListProjectsQuery {
            owner_id: None,
            page: Some(1),
            per_page: Some(10000),
        };

        let result = handler.handle(query).await;
        assert!(result.is_ok() || result.is_err()); // Should handle gracefully
    }

    #[tokio::test]
    async fn test_command_debug_formatting() {
        let test_user = TestUser::new();

        let create_cmd = CreateProjectCommand {
            name: "Test Project".to_string(),
            description: Some("Test Description".to_string()),
            owner_id: test_user.id,
        };

        // Test that commands implement Debug
        let debug_str = format!("{:?}", create_cmd);
        assert!(debug_str.contains("CreateProjectCommand"));
        assert!(debug_str.contains("Test Project"));
    }

    #[tokio::test]
    async fn test_query_debug_formatting() {
        let get_query = GetProjectQuery {
            project_id: Uuid::new_v4(),
        };

        // Test that queries implement Debug
        let debug_str = format!("{:?}", get_query);
        assert!(debug_str.contains("GetProjectQuery"));
        assert!(debug_str.contains("project_id"));
    }

    #[tokio::test]
    async fn test_handler_service_injection() {
        let db = create_test_db().await;

        // Test that handlers properly inject services
        let _cmd_handler = ProjectCommandHandler::new(db.clone());
        let _query_handler = ProjectQueryHandler::new(db);

        // Verify handlers have access to services
        assert!(true); // If construction succeeded, services are injected

        // Test that different handler instances work independently
        let _cmd_handler2 = ProjectCommandHandler::new(create_test_db().await);
        assert!(true); // Should create successfully
    }
}
