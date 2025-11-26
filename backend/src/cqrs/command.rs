//! Command module for CQRS pattern
//!
//! Commands represent write operations that modify state.

use crate::errors::AppResult;
use serde::{Deserialize, Serialize};
use std::fmt::Debug;

/// Trait for commands (write operations)
pub trait Command: Send + Sync + Debug {
    /// Command name for logging and debugging
    fn name(&self) -> &'static str;
}

/// Command handler trait
pub trait CommandHandler<C: Command>: Send + Sync {
    /// Handle a command
    async fn handle(&self, command: C) -> CommandResult;
}

/// Command result
pub type CommandResult = AppResult<()>;

/// Example command implementations

/// Create project command
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProjectCommand {
    pub name: String,
    pub description: Option<String>,
    pub owner_id: uuid::Uuid,
}

impl Command for CreateProjectCommand {
    fn name(&self) -> &'static str {
        "CreateProject"
    }
}

/// Update project command
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProjectCommand {
    pub project_id: uuid::Uuid,
    pub name: Option<String>,
    pub description: Option<String>,
}

impl Command for UpdateProjectCommand {
    fn name(&self) -> &'static str {
        "UpdateProject"
    }
}

/// Delete project command
#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteProjectCommand {
    pub project_id: uuid::Uuid,
}

impl Command for DeleteProjectCommand {
    fn name(&self) -> &'static str {
        "DeleteProject"
    }
}

