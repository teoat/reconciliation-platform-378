//! Password Manager API Handlers

use actix_web::{web, HttpRequest, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use utoipa;

// Import directly from password_manager module
use crate::services::password_manager::{PasswordManager, PasswordEntry, RotationSchedule};
use crate::errors::AppResult;
use crate::handlers::helpers::{extract_user_id, get_client_ip, get_user_agent};
use crate::handlers::types::ApiResponse;
use crate::errors::AppError;

/// Request to create a password
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct CreatePasswordRequest {
    pub name: String,
    pub password: String,
    pub rotation_interval_days: Option<i32>,
}

/// Request to rotate a password
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct RotatePasswordRequest {
    pub name: String,
    pub new_password: Option<String>,
}

/// Request to update rotation interval
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct UpdateRotationRequest {
    pub name: String,
    pub rotation_interval_days: i32,
}

/// Response for password operations
#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct PasswordResponse {
    pub success: bool,
    pub message: String,
    pub entry: Option<PasswordEntry>,
}

/// Response for password list
#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct PasswordListResponse {
    pub passwords: Vec<PasswordEntry>,
}

/// Response for rotation schedule
#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct RotationScheduleResponse {
    pub schedule: Vec<RotationSchedule>,
}

/// Get all passwords (metadata only)
/// 
/// Lists all password entries (metadata only, no decrypted passwords).
#[utoipa::path(
    get,
    path = "/api/v1/password-manager",
    tag = "Password Manager",
    responses(
        (status = 200, description = "Password list retrieved successfully", body = PasswordListResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn list_passwords(
    password_manager: web::Data<Arc<PasswordManager>>,
    req: HttpRequest,
) -> AppResult<impl Responder> {
    // Extract user info for audit logging
    let user_id = extract_user_id(&req).ok().map(|id| id.to_string());
    let ip_address = get_client_ip(&req);
    let user_agent = get_user_agent(&req);
    
    let entries = password_manager.list_passwords().await?;
    
    // Log access (async, don't block on errors)
    if let Some(entry) = entries.first() {
        let _ = password_manager.log_audit(
            &entry.id,
            "list",
            user_id.as_deref(),
            Some(&ip_address),
            Some(&user_agent),
        ).await;
    }
    
    Ok(HttpResponse::Ok().json(PasswordListResponse {
        passwords: entries,
    }))
}

/// Get a specific password
/// 
/// Retrieves a specific password entry with decrypted password.
#[utoipa::path(
    get,
    path = "/api/v1/password-manager/{name}",
    tag = "Password Manager",
    params(
        ("name" = String, Path, description = "Password entry name")
    ),
    responses(
        (status = 200, description = "Password retrieved successfully", body = PasswordResponse),
        (status = 404, description = "Password not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_password(
    password_manager: web::Data<Arc<PasswordManager>>,
    path: web::Path<String>,
    req: HttpRequest,
) -> AppResult<impl Responder> {
    let name = path.into_inner();
    
    // Extract user info for audit logging and master key
    let user_id_uuid = extract_user_id(&req).ok();
    let user_id = user_id_uuid.map(|id| id.to_string());
    let ip_address = get_client_ip(&req);
    let user_agent = get_user_agent(&req);
    
    // Get decrypted password using user's master key
    let decrypted_password = password_manager.get_password_by_name(&name, user_id_uuid).await?;
    let mut entry = password_manager.get_entry_by_name(&name).await?;
    
    // Replace encrypted password with decrypted one for response
    entry.encrypted_password = decrypted_password;
    
    // Log access
    password_manager.log_audit(
        &entry.id,
        "read",
        user_id.as_deref(),
        Some(&ip_address),
        Some(&user_agent),
    ).await?;
    
    Ok(HttpResponse::Ok().json(PasswordResponse {
        success: true,
        message: "Password retrieved successfully".to_string(),
        entry: Some(entry),
    }))
}

/// Create a new password entry
/// 
/// Creates a new password entry with optional rotation schedule.
#[utoipa::path(
    post,
    path = "/api/v1/password-manager",
    tag = "Password Manager",
    request_body = CreatePasswordRequest,
    responses(
        (status = 201, description = "Password created successfully", body = PasswordResponse),
        (status = 400, description = "Invalid request", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 409, description = "Password already exists", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn create_password(
    password_manager: web::Data<Arc<PasswordManager>>,
    req: web::Json<CreatePasswordRequest>,
    http_req: HttpRequest,
) -> AppResult<impl Responder> {
    // Extract user info for audit logging
    let user_id = extract_user_id(&http_req).ok().map(|id| id.to_string());
    let ip_address = get_client_ip(&http_req);
    let user_agent = get_user_agent(&http_req);
    
    let rotation_interval = req.rotation_interval_days.unwrap_or(90);
    // Extract user ID for master key
    let user_id_uuid = extract_user_id(&http_req).ok();
    
    let entry = password_manager
        .create_password(&req.name, &req.password, rotation_interval, user_id_uuid)
        .await?;
    
    // Log creation
    password_manager.log_audit(
        &entry.id,
        "create",
        user_id.as_deref(),
        Some(&ip_address),
        Some(&user_agent),
    ).await?;
    
    Ok(HttpResponse::Created().json(PasswordResponse {
        success: true,
        message: format!("Password '{}' created successfully", req.name),
        entry: Some(entry),
    }))
}

/// Rotate a password
/// 
/// Rotates a password entry, optionally with a new password.
#[utoipa::path(
    post,
    path = "/api/v1/password-manager/rotate",
    tag = "Password Manager",
    request_body = RotatePasswordRequest,
    responses(
        (status = 200, description = "Password rotated successfully", body = PasswordResponse),
        (status = 404, description = "Password not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn rotate_password(
    password_manager: web::Data<Arc<PasswordManager>>,
    req: web::Json<RotatePasswordRequest>,
    http_req: HttpRequest,
) -> AppResult<impl Responder> {
    // Extract user info for audit logging
    let user_id = extract_user_id(&http_req).ok().map(|id| id.to_string());
    let ip_address = get_client_ip(&http_req);
    let user_agent = get_user_agent(&http_req);
    
    let new_password = req.new_password.as_deref();
    // Extract user ID for master key
    let user_id_uuid = extract_user_id(&http_req).ok();
    
    let entry = password_manager
        .rotate_password(&req.name, new_password, user_id_uuid)
        .await?;
    
    // Log rotation
    password_manager.log_audit(
        &entry.id,
        "rotate",
        user_id.as_deref(),
        Some(&ip_address),
        Some(&user_agent),
    ).await?;
    
    Ok(HttpResponse::Ok().json(PasswordResponse {
        success: true,
        message: format!("Password '{}' rotated successfully", req.name),
        entry: Some(entry),
    }))
}

/// Rotate all due passwords
pub async fn rotate_due_passwords(
    password_manager: web::Data<Arc<PasswordManager>>,
) -> AppResult<impl Responder> {
    let rotated = password_manager.rotate_due_passwords().await?;
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": format!("Rotated {} passwords", rotated.len()),
        "rotated": rotated,
    })))
}

/// Update rotation interval
/// 
/// Updates the rotation interval for a password entry.
#[utoipa::path(
    put,
    path = "/api/v1/password-manager/rotation",
    tag = "Password Manager",
    request_body = UpdateRotationRequest,
    responses(
        (status = 200, description = "Rotation interval updated successfully", body = PasswordResponse),
        (status = 404, description = "Password not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn update_rotation_interval(
    password_manager: web::Data<Arc<PasswordManager>>,
    req: web::Json<UpdateRotationRequest>,
) -> AppResult<impl Responder> {
    let entry = password_manager
        .update_rotation_interval(&req.name, req.rotation_interval_days)
        .await?;
    
    Ok(HttpResponse::Ok().json(PasswordResponse {
        success: true,
        message: format!("Rotation interval updated for '{}'", req.name),
        entry: Some(entry),
    }))
}

/// Get rotation schedule
/// 
/// Retrieves the rotation schedule for all passwords.
#[utoipa::path(
    get,
    path = "/api/v1/password-manager/rotation/schedule",
    tag = "Password Manager",
    responses(
        (status = 200, description = "Rotation schedule retrieved successfully", body = RotationScheduleResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_rotation_schedule(
    password_manager: web::Data<Arc<PasswordManager>>,
) -> AppResult<impl Responder> {
    let schedule = password_manager.get_rotation_schedule().await?;
    
    Ok(HttpResponse::Ok().json(RotationScheduleResponse {
        schedule,
    }))
}

/// Deactivate a password
pub async fn deactivate_password(
    password_manager: web::Data<Arc<PasswordManager>>,
    path: web::Path<String>,
) -> AppResult<impl Responder> {
    let name = path.into_inner();
    password_manager.deactivate_password(&name).await?;
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": format!("Password '{}' deactivated", name),
    })))
}

/// Initialize default passwords
pub async fn initialize_defaults(
    password_manager: web::Data<Arc<PasswordManager>>,
) -> AppResult<impl Responder> {
    password_manager.initialize_default_passwords().await?;
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": "Default passwords initialized",
    })))
}

/// Configure password manager routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("", web::get().to(list_passwords))
        .route("/initialize", web::post().to(initialize_defaults))
        .route("/rotate-due", web::post().to(rotate_due_passwords))
        .route("/schedule", web::get().to(get_rotation_schedule))
        .route("/{name}", web::get().to(get_password))
        .route("/{name}", web::post().to(create_password))
        .route("/{name}/rotate", web::post().to(rotate_password))
        .route("/{name}/interval", web::put().to(update_rotation_interval))
        .route("/{name}/deactivate", web::post().to(deactivate_password));
}

