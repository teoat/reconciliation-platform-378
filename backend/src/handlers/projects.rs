//! Project management handlers module

use actix_multipart::Multipart;
use actix_web::{web, HttpRequest, HttpResponse, Result};
use diesel::prelude::*;
use std::time::Duration;
use uuid::Uuid;

use crate::config::Config;
use crate::database::Database;
use crate::errors::AppError;
use crate::services::cache::MultiLevelCache;

use crate::handlers::types::{
    AddProjectMemberRequest, ApiResponse, CreateDataSourceRequest, CreateProjectRequest,
    FileUploadRequest, PaginatedResponse, SearchQueryParams, UpdateProjectRequest,
};
// Using serde_json::Value directly

use crate::handlers::helpers::extract_user_id;
use crate::utils::check_project_permission;

/// Configure project management routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(get_projects))
        .route("", web::post().to(create_project))
        .route("/{project_id}", web::get().to(get_project))
        .route("/{project_id}", web::put().to(update_project))
        .route("/{project_id}", web::delete().to(delete_project))
        .route(
            "/{project_id}/data-sources",
            web::get().to(get_project_data_sources),
        )
        .route(
            "/{project_id}/data-sources",
            web::post().to(create_data_source),
        )
        .route(
            "/{project_id}/reconciliation-jobs",
            web::get().to(get_reconciliation_jobs),
        )
        .route(
            "/{project_id}/reconciliation-jobs",
            web::post().to(create_reconciliation_job),
        )
        .route(
            "/{project_id}/reconciliation/view",
            web::get().to(get_project_reconciliation_view),
        )
        .route(
            "/{project_id}/files/upload",
            web::post().to(upload_file_to_project),
        )
        .route(
            "/{project_id}/members",
            web::get().to(get_project_members),
        )
        .route(
            "/{project_id}/members",
            web::post().to(add_project_member),
        )
        .route(
            "/{project_id}/members/{user_id}",
            web::delete().to(remove_project_member),
        );
}

/// Get projects endpoint
#[utoipa::path(
    get,
    path = "/api/v1/projects",
    tag = "projects",
    params(
        ("page" = Option<i32>, Query, description = "Page number (1-based)"),
        ("per_page" = Option<i32>, Query, description = "Items per page (max 100)")
    ),
    responses(
        (status = 200, description = "Projects retrieved successfully", body = ApiResponse<Vec<Project>>),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_projects(
    query: web::Query<SearchQueryParams>,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    // Try cache first
    let cache_key = format!(
        "projects:page:{}:per_page:{}",
        query.page.unwrap_or(1),
        query.per_page.unwrap_or(10)
    );

    if let Ok(Some(cached)) = cache.get::<serde_json::Value>(&cache_key).await {
        return Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some(cached),
            message: None,
            error: None,
        }));
    }

    let project_service = crate::services::project::ProjectService::new(data.get_ref().clone());

    // Support lean mode for minimal data
    let lean = query.lean.unwrap_or(false);
    
    let response = project_service
        .list_projects(
            query.page.map(|p| p as i64),
            query.per_page.map(|p| p as i64),
        )
        .await?;

    // Convert ProjectListResponse to PaginatedResponse format
    let total_pages = (response.total as f64 / response.per_page as f64).ceil() as i32;
    
    // If lean mode, return only essential fields
    if lean {
        let lean_projects: Vec<serde_json::Value> = response
            .projects
            .iter()
            .map(|p| {
                serde_json::json!({
                    "id": p.id,
                    "name": p.name,
                    "status": p.status,
                })
            })
            .collect();
        
        let paginated = crate::handlers::types::PaginatedResponse {
            items: lean_projects,
            total: response.total,
            page: response.page as i32,
            per_page: response.per_page as i32,
            total_pages,
        };
        
        return Ok(HttpResponse::Ok().json(paginated));
    }

    // Convert projects to items for PaginatedResponse
    let paginated = crate::handlers::types::PaginatedResponse {
        items: response.projects,
        total: response.total,
        page: response.page as i32,
        per_page: response.per_page as i32,
        total_pages,
    };

    // Cache the response for 5 minutes
    let response_json = serde_json::to_value(&paginated)?;
    let _ = cache
        .set(&cache_key, &response_json, Some(Duration::from_secs(300)))
        .await;

    Ok(HttpResponse::Ok().json(paginated))
}

/// Create project endpoint
pub async fn create_project(
    http_req: HttpRequest,
    req: web::Json<CreateProjectRequest>,
    data: web::Data<Database>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let project_service = crate::services::project::ProjectService::new(data.get_ref().clone());
    let caller_user_id = extract_user_id(&http_req)?;
    let is_admin =
        crate::utils::authorization::check_admin_permission(data.get_ref(), caller_user_id).is_ok();

    let request = crate::services::project::CreateProjectRequest {
        name: req.name.clone(),
        description: req.description.clone(),
        // Enforce server-side owner assignment: caller unless admin provides explicit owner_id
        owner_id: if is_admin {
            req.owner_id.unwrap_or(caller_user_id)
        } else {
            caller_user_id
        },
        status: req.status.clone(),
        settings: req.settings.clone(),
    };
    let project = project_service.create_project(request).await?;

    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(project),
        message: Some("Project created successfully".to_string()),
        error: None,
    }))
}

/// Get project endpoint
pub async fn get_project(
    path: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let project_id = path.into_inner();

    // Check authorization before accessing project
    crate::utils::check_project_permission(data.get_ref(), user_id, project_id)?;

    // Try cache first
    let cache_key = format!("project:{}", project_id);
    if let Ok(Some(cached)) = cache.get::<serde_json::Value>(&cache_key).await {
        return Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some(cached),
            message: None,
            error: None,
        }));
    }

    let project_service = crate::services::project::ProjectService::new(data.get_ref().clone());

    let project = project_service.get_project_by_id(project_id).await?;

    // Cache the response for 10 minutes
    let project_json = serde_json::to_value(&project)?;
    let _ = cache
        .set(&cache_key, &project_json, Some(Duration::from_secs(600)))
        .await;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(project),
        message: None,
        error: None,
    }))
}

/// Update project endpoint
pub async fn update_project(
    path: web::Path<Uuid>,
    req: web::Json<UpdateProjectRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let project_id = path.into_inner();

    // Check authorization before updating project
    crate::utils::check_project_permission(data.get_ref(), user_id, project_id)?;

    let project_service = crate::services::project::ProjectService::new(data.get_ref().clone());

    let request = crate::services::project::UpdateProjectRequest {
        name: req.name.clone(),
        description: req.description.clone(),
        status: req.status.clone(),
        settings: req.settings.clone(),
    };
    let project = project_service.update_project(project_id, request).await?;

    // ✅ CACHE INVALIDATION: Clear cache after project update
    cache
        .delete(&format!("project:{}", project_id))
        .await
        .unwrap_or_default();
    cache.delete("projects:*").await.unwrap_or_default();

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(project),
        message: Some("Project updated successfully".to_string()),
        error: None,
    }))
}

/// Delete project endpoint
pub async fn delete_project(
    path: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let project_id = path.into_inner();

    // Check authorization before deleting project
    crate::utils::check_project_permission(data.get_ref(), user_id, project_id)?;

    let project_service = crate::services::project::ProjectService::new(data.get_ref().clone());

    project_service.delete_project(project_id).await?;

    // ✅ CACHE INVALIDATION: Clear cache after project deletion
    cache
        .delete(&format!("project:{}", project_id))
        .await
        .unwrap_or_default();
    cache.delete("projects:*").await.unwrap_or_default();

    Ok(HttpResponse::NoContent().finish())
}

/// Get project data sources
pub async fn get_project_data_sources(
    project_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let project_id_val = project_id.into_inner();

    // Check authorization before accessing project data sources
    crate::utils::check_project_permission(data.get_ref(), user_id, project_id_val)?;

    // Try cache first (5 minute TTL)
    let cache_key = format!("data_sources:project:{}", project_id_val);
    if let Ok(Some(cached)) = cache.get::<serde_json::Value>(&cache_key).await {
        return Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some(cached),
            message: None,
            error: None,
        }));
    }

    let data_source_service =
        crate::services::data_source::DataSourceService::new(data.get_ref().clone());

    let data_sources = data_source_service
        .get_project_data_sources(project_id_val)
        .await?;

    // Cache for 5 minutes
    let data_sources_json = serde_json::to_value(&data_sources)?;
    let _ = cache
        .set(
            &cache_key,
            &data_sources_json,
            Some(Duration::from_secs(300)),
        )
        .await;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(data_sources),
        message: None,
        error: None,
    }))
}

/// Create data source
pub async fn create_data_source(
    project_id: web::Path<Uuid>,
    req: web::Json<CreateDataSourceRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    // Authorization: ensure user can create data sources for this project
    let user_id = extract_user_id(&http_req)?;
    let project_id_val = project_id.into_inner();
    crate::utils::check_project_permission(data.get_ref(), user_id, project_id_val)?;
    let data_source_service =
        crate::services::data_source::DataSourceService::new(data.get_ref().clone());

    use crate::services::data_source_config::CreateDataSourceConfig;
    let config = CreateDataSourceConfig {
        project_id: project_id_val,
        name: req.name.clone(),
        source_type: req.source_type.clone(),
        file_path: req.file_path.clone(),
        file_size: req.file_size,
        file_hash: req.file_hash.clone(),
        schema: req.schema.clone(),
    };
    let new_data_source = data_source_service
        .create_data_source(config)
        .await?;

    // ✅ CACHE INVALIDATION: Clear project and data sources cache after creation
    cache
        .delete(&format!("data_sources:project:{}", project_id_val))
        .await
        .unwrap_or_default();
    cache
        .delete(&format!("project:{}", project_id_val))
        .await
        .unwrap_or_default();

    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(new_data_source),
        message: Some("Data source created successfully".to_string()),
        error: None,
    }))
}

/// Get reconciliation aggregated view (BFF endpoint)
pub async fn get_project_reconciliation_view(
    project_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let project_id_val = project_id.into_inner();

    // Authorization
    crate::utils::check_project_permission(data.get_ref(), user_id, project_id_val)?;

    // Cache first (60s TTL)
    let cache_key = format!("project:{}:reconciliation:view", project_id_val);
    if let Ok(Some(cached)) = cache.get::<serde_json::Value>(&cache_key).await {
        return Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some(cached),
            message: None,
            error: None,
        }));
    }

    let reconciliation_service =
        crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());
    let project_service = crate::services::project::ProjectService::new(data.get_ref().clone());
    let analytics_service =
        crate::services::analytics::AnalyticsService::new(data.get_ref().clone());

    let project = project_service.get_project_by_id(project_id_val).await?;
    let jobs = reconciliation_service
        .get_project_reconciliation_jobs(project_id_val)
        .await?;
    let stats = analytics_service.get_project_stats(project_id_val).await?;

    let view = serde_json::json!({
        "project": project,
        "jobs": jobs,
        "matches_summary": {"total_results": 0},
        "stats": stats,
    });

    let _ = cache
        .set(&cache_key, &view, Some(Duration::from_secs(60)))
        .await;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(view),
        message: None,
        error: None,
    }))
}

/// Get reconciliation jobs for a project (from projects scope)
pub async fn get_reconciliation_jobs(
    project_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let project_id_val = project_id.into_inner();

    // Check authorization before accessing project jobs
    crate::utils::check_project_permission(data.get_ref(), user_id, project_id_val)?;

    // Try cache first (2 minute TTL for frequently updated data)
    let cache_key = format!("jobs:project:{}", project_id_val);
    if let Ok(Some(cached)) = cache.get::<serde_json::Value>(&cache_key).await {
        return Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some(cached),
            message: None,
            error: None,
        }));
    }

    let reconciliation_service =
        crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());

    let jobs = reconciliation_service
        .get_project_reconciliation_jobs(project_id_val)
        .await?;

    // Cache for 2 minutes
    let jobs_json = serde_json::to_value(&jobs)?;
    let _ = cache
        .set(&cache_key, &jobs_json, Some(Duration::from_secs(120)))
        .await;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(jobs),
        message: None,
        error: None,
    }))
}

/// Create reconciliation job (from projects scope)
pub async fn create_reconciliation_job(
    project_id: web::Path<Uuid>,
    req: web::Json<crate::handlers::types::CreateReconciliationJobRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let reconciliation_service =
        crate::services::reconciliation::ReconciliationService::new(data.get_ref().clone());

    // Extract user_id from request
    let user_id = extract_user_id(&http_req)?;
    let project_id_val = project_id.into_inner();

    // ✅ SECURITY FIX: Check authorization before creating job
    crate::utils::check_project_permission(data.get_ref(), user_id, project_id_val)?;

    // Extract matching_rules from settings or use defaults
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
        project_id: project_id_val,
        name: req.name.clone(),
        description: req.description.clone(),
        source_a_id: req.source_data_source_id,
        source_b_id: req.target_data_source_id,
        confidence_threshold: req.confidence_threshold,
        matching_rules,
    };

    // ✅ ERROR TRANSLATION: Translate errors to user-friendly messages
    let error_service = crate::services::error_translation::ErrorTranslationService::new();
    let context = crate::services::error_translation::ErrorContextBuilder::new()
        .user_id(user_id)
        .project_id(project_id_val)
        .action("create_reconciliation_job")
        .resource_type("reconciliation_job")
        .build();

    let result = reconciliation_service
        .create_reconciliation_job(user_id, request)
        .await;

    let new_job = match result {
        Ok(job) => job,
        Err(error) => {
            let friendly_error = error_service.translate_error(
                &error.to_string(),
                context,
                Some("Failed to create reconciliation job".to_string()),
            );
            return Err(AppError::InternalServerError(friendly_error.message));
        }
    };

    // ✅ CACHE INVALIDATION: Clear cache after job creation
    cache
        .delete(&format!("jobs:project:{}", project_id_val))
        .await
        .unwrap_or_default();
    cache
        .delete(&format!("project:{}", project_id_val))
        .await
        .unwrap_or_default();

    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(new_job),
        message: Some("Reconciliation job created successfully".to_string()),
        error: None,
    }))
}

/// Upload file to project endpoint (REST compliant - uses path parameter)
#[utoipa::path(
    post,
    path = "/api/v1/projects/{project_id}/files/upload",
    tag = "projects",
    params(
        ("project_id" = Uuid, Path, description = "Project ID")
    ),
    request_body(content = inline(FileUploadRequest), content_type = "multipart/form-data"),
    responses(
        (status = 201, description = "File uploaded successfully", body = ApiResponse<UploadedFile>),
        (status = 400, description = "Invalid request", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden", body = ErrorResponse),
        (status = 422, description = "Validation error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn upload_file_to_project(
    project_id: web::Path<Uuid>,
    payload: Multipart,
    req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let project_id_val = project_id.into_inner();

    // Extract user_id from request
    let user_id = extract_user_id(&req)?;

    // ✅ SECURITY: Check authorization before allowing upload
    check_project_permission(data.get_ref(), user_id, project_id_val)?;

    let file_service =
        crate::services::file::FileService::new(data.get_ref().clone(), config.upload_path.clone());

    let file_info = file_service
        .upload_file(payload, project_id_val, user_id)
        .await?;

    // ✅ CACHE INVALIDATION: Clear project cache after file upload
    cache
        .delete(&format!("project:{}", project_id_val))
        .await
        .unwrap_or_default();
    cache
        .delete(&format!("files:project:{}", project_id_val))
        .await
        .unwrap_or_default();

    // REST compliant: Return 201 Created with Location header
    let location = format!("/api/v1/files/{}", file_info.id);
    Ok(HttpResponse::Created()
        .append_header((actix_web::http::header::LOCATION, location))
        .json(ApiResponse {
            success: true,
            data: Some(file_info),
            message: Some("File uploaded successfully".to_string()),
            error: None,
        }))
}

/// Get project members
/// 
/// Retrieves a paginated list of project members.
#[utoipa::path(
    get,
    path = "/api/v1/projects/{project_id}/members",
    tag = "projects",
    params(
        ("project_id" = Uuid, Path, description = "Project ID"),
        ("page" = Option<i32>, Query, description = "Page number (1-based)"),
        ("per_page" = Option<i32>, Query, description = "Items per page (max 100)")
    ),
    responses(
        (status = 200, description = "Project members retrieved successfully", body = PaginatedResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse),
        (status = 404, description = "Project not found", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_project_members(
    project_id: web::Path<Uuid>,
    query: web::Query<SearchQueryParams>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let project_id_val = project_id.into_inner();

    // Check authorization
    crate::utils::check_project_permission(data.get_ref(), user_id, project_id_val)?;

    // Try cache first
    let cache_key = format!(
        "project:{}:members:page:{}:per_page:{}",
        project_id_val,
        query.page.unwrap_or(1),
        query.per_page.unwrap_or(10)
    );
    if let Ok(Some(cached)) = cache.get::<serde_json::Value>(&cache_key).await {
        return Ok(HttpResponse::Ok().json(cached));
    }

    let page = query.page.unwrap_or(1) as i64;
    let per_page = query.per_page.unwrap_or(10).min(100) as i64;
    let offset = (page - 1) * per_page;

    use crate::models::schema::{project_members, users};
    use diesel::prelude::*;
    let mut conn = data.get_connection()?;

    // Get total count
    let total: i64 = project_members::table
        .filter(project_members::project_id.eq(project_id_val))
        .filter(project_members::is_active.eq(true))
        .count()
        .get_result(&mut conn)
        .map_err(AppError::Database)?;

    // Get members
    let members = project_members::table
        .filter(project_members::project_id.eq(project_id_val))
        .filter(project_members::is_active.eq(true))
        .order(project_members::joined_at.desc())
        .limit(per_page)
        .offset(offset)
        .load::<crate::models::ProjectMember>(&mut conn)
        .map_err(AppError::Database)?;

    // Get user details for each member
    let mut items: Vec<serde_json::Value> = Vec::new();
    for member in members {
        // Get user details
        let user = users::table
            .find(member.user_id)
            .first::<crate::models::User>(&mut conn)
            .optional()
            .map_err(AppError::Database)?;
        
        let user_json = if let Some(u) = user {
            serde_json::json!({
                "id": u.id,
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
            })
        } else {
            serde_json::json!({
                "id": member.user_id,
                "email": null,
                "first_name": null,
                "last_name": null,
            })
        };

        items.push(serde_json::json!({
            "id": member.id,
            "project_id": member.project_id,
            "user_id": member.user_id,
            "user": user_json,
            "role": member.role,
            "permissions": member.permissions,
            "joined_at": member.joined_at,
            "invited_by": member.invited_by,
            "is_active": member.is_active,
            "created_at": member.created_at,
            "updated_at": member.updated_at,
        }));
    }

    let total_pages = (total as f64 / per_page as f64).ceil() as i32;
    let response = PaginatedResponse {
        items,
        total,
        page: page as i32,
        per_page: per_page as i32,
        total_pages,
    };

    // Cache for 5 minutes
    let response_json = serde_json::to_value(&response)?;
    let _ = cache
        .set(&cache_key, &response_json, Some(Duration::from_secs(300)))
        .await;

    Ok(HttpResponse::Ok().json(response))
}

/// Add project member
/// 
/// Adds a new member to the project.
#[utoipa::path(
    post,
    path = "/api/v1/projects/{project_id}/members",
    tag = "projects",
    params(
        ("project_id" = Uuid, Path, description = "Project ID")
    ),
    request_body = AddProjectMemberRequest,
    responses(
        (status = 201, description = "Member added successfully", body = ApiResponse),
        (status = 400, description = "Invalid request", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access or insufficient permissions", body = ErrorResponse),
        (status = 404, description = "Project or user not found", body = ErrorResponse),
        (status = 409, description = "User is already a member", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn add_project_member(
    project_id: web::Path<Uuid>,
    req: web::Json<AddProjectMemberRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let project_id_val = project_id.into_inner();

    // Check authorization - user must have project access
    crate::utils::check_project_permission(data.get_ref(), user_id, project_id_val)?;

    // Validate user exists
    use crate::models::schema::{project_members, users};
    use diesel::prelude::*;
    let mut conn = data.get_connection()?;
    let user_exists = users::table
        .filter(users::id.eq(req.user_id))
        .count()
        .get_result::<i64>(&mut conn)
        .map_err(AppError::Database)?;

    if user_exists == 0 {
        return Err(AppError::NotFound("User not found".to_string()));
    }

    // Check if user is already a member
    let existing_member = project_members::table
        .filter(project_members::project_id.eq(project_id_val))
        .filter(project_members::user_id.eq(req.user_id))
        .filter(project_members::is_active.eq(true))
        .first::<crate::models::ProjectMember>(&mut conn)
        .optional()
        .map_err(AppError::Database)?;

    if existing_member.is_some() {
        return Err(AppError::Conflict("User is already a member of this project".to_string()));
    }

    // Create new member
    let new_member = crate::models::NewProjectMember {
        project_id: project_id_val,
        user_id: req.user_id,
        role: req.role.clone(),
        permissions: req.permissions.clone().unwrap_or_else(|| serde_json::json!({})),
        invited_by: user_id,
        is_active: true,
    };

    let member: crate::models::ProjectMember = diesel::insert_into(project_members::table)
        .values(&new_member)
        .get_result(&mut conn)
        .map_err(AppError::Database)?;

    // Invalidate cache
    cache
        .delete(&format!("project:{}:members:*", project_id_val))
        .await
        .unwrap_or_default();
    cache
        .delete(&format!("project:{}", project_id_val))
        .await
        .unwrap_or_default();

    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "id": member.id,
            "project_id": member.project_id,
            "user_id": member.user_id,
            "role": member.role,
            "permissions": member.permissions,
            "joined_at": member.joined_at,
            "invited_by": member.invited_by,
            "is_active": member.is_active,
        })),
        message: Some("Member added successfully".to_string()),
        error: None,
    }))
}

/// Remove project member
/// 
/// Removes a member from the project.
#[utoipa::path(
    delete,
    path = "/api/v1/projects/{project_id}/members/{user_id}",
    tag = "projects",
    params(
        ("project_id" = Uuid, Path, description = "Project ID"),
        ("user_id" = Uuid, Path, description = "User ID")
    ),
    responses(
        (status = 204, description = "Member removed successfully"),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access or insufficient permissions", body = ErrorResponse),
        (status = 404, description = "Project or member not found", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn remove_project_member(
    path: web::Path<(Uuid, Uuid)>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    _config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let (project_id, member_user_id) = path.into_inner();

    // Check authorization
    crate::utils::check_project_permission(data.get_ref(), user_id, project_id)?;

    // Prevent removing project owner
    use crate::models::schema::projects;
    use diesel::prelude::*;
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

    if project.owner_id == member_user_id {
        return Err(AppError::Validation("Cannot remove project owner".to_string()));
    }

    // Soft delete: set is_active to false
    use crate::models::schema::project_members;
    let updated = diesel::update(
        project_members::table
            .filter(project_members::project_id.eq(project_id))
            .filter(project_members::user_id.eq(member_user_id))
            .filter(project_members::is_active.eq(true)),
    )
    .set(project_members::is_active.eq(false))
    .execute(&mut conn)
    .map_err(AppError::Database)?;

    if updated == 0 {
        return Err(AppError::NotFound("Member not found".to_string()));
    }

    // Invalidate cache
    cache
        .delete(&format!("project:{}:members:*", project_id))
        .await
        .unwrap_or_default();
    cache
        .delete(&format!("project:{}", project_id))
        .await
        .unwrap_or_default();

    Ok(HttpResponse::NoContent().finish())
}

/// Archive project
/// 
/// Archives a project by setting its status to 'archived'.
#[utoipa::path(
    post,
    path = "/api/v1/projects/{project_id}/archive",
    tag = "projects",
    params(
        ("project_id" = Uuid, Path, description = "Project ID")
    ),
    responses(
        (status = 200, description = "Project archived successfully", body = ApiResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse),
        (status = 404, description = "Project not found", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn archive_project(
    project_id: web::Path<Uuid>,
    req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let project_id_val = project_id.into_inner();
    let user_id = extract_user_id(&req)?;
    check_project_permission(data.get_ref(), user_id, project_id_val)?;
    
    use crate::models::schema::projects;
    use diesel::prelude::*;
    let mut conn = data.get_connection()?;

    // Update project status to archived
    diesel::update(projects::table.find(project_id_val))
        .set(projects::status.eq("archived"))
        .execute(&mut conn)
        .map_err(AppError::Database)?;

    // Get updated project
    let project = projects::table
        .find(project_id_val)
        .first::<crate::models::Project>(&mut conn)
        .map_err(AppError::Database)?;
    
    // Invalidate cache
    cache.delete(&format!("project:{}", project_id_val)).await.unwrap_or_default();
    cache.delete("projects:*").await.unwrap_or_default();
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "id": project.id,
            "name": project.name,
            "status": project.status,
        })),
        message: Some("Project archived successfully".to_string()),
        error: None,
    }))
}

/// Restore project
/// 
/// Restores an archived project by setting its status to 'active'.
#[utoipa::path(
    post,
    path = "/api/v1/projects/{project_id}/restore",
    tag = "projects",
    params(
        ("project_id" = Uuid, Path, description = "Project ID")
    ),
    responses(
        (status = 200, description = "Project restored successfully", body = ApiResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 403, description = "Forbidden - no project access", body = ErrorResponse),
        (status = 404, description = "Project not found", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn restore_project(
    project_id: web::Path<Uuid>,
    req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let project_id_val = project_id.into_inner();
    let user_id = extract_user_id(&req)?;
    check_project_permission(data.get_ref(), user_id, project_id_val)?;
    
    use crate::models::schema::projects;
    use diesel::prelude::*;
    let mut conn = data.get_connection()?;

    // Update project status to active
    diesel::update(projects::table.find(project_id_val))
        .set(projects::status.eq("active"))
        .execute(&mut conn)
        .map_err(AppError::Database)?;

    // Get updated project
    let project = projects::table
        .find(project_id_val)
        .first::<crate::models::Project>(&mut conn)
        .map_err(AppError::Database)?;
    
    // Invalidate cache
    cache.delete(&format!("project:{}", project_id_val)).await.unwrap_or_default();
    cache.delete("projects:*").await.unwrap_or_default();
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "id": project.id,
            "name": project.name,
            "status": project.status,
        })),
        message: Some("Project restored successfully".to_string()),
        error: None,
    }))
}

/// Get project settings
pub async fn get_project_settings(
    project_id: web::Path<Uuid>,
    req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let project_id_val = project_id.into_inner();
    let user_id = extract_user_id(&req)?;
    check_project_permission(data.get_ref(), user_id, project_id_val)?;
    
    // TODO: Implement settings retrieval from database
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({})),
        message: None,
        error: None,
    }))
}

/// Update project settings
pub async fn update_project_settings(
    project_id: web::Path<Uuid>,
    req: web::Json<serde_json::Value>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let project_id_val = project_id.into_inner();
    let user_id = extract_user_id(&http_req)?;
    check_project_permission(data.get_ref(), user_id, project_id_val)?;
    
    // TODO: Implement settings update in database
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(req.into_inner()),
        message: Some("Settings updated successfully".to_string()),
        error: None,
    }))
}

/// Get project analytics
pub async fn get_project_analytics(
    project_id: web::Path<Uuid>,
    req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let project_id_val = project_id.into_inner();
    let user_id = extract_user_id(&req)?;
    check_project_permission(data.get_ref(), user_id, project_id_val)?;
    
    // TODO: Implement analytics retrieval (can use existing analytics service)
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "jobs_count": 0,
            "files_count": 0,
            "matches_count": 0
        })),
        message: None,
        error: None,
    }))
}

// Note: get_project_members, add_project_member, and remove_project_member
// are already implemented above (lines 675-1000)
