//! Monitoring handlers module
//!
//! Provides endpoints for system monitoring, metrics, and health checks

use actix_web::{web, HttpResponse, Result};
use serde::Serialize;

use crate::errors::AppError;
use crate::handlers::types::ApiResponse;
use crate::services::monitoring::MonitoringService;

/// Configure monitoring routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/health", web::get().to(get_health))
        .route("/metrics", web::get().to(get_metrics))
        .route("/alerts", web::get().to(get_alerts))
        .route("/system", web::get().to(get_system_metrics));
}

/// Get monitoring health status
/// 
/// Returns the health status of the monitoring service.
#[utoipa::path(
    get,
    path = "/api/v1/monitoring/health",
    tag = "Monitoring",
    responses(
        (status = 200, description = "Monitoring service is healthy", body = ApiResponse),
        (status = 503, description = "Monitoring service is unhealthy", body = ApiResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_health() -> Result<HttpResponse, AppError> {
    let monitoring_service = MonitoringService::new();
    
    #[derive(Serialize)]
    struct HealthResponse {
        status: String,
        uptime_seconds: u64,
        timestamp: String,
    }
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(HealthResponse {
            status: "operational".to_string(),
            uptime_seconds: monitoring_service.start_time.elapsed().as_secs(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }),
        message: None,
        error: None,
    }))
}

/// Get Prometheus metrics
/// 
/// Returns system metrics in Prometheus format.
#[utoipa::path(
    get,
    path = "/api/v1/monitoring/metrics",
    tag = "Monitoring",
    responses(
        (status = 200, description = "Metrics retrieved successfully", body = ApiResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_metrics() -> Result<HttpResponse, AppError> {
    let monitoring_service = MonitoringService::new();
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

/// Get active alerts
/// 
/// Returns a list of currently active system alerts.
#[utoipa::path(
    get,
    path = "/api/v1/monitoring/alerts",
    tag = "Monitoring",
    responses(
        (status = 200, description = "Alerts retrieved successfully", body = ApiResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_alerts() -> Result<HttpResponse, AppError> {
    use crate::services::monitoring::AlertManager;
    
    let alert_manager = AlertManager::new();
    let alerts = alert_manager.list_active_alerts().await;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(alerts),
        message: None,
        error: None,
    }))
}

/// Get system metrics
/// 
/// Returns comprehensive system performance metrics.
#[utoipa::path(
    get,
    path = "/api/v1/monitoring/system",
    tag = "Monitoring",
    responses(
        (status = 200, description = "System metrics retrieved successfully", body = ApiResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_system_metrics() -> Result<HttpResponse, AppError> {
    let monitoring_service = MonitoringService::new();
    let metrics = monitoring_service.get_system_metrics().await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(metrics),
        message: None,
        error: None,
    }))
}

