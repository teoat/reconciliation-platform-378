// ============================================================================
// HEALTH CHECK HANDLERS
// ============================================================================

use actix_web::{web, HttpResponse, Result};
use serde_json::json;
use crate::services::monitoring::{MonitoringService, HealthStatus};
use std::sync::Arc;

/// Health check endpoint
pub async fn health_check(
    monitoring_service: web::Data<Arc<MonitoringService>>
) -> Result<HttpResponse> {
    let health_report = monitoring_service.run_health_checks().await;
    
    let status_code = match health_report.overall_status {
        HealthStatus::Healthy => 200,
        HealthStatus::Degraded => 200, // Still operational but degraded
        HealthStatus::Unhealthy => 503,
        HealthStatus::Unknown => 503,
    };
    
    Ok(HttpResponse::build(
            actix_web::http::StatusCode::from_u16(status_code)
        .unwrap_or_else(|_| actix_web::http::StatusCode::INTERNAL_SERVER_ERROR)
    )
    .json(json!({
        "status": health_report.overall_status.to_string(),
        "timestamp": health_report.timestamp,
        "version": health_report.version,
        "uptime_seconds": health_report.uptime.as_secs(),
        "checks": health_report.checks
    })))
}

/// Liveness probe endpoint
pub async fn liveness_probe() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(json!({
        "status": "alive",
        "timestamp": chrono::Utc::now()
    })))
}

/// Readiness probe endpoint
pub async fn readiness_probe(
    monitoring_service: web::Data<Arc<MonitoringService>>
) -> Result<HttpResponse> {
    let health_report = monitoring_service.run_health_checks().await;
    
    // Check if critical services are healthy
    let critical_checks = health_report.checks.iter()
        .filter(|check| matches!(check.name.as_str(), "database" | "redis"))
        .collect::<Vec<_>>();
    
    let all_critical_healthy = critical_checks.iter()
        .all(|check| check.status == HealthStatus::Healthy);
    
    if all_critical_healthy {
        Ok(HttpResponse::Ok().json(json!({
            "status": "ready",
            "timestamp": chrono::Utc::now(),
            "critical_services": "healthy"
        })))
    } else {
        Ok(HttpResponse::ServiceUnavailable().json(json!({
            "status": "not_ready",
            "timestamp": chrono::Utc::now(),
            "critical_services": "unhealthy"
        })))
    }
}

/// Metrics endpoint for Prometheus
pub async fn metrics(
    monitoring_service: web::Data<Arc<MonitoringService>>
) -> Result<HttpResponse> {
    let metrics = monitoring_service.get_prometheus_metrics().await;
    
    Ok(HttpResponse::Ok()
        .content_type("text/plain; version=0.0.4; charset=utf-8")
        .body(metrics))
}

/// Metrics summary endpoint (JSON format)
pub async fn metrics_summary(
    monitoring_service: web::Data<Arc<MonitoringService>>
) -> Result<HttpResponse> {
    match monitoring_service.get_metrics_summary().await {
        Ok(summary) => Ok(HttpResponse::Ok().json(summary)),
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": e.to_string()
        })))
    }
}

/// Configure health check routes
pub fn configure_health_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/health", web::get().to(health_check))
        .route("/health/live", web::get().to(liveness_probe))
        .route("/health/ready", web::get().to(readiness_probe))
        .route("/metrics", web::get().to(metrics))
        .route("/metrics/summary", web::get().to(metrics_summary));
}
