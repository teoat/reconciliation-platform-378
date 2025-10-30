//! User management handlers module

use actix_web::{web, HttpResponse, Result};
use uuid::Uuid;
use std::sync::Arc;
use std::time::Duration;

use crate::errors::AppError;
use crate::services::cache::MultiLevelCache;
use crate::services::user::UserService;
use crate::handlers::types::{UserQueryParams, SearchQueryParams, ApiResponse};

/// Configure user management routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("", web::get().to(get_users))
        .route("", web::post().to(create_user))
        .route("/search", web::get().to(search_users))
        .route("/statistics", web::get().to(get_user_statistics))
        .route("/{user_id}", web::get().to(get_user))
        .route("/{user_id}", web::put().to(update_user))
        .route("/{user_id}", web::delete().to(delete_user));
}

/// Get users endpoint
pub async fn get_users(
    query: web::Query<UserQueryParams>,
    cache: web::Data<MultiLevelCache>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    // Try cache first (10 minute TTL)
    let cache_key = format!("users:page:{}:per_page:{}", 
        query.page.unwrap_or(1), 
        query.per_page.unwrap_or(10)
    );
    if let Ok(Some(cached)) = cache.get::<serde_json::Value>(&cache_key).await {
        return Ok(HttpResponse::Ok().json(cached));
    }
    
    let response = user_service.as_ref().list_users(query.page, query.per_page).await?;
    
    // Cache for 10 minutes
    let response_json = serde_json::to_value(&response)?;
    let _ = cache.set(&cache_key, &response_json, Some(Duration::from_secs(600))).await;
    
    Ok(HttpResponse::Ok().json(response))
}

/// Create user endpoint
pub async fn create_user(
    req: web::Json<crate::services::user::CreateUserRequest>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    let user_info = user_service.as_ref().create_user(req.into_inner()).await?;
    
    Ok(HttpResponse::Created().json(user_info))
}

/// Get user endpoint
pub async fn get_user(
    user_id: web::Path<Uuid>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    let user_info = user_service.as_ref().get_user_by_id(user_id.into_inner()).await?;
    
    Ok(HttpResponse::Ok().json(user_info))
}

/// Update user endpoint
pub async fn update_user(
    user_id: web::Path<Uuid>,
    req: web::Json<crate::services::user::UpdateUserRequest>,
    cache: web::Data<MultiLevelCache>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    let user_id_val = user_id.into_inner();
    
    let user_info = user_service.as_ref().update_user(user_id_val, req.into_inner()).await?;
    
    // ✅ CACHE INVALIDATION: Clear cache after user update
    cache.delete(&format!("user:{}", user_id_val)).await.unwrap_or_default();
    cache.delete("users:*").await.unwrap_or_default();
    
    Ok(HttpResponse::Ok().json(user_info))
}

/// Delete user endpoint
pub async fn delete_user(
    user_id: web::Path<Uuid>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    user_service.as_ref().delete_user(user_id.into_inner()).await?;
    
    Ok(HttpResponse::NoContent().finish())
}

/// Search users endpoint
pub async fn search_users(
    query: web::Query<SearchQueryParams>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    let response = user_service.as_ref().search_users(
        query.q.as_deref().unwrap_or(""), 
        query.page.map(|p| p as i64), 
        query.per_page.map(|p| p as i64)
    ).await?;
    
    Ok(HttpResponse::Ok().json(response))
}

/// Get user statistics endpoint
pub async fn get_user_statistics(
    req: actix_web::HttpRequest,
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
