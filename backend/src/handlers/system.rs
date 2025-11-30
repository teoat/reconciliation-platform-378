//! System handlers module

use actix_web::{web, HttpResponse, Result};

use crate::errors::AppError;
use crate::database::Database;
use crate::handlers::types::{ApiResponse, SearchQueryParams};

/// Configure system routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/status", web::get().to(system_status))
        .route("/metrics", web::get().to(get_metrics))
        .route("/config", web::get().to(get_config))
        .route("/logs", web::get().to(get_logs))
        .route("/backup", web::post().to(create_backup))
        .route("/restore", web::post().to(restore_backup));
}

/// System status endpoint (legacy - use /health instead)
pub async fn system_status() -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "status": "operational",
        "uptime": "0s",
        "version": env!("CARGO_PKG_VERSION")
    })))
}

/// Get system metrics
/// 
/// Returns comprehensive system performance metrics.
#[utoipa::path(
    get,
    path = "/api/v1/system/metrics",
    tag = "System",
    responses(
        (status = 200, description = "System metrics retrieved successfully", body = ApiResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_metrics(
    _data: web::Data<Database>,
    _config: web::Data<crate::config::Config>,
) -> Result<HttpResponse, AppError> {
    // Note: Parameters are intentionally unused - metrics come from MonitoringService
    use crate::services::monitoring::MonitoringService;
    
    let monitoring_service = MonitoringService::new();
    
    // Get comprehensive performance metrics
    let metrics = monitoring_service.get_system_metrics().await?;
    
    Ok(HttpResponse::Ok()
        .content_type("application/json")
        .json(ApiResponse {
            success: true,
            data: Some(metrics),
            message: None,
            error: None,
        }))
}

/// Get system configuration
pub async fn get_config(
    _data: web::Data<Database>,
    config: web::Data<crate::config::Config>,
) -> Result<HttpResponse, AppError> {
    // Return safe configuration (no secrets)
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "version": env!("CARGO_PKG_VERSION"),
            "host": config.host,
            "port": config.port,
        })),
        message: None,
        error: None,
    }))
}

/// Get system logs
pub async fn get_logs(
    query: web::Query<SearchQueryParams>,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(20);
    let offset = (page - 1) * per_page;
    
    // Query audit logs from database
    let logs_query = r#"
        SELECT id, user_id, action, resource_type, resource_id, 
               ip_address, user_agent, created_at, details
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
    "#;
    
    let rows = data.pool.query(logs_query, &[&(per_page as i64), &(offset as i64)])
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to fetch logs: {}", e)))?;
    
    let logs: Vec<serde_json::Value> = rows.iter().map(|row| {
        serde_json::json!({
            "id": row.get::<_, uuid::Uuid>("id"),
            "user_id": row.get::<_, Option<uuid::Uuid>>("user_id"),
            "action": row.get::<_, String>("action"),
            "resource_type": row.get::<_, Option<String>>("resource_type"),
            "resource_id": row.get::<_, Option<uuid::Uuid>>("resource_id"),
            "ip_address": row.get::<_, Option<String>>("ip_address"),
            "user_agent": row.get::<_, Option<String>>("user_agent"),
            "created_at": row.get::<_, chrono::NaiveDateTime>("created_at"),
            "details": row.get::<_, Option<serde_json::Value>>("details")
        })
    }).collect();
    
    // Get total count
    let count_query = "SELECT COUNT(*) as count FROM audit_logs";
    let count_row = data.pool.query_one(count_query, &[])
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to count logs: {}", e)))?;
    let total: i64 = count_row.get("count");
    let total_pages = ((total as f64) / (per_page as f64)).ceil() as i32;
    
    let paginated = crate::handlers::types::PaginatedResponse {
        items: logs,
        total: total as i32,
        page,
        per_page,
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Create system backup
pub async fn create_backup(
    _req: web::Json<serde_json::Value>,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    use std::process::Command;
    use chrono::Utc;
    
    let backup_id = uuid::Uuid::new_v4();
    let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
    let backup_file = format!("backup_{}_{}.sql", timestamp, backup_id);
    let backup_path = format!("./backups/{}", backup_file);
    
    // Ensure backups directory exists
    std::fs::create_dir_all("./backups")
        .map_err(|e| AppError::InternalServerError(format!("Failed to create backups directory: {}", e)))?;
    
    // Get database URL from environment or config
    let db_url = std::env::var("DATABASE_URL")
        .map_err(|_| AppError::InternalServerError("DATABASE_URL not set".to_string()))?;
    
    // Execute pg_dump (async execution in production would use tokio::spawn)
    let output = Command::new("pg_dump")
        .arg(&db_url)
        .arg("-f")
        .arg(&backup_path)
        .output()
        .map_err(|e| AppError::InternalServerError(format!("Backup failed: {}", e)))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::InternalServerError(format!("Backup failed: {}", stderr)));
    }
    
    // Record backup in database
    let insert_query = r#"
        INSERT INTO backups (id, filename, file_path, status, created_at)
        VALUES ($1, $2, $3, 'completed', NOW())
    "#;
    data.pool.execute(insert_query, &[&backup_id, &backup_file, &backup_path])
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to record backup: {}", e)))?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "backup_id": backup_id,
            "filename": backup_file,
            "status": "completed"
        })),
        message: Some("Backup created successfully".to_string()),
        error: None,
    }))
}

/// Restore from backup
pub async fn restore_backup(
    req: web::Json<serde_json::Value>,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    use std::process::Command;
    
    let backup_id_str = req.get("backup_id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::BadRequest("backup_id is required".to_string()))?;
    
    let backup_id = uuid::Uuid::parse_str(backup_id_str)
        .map_err(|_| AppError::BadRequest("Invalid backup_id format".to_string()))?;
    
    // Get backup file path from database
    let query = "SELECT file_path, status FROM backups WHERE id = $1";
    let row = data.pool.query_one(query, &[&backup_id])
        .await
        .map_err(|_| AppError::NotFound("Backup not found".to_string()))?;
    
    let file_path: String = row.get("file_path");
    let status: String = row.get("status");
    
    if status != "completed" {
        return Err(AppError::BadRequest(format!("Backup status is '{}', cannot restore", status)));
    }
    
    // Verify backup file exists
    if !std::path::Path::new(&file_path).exists() {
        return Err(AppError::NotFound("Backup file not found".to_string()));
    }
    
    // Get database URL
    let db_url = std::env::var("DATABASE_URL")
        .map_err(|_| AppError::InternalServerError("DATABASE_URL not set".to_string()))?;
    
    // Execute psql restore
    let output = Command::new("psql")
        .arg(&db_url)
        .arg("-f")
        .arg(&file_path)
        .output()
        .map_err(|e| AppError::InternalServerError(format!("Restore failed: {}", e)))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::InternalServerError(format!("Restore failed: {}", stderr)));
    }
    
    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Database restored successfully".to_string()),
        error: None,
    }))
}
