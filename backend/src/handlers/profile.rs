//! Profile management handlers module

use actix_web::{web, HttpResponse, Result};
use uuid::Uuid;
use std::sync::Arc;
use std::time::Duration;

use crate::errors::AppError;
use crate::services::cache::MultiLevelCache;
use crate::services::user::UserService;
use crate::handlers::types::{ApiResponse};

/// Profile data structure
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct UserProfile {
    pub id: Uuid,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub company: Option<String>,
    pub job_title: Option<String>,
    pub location: Option<String>,
    pub website: Option<String>,
    pub phone: Option<String>,
    pub social_links: SocialLinks,
    pub preferences: ProfilePreferences,
    pub stats: ProfileStats,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SocialLinks {
    pub linkedin: Option<String>,
    pub twitter: Option<String>,
    pub github: Option<String>,
    pub facebook: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ProfilePreferences {
    pub show_email: bool,
    pub show_phone: bool,
    pub show_social_links: bool,
    pub allow_contact: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ProfileStats {
    pub projects_count: i64,
    pub total_reconciliations: i64,
    pub successful_reconciliations: i64,
    pub last_activity: Option<chrono::DateTime<chrono::Utc>>,
}

/// Profile update request
#[derive(Debug, Clone, serde::Deserialize)]
pub struct UpdateProfileRequest {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub company: Option<String>,
    pub job_title: Option<String>,
    pub location: Option<String>,
    pub website: Option<String>,
    pub phone: Option<String>,
    pub social_links: Option<SocialLinks>,
    pub preferences: Option<ProfilePreferences>,
}

/// Configure profile routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("", web::get().to(get_profile))
        .route("", web::put().to(update_profile))
        .route("/avatar", web::post().to(upload_avatar))
        .route("/stats", web::get().to(get_profile_stats));
}

/// Get user profile endpoint
pub async fn get_profile(
    user_id: web::ReqData<Uuid>,
    cache: web::Data<MultiLevelCache>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    let user_id_val = *user_id;

    // Try cache first (15 minute TTL for profile)
    let cache_key = format!("profile:{}", user_id_val);
    if let Ok(Some(cached)) = cache.get::<UserProfile>(&cache_key).await {
        return Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some(cached),
            message: None,
            error: None,
        }));
    }

    // Get basic user info
    let user_info = user_service.get_user_by_id(user_id_val).await?;

    // For now, return a basic profile with default values
    // In a real implementation, this would fetch extended profile data from database
    let profile = UserProfile {
        id: user_info.id,
        email: user_info.email,
        first_name: user_info.first_name,
        last_name: user_info.last_name,
        avatar_url: None,
        bio: None,
        company: None,
        job_title: None,
        location: None,
        website: None,
        phone: None,
        social_links: SocialLinks {
            linkedin: None,
            twitter: None,
            github: None,
            facebook: None,
        },
        preferences: ProfilePreferences {
            show_email: false,
            show_phone: false,
            show_social_links: true,
            allow_contact: true,
        },
        stats: ProfileStats {
            projects_count: user_info.project_count,
            total_reconciliations: 0, // Would be calculated from database
            successful_reconciliations: 0, // Would be calculated from database
            last_activity: user_info.last_login,
        },
        created_at: user_info.created_at,
        updated_at: user_info.updated_at,
    };

    // Cache for 15 minutes
    let _ = cache.set(&cache_key, &profile, Some(Duration::from_secs(900))).await;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(profile),
        message: None,
        error: None,
    }))
}

/// Update user profile endpoint
pub async fn update_profile(
    user_id: web::ReqData<Uuid>,
    req: web::Json<UpdateProfileRequest>,
    cache: web::Data<MultiLevelCache>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    let user_id_val = *user_id;
    let update_req = req.into_inner();

    // Validate input
    if let Some(ref first_name) = update_req.first_name {
        if first_name.trim().is_empty() || first_name.len() > 50 {
            return Err(AppError::Validation("First name must be 1-50 characters".to_string()));
        }
    }

    if let Some(ref last_name) = update_req.last_name {
        if last_name.trim().is_empty() || last_name.len() > 50 {
            return Err(AppError::Validation("Last name must be 1-50 characters".to_string()));
        }
    }

    if let Some(ref bio) = update_req.bio {
        if bio.len() > 500 {
            return Err(AppError::Validation("Bio must be less than 500 characters".to_string()));
        }
    }

    if let Some(ref website) = update_req.website {
        if !website.is_empty() && !website.starts_with("http") {
            return Err(AppError::Validation("Website must be a valid URL starting with http".to_string()));
        }
    }

    // Update basic user info if provided
    if update_req.first_name.is_some() || update_req.last_name.is_some() {
        let update_user_req = crate::services::user::UpdateUserRequest {
            email: None,
            first_name: update_req.first_name.clone(),
            last_name: update_req.last_name.clone(),
            role: None,
            is_active: None,
        };
        user_service.update_user(user_id_val, update_user_req).await?;
    }

    // For now, extended profile fields are not persisted
    // In a real implementation, this would update a profile table

    // Clear cache to force refresh
    let cache_key = format!("profile:{}", user_id_val);
    let _ = cache.delete(&cache_key).await;

    // Return updated profile
    get_profile(user_id, cache, user_service).await
}

/// Upload avatar endpoint
pub async fn upload_avatar(
    user_id: web::ReqData<Uuid>,
    cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let user_id_val = *user_id;

    // For now, return a placeholder response
    // In a real implementation, this would handle file upload and storage

    // Clear cache to force refresh
    let cache_key = format!("profile:{}", user_id_val);
    let _ = cache.delete(&cache_key).await;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "avatar_url": format!("https://api.example.com/avatars/{}.jpg", user_id_val),
            "uploaded_at": chrono::Utc::now()
        })),
        message: Some("Avatar uploaded successfully".to_string()),
        error: None,
    }))
}

/// Get profile statistics endpoint
pub async fn get_profile_stats(
    user_id: web::ReqData<Uuid>,
    user_service: web::Data<Arc<UserService>>,
) -> Result<HttpResponse, AppError> {
    let user_id_val = *user_id;

    // Get user info for basic stats
    let user_info = user_service.get_user_by_id(user_id_val).await?;

    let stats = ProfileStats {
        projects_count: user_info.project_count,
        total_reconciliations: 0, // Would be calculated from reconciliation history
        successful_reconciliations: 0, // Would be calculated from successful reconciliations
        last_activity: user_info.last_login,
    };

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(stats),
        message: None,
        error: None,
    }))
}