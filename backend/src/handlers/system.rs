//! System handlers module

use actix_web::{web, HttpResponse, Result};

use crate::errors::AppError;
use crate::database::Database;
use crate::handlers::types::ApiResponse;

/// Configure system routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/status", web::get().to(system_status))
        .route("/metrics", web::get().to(get_metrics));
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
