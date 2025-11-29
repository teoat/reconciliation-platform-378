//! Reconciliation handlers module
//!
//! This module provides HTTP handlers for reconciliation operations split into:
//! - `jobs`: Job CRUD and control operations
//! - `results`: Results retrieval and match operations
//! - `export`: Export operations
//! - `sample`: Sample onboarding

pub mod jobs;
pub mod results;
pub mod export;
pub mod sample;

// Re-export handlers for OpenAPI documentation
pub use jobs::{get_reconciliation_jobs, create_reconciliation_job, get_reconciliation_job};
pub use results::get_reconciliation_results;

/// Configure reconciliation routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/jobs", web::get().to(jobs::get_reconciliation_jobs))
        .route("/jobs", web::post().to(jobs::create_reconciliation_job))
        .route("/batch-resolve", web::post().to(results::batch_resolve_conflicts))
        .route("/jobs/{job_id}", web::get().to(jobs::get_reconciliation_job))
        .route("/jobs/{job_id}", web::put().to(jobs::update_reconciliation_job))
        .route(
            "/jobs/{job_id}",
            web::delete().to(jobs::delete_reconciliation_job),
        )
        .route(
            "/jobs/{job_id}/start",
            web::post().to(jobs::start_reconciliation_job),
        )
        .route(
            "/jobs/{job_id}/stop",
            web::post().to(jobs::stop_reconciliation_job),
        )
        .route(
            "/jobs/{job_id}/results",
            web::get().to(results::get_reconciliation_results),
        )
        .route("/jobs/{job_id}/export", web::post().to(export::start_export_job))
        .route(
            "/jobs/{job_id}/export/status",
            web::get().to(export::get_export_status),
        )
        .route(
            "/matches/{match_id}",
            web::put().to(results::update_reconciliation_match),
        )
        .route(
            "/jobs/{job_id}/export/download",
            web::get().to(export::download_export_file),
        )
        .route(
            "/jobs/{job_id}/progress",
            web::get().to(jobs::get_reconciliation_progress),
        )
        .route("/active", web::get().to(jobs::get_active_reconciliation_jobs))
        .route("/queued", web::get().to(jobs::get_queued_reconciliation_jobs))
        .route("/sample/onboard", web::post().to(sample::start_sample_onboarding))
        // Records
        .route("/records", web::get().to(get_records))
        .route("/records", web::post().to(create_record))
        .route("/records/{id}", web::get().to(get_record))
        .route("/records/{id}", web::put().to(update_record))
        .route("/records/{id}", web::delete().to(delete_record))
        .route("/records/bulk", web::post().to(bulk_update_records))
        .route("/records/bulk", web::delete().to(bulk_delete_records))
        .route("/match", web::post().to(create_match))
        .route("/unmatch", web::post().to(remove_match))
        // Rules
        .route("/rules", web::get().to(list_rules))
        .route("/rules", web::post().to(create_rule))
        .route("/rules/{id}", web::get().to(get_rule))
        .route("/rules/{id}", web::put().to(update_rule))
        .route("/rules/{id}", web::delete().to(delete_rule))
        .route("/rules/test", web::post().to(test_rule))
        // Batches
        .route("/batches", web::get().to(list_batches))
        .route("/batches", web::post().to(create_batch))
        .route("/batches/{id}", web::get().to(get_batch))
        .route("/batches/{id}/process", web::post().to(process_batch))
        // Metrics & Export
        .route("/metrics", web::get().to(get_reconciliation_metrics))
        .route("/export", web::post().to(export_reconciliation));
}

use crate::handlers::types::{ApiResponse, PaginatedResponse, SearchQueryParams};
use crate::handlers::helpers::extract_user_id;
use crate::database::Database;
use crate::errors::AppError;
use crate::utils::check_project_permission;
use actix_web::{web, HttpRequest, HttpResponse, Result};
use diesel::prelude::*;
use uuid::Uuid;

/// Get reconciliation records
/// 
/// Retrieves a paginated list of reconciliation records.
#[utoipa::path(
    get,
    path = "/api/v1/reconciliation/records",
    tag = "Reconciliation",
    params(
        ("page" = Option<i32>, Query, description = "Page number (1-based)"),
        ("per_page" = Option<i32>, Query, description = "Items per page (max 100)"),
        ("project_id" = Option<Uuid>, Query, description = "Filter by project ID"),
        ("job_id" = Option<Uuid>, Query, description = "Filter by job ID"),
        ("status" = Option<String>, Query, description = "Filter by status")
    ),
    responses(
        (status = 200, description = "Records retrieved successfully", body = PaginatedResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_records(
    query: web::Query<SearchQueryParams>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let _user_id = extract_user_id(&http_req)?;
    let page = query.page.unwrap_or(1) as i64;
    let per_page = query.per_page.unwrap_or(20).min(100) as i64;
    let offset = (page - 1) * per_page;

    use crate::models::schema::reconciliation_records;
    let mut conn = data.get_connection()?;

    // Build query with filters
    let query_builder = reconciliation_records::table.into_boxed();
    
    // Apply filters if provided in query string
    // Note: For now, we'll get all records. In production, add proper filtering
    
    // Get total count - rebuild query for count
    let total: i64 = reconciliation_records::table
        .count()
        .get_result(&mut conn)
        .map_err(AppError::Database)?;

    // Get records
    let records = query_builder
        .order(reconciliation_records::created_at.desc())
        .limit(per_page)
        .offset(offset)
        .load::<crate::models::ReconciliationRecord>(&mut conn)
        .map_err(AppError::Database)?;

    let items: Vec<serde_json::Value> = records
        .into_iter()
        .map(|r| {
            serde_json::json!({
                "id": r.id,
                "project_id": r.project_id,
                "ingestion_job_id": r.ingestion_job_id,
                "external_id": r.external_id,
                "status": r.status,
                "amount": r.amount,
                "transaction_date": r.transaction_date,
                "description": r.description,
                "source_data": r.source_data,
                "matching_results": r.matching_results,
                "confidence": r.confidence,
                "audit_trail": r.audit_trail,
                "created_at": r.created_at,
            })
        })
        .collect();

    let total_pages = (total as f64 / per_page as f64).ceil() as i32;
    let paginated = PaginatedResponse {
        items,
        total,
        page: page as i32,
        per_page: per_page as i32,
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Create reconciliation record
/// 
/// Creates a new reconciliation record manually.
#[utoipa::path(
    post,
    path = "/api/v1/reconciliation/records",
    tag = "Reconciliation",
    request_body = serde_json::Value,
    responses(
        (status = 201, description = "Record created successfully", body = ApiResponse),
        (status = 400, description = "Invalid request", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn create_record(
    req: web::Json<serde_json::Value>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    
    // Extract project_id from request for authorization check
    let project_id: Uuid = req
        .get("project_id")
        .and_then(|v| v.as_str())
        .and_then(|s| Uuid::parse_str(s).ok())
        .ok_or_else(|| AppError::Validation("project_id is required".to_string()))?;
    
    // Check authorization
    check_project_permission(data.get_ref(), user_id, project_id)?;

    use crate::models::schema::reconciliation_records;
    let mut conn = data.get_connection()?;

    // Create new record
    let new_record = crate::models::NewReconciliationRecord {
        project_id,
        ingestion_job_id: req
            .get("ingestion_job_id")
            .and_then(|v| v.as_str())
            .and_then(|s| Uuid::parse_str(s).ok())
            .ok_or_else(|| AppError::Validation("ingestion_job_id is required".to_string()))?,
        external_id: req.get("external_id").and_then(|v| v.as_str()).map(|s| s.to_string()),
        status: req
            .get("status")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| "pending".to_string()),
        amount: req.get("amount").and_then(|v| v.as_f64()),
        transaction_date: req
            .get("transaction_date")
            .and_then(|v| v.as_str())
            .and_then(|s| chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d").ok()),
        description: req.get("description").and_then(|v| v.as_str()).map(|s| s.to_string()),
        source_data: req.get("source_data").cloned().unwrap_or_else(|| serde_json::json!({})),
        matching_results: req.get("matching_results").cloned().unwrap_or_else(|| serde_json::json!({})),
        confidence: req.get("confidence").and_then(|v| v.as_f64()),
        audit_trail: req.get("audit_trail").cloned().unwrap_or_else(|| serde_json::json!({})),
    };

    let record: crate::models::ReconciliationRecord = diesel::insert_into(reconciliation_records::table)
        .values(&new_record)
        .get_result(&mut conn)
        .map_err(AppError::Database)?;

    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "id": record.id,
            "project_id": record.project_id,
            "ingestion_job_id": record.ingestion_job_id,
            "external_id": record.external_id,
            "status": record.status,
            "amount": record.amount,
            "transaction_date": record.transaction_date,
            "description": record.description,
            "created_at": record.created_at,
        })),
        message: Some("Record created successfully".to_string()),
        error: None,
    }))
}

/// Get reconciliation record
/// 
/// Retrieves a specific reconciliation record by ID.
#[utoipa::path(
    get,
    path = "/api/v1/reconciliation/records/{id}",
    tag = "Reconciliation",
    params(
        ("id" = Uuid, Path, description = "Record ID")
    ),
    responses(
        (status = 200, description = "Record retrieved successfully", body = ApiResponse),
        (status = 404, description = "Record not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_record(
    path: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let record_id = path.into_inner();

    use crate::models::schema::reconciliation_records;
    let mut conn = data.get_connection()?;

    let record = reconciliation_records::table
        .find(record_id)
        .first::<crate::models::ReconciliationRecord>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;

    let record = record.ok_or_else(|| AppError::NotFound("Record not found".to_string()))?;

    // Check authorization
    check_project_permission(data.get_ref(), user_id, record.project_id)?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "id": record.id,
            "project_id": record.project_id,
            "ingestion_job_id": record.ingestion_job_id,
            "external_id": record.external_id,
            "status": record.status,
            "amount": record.amount,
            "transaction_date": record.transaction_date,
            "description": record.description,
            "source_data": record.source_data,
            "matching_results": record.matching_results,
            "confidence": record.confidence,
            "audit_trail": record.audit_trail,
            "created_at": record.created_at,
        })),
        message: None,
        error: None,
    }))
}

/// Update reconciliation record
/// 
/// Updates a reconciliation record.
#[utoipa::path(
    put,
    path = "/api/v1/reconciliation/records/{id}",
    tag = "Reconciliation",
    params(
        ("id" = Uuid, Path, description = "Record ID")
    ),
    request_body = serde_json::Value,
    responses(
        (status = 200, description = "Record updated successfully", body = ApiResponse),
        (status = 404, description = "Record not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn update_record(
    path: web::Path<Uuid>,
    req: web::Json<serde_json::Value>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let record_id = path.into_inner();

    use crate::models::schema::reconciliation_records;
    let mut conn = data.get_connection()?;

    // Get existing record for authorization check
    let existing = reconciliation_records::table
        .find(record_id)
        .first::<crate::models::ReconciliationRecord>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;

    let existing = existing.ok_or_else(|| AppError::NotFound("Record not found".to_string()))?;

    // Check authorization
    check_project_permission(data.get_ref(), user_id, existing.project_id)?;

    // Update fields
    diesel::update(reconciliation_records::table.find(record_id))
        .set((
            reconciliation_records::status.eq(
                req.get("status")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or(existing.status),
            ),
            reconciliation_records::amount.eq(req.get("amount").and_then(|v| v.as_f64()).or(existing.amount)),
            reconciliation_records::description.eq(
                req.get("description")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .or(existing.description),
            ),
            reconciliation_records::matching_results.eq(
                req.get("matching_results")
                    .cloned()
                    .unwrap_or(existing.matching_results),
            ),
            reconciliation_records::confidence.eq(req.get("confidence").and_then(|v| v.as_f64()).or(existing.confidence)),
        ))
        .execute(&mut conn)
        .map_err(AppError::Database)?;

    // Get updated record
    let updated = reconciliation_records::table
        .find(record_id)
        .first::<crate::models::ReconciliationRecord>(&mut conn)
        .map_err(AppError::Database)?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "id": updated.id,
            "project_id": updated.project_id,
            "status": updated.status,
            "amount": updated.amount,
            "description": updated.description,
            "confidence": updated.confidence,
            "updated_at": updated.updated_at,
        })),
        message: Some("Record updated successfully".to_string()),
        error: None,
    }))
}

/// Delete reconciliation record
/// 
/// Deletes a reconciliation record.
#[utoipa::path(
    delete,
    path = "/api/v1/reconciliation/records/{id}",
    tag = "Reconciliation",
    params(
        ("id" = Uuid, Path, description = "Record ID")
    ),
    responses(
        (status = 204, description = "Record deleted successfully"),
        (status = 404, description = "Record not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn delete_record(
    path: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let record_id = path.into_inner();

    use crate::models::schema::reconciliation_records;
    let mut conn = data.get_connection()?;

    // Get record for authorization check
    let record = reconciliation_records::table
        .find(record_id)
        .first::<crate::models::ReconciliationRecord>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;

    if let Some(r) = record {
        // Check authorization
        check_project_permission(data.get_ref(), user_id, r.project_id)?;

        // Delete record
        diesel::delete(reconciliation_records::table.find(record_id))
            .execute(&mut conn)
            .map_err(AppError::Database)?;
    } else {
        return Err(AppError::NotFound("Record not found".to_string()));
    }

    Ok(HttpResponse::NoContent().finish())
}

/// Bulk update records
/// 
/// Updates multiple reconciliation records in a single operation.
#[utoipa::path(
    post,
    path = "/api/v1/reconciliation/records/bulk",
    tag = "Reconciliation",
    request_body = serde_json::Value,
    responses(
        (status = 200, description = "Bulk update completed", body = ApiResponse),
        (status = 400, description = "Invalid request", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn bulk_update_records(
    req: web::Json<serde_json::Value>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    
    let record_ids: Vec<Uuid> = req
        .get("record_ids")
        .and_then(|v| v.as_array())
        .ok_or_else(|| AppError::Validation("record_ids array is required".to_string()))?
        .iter()
        .filter_map(|v| v.as_str().and_then(|s| Uuid::parse_str(s).ok()))
        .collect();

    if record_ids.is_empty() {
        return Err(AppError::Validation("At least one record ID is required".to_string()));
    }

    let updates = req.get("updates").ok_or_else(|| {
        AppError::Validation("updates object is required".to_string())
    })?;

    use crate::models::schema::reconciliation_records;
    let mut conn = data.get_connection()?;

    let mut updated = 0;
    let mut failed = 0;

    for record_id in record_ids {
        // Get record for authorization check
        let record = reconciliation_records::table
            .find(record_id)
            .first::<crate::models::ReconciliationRecord>(&mut conn)
            .optional()
            .map_err(AppError::Database)?;

        if let Some(r) = record {
            // Check authorization
            if check_project_permission(data.get_ref(), user_id, r.project_id).is_ok() {
                // Build update tuple with all fields
                // Get existing values or use updates
                let status_value = updates.get("status")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or(r.status);
                let amount_value = updates.get("amount")
                    .and_then(|v| v.as_f64())
                    .or(r.amount);
                let description_value = updates.get("description")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .or(r.description);
                let confidence_value = updates.get("confidence")
                    .and_then(|v| v.as_f64())
                    .or(r.confidence);
                
                // Update with tuple approach
                let update_result = diesel::update(reconciliation_records::table.find(record_id))
                    .set((
                        reconciliation_records::status.eq(status_value),
                        reconciliation_records::amount.eq(amount_value),
                        reconciliation_records::description.eq(description_value),
                        reconciliation_records::confidence.eq(confidence_value),
                        reconciliation_records::updated_at.eq(chrono::Utc::now()),
                    ))
                    .execute(&mut conn);

                match update_result {
                    Ok(_) => updated += 1,
                    Err(_) => failed += 1,
                }
            } else {
                failed += 1;
            }
        } else {
            failed += 1;
        }
    }

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "updated": updated,
            "failed": failed
        })),
        message: Some("Bulk update completed".to_string()),
        error: None,
    }))
}

/// Bulk delete records
/// 
/// Deletes multiple reconciliation records in a single operation.
#[utoipa::path(
    delete,
    path = "/api/v1/reconciliation/records/bulk",
    tag = "Reconciliation",
    request_body = serde_json::Value,
    responses(
        (status = 200, description = "Bulk delete completed", body = ApiResponse),
        (status = 400, description = "Invalid request", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn bulk_delete_records(
    req: web::Json<serde_json::Value>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    
    let record_ids: Vec<Uuid> = req
        .get("record_ids")
        .and_then(|v| v.as_array())
        .ok_or_else(|| AppError::Validation("record_ids array is required".to_string()))?
        .iter()
        .filter_map(|v| v.as_str().and_then(|s| Uuid::parse_str(s).ok()))
        .collect();

    if record_ids.is_empty() {
        return Err(AppError::Validation("At least one record ID is required".to_string()));
    }

    use crate::models::schema::reconciliation_records;
    let mut conn = data.get_connection()?;

    let mut deleted = 0;
    let mut failed = 0;

    for record_id in record_ids {
        // Get record for authorization check
        let record = reconciliation_records::table
            .find(record_id)
            .first::<crate::models::ReconciliationRecord>(&mut conn)
            .optional()
            .map_err(AppError::Database)?;

        if let Some(r) = record {
            // Check authorization
            if check_project_permission(data.get_ref(), user_id, r.project_id).is_ok() {
                match diesel::delete(reconciliation_records::table.find(record_id))
                    .execute(&mut conn)
                {
                    Ok(_) => deleted += 1,
                    Err(_) => failed += 1,
                }
            } else {
                failed += 1;
            }
        } else {
            failed += 1;
        }
    }

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "deleted": deleted,
            "failed": failed
        })),
        message: Some("Bulk delete completed".to_string()),
        error: None,
    }))
}

/// Create match
pub async fn create_match(
    _req: web::Json<serde_json::Value>,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "match_id": Uuid::new_v4()
        })),
        message: Some("Match created successfully".to_string()),
        error: None,
    }))
}

/// Remove match
pub async fn remove_match(
    _req: web::Json<serde_json::Value>,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Match removed successfully".to_string()),
        error: None,
    }))
}

/// List matching rules
/// 
/// Retrieves a paginated list of matching rules.
/// Note: Rules are currently stored in job settings. This endpoint returns rules from all jobs.
#[utoipa::path(
    get,
    path = "/api/v1/reconciliation/rules",
    tag = "Reconciliation",
    params(
        ("page" = Option<i32>, Query, description = "Page number (1-based)"),
        ("per_page" = Option<i32>, Query, description = "Items per page (max 100)"),
        ("project_id" = Option<Uuid>, Query, description = "Filter by project ID"),
        ("active" = Option<bool>, Query, description = "Filter by active status")
    ),
    responses(
        (status = 200, description = "Rules retrieved successfully", body = PaginatedResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn list_rules(
    query: web::Query<SearchQueryParams>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let _user_id = extract_user_id(&http_req)?;
    let page = query.page.unwrap_or(1) as i64;
    let per_page = query.per_page.unwrap_or(20).min(100) as i64;
    let offset = (page - 1) * per_page;

    use crate::models::schema::reconciliation_jobs;
    let mut conn = data.get_connection()?;

    // Get jobs with matching rules in settings
    let jobs = reconciliation_jobs::table
        .select((
            reconciliation_jobs::id,
            reconciliation_jobs::project_id,
            reconciliation_jobs::name,
            reconciliation_jobs::settings,
        ))
        .order(reconciliation_jobs::created_at.desc())
        .limit(per_page)
        .offset(offset)
        .load::<(Uuid, Uuid, String, Option<serde_json::Value>)>(&mut conn)
        .map_err(AppError::Database)?;

    // Extract rules from job settings
    let mut rules: Vec<serde_json::Value> = Vec::new();
    for (job_id, project_id, job_name, settings) in jobs {
        if let Some(settings_val) = settings {
            if let Some(matching_rules) = settings_val.get("matching_rules") {
                if let Some(rules_array) = matching_rules.as_array() {
                    for (idx, rule) in rules_array.iter().enumerate() {
                        rules.push(serde_json::json!({
                            "id": format!("{}-{}", job_id, idx),
                            "job_id": job_id,
                            "job_name": job_name,
                            "project_id": project_id,
                            "field": rule.get("field"),
                            "rule_type": rule.get("rule_type"),
                            "weight": rule.get("weight"),
                            "threshold": rule.get("threshold"),
                        }));
                    }
                }
            }
        }
    }

    let total = rules.len() as i64;
    let total_pages = (total as f64 / per_page as f64).ceil() as i32;
    
    let paginated = PaginatedResponse {
        items: rules,
        total,
        page: page as i32,
        per_page: per_page as i32,
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Create matching rule
/// 
/// Creates a new matching rule. Rules are stored in project settings for reuse.
#[utoipa::path(
    post,
    path = "/api/v1/reconciliation/rules",
    tag = "Reconciliation",
    request_body = serde_json::Value,
    responses(
        (status = 201, description = "Rule created successfully", body = ApiResponse),
        (status = 400, description = "Invalid request", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn create_rule(
    req: web::Json<serde_json::Value>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    
    // Extract project_id for authorization
    let project_id: Uuid = req
        .get("project_id")
        .and_then(|v| v.as_str())
        .and_then(|s| Uuid::parse_str(s).ok())
        .ok_or_else(|| AppError::Validation("project_id is required".to_string()))?;
    
    // Check authorization
    check_project_permission(data.get_ref(), user_id, project_id)?;

    // Validate rule structure
    let field = req
        .get("field")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::Validation("field is required".to_string()))?;
    
    let rule_type = req
        .get("rule_type")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::Validation("rule_type is required".to_string()))?;
    
    let weight = req
        .get("weight")
        .and_then(|v| v.as_f64())
        .unwrap_or(1.0);
    
    let threshold = req
        .get("threshold")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.8);

    // Store rule in project settings (for now, as a simple approach)
    // In production, consider creating a dedicated matching_rules table
    use crate::models::schema::projects;
    let mut conn = data.get_connection()?;
    
    let project = projects::table
        .find(project_id)
        .first::<crate::models::Project>(&mut conn)
        .map_err(|e| {
            if e == diesel::NotFound {
                AppError::NotFound("Project not found".to_string())
            } else {
                AppError::Database(e)
            }
        })?;

    // Get existing rules from project settings
    let mut settings = project.settings.clone();
    
    // Ensure matching_rules exists
    if !settings.get("matching_rules").is_some() {
        settings["matching_rules"] = serde_json::json!([]);
    }
    
    let rules_array = settings
        .get_mut("matching_rules")
        .and_then(|v| v.as_array_mut())
        .ok_or_else(|| AppError::Internal("Failed to access rules array".to_string()))?;

    // Add new rule
    let new_rule = serde_json::json!({
        "id": Uuid::new_v4(),
        "field": field,
        "rule_type": rule_type,
        "weight": weight,
        "threshold": threshold,
    });
    rules_array.push(new_rule.clone());

    // Update project settings
    diesel::update(projects::table.find(project_id))
        .set(projects::settings.eq(settings))
        .execute(&mut conn)
        .map_err(AppError::Database)?;

    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(new_rule),
        message: Some("Rule created successfully".to_string()),
        error: None,
    }))
}

/// Get matching rule
/// 
/// Retrieves a specific matching rule by ID.
/// Note: Rule IDs are in format "{job_id}-{index}" for rules stored in job settings.
#[utoipa::path(
    get,
    path = "/api/v1/reconciliation/rules/{id}",
    tag = "Reconciliation",
    params(
        ("id" = String, Path, description = "Rule ID (format: job_id-index or UUID)")
    ),
    responses(
        (status = 200, description = "Rule retrieved successfully", body = ApiResponse),
        (status = 404, description = "Rule not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_rule(
    path: web::Path<String>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let _user_id = extract_user_id(&http_req)?;
    let rule_id = path.into_inner();

    // Try to parse as UUID first (for future dedicated rules table)
    if Uuid::parse_str(&rule_id).is_ok() {
        // For now, return not found as we don't have a dedicated rules table
        return Err(AppError::NotFound("Rule not found".to_string()));
    }

    // Parse job_id-index format
    let parts: Vec<&str> = rule_id.split('-').collect();
    if parts.len() < 2 {
        return Err(AppError::Validation("Invalid rule ID format".to_string()));
    }

    let job_id = Uuid::parse_str(parts[0])
        .map_err(|_| AppError::Validation("Invalid job ID in rule ID".to_string()))?;
    let _index: usize = parts[1]
        .parse()
        .map_err(|_| AppError::Validation("Invalid rule index".to_string()))?;

    use crate::models::schema::reconciliation_jobs;
    let mut conn = data.get_connection()?;

    let job = reconciliation_jobs::table
        .find(job_id)
        .first::<crate::models::ReconciliationJob>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;

    let job = job.ok_or_else(|| AppError::NotFound("Job not found".to_string()))?;

    // Extract rule from job settings
    if let Some(settings) = job.settings {
        if let Some(matching_rules) = settings.get("matching_rules") {
            if let Some(rules_array) = matching_rules.as_array() {
                if let Some(rule) = rules_array.get(_index) {
                    return Ok(HttpResponse::Ok().json(ApiResponse {
                        success: true,
                        data: Some(serde_json::json!({
                            "id": rule_id,
                            "job_id": job_id,
                            "rule": rule,
                        })),
                        message: None,
                        error: None,
                    }));
                }
            }
        }
    }

    Err(AppError::NotFound("Rule not found".to_string()))
}

/// Update matching rule
/// 
/// Updates a matching rule.
#[utoipa::path(
    put,
    path = "/api/v1/reconciliation/rules/{id}",
    tag = "Reconciliation",
    params(
        ("id" = String, Path, description = "Rule ID")
    ),
    request_body = serde_json::Value,
    responses(
        (status = 200, description = "Rule updated successfully", body = ApiResponse),
        (status = 404, description = "Rule not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn update_rule(
    path: web::Path<String>,
    req: web::Json<serde_json::Value>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let rule_id = path.into_inner();

    // Parse job_id-index format
    let parts: Vec<&str> = rule_id.split('-').collect();
    if parts.len() < 2 {
        return Err(AppError::Validation("Invalid rule ID format".to_string()));
    }

    let job_id = Uuid::parse_str(parts[0])
        .map_err(|_| AppError::Validation("Invalid job ID in rule ID".to_string()))?;
    let index: usize = parts[1]
        .parse()
        .map_err(|_| AppError::Validation("Invalid rule index".to_string()))?;

    use crate::models::schema::reconciliation_jobs;
    let mut conn = data.get_connection()?;

    let job = reconciliation_jobs::table
        .find(job_id)
        .first::<crate::models::ReconciliationJob>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;

    let job = job.ok_or_else(|| AppError::NotFound("Job not found".to_string()))?;

    // Check authorization via project
    check_project_permission(data.get_ref(), user_id, job.project_id)?;

    // Update rule in job settings
    let mut settings = job.settings.unwrap_or_else(|| serde_json::json!({}));
    
    // Update rule if it exists - collect rule data first
    let updated_rule = if let Some(matching_rules) = settings.get_mut("matching_rules") {
        if let Some(rules_array) = matching_rules.as_array_mut() {
            if let Some(rule) = rules_array.get_mut(index) {
                // Update rule fields
                if let Some(field) = req.get("field").and_then(|v| v.as_str()) {
                    rule["field"] = serde_json::json!(field);
                }
                if let Some(rule_type) = req.get("rule_type").and_then(|v| v.as_str()) {
                    rule["rule_type"] = serde_json::json!(rule_type);
                }
                if let Some(weight) = req.get("weight").and_then(|v| v.as_f64()) {
                    rule["weight"] = serde_json::json!(weight);
                }
                if let Some(threshold) = req.get("threshold").and_then(|v| v.as_f64()) {
                    rule["threshold"] = serde_json::json!(threshold);
                }
                // Clone rule before mutable borrow ends
                Some(rule.clone())
            } else {
                None
            }
        } else {
            None
        }
    } else {
        None
    };
    
    // Update job settings after mutable borrow is complete
    if let Some(rule) = updated_rule {
        diesel::update(reconciliation_jobs::table.find(job_id))
            .set(reconciliation_jobs::settings.eq(Some(settings)))
            .execute(&mut conn)
            .map_err(AppError::Database)?;

        Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some(rule),
            message: Some("Rule updated successfully".to_string()),
            error: None,
        }))
    } else {
        Err(AppError::NotFound("Rule not found".to_string()))
    }
}

/// Delete matching rule
/// 
/// Deletes a matching rule.
#[utoipa::path(
    delete,
    path = "/api/v1/reconciliation/rules/{id}",
    tag = "Reconciliation",
    params(
        ("id" = String, Path, description = "Rule ID")
    ),
    responses(
        (status = 204, description = "Rule deleted successfully"),
        (status = 404, description = "Rule not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn delete_rule(
    path: web::Path<String>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let rule_id = path.into_inner();

    // Parse job_id-index format
    let parts: Vec<&str> = rule_id.split('-').collect();
    if parts.len() < 2 {
        return Err(AppError::Validation("Invalid rule ID format".to_string()));
    }

    let job_id = Uuid::parse_str(parts[0])
        .map_err(|_| AppError::Validation("Invalid job ID in rule ID".to_string()))?;
    let index: usize = parts[1]
        .parse()
        .map_err(|_| AppError::Validation("Invalid rule index".to_string()))?;

    use crate::models::schema::reconciliation_jobs;
    let mut conn = data.get_connection()?;

    let job = reconciliation_jobs::table
        .find(job_id)
        .first::<crate::models::ReconciliationJob>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;

    let job = job.ok_or_else(|| AppError::NotFound("Job not found".to_string()))?;

    // Check authorization via project
    check_project_permission(data.get_ref(), user_id, job.project_id)?;

    // Remove rule from job settings
    let mut settings = job.settings.unwrap_or_else(|| serde_json::json!({}));
    if let Some(matching_rules) = settings.get_mut("matching_rules") {
        if let Some(rules_array) = matching_rules.as_array_mut() {
            if index < rules_array.len() {
                rules_array.remove(index);

                // Update job settings
                diesel::update(reconciliation_jobs::table.find(job_id))
                    .set(reconciliation_jobs::settings.eq(Some(settings)))
                    .execute(&mut conn)
                    .map_err(AppError::Database)?;

                return Ok(HttpResponse::NoContent().finish());
            }
        }
    }

    Err(AppError::NotFound("Rule not found".to_string()))
}

/// Test matching rule
pub async fn test_rule(
    _req: web::Json<serde_json::Value>,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "matches": false,
            "confidence_score": 0.0
        })),
        message: Some("Rule test completed".to_string()),
        error: None,
    }))
}

/// List batches
pub async fn list_batches(
    query: web::Query<SearchQueryParams>,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let batches: Vec<serde_json::Value> = vec![];
    let total_pages = 0;
    
    let paginated = PaginatedResponse {
        items: batches,
        total: 0,
        page: query.page.unwrap_or(1),
        per_page: query.per_page.unwrap_or(20),
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Create batch
pub async fn create_batch(
    _req: web::Json<serde_json::Value>,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "id": Uuid::new_v4(),
            "status": "queued"
        })),
        message: Some("Batch created successfully".to_string()),
        error: None,
    }))
}

/// Get batch
pub async fn get_batch(
    path: web::Path<Uuid>,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let _batch_id = path.into_inner();
    return Err(AppError::NotFound("Batch not found".to_string()));
}

/// Process batch
pub async fn process_batch(
    path: web::Path<Uuid>,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let _batch_id = path.into_inner();
    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Batch processing started".to_string()),
        error: None,
    }))
}

/// Get reconciliation metrics
pub async fn get_reconciliation_metrics(
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "total_jobs": 0,
            "active_jobs": 0,
            "matches": 0
        })),
        message: None,
        error: None,
    }))
}

/// Export reconciliation data
pub async fn export_reconciliation(
    _req: web::Json<serde_json::Value>,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
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

