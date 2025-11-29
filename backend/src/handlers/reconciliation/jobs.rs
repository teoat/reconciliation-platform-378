//! Reconciliation job handlers

use actix_web::{web, HttpRequest, HttpResponse, Result};
use uuid::Uuid;

use crate::config::Config;
use crate::database::Database;
use crate::errors::AppError;
use crate::handlers::helpers::extract_user_id;
use crate::handlers::types::{ApiResponse, UpdateReconciliationJobRequest};
use crate::services::cache::MultiLevelCache;
use crate::websocket::WsServer;
use actix::Addr;

/// Get reconciliation jobs (global scope - all projects)
/// 
/// Retrieves a list of all reconciliation jobs across all projects.
#[utoipa::path(
    get,
    path = "/api/v1/reconciliation/jobs",
    tag = "Reconciliation",
    responses(
        (status = 200, description = "Jobs retrieved successfully", body = ApiResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_reconciliation_jobs(
    _data: web::Data<Database>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    // Note: Parameters are intentionally unused - endpoint returns empty list for now
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
/// 
/// Creates a new reconciliation job for comparing two data sources.
#[utoipa::path(
    post,
    path = "/api/v1/reconciliation/jobs",
    tag = "Reconciliation",
    request_body = CreateReconciliationJobRequest,
    responses(
        (status = 201, description = "Job created successfully", body = ApiResponse),
        (status = 400, description = "Invalid request", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn create_reconciliation_job(
    req: web::Json<crate::handlers::types::CreateReconciliationJobRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let reconciliation_service =
        crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());
    let user_id = extract_user_id(&http_req)?;

    // Security check
    crate::utils::check_project_permission(data.get_ref(), user_id, req.project_id)?;

    let matching_rules = if let Some(settings) = &req.settings {
        if let Some(rules) = settings.get("matching_rules") {
            serde_json::from_value(rules.clone()).map_err(|e| {
                AppError::Validation(format!("Invalid matching_rules format: {}", e))
            })?
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
    };

    let new_job = reconciliation_service
        .create_reconciliation_job(user_id, request)
        .await?;

    cache
        .delete(&format!("jobs:project:{}", req.project_id))
        .await
        .unwrap_or_default();
    cache
        .delete(&format!("project:{}", req.project_id))
        .await
        .unwrap_or_default();

    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(new_job),
        message: Some("Reconciliation job created successfully".to_string()),
        error: None,
    }))
}

/// Get reconciliation job
/// 
/// Retrieves a specific reconciliation job by ID.
#[utoipa::path(
    get,
    path = "/api/v1/reconciliation/jobs/{job_id}",
    tag = "Reconciliation",
    params(
        ("job_id" = Uuid, Path, description = "Reconciliation job ID")
    ),
    responses(
        (status = 200, description = "Job retrieved successfully", body = ApiResponse),
        (status = 404, description = "Job not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_reconciliation_job(
    job_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let job_id_val = job_id.into_inner();

    crate::utils::check_job_access(data.get_ref(), user_id, job_id_val)?;

    let reconciliation_service =
        crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());
    let job_status = reconciliation_service
        .get_reconciliation_job_status(job_id_val)
        .await?;

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

    let reconciliation_service =
        crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());
    let project_id =
        crate::utils::authorization::get_project_id_from_job(data.get_ref(), job_id_val)?;

    let updated_job = reconciliation_service
        .update_reconciliation_job(
            job_id_val,
            req.name.clone(),
            req.description.clone(),
            req.confidence_threshold,
            req.settings.clone(),
        )
        .await?;

    cache
        .delete(&format!("job:{}", job_id_val))
        .await
        .unwrap_or_default();
    cache
        .delete(&format!("jobs:project:{}", project_id))
        .await
        .unwrap_or_default();
    cache
        .delete(&format!("project:{}", project_id))
        .await
        .unwrap_or_default();

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

    let project_id =
        crate::utils::authorization::get_project_id_from_job(data.get_ref(), job_id_val).ok();
    let reconciliation_service =
        crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());

    reconciliation_service
        .delete_reconciliation_job(job_id_val)
        .await?;

    if let Some(pid) = project_id {
        let _ = cache.invalidate_job_cache(job_id_val, pid).await;
    }

    Ok(HttpResponse::NoContent().finish())
}

/// Start reconciliation job
pub async fn start_reconciliation_job(
    job_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
    ws_server: web::Data<Addr<WsServer>>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let job_id_val = job_id.into_inner();

    crate::utils::check_job_access(data.get_ref(), user_id, job_id_val)?;

    let project_id =
        crate::utils::authorization::get_project_id_from_job(data.get_ref(), job_id_val).ok();
    let reconciliation_service =
        crate::services::reconciliation::ReconciliationService::new_with_ws(
            data.get_ref().clone(),
            ws_server.get_ref().clone(),
        );

    reconciliation_service
        .start_reconciliation_job(job_id_val)
        .await?;

    if let Some(pid) = project_id {
        let _ = cache.invalidate_job_cache(job_id_val, pid).await;
    }

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

    let project_id =
        crate::utils::authorization::get_project_id_from_job(data.get_ref(), job_id_val).ok();
    let reconciliation_service =
        crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());

    reconciliation_service
        .stop_reconciliation_job(job_id_val)
        .await?;

    if let Some(pid) = project_id {
        let _ = cache.invalidate_job_cache(job_id_val, pid).await;
    }

    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Reconciliation job stopped successfully".to_string()),
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

    let reconciliation_service =
        crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());
    let job_status = reconciliation_service
        .get_reconciliation_job_status(job_id_val)
        .await?;

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
    let reconciliation_service =
        crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());
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
    let reconciliation_service =
        crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());
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

