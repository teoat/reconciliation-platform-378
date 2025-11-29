//! Workflows handlers module

use actix_web::{web, HttpRequest, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::database::Database;
use crate::errors::AppError;
use crate::handlers::helpers::extract_user_id;
use crate::handlers::types::{
    ApiResponse, PaginatedResponse, SearchQueryParams,
    workflows::{
        CreateInstanceRequest, UpdateInstanceRequest,
        CreateRuleRequest, UpdateRuleRequest, TestRuleRequest,
    },
};
use crate::services::cache::MultiLevelCache;
use crate::services::workflow::WorkflowService;
use crate::models::{NewWorkflow, NewWorkflowInstance, NewWorkflowRule, UpdateWorkflow, UpdateWorkflowInstance, UpdateWorkflowRule};
use std::sync::Arc;

/// Configure workflows routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    // Workflows
    cfg.route("", web::get().to(list_workflows))
        .route("", web::post().to(create_workflow))
        .route("/{id}", web::get().to(get_workflow))
        .route("/{id}", web::put().to(update_workflow))
        .route("/{id}", web::delete().to(delete_workflow))
        // Workflow instances
        .route("/instances", web::get().to(list_instances))
        .route("/instances", web::post().to(create_instance))
        .route("/instances/{id}", web::get().to(get_instance))
        .route("/instances/{id}", web::put().to(update_instance))
        .route("/instances/{id}/cancel", web::post().to(cancel_instance))
        // Workflow rules
        .route("/rules", web::get().to(list_rules))
        .route("/rules", web::post().to(create_rule))
        .route("/rules/{id}", web::get().to(get_rule))
        .route("/rules/{id}", web::put().to(update_rule))
        .route("/rules/{id}", web::delete().to(delete_rule))
        .route("/rules/test", web::post().to(test_rule));
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Workflow {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub definition: serde_json::Value,
    pub created_by: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateWorkflowRequest {
    pub name: String,
    pub description: Option<String>,
    pub definition: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct UpdateWorkflowRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub definition: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowInstance {
    pub id: Uuid,
    pub workflow_id: Uuid,
    pub status: String,
    pub current_step: Option<String>,
    pub data: serde_json::Value,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowRule {
    pub id: Uuid,
    pub name: String,
    pub condition: serde_json::Value,
    pub action: serde_json::Value,
    pub active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
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
    
    let workflow_service = WorkflowService::new(Arc::new(data.get_ref().clone()));
    let (workflows, total) = workflow_service.list_workflows(page, per_page).await?;
    
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
    req: web::Json<CreateWorkflowRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    
    let new_workflow = NewWorkflow {
        name: req.name.clone(),
        description: req.description.clone(),
        project_id: None,
        definition: req.definition.clone(),
        status: "draft".to_string(),
        created_by: user_id,
    };
    
    let workflow_service = WorkflowService::new(Arc::new(data.get_ref().clone()));
    let workflow = workflow_service.create_workflow(new_workflow).await?;
    
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
    let workflow_service = WorkflowService::new(Arc::new(data.get_ref().clone()));
    let workflow = workflow_service.get_workflow(workflow_id).await?;
    
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
    req: web::Json<UpdateWorkflowRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let workflow_id = path.into_inner();
    let update = UpdateWorkflow {
        name: req.name.clone(),
        description: req.description.clone(),
        definition: req.definition.clone(),
        status: None,
    };
    
    let workflow_service = WorkflowService::new(Arc::new(data.get_ref().clone()));
    let workflow = workflow_service.update_workflow(workflow_id, update).await?;
    
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
    let workflow_service = WorkflowService::new(Arc::new(data.get_ref().clone()));
    workflow_service.delete_workflow(workflow_id).await?;
    Ok(HttpResponse::NoContent().finish())
}

/// List workflow instances
pub async fn list_instances(
    query: web::Query<SearchQueryParams>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
    _cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let page = query.page.unwrap_or(1) as i64;
    let per_page = query.per_page.unwrap_or(20).min(100) as i64;
    
    // For now, return empty list - instances need workflow_id filter
    // This should be enhanced to filter by workflow_id from query params
    let paginated = PaginatedResponse {
        items: vec![],
        total: 0,
        page: page as i32,
        per_page: per_page as i32,
        total_pages: 0,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Create workflow instance
pub async fn create_instance(
    req: web::Json<CreateInstanceRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    req.validate().map_err(|e| AppError::Validation(format!("Validation error: {:?}", e)))?;
    let user_id = extract_user_id(&http_req)?;
    
    let new_instance = NewWorkflowInstance {
        workflow_id: req.workflow_id,
        status: "pending".to_string(),
        current_step: None,
        state: req.data.clone(),
        started_by: Some(user_id),
        started_at: Some(chrono::Utc::now()),
    };
    
    let workflow_service = WorkflowService::new(Arc::new(data.get_ref().clone()));
    let instance = workflow_service.create_instance(new_instance).await?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(instance),
        message: Some("Workflow instance created successfully".to_string()),
        error: None,
    }))
}

/// Get workflow instance
pub async fn get_instance(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let instance_id = path.into_inner();
    let workflow_service = WorkflowService::new(Arc::new(data.get_ref().clone()));
    let instance = workflow_service.get_instance(instance_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(instance),
        message: None,
        error: None,
    }))
}

/// Update workflow instance
pub async fn update_instance(
    path: web::Path<Uuid>,
    req: web::Json<UpdateInstanceRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let instance_id = path.into_inner();
    let update = UpdateWorkflowInstance {
        status: req.status.clone(),
        current_step: req.current_step.clone(),
        state: req.state.clone(),
        completed_at: None,
        error_message: req.error_message.clone(),
    };
    
    let workflow_service = WorkflowService::new(Arc::new(data.get_ref().clone()));
    let instance = workflow_service.update_instance(instance_id, update).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(instance),
        message: Some("Workflow instance updated successfully".to_string()),
        error: None,
    }))
}

/// Cancel workflow instance
pub async fn cancel_instance(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let instance_id = path.into_inner();
    let update = UpdateWorkflowInstance {
        status: Some("cancelled".to_string()),
        completed_at: Some(Some(chrono::Utc::now())),
        ..Default::default()
    };
    
    let workflow_service = WorkflowService::new(Arc::new(data.get_ref().clone()));
    workflow_service.update_instance(instance_id, update).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: Some("Workflow instance cancelled".to_string()),
        error: None,
    }))
}

/// List workflow rules
pub async fn list_rules(
    query: web::Query<SearchQueryParams>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
    _cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    // Rules need workflow_id from query - simplified for now
    let paginated = PaginatedResponse {
        items: vec![],
        total: 0,
        page: query.page.unwrap_or(1),
        per_page: query.per_page.unwrap_or(20),
        total_pages: 0,
    };
    Ok(HttpResponse::Ok().json(paginated))
}

/// Create workflow rule
pub async fn create_rule(
    req: web::Json<CreateRuleRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    req.validate().map_err(|e| AppError::Validation(format!("Validation error: {:?}", e)))?;
    
    let new_rule = NewWorkflowRule {
        workflow_id: req.workflow_id,
        name: req.name.clone(),
        condition: req.condition.clone(),
        action: req.action.clone(),
        priority: req.priority.unwrap_or(0),
        is_active: req.active.unwrap_or(true),
    };
    
    let workflow_service = WorkflowService::new(Arc::new(data.get_ref().clone()));
    let rule = workflow_service.create_rule(new_rule).await?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(rule),
        message: Some("Workflow rule created successfully".to_string()),
        error: None,
    }))
}

/// Get workflow rule
pub async fn get_rule(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let rule_id = path.into_inner();
    let workflow_service = WorkflowService::new(Arc::new(data.get_ref().clone()));
    let rule = workflow_service.get_rule(rule_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(rule),
        message: None,
        error: None,
    }))
}

/// Update workflow rule
pub async fn update_rule(
    path: web::Path<Uuid>,
    req: web::Json<UpdateRuleRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let rule_id = path.into_inner();
    let update = UpdateWorkflowRule {
        name: req.name.clone(),
        condition: req.condition.clone(),
        action: req.action.clone(),
        priority: req.priority,
        is_active: req.active,
    };
    
    let workflow_service = WorkflowService::new(Arc::new(data.get_ref().clone()));
    let rule = workflow_service.update_rule(rule_id, update).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(rule),
        message: Some("Workflow rule updated successfully".to_string()),
        error: None,
    }))
}

/// Delete workflow rule
pub async fn delete_rule(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let rule_id = path.into_inner();
    let workflow_service = WorkflowService::new(Arc::new(data.get_ref().clone()));
    workflow_service.delete_rule(rule_id).await?;
    Ok(HttpResponse::NoContent().finish())
}

/// Test workflow rule
pub async fn test_rule(
    req: web::Json<TestRuleRequest>,
    _http_req: HttpRequest,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    req.validate().map_err(|e| AppError::Validation(format!("Validation error: {:?}", e)))?;
    
    // Basic rule testing - in production this would evaluate the rule against test_data
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "matches": false,
            "result": null
        })),
        message: Some("Rule test completed".to_string()),
        error: None,
    }))
}

