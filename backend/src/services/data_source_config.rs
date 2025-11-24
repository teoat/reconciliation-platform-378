//! Configuration structs for data source operations
//!
//! This module provides configuration structs to reduce function argument complexity

use serde_json::Value;
use uuid::Uuid;

/// Configuration for creating a data source
#[derive(Debug, Clone)]
pub struct CreateDataSourceConfig {
    pub project_id: Uuid,
    pub name: String,
    pub source_type: String,
    pub file_path: Option<String>,
    pub file_size: Option<i64>,
    pub file_hash: Option<String>,
    pub schema: Option<Value>,
}

/// Configuration for updating a data source
#[derive(Debug, Clone)]
pub struct UpdateDataSourceConfig {
    pub id: Uuid,
    pub name: Option<String>,
    pub description: Option<String>,
    pub source_type: Option<String>,
    pub file_path: Option<String>,
    pub file_size: Option<i64>,
    pub file_hash: Option<String>,
    pub schema: Option<Value>,
    pub status: Option<String>,
}


