//! File upload and management handlers module

use actix_multipart::Multipart;
use actix_web::{web, HttpRequest, HttpResponse, Result};
use uuid::Uuid;

use crate::errors::AppError;
use crate::database::Database;
use crate::config::Config;
use crate::services::cache::MultiLevelCache;
use crate::handlers::helpers::extract_user_id;
use crate::handlers::types::ApiResponse;
use crate::utils::check_project_permission;

/// Configure file management routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/upload", web::post().to(upload_file))
        .route("/{file_id}", web::get().to(get_file))
        .route("/{file_id}", web::delete().to(delete_file))
        .route("/{file_id}/process", web::post().to(process_file));
}

/// Upload file endpoint (REST compliant - returns 201 with Location header)
pub async fn upload_file(
    payload: Multipart,
    req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    // Extract project_id from query parameters
    let project_id = req.query_string()
        .split('&')
        .find(|param| param.starts_with("project_id="))
        .and_then(|param| param.split('=').nth(1))
        .and_then(|id| Uuid::parse_str(id).ok())
        .ok_or_else(|| AppError::Validation("Missing or invalid project_id".to_string()))?;
    
    // Extract user_id from request
    let user_id = extract_user_id(&req)?;
    // ✅ SECURITY: Check authorization before allowing upload
    check_project_permission(data.get_ref(), user_id, project_id)?;
    
    let file_service = crate::services::file::FileService::new(
        data.get_ref().clone(),
        config.upload_path.clone(),
    );
    
    let file_info = file_service.upload_file(payload, project_id, user_id).await?;
    
    // ✅ CACHE INVALIDATION: Clear project cache after file upload
    cache.delete(&format!("project:{}", project_id)).await.unwrap_or_default();
    cache.delete(&format!("files:project:{}", project_id)).await.unwrap_or_default();
    
    // REST compliant: Return 201 Created with Location header
    let location = format!("/api/v1/files/{}", file_info.id);
    Ok(HttpResponse::Created()
        .append_header((actix_web::http::header::LOCATION, location))
        .json(ApiResponse {
            success: true,
            data: Some(file_info),
            message: Some("File uploaded successfully".to_string()),
            error: None,
        }))
}

/// Get file information
pub async fn get_file(
    file_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let file_service = crate::services::file::FileService::new(
        data.get_ref().clone(),
        config.upload_path.clone(),
    );
    
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

/// Delete file
pub async fn delete_file(
    file_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let file_id_val = file_id.into_inner();
    
    let file_service = crate::services::file::FileService::new(
        data.get_ref().clone(),
        config.upload_path.clone(),
    );
    
    // Get file info first to check authorization
    let file_info = file_service.get_file(file_id_val).await?;
    
    // ✅ SECURITY FIX: Check authorization before deleting file
    let user_id = extract_user_id(&http_req)?;
    check_project_permission(data.get_ref(), user_id, file_info.project_id)?;
    
    file_service.delete_file(file_id_val).await?;
    
    // ✅ CACHE INVALIDATION: Clear project and file caches after deletion
    cache.delete(&format!("file:{}", file_id_val)).await.unwrap_or_default();
    cache.delete(&format!("files:project:{}", file_info.project_id)).await.unwrap_or_default();
    cache.delete(&format!("project:{}", file_info.project_id)).await.unwrap_or_default();
    
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
    
    let file_service = crate::services::file::FileService::new(
        data.get_ref().clone(),
        config.upload_path.clone(),
    );
    
    // Get file info first to check authorization
    let file_info = file_service.get_file(file_id_val).await?;
    
    // ✅ SECURITY FIX: Check authorization before processing file
    let user_id = extract_user_id(&http_req)?;
    check_project_permission(data.get_ref(), user_id, file_info.project_id)?;
    
    let processing_result = file_service.process_file(file_id_val).await?;
    
    // ✅ CACHE INVALIDATION: Clear file and project caches after processing
    cache.delete(&format!("file:{}", file_id_val)).await.unwrap_or_default();
    cache.delete(&format!("project:{}", file_info.project_id)).await.unwrap_or_default();
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(processing_result),
        message: Some("File processing completed".to_string()),
        error: None,
    }))
}
