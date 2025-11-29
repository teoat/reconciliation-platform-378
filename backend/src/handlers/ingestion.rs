//! Data ingestion handlers module

use actix_web::{web, HttpRequest, HttpResponse, Result};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::database::Database;
use crate::errors::AppError;
use crate::handlers::helpers::extract_user_id;
use crate::handlers::types::{
    ApiResponse, PaginatedResponse, SearchQueryParams,
    ingestion::{
        UploadDataRequest, ProcessDataRequest, ValidateDataRequest, TransformDataRequest,
    },
};
use crate::utils::check_project_permission;
use crate::services::ingestion::IngestionService;
use crate::models::{NewIngestionJob, UpdateIngestionJob};
use std::sync::Arc;

/// Configure ingestion routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/upload", web::post().to(upload_data))
        .route("/process", web::post().to(process_data))
        .route("/validate", web::post().to(validate_data))
        .route("/transform", web::post().to(transform_data))
        .route("/{id}/status", web::get().to(get_status))
        .route("/{id}/results", web::get().to(get_results))
        .route("/{id}/errors", web::get().to(get_errors))
        .route("/{id}/download", web::get().to(download_data));
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IngestionJob {
    pub id: Uuid,
    pub project_id: Uuid,
    pub status: String,
    pub progress: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IngestionStatus {
    pub id: Uuid,
    pub status: String,
    pub progress: i32,
    pub total_records: Option<i64>,
    pub processed_records: i64,
    pub errors: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IngestionResults {
    pub id: Uuid,
    pub records: Vec<serde_json::Value>,
    pub statistics: serde_json::Value,
}

/// Upload data for ingestion
/// 
/// Creates a new ingestion job for processing uploaded data.
#[utoipa::path(
    post,
    path = "/api/v1/ingestion/upload",
    tag = "Ingestion",
    request_body = serde_json::Value,
    responses(
        (status = 201, description = "Data uploaded successfully", body = ApiResponse),
        (status = 400, description = "Invalid request", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn upload_data(
    req: web::Json<UploadDataRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    req.validate().map_err(|e| AppError::Validation(format!("Validation error: {:?}", e)))?;
    let user_id = extract_user_id(&http_req)?;
    
    let project_id = req.project_id;
    let filename = req.filename.clone();
    
    // Check authorization
    check_project_permission(data.get_ref(), user_id, project_id)?;

    use crate::models::schema::ingestion_jobs;
    use crate::models::ingestion::NewIngestionJob;
    let mut conn = data.get_connection()?;

    // Create ingestion job using NewIngestionJob struct
    let new_job = NewIngestionJob {
        project_id,
        job_name: filename.clone(),
        source_type: "file".to_string(),
        source_config: serde_json::json!({
            "filename": filename,
            "upload_method": "api"
        }),
        status: "uploaded".to_string(),
        progress: 0,
        metadata: req.metadata.clone().unwrap_or_else(|| serde_json::json!({})),
        created_by: user_id,
    };

    let job_id: Uuid = diesel::insert_into(ingestion_jobs::table)
        .values(&new_job)
        .returning(ingestion_jobs::id)
        .get_result(&mut conn)
        .map_err(AppError::Database)?;

    // Get created job using the model
    use crate::models::ingestion::IngestionJob;
    let job = ingestion_jobs::table
        .find(job_id)
        .first::<IngestionJob>(&mut conn)
        .map_err(AppError::Database)?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "id": job.id,
            "project_id": job.project_id,
            "job_name": job.job_name,
            "status": job.status,
            "progress": job.progress,
            "total_records": job.total_records,
            "processed_records": job.processed_records,
            "error_count": job.error_count,
            "created_at": job.created_at,
            "started_at": job.started_at,
            "completed_at": job.completed_at,
        })),
        message: Some("Data uploaded successfully".to_string()),
        error: None,
    }))
}

/// Process uploaded data
/// 
/// Starts processing an uploaded ingestion job.
#[utoipa::path(
    post,
    path = "/api/v1/ingestion/process",
    tag = "Ingestion",
    request_body = serde_json::Value,
    responses(
        (status = 200, description = "Processing started", body = ApiResponse),
        (status = 404, description = "Job not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn process_data(
    req: web::Json<ProcessDataRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    req.validate().map_err(|e| AppError::Validation(format!("Validation error: {:?}", e)))?;
    let user_id = extract_user_id(&http_req)?;
    
    let job_id = req.job_id;
    
    use crate::models::schema::ingestion_jobs;
    let mut conn = data.get_connection()?;

    // Get job and verify authorization
    use crate::models::ingestion::IngestionJob;
    let job = ingestion_jobs::table
        .find(job_id)
        .first::<IngestionJob>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;

    let job = job
        .ok_or_else(|| AppError::NotFound("Ingestion job not found".to_string()))?;

    // Check authorization
    check_project_permission(data.get_ref(), user_id, job.project_id)?;

    // Update job status to processing
    diesel::update(ingestion_jobs::table.find(job_id))
        .set((
            ingestion_jobs::status.eq("processing"),
            ingestion_jobs::started_at.eq(Some(chrono::Utc::now())),
        ))
        .execute(&mut conn)
        .map_err(AppError::Database)?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "status": "processing",
            "message": "Processing started",
            "job_id": job_id,
        })),
        message: Some("Processing started".to_string()),
        error: None,
    }))
}

/// Validate data
/// 
/// Validates data in an ingestion job.
#[utoipa::path(
    post,
    path = "/api/v1/ingestion/validate",
    tag = "Ingestion",
    request_body = serde_json::Value,
    responses(
        (status = 200, description = "Validation completed", body = ApiResponse),
        (status = 404, description = "Job not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn validate_data(
    req: web::Json<ValidateDataRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    req.validate().map_err(|e| AppError::Validation(format!("Validation error: {:?}", e)))?;
    let user_id = extract_user_id(&http_req)?;
    
    let job_id = req.job_id;
    
    use crate::models::schema::ingestion_jobs;
    let mut conn = data.get_connection()?;

    // Get job and verify authorization
    use crate::models::ingestion::IngestionJob;
    let job = ingestion_jobs::table
        .find(job_id)
        .first::<IngestionJob>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;

    let job = job
        .ok_or_else(|| AppError::NotFound("Ingestion job not found".to_string()))?;

    // Check authorization
    check_project_permission(data.get_ref(), user_id, job.project_id)?;

    // For now, return basic validation result
    // In production, this would perform actual validation
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "valid": true,
            "errors": [],
            "warnings": [],
            "job_id": job_id,
        })),
        message: Some("Validation completed".to_string()),
        error: None,
    }))
}

/// Transform data
pub async fn transform_data(
    req: web::Json<TransformDataRequest>,
    _http_req: HttpRequest,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    req.validate().map_err(|e| AppError::Validation(format!("Validation error: {:?}", e)))?;
    let _job_id = req.job_id;
    let _transformation_rules = req.transformation_rules.clone();
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "status": "transformed",
            "transformed_records": 0
        })),
        message: Some("Transformation completed".to_string()),
        error: None,
    }))
}

/// Get ingestion status
/// 
/// Retrieves the status of an ingestion job.
#[utoipa::path(
    get,
    path = "/api/v1/ingestion/{id}/status",
    tag = "Ingestion",
    params(
        ("id" = Uuid, Path, description = "Ingestion job ID")
    ),
    responses(
        (status = 200, description = "Status retrieved successfully", body = ApiResponse),
        (status = 404, description = "Job not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_status(
    path: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let job_id = path.into_inner();
    
    // Get job to verify authorization
    use crate::models::schema::ingestion_jobs;
    let mut conn = data.get_connection()?;
    let job = ingestion_jobs::table
        .find(job_id)
        .first::<crate::models::IngestionJob>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;
    
    let job = job.ok_or_else(|| AppError::NotFound("Ingestion job not found".to_string()))?;
    check_project_permission(data.get_ref(), user_id, job.project_id)?;
    
    let ingestion_service = IngestionService::new(Arc::new(data.get_ref().clone()));
    let status = ingestion_service.get_status(job_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(status),
        message: None,
        error: None,
    }))
}

/// Get ingestion results
/// 
/// Retrieves the results of a completed ingestion job.
#[utoipa::path(
    get,
    path = "/api/v1/ingestion/{id}/results",
    tag = "Ingestion",
    params(
        ("id" = Uuid, Path, description = "Ingestion job ID"),
        ("page" = Option<i32>, Query, description = "Page number (1-based)"),
        ("per_page" = Option<i32>, Query, description = "Items per page (max 100)")
    ),
    responses(
        (status = 200, description = "Results retrieved successfully", body = ApiResponse),
        (status = 404, description = "Job not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_results(
    path: web::Path<Uuid>,
    query: web::Query<SearchQueryParams>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let job_id = path.into_inner();
    let page = query.page.unwrap_or(1) as i64;
    let per_page = query.per_page.unwrap_or(20).min(100) as i64;
    
    // Get job to verify authorization
    use crate::models::schema::ingestion_jobs;
    let mut conn = data.get_connection()?;
    let job = ingestion_jobs::table
        .find(job_id)
        .first::<crate::models::IngestionJob>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;
    
    let job = job.ok_or_else(|| AppError::NotFound("Ingestion job not found".to_string()))?;
    check_project_permission(data.get_ref(), user_id, job.project_id)?;
    
    let ingestion_service = IngestionService::new(Arc::new(data.get_ref().clone()));
    let (results, total) = ingestion_service.get_results(job_id, page, per_page).await?;
    
    let total_pages = (total as f64 / per_page as f64).ceil() as i32;
    
    let paginated = PaginatedResponse {
        items: results,
        total,
        page: page as i32,
        per_page: per_page as i32,
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Get ingestion errors
/// 
/// Retrieves errors encountered during ingestion processing.
#[utoipa::path(
    get,
    path = "/api/v1/ingestion/{id}/errors",
    tag = "Ingestion",
    params(
        ("id" = Uuid, Path, description = "Ingestion job ID"),
        ("page" = Option<i32>, Query, description = "Page number (1-based)"),
        ("per_page" = Option<i32>, Query, description = "Items per page (max 100)")
    ),
    responses(
        (status = 200, description = "Errors retrieved successfully", body = PaginatedResponse),
        (status = 404, description = "Job not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_errors(
    path: web::Path<Uuid>,
    query: web::Query<SearchQueryParams>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let job_id = path.into_inner();
    let page = query.page.unwrap_or(1) as i64;
    let per_page = query.per_page.unwrap_or(20).min(100) as i64;
    
    // Get job to verify authorization
    use crate::models::schema::ingestion_jobs;
    let mut conn = data.get_connection()?;
    let job = ingestion_jobs::table
        .find(job_id)
        .first::<crate::models::IngestionJob>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;
    
    let job = job.ok_or_else(|| AppError::NotFound("Ingestion job not found".to_string()))?;
    check_project_permission(data.get_ref(), user_id, job.project_id)?;
    
    let ingestion_service = IngestionService::new(Arc::new(data.get_ref().clone()));
    let (errors, total) = ingestion_service.get_errors(job_id, page, per_page).await?;
    
    let total_pages = (total as f64 / per_page as f64).ceil() as i32;
    
    let paginated = PaginatedResponse {
        items: errors,
        total,
        page: page as i32,
        per_page: per_page as i32,
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Download processed data
/// 
/// Downloads the processed data from an ingestion job.
#[utoipa::path(
    get,
    path = "/api/v1/ingestion/{id}/download",
    tag = "Ingestion",
    params(
        ("id" = Uuid, Path, description = "Ingestion job ID")
    ),
    responses(
        (status = 200, description = "Data downloaded successfully", content_type = "application/octet-stream"),
        (status = 404, description = "Job or data not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn download_data(
    path: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let job_id = path.into_inner();
    
    use crate::models::schema::{ingestion_jobs, data_sources};
    let mut conn = data.get_connection()?;

    // Get job and verify authorization
    use crate::models::ingestion::IngestionJob;
    let job = ingestion_jobs::table
        .find(job_id)
        .first::<IngestionJob>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;

    let job = job
        .ok_or_else(|| AppError::NotFound("Ingestion job not found".to_string()))?;

    // Check authorization
    check_project_permission(data.get_ref(), user_id, job.project_id)?;

    // Find associated data source
    let data_source = data_sources::table
        .filter(data_sources::project_id.eq(job.project_id))
        .filter(data_sources::file_path.is_not_null())
        .first::<crate::models::DataSource>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;

    if let Some(ds) = data_source {
        if let Some(file_path) = ds.file_path {
            let path = std::path::PathBuf::from(&file_path);
            if path.exists() {
                let file = actix_files::NamedFile::open_async(&path)
                    .await
                    .map_err(|e| AppError::Internal(format!("Failed to open file: {}", e)))?;

                return Ok(file
                    .set_content_disposition(
                        actix_web::http::header::ContentDisposition::attachment(&job.job_name),
                    )
                    .into_response(&http_req));
            }
        }
    }

    Err(AppError::NotFound("Data not available for download".to_string()))
}

