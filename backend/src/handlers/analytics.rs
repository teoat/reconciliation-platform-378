//! Analytics handlers module

use actix_web::{web, HttpResponse, Result};
use std::sync::Arc;
use std::time::Duration;
use uuid::Uuid;
use utoipa;

use crate::config::Config;
use crate::database::Database;
use crate::errors::AppError;
use crate::handlers::helpers::extract_user_id;
use crate::handlers::types::{ApiResponse, SearchQueryParams};
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
        )
        .route("/metrics", web::get().to(get_analytics_metrics))
        .route("/trends", web::get().to(get_trends))
        .route("/predictions", web::get().to(get_predictions))
        .route("/insights", web::get().to(get_insights))
        .route("/recommendations", web::get().to(get_recommendations))
        .route("/export", web::post().to(export_analytics));
}

/// Get dashboard data
/// 
/// Retrieves aggregated analytics data for the dashboard.
#[utoipa::path(
    get,
    path = "/api/v1/analytics/dashboard",
    tag = "Analytics",
    responses(
        (status = 200, description = "Dashboard data retrieved successfully", body = ApiResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
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
/// 
/// Retrieves detailed statistics for a specific project.
#[utoipa::path(
    get,
    path = "/api/v1/analytics/projects/{project_id}/stats",
    tag = "Analytics",
    params(
        ("project_id" = Uuid, Path, description = "Project ID")
    ),
    responses(
        (status = 200, description = "Project statistics retrieved successfully", body = ApiResponse),
        (status = 404, description = "Project not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
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
/// 
/// Retrieves activity statistics for a specific user.
#[utoipa::path(
    get,
    path = "/api/v1/analytics/users/{user_id}/activity",
    tag = "Analytics",
    params(
        ("user_id" = Uuid, Path, description = "User ID")
    ),
    responses(
        (status = 200, description = "User activity retrieved successfully", body = ApiResponse),
        (status = 404, description = "User not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
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
/// 
/// Retrieves aggregated statistics for reconciliation jobs.
#[utoipa::path(
    get,
    path = "/api/v1/analytics/reconciliation/stats",
    tag = "Analytics",
    responses(
        (status = 200, description = "Reconciliation statistics retrieved successfully", body = ApiResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
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

/// Get analytics metrics
pub async fn get_analytics_metrics(
    query: web::Query<SearchQueryParams>,
    _data: web::Data<Database>,
    _cache: web::Data<Arc<MultiLevelCache>>,
) -> Result<HttpResponse, AppError> {
    let _date_range = query.q.as_deref();
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "total_projects": 0,
            "total_jobs": 0,
            "total_files": 0
        })),
        message: None,
        error: None,
    }))
}

/// Get trend analysis
pub async fn get_trends(
    query: web::Query<SearchQueryParams>,
    _data: web::Data<Database>,
    _cache: web::Data<Arc<MultiLevelCache>>,
) -> Result<HttpResponse, AppError> {
    let _metric = query.q.as_deref();
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "points": [],
            "trend": "stable"
        })),
        message: None,
        error: None,
    }))
}

/// Get predictions
pub async fn get_predictions(
    query: web::Query<SearchQueryParams>,
    _data: web::Data<Database>,
    _cache: web::Data<Arc<MultiLevelCache>>,
) -> Result<HttpResponse, AppError> {
    let _metric = query.q.as_deref();
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "forecast": [],
            "confidence_interval": []
        })),
        message: None,
        error: None,
    }))
}

/// Get insights
pub async fn get_insights(
    query: web::Query<SearchQueryParams>,
    _data: web::Data<Database>,
    _cache: web::Data<Arc<MultiLevelCache>>,
) -> Result<HttpResponse, AppError> {
    let _scope = query.q.as_deref();
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!([])),
        message: None,
        error: None,
    }))
}

/// Get recommendations
pub async fn get_recommendations(
    query: web::Query<SearchQueryParams>,
    _data: web::Data<Database>,
    _cache: web::Data<Arc<MultiLevelCache>>,
) -> Result<HttpResponse, AppError> {
    let _type = query.q.as_deref();
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!([])),
        message: None,
        error: None,
    }))
}

/// Export analytics data
pub async fn export_analytics(
    req: web::Json<serde_json::Value>,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let _metrics = req.get("metrics");
    let _format = req.get("format");
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "export_id": Uuid::new_v4(),
            "status": "processing"
        })),
        message: Some("Export started".to_string()),
        error: None,
    }))
}
