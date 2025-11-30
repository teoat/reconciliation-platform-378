use actix_web::{web, HttpResponse, Responder};
use crate::database::Database;
use crate::errors::AppError;
use crate::models::Project;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct UpdateProjectSettings {
    pub settings: serde_json::Value,
}

/// Get project settings
pub async fn get_project_settings(
    path: web::Path<Uuid>,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    use crate::models::schema::projects::dsl::*;

    let project_id = path.into_inner();
    let mut conn = data.get().await?;

    let project = projects
        .find(project_id)
        .select((id, name, settings))
        .first::<(Uuid, String, serde_json::Value)>(&mut conn)
        .await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "project_id": project.0,
        "project_name": project.1,
        "settings": project.2
    })))
}

/// Update project settings
pub async fn update_project_settings(
    path: web::Path<Uuid>,
    settings_data: web::Json<UpdateProjectSettings>,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    use crate::models::schema::projects::dsl::*;

    let project_id = path.into_inner();
    let mut conn = data.get().await?;

    let updated_project = diesel::update(projects.find(project_id))
        .set((
            settings.eq(&settings_data.settings),
            updated_at.eq(diesel::dsl::now),
        ))
        .get_result::<Project>(&mut conn)
        .await?;

    Ok(HttpResponse::Ok().json(updated_project))
}

/// Get project analytics
pub async fn get_project_analytics(
    path: web::Path<Uuid>,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    use crate::models::schema::reconciliation_jobs::dsl::*;
    use diesel::dsl::*;

    let project_id = path.into_inner();
    let mut conn = data.get().await?;

    // Get job statistics
    let total_jobs = reconciliation_jobs
        .filter(project_id.eq(project_id))
        .count()
        .get_result::<i64>(&mut conn)
        .await?;

    let completed_jobs = reconciliation_jobs
        .filter(project_id.eq(project_id))
        .filter(status.eq("completed"))
        .count()
        .get_result::<i64>(&mut conn)
        .await?;

    let failed_jobs = reconciliation_jobs
        .filter(project_id.eq(project_id))
        .filter(status.eq("failed"))
        .count()
        .get_result::<i64>(&mut conn)
        .await?;

    // Get recent activity (last 30 days)
    let thirty_days_ago = chrono::Utc::now() - chrono::Duration::days(30);
    let recent_jobs = reconciliation_jobs
        .filter(project_id.eq(project_id))
        .filter(created_at.gt(thirty_days_ago))
        .count()
        .get_result::<i64>(&mut conn)
        .await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "project_id": project_id,
        "total_jobs": total_jobs,
        "completed_jobs": completed_jobs,
        "failed_jobs": failed_jobs,
        "success_rate": if total_jobs > 0 { (completed_jobs as f64 / total_jobs as f64) * 100.0 } else { 0.0 },
        "recent_activity": {
            "last_30_days": recent_jobs,
            "period_days": 30
        }
    })))
}

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    // Configure routes here
}
