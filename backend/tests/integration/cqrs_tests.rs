//! Integration tests for CQRS pattern

use reconciliation_backend::cqrs::command::{Command, CommandHandler, CreateProjectCommand};
use reconciliation_backend::cqrs::query::{Query, QueryHandler, GetProjectQuery};
use reconciliation_backend::cqrs::handlers::{ProjectCommandHandler, ProjectQueryHandler};
use reconciliation_backend::cqrs::event_bus::{EventBus, Event, ProjectCreatedEvent};
use uuid::Uuid;

#[tokio::test]
async fn test_command_handler() {
    let handler = ProjectCommandHandler::new();
    let command = CreateProjectCommand {
        name: "Test Project".to_string(),
        description: Some("Test Description".to_string()),
        owner_id: uuid::Uuid::new_v4(),
    };

    let result = handler.handle(command).await;
    assert!(result.is_ok(), "Command handler should succeed");
}

#[tokio::test]
async fn test_query_handler() {
    let handler = ProjectQueryHandler::new();
    let query = GetProjectQuery {
        project_id: uuid::Uuid::new_v4(),
    };

    let result = handler.handle(query).await;
    // Query handler returns NotFound for now (expected)
    assert!(result.is_err(), "Query handler should return error for non-existent project");
}

#[tokio::test]
async fn test_event_bus() {
    let event_bus = EventBus::new();
    
    let event = ProjectCreatedEvent {
        project_id: uuid::Uuid::new_v4(),
        name: "Test Project".to_string(),
        owner_id: uuid::Uuid::new_v4(),
        created_at: chrono::Utc::now(),
    };

    let result = event_bus.publish(event).await;
    assert!(result.is_ok(), "Event bus publish should succeed");
}

#[tokio::test]
async fn test_command_trait() {
    let command = CreateProjectCommand {
        name: "Test".to_string(),
        description: None,
        owner_id: uuid::Uuid::new_v4(),
    };
    
    assert_eq!(command.name(), "CreateProject");
}

#[tokio::test]
async fn test_query_trait() {
    let query = GetProjectQuery {
        project_id: uuid::Uuid::new_v4(),
    };
    
    assert_eq!(query.name(), "GetProject");
}

#[tokio::test]
async fn test_event_trait() {
    let event = ProjectCreatedEvent {
        project_id: uuid::Uuid::new_v4(),
        name: "Test".to_string(),
        owner_id: uuid::Uuid::new_v4(),
        created_at: chrono::Utc::now(),
    };
    
    assert_eq!(event.name(), "ProjectCreated");
}

