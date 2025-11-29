//! Reconciliation export handlers

use actix_web::{web, HttpRequest, HttpResponse, Result};
use actix_files::NamedFile;
use std::path::PathBuf;
use uuid::Uuid;

use crate::config::Config;
use crate::database::Database;
use crate::errors::AppError;
use crate::handlers::helpers::extract_user_id;
use crate::handlers::types::ApiResponse;
use crate::services::cache::MultiLevelCache;

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
    tokio::fs::create_dir_all(&export_dir)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to create export dir: {}", e)))?;

    let filename = format!(
        "results_{}.{}",
        chrono::Utc::now().format("%Y%m%d%H%M%S"),
        &format
    );
    let mut export_path = export_dir.clone();
    export_path.push(&filename);

    // Spawn async export task (simple CSV/JSON dump)
    let db_clone = data.get_ref().clone();
    let cache_clone = cache.clone();
    let path_for_task = export_path.clone();
    tokio::spawn(async move {
        let res = crate::services::reconciliation::export_job_results(
            &db_clone,
            job_id_val,
            &path_for_task,
            &format,
        )
        .await;
        if res.is_ok() {
            let link_info = serde_json::json!({
                "ready": true,
                "file_name": filename,
                "download": true
            });
            let _ = cache_clone
                .get_ref()
                .set(
                    &format!("export:{}", job_id_val),
                    &link_info,
                    Some(std::time::Duration::from_secs(48 * 3600)),
                )
                .await;
        } else {
            let link_info = serde_json::json!({ "ready": false, "error": "export_failed" });
            let _ = cache_clone
                .get_ref()
                .set(
                    &format!("export:{}", job_id_val),
                    &link_info,
                    Some(std::time::Duration::from_secs(3600)),
                )
                .await;
        }
    });

    Ok(
        HttpResponse::Accepted().json(ApiResponse::<serde_json::Value> {
            success: true,
            data: Some(serde_json::json!({
                "status": "processing",
                "check": format!("/api/v1/reconciliation/jobs/{}/export/status", job_id_val)
            })),
            message: Some("Export started".to_string()),
            error: None,
        }),
    )
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
    if let Some(info) = cache
        .get::<serde_json::Value>(&format!("export:{}", job_id_val))
        .await?
    {
        return Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some(serde_json::json!({
                "ready": info.get("ready").and_then(|v| v.as_bool()).unwrap_or(false), // Safe default for boolean
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
    let export_dir = PathBuf::from(&config.upload_path)
        .join("exports")
        .join(job_id_val.to_string());
    // Choose the most recent file
    let mut entries = tokio::fs::read_dir(&export_dir)
        .await
        .map_err(|_| AppError::NotFound("Export not found".to_string()))?;
    let mut latest: Option<PathBuf> = None;
    while let Some(e) = entries
        .next_entry()
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?
    {
        let path = e.path();
        if path.is_file()
            && latest
                .as_ref()
                .map(|p| p.file_name() < path.file_name())
                .unwrap_or(true)
        // Safe default: if can't compare, treat as older
        {
            latest = Some(path);
        }
    }
    let file = latest.ok_or_else(|| AppError::NotFound("Export file not ready".to_string()))?;
    NamedFile::open(file).map_err(|e| AppError::InternalServerError(e.to_string()))
}

