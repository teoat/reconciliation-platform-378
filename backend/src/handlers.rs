//! API handlers for the Reconciliation Backend
//! 
//! This module contains all HTTP request handlers for the REST API endpoints.

use actix_web::{web, HttpRequest, Result};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::database::Database;
use crate::errors::AppError;
use crate::config::Config;
use crate::services::{
    AuthService, UserService, ProjectService, ReconciliationService,
    FileService, AnalyticsService
};
use crate::services::auth::{LoginRequest, RegisterRequest, ChangePasswordRequest};
use crate::models::JsonValue;

// Request/Response DTOs

#[derive(Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: Option<String>,
    pub owner_id: Uuid,
    pub status: Option<String>,
    pub settings: Option<serde_json::Value>,
}

#[derive(Deserialize)]
pub struct UpdateProjectRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub settings: Option<serde_json::Value>,
}

#[derive(Deserialize)]
pub struct CreateDataSourceRequest {
    pub name: String,
    pub description: Option<String>,
    pub source_type: String,
    pub file_path: Option<String>,
    pub file_size: Option<i64>,
    pub file_hash: Option<String>,
    pub schema: Option<serde_json::Value>,
}

#[derive(Deserialize)]
pub struct CreateReconciliationJobRequest {
    pub name: String,
    pub description: Option<String>,
    pub source_data_source_id: Uuid,
    pub target_data_source_id: Uuid,
    pub confidence_threshold: f64,
    pub settings: Option<serde_json::Value>,
}

#[derive(Deserialize)]
pub struct UpdateReconciliationJobRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub confidence_threshold: Option<f64>,
    pub settings: Option<serde_json::Value>,
}

#[derive(Deserialize)]
pub struct FileUploadRequest {
    pub name: String,
    pub description: Option<String>,
    pub project_id: Uuid,
    pub source_type: String,
}

#[derive(Serialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub total: i64,
    pub page: i32,
    pub per_page: i32,
    pub total_pages: i32,
}

#[derive(Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
    pub error: Option<String>,
}

#[derive(Deserialize)]
pub struct SearchQueryParams {
    pub q: Option<String>,
    pub page: Option<i32>,
    pub per_page: Option<i32>,
}

/// Configure all API routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        // Authentication routes
        .service(
            web::scope("/api/auth")
                .route("/login", web::post().to(login))
                .route("/register", web::post().to(register))
                .route("/refresh", web::post().to(refresh_token))
                .route("/logout", web::post().to(logout))
                .route("/change-password", web::post().to(change_password))
                .route("/password-reset", web::post().to(request_password_reset))
                .route("/password-reset/confirm", web::post().to(confirm_password_reset))
                .route("/me", web::get().to(get_current_user))
        )
        // User management routes
        .service(
            web::scope("/api/users")
                .route("", web::get().to(get_users))
                .route("", web::post().to(create_user))
                .route("/search", web::get().to(search_users))
                .route("/statistics", web::get().to(get_user_statistics))
                .route("/{user_id}", web::get().to(get_user))
                .route("/{user_id}", web::put().to(update_user))
                .route("/{user_id}", web::delete().to(delete_user))
        )
        // Project management routes
        .service(
            web::scope("/api/projects")
                .route("", web::get().to(get_projects))
                .route("", web::post().to(create_project))
                .route("/{project_id}", web::get().to(get_project))
                .route("/{project_id}", web::put().to(update_project))
                .route("/{project_id}", web::delete().to(delete_project))
                .route("/{project_id}/data-sources", web::get().to(get_project_data_sources))
                .route("/{project_id}/data-sources", web::post().to(create_data_source))
                .route("/{project_id}/reconciliation-jobs", web::get().to(get_reconciliation_jobs))
                .route("/{project_id}/reconciliation-jobs", web::post().to(create_reconciliation_job))
        )
        // Reconciliation routes
        .service(
            web::scope("/api/reconciliation")
                .route("/jobs", web::get().to(get_reconciliation_jobs))
                .route("/jobs/active", web::get().to(get_active_reconciliation_jobs))
                .route("/jobs/queued", web::get().to(get_queued_reconciliation_jobs))
                .route("/jobs/{job_id}", web::get().to(get_reconciliation_job))
                .route("/jobs/{job_id}", web::put().to(update_reconciliation_job))
                .route("/jobs/{job_id}", web::delete().to(delete_reconciliation_job))
                .route("/jobs/{job_id}/start", web::post().to(start_reconciliation_job))
                .route("/jobs/{job_id}/stop", web::post().to(stop_reconciliation_job))
                .route("/jobs/{job_id}/results", web::get().to(get_reconciliation_results))
                .route("/jobs/{job_id}/progress", web::get().to(get_reconciliation_progress))
                .route("/jobs/{job_id}/statistics", web::get().to(get_reconciliation_job_statistics))
        )
        // File upload routes
        .service(
            web::scope("/api/files")
                .route("/upload", web::post().to(upload_file))
                .route("/{file_id}", web::get().to(get_file))
                .route("/{file_id}", web::delete().to(delete_file))
                .route("/{file_id}/process", web::post().to(process_file))
        )
        // Analytics routes
        .service(
            web::scope("/api/analytics")
                .route("/dashboard", web::get().to(get_dashboard_data))
                .route("/projects/{project_id}/stats", web::get().to(get_project_stats))
                .route("/users/{user_id}/activity", web::get().to(get_user_activity))
                .route("/reconciliation/stats", web::get().to(get_reconciliation_stats))
        )
        // System routes
        .service(
            web::scope("/api/system")
                .route("/health", web::get().to(health_check))
                .route("/status", web::get().to(system_status))
                .route("/metrics", web::get().to(get_metrics))
        );
}

// Authentication handlers

/// Login endpoint
pub async fn login(
    req: web::Json<LoginRequest>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let auth_service = AuthService::new(
        config.jwt_secret.clone(),
        config.jwt_expiration,
    );
    
    let user_service = UserService::new(data.get_ref().clone(), auth_service.clone());
    
    // Get user by email
    let user = user_service.get_user_by_email(&req.email).await?;
    
    // Verify password
    if !auth_service.verify_password(&req.password, &user.password_hash)? {
        return Err(AppError::Authentication("Invalid credentials".to_string()));
    }
    
    // Check if user is active
    if !user.is_active {
        return Err(AppError::Authentication("Account is deactivated".to_string()));
    }
    
    // Generate token
    let token = auth_service.generate_token(&user)?;
    
    // Update last login
    user_service.update_last_login(user.id).await?;
    
    // Create response
    let auth_response = crate::services::auth::AuthResponse {
        token,
        user: crate::services::auth::UserInfo {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            is_active: user.is_active,
            last_login: Some(chrono::Utc::now()),
        },
        expires_at: (chrono::Utc::now().timestamp() + config.jwt_expiration) as usize,
    };
    
    Ok(HttpResponse::Ok().json(auth_response))
}

/// Register endpoint
pub async fn register(
    req: web::Json<RegisterRequest>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let auth_service = AuthService::new(
        config.jwt_secret.clone(),
        config.jwt_expiration,
    );
    
    let user_service = UserService::new(data.get_ref().clone(), auth_service.clone());
    
    // Create user
    let create_request = crate::services::user::CreateUserRequest {
        email: req.email.clone(),
        password: req.password.clone(),
        first_name: req.first_name.clone(),
        last_name: req.last_name.clone(),
        role: req.role.clone(),
    };
    
    let user_info = user_service.create_user(create_request).await?;
    
    // Generate token
    let user = user_service.get_user_by_id(user_info.id).await?;
    let token = auth_service.generate_token(&crate::models::User {
        id: user.id,
        email: user.email,
        password_hash: String::new(), // Not needed for token generation
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
    })?;
    
    // Create response
    let auth_response = crate::services::auth::AuthResponse {
        token,
        user: crate::services::auth::UserInfo {
            id: user_info.id,
            email: user_info.email,
            first_name: user_info.first_name,
            last_name: user_info.last_name,
            role: user_info.role,
            is_active: user_info.is_active,
            last_login: user_info.last_login,
        },
        expires_at: (chrono::Utc::now().timestamp() + config.jwt_expiration) as usize,
    };
    
    Ok(HttpResponse::Created().json(auth_response))
}

/// Refresh token endpoint
pub async fn refresh_token(
    req: HttpRequest,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    // Extract token from Authorization header
    let auth_header = req.headers().get("Authorization")
        .ok_or_else(|| AppError::Authentication("Missing Authorization header".to_string()))?;
    
    let auth_str = auth_header.to_str()
        .map_err(|_| AppError::Authentication("Invalid Authorization header".to_string()))?;
    
    if !auth_str.starts_with("Bearer ") {
        return Err(AppError::Authentication("Invalid Authorization header format".to_string()));
    }
    
    let token = &auth_str[7..]; // Remove "Bearer " prefix
    
    let auth_service = AuthService::new(
        config.jwt_secret.clone(),
        config.jwt_expiration,
    );
    
    // Validate token
    let claims = auth_service.validate_token(token)?;
    
    // Generate new token
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|e| AppError::Authentication(format!("Invalid user ID: {}", e)))?;
    
    // For simplicity, we'll create a minimal user struct for token generation
    // In a real implementation, you'd fetch the full user from the database
    let user = crate::models::User {
        id: user_id,
        email: claims.email,
        password_hash: String::new(),
        first_name: String::new(),
        last_name: String::new(),
        role: claims.role,
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        last_login: None,
    };
    
    let new_token = auth_service.generate_token(&user)?;
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "token": new_token,
        "expires_at": (chrono::Utc::now().timestamp() + config.jwt_expiration) as usize
    })))
}

/// Logout endpoint
pub async fn logout() -> Result<HttpResponse, AppError> {
    // In a stateless JWT implementation, logout is handled client-side
    // by removing the token. For enhanced security, you could implement
    // a token blacklist using Redis.
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Logged out successfully"
    })))
}

/// Change password endpoint
pub async fn change_password(
    req: web::Json<ChangePasswordRequest>,
    user_id: web::Path<Uuid>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let auth_service = AuthService::new(
        config.jwt_secret.clone(),
        config.jwt_expiration,
    );
    
    let user_service = UserService::new(data.get_ref().clone(), auth_service);
    
    // Change password
    user_service.change_password(
        user_id.into_inner(),
        &req.current_password,
        &req.new_password,
    ).await?;
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Password changed successfully"
    })))
}

// User management handlers

/// Get users endpoint
pub async fn get_users(
    query: web::Query<UserQueryParams>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let auth_service = AuthService::new(
        config.jwt_secret.clone(),
        config.jwt_expiration,
    );
    
    let user_service = UserService::new(data.get_ref().clone(), auth_service);
    
    let response = user_service.list_users(query.page, query.per_page).await?;
    
    Ok(HttpResponse::Ok().json(response))
}

/// Create user endpoint
pub async fn create_user(
    req: web::Json<crate::services::user::CreateUserRequest>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let auth_service = AuthService::new(
        config.jwt_secret.clone(),
        config.jwt_expiration,
    );
    
    let user_service = UserService::new(data.get_ref().clone(), auth_service);
    
    let user_info = user_service.create_user(req.into_inner()).await?;
    
    Ok(HttpResponse::Created().json(user_info))
}

/// Get user endpoint
pub async fn get_user(
    user_id: web::Path<Uuid>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let auth_service = AuthService::new(
        config.jwt_secret.clone(),
        config.jwt_expiration,
    );
    
    let user_service = UserService::new(data.get_ref().clone(), auth_service);
    
    let user_info = user_service.get_user_by_id(user_id.into_inner()).await?;
    
    Ok(HttpResponse::Ok().json(user_info))
}

/// Update user endpoint
pub async fn update_user(
    user_id: web::Path<Uuid>,
    req: web::Json<crate::services::user::UpdateUserRequest>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let auth_service = AuthService::new(
        config.jwt_secret.clone(),
        config.jwt_expiration,
    );
    
    let user_service = UserService::new(data.get_ref().clone(), auth_service);
    
    let user_info = user_service.update_user(user_id.into_inner(), req.into_inner()).await?;
    
    Ok(HttpResponse::Ok().json(user_info))
}

/// Delete user endpoint
pub async fn delete_user(
    user_id: web::Path<Uuid>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let auth_service = AuthService::new(
        config.jwt_secret.clone(),
        config.jwt_expiration,
    );
    
    let user_service = UserService::new(data.get_ref().clone(), auth_service);
    
    user_service.delete_user(user_id.into_inner()).await?;
    
    Ok(HttpResponse::NoContent().finish())
}

/// Search users endpoint
pub async fn search_users(
    query: web::Query<SearchQueryParams>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let auth_service = AuthService::new(
        config.jwt_secret.clone(),
        config.jwt_expiration,
    );
    
    let user_service = UserService::new(data.get_ref().clone(), auth_service);
    
    let response = user_service.search_users(query.q.as_deref().unwrap_or(""), query.page.map(|p| p as i64), query.per_page.map(|p| p as i64)).await?;
    
    Ok(HttpResponse::Ok().json(response))
}

// Project management handlers

pub async fn get_projects(
    query: web::Query<SearchQueryParams>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let project_service = crate::services::ProjectService::new(data.get_ref().clone());
    
    let response = project_service.list_projects(
        query.page.map(|p| p as i64),
        query.per_page.map(|p| p as i64),
    ).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(response),
        message: None,
        error: None,
    }))
}

pub async fn create_project(
    req: web::Json<CreateProjectRequest>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let project_service = crate::services::ProjectService::new(data.get_ref().clone());
    
    let request = crate::services::project::CreateProjectRequest {
        name: req.name.clone(),
        description: req.description.clone(),
        owner_id: req.owner_id,
        status: req.status.clone(),
        settings: req.settings.as_ref().map(|s| JsonValue(s.clone())),
    };
    let project = project_service.create_project(request).await?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(project),
        message: Some("Project created successfully".to_string()),
        error: None,
    }))
}

pub async fn get_project(
    path: web::Path<Uuid>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let project_service = crate::services::ProjectService::new(data.get_ref().clone());
    
    let project = project_service.get_project_by_id(path.into_inner()).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(project),
        message: None,
        error: None,
    }))
}

pub async fn update_project(
    path: web::Path<Uuid>,
    req: web::Json<UpdateProjectRequest>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let project_service = crate::services::ProjectService::new(data.get_ref().clone());
    
    let request = crate::services::project::UpdateProjectRequest {
        name: req.name.clone(),
        description: req.description.clone(),
        status: req.status.clone(),
        settings: req.settings.as_ref().map(|s| JsonValue(s.clone())),
    };
    let project = project_service.update_project(path.into_inner(), request).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(project),
        message: Some("Project updated successfully".to_string()),
        error: None,
    }))
}

pub async fn delete_project(
    path: web::Path<Uuid>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let project_service = crate::services::ProjectService::new(data.get_ref().clone());
    
    project_service.delete_project(path.into_inner()).await?;
    
    Ok(HttpResponse::NoContent().finish())
}

pub async fn get_project_data_sources(
    project_id: web::Path<Uuid>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let data_source_service = crate::services::DataSourceService::new(data.get_ref().clone());
    
    let data_sources = data_source_service.get_project_data_sources(project_id.into_inner()).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(data_sources),
        message: None,
        error: None,
    }))
}

pub async fn create_data_source(
    project_id: web::Path<Uuid>,
    req: web::Json<CreateDataSourceRequest>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let data_source_service = crate::services::DataSourceService::new(data.get_ref().clone());
    
    let new_data_source = data_source_service.create_data_source(
        project_id.into_inner(),
        req.name.clone(),
        req.source_type.clone(),
        req.file_path.clone(),
        req.file_size,
        req.file_hash.clone(),
        req.schema.as_ref().map(|s| JsonValue(s.clone())),
    ).await?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(new_data_source),
        message: Some("Data source created successfully".to_string()),
        error: None,
    }))
}

pub async fn get_reconciliation_jobs(
    project_id: web::Path<Uuid>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let reconciliation_service = crate::services::ReconciliationService::new(data.get_ref().clone());
    
    let jobs = reconciliation_service.get_project_reconciliation_jobs(project_id.into_inner()).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(jobs),
        message: None,
        error: None,
    }))
}

pub async fn create_reconciliation_job(
    project_id: web::Path<Uuid>,
    req: web::Json<CreateReconciliationJobRequest>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let reconciliation_service = crate::services::ReconciliationService::new(data.get_ref().clone());
    
    // Extract user_id from JWT token (placeholder - should be extracted by middleware)
    let user_id = Uuid::new_v4(); // TODO: Extract from JWT token properly

    // Extract matching_rules from settings or use defaults
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
        project_id: project_id.into_inner(),
        name: req.name.clone(),
        description: req.description.clone(),
        source_a_id: req.source_data_source_id,
        source_b_id: req.target_data_source_id,
        confidence_threshold: req.confidence_threshold,
        matching_rules,
        created_by: user_id,
    };

    let new_job = reconciliation_service.create_reconciliation_job(user_id, request).await?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(new_job),
        message: Some("Reconciliation job created successfully".to_string()),
        error: None,
    }))
}

// Reconciliation handlers (placeholder implementations)

pub async fn get_reconciliation_job(
    job_id: web::Path<Uuid>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let reconciliation_service = crate::services::ReconciliationService::new(data.get_ref().clone());
    
    let job_status = reconciliation_service.get_reconciliation_job_status(job_id.into_inner()).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(job_status),
        message: None,
        error: None,
    }))
}

pub async fn update_reconciliation_job(
    job_id: web::Path<Uuid>,
    req: web::Json<UpdateReconciliationJobRequest>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let reconciliation_service = crate::services::ReconciliationService::new(data.get_ref().clone());
    
    // Update the reconciliation job
    let updated_job = reconciliation_service.update_reconciliation_job(
        job_id.into_inner(),
        req.name.clone(),
        req.description.clone(),
        req.confidence_threshold,
        req.settings.clone(),
    ).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(updated_job),
        message: Some("Reconciliation job updated successfully".to_string()),
        error: None,
    }))
}

pub async fn delete_reconciliation_job(
    job_id: web::Path<Uuid>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let reconciliation_service = crate::services::ReconciliationService::new(data.get_ref().clone());
    
    // Delete the reconciliation job
    reconciliation_service.delete_reconciliation_job(job_id.into_inner()).await?;
    
    Ok(HttpResponse::NoContent().finish())
}

pub async fn start_reconciliation_job(
    job_id: web::Path<Uuid>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let reconciliation_service = crate::services::ReconciliationService::new(data.get_ref().clone());
    
    reconciliation_service.start_reconciliation_job(job_id.into_inner()).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Reconciliation job started successfully".to_string()),
        error: None,
    }))
}

pub async fn stop_reconciliation_job(
    job_id: web::Path<Uuid>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let reconciliation_service = crate::services::ReconciliationService::new(data.get_ref().clone());
    
    reconciliation_service.stop_reconciliation_job(job_id.into_inner()).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Reconciliation job stopped successfully".to_string()),
        error: None,
    }))
}

pub async fn get_reconciliation_results(
    job_id: web::Path<Uuid>,
    query: web::Query<ReconciliationResultsQuery>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let reconciliation_service = crate::services::ReconciliationService::new(data.get_ref().clone());
    
    let results = reconciliation_service.get_reconciliation_results(
        job_id.into_inner(),
        query.page,
        query.per_page,
    ).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(results),
        message: None,
        error: None,
    }))
}

pub async fn get_reconciliation_progress(
    job_id: web::Path<Uuid>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let reconciliation_service = crate::services::ReconciliationService::new(data.get_ref().clone());
    
    let job_status = reconciliation_service.get_reconciliation_job_status(job_id.into_inner()).await?;
    
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

// File upload handlers (placeholder implementations)

pub async fn upload_file(
    mut payload: actix_multipart::Multipart,
    req: HttpRequest,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    // Extract project_id from query parameters
    let project_id = req.query_string()
        .split('&')
        .find(|param| param.starts_with("project_id="))
        .and_then(|param| param.split('=').nth(1))
        .and_then(|id| Uuid::parse_str(id).ok())
        .ok_or_else(|| AppError::Validation("Missing or invalid project_id".to_string()))?;
    
    // Extract user_id from JWT token (placeholder - should be extracted by middleware)
    let user_id = Uuid::new_v4(); // TODO: Extract from JWT token properly
    
    let file_service = crate::services::FileService::new(
        data.get_ref().clone(),
        config.upload_path.clone(),
    );
    
    let file_info = file_service.upload_file(payload, project_id, user_id).await?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(file_info),
        message: Some("File uploaded successfully".to_string()),
        error: None,
    }))
}

pub async fn get_file(
    file_id: web::Path<Uuid>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let file_service = crate::services::FileService::new(
        data.get_ref().clone(),
        config.upload_path.clone(),
    );
    
    let file_info = file_service.get_file(file_id.into_inner()).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(file_info),
        message: None,
        error: None,
    }))
}

pub async fn delete_file(
    file_id: web::Path<Uuid>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let file_service = crate::services::FileService::new(
        data.get_ref().clone(),
        config.upload_path.clone(),
    );
    
    file_service.delete_file(file_id.into_inner()).await?;
    
    Ok(HttpResponse::NoContent().finish())
}

pub async fn process_file(
    file_id: web::Path<Uuid>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let file_service = crate::services::FileService::new(
        data.get_ref().clone(),
        config.upload_path.clone(),
    );
    
    let processing_result = file_service.process_file(file_id.into_inner()).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(processing_result),
        message: Some("File processing completed".to_string()),
        error: None,
    }))
}

// Analytics handlers (placeholder implementations)

pub async fn get_dashboard_data(
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let analytics_service = crate::services::AnalyticsService::new(data.get_ref().clone());
    
    let dashboard_data = analytics_service.get_dashboard_data().await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(dashboard_data),
        message: None,
        error: None,
    }))
}

pub async fn get_project_stats(
    project_id: web::Path<Uuid>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let analytics_service = crate::services::AnalyticsService::new(data.get_ref().clone());
    
    let project_stats = analytics_service.get_project_stats(project_id.into_inner()).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(project_stats),
        message: None,
        error: None,
    }))
}

pub async fn get_user_activity(
    user_id: web::Path<Uuid>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let analytics_service = crate::services::AnalyticsService::new(data.get_ref().clone());
    
    let user_activity = analytics_service.get_user_activity_stats(user_id.into_inner()).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(user_activity),
        message: None,
        error: None,
    }))
}

pub async fn get_reconciliation_stats(
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let analytics_service = crate::services::AnalyticsService::new(data.get_ref().clone());
    
    let reconciliation_stats = analytics_service.get_reconciliation_stats().await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(reconciliation_stats),
        message: None,
        error: None,
    }))
}

// Additional authentication handlers

/// Request password reset
pub async fn request_password_reset(
    req: web::Json<crate::services::auth::PasswordResetRequest>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let enhanced_auth = crate::services::auth::EnhancedAuthService::new(
        config.jwt_secret.clone(),
        config.jwt_expiration,
    );
    
    let reset_token = enhanced_auth.generate_password_reset_token(&req.email, &data).await?;
    
    // In a real implementation, you would send this token via email
    // For now, we'll just return it in the response (not recommended for production)
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "message": "Password reset token generated",
            "token": reset_token // Remove this in production
        })),
        message: Some("Password reset instructions sent to your email".to_string()),
        error: None,
    }))
}

/// Confirm password reset
pub async fn confirm_password_reset(
    req: web::Json<crate::services::auth::PasswordResetConfirmation>,
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let enhanced_auth = crate::services::auth::EnhancedAuthService::new(
        config.jwt_secret.clone(),
        config.jwt_expiration,
    );
    
    enhanced_auth.confirm_password_reset(&req.token, &req.new_password, &data).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Password reset successfully".to_string()),
        error: None,
    }))
}

/// Get current user information
pub async fn get_current_user(
    req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    // Extract user_id from JWT token (placeholder - should be extracted by middleware)
    let user_id = Uuid::new_v4(); // TODO: Extract from JWT token properly
    
    let user_service = UserService::new(data.get_ref().clone(), AuthService::new("".to_string(), 0));
    let user = user_service.get_user_by_id(user_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "last_login": user.last_login
        })),
        message: None,
        error: None,
    }))
}

/// Get user statistics
pub async fn get_user_statistics(
    req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_service = UserService::new(data.get_ref().clone(), AuthService::new("".to_string(), 0));
    let stats = user_service.get_user_statistics().await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(stats),
        message: None,
        error: None,
    }))
}

/// Get reconciliation job statistics
pub async fn get_reconciliation_job_statistics(
    path: web::Path<Uuid>,
    req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let job_id = path.into_inner();
    let reconciliation_service = ReconciliationService::new(data.get_ref().clone());
    let stats = reconciliation_service.get_reconciliation_job_statistics(job_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(stats),
        message: None,
        error: None,
    }))
}

/// Get active reconciliation jobs
pub async fn get_active_reconciliation_jobs(
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let reconciliation_service = ReconciliationService::new(data.get_ref().clone());
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
    let reconciliation_service = ReconciliationService::new(data.get_ref().clone());
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

// System handlers

/// System status endpoint (legacy - use /health instead)
pub async fn system_status() -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "status": "operational",
        "uptime": "0s",
        "version": env!("CARGO_PKG_VERSION")
    })))
}

pub async fn get_metrics(
    data: web::Data<Database>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
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

// Query parameter structs

#[derive(Debug, Deserialize)]
pub struct UserQueryParams {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct ReconciliationResultsQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub match_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ReconciliationQueryParams {
    pub project_id: Option<Uuid>,
    pub status: Option<String>,
    pub page: Option<i32>,
    pub per_page: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct FileQueryParams {
    pub project_id: Option<Uuid>,
    pub status: Option<String>,
    pub page: Option<i32>,
    pub per_page: Option<i32>,
}

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

/// Health check response
#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub timestamp: String,
    pub version: String,
}

/// Readiness check response
#[derive(Debug, Serialize)]
pub struct ReadinessResponse {
    pub status: String,
    pub checks: SystemChecks,
}

/// System health checks
#[derive(Debug, Serialize)]
pub struct SystemChecks {
    pub database: String,
    pub cache: String,
    pub memory: String,
}

/// Basic health check endpoint
/// GET /health
/// Returns: { "status": "healthy", "timestamp": "...", "version": "..." }
pub async fn health_check() -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(HealthResponse {
        status: "healthy".to_string(),
        timestamp: Utc::now().to_rfc3339(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    }))
}

/// Readiness check endpoint
/// GET /ready
/// Checks if the service is ready to accept traffic
pub async fn readiness_check(data: web::Data<Database>) -> Result<HttpResponse, AppError> {
    let mut checks = SystemChecks {
        database: "unknown".to_string(),
        cache: "unknown".to_string(),
        memory: "ok".to_string(),
    };
    
    // Check database connectivity
    match data.get_connection() {
        Ok(_) => checks.database = "ok".to_string(),
        Err(_) => checks.database = "down".to_string(),
    }
    
    // Check memory (simple check)
    let mem_usage = get_memory_usage();
    if mem_usage > 90.0 {
        checks.memory = "critical".to_string();
    } else if mem_usage > 80.0 {
        checks.memory = "warning".to_string();
    } else {
        checks.memory = "ok".to_string();
    }
    
    let status = if checks.database == "ok" && checks.memory != "critical" {
        "ready"
    } else {
        "not_ready"
    };
    
    let status_code = if status == "ready" {
        actix_web::http::StatusCode::OK
    } else {
        actix_web::http::StatusCode::SERVICE_UNAVAILABLE
    };
    
    Ok(HttpResponse::build(status_code).json(ReadinessResponse {
        status: status.to_string(),
        checks,
    }))
}

/// Metrics endpoint for Prometheus
/// GET /metrics
/// Returns Prometheus-formatted metrics
pub async fn metrics(data: web::Data<Database>) -> Result<HttpResponse, AppError> {
    let stats = data.get_pool_stats();
    
    // Simple metrics response (can be enhanced with prometheus crate)
    let metrics = format!(
        "# HELP db_connections_active Active database connections
# TYPE db_connections_active gauge
db_connections_active {}\n
# HELP db_connections_idle Idle database connections
# TYPE db_connections_idle gauge
db_connections_idle {}\n
# HELP db_connections_total Total database connections
# TYPE db_connections_total gauge
db_connections_total {}\n",
        stats.active,
        stats.idle,
        stats.size
    );
    
    Ok(HttpResponse::Ok()
        .content_type("text/plain; version=0.0.4")
        .body(metrics))
}

/// Helper function to get memory usage percentage
fn get_memory_usage() -> f64 {
    // Placeholder for actual memory monitoring
    // In production, use system-level APIs like sysinfo crate
    45.0 // Mock value
}
