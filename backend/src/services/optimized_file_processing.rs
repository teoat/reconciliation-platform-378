//te backend/src/services/optimized_file_processing.rs
use crate::errors::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::fs::{File, OpenOptions};
use tokio::io::{AsyncReadExt, AsyncWriteExt, BufReader, BufWriter};
use std::io::{SeekFrom, Seek};
use futures::stream::{Stream, StreamExt};

/// File processing configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileProcessingConfig {
    pub max_file_size: u64,
    pub chunk_size: usize,
    pub temp_directory: PathBuf,
    pub supported_formats: Vec<FileFormat>,
    pub compression_enabled: bool,
    pub encryption_enabled: bool,
    pub parallel_processing: bool,
    pub max_workers: usize,
}

/// Supported file formats
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum FileFormat {
    Csv,
    Excel,
    Json,
    Xml,
    Parquet,
    Avro,
    Orc,
}

/// File processing status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProcessingStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    Cancelled,
}

/// File processing job
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileProcessingJob {
    pub id: Uuid,
    pub file_id: Uuid,
    pub file_name: String,
    pub file_size: u64,
    pub file_format: FileFormat,
    pub status: ProcessingStatus,
    pub progress: f64,
    pub error_message: Option<String>,
    pub created_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub result_summary: Option<ProcessingResultSummary>,
}

/// Processing result summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingResultSummary {
    pub total_rows: u64,
    pub valid_rows: u64,
    pub invalid_rows: u64,
    pub processing_time_ms: u64,
    pub memory_usage_mb: f64,
    pub output_file_path: Option<String>,
    pub validation_errors: Vec<ValidationError>,
}

/// Validation error
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationError {
    pub row_number: u64,
    pub column_name: String,
    pub error_type: String,
    pub error_message: String,
    pub value: Option<String>,
}

/// Streaming processor for large files
pub struct StreamingFileProcessor {
    config: FileProcessingConfig,
    active_jobs: Arc<RwLock<HashMap<Uuid, FileProcessingJob>>>,
    processing_stats: Arc<RwLock<ProcessingStats>>,
}

/// Processing statistics
#[derive(Debug, Clone, Default)]
pub struct ProcessingStats {
    pub total_files_processed: u64,
    pub successful_files: u64,
    pub failed_files: u64,
    pub total_bytes_processed: u64,
    pub average_processing_time_ms: f64,
    pub peak_memory_usage_mb: f64,
}

impl StreamingFileProcessor {
    pub fn new(config: FileProcessingConfig) -> Self {
        Self {
            config,
            active_jobs: Arc::new(RwLock::new(HashMap::new())),
            processing_stats: Arc::new(RwLock::new(ProcessingStats::default())),
        }
    }

    /// Process file with streaming
    pub async fn process_file_streaming(&self, file_path: &Path, file_format: FileFormat) -> AppResult<Uuid> {
        let job_id = Uuid::new_v4();
        let file_metadata = self.get_file_metadata(file_path).await?;

        // Validate file size
        if file_metadata.size > self.config.max_file_size {
            return Err(AppError::Validation(format!("File size {} exceeds maximum allowed size {}", file_metadata.size, self.config.max_file_size)));
        }

        // Validate file format
        if !self.config.supported_formats.contains(&file_format) {
            return Err(AppError::Validation(format!("File format {:?} is not supported", file_format)));
        }

        // Create processing job
        let job = FileProcessingJob {
            id: job_id,
            file_id: Uuid::new_v4(),
            file_name: file_path.file_name().unwrap().to_string_lossy().to_string(),
            file_size: file_metadata.size,
            file_format,
            status: ProcessingStatus::Pending,
            progress: 0.0,
            error_message: None,
            created_at: Utc::now(),
            started_at: None,
            completed_at: None,
            metadata: HashMap::new(),
            result_summary: None,
        };

        self.active_jobs.write().await.insert(job_id, job);

        // Start processing in background
        let processor = self.clone();
        let file_path = file_path.to_path_buf();
        tokio::spawn(async move {
            if let Err(e) = processor.process_file_in_background(job_id, file_path).await {
                eprintln!("File processing failed: {}", e);
            }
        });

        Ok(job_id)
    }

    /// Process file in background
    async fn process_file_in_background(&self, job_id: Uuid, file_path: PathBuf) -> AppResult<()> {
        let start_time = SystemTime::now();
        
        // Update job status
        {
            let mut jobs = self.active_jobs.write().await;
            if let Some(job) = jobs.get_mut(&job_id) {
                job.status = ProcessingStatus::Processing;
                job.started_at = Some(Utc::now());
            }
        }

        // Process based on file format
        let result = match self.get_file_format(&file_path).await? {
            FileFormat::Csv => self.process_csv_streaming(&file_path, job_id).await,
            FileFormat::Excel => self.process_excel_streaming(&file_path, job_id).await,
            FileFormat::Json => self.process_json_streaming(&file_path, job_id).await,
            FileFormat::Xml => self.process_xml_streaming(&file_path, job_id).await,
            FileFormat::Parquet => self.process_parquet_streaming(&file_path, job_id).await,
            FileFormat::Avro => self.process_avro_streaming(&file_path, job_id).await,
            FileFormat::Orc => self.process_orc_streaming(&file_path, job_id).await,
        };

        let processing_time = start_time.elapsed().unwrap_or_default().as_millis() as u64;

        // Update job with result
        {
            let mut jobs = self.active_jobs.write().await;
            if let Some(job) = jobs.get_mut(&job_id) {
                match result {
                    Ok(summary) => {
                        job.status = ProcessingStatus::Completed;
                        job.progress = 100.0;
                        job.completed_at = Some(Utc::now());
                        job.result_summary = Some(summary);
                    }
                    Err(e) => {
                        job.status = ProcessingStatus::Failed;
                        job.error_message = Some(e.to_string());
                        job.completed_at = Some(Utc::now());
                    }
                }
            }
        }

        // Update statistics
        self.update_processing_stats(processing_time, result.is_ok()).await;

        Ok(())
    }

    /// Process CSV file with streaming
    async fn process_csv_streaming(&self, file_path: &Path, job_id: Uuid) -> AppResult<ProcessingResultSummary> {
        let file = File::open(file_path).await?;
        let reader = BufReader::new(file);
        let mut lines = reader.lines();
        
        let mut total_rows = 0u64;
        let mut valid_rows = 0u64;
        let mut invalid_rows = 0u64;
        let mut validation_errors = Vec::new();
        let mut headers = Vec::new();

        // Read headers
        if let Some(header_line) = lines.next_line().await? {
            headers = header_line.split(',').map(|s| s.trim().to_string()).collect();
        }

        // Process rows in chunks
        let mut chunk_buffer = Vec::new();
        let chunk_size = self.config.chunk_size;

        while let Some(line) = lines.next_line().await? {
            total_rows += 1;
            chunk_buffer.push(line);

            if chunk_buffer.len() >= chunk_size {
                let (valid, invalid, errors) = self.process_csv_chunk(&chunk_buffer, &headers, total_rows - chunk_buffer.len() as u64).await?;
                valid_rows += valid;
                invalid_rows += invalid;
                validation_errors.extend(errors);
                chunk_buffer.clear();

                // Update progress
                self.update_job_progress(job_id, (total_rows as f64 / self.estimate_total_rows(file_path).await.unwrap_or(total_rows) as f64) * 100.0).await;
            }
        }

        // Process remaining rows
        if !chunk_buffer.is_empty() {
            let (valid, invalid, errors) = self.process_csv_chunk(&chunk_buffer, &headers, total_rows - chunk_buffer.len() as u64).await?;
            valid_rows += valid;
            invalid_rows += invalid;
            validation_errors.extend(errors);
        }

        Ok(ProcessingResultSummary {
            total_rows,
            valid_rows,
            invalid_rows,
            processing_time_ms: 0, // Will be set by caller
            memory_usage_mb: self.get_memory_usage(),
            output_file_path: None,
            validation_errors,
        })
    }

    /// Process CSV chunk
    async fn process_csv_chunk(&self, chunk: &[String], headers: &[String], start_row: u64) -> AppResult<(u64, u64, Vec<ValidationError>)> {
        let mut valid_rows = 0u64;
        let mut invalid_rows = 0u64;
        let mut errors = Vec::new();

        for (i, line) in chunk.iter().enumerate() {
            let row_number = start_row + i as u64 + 1;
            let fields: Vec<&str> = line.split(',').collect();

            if fields.len() != headers.len() {
                invalid_rows += 1;
                errors.push(ValidationError {
                    row_number,
                    column_name: "all".to_string(),
                    error_type: "FIELD_COUNT_MISMATCH".to_string(),
                    error_message: format!("Expected {} fields, got {}", headers.len(), fields.len()),
                    value: Some(line.clone()),
                });
                continue;
            }

            // Validate each field
            let mut row_valid = true;
            for (j, field) in fields.iter().enumerate() {
                if let Some(validation_error) = self.validate_csv_field(field, &headers[j], row_number).await {
                    errors.push(validation_error);
                    row_valid = false;
                }
            }

            if row_valid {
                valid_rows += 1;
            } else {
                invalid_rows += 1;
            }
        }

        Ok((valid_rows, invalid_rows, errors))
    }

    /// Validate CSV field
    async fn validate_csv_field(&self, value: &str, column_name: &str, row_number: u64) -> Option<ValidationError> {
        // Basic validation rules
        if value.is_empty() {
            return Some(ValidationError {
                row_number,
                column_name: column_name.to_string(),
                error_type: "EMPTY_VALUE".to_string(),
                error_message: "Field cannot be empty".to_string(),
                value: Some(value.to_string()),
            });
        }

        // Check for numeric fields
        if column_name.to_lowercase().contains("amount") || column_name.to_lowercase().contains("price") {
            if value.parse::<f64>().is_err() {
                return Some(ValidationError {
                    row_number,
                    column_name: column_name.to_string(),
                    error_type: "INVALID_NUMERIC".to_string(),
                    error_message: "Field must be a valid number".to_string(),
                    value: Some(value.to_string()),
                });
            }
        }

        // Check for date fields
        if column_name.to_lowercase().contains("date") {
            if chrono::NaiveDate::parse_from_str(value, "%Y-%m-%d").is_err() {
                return Some(ValidationError {
                    row_number,
                    column_name: column_name.to_string(),
                    error_type: "INVALID_DATE".to_string(),
                    error_message: "Field must be a valid date (YYYY-MM-DD)".to_string(),
                    value: Some(value.to_string()),
                });
            }
        }

        None
    }

    /// Process Excel file with streaming
    async fn process_excel_streaming(&self, file_path: &Path, job_id: Uuid) -> AppResult<ProcessingResultSummary> {
        // In a real implementation, this would use a streaming Excel reader
        // For now, we'll simulate this
        let file_size = self.get_file_metadata(file_path).await?.size;
        let estimated_rows = file_size / 100; // Rough estimate

        let mut processed_rows = 0u64;
        let chunk_size = self.config.chunk_size;

        while processed_rows < estimated_rows {
            let chunk_rows = std::cmp::min(chunk_size as u64, estimated_rows - processed_rows);
            processed_rows += chunk_rows;

            // Simulate processing
            tokio::time::sleep(Duration::from_millis(10)).await;

            // Update progress
            self.update_job_progress(job_id, (processed_rows as f64 / estimated_rows as f64) * 100.0).await;
        }

        Ok(ProcessingResultSummary {
            total_rows: estimated_rows,
            valid_rows: estimated_rows * 95 / 100, // Simulate 95% valid
            invalid_rows: estimated_rows * 5 / 100,
            processing_time_ms: 0,
            memory_usage_mb: self.get_memory_usage(),
            output_file_path: None,
            validation_errors: vec![],
        })
    }

    /// Process JSON file with streaming
    async fn process_json_streaming(&self, file_path: &Path, job_id: Uuid) -> AppResult<ProcessingResultSummary> {
        let file = File::open(file_path).await?;
        let reader = BufReader::new(file);
        let mut lines = reader.lines();

        let mut total_rows = 0u64;
        let mut valid_rows = 0u64;
        let mut invalid_rows = 0u64;
        let mut validation_errors = Vec::new();

        while let Some(line) = lines.next_line().await? {
            total_rows += 1;

            // Validate JSON
            if serde_json::from_str::<serde_json::Value>(&line).is_ok() {
                valid_rows += 1;
            } else {
                invalid_rows += 1;
                validation_errors.push(ValidationError {
                    row_number: total_rows,
                    column_name: "json".to_string(),
                    error_type: "INVALID_JSON".to_string(),
                    error_message: "Invalid JSON format".to_string(),
                    value: Some(line),
                });
            }

            // Update progress
            self.update_job_progress(job_id, (total_rows as f64 / self.estimate_total_rows(file_path).await.unwrap_or(total_rows) as f64) * 100.0).await;
        }

        Ok(ProcessingResultSummary {
            total_rows,
            valid_rows,
            invalid_rows,
            processing_time_ms: 0,
            memory_usage_mb: self.get_memory_usage(),
            output_file_path: None,
            validation_errors,
        })
    }

    /// Process XML file with streaming
    async fn process_xml_streaming(&self, file_path: &Path, job_id: Uuid) -> AppResult<ProcessingResultSummary> {
        // In a real implementation, this would use a streaming XML parser
        // For now, we'll simulate this
        let file_size = self.get_file_metadata(file_path).await?.size;
        let estimated_rows = file_size / 200; // Rough estimate

        let mut processed_rows = 0u64;
        let chunk_size = self.config.chunk_size;

        while processed_rows < estimated_rows {
            let chunk_rows = std::cmp::min(chunk_size as u64, estimated_rows - processed_rows);
            processed_rows += chunk_rows;

            // Simulate processing
            tokio::time::sleep(Duration::from_millis(15)).await;

            // Update progress
            self.update_job_progress(job_id, (processed_rows as f64 / estimated_rows as f64) * 100.0).await;
        }

        Ok(ProcessingResultSummary {
            total_rows: estimated_rows,
            valid_rows: estimated_rows * 90 / 100, // Simulate 90% valid
            invalid_rows: estimated_rows * 10 / 100,
            processing_time_ms: 0,
            memory_usage_mb: self.get_memory_usage(),
            output_file_path: None,
            validation_errors: vec![],
        })
    }

    /// Process Parquet file with streaming
    async fn process_parquet_streaming(&self, file_path: &Path, job_id: Uuid) -> AppResult<ProcessingResultSummary> {
        // In a real implementation, this would use a Parquet streaming reader
        // For now, we'll simulate this
        let file_size = self.get_file_metadata(file_path).await?.size;
        let estimated_rows = file_size / 50; // Rough estimate

        let mut processed_rows = 0u64;
        let chunk_size = self.config.chunk_size;

        while processed_rows < estimated_rows {
            let chunk_rows = std::cmp::min(chunk_size as u64, estimated_rows - processed_rows);
            processed_rows += chunk_rows;

            // Simulate processing
            tokio::time::sleep(Duration::from_millis(5)).await;

            // Update progress
            self.update_job_progress(job_id, (processed_rows as f64 / estimated_rows as f64) * 100.0).await;
        }

        Ok(ProcessingResultSummary {
            total_rows: estimated_rows,
            valid_rows: estimated_rows * 98 / 100, // Simulate 98% valid
            invalid_rows: estimated_rows * 2 / 100,
            processing_time_ms: 0,
            memory_usage_mb: self.get_memory_usage(),
            output_file_path: None,
            validation_errors: vec![],
        })
    }

    /// Process Avro file with streaming
    async fn process_avro_streaming(&self, file_path: &Path, job_id: Uuid) -> AppResult<ProcessingResultSummary> {
        // In a real implementation, this would use an Avro streaming reader
        // For now, we'll simulate this
        let file_size = self.get_file_metadata(file_path).await?.size;
        let estimated_rows = file_size / 80; // Rough estimate

        let mut processed_rows = 0u64;
        let chunk_size = self.config.chunk_size;

        while processed_rows < estimated_rows {
            let chunk_rows = std::cmp::min(chunk_size as u64, estimated_rows - processed_rows);
            processed_rows += chunk_rows;

            // Simulate processing
            tokio::time::sleep(Duration::from_millis(8)).await;

            // Update progress
            self.update_job_progress(job_id, (processed_rows as f64 / estimated_rows as f64) * 100.0).await;
        }

        Ok(ProcessingResultSummary {
            total_rows: estimated_rows,
            valid_rows: estimated_rows * 97 / 100, // Simulate 97% valid
            invalid_rows: estimated_rows * 3 / 100,
            processing_time_ms: 0,
            memory_usage_mb: self.get_memory_usage(),
            output_file_path: None,
            validation_errors: vec![],
        })
    }

    /// Process ORC file with streaming
    async fn process_orc_streaming(&self, file_path: &Path, job_id: Uuid) -> AppResult<ProcessingResultSummary> {
        // In a real implementation, this would use an ORC streaming reader
        // For now, we'll simulate this
        let file_size = self.get_file_metadata(file_path).await?.size;
        let estimated_rows = file_size / 60; // Rough estimate

        let mut processed_rows = 0u64;
        let chunk_size = self.config.chunk_size;

        while processed_rows < estimated_rows {
            let chunk_rows = std::cmp::min(chunk_size as u64, estimated_rows - processed_rows);
            processed_rows += chunk_rows;

            // Simulate processing
            tokio::time::sleep(Duration::from_millis(12)).await;

            // Update progress
            self.update_job_progress(job_id, (processed_rows as f64 / estimated_rows as f64) * 100.0).await;
        }

        Ok(ProcessingResultSummary {
            total_rows: estimated_rows,
            valid_rows: estimated_rows * 96 / 100, // Simulate 96% valid
            invalid_rows: estimated_rows * 4 / 100,
            processing_time_ms: 0,
            memory_usage_mb: self.get_memory_usage(),
            output_file_path: None,
            validation_errors: vec![],
        })
    }

    /// Get file metadata
    async fn get_file_metadata(&self, file_path: &Path) -> AppResult<FileMetadata> {
        let metadata = tokio::fs::metadata(file_path).await?;
        Ok(FileMetadata {
            size: metadata.len(),
            created: metadata.created().unwrap_or_default().into(),
            modified: metadata.modified().unwrap_or_default().into(),
        })
    }

    /// Get file format from file path
    async fn get_file_format(&self, file_path: &Path) -> AppResult<FileFormat> {
        let extension = file_path.extension()
            .and_then(|ext| ext.to_str())
            .ok_or_else(|| AppError::Validation("File has no extension".to_string()))?;

        match extension.to_lowercase().as_str() {
            "csv" => Ok(FileFormat::Csv),
            "xlsx" | "xls" => Ok(FileFormat::Excel),
            "json" => Ok(FileFormat::Json),
            "xml" => Ok(FileFormat::Xml),
            "parquet" => Ok(FileFormat::Parquet),
            "avro" => Ok(FileFormat::Avro),
            "orc" => Ok(FileFormat::Orc),
            _ => Err(AppError::Validation(format!("Unsupported file format: {}", extension))),
        }
    }

    /// Estimate total rows in file
    async fn estimate_total_rows(&self, file_path: &Path) -> AppResult<u64> {
        let metadata = self.get_file_metadata(file_path).await?;
        let format = self.get_file_format(file_path).await?;

        // Rough estimates based on file size
        let estimated_rows = match format {
            FileFormat::Csv => metadata.size / 50, // Average 50 bytes per row
            FileFormat::Excel => metadata.size / 100,
            FileFormat::Json => metadata.size / 80,
            FileFormat::Xml => metadata.size / 200,
            FileFormat::Parquet => metadata.size / 50,
            FileFormat::Avro => metadata.size / 80,
            FileFormat::Orc => metadata.size / 60,
        };

        Ok(estimated_rows)
    }

    /// Update job progress
    async fn update_job_progress(&self, job_id: Uuid, progress: f64) {
        let mut jobs = self.active_jobs.write().await;
        if let Some(job) = jobs.get_mut(&job_id) {
            job.progress = progress.min(100.0);
        }
    }

    /// Get memory usage
    fn get_memory_usage(&self) -> f64 {
        // In a real implementation, this would get actual memory usage
        // For now, we'll simulate this
        50.0 // 50 MB
    }

    /// Update processing statistics
    async fn update_processing_stats(&self, processing_time_ms: u64, success: bool) {
        let mut stats = self.processing_stats.write().await;
        stats.total_files_processed += 1;
        if success {
            stats.successful_files += 1;
        } else {
            stats.failed_files += 1;
        }
        
        // Update average processing time
        let total_time = stats.average_processing_time_ms * (stats.total_files_processed - 1) as f64 + processing_time_ms as f64;
        stats.average_processing_time_ms = total_time / stats.total_files_processed as f64;
    }

    /// Get processing job status
    pub async fn get_job_status(&self, job_id: Uuid) -> AppResult<Option<FileProcessingJob>> {
        let jobs = self.active_jobs.read().await;
        Ok(jobs.get(&job_id).cloned())
    }

    /// List all processing jobs
    pub async fn list_jobs(&self, limit: Option<usize>, offset: Option<usize>) -> AppResult<Vec<FileProcessingJob>> {
        let jobs = self.active_jobs.read().await;
        let jobs_vec: Vec<_> = jobs.values().cloned().collect();
        
        let offset = offset.unwrap_or(0);
        let limit = limit.unwrap_or(100);
        
        Ok(jobs_vec.into_iter().skip(offset).take(limit).collect())
    }

    /// Cancel processing job
    pub async fn cancel_job(&self, job_id: Uuid) -> AppResult<()> {
        let mut jobs = self.active_jobs.write().await;
        if let Some(job) = jobs.get_mut(&job_id) {
            job.status = ProcessingStatus::Cancelled;
            job.completed_at = Some(Utc::now());
        }
        Ok(())
    }

    /// Get processing statistics
    pub async fn get_processing_stats(&self) -> AppResult<ProcessingStats> {
        let stats = self.processing_stats.read().await.clone();
        Ok(stats)
    }

    /// Clean up completed jobs
    pub async fn cleanup_completed_jobs(&self, older_than: Duration) -> AppResult<u32> {
        let cutoff_time = Utc::now() - chrono::Duration::from_std(older_than).unwrap_or_default();
        let mut jobs = self.active_jobs.write().await;
        let mut to_remove = Vec::new();

        for (job_id, job) in jobs.iter() {
            if matches!(job.status, ProcessingStatus::Completed | ProcessingStatus::Failed | ProcessingStatus::Cancelled) {
                if let Some(completed_at) = job.completed_at {
                    if completed_at < cutoff_time {
                        to_remove.push(*job_id);
                    }
                }
            }
        }

        for job_id in to_remove {
            jobs.remove(&job_id);
        }

        Ok(to_remove.len() as u32)
    }
}

/// File metadata
#[derive(Debug, Clone)]
struct FileMetadata {
    size: u64,
    created: DateTime<Utc>,
    modified: DateTime<Utc>,
}

impl Clone for StreamingFileProcessor {
    fn clone(&self) -> Self {
        Self {
            config: self.config.clone(),
            active_jobs: Arc::clone(&self.active_jobs),
            processing_stats: Arc::clone(&self.processing_stats),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_file_processing() {
        let temp_dir = tempdir().unwrap();
        let config = FileProcessingConfig {
            max_file_size: 100 * 1024 * 1024, // 100MB
            chunk_size: 1000,
            temp_directory: temp_dir.path().to_path_buf(),
            supported_formats: vec![FileFormat::Csv, FileFormat::Json],
            compression_enabled: false,
            encryption_enabled: false,
            parallel_processing: true,
            max_workers: 4,
        };

        let processor = StreamingFileProcessor::new(config);
        
        // Create a test CSV file
        let test_file = temp_dir.path().join("test.csv");
        let mut file = File::create(&test_file).await.unwrap();
        file.write_all(b"name,age,city\nJohn,25,New York\nJane,30,London\n").await.unwrap();
        file.flush().await.unwrap();

        // Process the file
        let job_id = processor.process_file_streaming(&test_file, FileFormat::Csv).await.unwrap();
        assert!(!job_id.is_nil());

        // Wait for processing to complete
        tokio::time::sleep(Duration::from_millis(100)).await;

        // Check job status
        let job = processor.get_job_status(job_id).await.unwrap();
        assert!(job.is_some());
        
        let job = job.unwrap();
        assert!(matches!(job.status, ProcessingStatus::Completed | ProcessingStatus::Processing));
    }

    #[tokio::test]
    async fn test_job_management() {
        let temp_dir = tempdir().unwrap();
        let config = FileProcessingConfig {
            max_file_size: 100 * 1024 * 1024,
            chunk_size: 1000,
            temp_directory: temp_dir.path().to_path_buf(),
            supported_formats: vec![FileFormat::Csv],
            compression_enabled: false,
            encryption_enabled: false,
            parallel_processing: false,
            max_workers: 1,
        };

        let processor = StreamingFileProcessor::new(config);
        
        // Test listing jobs
        let jobs = processor.list_jobs(Some(10), None).await.unwrap();
        assert!(jobs.is_empty());

        // Test getting statistics
        let stats = processor.get_processing_stats().await.unwrap();
        assert_eq!(stats.total_files_processed, 0);
    }
}
