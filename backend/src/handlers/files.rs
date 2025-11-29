//! File upload and management handlers module

use actix_web::{web, HttpRequest, HttpResponse, Result};
use uuid::Uuid;

use crate::config::Config;
use crate::database::Database;
use crate::errors::AppError;
use crate::handlers::helpers::extract_user_id;
use crate::handlers::types::ApiResponse;
use crate::services::cache::MultiLevelCache;
use crate::utils::check_project_permission;
use futures_util::StreamExt;

/// Configure file management routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route(
        "/upload/resumable/init",
        web::post().to(init_resumable_upload),
    )
    .route(
        "/upload/resumable/chunk",
        web::post().to(upload_resumable_chunk),
    )
    .route(
        "/upload/resumable/complete",
        web::post().to(complete_resumable_upload),
    )
    .route("/{file_id}", web::get().to(get_file))
    .route("/{file_id}", web::delete().to(delete_file))
    .route("/{file_id}/download", web::get().to(download_file))
    .route("/{file_id}/preview", web::get().to(get_file_preview))
    .route("/{file_id}/process", web::post().to(process_file))
    .route("/{file_id}/metadata", web::get().to(get_file_metadata));
}

#[derive(serde::Deserialize, utoipa::ToSchema)]
pub struct InitResumableReq {
    /// Project ID for the file
    project_id: Uuid,
    /// Original filename
    filename: String,
    /// Expected file size in bytes (optional)
    expected_size: Option<i64>,
}

/// Initialize resumable upload
/// 
/// Creates a new resumable upload session for large file uploads.
#[utoipa::path(
    post,
    path = "/api/v1/files/upload/resumable/init",
    tag = "Files",
    request_body = InitResumableReq,
    responses(
        (status = 200, description = "Upload session initialized", body = ApiResponse),
        (status = 400, description = "Invalid request", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn init_resumable_upload(
    req: web::Json<InitResumableReq>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    check_project_permission(data.get_ref(), user_id, req.project_id)?;

    let file_service =
        crate::services::file::FileService::new(data.get_ref().clone(), config.upload_path.clone());

    let meta = file_service
        .init_resumable_upload(req.project_id, req.filename.clone(), req.expected_size)
        .await?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(meta),
        message: Some("Resumable upload initialized".to_string()),
        error: None,
    }))
}

/// Upload a resumable chunk (binary body)
pub async fn upload_resumable_chunk(
    http_req: HttpRequest,
    mut payload: web::Payload,
) -> Result<HttpResponse, AppError> {
    use actix_web::web::BytesMut;

    // Extract query params: upload_id, index
    let query = http_req.query_string();
    let upload_id = query
        .split('&')
        .find(|p| p.starts_with("upload_id="))
        .and_then(|p| p.split('=').nth(1))
        .and_then(|s| Uuid::parse_str(s).ok())
        .ok_or_else(|| AppError::Validation("Missing upload_id".to_string()))?;

    let chunk_index: u32 = query
        .split('&')
        .find(|p| p.starts_with("index="))
        .and_then(|p| p.split('=').nth(1))
        .and_then(|s| s.parse::<u32>().ok())
        .ok_or_else(|| AppError::Validation("Missing chunk index".to_string()))?;

    // Access app data
    let data = http_req
        .app_data::<web::Data<Database>>()
        .ok_or_else(|| AppError::InternalServerError("Database not available".to_string()))?
        .get_ref()
        .clone();
    let config = http_req
        .app_data::<web::Data<Config>>()
        .ok_or_else(|| AppError::InternalServerError("Config not available".to_string()))?
        .get_ref()
        .clone();

    let file_service = crate::services::file::FileService::new(data, config.upload_path.clone());

    // Read full body (a single chunk up to a few MB)
    let mut body = BytesMut::new();
    while let Some(item) = payload.next().await {
        let bytes = item.map_err(|e| AppError::Validation(format!("Invalid chunk body: {}", e)))?;
        body.extend_from_slice(&bytes);
    }

    file_service
        .upload_chunk(upload_id, chunk_index, &body)
        .await?;

    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Chunk received".to_string()),
        error: None,
    }))
}

#[derive(serde::Deserialize)]
pub struct CompleteResumableReq {
    project_id: Uuid,
    upload_id: Uuid,
    filename: String,
    total_chunks: u32,
}

/// Complete resumable upload
pub async fn complete_resumable_upload(
    req: web::Json<CompleteResumableReq>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    check_project_permission(data.get_ref(), user_id, req.project_id)?;

    let file_service =
        crate::services::file::FileService::new(data.get_ref().clone(), config.upload_path.clone());

    let result = file_service
        .complete_resumable_upload(
            req.project_id,
            req.upload_id,
            req.filename.clone(),
            req.total_chunks,
        )
        .await?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!(result)),
        message: Some("Upload completed".to_string()),
        error: None,
    }))
}

/// Download file
/// 
/// Downloads the file content by file ID.
#[utoipa::path(
    get,
    path = "/api/v1/files/{file_id}/download",
    tag = "Files",
    params(
        ("file_id" = Uuid, Path, description = "File ID")
    ),
    responses(
        (status = 200, description = "File downloaded successfully", content_type = "application/octet-stream"),
        (status = 404, description = "File not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn download_file(
    file_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let file_id_val = file_id.into_inner();
    let file_service =
        crate::services::file::FileService::new(data.get_ref().clone(), config.upload_path.clone());

    // Get file info first to check authorization
    let file_info = file_service.get_file(file_id_val).await?;

    // Check authorization
    let user_id = extract_user_id(&http_req)?;
    check_project_permission(data.get_ref(), user_id, file_info.project_id)?;

    // Get file for download
    let (file_path, uploaded_file) = file_service.get_file_for_download(file_id_val).await?;

    // Read file content
    let file_content = tokio::fs::read(&file_path)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to read file: {}", e)))?;

    // Determine content type
    let content_type = uploaded_file
        .content_type
        .as_deref()
        .unwrap_or("application/octet-stream");

    // Set appropriate headers for file download
    Ok(HttpResponse::Ok()
        .content_type(content_type)
        .append_header((
            actix_web::http::header::CONTENT_DISPOSITION,
            format!(
                "attachment; filename=\"{}\"",
                uploaded_file.original_filename
            ),
        ))
        .append_header((
            actix_web::http::header::CONTENT_LENGTH,
            uploaded_file.file_size.to_string(),
        ))
        .body(file_content))
}

/// Get file information
/// 
/// Retrieves file metadata by file ID.
#[utoipa::path(
    get,
    path = "/api/v1/files/{file_id}",
    tag = "Files",
    params(
        ("file_id" = Uuid, Path, description = "File ID")
    ),
    responses(
        (status = 200, description = "File retrieved successfully", body = ApiResponse),
        (status = 404, description = "File not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_file(
    file_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let file_service =
        crate::services::file::FileService::new(data.get_ref().clone(), config.upload_path.clone());

    let file_info = file_service.get_file(file_id.into_inner()).await?;

    // ✅ SECURITY FIX: Check authorization before accessing file
    let user_id = extract_user_id(&http_req)?;
    check_project_permission(data.get_ref(), user_id, file_info.project_id)?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(file_info),
        message: None,
        error: None,
    }))
}

/// Get file preview (safe content preview)
pub async fn get_file_preview(
    file_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let file_service =
        crate::services::file::FileService::new(data.get_ref().clone(), config.upload_path.clone());

    let file_info = file_service.get_file(file_id.into_inner()).await?;

    // ✅ SECURITY FIX: Check authorization before accessing file
    let user_id = extract_user_id(&http_req)?;
    check_project_permission(data.get_ref(), user_id, file_info.project_id)?;

    // Get file preview (first 10 lines or 1KB, whichever is smaller)
    // Note: FileUploadResult doesn't include file_path, so we can't get preview
    // This would need to be implemented differently

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "file_id": file_info.id,
            "filename": file_info.filename,
            "size": file_info.size,
            "status": file_info.status,
            "project_id": file_info.project_id,
        })),
        message: None,
        error: None,
    }))
}

/// Delete file
/// 
/// Deletes a file and its associated data.
#[utoipa::path(
    delete,
    path = "/api/v1/files/{file_id}",
    tag = "Files",
    params(
        ("file_id" = Uuid, Path, description = "File ID")
    ),
    responses(
        (status = 204, description = "File deleted successfully"),
        (status = 404, description = "File not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn delete_file(
    file_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let file_id_val = file_id.into_inner();

    let file_service =
        crate::services::file::FileService::new(data.get_ref().clone(), config.upload_path.clone());

    // Get file info first to check authorization
    let file_info = file_service.get_file(file_id_val).await?;

    // ✅ SECURITY FIX: Check authorization before deleting file
    let user_id = extract_user_id(&http_req)?;
    check_project_permission(data.get_ref(), user_id, file_info.project_id)?;

    file_service.delete_file(file_id_val).await?;

    // ✅ CACHE INVALIDATION: Clear project and file caches after deletion
    cache
        .delete(&format!("file:{}", file_id_val))
        .await
        .unwrap_or_default();
    cache
        .delete(&format!("files:project:{}", file_info.project_id))
        .await
        .unwrap_or_default();
    cache
        .delete(&format!("project:{}", file_info.project_id))
        .await
        .unwrap_or_default();

    Ok(HttpResponse::NoContent().finish())
}

/// Process file
pub async fn process_file(
    file_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let file_id_val = file_id.into_inner();

    let file_service =
        crate::services::file::FileService::new(data.get_ref().clone(), config.upload_path.clone());

    // Get file info first to check authorization
    let file_info = file_service.get_file(file_id_val).await?;

    // ✅ SECURITY FIX: Check authorization before processing file
    let user_id = extract_user_id(&http_req)?;
    check_project_permission(data.get_ref(), user_id, file_info.project_id)?;

    let processing_result = file_service.process_file(file_id_val).await?;

    // ✅ CACHE INVALIDATION: Clear file and project caches after processing
    cache
        .delete(&format!("file:{}", file_id_val))
        .await
        .unwrap_or_default();
    cache
        .delete(&format!("project:{}", file_info.project_id))
        .await
        .unwrap_or_default();

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(processing_result),
        message: Some("File processing completed".to_string()),
        error: None,
    }))
}

/// Get file metadata
pub async fn get_file_metadata(
    file_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let file_id_val = file_id.into_inner();
    let file_service = crate::services::file::FileService::new(data.get_ref().clone(), config.upload_path.clone());
    let file_info = file_service.get_file(file_id_val).await?;
    
    let user_id = extract_user_id(&http_req)?;
    check_project_permission(data.get_ref(), user_id, file_info.project_id)?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "id": file_info.id,
            "filename": file_info.filename,
            "size": file_info.size,
            "status": file_info.status,
            "project_id": file_info.project_id
        })),
        message: None,
        error: None,
    }))
}
