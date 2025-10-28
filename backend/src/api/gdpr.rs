// GDPR/CCPA Compliance Endpoints
// Data export, deletion, and consent management

use actix_web::{web, HttpResponse, Result as ActixResult};
use diesel::prelude::*;
use uuid::Uuid;
use crate::models::User;
use crate::database::get_db_pool;

/// Export user data (GDPR Right to Access)
pub async fn export_user_data(
    user_id: web::Path<Uuid>,
    req: HttpRequest,
) -> ActixResult<HttpResponse> {
    let user = get_authenticated_user(&req)?;
    
    // Verify user owns this data
    if user.id != *user_id {
        return Ok(HttpResponse::Forbidden().json(json!({
            "error": "Cannot export other user's data"
        })));
    }
    
    // Collect all user data
    let export_data = json!({
        "user_profile": {
            "email": user.email,
            "name": user.name,
            "created_at": user.created_at,
        },
        "subscriptions": get_user_subscriptions(user.id)?,
        "projects": get_user_projects(user.id)?,
        "reconciliations": get_user_reconciliations(user.id)?,
        "audit_log": get_user_audit_log(user.id)?,
    });
    
    Ok(HttpResponse::Ok().json(export_data))
}

/// Delete user data (GDPR Right to be Forgotten)
pub async fn delete_user_data(
    user_id: web::Path<Uuid>,
    req: HttpRequest,
) -> ActixResult<HttpResponse> {
    let user = get_authenticated_user(&req)?;
    
    // Verify user owns this data
    if user.id != *user_id {
        return Ok(HttpResponse::Forbidden().json(json!({
            "error": "Cannot delete other user's data"
        })));
    }
    
    // Soft delete with 30-day retention for recovery
    soft_delete_user(user.id)?;
    
    // Log deletion for audit trail
    log_data_deletion(user.id, user.email)?;
    
    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": "Data deletion initiated. Data will be permanently deleted in 30 days."
    })))
}

/// Cookie consent tracking
pub async fn set_consent(
    consent: web::Json<ConsentData>,
    req: HttpRequest,
) -> ActixResult<HttpResponse> {
    let user = get_authenticated_user(&req)?;
    
    store_consent(user.id, consent.into_inner())?;
    
    Ok(HttpResponse::Ok().json(json!({
        "consent_stored": true
    })))
}

#[derive(Deserialize)]
pub struct ConsentData {
    pub cookies_consent: bool,
    pub analytics_consent: bool,
    pub marketing_consent: bool,
}

// Add to main.rs routes:
// web::resource("/api/v1/users/{id}/export").route(web::get().to(gdpr::export_user_data))
// web::resource("/api/v1/users/{id}").route(web::delete().to(gdpr::delete_user_data))
// web::resource("/api/v1/consent").route(web::post().to(gdpr::set_consent))

