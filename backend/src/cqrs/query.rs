//! Query module for CQRS pattern
//!
//! Queries represent read operations that don't modify state.

use crate::errors::AppResult;
use serde::{Deserialize, Serialize};
use std::fmt::Debug;

/// Trait for queries (read operations)
pub trait Query: Send + Sync + Debug {
    /// Query name for logging and debugging
    fn name(&self) -> &'static str;
}

/// Query handler trait
pub trait QueryHandler<Q: Query, R>: Send + Sync {
    /// Handle a query and return result
    fn handle(&self, query: Q) -> impl std::future::Future<Output = QueryResult<R>> + Send;
}

/// Query result
pub type QueryResult<T> = AppResult<T>;

/// Example query implementations

/// Get project by ID query
#[derive(Debug, Serialize, Deserialize)]
pub struct GetProjectQuery {
    pub project_id: uuid::Uuid,
}

impl Query for GetProjectQuery {
    fn name(&self) -> &'static str {
        "GetProject"
    }
}

/// List projects query
#[derive(Debug, Serialize, Deserialize)]
pub struct ListProjectsQuery {
    pub owner_id: Option<uuid::Uuid>,
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

impl Query for ListProjectsQuery {
    fn name(&self) -> &'static str {
        "ListProjects"
    }
}

/// Get project analytics query
#[derive(Debug, Serialize, Deserialize)]
pub struct GetProjectAnalyticsQuery {
    pub project_id: uuid::Uuid,
    pub start_date: Option<chrono::DateTime<chrono::Utc>>,
    pub end_date: Option<chrono::DateTime<chrono::Utc>>,
}

impl Query for GetProjectAnalyticsQuery {
    fn name(&self) -> &'static str {
        "GetProjectAnalytics"
    }
}

