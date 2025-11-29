//! User management handlers module

use actix_web::{web, HttpRequest, HttpResponse, Result};
use std::sync::Arc;
use std::time::Duration;
use uuid::Uuid;

use crate::database::Database;
use crate::errors::AppError;
use crate::handlers::types::{ApiResponse, SearchQueryParams, UserQueryParams};
use crate::services::cache::MultiLevelCache;
use crate::services::user::UserService;

/// Configure user management routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(get_users))
        .route("", web::post().to(create_user))
        .route("/search", web::get().to(search_users))
        .route("/statistics", web::get().to(get_user_statistics))
        .route("/{user_id}", web::get().to(get_user))
        .route("/{user_id}", web::put().to(update_user))
        .route("/{user_id}", web::delete().to(delete_user))
        .route(
            "/{user_id}/preferences",
            web::get().to(get_user_preferences),
        )
        .route(
            "/{user_id}/preferences",
            web::put().to(update_user_preferences),
        )
        .route("/roles", web::get().to(get_roles))
        .route("/permissions", web::get().to(get_permissions))
        .route("/{user_id}/activity", web::get().to(get_user_activity));
}

/// Get users endpoint
/// 
/// Retrieves a paginated list of users with optional filtering.
#[utoipa::path(
    get,
    path = "/api/v1/users",
    tag = "Users",
    params(
        ("page" = Option<i64>, Query, description = "Page number (1-based)"),
        ("per_page" = Option<i64>, Query, description = "Items per page (max 100)")
    ),
    responses(
        (status = 200, description = "Users retrieved successfully", body = PaginatedResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_users(
    query: web::Query<UserQueryParams>,
    cache: web::Data<MultiLevelCache>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    // Try cache first (10 minute TTL)
    let cache_key = format!(
        "users:page:{}:per_page:{}",
        query.page.unwrap_or(1),
        query.per_page.unwrap_or(10)
    );
    if let Ok(Some(cached)) = cache.get::<serde_json::Value>(&cache_key).await {
        return Ok(HttpResponse::Ok().json(cached));
    }

    let response = user_service
        .as_ref()
        .list_users(query.page, query.per_page)
        .await?;

    // Convert UserListResponse to PaginatedResponse format
    let total_pages = (response.total as f64 / response.per_page as f64).ceil() as i32;
    let paginated = crate::handlers::types::PaginatedResponse {
        items: response.users,
        total: response.total,
        page: response.page as i32,
        per_page: response.per_page as i32,
        total_pages,
    };

    // Cache for 10 minutes
    let response_json = serde_json::to_value(&paginated)?;
    let _ = cache
        .set(&cache_key, &response_json, Some(Duration::from_secs(600)))
        .await;

    Ok(HttpResponse::Ok().json(paginated))
}

/// Create user endpoint
/// 
/// Creates a new user account with the provided information.
#[utoipa::path(
    post,
    path = "/api/v1/users",
    tag = "Users",
    request_body = CreateUserRequest,
    responses(
        (status = 201, description = "User created successfully", body = User),
        (status = 400, description = "Invalid request data", body = ErrorResponse),
        (status = 409, description = "User already exists", body = ErrorResponse),
        (status = 422, description = "Validation error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn create_user(
    req: web::Json<crate::services::user::CreateUserRequest>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    let user_info = user_service.as_ref().create_user(req.into_inner()).await?;

    Ok(HttpResponse::Created().json(user_info))
}

/// Get user endpoint
/// 
/// Retrieves a specific user by ID.
#[utoipa::path(
    get,
    path = "/api/v1/users/{user_id}",
    tag = "Users",
    params(
        ("user_id" = Uuid, Path, description = "User ID")
    ),
    responses(
        (status = 200, description = "User retrieved successfully", body = User),
        (status = 404, description = "User not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_user(
    user_id: web::Path<Uuid>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    let user_info = user_service
        .as_ref()
        .get_user_by_id(user_id.into_inner())
        .await?;

    Ok(HttpResponse::Ok().json(user_info))
}

/// Update user endpoint
/// 
/// Updates an existing user's information.
#[utoipa::path(
    put,
    path = "/api/v1/users/{user_id}",
    tag = "Users",
    params(
        ("user_id" = Uuid, Path, description = "User ID")
    ),
    request_body = UpdateUserRequest,
    responses(
        (status = 200, description = "User updated successfully", body = User),
        (status = 404, description = "User not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 422, description = "Validation error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn update_user(
    user_id: web::Path<Uuid>,
    req: web::Json<crate::services::user::UpdateUserRequest>,
    cache: web::Data<MultiLevelCache>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    let user_id_val = user_id.into_inner();

    let user_info = user_service
        .as_ref()
        .update_user(user_id_val, req.into_inner())
        .await?;

    // ✅ CACHE INVALIDATION: Clear cache after user update
    cache
        .delete(&format!("user:{}", user_id_val))
        .await
        .unwrap_or_default();
    cache.delete("users:*").await.unwrap_or_default();

    Ok(HttpResponse::Ok().json(user_info))
}

/// Delete user endpoint
/// 
/// Deletes a user account permanently.
#[utoipa::path(
    delete,
    path = "/api/v1/users/{user_id}",
    tag = "Users",
    params(
        ("user_id" = Uuid, Path, description = "User ID")
    ),
    responses(
        (status = 204, description = "User deleted successfully"),
        (status = 404, description = "User not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn delete_user(
    user_id: web::Path<Uuid>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    user_service
        .as_ref()
        .delete_user(user_id.into_inner())
        .await?;

    Ok(HttpResponse::NoContent().finish())
}

/// Search users endpoint
/// 
/// Searches for users by query string with pagination.
#[utoipa::path(
    get,
    path = "/api/v1/users/search",
    tag = "Users",
    params(
        ("q" = Option<String>, Query, description = "Search query"),
        ("page" = Option<i32>, Query, description = "Page number (1-based)"),
        ("per_page" = Option<i32>, Query, description = "Items per page (max 100)")
    ),
    responses(
        (status = 200, description = "Search results retrieved", body = PaginatedResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn search_users(
    query: web::Query<SearchQueryParams>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    let response = user_service
        .as_ref()
        .search_users(
            query.q.as_deref().unwrap_or(""),
            query.page.map(|p| p as i64),
            query.per_page.map(|p| p as i64),
        )
        .await?;

    // Convert UserListResponse to PaginatedResponse format
    let total_pages = (response.total as f64 / response.per_page as f64).ceil() as i32;
    let paginated = crate::handlers::types::PaginatedResponse {
        items: response.users,
        total: response.total,
        page: response.page as i32,
        per_page: response.per_page as i32,
        total_pages,
    };

    Ok(HttpResponse::Ok().json(paginated))
}

/// Get user statistics endpoint
/// 
/// Retrieves aggregated user statistics.
#[utoipa::path(
    get,
    path = "/api/v1/users/statistics",
    tag = "Users",
    responses(
        (status = 200, description = "Statistics retrieved successfully", body = ApiResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_user_statistics(
    _req: actix_web::HttpRequest,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    let stats = user_service.as_ref().get_user_statistics().await?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(stats),
        message: None,
        error: None,
    }))
}

/// Get user preferences endpoint
/// 
/// Retrieves user preferences by user ID.
#[utoipa::path(
    get,
    path = "/api/v1/users/{user_id}/preferences",
    tag = "Users",
    params(
        ("user_id" = Uuid, Path, description = "User ID")
    ),
    responses(
        (status = 200, description = "Preferences retrieved successfully", body = ApiResponse),
        (status = 404, description = "User not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_user_preferences(
    user_id: web::Path<Uuid>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    let preferences = user_service
        .as_ref()
        .get_user_preferences(user_id.into_inner())
        .await?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(preferences),
        message: None,
        error: None,
    }))
}

/// Update user preferences endpoint
/// 
/// Updates user preferences.
#[utoipa::path(
    put,
    path = "/api/v1/users/{user_id}/preferences",
    tag = "Users",
    params(
        ("user_id" = Uuid, Path, description = "User ID")
    ),
    request_body = UserPreferences,
    responses(
        (status = 200, description = "Preferences updated successfully", body = ApiResponse),
        (status = 404, description = "User not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 422, description = "Validation error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn update_user_preferences(
    user_id: web::Path<Uuid>,
    req: web::Json<crate::services::user::preferences::UserPreferences>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    let user_id_val = user_id.into_inner();
    let preferences = user_service
        .as_ref()
        .update_user_preferences(user_id_val, req.into_inner())
        .await?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(preferences),
        message: Some("Preferences updated successfully".to_string()),
        error: None,
    }))
}

/// Get available roles
/// 
/// Returns a list of all available user roles with their permissions.
#[utoipa::path(
    get,
    path = "/api/v1/users/roles",
    tag = "Users",
    responses(
        (status = 200, description = "Roles retrieved successfully", body = ApiResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_roles(
    _http_req: HttpRequest,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    use crate::services::auth::roles::RoleManager;
    
    let roles = vec![
        serde_json::json!({
            "id": "admin",
            "name": "Administrator",
            "description": "Full system access with all permissions",
            "permissions": RoleManager::get_user_permissions("admin")
        }),
        serde_json::json!({
            "id": "manager",
            "name": "Manager",
            "description": "Can manage projects and reconciliation jobs",
            "permissions": RoleManager::get_user_permissions("manager")
        }),
        serde_json::json!({
            "id": "user",
            "name": "User",
            "description": "Standard user with read and create permissions",
            "permissions": RoleManager::get_user_permissions("user")
        }),
        serde_json::json!({
            "id": "viewer",
            "name": "Viewer",
            "description": "Read-only access to projects and reconciliation",
            "permissions": RoleManager::get_user_permissions("viewer")
        }),
    ];
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(roles),
        message: None,
        error: None,
    }))
}

/// Get available permissions
/// 
/// Returns a list of all available permissions organized by resource.
#[utoipa::path(
    get,
    path = "/api/v1/users/permissions",
    tag = "Users",
    responses(
        (status = 200, description = "Permissions retrieved successfully", body = ApiResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_permissions(
    _http_req: HttpRequest,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let permissions = vec![
        // Users permissions
        serde_json::json!({
            "id": "users:create",
            "name": "Create Users",
            "resource": "users",
            "action": "create",
            "description": "Create new user accounts"
        }),
        serde_json::json!({
            "id": "users:read",
            "name": "Read Users",
            "resource": "users",
            "action": "read",
            "description": "View user information"
        }),
        serde_json::json!({
            "id": "users:update",
            "name": "Update Users",
            "resource": "users",
            "action": "update",
            "description": "Modify user information"
        }),
        serde_json::json!({
            "id": "users:delete",
            "name": "Delete Users",
            "resource": "users",
            "action": "delete",
            "description": "Remove user accounts"
        }),
        // Projects permissions
        serde_json::json!({
            "id": "projects:create",
            "name": "Create Projects",
            "resource": "projects",
            "action": "create",
            "description": "Create new projects"
        }),
        serde_json::json!({
            "id": "projects:read",
            "name": "Read Projects",
            "resource": "projects",
            "action": "read",
            "description": "View project information"
        }),
        serde_json::json!({
            "id": "projects:update",
            "name": "Update Projects",
            "resource": "projects",
            "action": "update",
            "description": "Modify project information"
        }),
        serde_json::json!({
            "id": "projects:delete",
            "name": "Delete Projects",
            "resource": "projects",
            "action": "delete",
            "description": "Remove projects"
        }),
        // Reconciliation permissions
        serde_json::json!({
            "id": "reconciliation:create",
            "name": "Create Reconciliation Jobs",
            "resource": "reconciliation",
            "action": "create",
            "description": "Create new reconciliation jobs"
        }),
        serde_json::json!({
            "id": "reconciliation:read",
            "name": "Read Reconciliation",
            "resource": "reconciliation",
            "action": "read",
            "description": "View reconciliation jobs and results"
        }),
        serde_json::json!({
            "id": "reconciliation:update",
            "name": "Update Reconciliation",
            "resource": "reconciliation",
            "action": "update",
            "description": "Modify reconciliation jobs"
        }),
        serde_json::json!({
            "id": "reconciliation:delete",
            "name": "Delete Reconciliation",
            "resource": "reconciliation",
            "action": "delete",
            "description": "Remove reconciliation jobs"
        }),
        // Analytics permissions
        serde_json::json!({
            "id": "analytics:read",
            "name": "Read Analytics",
            "resource": "analytics",
            "action": "read",
            "description": "View analytics and reports"
        }),
        // System permissions
        serde_json::json!({
            "id": "system:admin",
            "name": "System Administration",
            "resource": "system",
            "action": "admin",
            "description": "Full system administration access"
        }),
    ];
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(permissions),
        message: None,
        error: None,
    }))
}

/// Get user activity
pub async fn get_user_activity(
    user_id: web::Path<Uuid>,
    query: web::Query<SearchQueryParams>,
    _http_req: actix_web::HttpRequest,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let _user_id_val = user_id.into_inner();
    
    // TODO: Implement activity log retrieval from database
    let activities: Vec<serde_json::Value> = vec![];
    let total_pages = 0;
    
    let paginated = crate::handlers::types::PaginatedResponse {
        items: activities,
        total: 0,
        page: query.page.unwrap_or(1),
        per_page: query.per_page.unwrap_or(20),
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}
