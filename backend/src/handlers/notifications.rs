//! Notifications handlers module

use actix_web::{web, HttpRequest, HttpResponse, Result};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use uuid::Uuid;

use crate::database::Database;
use crate::errors::AppError;
use crate::handlers::helpers::extract_user_id;
use crate::handlers::types::{ApiResponse, PaginatedResponse, SearchQueryParams};
use crate::services::cache::MultiLevelCache;

/// Configure notification routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(list_notifications))
        .route("/{id}", web::get().to(get_notification))
        .route("/{id}/read", web::post().to(mark_read))
        .route("/{id}/unread", web::post().to(mark_unread))
        .route("/{id}", web::delete().to(delete_notification))
        .route("/bulk/read", web::post().to(bulk_mark_read))
        .route("/bulk/delete", web::post().to(bulk_delete))
        .route("/preferences", web::get().to(get_preferences))
        .route("/preferences", web::put().to(update_preferences))
        .route("/subscribe", web::post().to(subscribe))
        .route("/unsubscribe", web::post().to(unsubscribe));
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Notification {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub message: String,
    pub notification_type: String,
    pub read: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub read_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct BulkOperationRequest {
    pub notification_ids: Vec<Uuid>,
}

// Use the model from crate::models::notification instead

/// List notifications
/// 
/// Retrieves a paginated list of notifications for the authenticated user.
#[utoipa::path(
    get,
    path = "/api/v1/notifications",
    tag = "Notifications",
    params(
        ("page" = Option<i32>, Query, description = "Page number (1-based)"),
        ("per_page" = Option<i32>, Query, description = "Items per page (max 100)"),
        ("read" = Option<bool>, Query, description = "Filter by read status")
    ),
    responses(
        (status = 200, description = "Notifications retrieved successfully", body = PaginatedResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn list_notifications(
    query: web::Query<SearchQueryParams>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let page = query.page.unwrap_or(1) as i64;
    let per_page = query.per_page.unwrap_or(20).min(100) as i64;
    let offset = (page - 1) * per_page;

    // Try cache first
    let cache_key = format!(
        "notifications:{}:page:{}:per_page:{}",
        user_id,
        page,
        per_page
    );
    if let Ok(Some(cached)) = cache.get::<serde_json::Value>(&cache_key).await {
        return Ok(HttpResponse::Ok().json(cached));
    }

    use crate::models::schema::user_notification_history;
    let mut conn = data.get_connection()?;

    // Build query
    let query_builder = user_notification_history::table
        .filter(user_notification_history::user_id.eq(user_id))
        .into_boxed();

    // Filter by read status if provided in query string
    // Note: SearchQueryParams doesn't have a 'read' field, so we'll check query string directly
    // For now, we'll get all notifications. In production, add proper filtering via query params

    // Get total count - rebuild query for count
    let total: i64 = user_notification_history::table
        .filter(user_notification_history::user_id.eq(user_id))
        .count()
        .get_result(&mut conn)
        .map_err(AppError::Database)?;

    // Get notifications
    let notifications = query_builder
        .order(user_notification_history::created_at.desc())
        .limit(per_page)
        .offset(offset)
        .load::<(Uuid, Uuid, String, String, String, String, String, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>, Option<chrono::DateTime<chrono::Utc>>, Option<serde_json::Value>, chrono::DateTime<chrono::Utc>)>(&mut conn)
        .map_err(AppError::Database)?;

    let items: Vec<serde_json::Value> = notifications
        .into_iter()
        .map(|(id, user_id, notification_type, title, message, _channel, status, sent_at, delivered_at, read_at, metadata, created_at)| {
            serde_json::json!({
                "id": id,
                "user_id": user_id,
                "title": title,
                "message": message,
                "notification_type": notification_type,
                "read": read_at.is_some(),
                "status": status,
                "created_at": created_at,
                "read_at": read_at,
                "sent_at": sent_at,
                "delivered_at": delivered_at,
                "metadata": metadata,
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

    // Cache for 1 minute
    let response_json = serde_json::to_value(&paginated)?;
    let _ = cache
        .set(&cache_key, &response_json, Some(Duration::from_secs(60)))
        .await;

    Ok(HttpResponse::Ok().json(paginated))
}

/// Get notification
/// 
/// Retrieves a specific notification by ID.
#[utoipa::path(
    get,
    path = "/api/v1/notifications/{id}",
    tag = "Notifications",
    params(
        ("id" = Uuid, Path, description = "Notification ID")
    ),
    responses(
        (status = 200, description = "Notification retrieved successfully", body = ApiResponse),
        (status = 404, description = "Notification not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_notification(
    path: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let notification_id = path.into_inner();
    let user_id = extract_user_id(&http_req)?;
    
    use crate::models::schema::user_notification_history;
    let mut conn = data.get_connection()?;

    let notification = user_notification_history::table
        .filter(user_notification_history::id.eq(notification_id))
        .filter(user_notification_history::user_id.eq(user_id))
        .first::<(Uuid, Uuid, String, String, String, String, String, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>, Option<chrono::DateTime<chrono::Utc>>, Option<serde_json::Value>, chrono::DateTime<chrono::Utc>)>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;

    let (id, user_id, notification_type, title, message, _channel, status, sent_at, delivered_at, read_at, metadata, created_at) = notification
        .ok_or_else(|| AppError::NotFound("Notification not found".to_string()))?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "id": id,
            "user_id": user_id,
            "title": title,
            "message": message,
            "notification_type": notification_type,
            "read": read_at.is_some(),
            "status": status,
            "created_at": created_at,
            "read_at": read_at,
            "sent_at": sent_at,
            "delivered_at": delivered_at,
            "metadata": metadata,
        })),
        message: None,
        error: None,
    }))
}

/// Mark notification as read
/// 
/// Marks a notification as read by setting the read_at timestamp.
#[utoipa::path(
    post,
    path = "/api/v1/notifications/{id}/read",
    tag = "Notifications",
    params(
        ("id" = Uuid, Path, description = "Notification ID")
    ),
    responses(
        (status = 200, description = "Notification marked as read", body = ApiResponse),
        (status = 404, description = "Notification not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn mark_read(
    path: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let notification_id = path.into_inner();
    let user_id = extract_user_id(&http_req)?;
    
    use crate::models::schema::user_notification_history;
    let mut conn = data.get_connection()?;

    // Verify notification belongs to user
    let exists = user_notification_history::table
        .filter(user_notification_history::id.eq(notification_id))
        .filter(user_notification_history::user_id.eq(user_id))
        .count()
        .get_result::<i64>(&mut conn)
        .map_err(AppError::Database)?;

    if exists == 0 {
        return Err(AppError::NotFound("Notification not found".to_string()));
    }

    // Update read_at
    diesel::update(
        user_notification_history::table
            .filter(user_notification_history::id.eq(notification_id))
            .filter(user_notification_history::user_id.eq(user_id))
    )
    .set(user_notification_history::read_at.eq(Some(chrono::Utc::now())))
    .execute(&mut conn)
    .map_err(AppError::Database)?;

    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Notification marked as read".to_string()),
        error: None,
    }))
}

/// Mark notification as unread
/// 
/// Marks a notification as unread by clearing the read_at timestamp.
#[utoipa::path(
    post,
    path = "/api/v1/notifications/{id}/unread",
    tag = "Notifications",
    params(
        ("id" = Uuid, Path, description = "Notification ID")
    ),
    responses(
        (status = 200, description = "Notification marked as unread", body = ApiResponse),
        (status = 404, description = "Notification not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn mark_unread(
    path: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let notification_id = path.into_inner();
    let user_id = extract_user_id(&http_req)?;
    
    use crate::models::schema::user_notification_history;
    let mut conn = data.get_connection()?;

    // Verify notification belongs to user
    let exists = user_notification_history::table
        .filter(user_notification_history::id.eq(notification_id))
        .filter(user_notification_history::user_id.eq(user_id))
        .count()
        .get_result::<i64>(&mut conn)
        .map_err(AppError::Database)?;

    if exists == 0 {
        return Err(AppError::NotFound("Notification not found".to_string()));
    }

    // Clear read_at
    diesel::update(
        user_notification_history::table
            .filter(user_notification_history::id.eq(notification_id))
            .filter(user_notification_history::user_id.eq(user_id))
    )
    .set(user_notification_history::read_at.eq(None::<chrono::DateTime<chrono::Utc>>))
    .execute(&mut conn)
    .map_err(AppError::Database)?;

    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Notification marked as unread".to_string()),
        error: None,
    }))
}

/// Delete notification
/// 
/// Deletes a notification.
#[utoipa::path(
    delete,
    path = "/api/v1/notifications/{id}",
    tag = "Notifications",
    params(
        ("id" = Uuid, Path, description = "Notification ID")
    ),
    responses(
        (status = 204, description = "Notification deleted successfully"),
        (status = 404, description = "Notification not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn delete_notification(
    path: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let notification_id = path.into_inner();
    let user_id = extract_user_id(&http_req)?;
    
    use crate::models::schema::user_notification_history;
    let mut conn = data.get_connection()?;

    // Delete notification (verify ownership)
    let deleted = diesel::delete(
        user_notification_history::table
            .filter(user_notification_history::id.eq(notification_id))
            .filter(user_notification_history::user_id.eq(user_id))
    )
    .execute(&mut conn)
    .map_err(AppError::Database)?;

    if deleted == 0 {
        return Err(AppError::NotFound("Notification not found".to_string()));
    }

    Ok(HttpResponse::NoContent().finish())
}

/// Bulk mark as read
/// 
/// Marks multiple notifications as read.
#[utoipa::path(
    post,
    path = "/api/v1/notifications/bulk/read",
    tag = "Notifications",
    request_body = BulkOperationRequest,
    responses(
        (status = 200, description = "Notifications marked as read", body = ApiResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn bulk_mark_read(
    req: web::Json<BulkOperationRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    
    if req.notification_ids.is_empty() {
        return Err(AppError::Validation("At least one notification ID is required".to_string()));
    }
    
    use crate::models::schema::user_notification_history;
    let mut conn = data.get_connection()?;

    // Bulk update read_at
    let updated = diesel::update(
        user_notification_history::table
            .filter(user_notification_history::user_id.eq(user_id))
            .filter(user_notification_history::id.eq_any(&req.notification_ids))
    )
    .set(user_notification_history::read_at.eq(Some(chrono::Utc::now())))
    .execute(&mut conn)
    .map_err(AppError::Database)?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "updated": updated
        })),
        message: Some("Notifications marked as read".to_string()),
        error: None,
    }))
}

/// Bulk delete
/// 
/// Deletes multiple notifications.
#[utoipa::path(
    post,
    path = "/api/v1/notifications/bulk/delete",
    tag = "Notifications",
    request_body = BulkOperationRequest,
    responses(
        (status = 200, description = "Notifications deleted", body = ApiResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn bulk_delete(
    req: web::Json<BulkOperationRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    
    if req.notification_ids.is_empty() {
        return Err(AppError::Validation("At least one notification ID is required".to_string()));
    }
    
    use crate::models::schema::user_notification_history;
    let mut conn = data.get_connection()?;

    // Bulk delete
    let deleted = diesel::delete(
        user_notification_history::table
            .filter(user_notification_history::user_id.eq(user_id))
            .filter(user_notification_history::id.eq_any(&req.notification_ids))
    )
    .execute(&mut conn)
    .map_err(AppError::Database)?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "deleted": deleted
        })),
        message: Some("Notifications deleted".to_string()),
        error: None,
    }))
}

/// Get notification preferences
/// 
/// Retrieves notification preferences for the authenticated user.
#[utoipa::path(
    get,
    path = "/api/v1/notifications/preferences",
    tag = "Notifications",
    responses(
        (status = 200, description = "Preferences retrieved successfully", body = ApiResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_preferences(
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    
    use crate::models::schema::notification_preferences;
    let mut conn = data.get_connection()?;

    let preferences = notification_preferences::table
        .filter(notification_preferences::user_id.eq(user_id))
        .first::<crate::models::notification::NotificationPreferences>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;

    let prefs = if let Some(p) = preferences {
        p
    } else {
        // Create default preferences if none exist
        let new_prefs = crate::models::notification::NewNotificationPreferences {
            user_id,
            email: true,
            push: true,
            reconciliation_complete: true,
            job_failed: true,
            project_updated: false,
        };
        diesel::insert_into(notification_preferences::table)
            .values(&new_prefs)
            .get_result(&mut conn)
            .map_err(AppError::Database)?
    };
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "email": prefs.email,
            "push": prefs.push,
            "reconciliation_complete": prefs.reconciliation_complete,
            "job_failed": prefs.job_failed,
            "project_updated": prefs.project_updated,
        })),
        message: None,
        error: None,
    }))
}

/// Update notification preferences
/// 
/// Updates notification preferences for the authenticated user.
#[utoipa::path(
    put,
    path = "/api/v1/notifications/preferences",
    tag = "Notifications",
    request_body = serde_json::Value,
    responses(
        (status = 200, description = "Preferences updated successfully", body = ApiResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn update_preferences(
    req: web::Json<serde_json::Value>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    
    use crate::models::schema::notification_preferences;
    let mut conn = data.get_connection()?;

    // Check if preferences exist
    let exists = notification_preferences::table
        .filter(notification_preferences::user_id.eq(user_id))
        .count()
        .get_result::<i64>(&mut conn)
        .map_err(AppError::Database)?;

    let update_prefs = crate::models::notification::UpdateNotificationPreferences {
        email: req.get("email").and_then(|v| v.as_bool()),
        push: req.get("push").and_then(|v| v.as_bool()),
        reconciliation_complete: req.get("reconciliation_complete").and_then(|v| v.as_bool()),
        job_failed: req.get("job_failed").and_then(|v| v.as_bool()),
        project_updated: req.get("project_updated").and_then(|v| v.as_bool()),
    };

    let updated = if exists > 0 {
        // Update existing
        diesel::update(
            notification_preferences::table
                .filter(notification_preferences::user_id.eq(user_id))
        )
        .set(&update_prefs)
        .get_result::<crate::models::notification::NotificationPreferences>(&mut conn)
        .map_err(AppError::Database)?
    } else {
        // Create new
        let new_prefs = crate::models::notification::NewNotificationPreferences {
            user_id,
            email: update_prefs.email.unwrap_or(true),
            push: update_prefs.push.unwrap_or(true),
            reconciliation_complete: update_prefs.reconciliation_complete.unwrap_or(true),
            job_failed: update_prefs.job_failed.unwrap_or(true),
            project_updated: update_prefs.project_updated.unwrap_or(false),
        };
        diesel::insert_into(notification_preferences::table)
            .values(&new_prefs)
            .get_result(&mut conn)
            .map_err(AppError::Database)?
    };

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "email": updated.email,
            "push": updated.push,
            "reconciliation_complete": updated.reconciliation_complete,
            "job_failed": updated.job_failed,
            "project_updated": updated.project_updated,
        })),
        message: Some("Preferences updated successfully".to_string()),
        error: None,
    }))
}

/// Subscribe to notifications
/// 
/// Enables specific notification types for the user.
#[utoipa::path(
    post,
    path = "/api/v1/notifications/subscribe",
    tag = "Notifications",
    request_body = serde_json::Value,
    responses(
        (status = 200, description = "Subscribed to notifications", body = ApiResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn subscribe(
    req: web::Json<serde_json::Value>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    
    use crate::models::schema::notification_preferences;
    let mut conn = data.get_connection()?;

    // Get or create preferences
    let prefs = notification_preferences::table
        .filter(notification_preferences::user_id.eq(user_id))
        .first::<crate::models::notification::NotificationPreferences>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;

    // Create default if needed
    if prefs.is_none() {
        let new_prefs = crate::models::notification::NewNotificationPreferences {
            user_id,
            email: true,
            push: true,
            reconciliation_complete: true,
            job_failed: true,
            project_updated: false,
        };
        diesel::insert_into(notification_preferences::table)
            .values(&new_prefs)
            .execute(&mut conn)
            .map_err(AppError::Database)?;
    }

    // Update preferences based on notification_types
    if let Some(notification_types) = req.get("notification_types").and_then(|v| v.as_array()) {
        let mut update = crate::models::notification::UpdateNotificationPreferences {
            email: None,
            push: None,
            reconciliation_complete: None,
            job_failed: None,
            project_updated: None,
        };

        for nt in notification_types {
            if let Some(nt_str) = nt.as_str() {
                match nt_str {
                    "reconciliation_complete" => update.reconciliation_complete = Some(true),
                    "job_failed" => update.job_failed = Some(true),
                    "project_updated" => update.project_updated = Some(true),
                    _ => {}
                }
            }
        }

        diesel::update(
            notification_preferences::table
                .filter(notification_preferences::user_id.eq(user_id))
        )
        .set(&update)
        .execute(&mut conn)
        .map_err(AppError::Database)?;
    }

    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Subscribed to notifications".to_string()),
        error: None,
    }))
}

/// Unsubscribe from notifications
/// 
/// Disables specific notification types for the user.
#[utoipa::path(
    post,
    path = "/api/v1/notifications/unsubscribe",
    tag = "Notifications",
    request_body = serde_json::Value,
    responses(
        (status = 200, description = "Unsubscribed from notifications", body = ApiResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn unsubscribe(
    req: web::Json<serde_json::Value>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    
    use crate::models::schema::notification_preferences;
    let mut conn = data.get_connection()?;

    // Get or create preferences
    let prefs = notification_preferences::table
        .filter(notification_preferences::user_id.eq(user_id))
        .first::<crate::models::notification::NotificationPreferences>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;

    // Create default if needed
    if prefs.is_none() {
        let new_prefs = crate::models::notification::NewNotificationPreferences {
            user_id,
            email: false,
            push: false,
            reconciliation_complete: false,
            job_failed: false,
            project_updated: false,
        };
        diesel::insert_into(notification_preferences::table)
            .values(&new_prefs)
            .execute(&mut conn)
            .map_err(AppError::Database)?;
    }

    // Update preferences based on notification_types
    if let Some(notification_types) = req.get("notification_types").and_then(|v| v.as_array()) {
        let mut update = crate::models::notification::UpdateNotificationPreferences {
            email: None,
            push: None,
            reconciliation_complete: None,
            job_failed: None,
            project_updated: None,
        };

        for nt in notification_types {
            if let Some(nt_str) = nt.as_str() {
                match nt_str {
                    "reconciliation_complete" => update.reconciliation_complete = Some(false),
                    "job_failed" => update.job_failed = Some(false),
                    "project_updated" => update.project_updated = Some(false),
                    "email" => update.email = Some(false),
                    "push" => update.push = Some(false),
                    _ => {}
                }
            }
        }

        diesel::update(
            notification_preferences::table
                .filter(notification_preferences::user_id.eq(user_id))
        )
        .set(&update)
        .execute(&mut conn)
        .map_err(AppError::Database)?;
    } else {
        // If no specific types, disable all
        let update = crate::models::notification::UpdateNotificationPreferences {
            email: Some(false),
            push: Some(false),
            reconciliation_complete: Some(false),
            job_failed: Some(false),
            project_updated: Some(false),
        };
        diesel::update(
            notification_preferences::table
                .filter(notification_preferences::user_id.eq(user_id))
        )
        .set(&update)
        .execute(&mut conn)
        .map_err(AppError::Database)?;
    }

    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Unsubscribed from notifications".to_string()),
        error: None,
    }))
}

