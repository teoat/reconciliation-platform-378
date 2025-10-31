//! File service for handling file uploads and processing

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use actix_multipart::Multipart;
use actix_web::http::header::CONTENT_DISPOSITION;
use futures_util::TryStreamExt as _;
use tokio::fs;
use tokio::io::AsyncWriteExt as _;
use std::path::PathBuf;
use uuid::Uuid;
use serde::{Deserialize, Serialize};

/// File upload result
#[derive(Debug, Serialize, Deserialize)]
pub struct FileUploadResult {
    pub id: Uuid,
    pub filename: String,
    pub size: i64,
    pub status: String,
    pub project_id: Uuid,
}

/// Processing result
#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessingResult {
    pub record_count: Option<usize>,
    pub processing_time: f64,
    pub errors: Vec<String>,
}

/// File service
pub struct FileService {
    db: Database,
    upload_path: String,
}

impl FileService {
    /// Create a new file service
    pub fn new(db: Database, upload_path: String) -> Self {
        Self { db, upload_path }
    }

    /// Initialize a resumable upload and return an upload_id and target info
    pub async fn init_resumable_upload(
        &self,
        project_id: Uuid,
        original_filename: String,
        _expected_size: Option<i64>,
    ) -> AppResult<serde_json::Value> {
        let upload_id = Uuid::new_v4();
        let mut tmp_dir = PathBuf::from(&self.upload_path);
        tmp_dir.push("tmp");
        tmp_dir.push(upload_id.to_string());
        fs::create_dir_all(&tmp_dir).await.map_err(|e| AppError::Internal(format!("Failed to create tmp dir: {}", e)))?;

        Ok(serde_json::json!({
            "upload_id": upload_id,
            "project_id": project_id,
            "filename": original_filename,
            "chunk_size": 5 * 1024 * 1024, // 5MB recommended size from client
        }))
    }

    /// Accept a chunk for a resumable upload
    pub async fn upload_chunk(
        &self,
        upload_id: Uuid,
        chunk_index: u32,
        bytes: &[u8],
    ) -> AppResult<()> {
        let mut tmp_dir = PathBuf::from(&self.upload_path);
        tmp_dir.push("tmp");
        tmp_dir.push(upload_id.to_string());
        fs::create_dir_all(&tmp_dir).await.map_err(|e| AppError::Internal(format!("Failed to ensure tmp dir: {}", e)))?;

        let mut part_path = tmp_dir.clone();
        part_path.push(format!("{}.part", chunk_index));
        let mut f = fs::File::create(&part_path).await.map_err(|e| AppError::Internal(format!("Failed to create chunk file: {}", e)))?;
        f.write_all(bytes).await.map_err(|e| AppError::Internal(format!("Failed to write chunk: {}", e)))?;
        f.flush().await.map_err(|e| AppError::Internal(format!("Failed to flush chunk: {}", e)))?;
        Ok(())
    }

    /// Complete a resumable upload by concatenating parts in order
    pub async fn complete_resumable_upload(
        &self,
        project_id: Uuid,
        upload_id: Uuid,
        final_filename: String,
        total_chunks: u32,
    ) -> AppResult<FileUploadResult> {
        // Ensure project directory
        let mut project_dir = PathBuf::from(&self.upload_path);
        project_dir.push(project_id.to_string());
        fs::create_dir_all(&project_dir).await.map_err(|e| AppError::Internal(format!("Failed to create project dir: {}", e)))?;

        // Open final file
        let mut final_path = project_dir.clone();
        final_path.push(sanitize_filename_simple(&final_filename));
        let mut final_file = fs::File::create(&final_path)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to create final file: {}", e)))?;

        // Concatenate parts
        let mut tmp_dir = PathBuf::from(&self.upload_path);
        tmp_dir.push("tmp");
        tmp_dir.push(upload_id.to_string());

        let mut total_size: i64 = 0;
        for idx in 0..total_chunks {
            let mut part_path = tmp_dir.clone();
            part_path.push(format!("{}.part", idx));
            let mut part = fs::File::open(&part_path)
                .await
                .map_err(|e| AppError::Validation(format!("Missing chunk {}: {}", idx, e)))?;
            let mut buf = vec![0u8; 1024 * 1024];
            loop {
                let n = tokio::io::AsyncReadExt::read(&mut part, &mut buf).await.map_err(|e| AppError::Internal(format!("Failed to read chunk {}: {}", idx, e)))?;
                if n == 0 { break; }
                final_file.write_all(&buf[..n]).await.map_err(|e| AppError::Internal(format!("Failed to append chunk {}: {}", idx, e)))?;
                total_size += n as i64;
            }
        }

        final_file.flush().await.map_err(|e| AppError::Internal(format!("Failed to flush final file: {}", e)))?;

        // Best-effort cleanup
        let _ = fs::remove_dir_all(&tmp_dir).await;

        Ok(FileUploadResult {
            id: Uuid::new_v4(),
            filename: final_path.file_name().unwrap_or_default().to_string_lossy().to_string(),
            size: total_size,
            status: "uploaded".to_string(),
            project_id,
        })
    }
    /// Upload a file (placeholder implementation)
    pub async fn upload_file(
        &self,
        mut payload: Multipart,
        project_id: Uuid,
        _user_id: Uuid,
    ) -> AppResult<FileUploadResult> {
        // Per-file and total upload constraints
        let max_per_file_bytes: i64 = 10 * 1024 * 1024; // 10MB cap per file
        let max_total_bytes: i64 = 100 * 1024 * 1024; // 100MB cap per request
        let allowed_types: [&str; 4] = [
            "text/csv",
            "application/vnd.ms-excel",
            "application/octet-stream",
            "application/csv",
        ];

        // Prepare upload directory
        let mut upload_dir = PathBuf::from(&self.upload_path);
        upload_dir.push(project_id.to_string());
        fs::create_dir_all(&upload_dir).await.map_err(|e| AppError::Internal(format!("Failed to create upload dir: {}", e)))?;

        let mut saved_filename: Option<String> = None;
        let mut total_size: i64 = 0;

        while let Some(mut field) = payload.try_next().await.map_err(|e| AppError::Validation(format!("Invalid multipart data: {}", e)))? {
            let name = field.name().to_string();
            if name != "file" {
                // Skip non-file fields for now
                loop {
                    match field.try_next().await {
                        Ok(Some(_)) => continue,
                        Ok(None) => break,
                        Err(e) => return Err(AppError::Validation(format!("Invalid multipart data: {}", e))),
                    }
                }
                continue;
            }

            // Content-Type validation (best-effort; may be missing from client)
            if let Some(ct) = field.content_type() {
                let essence = ct.essence_str();
                if !allowed_types.iter().any(|t| *t == essence) {
                    return Err(AppError::Validation(format!("Unsupported content-type: {}", essence)));
                }
            }

            // Determine filename
            let mut filename = "upload.bin".to_string();
            {
                let cd = field.content_disposition();
                if let Some(f) = cd.get_filename() {
                    filename = sanitize_filename_simple(f);
                }
            }
            if let Some(h) = field.headers().get(CONTENT_DISPOSITION) {
                if let Ok(s) = h.to_str() {
                    if let Some(pos) = s.find("filename=") {
                        filename = sanitize_filename_simple(s[pos + 9..].trim_matches('"'));
                    }
                }
            }

            let mut filepath = upload_dir.clone();
            filepath.push(&filename);

            let mut file = fs::File::create(&filepath)
                .await
                .map_err(|e| AppError::Internal(format!("Failed to create file: {}", e)))?;

            // Stream chunks to disk
            let mut this_file_size: i64 = 0;
            while let Some(chunk) = field.try_next().await.map_err(|e| AppError::Validation(format!("Failed reading chunk: {}", e)))? {
                let len = chunk.len() as i64;
                this_file_size += len;
                total_size += len;
                if this_file_size > max_per_file_bytes {
                    return Err(AppError::Validation("File too large".to_string()));
                }
                if total_size > max_total_bytes {
                    return Err(AppError::Validation("Total upload too large".to_string()));
                }
                file.write_all(&chunk)
                    .await
                    .map_err(|e| AppError::Internal(format!("Failed writing chunk: {}", e)))?;
            }

            file.flush().await.map_err(|e| AppError::Internal(format!("Failed flushing file: {}", e)))?;
            saved_filename = Some(filename);
        }

        let filename = saved_filename.ok_or_else(|| AppError::Validation("No file field provided".to_string()))?;

        // TODO: Persist file record in database when schema is available
        Ok(FileUploadResult {
            id: Uuid::new_v4(),
            filename,
            size: total_size,
            status: "uploaded".to_string(),
            project_id,
        })
    }

    /// Get file info
    pub async fn get_file(&self, _file_id: Uuid) -> AppResult<FileUploadResult> {
        // Placeholder implementation
        Err(AppError::Internal("Get file not yet implemented".to_string()))
    }

    /// Delete a file
    pub async fn delete_file(&self, _file_id: Uuid) -> AppResult<()> {
        // Placeholder implementation
        Ok(())
    }

    /// Process a file
    pub async fn process_file(&self, _file_id: Uuid) -> AppResult<ProcessingResult> {
        // Placeholder implementation
        Ok(ProcessingResult {
            record_count: Some(0),
            processing_time: 0.0,
            errors: vec![],
        })
    }
}

fn sanitize_filename_simple(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    for ch in input.chars() {
        match ch {
            '/' | '\\' | '\0' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => out.push('_'),
            c if c.is_control() => out.push('_'),
            c => out.push(c),
        }
    }
    let trimmed = out.trim();
    if trimmed.is_empty() { "upload.bin".to_string() } else { trimmed.to_string() }
}
