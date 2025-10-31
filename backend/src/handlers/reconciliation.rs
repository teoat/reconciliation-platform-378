//! Reconciliation job handlers module

use actix_web::{web, HttpRequest, HttpResponse, Result};
use uuid::Uuid;

use crate::errors::AppError;
use crate::database::Database;
use crate::config::Config;
use crate::services::cache::MultiLevelCache;
use crate::handlers::helpers::extract_user_id;
use actix::Addr;
use crate::websocket::WsServer;
use crate::handlers::types::{UpdateReconciliationJobRequest, ApiResponse, ReconciliationResultsQuery};
use actix_files::NamedFile;
use std::path::PathBuf;

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
        .route("/jobs/{job_id}/export", web::post().to(start_export_job))
        .route("/jobs/{job_id}/export/status", web::get().to(get_export_status))
        .route("/jobs/{job_id}/export/download", web::get().to(download_export_file))
        .route("/jobs/{job_id}/progress", web::get().to(get_reconciliation_progress))
        .route("/active", web::get().to(get_active_reconciliation_jobs))
        .route("/queued", web::get().to(get_queued_reconciliation_jobs))
        .route("/sample/onboard", web::post().to(start_sample_onboarding));
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
    ws_server: web::Data<Addr<WsServer>>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let job_id_val = job_id.into_inner();
    
    crate::utils::check_job_access(data.get_ref(), user_id, job_id_val)?;
    
    let project_id = crate::utils::authorization::get_project_id_from_job(data.get_ref(), job_id_val).ok();
    let reconciliation_service = crate::services::reconciliation::ReconciliationService::new_with_ws(
        data.get_ref().clone(),
        ws_server.get_ref().clone(),
    );
    
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

#[derive(serde::Deserialize)]
pub struct StartExportRequest {
    pub format: Option<String>, // csv|json
}

/// Start export job (async): generates a file and caches its path
pub async fn start_export_job(
    job_id: web::Path<Uuid>,
    req: web::Json<StartExportRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let job_id_val = job_id.into_inner();

    crate::utils::check_job_access(data.get_ref(), user_id, job_id_val)?;

    // Prepare export path
    let format = req.format.clone().unwrap_or_else(|| "csv".to_string());
    let mut export_dir = PathBuf::from(&config.upload_path);
    export_dir.push("exports");
    export_dir.push(job_id_val.to_string());
    tokio::fs::create_dir_all(&export_dir).await.map_err(|e| AppError::Internal(format!("Failed to create export dir: {}", e)))?;

    let filename = format!("results_{}.{}", chrono::Utc::now().format("%Y%m%d%H%M%S"), &format);
    let mut export_path = export_dir.clone();
    export_path.push(&filename);

    // Spawn async export task (simple CSV/JSON dump)
    let db_clone = data.get_ref().clone();
    let cache_clone = cache.clone();
    let path_for_task = export_path.clone();
    tokio::spawn(async move {
        let res = crate::services::reconciliation::export_job_results(db_clone, job_id_val, &path_for_task, &format).await;
        if res.is_ok() {
            let link_info = serde_json::json!({
                "ready": true,
                "file_name": filename,
                "download": true
            });
            let _ = cache_clone.get_ref().set(&format!("export:{}", job_id_val), &link_info, Some(std::time::Duration::from_secs(48 * 3600))).await;
        } else {
            let link_info = serde_json::json!({ "ready": false, "error": "export_failed" });
            let _ = cache_clone.get_ref().set(&format!("export:{}", job_id_val), &link_info, Some(std::time::Duration::from_secs(3600))).await;
        }
    });

    Ok(HttpResponse::Accepted().json(ApiResponse::<serde_json::Value> {
        success: true,
        data: Some(serde_json::json!({
            "status": "processing",
            "check": format!("/api/v1/reconciliation/jobs/{}/export/status", job_id_val)
        })),
        message: Some("Export started".to_string()),
        error: None,
    }))
}

/// Get export status and link if ready
pub async fn get_export_status(
    job_id: web::Path<Uuid>,
    _http_req: HttpRequest,
    _data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let job_id_val = job_id.into_inner();
    if let Some(info) = cache.get::<serde_json::Value>(&format!("export:{}", job_id_val)).await? {
        return Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some(serde_json::json!({
                "ready": info.get("ready").and_then(|v| v.as_bool()).unwrap_or(false),
                "download": format!("/api/v1/reconciliation/jobs/{}/export/download", job_id_val),
                "file_name": info.get("file_name"),
            })),
            message: None,
            error: None,
        }));
    }
    Ok(HttpResponse::Ok().json(ApiResponse::<serde_json::Value> {
        success: true,
        data: Some(serde_json::json!({ "ready": false })),
        message: None,
        error: None,
    }))
}

/// Download export file (serves from disk)
pub async fn download_export_file(
    job_id: web::Path<Uuid>,
    _http_req: HttpRequest,
    _data: web::Data<Database>,
    _cache: web::Data<MultiLevelCache>,
    config: web::Data<Config>,
) -> Result<NamedFile, AppError> {
    let job_id_val = job_id.into_inner();
    let export_dir = PathBuf::from(&config.upload_path).join("exports").join(job_id_val.to_string());
    // Choose the most recent file
    let mut entries = tokio::fs::read_dir(&export_dir).await.map_err(|_| AppError::NotFound("Export not found".to_string()))?;
    let mut latest: Option<PathBuf> = None;
    while let Some(e) = entries.next_entry().await.map_err(|e| AppError::Internal(e.to_string()))? {
        let path = e.path();
        if path.is_file() {
            if latest.as_ref().map(|p| p.file_name() < path.file_name()).unwrap_or(true) {
                latest = Some(path);
            }
        }
    }
    let file = latest.ok_or_else(|| AppError::NotFound("Export file not ready".to_string()))?;
    NamedFile::open(file).map_err(|e| AppError::InternalServerError(e.to_string()))
}

#[derive(serde::Deserialize)]
pub struct SampleOnboardRequest {
    pub project_id: Uuid,
    pub confidence_threshold: Option<f64>,
}

/// One-click sample onboarding: seed two sample data sources, create a job, start it
pub async fn start_sample_onboarding(
    req: web::Json<SampleOnboardRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
    ws_server: web::Data<Addr<WsServer>>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    crate::utils::check_project_permission(data.get_ref(), user_id, req.project_id)?;

    // Create two sample data sources pointing to bundled files
    let ds_service = crate::services::data_source::DataSourceService::new(data.get_ref().clone());
    let sample_dir = std::path::Path::new(".");
    let file_a = sample_dir.join("test_data.csv");
    let file_b = sample_dir.join("test_data.json");

    // If JSON not present, fallback to CSV for both
    let file_b_path = if tokio::fs::try_exists(&file_b).await.unwrap_or(false) { file_b } else { file_a.clone() };

    let ds_a = ds_service.create_data_source(
        req.project_id,
        "Sample Source A".to_string(),
        "file".to_string(),
        Some(file_a.to_string_lossy().to_string()),
        None,
        None,
        None,
    ).await?;

    let ds_b = ds_service.create_data_source(
        req.project_id,
        "Sample Source B".to_string(),
        "file".to_string(),
        Some(file_b_path.to_string_lossy().to_string()),
        None,
        None,
        None,
    ).await?;

    // Create reconciliation job
    let recon_service = crate::services::reconciliation::ReconciliationService::new_with_ws(
        data.get_ref().clone(),
        ws_server.get_ref().clone(),
    );
    let job_req = crate::services::reconciliation::CreateReconciliationJobRequest {
        project_id: req.project_id,
        name: format!("Sample Reconciliation {}", chrono::Utc::now().format("%H:%M:%S")),
        description: Some("Auto-created from sample onboarding".to_string()),
        source_a_id: ds_a.id,
        source_b_id: ds_b.id,
        confidence_threshold: req.confidence_threshold.unwrap_or(0.8),
        matching_rules: vec![],
        created_by: user_id,
    };
    let job_status = recon_service.create_reconciliation_job(user_id, job_req).await?;

    // Start job
    recon_service.start_reconciliation_job(job_status.id).await?;

    // Invalidate caches
    let _ = cache.invalidate_project_cache(req.project_id).await;

    Ok(HttpResponse::Accepted().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "job_id": job_status.id,
            "status": "started"
        })),
        message: Some("Sample onboarding started".to_string()),
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
