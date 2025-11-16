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

