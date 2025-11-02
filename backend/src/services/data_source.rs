//! Data source service for the Reconciliation Backend
//! 
//! This module provides data source management functionality including
//! CRUD operations, file processing, and data source validation.

use diesel::prelude::*;
use crate::models::JsonValue;
use uuid::Uuid;
use chrono::Utc;
use serde::Serialize;

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::{
    DataSource, NewDataSource, UpdateDataSource,
};
use crate::models::schema::projects::data_sources;

/// Data source service
pub struct DataSourceService {
    db: Database,
}

impl DataSourceService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }
    
    /// Create a new data source
    pub async fn create_data_source(
        &self,
        project_id: Uuid,
        name: String,
        source_type: String,
        file_path: Option<String>,
        file_size: Option<i64>,
        file_hash: Option<String>,
        schema: Option<JsonValue>,
    ) -> AppResult<DataSource> {
        let mut conn = self.db.get_connection()?;
        
        let new_data_source = NewDataSource {
            project_id,
            name,
            description: None,
            source_type,
            connection_config: None,
            file_path,
            file_size,
            file_hash,
            record_count: None,
            schema: schema.map(|s| s),
            status: "uploaded".to_string(),
            uploaded_at: Some(Utc::now()),
            processed_at: None,
            is_active: true,
        };
        
        let data_source = diesel::insert_into(data_sources::table)
            .values(new_data_source)
            .get_result(&mut conn)
            .map_err(AppError::Database)?;
        
        Ok(data_source)
    }
    
    /// Get data sources for a project
    pub async fn get_project_data_sources(&self, project_id: Uuid) -> AppResult<Vec<DataSource>> {
        let mut conn = self.db.get_connection()?;
        
        let sources = data_sources::table
            .filter(data_sources::project_id.eq(project_id))
            .filter(data_sources::is_active.eq(true))
            .order(data_sources::created_at.desc())
            .load::<DataSource>(&mut conn)
            .map_err(AppError::Database)?;
        
        Ok(sources)
    }
    
    /// Get a data source by ID
    pub async fn get_data_source(&self, id: Uuid) -> AppResult<Option<DataSource>> {
        let mut conn = self.db.get_connection()?;
        
        let data_source = data_sources::table
            .filter(data_sources::id.eq(id))
            .filter(data_sources::is_active.eq(true))
            .first::<DataSource>(&mut conn)
            .optional()
            .map_err(AppError::Database)?;
        
        Ok(data_source)
    }
    
    /// Update a data source
    pub async fn update_data_source(
        &self,
        id: Uuid,
        name: Option<String>,
        description: Option<String>,
        source_type: Option<String>,
        file_path: Option<String>,
        file_size: Option<i64>,
        file_hash: Option<String>,
        schema: Option<JsonValue>,
        status: Option<String>,
    ) -> AppResult<DataSource> {
        let mut conn = self.db.get_connection()?;
        
        let update_data = UpdateDataSource {
            name,
            description,
            source_type,
            connection_config: None,
            file_path,
            file_size,
            file_hash,
            record_count: None,
            schema: schema.map(|s| s),
            status,
            uploaded_at: None,
            processed_at: Some(Utc::now()),
            is_active: None,
        };
        
        let data_source = diesel::update(data_sources::table)
            .filter(data_sources::id.eq(id))
            .set(update_data)
            .returning(DataSource::as_returning())
            .get_result(&mut conn)
            .map_err(AppError::Database)?;
        
        Ok(data_source)
    }
    
    /// Delete a data source (soft delete)
    pub async fn delete_data_source(&self, id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        
        diesel::update(data_sources::table)
            .filter(data_sources::id.eq(id))
            .set(data_sources::is_active.eq(false))
            .execute(&mut conn)
            .map_err(AppError::Database)?;
        
        Ok(())
    }
    
    /// Get data source statistics
    pub async fn get_data_source_stats(&self, project_id: Uuid) -> AppResult<DataSourceStats> {
        let mut conn = self.db.get_connection()?;
        
        let total_count = data_sources::table
            .filter(data_sources::project_id.eq(project_id))
            .filter(data_sources::is_active.eq(true))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;
        
        let csv_count = data_sources::table
            .filter(data_sources::project_id.eq(project_id))
            .filter(data_sources::source_type.eq("csv"))
            .filter(data_sources::is_active.eq(true))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;
        
        let json_count = data_sources::table
            .filter(data_sources::project_id.eq(project_id))
            .filter(data_sources::source_type.eq("json"))
            .filter(data_sources::is_active.eq(true))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;
        
        let processed_count = data_sources::table
            .filter(data_sources::project_id.eq(project_id))
            .filter(data_sources::status.eq("processed"))
            .filter(data_sources::is_active.eq(true))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;
        
        Ok(DataSourceStats {
            total_count,
            csv_count,
            json_count,
            processed_count,
            pending_count: total_count - processed_count,
        })
    }
    
    /// Validate data source
    pub async fn validate_data_source(&self, id: Uuid) -> AppResult<DataSourceValidation> {
        let data_source = self.get_data_source(id).await?
            .ok_or_else(|| AppError::NotFound("Data source not found".to_string()))?;
        
        let mut validation = DataSourceValidation {
            id: data_source.id,
            name: data_source.name,
            is_valid: true,
            errors: Vec::new(),
            warnings: Vec::new(),
        };
        
        // Check if file exists
        if let Some(file_path) = &data_source.file_path {
            if !std::path::Path::new(file_path).exists() {
                validation.is_valid = false;
                validation.errors.push("File does not exist".to_string());
            }
        }
        
        // Check file size
        if let Some(file_size) = data_source.file_size {
            if file_size <= 0 {
                validation.is_valid = false;
                validation.errors.push("Invalid file size".to_string());
            } else if file_size > 100 * 1024 * 1024 { // 100MB limit
                validation.warnings.push("File size exceeds recommended limit".to_string());
            }
        }
        
        // Check source type
        if !["csv", "json", "xlsx", "txt"].contains(&data_source.source_type.as_str()) {
            validation.is_valid = false;
            validation.errors.push("Unsupported source type".to_string());
        }
        
        // Check schema
        if let Some(schema) = &data_source.schema {
            if schema.0.is_null() {
                validation.warnings.push("Schema is null".to_string());
            }
        }
        
        Ok(validation)
    }
}

/// Data source statistics
#[derive(Debug, Serialize)]
pub struct DataSourceStats {
    pub total_count: i64,
    pub csv_count: i64,
    pub json_count: i64,
    pub processed_count: i64,
    pub pending_count: i64,
}

/// Data source validation result
#[derive(Debug, Serialize)]
pub struct DataSourceValidation {
    pub id: Uuid,
    pub name: String,
    pub is_valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}
