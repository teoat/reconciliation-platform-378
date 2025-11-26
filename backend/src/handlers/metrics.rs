//! Metrics API Handler
//!
//! Provides HTTP endpoints for metrics collection and monitoring

use crate::errors::AppResult;
use crate::services::metrics::{MetricsService, metric_names};
use actix_web::{web, HttpResponse, Responder};
use std::sync::Arc;

/// Configure metrics routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(get_metrics))
        .route("/summary", web::get().to(get_metrics_summary))
        .route("/health", web::get().to(health_with_metrics))
        .route("/{metric_name}", web::get().to(get_metric));
}

/// Get all metrics
pub async fn get_metrics(
    metrics_service: web::Data<Arc<MetricsService>>,
) -> AppResult<impl Responder> {
    let all_metrics = metrics_service.get_all_metrics().await;
    Ok(HttpResponse::Ok().json(all_metrics))
}

/// Get metrics summary
pub async fn get_metrics_summary(
    metrics_service: web::Data<Arc<MetricsService>>,
) -> AppResult<impl Responder> {
    let summary = metrics_service.get_summary().await;
    Ok(HttpResponse::Ok().json(summary))
}

/// Get specific metric
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
