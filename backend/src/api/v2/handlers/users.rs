use actix_web::{web, HttpResponse};
use uuid::Uuid;
use serde::Deserialize;
use crate::errors::AppError;
use crate::services::v2::user::UserServiceV2;

// Placeholder for path parameters
#[derive(Deserialize)]
pub struct UserIdPath {
    pub user_id: Uuid,
}

pub async fn get_user_by_id(
    path: web::Path<UserIdPath>,
    user_service: web::Data<UserServiceV2>,
) -> Result<HttpResponse, AppError> {
    let user_id = path.user_id;
    let user = user_service.get_user_by_id(user_id).await?;
    Ok(HttpResponse::Ok().json(user))
}

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/{user_id}", web::get().to(get_user_by_id));
}
