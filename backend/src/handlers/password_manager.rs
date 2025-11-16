//! Password Manager API Handlers

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::services::password_manager::{PasswordManager, PasswordEntry, RotationSchedule};
use crate::errors::AppResult;

/// Request to create a password
#[derive(Debug, Deserialize)]
pub struct CreatePasswordRequest {
    pub name: String,
    pub password: String,
    pub rotation_interval_days: Option<i32>,
}

/// Request to rotate a password
#[derive(Debug, Deserialize)]
pub struct RotatePasswordRequest {
    pub name: String,
    pub new_password: Option<String>,
}

/// Request to update rotation interval
#[derive(Debug, Deserialize)]
pub struct UpdateRotationRequest {
    pub name: String,
    pub rotation_interval_days: i32,
}

/// Response for password operations
#[derive(Debug, Serialize)]
pub struct PasswordResponse {
    pub success: bool,
    pub message: String,
    pub entry: Option<PasswordEntry>,
}

/// Response for password list
#[derive(Debug, Serialize)]
pub struct PasswordListResponse {
    pub passwords: Vec<PasswordEntry>,
}

/// Response for rotation schedule
#[derive(Debug, Serialize)]
pub struct RotationScheduleResponse {
    pub schedule: Vec<RotationSchedule>,
}

/// Get all passwords (metadata only)
pub async fn list_passwords(
    password_manager: web::Data<Arc<PasswordManager>>,
) -> AppResult<impl Responder> {
    let entries = password_manager.list_passwords().await?;
    
    Ok(HttpResponse::Ok().json(PasswordListResponse {
        passwords: entries,
    }))
}

/// Get a specific password
pub async fn get_password(
    password_manager: web::Data<Arc<PasswordManager>>,
    path: web::Path<String>,
) -> AppResult<impl Responder> {
    let name = path.into_inner();
    let entry = password_manager.get_entry_by_name(&name).await?;
    
    Ok(HttpResponse::Ok().json(PasswordResponse {
        success: true,
        message: "Password retrieved successfully".to_string(),
        entry: Some(entry),
    }))
}

/// Create a new password entry
pub async fn create_password(
    password_manager: web::Data<Arc<PasswordManager>>,
    req: web::Json<CreatePasswordRequest>,
) -> AppResult<impl Responder> {
    let rotation_interval = req.rotation_interval_days.unwrap_or(90);
    let entry = password_manager
        .create_password(&req.name, &req.password, rotation_interval)
        .await?;
    
    Ok(HttpResponse::Created().json(PasswordResponse {
        success: true,
        message: format!("Password '{}' created successfully", req.name),
        entry: Some(entry),
    }))
}

/// Rotate a password
pub async fn rotate_password(
    password_manager: web::Data<Arc<PasswordManager>>,
    req: web::Json<RotatePasswordRequest>,
) -> AppResult<impl Responder> {
    let new_password = req.new_password.as_deref();
    let entry = password_manager
        .rotate_password(&req.name, new_password)
        .await?;
    
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

