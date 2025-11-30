use actix_web::{web, HttpResponse, Responder};
use crate::database::Database;
use crate::errors::AppError;

use serde::Deserialize;
use uuid::Uuid;

// Placeholder for path parameters
#[derive(Deserialize)]
pub struct UserIdPath {
    pub user_id: Uuid,
}

pub async fn get_user_by_id(
    path: web::Path<UserIdPath>,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = path.user_id;
    let user = data.get_user_by_id(user_id).await?;
    Ok(HttpResponse::Ok().json(user))
}

/// Get user activity/audit logs
pub async fn get_user_activity(
    path: web::Path<UserIdPath>,
    data: web::Data<Database>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, AppError> {
    use crate::models::schema::audit_logs::dsl::*;
    use diesel::prelude::*;

    let user_id_param = path.user_id;
    let limit = query.get("limit")
        .and_then(|s| s.parse::<i64>().ok())
        .unwrap_or(50)
        .min(100); // Max 100 records

    let offset_val = query.get("offset")
        .and_then(|s| s.parse::<i64>().ok())
        .unwrap_or(0);

    let mut conn = data.get().await?;

    let activities = audit_logs
        .filter(user_id.eq(user_id_param))
        .order(created_at.desc())
        .limit(limit)
        .offset(offset_val)
        .load::<crate::models::AuditLog>(&mut conn)
        .await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "user_id": user_id_param,
        "activities": activities,
        "limit": limit,
        "offset": offset_val,
        "total": activities.len()
    })))
}

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/{user_id}", web::get().to(get_user_by_id));
    cfg.route("/{user_id}/activity", web::get().to(get_user_activity));
}
