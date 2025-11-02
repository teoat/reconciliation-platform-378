//! Settings management handlers module

use actix_web::{web, HttpResponse, Result};
use uuid::Uuid;
use std::sync::Arc;
use std::time::Duration;

use crate::errors::AppError;
use crate::services::cache::MultiLevelCache;
use crate::handlers::types::{ApiResponse};

/// Settings data structure
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct UserSettings {
    pub theme: String,
    pub language: String,
    pub timezone: String,
    pub notifications: NotificationSettings,
    pub privacy: PrivacySettings,
    pub display: DisplaySettings,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct NotificationSettings {
    pub email_notifications: bool,
    pub push_notifications: bool,
    pub sms_notifications: bool,
    pub project_updates: bool,
    pub reconciliation_alerts: bool,
    pub system_announcements: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PrivacySettings {
    pub profile_visibility: String, // "public", "private", "team"
    pub data_sharing: bool,
    pub analytics_tracking: bool,
    pub activity_logging: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DisplaySettings {
    pub date_format: String,
    pub time_format: String,
    pub currency: String,
    pub items_per_page: i32,
    pub compact_view: bool,
}

/// Configure settings routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("", web::get().to(get_settings))
        .route("", web::put().to(update_settings))
        .route("/reset", web::post().to(reset_settings));
}

/// Get user settings endpoint
pub async fn get_settings(
    user_id: web::ReqData<Uuid>,
    cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let user_id_val = *user_id;

    // Try cache first (30 minute TTL for settings)
    let cache_key = format!("settings:{}", user_id_val);
    if let Ok(Some(cached)) = cache.get::<UserSettings>(&cache_key).await {
        return Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some(cached),
            message: None,
            error: None,
        }));
    }

    // For now, return default settings
    // In a real implementation, this would fetch from database
    let default_settings = UserSettings {
        theme: "light".to_string(),
        language: "en".to_string(),
        timezone: "UTC".to_string(),
        notifications: NotificationSettings {
            email_notifications: true,
            push_notifications: true,
            sms_notifications: false,
            project_updates: true,
            reconciliation_alerts: true,
            system_announcements: false,
        },
        privacy: PrivacySettings {
            profile_visibility: "team".to_string(),
            data_sharing: false,
            analytics_tracking: true,
            activity_logging: true,
        },
        display: DisplaySettings {
            date_format: "MM/DD/YYYY".to_string(),
            time_format: "12h".to_string(),
            currency: "USD".to_string(),
            items_per_page: 25,
            compact_view: false,
        },
    };

    // Cache for 30 minutes
    let _ = cache.set(&cache_key, &default_settings, Some(Duration::from_secs(1800))).await;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(default_settings),
        message: None,
        error: None,
    }))
}

/// Update user settings endpoint
pub async fn update_settings(
    user_id: web::ReqData<Uuid>,
    req: web::Json<UserSettings>,
    cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let user_id_val = *user_id;
    let settings = req.into_inner();

    // Validate settings
    if !["light", "dark", "auto"].contains(&settings.theme.as_str()) {
        return Err(AppError::Validation("Invalid theme. Must be 'light', 'dark', or 'auto'".to_string()));
    }

    if !["public", "private", "team"].contains(&settings.privacy.profile_visibility.as_str()) {
        return Err(AppError::Validation("Invalid profile visibility. Must be 'public', 'private', or 'team'".to_string()));
    }

    if settings.display.items_per_page < 10 || settings.display.items_per_page > 100 {
        return Err(AppError::Validation("Items per page must be between 10 and 100".to_string()));
    }

    // In a real implementation, this would save to database
    // For now, just cache the settings

    let cache_key = format!("settings:{}", user_id_val);
    let _ = cache.set(&cache_key, &settings, Some(Duration::from_secs(1800))).await;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(settings),
        message: Some("Settings updated successfully".to_string()),
        error: None,
    }))
}

/// Reset user settings to defaults endpoint
pub async fn reset_settings(
    user_id: web::ReqData<Uuid>,
    cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let user_id_val = *user_id;

    // Clear cached settings
    let cache_key = format!("settings:{}", user_id_val);
    let _ = cache.delete(&cache_key).await;

    // Return default settings (same as get_settings)
    let default_settings = UserSettings {
        theme: "light".to_string(),
        language: "en".to_string(),
        timezone: "UTC".to_string(),
        notifications: NotificationSettings {
            email_notifications: true,
            push_notifications: true,
            sms_notifications: false,
            project_updates: true,
            reconciliation_alerts: true,
            system_announcements: false,
        },
        privacy: PrivacySettings {
            profile_visibility: "team".to_string(),
            data_sharing: false,
            analytics_tracking: true,
            activity_logging: true,
        },
        display: DisplaySettings {
            date_format: "MM/DD/YYYY".to_string(),
            time_format: "12h".to_string(),
            currency: "USD".to_string(),
            items_per_page: 25,
            compact_view: false,
        },
    };

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(default_settings),
        message: Some("Settings reset to defaults".to_string()),
        error: None,
    }))
}