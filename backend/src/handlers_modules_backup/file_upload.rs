//! File upload and processing system
//! 
//! This module provides comprehensive file upload functionality including
//! multipart handling, validation, processing, and storage.

use actix_multipart::Multipart;
use actix_web::{web, HttpRequest, HttpResponse, Result};
use futures_util::TryStreamExt;
use serde::{Deserialize, Serialize};
use std::path::Path;
use uuid::Uuid;
use tokio::fs;
use tokio::io::AsyncWriteExt;

use crate::errors::{AppError, AppResult};
use crate::database::Database;
use crate::services::FileService;

/// File upload request
#[derive(Debug, Serialize, Deserialize)]
pub struct FileUploadRequest {
    pub project_id: Uuid,
    pub data_source_id: Option<Uuid>,
    pub description: Option<String>,
}

/// File upload response
#[derive(Debug, Serialize, Deserialize)]
pub struct FileUploadResponse {
    pub file_id: Uuid,
    pub filename: String,
    pub size: u64,
    pub content_type: String,
    pub status: String,
    pub message: String,
}

/// File processing response
#[derive(Debug, Serialize, Deserialize)]
pub struct FileProcessingResponse {
    pub file_id: Uuid,
    pub status: String,
    pub record_count: u64,
    pub processing_time_ms: u64,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

/// File information
#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    pub id: Uuid,
    pub filename: String,
    pub size: u64,
    pub content_type: String,
    pub status: String,
    pub project_id: Uuid,
    pub data_source_id: Option<Uuid>,
    pub description: Option<String>,
    pub uploaded_by: Uuid,
    pub uploaded_at: chrono::DateTime<chrono::Utc>,
    pub processed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub record_count: Option<u64>,
    pub error_message: Option<String>,
}

/// Upload file endpoint
pub async fn upload_file(
    mut payload: Multipart,
    req: HttpRequest,
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse, AppError> {
    // Extract project_id from query parameters
    let project_id = req
        .query_string()
        .split('&')
        .find(|param| param.starts_with("project_id="))
        .and_then(|param| param.split('=').nth(1))
        .and_then(|id| Uuid::parse_str(id).ok())
        .ok_or_else(|| AppError::BadRequest("Missing or invalid project_id".to_string()))?;

    // Extract user_id from headers (set by auth middleware)
    let user_id = req
        .headers()
        .get("X-User-ID")
        .and_then(|h| h.to_str().ok())
        .and_then(|s| Uuid::parse_str(s).ok())
        .ok_or_else(|| AppError::Unauthorized("User not authenticated".to_string()))?;

    let mut file_service = FileService::new(db.get_ref().clone());
    let mut file_id = Uuid::new_v4();
    let mut filename = String::new();
    let mut content_type = String::new();
    let mut file_size = 0u64;
    let mut file_data = Vec::new();

    // Process multipart data
    while let Some(mut field) = payload.try_next().await? {
        match field.name() {
            "file" => {
                // Get filename from content disposition
                if let Some(content_disposition) = field.content_disposition() {
                    filename = content_disposition
                        .get_filename()
                        .unwrap_or("unknown")
                        .to_string();
                }

                // Get content type
                content_type = field.content_type().to_string();

                // Read file data
                while let Some(chunk) = field.try_next().await? {
                    file_size += chunk.len() as u64;
                    file_data.extend_from_slice(&chunk);
                }
            }
            "description" => {
                // Handle description field if needed
            }
            _ => {
                // Skip unknown fields
            }
        }
    }

    // Validate file
    if file_data.is_empty() {
        return Err(AppError::BadRequest("No file data received".to_string()));
    }

    if file_size > 100 * 1024 * 1024 { // 100MB limit
        return Err(AppError::BadRequest("File too large".to_string()));
    }

    // Validate file type
    let allowed_types = vec!["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    if !allowed_types.contains(&content_type.as_str()) {
        return Err(AppError::BadRequest("Unsupported file type".to_string()));
    }

    // Create file record in database
    let file_info = file_service.create_file_record(
        project_id,
        filename.clone(),
        file_size,
        content_type.clone(),
        user_id,
    ).await?;

    file_id = file_info.id;

    // Save file to storage
    let upload_dir = Path::new("uploads").join(project_id.to_string());
    fs::create_dir_all(&upload_dir).await?;

    let file_path = upload_dir.join(&filename);
    let mut file = fs::File::create(&file_path).await?;
    file.write_all(&file_data).await?;

    // Update file record with path
    file_service.update_file_path(file_id, file_path.to_string_lossy().to_string()).await?;

    let response = FileUploadResponse {
        file_id,
        filename,
        size: file_size,
        content_type,
        status: "uploaded".to_string(),
        message: "File uploaded successfully".to_string(),
    };

    Ok(HttpResponse::Ok().json(response))
}

/// Get file information
pub async fn get_file(
    path: web::Path<Uuid>,
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse, AppError> {
    let file_id = path.into_inner();
    let file_service = FileService::new(db.get_ref().clone());
    
    let file_info = file_service.get_file(file_id).await?;
    
    Ok(HttpResponse::Ok().json(file_info))
}

/// Delete file
pub async fn delete_file(
    path: web::Path<Uuid>,
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse, AppError> {
    let file_id = path.into_inner();
    let file_service = FileService::new(db.get_ref().clone());
    
    // Get file info first
    let file_info = file_service.get_file(file_id).await?;
    
    // Delete physical file
    if let Some(file_path) = &file_info.file_path {
        if Path::new(file_path).exists() {
            fs::remove_file(file_path).await?;
        }
    }
    
    // Delete database record
    file_service.delete_file(file_id).await?;
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "File deleted successfully"
    })))
}

/// Process file
pub async fn process_file(
    path: web::Path<Uuid>,
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse, AppError> {
    let file_id = path.into_inner();
    let file_service = FileService::new(db.get_ref().clone());
    
    // Get file info
    let file_info = file_service.get_file(file_id).await?;
    
    if file_info.status != "uploaded" {
        return Err(AppError::BadRequest("File is not in uploaded status".to_string()));
    }
    
    // Update status to processing
    file_service.update_file_status(file_id, "processing".to_string()).await?;
    
    let start_time = std::time::Instant::now();
    
    // Process file based on type
    let (record_count, errors, warnings) = match file_info.content_type.as_str() {
        "text/csv" => {
            process_csv_file(&file_info).await?
        }
        "application/vnd.ms-excel" | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" => {
            process_excel_file(&file_info).await?
        }
        _ => {
            return Err(AppError::BadRequest("Unsupported file type for processing".to_string()));
        }
    };
    
    let processing_time = start_time.elapsed().as_millis() as u64;
    
    // Update file record with processing results
    file_service.update_file_processing_results(
        file_id,
        record_count,
        processing_time,
        errors.clone(),
        warnings.clone(),
    ).await?;
    
    let response = FileProcessingResponse {
        file_id,
        status: "completed".to_string(),
        record_count,
        processing_time_ms: processing_time,
        errors,
        warnings,
    };
    
    Ok(HttpResponse::Ok().json(response))
}

/// Process CSV file
async fn process_csv_file(file_info: &FileInfo) -> AppResult<(u64, Vec<String>, Vec<String>)> {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();
    let mut record_count = 0u64;
    
    // Read CSV file
    if let Some(file_path) = &file_info.file_path {
        let content = fs::read_to_string(file_path).await?;
        let mut lines = content.lines();
        
        // Skip header if present
        if let Some(_header) = lines.next() {
            // Process each line
            for (line_num, line) in lines.enumerate() {
                if line.trim().is_empty() {
                    continue;
                }
                
                // Basic CSV validation
                let fields: Vec<&str> = line.split(',').collect();
                if fields.len() < 2 {
                    warnings.push(format!("Line {}: Insufficient fields", line_num + 2));
                }
                
                record_count += 1;
            }
        }
    }
    
    Ok((record_count, errors, warnings))
}

/// Process Excel file
async fn process_excel_file(file_info: &FileInfo) -> AppResult<(u64, Vec<String>, Vec<String>)> {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();
    let mut record_count = 0u64;
    
    // For now, return placeholder values
    // In a real implementation, you would use a library like calamine or rust_xlsxwriter
    warnings.push("Excel processing not fully implemented".to_string());
    record_count = 100; // Placeholder
    
    Ok((record_count, errors, warnings))
}

/// List project files
pub async fn list_project_files(
    path: web::Path<Uuid>,
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse, AppError> {
    let project_id = path.into_inner();
    let file_service = FileService::new(db.get_ref().clone());
    
    let files = file_service.list_project_files(project_id).await?;
    
    Ok(HttpResponse::Ok().json(files))
}

/// Configure file upload routes
pub fn configure_file_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/upload", web::post().to(upload_file))
        .route("/{file_id}", web::get().to(get_file))
        .route("/{file_id}", web::delete().to(delete_file))
        .route("/{file_id}/process", web::post().to(process_file))
        .route("/project/{project_id}", web::get().to(list_project_files));
}
