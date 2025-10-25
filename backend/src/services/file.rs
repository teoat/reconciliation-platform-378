//! File service for the Reconciliation Backend
//! 
//! This module provides file upload, processing, and management functionality.

use actix_multipart::Multipart;
use futures::{StreamExt, TryStreamExt};
use uuid::Uuid;
use std::path::Path;
use std::fs;
use sha2::{Sha256, Digest};
use chrono::Utc;
use serde::{Deserialize, Serialize};

use crate::database::{Database, utils::with_transaction};
use crate::errors::{AppError, AppResult};
use crate::models::{
    UploadedFile, NewUploadedFile, ReconciliationRecord, NewReconciliationRecord,
    schema::{uploaded_files, reconciliation_records},
};
use diesel::prelude::*;

/// File service for handling file uploads and processing
pub struct FileService {
    db: Database,
    upload_path: String,
}

/// File validation result
#[derive(Debug, Serialize)]
pub struct FileValidationResult {
    pub is_valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub estimated_records: i32,
}

/// Batch processing result
#[derive(Debug, Serialize)]
pub struct BatchProcessingResult {
    pub total_processed: i32,
    pub total_errors: i32,
    pub errors: Vec<String>,
}

/// File upload request
#[derive(Debug, Deserialize)]
pub struct FileUploadRequest {
    pub project_id: Uuid,
    pub name: String,
    pub source_type: String,
}

/// File information response
#[derive(Debug, Serialize)]
pub struct FileInfo {
    pub id: Uuid,
    pub project_id: Uuid,
    pub filename: String,
    pub original_filename: String,
    pub file_size: i64,
    pub content_type: String,
    pub file_path: String,
    pub status: String,
    pub uploaded_by: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// File processing result
#[derive(Debug, Serialize)]
pub struct ProcessingResult {
    pub file_id: Uuid,
    pub status: String,
    pub record_count: Option<i32>,
    pub processing_time: f64,
    pub errors: Vec<String>,
}

impl FileService {
    pub fn new(db: Database, upload_path: String) -> Self {
        Self { db, upload_path }
    }
    
    /// Upload a file
    pub async fn upload_file(
        &self,
        mut payload: Multipart,
        project_id: Uuid,
        user_id: Uuid,
    ) -> AppResult<FileInfo> {
        // Create upload directory if it doesn't exist
        let project_dir = format!("{}/{}", self.upload_path, project_id);
        fs::create_dir_all(&project_dir)
            .map_err(|e| AppError::Internal(format!("Failed to create upload directory: {}", e)))?;
        
        // Process multipart data
        let mut file_data = Vec::new();
        let mut filename = String::new();
        let mut content_type = String::new();
        
        while let Some(item) = payload.try_next().await
            .map_err(|e| AppError::Internal(format!("Failed to process multipart: {}", e)))? {
            
            match item.name() {
                "file" => {
                    let mut field = item;
                    filename = field.content_disposition().get_filename()
                        .unwrap_or("unknown")
                        .to_string();
                    
                    content_type = field.content_type()
                        .map(|mime| mime.to_string())
                        .unwrap_or_else(|| "application/octet-stream".to_string());
                    
                    while let Some(chunk) = field.try_next().await
                        .map_err(|e| AppError::Internal(format!("Failed to read file chunk: {}", e)))? {
                        file_data.extend_from_slice(&chunk);
                    }
                }
                _ => {
                    // Skip other fields
                }
            }
        }
        
        if file_data.is_empty() {
            return Err(AppError::Validation("No file data received".to_string()));
        }
        
        // Generate unique filename
        let file_id = Uuid::new_v4();
        let file_extension = Path::new(&filename)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");
        let unique_filename = format!("{}.{}", file_id, file_extension);
        let file_path = format!("{}/{}", project_dir, unique_filename);
        
        // Calculate file hash
        let mut hasher = Sha256::new();
        hasher.update(&file_data);
        let file_hash = format!("{:x}", hasher.finalize());
        
        // Save file to disk
        fs::write(&file_path, &file_data)
            .map_err(|e| AppError::Internal(format!("Failed to save file: {}", e)))?;
        
        // Create database record
        let now = Utc::now();
        let new_file = NewUploadedFile {
            project_id,
            filename: unique_filename,
            original_filename: filename.clone(),
            file_size: file_data.len() as i64,
            content_type: content_type.clone(),
            file_path: file_path.clone(),
            status: "uploaded".to_string(),
            uploaded_by: user_id,
        };
        
        with_transaction(self.db.get_pool(), |tx| {
            diesel::insert_into(uploaded_files::table)
                .values(&new_file)
                .execute(tx)
                .map_err(|e| AppError::Database(e))?;
            
            Ok(())
        }).await?;
        
        // Return file info
        Ok(FileInfo {
            id: file_id,
            project_id,
            filename: unique_filename,
            original_filename: filename,
            file_size: file_data.len() as i64,
            content_type,
            file_path,
            status: "uploaded".to_string(),
            uploaded_by: user_id,
            created_at: now,
            updated_at: now,
        })
    }
    
    /// Process a file
    pub async fn process_file(&self, file_id: Uuid) -> AppResult<ProcessingResult> {
        let mut conn = self.db.get_connection()?;
        
        // Get file information
        let file = uploaded_files::table
            .filter(uploaded_files::id.eq(file_id))
            .first::<UploadedFile>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        let start_time = std::time::Instant::now();
        let mut errors = Vec::new();
        
        // Read file content
        let file_content = fs::read(&file.file_path)
            .map_err(|e| {
                errors.push(format!("Failed to read file: {}", e));
                AppError::Internal(format!("Failed to read file: {}", e))
            })?;
        
        // Process based on content type
        let record_count = match file.content_type.as_str() {
            "text/csv" | "application/csv" => {
                self.process_csv_file(&file_content, file.project_id).await
                    .map_err(|e| {
                        errors.push(format!("CSV processing error: {}", e));
                        e
                    })?
            }
            "application/json" => {
                self.process_json_file(&file_content, file.project_id).await
                    .map_err(|e| {
                        errors.push(format!("JSON processing error: {}", e));
                        e
                    })?
            }
            _ => {
                errors.push(format!("Unsupported file type: {}", file.content_type));
                return Err(AppError::Validation(format!("Unsupported file type: {}", file.content_type)));
            }
        };
        
        let processing_time = start_time.elapsed().as_secs_f64();
        
        // Update file status
        diesel::update(uploaded_files::table.filter(uploaded_files::id.eq(file_id)))
            .set((
                uploaded_files::status.eq("processed"),
                uploaded_files::updated_at.eq(Utc::now()),
            ))
            .execute(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        Ok(ProcessingResult {
            file_id,
            status: if errors.is_empty() { "success".to_string() } else { "partial".to_string() },
            record_count: Some(record_count),
            processing_time,
            errors,
        })
    }
    
    /// Get file information
    pub async fn get_file(&self, file_id: Uuid) -> AppResult<FileInfo> {
        let mut conn = self.db.get_connection()?;
        
        let file = uploaded_files::table
            .filter(uploaded_files::id.eq(file_id))
            .first::<UploadedFile>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        Ok(FileInfo {
            id: file.id,
            project_id: file.project_id,
            filename: file.filename,
            original_filename: file.original_filename,
            file_size: file.file_size,
            content_type: file.content_type,
            file_path: file.file_path,
            status: file.status,
            uploaded_by: file.uploaded_by,
            created_at: file.created_at,
            updated_at: file.updated_at,
        })
    }
    
    /// Delete a file
    pub async fn delete_file(&self, file_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        
        // Get file information
        let file = uploaded_files::table
            .filter(uploaded_files::id.eq(file_id))
            .first::<UploadedFile>(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        // Delete file from disk
        if let Err(e) = fs::remove_file(&file.file_path) {
            // Log error but don't fail the operation
            eprintln!("Failed to delete file from disk: {}", e);
        }
        
        // Delete database record
        diesel::delete(uploaded_files::table.filter(uploaded_files::id.eq(file_id)))
            .execute(&mut conn)
            .map_err(|e| AppError::Database(e))?;
        
        Ok(())
    }
    
    /// Process CSV file
    async fn process_csv_file(&self, content: &[u8], project_id: Uuid) -> AppResult<i32> {
        let content_str = String::from_utf8(content.to_vec())
            .map_err(|e| AppError::Validation(format!("Invalid UTF-8 content: {}", e)))?;
        
        let mut reader = csv::Reader::from_reader(content_str.as_bytes());
        let mut record_count = 0;
        let mut conn = self.db.get_connection()?;
        
        // Get headers for field mapping
        let headers = reader.headers()
            .map_err(|e| AppError::Validation(format!("CSV header error: {}", e)))?
            .iter()
            .map(|h| h.to_string())
            .collect::<Vec<String>>();
        
        for result in reader.records() {
            let record = result
                .map_err(|e| AppError::Validation(format!("CSV parsing error: {}", e)))?;
            
            // Create reconciliation record from CSV row
            self.create_reconciliation_record_from_csv(
                &record, 
                &headers, 
                project_id,
                &mut conn
            ).await?;
            
            record_count += 1;
            
            if record_count > 10000 {
                return Err(AppError::Validation("File too large (max 10,000 records)".to_string()));
            }
        }
        
        Ok(record_count)
    }
    
    /// Create reconciliation record from CSV row
    async fn create_reconciliation_record_from_csv(
        &self,
        record: &csv::StringRecord,
        headers: &[String],
        project_id: Uuid,
        conn: &mut diesel::PgConnection,
    ) -> AppResult<()> {
        let mut external_id = String::new();
        let mut amount: Option<bigdecimal::BigDecimal> = None;
        let mut currency: Option<String> = None;
        let mut transaction_date: Option<chrono::DateTime<chrono::Utc>> = None;
        let mut description: Option<String> = None;
        let mut metadata = serde_json::Map::new();
        
        // Map CSV fields to reconciliation record fields
        for (i, field) in record.iter().enumerate() {
            if i >= headers.len() {
                break;
            }
            
            let header = &headers[i];
            let field_lower = header.to_lowercase();
            
            match field_lower.as_str() {
                "id" | "external_id" | "transaction_id" => {
                    external_id = field.to_string();
                }
                "amount" | "value" | "sum" => {
                    amount = field.parse::<bigdecimal::BigDecimal>().ok();
                }
                "currency" | "curr" => {
                    currency = Some(field.to_string());
                }
                "date" | "transaction_date" | "created_at" => {
                    // Try to parse various date formats
                    transaction_date = self.parse_date_field(field).ok();
                }
                "description" | "desc" | "memo" | "note" => {
                    description = Some(field.to_string());
                }
                _ => {
                    // Store other fields in metadata
                    metadata.insert(header.clone(), serde_json::Value::String(field.to_string()));
                }
            }
        }
        
        if external_id.is_empty() {
            external_id = Uuid::new_v4().to_string();
        }
        
        // Use raw SQL to insert the record to avoid Diesel type issues
        let sql = r#"
            INSERT INTO reconciliation_records 
            (id, project_id, source_system, external_id, amount, currency, transaction_date, description, metadata, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        "#;
        
        let record_id = uuid::Uuid::new_v4();
        let metadata_json = serde_json::to_string(&serde_json::Value::Object(metadata)).unwrap_or_default();
        
        diesel::sql_query(sql)
            .bind::<diesel::sql_types::Uuid, _>(record_id)
            .bind::<diesel::sql_types::Uuid, _>(project_id)
            .bind::<diesel::sql_types::Text, _>("csv_upload")
            .bind::<diesel::sql_types::Text, _>(external_id)
            .bind::<diesel::sql_types::Nullable<diesel::sql_types::Numeric>, _>(amount)
            .bind::<diesel::sql_types::Nullable<diesel::sql_types::Text>, _>(currency)
            .bind::<diesel::sql_types::Nullable<diesel::sql_types::Timestamptz>, _>(transaction_date)
            .bind::<diesel::sql_types::Nullable<diesel::sql_types::Text>, _>(description)
            .bind::<diesel::sql_types::Nullable<diesel::sql_types::Jsonb>, _>(metadata_json)
            .bind::<diesel::sql_types::Text, _>("pending")
            .bind::<diesel::sql_types::Timestamptz, _>(chrono::Utc::now())
            .bind::<diesel::sql_types::Timestamptz, _>(chrono::Utc::now())
            .execute(conn)
            .map_err(|e| AppError::Database(e))?;
        
        Ok(())
    }
    
    /// Parse date field from various formats
    fn parse_date_field(&self, date_str: &str) -> Result<chrono::DateTime<chrono::Utc>, chrono::ParseError> {
        // Try different date formats
        let formats = [
            "%Y-%m-%d",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%SZ",
            "%m/%d/%Y",
            "%d/%m/%Y",
            "%Y-%m-%d %H:%M:%S%.f",
        ];
        
        for format in &formats {
            if let Ok(naive_dt) = chrono::NaiveDateTime::parse_from_str(date_str, format) {
                return Ok(naive_dt.and_utc());
            }
        }
        
        // Try parsing as ISO 8601
        chrono::DateTime::parse_from_rfc3339(date_str)
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .or_else(|_| {
                // Try parsing as timestamp
                if let Ok(timestamp) = date_str.parse::<i64>() {
                    Ok(chrono::DateTime::from_timestamp(timestamp, 0)
                        .unwrap_or_else(|| chrono::Utc::now()))
                } else {
                    Err(chrono::ParseError::Impossible)
                }
            })
    }
    
    /// Process JSON file
    async fn process_json_file(&self, content: &[u8], project_id: Uuid) -> AppResult<i32> {
        let json_value: serde_json::Value = serde_json::from_slice(content)
            .map_err(|e| AppError::Validation(format!("Invalid JSON: {}", e)))?;
        
        let records = match json_value {
            serde_json::Value::Array(arr) => arr,
            _ => return Err(AppError::Validation("JSON must be an array of records".to_string())),
        };
        
        let record_count = records.len() as i32;
        
        if record_count > 10000 {
            return Err(AppError::Validation("File too large (max 10,000 records)".to_string()));
        }
        
        let mut conn = self.db.get_connection()?;
        
        for record in records {
            self.create_reconciliation_record_from_json(
                &record, 
                project_id,
                &mut conn
            ).await?;
        }
        
        Ok(record_count)
    }
    
    /// Create reconciliation record from JSON object
    async fn create_reconciliation_record_from_json(
        &self,
        record: &serde_json::Value,
        project_id: Uuid,
        conn: &mut diesel::PgConnection,
    ) -> AppResult<()> {
        let obj = record.as_object()
            .ok_or_else(|| AppError::Validation("JSON record must be an object".to_string()))?;
        
        let external_id = obj.get("id")
            .or_else(|| obj.get("external_id"))
            .or_else(|| obj.get("transaction_id"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| Uuid::new_v4().to_string());
        
        let amount = obj.get("amount")
            .or_else(|| obj.get("value"))
            .or_else(|| obj.get("sum"))
            .and_then(|v| v.as_str())
            .and_then(|s| s.parse::<bigdecimal::BigDecimal>().ok());
        
        let currency = obj.get("currency")
            .or_else(|| obj.get("curr"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        let transaction_date = obj.get("date")
            .or_else(|| obj.get("transaction_date"))
            .or_else(|| obj.get("created_at"))
            .and_then(|v| v.as_str())
            .and_then(|s| self.parse_date_field(s).ok());
        
        let description = obj.get("description")
            .or_else(|| obj.get("desc"))
            .or_else(|| obj.get("memo"))
            .or_else(|| obj.get("note"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        // Create metadata from remaining fields
        let mut metadata = serde_json::Map::new();
        for (key, value) in obj {
            if !matches!(key.as_str(), "id" | "external_id" | "transaction_id" | "amount" | "value" | "sum" | "currency" | "curr" | "date" | "transaction_date" | "created_at" | "description" | "desc" | "memo" | "note") {
                metadata.insert(key.clone(), value.clone());
            }
        }
        
        // Use raw SQL to insert the record to avoid Diesel type issues
        let sql = r#"
            INSERT INTO reconciliation_records 
            (id, project_id, source_system, external_id, amount, currency, transaction_date, description, metadata, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        "#;
        
        let record_id = uuid::Uuid::new_v4();
        let metadata_json = serde_json::to_string(&serde_json::Value::Object(metadata)).unwrap_or_default();
        
        diesel::sql_query(sql)
            .bind::<diesel::sql_types::Uuid, _>(record_id)
            .bind::<diesel::sql_types::Uuid, _>(project_id)
            .bind::<diesel::sql_types::Text, _>("json_upload")
            .bind::<diesel::sql_types::Text, _>(external_id)
            .bind::<diesel::sql_types::Nullable<diesel::sql_types::Numeric>, _>(amount)
            .bind::<diesel::sql_types::Nullable<diesel::sql_types::Text>, _>(currency)
            .bind::<diesel::sql_types::Nullable<diesel::sql_types::Timestamptz>, _>(transaction_date)
            .bind::<diesel::sql_types::Nullable<diesel::sql_types::Text>, _>(description)
            .bind::<diesel::sql_types::Nullable<diesel::sql_types::Jsonb>, _>(metadata_json)
            .bind::<diesel::sql_types::Text, _>("pending")
            .bind::<diesel::sql_types::Timestamptz, _>(chrono::Utc::now())
            .bind::<diesel::sql_types::Timestamptz, _>(chrono::Utc::now())
            .execute(conn)
            .map_err(|e| AppError::Database(e))?;
        
        Ok(())
    }
        
    /// Validate file before processing
    pub async fn validate_file(&self, filename: &str, content: &[u8]) -> AppResult<FileValidationResult> {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();
        
        // Check file size
        if content.len() > 10 * 1024 * 1024 { // 10MB
            errors.push("File size exceeds 10MB limit".to_string());
        }
        
        // Check file extension
        let extension = std::path::Path::new(filename)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");
        
        match extension.to_lowercase().as_str() {
            "csv" => {
                // Validate CSV format
                if let Err(e) = self.validate_csv_format(content) {
                    errors.push(format!("Invalid CSV format: {}", e));
                }
            }
            "json" => {
                // Validate JSON format
                if let Err(e) = self.validate_json_format(content) {
                    errors.push(format!("Invalid JSON format: {}", e));
                }
            }
            _ => {
                errors.push(format!("Unsupported file type: {}", extension));
            }
        }
        
        // Check for empty file
        if content.is_empty() {
            errors.push("File is empty".to_string());
        }
        
        // Check for suspicious content
        if content.len() < 100 {
            warnings.push("File is very small, may not contain valid data".to_string());
        }
        
        Ok(FileValidationResult {
            is_valid: errors.is_empty(),
            errors,
            warnings,
            estimated_records: self.estimate_record_count(content, extension).unwrap_or(0),
        })
    }
    
    /// Validate CSV format
    fn validate_csv_format(&self, content: &[u8]) -> Result<(), String> {
        let content_str = String::from_utf8(content.to_vec())
            .map_err(|e| format!("Invalid UTF-8: {}", e))?;
        
        let mut reader = csv::Reader::from_reader(content_str.as_bytes());
        
        // Check if we can read headers
        let _headers = reader.headers()
            .map_err(|e| format!("CSV header error: {}", e))?;
        
        // Try to read first few records
        let mut record_count = 0;
        for result in reader.records() {
            let _record = result
                .map_err(|e| format!("CSV parsing error: {}", e))?;
            
            record_count += 1;
            if record_count >= 5 {
                break; // Just validate first few records
            }
        }
        
        if record_count == 0 {
            return Err("No records found in CSV".to_string());
        }
        
        Ok(())
    }
    
    /// Validate JSON format
    fn validate_json_format(&self, content: &[u8]) -> Result<(), String> {
        let json_value: serde_json::Value = serde_json::from_slice(content)
            .map_err(|e| format!("Invalid JSON: {}", e))?;
        
        match json_value {
            serde_json::Value::Array(arr) => {
                if arr.is_empty() {
                    return Err("JSON array is empty".to_string());
                }
                
                // Validate first few objects
                for (i, item) in arr.iter().enumerate() {
                    if !item.is_object() {
                        return Err(format!("Item {} is not an object", i));
                    }
                    
                    if i >= 5 {
                        break; // Just validate first few items
                    }
                }
            }
            _ => {
                return Err("JSON must be an array of objects".to_string());
            }
        }
        
        Ok(())
    }
    
    /// Estimate record count without full processing
    fn estimate_record_count(&self, content: &[u8], extension: &str) -> Option<i32> {
        match extension.to_lowercase().as_str() {
            "csv" => {
                let content_str = String::from_utf8(content.to_vec()).ok()?;
                let lines = content_str.lines().count();
                if lines > 1 {
                    Some((lines - 1) as i32) // Subtract header
                } else {
                    Some(0)
                }
            }
            "json" => {
                let json_value: serde_json::Value = serde_json::from_slice(content).ok()?;
                if let serde_json::Value::Array(arr) = json_value {
                    Some(arr.len() as i32)
                } else {
                    Some(0)
                }
            }
            _ => None,
        }
    }
    
    /// Process file in batches for large files
    pub async fn process_file_in_batches(
        &self,
        content: &[u8],
        project_id: Uuid,
        batch_size: Option<i32>,
    ) -> AppResult<BatchProcessingResult> {
        let batch_size = batch_size.unwrap_or(1000);
        let mut total_processed = 0;
        let mut total_errors = 0;
        let mut errors = Vec::new();
        
        // Determine file type
        let extension = "csv"; // This should be determined from the file
        let mut conn = self.db.get_connection()?;
        
        match extension {
            "csv" => {
                let content_str = String::from_utf8(content.to_vec())
                    .map_err(|e| AppError::Validation(format!("Invalid UTF-8: {}", e)))?;
                
                let mut reader = csv::Reader::from_reader(content_str.as_bytes());
                let headers = reader.headers()
                    .map_err(|e| AppError::Validation(format!("CSV header error: {}", e)))?
                    .iter()
                    .map(|h| h.to_string())
                    .collect::<Vec<String>>();
                
                let mut batch = Vec::new();
                
                for result in reader.records() {
                    let record = result
                        .map_err(|e| AppError::Validation(format!("CSV parsing error: {}", e)))?;
                    
                    match self.create_reconciliation_record_from_csv(&record, &headers, project_id).await {
                        Ok(reconciliation_record) => {
                            batch.push(reconciliation_record);
                            
                            if batch.len() >= batch_size as usize {
                                // Process batch
                                match self.process_batch(&mut conn, &batch).await {
                                    Ok(processed) => {
                                        total_processed += processed;
                                        batch.clear();
                                    }
                                    Err(e) => {
                                        errors.push(format!("Batch processing error: {}", e));
                                        total_errors += batch.len() as i32;
                                        batch.clear();
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            errors.push(format!("Record processing error: {}", e));
                            total_errors += 1;
                        }
                    }
                }
                
                // Process remaining batch
                if !batch.is_empty() {
                    match self.process_batch(&mut conn, &batch).await {
                        Ok(processed) => {
                            total_processed += processed;
                        }
                        Err(e) => {
                            errors.push(format!("Final batch processing error: {}", e));
                            total_errors += batch.len() as i32;
                        }
                    }
                }
            }
            "json" => {
                let json_value: serde_json::Value = serde_json::from_slice(content)
                    .map_err(|e| AppError::Validation(format!("Invalid JSON: {}", e)))?;
                
                let records = match json_value {
                    serde_json::Value::Array(arr) => arr,
                    _ => return Err(AppError::Validation("JSON must be an array".to_string())),
                };
                
                let mut batch = Vec::new();
                
                for record in records {
                    match self.create_reconciliation_record_from_json(&record, project_id).await {
                        Ok(reconciliation_record) => {
                            batch.push(reconciliation_record);
                            
                            if batch.len() >= batch_size as usize {
                                match self.process_batch(&mut conn, &batch).await {
                                    Ok(processed) => {
                                        total_processed += processed;
                                        batch.clear();
                                    }
                                    Err(e) => {
                                        errors.push(format!("Batch processing error: {}", e));
                                        total_errors += batch.len() as i32;
                                        batch.clear();
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            errors.push(format!("Record processing error: {}", e));
                            total_errors += 1;
                        }
                    }
                }
                
                // Process remaining batch
                if !batch.is_empty() {
                    match self.process_batch(&mut conn, &batch).await {
                        Ok(processed) => {
                            total_processed += processed;
                        }
                        Err(e) => {
                            errors.push(format!("Final batch processing error: {}", e));
                            total_errors += batch.len() as i32;
                        }
                    }
                }
            }
            _ => {
                return Err(AppError::Validation("Unsupported file type".to_string()));
            }
        }
        
        Ok(BatchProcessingResult {
            total_processed,
            total_errors,
            errors,
        })
    }
    
    /// Process a batch of reconciliation records
    async fn process_batch(
        &self,
        conn: &mut diesel::PgConnection,
        batch: &[NewReconciliationRecord],
    ) -> AppResult<i32> {
        // Process records one by one using raw SQL to avoid Diesel type issues
        let sql = r#"
            INSERT INTO reconciliation_records 
            (id, project_id, source_system, external_id, amount, currency, transaction_date, description, metadata, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        "#;
        
        for record in batch {
            let record_id = uuid::Uuid::new_v4();
            let metadata_json = record.metadata.as_ref()
                .map(|v| serde_json::to_string(v).unwrap_or_default())
                .unwrap_or_default();
            
            diesel::sql_query(sql)
                .bind::<diesel::sql_types::Uuid, _>(record_id)
                .bind::<diesel::sql_types::Uuid, _>(record.project_id)
                .bind::<diesel::sql_types::Text, _>(&record.source_system)
                .bind::<diesel::sql_types::Text, _>(&record.external_id)
                .bind::<diesel::sql_types::Nullable<diesel::sql_types::Numeric>, _>(record.amount.as_ref())
                .bind::<diesel::sql_types::Nullable<diesel::sql_types::Text>, _>(record.currency.as_ref())
                .bind::<diesel::sql_types::Nullable<diesel::sql_types::Timestamptz>, _>(record.transaction_date)
                .bind::<diesel::sql_types::Nullable<diesel::sql_types::Text>, _>(record.description.as_ref())
                .bind::<diesel::sql_types::Nullable<diesel::sql_types::Jsonb>, _>(metadata_json)
                .bind::<diesel::sql_types::Text, _>("pending")
                .bind::<diesel::sql_types::Timestamptz, _>(chrono::Utc::now())
                .bind::<diesel::sql_types::Timestamptz, _>(chrono::Utc::now())
                .execute(conn)
                .map_err(|e| AppError::Database(e))?;
        }
        
        Ok(batch.len() as i32)
    }
}