//! Data source service for the Reconciliation Backend
//!
//! This module provides data source management functionality including
//! CRUD operations, file processing, and data source validation.

use diesel::prelude::*;

use chrono::Utc;
use serde::Serialize;
use uuid::Uuid;

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::data_sources;
use crate::models::{DataSource, NewDataSource, UpdateDataSource};
use super::data_source_config::{CreateDataSourceConfig, UpdateDataSourceConfig};

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
        config: CreateDataSourceConfig,
    ) -> AppResult<DataSource> {
        let mut conn = self.db.get_connection()?;

        let new_data_source = NewDataSource {
            project_id: config.project_id,
            name: config.name.clone(),
            description: None,
            source_type: config.source_type,
            connection_config: None,
            file_path: config.file_path,
            file_size: config.file_size,
            file_hash: config.file_hash,
            record_count: None,
            schema: config.schema,
            status: "uploaded".to_string(),
            uploaded_at: Some(Utc::now()),
            processed_at: None,
            is_active: true,
        };

        // Use raw SQL insert to avoid trait issues
        #[derive(QueryableByName)]
        #[allow(dead_code)]
        struct DataSourceResult {
            #[diesel(sql_type = diesel::sql_types::Uuid)]
            id: Uuid,
            #[diesel(sql_type = diesel::sql_types::Uuid)]
            project_id: Uuid,
            #[diesel(sql_type = diesel::sql_types::Text)]
            name: String,
            #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Text>)]
            description: Option<String>,
            #[diesel(sql_type = diesel::sql_types::Text)]
            source_type: String,
            #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Jsonb>)]
            connection_config: Option<serde_json::Value>,
            #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Text>)]
            file_path: Option<String>,
            #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Int8>)]
            file_size: Option<i64>,
            #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Text>)]
            file_hash: Option<String>,
            #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Int4>)]
            record_count: Option<i32>,
            #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Jsonb>)]
            schema: Option<serde_json::Value>,
            #[diesel(sql_type = diesel::sql_types::Text)]
            status: String,
            #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Timestamptz>)]
            uploaded_at: Option<chrono::DateTime<chrono::Utc>>,
            #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Timestamptz>)]
            processed_at: Option<chrono::DateTime<chrono::Utc>>,
            #[diesel(sql_type = diesel::sql_types::Bool)]
            is_active: bool,
            #[diesel(sql_type = diesel::sql_types::Timestamptz)]
            created_at: chrono::DateTime<chrono::Utc>,
            #[diesel(sql_type = diesel::sql_types::Timestamptz)]
            updated_at: chrono::DateTime<chrono::Utc>,
        }

        let result: DataSourceResult = diesel::sql_query(
            "INSERT INTO data_sources (project_id, name, description, source_type, connection_config, file_path, file_size, file_hash, record_count, schema, status, uploaded_at, processed_at, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
             RETURNING id, project_id, name, description, source_type, connection_config, file_path, file_size, file_hash, record_count, schema, status, uploaded_at, processed_at, is_active, created_at, updated_at"
        )
        .bind::<diesel::sql_types::Uuid, _>(new_data_source.project_id)
        .bind::<diesel::sql_types::Text, _>(new_data_source.name)
        .bind::<diesel::sql_types::Nullable<diesel::sql_types::Text>, _>(new_data_source.description)
        .bind::<diesel::sql_types::Text, _>(new_data_source.source_type)
        .bind::<diesel::sql_types::Nullable<diesel::sql_types::Jsonb>, _>(new_data_source.connection_config)
        .bind::<diesel::sql_types::Nullable<diesel::sql_types::Text>, _>(new_data_source.file_path)
        .bind::<diesel::sql_types::Nullable<diesel::sql_types::Int8>, _>(new_data_source.file_size)
        .bind::<diesel::sql_types::Nullable<diesel::sql_types::Text>, _>(new_data_source.file_hash)
        .bind::<diesel::sql_types::Nullable<diesel::sql_types::Int4>, _>(new_data_source.record_count)
        .bind::<diesel::sql_types::Nullable<diesel::sql_types::Jsonb>, _>(new_data_source.schema)
        .bind::<diesel::sql_types::Text, _>(new_data_source.status)
        .bind::<diesel::sql_types::Nullable<diesel::sql_types::Timestamptz>, _>(new_data_source.uploaded_at)
        .bind::<diesel::sql_types::Nullable<diesel::sql_types::Timestamptz>, _>(new_data_source.processed_at)
        .bind::<diesel::sql_types::Bool, _>(new_data_source.is_active)
        .bind::<diesel::sql_types::Timestamptz, _>(chrono::Utc::now())
        .bind::<diesel::sql_types::Timestamptz, _>(chrono::Utc::now())
        .get_result(&mut conn)
        .map_err(AppError::Database)?;

        let data_source = DataSource {
            id: result.id,
            project_id: result.project_id,
            name: result.name,
            description: result.description,
            source_type: result.source_type,
            connection_config: result.connection_config,
            file_path: result.file_path,
            file_size: result.file_size,
            file_hash: result.file_hash,
            record_count: result.record_count,
            schema: result.schema,
            status: result.status,
            uploaded_at: result.uploaded_at,
            processed_at: result.processed_at,
            is_active: result.is_active,
            created_at: result.created_at,
            updated_at: result.updated_at,
        };

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
        config: UpdateDataSourceConfig,
    ) -> AppResult<DataSource> {
        let mut conn = self.db.get_connection()?;

        let update_data = UpdateDataSource {
            name: config.name,
            description: config.description,
            source_type: config.source_type,
            connection_config: None,
            file_path: config.file_path,
            file_size: config.file_size,
            file_hash: config.file_hash,
            record_count: None,
            schema: config.schema,
            status: config.status,
            uploaded_at: None,
            processed_at: Some(Utc::now()),
            is_active: None,
        };

        // Build update query manually to handle JsonValue properly
        let update_query =
            diesel::update(data_sources::table.filter(data_sources::id.eq(config.id))).set((
                update_data.name.map(|name| data_sources::name.eq(name)),
                update_data
                    .description
                    .map(|desc| data_sources::description.eq(desc)),
                update_data
                    .source_type
                    .map(|st| data_sources::source_type.eq(st)),
                update_data
                    .connection_config
                    .map(|cc| data_sources::connection_config.eq(cc)),
                update_data
                    .file_path
                    .map(|fp| data_sources::file_path.eq(fp)),
                update_data
                    .file_size
                    .map(|fs| data_sources::file_size.eq(fs)),
                update_data
                    .file_hash
                    .map(|fh| data_sources::file_hash.eq(fh)),
                update_data
                    .record_count
                    .map(|rc| data_sources::record_count.eq(rc)),
                update_data.schema.map(|s| data_sources::schema.eq(s)),
                update_data
                    .status
                    .map(|status| data_sources::status.eq(status)),
                update_data
                    .uploaded_at
                    .map(|ua| data_sources::uploaded_at.eq(ua)),
                update_data
                    .processed_at
                    .map(|pa| data_sources::processed_at.eq(pa)),
                update_data
                    .is_active
                    .map(|ia| data_sources::is_active.eq(ia)),
            ));

        let data_source = update_query
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
        let data_source = self
            .get_data_source(id)
            .await?
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
            } else if file_size > 100 * 1024 * 1024 {
                // 100MB limit
                validation
                    .warnings
                    .push("File size exceeds recommended limit".to_string());
            }
        }

        // Check source type
        if !["csv", "json", "xlsx", "txt"].contains(&data_source.source_type.as_str()) {
            validation.is_valid = false;
            validation
                .errors
                .push("Unsupported source type".to_string());
        }

        // Check schema
        if let Some(schema) = &data_source.schema {
            if schema.is_null() {
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
