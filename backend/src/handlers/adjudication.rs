//! Adjudication handlers module

use actix_web::{web, HttpRequest, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::database::Database;
use crate::errors::AppError;
use crate::handlers::helpers::extract_user_id;
use crate::handlers::types::{
    ApiResponse, PaginatedResponse, SearchQueryParams,
    adjudication::{
        CreateCaseRequest, UpdateCaseRequest, AssignCaseRequest, ResolveCaseRequest,
        CreateAdjudicationWorkflowRequest, UpdateAdjudicationWorkflowRequest,
        CreateDecisionRequest, UpdateDecisionRequest, AppealDecisionRequest,
    },
};
use crate::services::cache::MultiLevelCache;
use crate::services::adjudication::AdjudicationService;
use crate::models::{NewAdjudicationCase, NewAdjudicationDecision, NewAdjudicationWorkflow, UpdateAdjudicationCase, UpdateAdjudicationDecision, UpdateAdjudicationWorkflow};
use std::sync::Arc;

/// Configure adjudication routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    // Cases
    cfg.route("/cases", web::get().to(list_cases))
        .route("/cases", web::post().to(create_case))
        .route("/cases/{id}", web::get().to(get_case))
        .route("/cases/{id}", web::put().to(update_case))
        .route("/cases/{id}", web::delete().to(delete_case))
        .route("/cases/{id}/assign", web::post().to(assign_case))
        .route("/cases/{id}/resolve", web::post().to(resolve_case))
        // Workflows
        .route("/workflows", web::get().to(list_workflows))
        .route("/workflows", web::post().to(create_workflow))
        .route("/workflows/{id}", web::get().to(get_workflow))
        .route("/workflows/{id}", web::put().to(update_workflow))
        .route("/workflows/{id}", web::delete().to(delete_workflow))
        // Decisions
        .route("/decisions", web::get().to(list_decisions))
        .route("/decisions", web::post().to(create_decision))
        .route("/decisions/{id}", web::get().to(get_decision))
        .route("/decisions/{id}", web::put().to(update_decision))
        .route("/decisions/{id}/appeal", web::post().to(appeal_decision))
        // Metrics & Export
        .route("/metrics", web::get().to(get_metrics))
        .route("/export", web::post().to(export_adjudication));
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Case {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub assigned_to: Option<Uuid>,
    pub created_by: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub resolved_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Workflow {
    pub id: Uuid,
    pub name: String,
    pub definition: serde_json::Value,
    pub active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Decision {
    pub id: Uuid,
    pub case_id: Uuid,
    pub decision: String,
    pub rationale: Option<String>,
    pub decided_by: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// List adjudication cases
/// 
/// Retrieves a paginated list of adjudication cases.
#[utoipa::path(
    get,
    path = "/api/v1/adjudication/cases",
    tag = "Adjudication",
    params(
        ("page" = Option<i32>, Query, description = "Page number (1-based)"),
        ("per_page" = Option<i32>, Query, description = "Items per page (max 100)")
    ),
    responses(
        (status = 200, description = "Cases retrieved successfully", body = PaginatedResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn list_cases(
    query: web::Query<SearchQueryParams>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
    _cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let page = query.page.unwrap_or(1) as i64;
    let per_page = query.per_page.unwrap_or(20).min(100) as i64;
    // project_id would come from query params if needed
    let project_id = None;
    
    let adjudication_service = AdjudicationService::new(Arc::new(data.get_ref().clone()));
    let (cases, total) = adjudication_service.list_cases(project_id, page, per_page).await?;
    
    let total_pages = (total as f64 / per_page as f64).ceil() as i32;
    
    let paginated = PaginatedResponse {
        items: cases,
        total,
        page: page as i32,
        per_page: per_page as i32,
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Create adjudication case
/// 
/// Creates a new adjudication case for review and resolution.
#[utoipa::path(
    post,
    path = "/api/v1/adjudication/cases",
    tag = "Adjudication",
    request_body = CreateCaseRequest,
    responses(
        (status = 201, description = "Case created successfully", body = ApiResponse),
        (status = 400, description = "Invalid request", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn create_case(
    req: web::Json<CreateCaseRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    req.validate().map_err(|e| AppError::Validation(format!("Validation error: {:?}", e)))?;
    let user_id = extract_user_id(&http_req)?;
    
    let new_case = NewAdjudicationCase {
        project_id: req.project_id,
        title: req.title.clone(),
        description: req.description.clone(),
        case_type: req.case_type.clone().unwrap_or_else(|| "general".to_string()),
        priority: req.priority.clone().unwrap_or_else(|| "medium".to_string()),
        status: "open".to_string(),
        assigned_to: None,
        created_by: user_id,
        metadata: req.metadata.clone().unwrap_or_else(|| serde_json::json!({})),
    };
    
    let adjudication_service = AdjudicationService::new(Arc::new(data.get_ref().clone()));
    let case = adjudication_service.create_case(new_case).await?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(case),
        message: Some("Case created successfully".to_string()),
        error: None,
    }))
}

/// Get adjudication case
/// 
/// Retrieves a specific adjudication case by ID.
#[utoipa::path(
    get,
    path = "/api/v1/adjudication/cases/{id}",
    tag = "Adjudication",
    params(
        ("id" = Uuid, Path, description = "Case ID")
    ),
    responses(
        (status = 200, description = "Case retrieved successfully", body = ApiResponse),
        (status = 404, description = "Case not found", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_case(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let case_id = path.into_inner();
    let adjudication_service = AdjudicationService::new(Arc::new(data.get_ref().clone()));
    let case = adjudication_service.get_case(case_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(case),
        message: None,
        error: None,
    }))
}

/// Update case
pub async fn update_case(
    path: web::Path<Uuid>,
    req: web::Json<UpdateCaseRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let case_id = path.into_inner();
    let update = UpdateAdjudicationCase {
        title: req.title.clone(),
        description: req.description.clone(),
        status: req.status.clone(),
        priority: req.priority.clone(),
        metadata: req.metadata.clone(),
    };
    
    let adjudication_service = AdjudicationService::new(Arc::new(data.get_ref().clone()));
    let case = adjudication_service.update_case(case_id, update).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(case),
        message: Some("Case updated successfully".to_string()),
        error: None,
    }))
}

/// Delete case
pub async fn delete_case(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let case_id = path.into_inner();
    let adjudication_service = AdjudicationService::new(Arc::new(data.get_ref().clone()));
    adjudication_service.delete_case(case_id).await?;
    Ok(HttpResponse::NoContent().finish())
}

/// Assign case
pub async fn assign_case(
    path: web::Path<Uuid>,
    req: web::Json<AssignCaseRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    req.validate().map_err(|e| AppError::Validation(format!("Validation error: {:?}", e)))?;
    let case_id = path.into_inner();
    let assigned_to = req.user_id;
    
    let adjudication_service = AdjudicationService::new(Arc::new(data.get_ref().clone()));
    let case = adjudication_service.assign_case(case_id, assigned_to).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(case),
        message: Some("Case assigned successfully".to_string()),
        error: None,
    }))
}

/// Resolve case
pub async fn resolve_case(
    path: web::Path<Uuid>,
    req: web::Json<ResolveCaseRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let case_id = path.into_inner();
    let user_id = extract_user_id(&http_req)?;
    let notes = req.notes.clone();
    
    let adjudication_service = AdjudicationService::new(Arc::new(data.get_ref().clone()));
    let case = adjudication_service.resolve_case(case_id, user_id, notes).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(case),
        message: Some("Case resolved successfully".to_string()),
        error: None,
    }))
}

/// List workflows
pub async fn list_workflows(
    query: web::Query<SearchQueryParams>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
    _cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let page = query.page.unwrap_or(1) as i64;
    let per_page = query.per_page.unwrap_or(20).min(100) as i64;
    let project_id = None; // Could come from query params
    
    let adjudication_service = AdjudicationService::new(Arc::new(data.get_ref().clone()));
    let (workflows, total) = adjudication_service.list_workflows(project_id, page, per_page).await?;
    
    let total_pages = (total as f64 / per_page as f64).ceil() as i32;
    
    let paginated = PaginatedResponse {
        items: workflows,
        total,
        page: page as i32,
        per_page: per_page as i32,
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Create workflow
pub async fn create_workflow(
    req: web::Json<CreateAdjudicationWorkflowRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    req.validate().map_err(|e| AppError::Validation(format!("Validation error: {:?}", e)))?;
    let new_workflow = NewAdjudicationWorkflow {
        project_id: req.project_id,
        name: req.name.clone(),
        definition: req.definition.clone(),
        is_active: true,
    };
    
    let adjudication_service = AdjudicationService::new(Arc::new(data.get_ref().clone()));
    let workflow = adjudication_service.create_workflow(new_workflow).await?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(workflow),
        message: Some("Workflow created successfully".to_string()),
        error: None,
    }))
}

/// Get workflow
pub async fn get_workflow(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let workflow_id = path.into_inner();
    let adjudication_service = AdjudicationService::new(Arc::new(data.get_ref().clone()));
    let workflow = adjudication_service.get_workflow(workflow_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(workflow),
        message: None,
        error: None,
    }))
}

/// Update workflow
pub async fn update_workflow(
    path: web::Path<Uuid>,
    req: web::Json<UpdateAdjudicationWorkflowRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let workflow_id = path.into_inner();
    let update = UpdateAdjudicationWorkflow {
        name: req.name.clone(),
        definition: req.definition.clone(),
        is_active: req.active,
    };
    
    let adjudication_service = AdjudicationService::new(Arc::new(data.get_ref().clone()));
    let workflow = adjudication_service.update_workflow(workflow_id, update).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(workflow),
        message: Some("Workflow updated successfully".to_string()),
        error: None,
    }))
}

/// Delete workflow
pub async fn delete_workflow(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let workflow_id = path.into_inner();
    let adjudication_service = AdjudicationService::new(Arc::new(data.get_ref().clone()));
    adjudication_service.delete_workflow(workflow_id).await?;
    Ok(HttpResponse::NoContent().finish())
}

/// List decisions
pub async fn list_decisions(
    query: web::Query<SearchQueryParams>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
    _cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let page = query.page.unwrap_or(1) as i64;
    let per_page = query.per_page.unwrap_or(20).min(100) as i64;
    // case_id would come from query params if needed
    let case_id = None;
    
    let adjudication_service = AdjudicationService::new(Arc::new(data.get_ref().clone()));
    let (decisions, total) = adjudication_service.list_decisions(case_id, page, per_page).await?;
    
    let total_pages = (total as f64 / per_page as f64).ceil() as i32;
    
    let paginated = PaginatedResponse {
        items: decisions,
        total,
        page: page as i32,
        per_page: per_page as i32,
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Create decision
pub async fn create_decision(
    req: web::Json<CreateDecisionRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    req.validate().map_err(|e| AppError::Validation(format!("Validation error: {:?}", e)))?;
    let user_id = extract_user_id(&http_req)?;
    
    let new_decision = NewAdjudicationDecision {
        case_id: req.case_id,
        decision_type: req.decision.clone(),
        decision: req.decision.clone(),
        rationale: req.rationale.clone(),
        decided_by: user_id,
        metadata: req.metadata.clone().unwrap_or_else(|| serde_json::json!({})),
    };
    
    let adjudication_service = AdjudicationService::new(Arc::new(data.get_ref().clone()));
    let decision = adjudication_service.create_decision(new_decision).await?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(decision),
        message: Some("Decision created successfully".to_string()),
        error: None,
    }))
}

/// Get decision
pub async fn get_decision(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let decision_id = path.into_inner();
    let adjudication_service = AdjudicationService::new(Arc::new(data.get_ref().clone()));
    let decision = adjudication_service.get_decision(decision_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(decision),
        message: None,
        error: None,
    }))
}

/// Update decision
pub async fn update_decision(
    path: web::Path<Uuid>,
    req: web::Json<UpdateDecisionRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let decision_id = path.into_inner();
    let update = UpdateAdjudicationDecision {
        decision: req.decision.clone(),
        rationale: req.rationale.clone(),
        metadata: req.metadata.clone(),
    };
    
    let adjudication_service = AdjudicationService::new(Arc::new(data.get_ref().clone()));
    let decision = adjudication_service.update_decision(decision_id, update).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(decision),
        message: Some("Decision updated successfully".to_string()),
        error: None,
    }))
}

/// Appeal decision
pub async fn appeal_decision(
    path: web::Path<Uuid>,
    req: web::Json<AppealDecisionRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    req.validate().map_err(|e| AppError::Validation(format!("Validation error: {:?}", e)))?;
    let decision_id = path.into_inner();
    let reason = req.reason.clone();
    
    let adjudication_service = AdjudicationService::new(Arc::new(data.get_ref().clone()));
    let decision = adjudication_service.appeal_decision(decision_id, reason).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(decision),
        message: Some("Appeal submitted successfully".to_string()),
        error: None,
    }))
}

/// Get adjudication metrics
pub async fn get_metrics(
    _http_req: HttpRequest,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "total_cases": 0,
            "open_cases": 0,
            "resolved_cases": 0
        })),
        message: None,
        error: None,
    }))
}

/// Export adjudication data
pub async fn export_adjudication(
    _req: web::Json<serde_json::Value>,
    _http_req: HttpRequest,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "export_id": Uuid::new_v4(),
            "status": "processing"
        })),
        message: Some("Export started".to_string()),
        error: None,
    }))
}

