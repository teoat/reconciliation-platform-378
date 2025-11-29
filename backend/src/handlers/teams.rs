//! Teams and workspaces handlers module

use actix_web::{web, HttpRequest, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::database::Database;
use crate::errors::AppError;
use crate::handlers::helpers::extract_user_id;
use crate::handlers::types::{ApiResponse, PaginatedResponse, SearchQueryParams};
use crate::services::cache::MultiLevelCache;
use crate::services::team::TeamService;
use crate::models::{NewTeam, NewTeamMember, UpdateTeam};
use std::sync::Arc;

/// Configure teams routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(list_teams))
        .route("", web::post().to(create_team))
        .route("/{id}", web::get().to(get_team))
        .route("/{id}", web::put().to(update_team))
        .route("/{id}", web::delete().to(delete_team))
        .route("/{id}/members", web::get().to(list_members))
        .route("/{id}/invite", web::post().to(invite_member))
        .route("/{id}/members/{user_id}", web::delete().to(remove_member))
        .route("/{id}/permissions", web::get().to(get_permissions));
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Team {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub owner_id: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTeamRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTeamRequest {
    pub name: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TeamMember {
    pub user_id: Uuid,
    pub team_id: Uuid,
    pub role: String,
    pub joined_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct InviteMemberRequest {
    pub user_id: Uuid,
    pub role: String,
}

/// List teams
pub async fn list_teams(
    query: web::Query<SearchQueryParams>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
    _cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let page = query.page.unwrap_or(1) as i64;
    let per_page = query.per_page.unwrap_or(20).min(100) as i64;
    
    let team_service = TeamService::new(Arc::new(data.get_ref().clone()));
    let (teams, total) = team_service.list_teams(page, per_page).await?;
    
    let total_pages = (total as f64 / per_page as f64).ceil() as i32;
    
    let paginated = PaginatedResponse {
        items: teams,
        total,
        page: page as i32,
        per_page: per_page as i32,
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Create team
pub async fn create_team(
    req: web::Json<CreateTeamRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    
    let new_team = NewTeam {
        name: req.name.clone(),
        description: req.description.clone(),
        owner_id: user_id,
        settings: serde_json::json!({}),
        is_active: true,
    };
    
    let team_service = TeamService::new(Arc::new(data.get_ref().clone()));
    let team = team_service.create_team(new_team).await?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(team),
        message: Some("Team created successfully".to_string()),
        error: None,
    }))
}

/// Get team
pub async fn get_team(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let team_id = path.into_inner();
    let team_service = TeamService::new(Arc::new(data.get_ref().clone()));
    let team = team_service.get_team(team_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(team),
        message: None,
        error: None,
    }))
}

/// Update team
pub async fn update_team(
    path: web::Path<Uuid>,
    req: web::Json<UpdateTeamRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let team_id = path.into_inner();
    let update = UpdateTeam {
        name: req.name.clone(),
        description: req.description.clone(),
        settings: None,
        is_active: None,
    };
    
    let team_service = TeamService::new(Arc::new(data.get_ref().clone()));
    let team = team_service.update_team(team_id, update).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(team),
        message: Some("Team updated successfully".to_string()),
        error: None,
    }))
}

/// Delete team
pub async fn delete_team(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let team_id = path.into_inner();
    let team_service = TeamService::new(Arc::new(data.get_ref().clone()));
    team_service.delete_team(team_id).await?;
    Ok(HttpResponse::NoContent().finish())
}

/// List team members
pub async fn list_members(
    path: web::Path<Uuid>,
    _query: web::Query<SearchQueryParams>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let team_id = path.into_inner();
    let team_service = TeamService::new(Arc::new(data.get_ref().clone()));
    let members = team_service.list_members(team_id).await?;
    let total = members.len() as i64;
    let per_page = total as i32;
    let paginated = PaginatedResponse {
        items: members,
        total,
        page: 1,
        per_page,
        total_pages: 1,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Invite member to team
pub async fn invite_member(
    path: web::Path<Uuid>,
    req: web::Json<InviteMemberRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let team_id = path.into_inner();
    let inviter_id = extract_user_id(&http_req)?;
    
    let new_member = NewTeamMember {
        team_id,
        user_id: req.user_id,
        role: req.role.clone(),
        permissions: serde_json::json!({}),
        invited_by: Some(inviter_id),
        is_active: true,
    };
    
    let team_service = TeamService::new(Arc::new(data.get_ref().clone()));
    let member = team_service.add_member(new_member).await?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(member),
        message: Some("Member invited successfully".to_string()),
        error: None,
    }))
}

/// Remove member from team
pub async fn remove_member(
    path: web::Path<(Uuid, Uuid)>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let (team_id, user_id) = path.into_inner();
    let team_service = TeamService::new(Arc::new(data.get_ref().clone()));
    team_service.remove_member(team_id, user_id).await?;
    Ok(HttpResponse::NoContent().finish())
}

/// Get team permissions
pub async fn get_permissions(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let _team_id = path.into_inner();
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "permissions": [],
            "roles": []
        })),
        message: None,
        error: None,
    }))
}

