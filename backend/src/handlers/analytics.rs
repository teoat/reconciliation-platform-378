//! Analytics handlers module

use actix_web::{web, HttpResponse, Result};
use std::sync::Arc;
use std::time::Duration;
use uuid::Uuid;

use crate::config::Config;
use crate::database::Database;
use crate::errors::AppError;
use crate::handlers::helpers::extract_user_id;
use crate::handlers::types::ApiResponse;
use crate::services::cache::MultiLevelCache;
use crate::services::resilience::ResilienceManager;

/// Configure analytics routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/dashboard", web::get().to(get_dashboard_data))
        .route(
            "/projects/{project_id}/stats",
            web::get().to(get_project_stats),
        )
        .route(
            "/users/{user_id}/activity",
            web::get().to(get_user_activity),
        )
        .route(
            "/reconciliation/stats",
            web::get().to(get_reconciliation_stats),
        );
}

/// Get dashboard data
pub async fn get_dashboard_data(
    data: web::Data<Database>,
    cache: web::Data<Arc<MultiLevelCache>>,
    resilience: web::Data<Arc<ResilienceManager>>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let analytics_service = crate::services::analytics::AnalyticsService::new_with_resilience(
        data.get_ref().clone(),
        cache.get_ref().clone(),
        resilience.get_ref().clone(),
    );

    let dashboard_data = analytics_service.get_dashboard_data().await?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(dashboard_data),
        message: None,
        error: None,
    }))
}

/// Get project statistics
pub async fn get_project_stats(
    project_id: web::Path<Uuid>,
    http_req: actix_web::HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<Arc<MultiLevelCache>>,
    resilience: web::Data<Arc<ResilienceManager>>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let project_id_val = project_id.into_inner();

    // Check authorization before accessing project stats
    crate::utils::check_project_permission(data.get_ref(), user_id, project_id_val)?;

    // Try cache first (30 minute TTL - expensive aggregation)
    let cache_key = format!("stats:project:{}", project_id_val);
    if let Ok(Some(cached)) = cache.get_ref().get::<serde_json::Value>(&cache_key).await {
        return Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some(cached),
            message: None,
            error: None,
        }));
    }

    let analytics_service = crate::services::analytics::AnalyticsService::new_with_resilience(
        data.get_ref().clone(),
        cache.get_ref().clone(),
        resilience.get_ref().clone(),
    );

    let project_stats = analytics_service.get_project_stats(project_id_val).await?;

    // Cache stats for 30 minutes (expensive aggregation)
    let stats_json = serde_json::to_value(&project_stats)?;
    let _ = cache
        .get_ref()
        .set(&cache_key, &stats_json, Some(Duration::from_secs(1800)))
        .await;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(project_stats),
        message: None,
        error: None,
    }))
}

/// Get user activity statistics
pub async fn get_user_activity(
    user_id: web::Path<Uuid>,
    data: web::Data<Database>,
    cache: web::Data<Arc<MultiLevelCache>>,
    resilience: web::Data<Arc<ResilienceManager>>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let analytics_service = crate::services::analytics::AnalyticsService::new_with_resilience(
        data.get_ref().clone(),
        cache.get_ref().clone(),
        resilience.get_ref().clone(),
    );

    let user_activity = analytics_service
        .get_user_activity_stats(user_id.into_inner())
        .await?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(user_activity),
        message: None,
        error: None,
    }))
}

/// Get reconciliation statistics
pub async fn get_reconciliation_stats(
    data: web::Data<Database>,
    cache: web::Data<Arc<MultiLevelCache>>,
    resilience: web::Data<Arc<ResilienceManager>>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let analytics_service = crate::services::analytics::AnalyticsService::new_with_resilience(
        data.get_ref().clone(),
        cache.get_ref().clone(),
        resilience.get_ref().clone(),
    );

    let reconciliation_stats = analytics_service.get_reconciliation_stats().await?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(reconciliation_stats),
        message: None,
        error: None,
    }))
}
