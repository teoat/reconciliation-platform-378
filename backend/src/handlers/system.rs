//! System handlers module

use actix_web::{web, HttpResponse, Result};

use crate::errors::AppError;
use crate::database::Database;
use crate::handlers::types::{ApiResponse, SearchQueryParams};

/// Configure system routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/status", web::get().to(system_status))
        .route("/metrics", web::get().to(get_metrics))
        .route("/config", web::get().to(get_config))
        .route("/logs", web::get().to(get_logs))
        .route("/backup", web::post().to(create_backup))
        .route("/restore", web::post().to(restore_backup));
}

/// System status endpoint (legacy - use /health instead)
pub async fn system_status() -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "status": "operational",
        "uptime": "0s",
        "version": env!("CARGO_PKG_VERSION")
    })))
}

/// Get system metrics
/// 
/// Returns comprehensive system performance metrics.
#[utoipa::path(
    get,
    path = "/api/v1/system/metrics",
    tag = "System",
    responses(
        (status = 200, description = "System metrics retrieved successfully", body = ApiResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_metrics(
    _data: web::Data<Database>,
    _config: web::Data<crate::config::Config>,
) -> Result<HttpResponse, AppError> {
    // Note: Parameters are intentionally unused - metrics come from MonitoringService
    use crate::services::monitoring::MonitoringService;
    
    let monitoring_service = MonitoringService::new();
    
    // Get comprehensive performance metrics
    let metrics = monitoring_service.get_system_metrics().await?;
    
    Ok(HttpResponse::Ok()
        .content_type("application/json")
        .json(ApiResponse {
            success: true,
            data: Some(metrics),
            message: None,
            error: None,
        }))
}

/// Get system configuration
pub async fn get_config(
    _data: web::Data<Database>,
    config: web::Data<crate::config::Config>,
) -> Result<HttpResponse, AppError> {
    // Return safe configuration (no secrets)
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "version": env!("CARGO_PKG_VERSION"),
            "host": config.host,
            "port": config.port,
        })),
        message: None,
        error: None,
    }))
}

/// Get system logs
pub async fn get_logs(
    query: web::Query<SearchQueryParams>,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    // TODO: Implement log retrieval
    let logs: Vec<serde_json::Value> = vec![];
    let total_pages = 0;
    
    let paginated = crate::handlers::types::PaginatedResponse {
        items: logs,
        total: 0,
        page: query.page.unwrap_or(1),
        per_page: query.per_page.unwrap_or(20),
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Create system backup
pub async fn create_backup(
    _req: web::Json<serde_json::Value>,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    // TODO: Implement backup creation
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "backup_id": uuid::Uuid::new_v4(),
            "status": "queued"
        })),
        message: Some("Backup started".to_string()),
        error: None,
    }))
}

/// Restore from backup
pub async fn restore_backup(
    req: web::Json<serde_json::Value>,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let _backup_id = req.get("backup_id");
    // TODO: Implement backup restoration
    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Restore started".to_string()),
        error: None,
    }))
}
