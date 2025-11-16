//! Sync handlers module
//!
//! Provides endpoints for offline data synchronization

use actix_web::{web, HttpRequest, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::errors::AppError;
use crate::handlers::helpers::extract_user_id;
use crate::handlers::types::ApiResponse;
use crate::services::offline_persistence::OfflinePersistenceService;

/// Request to sync data
#[derive(Debug, Deserialize)]
pub struct SyncRequest {
    pub key: String,
    pub data: serde_json::Value,
    pub data_type: String,
    pub project_id: Option<Uuid>,
}

/// Response for sync operations
#[derive(Debug, Serialize)]
pub struct SyncResponse {
    pub synced: bool,
    pub key: String,
    pub timestamp: String,
}

/// Configure sync routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/status", web::get().to(get_sync_status))
        .route("/data", web::post().to(sync_data))
        .route("/data/{key}", web::get().to(get_synced_data))
        .route("/unsynced", web::get().to(get_unsynced_data))
        .route("/recover", web::post().to(recover_unsynced));
}

/// Get sync service status
pub async fn get_sync_status() -> Result<HttpResponse, AppError> {
    #[derive(Serialize)]
    struct StatusResponse {
        status: String,
        service_available: bool,
    }
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(StatusResponse {
            status: "available".to_string(),
            service_available: true,
        }),
        message: None,
        error: None,
    }))
}

/// Sync data to server
pub async fn sync_data(
    req: web::Json<SyncRequest>,
    http_req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req).ok();
    let sync_service = OfflinePersistenceService::new();
    
    sync_service
        .store_data(
            &req.key,
            req.data.clone(),
            &req.data_type,
            user_id,
            req.project_id,
        )
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;
    
    sync_service
        .mark_synced(&req.key)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(SyncResponse {
            synced: true,
            key: req.key.clone(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
        message: Some("Data synced successfully".to_string()),
        error: None,
    }))
}

/// Get synced data by key
pub async fn get_synced_data(
    path: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let key = path.into_inner();
    let sync_service = OfflinePersistenceService::new();
    
    let data = sync_service
        .get_data(&key)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;
    
    match data {
        Some(d) => Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some(d),
            message: None,
            error: None,
        })),
        None => Err(AppError::NotFound(format!("Data with key '{}' not found", key))),
    }
}

/// Get all unsynced data
pub async fn get_unsynced_data(
    http_req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let _user_id = extract_user_id(&http_req).ok();
    let sync_service = OfflinePersistenceService::new();
    
    let unsynced = sync_service.get_unsynced_data().await;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(unsynced),
        message: None,
        error: None,
    }))
}

/// Recover and sync unsynced data
pub async fn recover_unsynced(
    http_req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let _user_id = extract_user_id(&http_req).ok();
    let sync_service = OfflinePersistenceService::new();
    
    let recovered = sync_service
        .recover_unsynced_data()
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;
    
    let count = recovered.len();
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(recovered),
        message: Some(format!("Recovered {} items", count)),
        error: None,
    }))
}

