//! Sample onboarding handlers

use actix_web::{web, HttpRequest, HttpResponse, Result};
use uuid::Uuid;

use crate::config::Config;
use crate::database::Database;
use crate::errors::AppError;
use crate::handlers::helpers::extract_user_id;
use crate::handlers::types::ApiResponse;
use crate::services::cache::MultiLevelCache;
use crate::websocket::WsServer;
use actix::Addr;

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
    let file_b_path = match tokio::fs::try_exists(&file_b).await {
        Ok(true) => file_b,
        Ok(false) | Err(_) => file_a.clone(),
    };

    use crate::services::data_source_config::CreateDataSourceConfig;
    let config_a = CreateDataSourceConfig {
        project_id: req.project_id,
        name: "Sample Source A".to_string(),
        source_type: "file".to_string(),
        file_path: Some(file_a.to_string_lossy().to_string()),
        file_size: None,
        file_hash: None,
        schema: None,
    };
    let ds_a = ds_service
        .create_data_source(config_a)
        .await?;

    let config_b = CreateDataSourceConfig {
        project_id: req.project_id,
        name: "Sample Source B".to_string(),
        source_type: "file".to_string(),
        file_path: Some(file_b_path.to_string_lossy().to_string()),
        file_size: None,
        file_hash: None,
        schema: None,
    };
    let ds_b = ds_service
        .create_data_source(config_b)
        .await?;

    // Create reconciliation job
    let recon_service = crate::services::reconciliation::ReconciliationService::new_with_ws(
        data.get_ref().clone(),
        ws_server.get_ref().clone(),
    );
    let job_req = crate::services::reconciliation::CreateReconciliationJobRequest {
        project_id: req.project_id,
        name: format!(
            "Sample Reconciliation {}",
            chrono::Utc::now().format("%H:%M:%S")
        ),
        description: Some("Auto-created from sample onboarding".to_string()),
        source_a_id: ds_a.id,
        source_b_id: ds_b.id,
        confidence_threshold: req.confidence_threshold.unwrap_or(0.8),
        matching_rules: vec![],
    };
    let job_status = recon_service
        .create_reconciliation_job(user_id, job_req)
        .await?;

    // Start job
    recon_service
        .start_reconciliation_job(job_status.id)
        .await?;

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

