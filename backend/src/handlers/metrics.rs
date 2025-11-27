//! Metrics API Handler
//!
//! Provides HTTP endpoints for metrics collection and monitoring

use crate::errors::AppResult;
use crate::services::metrics::{MetricsService, metric_names};
use crate::handlers::types::ApiResponse;
use actix_web::{web, HttpResponse, Responder};
use std::sync::Arc;
use utoipa;

/// Configure metrics routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(get_metrics))
        .route("/summary", web::get().to(get_metrics_summary))
        .route("/health", web::get().to(health_with_metrics))
        .route("/{metric_name}", web::get().to(get_metric));
}

/// Get all metrics
/// 
/// Retrieves all collected system metrics.
#[utoipa::path(
    get,
    path = "/api/v1/metrics",
    tag = "Metrics",
    responses(
        (status = 200, description = "Metrics retrieved successfully", body = ApiResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_metrics(
    metrics_service: web::Data<Arc<MetricsService>>,
) -> AppResult<impl Responder> {
    let all_metrics = metrics_service.get_all_metrics().await;
    Ok(HttpResponse::Ok().json(all_metrics))
}

/// Get metrics summary
/// 
/// Retrieves a summary of key system metrics.
#[utoipa::path(
    get,
    path = "/api/v1/metrics/summary",
    tag = "Metrics",
    responses(
        (status = 200, description = "Metrics summary retrieved successfully", body = ApiResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_metrics_summary(
    metrics_service: web::Data<Arc<MetricsService>>,
) -> AppResult<impl Responder> {
    let summary = metrics_service.get_summary().await;
    Ok(HttpResponse::Ok().json(summary))
}

/// Get specific metric
/// 
/// Retrieves a specific metric by name.
#[utoipa::path(
    get,
    path = "/api/v1/metrics/{metric_name}",
    tag = "Metrics",
    params(
        ("metric_name" = String, Path, description = "Metric name")
    ),
    responses(
        (status = 200, description = "Metric retrieved successfully", body = ApiResponse),
        (status = 404, description = "Metric not found", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_metric(
    metrics_service: web::Data<Arc<MetricsService>>,
    path: web::Path<String>,
) -> AppResult<impl Responder> {
    let metric_name = path.into_inner();
    let metric = metrics_service.get_metric(&metric_name).await;
    
    match metric {
        Some(m) => Ok(HttpResponse::Ok().json(m)),
        None => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Metric not found",
            "metric": metric_name
        }))),
    }
}

/// Health check with metrics
/// 
/// Returns health status along with key metrics.
#[utoipa::path(
    get,
    path = "/api/v1/metrics/health",
    tag = "Metrics",
    responses(
        (status = 200, description = "Health and metrics retrieved successfully", body = ApiResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn health_with_metrics(
    metrics_service: web::Data<Arc<MetricsService>>,
) -> AppResult<impl Responder> {
    let summary = metrics_service.get_summary().await;
    
    let health = serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "metrics": {
            "cqrs_commands": summary.get(metric_names::CQRS_COMMAND_COUNT).copied().unwrap_or(0.0),
            "cqrs_queries": summary.get(metric_names::CQRS_QUERY_COUNT).copied().unwrap_or(0.0),
            "events_published": summary.get(metric_names::EVENT_PUBLISHED_COUNT).copied().unwrap_or(0.0),
            "cache_hit_rate": summary.get(metric_names::CACHE_HIT_RATE).copied().unwrap_or(0.0),
        }
    });
    
    Ok(HttpResponse::Ok().json(health))
}
