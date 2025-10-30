//! Reconciliation job handlers module

use actix_web::{web, HttpRequest, HttpResponse, Result};
use uuid::Uuid;

use crate::errors::AppError;
use crate::database::Database;
use crate::config::Config;
use crate::services::cache::MultiLevelCache;
use crate::handlers::helpers::extract_user_id;
use crate::handlers::types::{UpdateReconciliationJobRequest, ApiResponse, ReconciliationResultsQuery};

/// Configure reconciliation routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/jobs", web::get().to(get_reconciliation_jobs))
        .route("/jobs", web::post().to(create_reconciliation_job))
        .route("/batch-resolve", web::post().to(batch_resolve_conflicts))
        .route("/jobs/{job_id}", web::get().to(get_reconciliation_job))
        .route("/jobs/{job_id}", web::put().to(update_reconciliation_job))
        .route("/jobs/{job_id}", web::delete().to(delete_reconciliation_job))
        .route("/jobs/{job_id}/start", web::post().to(start_reconciliation_job))
        .route("/jobs/{job_id}/stop", web::post().to(stop_reconciliation_job))
        .route("/jobs/{job_id}/results", web::get().to(get_reconciliation_results))
        .route("/jobs/{job_id}/progress", web::get().to(get_reconciliation_progress))
        .route("/active", web::get().to(get_active_reconciliation_jobs))
        .route("/queued", web::get().to(get_queued_reconciliation_jobs));
}
#[derive(serde::Deserialize)]
pub struct BatchResolveRequest {
    pub resolves: Vec<MatchResolve>,
}

#[derive(serde::Deserialize, Clone)]
pub struct MatchResolve {
    pub match_id: Uuid,
    pub action: String, // "approve" | "reject"
    pub notes: Option<String>,
}

/// Batch resolve reconciliation conflicts
pub async fn batch_resolve_conflicts(
    req: web::Json<BatchResolveRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let reconciliation_service = crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());

    let result = reconciliation_service.batch_approve_matches(user_id, req.resolves.clone()).await?;

    // Best-effort cache invalidation for affected jobs/projects if present in result
    // (Service can include affected ids in the future)

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "approved": result.approved,
            "rejected": result.rejected,
            "errors": result.errors,
        })),
        message: Some(format!("Resolved {} matches", result.approved + result.rejected)),
        error: None,
    }))
}

/// Get reconciliation jobs (global scope - all projects)
pub async fn get_reconciliation_jobs(
    data: web::Data<Database>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    // For now, return empty list - implement full listing if needed
    // This endpoint can be enhanced later with pagination and filtering
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!([])),
        message: None,
        error: None,
    }))
}

/// Create reconciliation job (global scope)
pub async fn create_reconciliation_job(
    req: web::Json<crate::handlers::types::CreateReconciliationJobRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let reconciliation_service = crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());
    let user_id = extract_user_id(&http_req)?;
    
    // Security check
    crate::utils::check_project_permission(data.get_ref(), user_id, req.project_id)?;
    
    let matching_rules = if let Some(settings) = &req.settings {
        if let Some(rules) = settings.get("matching_rules") {
            serde_json::from_value(rules.clone()).unwrap_or_default()
        } else {
            vec![]
        }
    } else {
        vec![]
    };

    let request = crate::services::reconciliation::CreateReconciliationJobRequest {
        project_id: req.project_id,
        name: req.name.clone(),
        description: req.description.clone(),
        source_a_id: req.source_data_source_id,
        source_b_id: req.target_data_source_id,
        confidence_threshold: req.confidence_threshold,
        matching_rules,
        created_by: user_id,
    };
    
    let new_job = reconciliation_service.create_reconciliation_job(user_id, request).await?;
    
    cache.delete(&format!("jobs:project:{}", req.project_id)).await.unwrap_or_default();
    cache.delete(&format!("project:{}", req.project_id)).await.unwrap_or_default();
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(new_job),
        message: Some("Reconciliation job created successfully".to_string()),
        error: None,
    }))
}

/// Get reconciliation job
pub async fn get_reconciliation_job(
    job_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let job_id_val = job_id.into_inner();
    
    crate::utils::check_job_access(data.get_ref(), user_id, job_id_val)?;
    
    let reconciliation_service = crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());
    let job_status = reconciliation_service.get_reconciliation_job_status(job_id_val).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(job_status),
        message: None,
        error: None,
    }))
}

/// Update reconciliation job
pub async fn update_reconciliation_job(
    job_id: web::Path<Uuid>,
    req: web::Json<UpdateReconciliationJobRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let job_id_val = job_id.into_inner();
    
    crate::utils::check_job_access(data.get_ref(), user_id, job_id_val)?;
    
    let reconciliation_service = crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());
    let project_id = crate::utils::authorization::get_project_id_from_job(data.get_ref(), job_id_val)?;
    
    let updated_job = reconciliation_service.update_reconciliation_job(
        job_id_val,
        req.name.clone(),
        req.description.clone(),
        req.confidence_threshold,
        req.settings.clone(),
    ).await?;
    
    cache.delete(&format!("job:{}", job_id_val)).await.unwrap_or_default();
    cache.delete(&format!("jobs:project:{}", project_id)).await.unwrap_or_default();
    cache.delete(&format!("project:{}", project_id)).await.unwrap_or_default();
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(updated_job),
        message: Some("Reconciliation job updated successfully".to_string()),
        error: None,
    }))
}

/// Delete reconciliation job
pub async fn delete_reconciliation_job(
    job_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let job_id_val = job_id.into_inner();
    
    crate::utils::check_job_access(data.get_ref(), user_id, job_id_val)?;
    
    let project_id = crate::utils::authorization::get_project_id_from_job(data.get_ref(), job_id_val).ok();
    let reconciliation_service = crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());
    
    reconciliation_service.delete_reconciliation_job(job_id_val).await?;
    
    let _ = cache.invalidate_job_cache(job_id_val, project_id).await;
    
    Ok(HttpResponse::NoContent().finish())
}

/// Start reconciliation job
pub async fn start_reconciliation_job(
    job_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let job_id_val = job_id.into_inner();
    
    crate::utils::check_job_access(data.get_ref(), user_id, job_id_val)?;
    
    let project_id = crate::utils::authorization::get_project_id_from_job(data.get_ref(), job_id_val).ok();
    let reconciliation_service = crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());
    
    reconciliation_service.start_reconciliation_job(job_id_val).await?;
    
    let _ = cache.invalidate_job_cache(job_id_val, project_id).await;
    
    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Reconciliation job started successfully".to_string()),
        error: None,
    }))
}

/// Stop reconciliation job
pub async fn stop_reconciliation_job(
    job_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let job_id_val = job_id.into_inner();
    
    crate::utils::check_job_access(data.get_ref(), user_id, job_id_val)?;
    
    let project_id = crate::utils::authorization::get_project_id_from_job(data.get_ref(), job_id_val).ok();
    let reconciliation_service = crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());
    
    reconciliation_service.stop_reconciliation_job(job_id_val).await?;
    
    let _ = cache.invalidate_job_cache(job_id_val, project_id).await;
    
    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Reconciliation job stopped successfully".to_string()),
        error: None,
    }))
}

/// Get reconciliation results
pub async fn get_reconciliation_results(
    job_id: web::Path<Uuid>,
    query: web::Query<ReconciliationResultsQuery>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let job_id_val = job_id.into_inner();
    
    crate::utils::check_job_access(data.get_ref(), user_id, job_id_val)?;
    
    let reconciliation_service = crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());
    
    let results = reconciliation_service.get_reconciliation_results(
        job_id_val,
        query.page,
        query.per_page,
    ).await?;

    // Support lean payloads: return minimal fields if requested
    if let Some(lean) = query.lean {
        if lean {
            let lean_items: Vec<serde_json::Value> = results.into_iter().map(|r| {
                serde_json::json!({
                    "id": r.id,
                    "confidence": r.confidence_score,
                    "status": r.match_type,
                })
            }).collect();
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

/// Get reconciliation progress
pub async fn get_reconciliation_progress(
    job_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let job_id_val = job_id.into_inner();
    
    crate::utils::check_job_access(data.get_ref(), user_id, job_id_val)?;
    
    let reconciliation_service = crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());
    let job_status = reconciliation_service.get_reconciliation_job_status(job_id_val).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "progress": job_status.progress,
            "status": job_status.status,
            "total_records": job_status.total_records,
            "processed_records": job_status.processed_records,
            "matched_records": job_status.matched_records,
            "unmatched_records": job_status.unmatched_records,
        })),
        message: None,
        error: None,
    }))
}

/// Get active reconciliation jobs
pub async fn get_active_reconciliation_jobs(
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let reconciliation_service = crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());
    let active_jobs = reconciliation_service.get_active_jobs().await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "active_jobs": active_jobs
        })),
        message: None,
        error: None,
    }))
}

/// Get queued reconciliation jobs
pub async fn get_queued_reconciliation_jobs(
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let reconciliation_service = crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());
    let queued_jobs = reconciliation_service.get_queued_jobs().await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "queued_jobs": queued_jobs
        })),
        message: None,
        error: None,
    }))
}
