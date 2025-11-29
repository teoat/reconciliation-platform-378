//! Reconciliation results handlers

use actix_web::{web, HttpRequest, HttpResponse, Result};
use uuid::Uuid;

use crate::database::Database;
use crate::errors::AppError;
use crate::handlers::helpers::extract_user_id;
use crate::handlers::types::{ApiResponse, ReconciliationResultsQuery};
use crate::services::reconciliation::service::MatchResolve;

#[derive(serde::Deserialize)]
pub struct BatchResolveRequest {
    pub resolves: Vec<MatchResolve>,
}

/// Batch resolve reconciliation conflicts
pub async fn batch_resolve_conflicts(
    req: web::Json<BatchResolveRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    _cache: web::Data<crate::services::cache::MultiLevelCache>,
    _config: web::Data<crate::config::Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let reconciliation_service =
        crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());

    let result = reconciliation_service
        .batch_approve_matches(user_id, req.resolves.clone())
        .await?;

    // Best-effort cache invalidation for affected jobs/projects if present in result
    // (Service can include affected ids in the future)

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "approved": result.approved,
            "rejected": result.rejected,
            "errors": result.errors,
        })),
        message: Some(format!(
            "Resolved {} matches",
            result.approved + result.rejected
        )),
        error: None,
    }))
}

/// Get reconciliation results
/// 
/// Retrieves reconciliation results for a specific job with optional filtering and pagination.
#[utoipa::path(
    get,
    path = "/api/v1/reconciliation/jobs/{job_id}/results",
    tag = "Reconciliation",
    params(
        ("job_id" = Uuid, Path, description = "Reconciliation job ID"),
        ("page" = Option<i64>, Query, description = "Page number (1-based)"),
        ("per_page" = Option<i64>, Query, description = "Items per page (max 100)"),
        ("match_type" = Option<String>, Query, description = "Filter by match type"),
        ("lean" = Option<bool>, Query, description = "Return lean results (minimal data)")
    ),
    responses(
        (status = 200, description = "Results retrieved successfully", body = ApiResponse),
        (status = 404, description = "Job not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_reconciliation_results(
    job_id: web::Path<Uuid>,
    query: web::Query<ReconciliationResultsQuery>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    _config: web::Data<crate::config::Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let job_id_val = job_id.into_inner();

    crate::utils::check_job_access(data.get_ref(), user_id, job_id_val)?;

    let reconciliation_service =
        crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());

    let results = reconciliation_service
        .get_reconciliation_results(job_id_val, query.page, query.per_page, query.lean)
        .await?;

    // Support lean payloads: return minimal fields if requested
    if let Some(lean) = query.lean {
        if lean {
            let lean_items: Vec<serde_json::Value> = results
                .into_iter()
                .map(|r| {
                    serde_json::json!({
                        "id": r.id,
                        "confidence": r.confidence_score,
                        "status": r.match_type,
                    })
                })
                .collect();
            return Ok(HttpResponse::Ok().json(ApiResponse {
                success: true,
                data: Some(serde_json::json!({"items": lean_items})),
                message: None,
                error: None,
            }));
        }
    }

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(results),
        message: None,
        error: None,
    }))
}

/// Update reconciliation match
pub async fn update_reconciliation_match(
    match_id: web::Path<Uuid>,
    req: web::Json<serde_json::Value>,
    http_req: HttpRequest,
    _data: web::Data<Database>,
    reconciliation_service: web::Data<crate::services::reconciliation::ReconciliationService>,
) -> Result<HttpResponse, AppError> {
    // Note: _data parameter is intentionally unused - database access via reconciliation_service
    let user_id = extract_user_id(&http_req)?;
    let match_id_val = match_id.into_inner();

    // Extract update data
    let status = req.get("status").and_then(|s| s.as_str());
    let confidence_score = req.get("confidence_score").and_then(|c| c.as_f64());
    let reviewed_by = req.get("reviewed_by").and_then(|r| r.as_str());

    // Update the match
    let updated_match = reconciliation_service
        .update_match(user_id, match_id_val, status, confidence_score, reviewed_by)
        .await?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(updated_match),
        message: Some("Match updated successfully".to_string()),
        error: None,
    }))
}

