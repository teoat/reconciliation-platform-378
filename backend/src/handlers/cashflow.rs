//! Cashflow evaluation handlers module

use actix_web::{web, HttpRequest, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::database::Database;
use crate::errors::AppError;
use crate::handlers::helpers::extract_user_id;
use crate::handlers::types::{
    ApiResponse, PaginatedResponse, SearchQueryParams,
    cashflow::{
        CreateCategoryRequest as CreateCashflowCategoryRequest,
        UpdateCategoryRequest as UpdateCashflowCategoryRequest,
        CreateTransactionRequest, UpdateTransactionRequest,
        CreateDiscrepancyRequest, UpdateDiscrepancyRequest, ResolveDiscrepancyRequest,
    },
};
use crate::services::cache::MultiLevelCache;
use crate::services::cashflow::CashflowService;
use crate::models::{CashflowCategory, NewCashflowCategory, NewCashflowTransaction, NewCashflowDiscrepancy, UpdateCashflowCategory, UpdateCashflowTransaction, UpdateCashflowDiscrepancy};
use bigdecimal::{BigDecimal, FromPrimitive};
use std::str::FromStr;
use std::sync::Arc;

/// Configure cashflow routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    // Analysis
    cfg.route("/analysis", web::get().to(get_analysis))
        // Categories
        .route("/categories", web::get().to(list_categories))
        .route("/categories", web::post().to(create_category))
        .route("/categories/{id}", web::get().to(get_category))
        .route("/categories/{id}", web::put().to(update_category))
        .route("/categories/{id}", web::delete().to(delete_category))
        // Transactions
        .route("/transactions", web::get().to(list_transactions))
        .route("/transactions", web::post().to(create_transaction))
        .route("/transactions/{id}", web::get().to(get_transaction))
        .route("/transactions/{id}", web::put().to(update_transaction))
        .route("/transactions/{id}", web::delete().to(delete_transaction))
        // Discrepancies
        .route("/discrepancies", web::get().to(list_discrepancies))
        .route("/discrepancies", web::post().to(create_discrepancy))
        .route("/discrepancies/{id}", web::get().to(get_discrepancy))
        .route("/discrepancies/{id}", web::put().to(update_discrepancy))
        .route("/discrepancies/{id}/resolve", web::post().to(resolve_discrepancy))
        // Metrics & Export
        .route("/metrics", web::get().to(get_metrics))
        .route("/export", web::post().to(export_cashflow));
}

// Request types moved to handlers::types::cashflow

#[derive(Debug, Serialize, Deserialize)]
pub struct Transaction {
    pub id: Uuid,
    pub amount: f64,
    pub currency: String,
    pub date: chrono::DateTime<chrono::Utc>,
    pub description: String,
    pub category_id: Option<Uuid>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Discrepancy {
    pub id: Uuid,
    pub transaction_id: Uuid,
    pub expected_amount: f64,
    pub actual_amount: f64,
    pub status: String,
    pub resolved_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Get cashflow analysis
pub async fn get_analysis(
    query: web::Query<SearchQueryParams>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let project_id = query.project_id.as_ref()
        .and_then(|s| Uuid::parse_str(s).ok())
        .ok_or_else(|| AppError::Validation("project_id is required".to_string()))?;
    
    let cashflow_service = CashflowService::new(Arc::new(data.get_ref().clone()));
    let analysis = cashflow_service.get_analysis(project_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(analysis),
        message: None,
        error: None,
    }))
}

/// List categories
pub async fn list_categories(
    query: web::Query<SearchQueryParams>,
    _http_req: HttpRequest,
    _data: web::Data<Database>,
    _cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let categories: Vec<CashflowCategory> = vec![];
    let total_pages = 0;
    
    let paginated = PaginatedResponse {
        items: categories,
        total: 0,
        page: query.page.unwrap_or(1),
        per_page: query.per_page.unwrap_or(20),
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Create category
pub async fn create_category(
    req: web::Json<CreateCashflowCategoryRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    req.validate().map_err(|e| AppError::Validation(format!("Validation error: {:?}", e)))?;
    
    let new_category = NewCashflowCategory {
        project_id: req.project_id,
        name: req.name.clone(),
        description: req.description.clone(),
        category_type: req.category_type.clone().unwrap_or_else(|| "expense".to_string()),
        parent_id: req.parent_id,
        is_active: true,
    };
    
    let cashflow_service = CashflowService::new(Arc::new(data.get_ref().clone()));
    let category = cashflow_service.create_category(new_category).await?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(category),
        message: Some("Category created successfully".to_string()),
        error: None,
    }))
}

/// Get category
pub async fn get_category(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let category_id = path.into_inner();
    let cashflow_service = CashflowService::new(Arc::new(data.get_ref().clone()));
    let category = cashflow_service.get_category(category_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(category),
        message: None,
        error: None,
    }))
}

/// Update category
pub async fn update_category(
    path: web::Path<Uuid>,
    req: web::Json<UpdateCashflowCategoryRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let category_id = path.into_inner();
    let update = UpdateCashflowCategory {
        name: req.name.clone(),
        description: req.description.clone(),
        is_active: req.is_active,
    };
    
    let cashflow_service = CashflowService::new(Arc::new(data.get_ref().clone()));
    let category = cashflow_service.update_category(category_id, update).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(category),
        message: Some("Category updated successfully".to_string()),
        error: None,
    }))
}

/// Delete category
pub async fn delete_category(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let category_id = path.into_inner();
    let cashflow_service = CashflowService::new(Arc::new(data.get_ref().clone()));
    cashflow_service.delete_category(category_id).await?;
    Ok(HttpResponse::NoContent().finish())
}

/// List transactions
pub async fn list_transactions(
    query: web::Query<SearchQueryParams>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
    _cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let project_id = query.project_id.as_ref()
        .and_then(|s| Uuid::parse_str(s).ok())
        .ok_or_else(|| AppError::Validation("project_id is required".to_string()))?;
    let page = query.page.unwrap_or(1) as i64;
    let per_page = query.per_page.unwrap_or(20).min(100) as i64;
    
    let cashflow_service = CashflowService::new(Arc::new(data.get_ref().clone()));
    let (transactions, total) = cashflow_service.list_transactions(project_id, page, per_page).await?;
    
    let total_pages = (total as f64 / per_page as f64).ceil() as i32;
    
    let paginated = PaginatedResponse {
        items: transactions,
        total,
        page: page as i32,
        per_page: per_page as i32,
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Create transaction
pub async fn create_transaction(
    req: web::Json<CreateTransactionRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    req.validate().map_err(|e| AppError::Validation(format!("Validation error: {:?}", e)))?;
    
    let amount = BigDecimal::from_f64(req.amount)
        .ok_or_else(|| AppError::Validation("Invalid amount".to_string()))?;
    
    let new_transaction = NewCashflowTransaction {
        project_id: req.project_id,
        category_id: req.category_id,
        amount,
        currency: req.currency.clone().unwrap_or_else(|| "USD".to_string()),
        transaction_date: req.transaction_date.unwrap_or_else(|| chrono::Utc::now().date_naive()),
        description: req.description.clone(),
        reference_number: req.reference_number.clone(),
        metadata: req.metadata.clone().unwrap_or_else(|| serde_json::json!({})),
        created_by: None,
    };
    
    let cashflow_service = CashflowService::new(Arc::new(data.get_ref().clone()));
    let transaction = cashflow_service.create_transaction(new_transaction).await?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(transaction),
        message: Some("Transaction created successfully".to_string()),
        error: None,
    }))
}

/// Get transaction
pub async fn get_transaction(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let transaction_id = path.into_inner();
    let cashflow_service = CashflowService::new(Arc::new(data.get_ref().clone()));
    let transaction = cashflow_service.get_transaction(transaction_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(transaction),
        message: None,
        error: None,
    }))
}

/// Update transaction
pub async fn update_transaction(
    path: web::Path<Uuid>,
    req: web::Json<UpdateTransactionRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let transaction_id = path.into_inner();
    let update = UpdateCashflowTransaction {
        category_id: req.category_id.map(Some),
        amount: req.amount.and_then(|f| BigDecimal::from_f64(f)),
        description: req.description.clone(),
        metadata: req.metadata.clone(),
    };
    
    let cashflow_service = CashflowService::new(Arc::new(data.get_ref().clone()));
    let transaction = cashflow_service.update_transaction(transaction_id, update).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(transaction),
        message: Some("Transaction updated successfully".to_string()),
        error: None,
    }))
}

/// Delete transaction
pub async fn delete_transaction(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let transaction_id = path.into_inner();
    let cashflow_service = CashflowService::new(Arc::new(data.get_ref().clone()));
    cashflow_service.delete_transaction(transaction_id).await?;
    Ok(HttpResponse::NoContent().finish())
}

/// List discrepancies
pub async fn list_discrepancies(
    query: web::Query<SearchQueryParams>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
    _cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let project_id = query.project_id.as_ref()
        .and_then(|s| Uuid::parse_str(s).ok())
        .ok_or_else(|| AppError::Validation("project_id is required".to_string()))?;
    let page = query.page.unwrap_or(1) as i64;
    let per_page = query.per_page.unwrap_or(20).min(100) as i64;
    
    let cashflow_service = CashflowService::new(Arc::new(data.get_ref().clone()));
    let (discrepancies, total) = cashflow_service.list_discrepancies(project_id, page, per_page).await?;
    
    let total_pages = (total as f64 / per_page as f64).ceil() as i32;
    
    let paginated = PaginatedResponse {
        items: discrepancies,
        total,
        page: page as i32,
        per_page: per_page as i32,
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Create discrepancy
pub async fn create_discrepancy(
    req: web::Json<CreateDiscrepancyRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    req.validate().map_err(|e| AppError::Validation(format!("Validation error: {:?}", e)))?;
    
    let amount_diff = BigDecimal::from_f64(
        req.expected_amount.unwrap_or(0.0) - req.actual_amount.unwrap_or(0.0)
    ).ok_or_else(|| AppError::Validation("Invalid amount".to_string()))?;
    
    let new_discrepancy = NewCashflowDiscrepancy {
        project_id: req.project_id,
        transaction_a_id: req.transaction_a_id,
        transaction_b_id: req.transaction_b_id,
        discrepancy_type: req.discrepancy_type.clone().unwrap_or_else(|| "amount_mismatch".to_string()),
        amount_difference: amount_diff,
        description: req.description.clone(),
        status: "open".to_string(),
    };
    
    let cashflow_service = CashflowService::new(Arc::new(data.get_ref().clone()));
    let discrepancy = cashflow_service.create_discrepancy(new_discrepancy).await?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(discrepancy),
        message: Some("Discrepancy created successfully".to_string()),
        error: None,
    }))
}

/// Get discrepancy
pub async fn get_discrepancy(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let discrepancy_id = path.into_inner();
    let cashflow_service = CashflowService::new(Arc::new(data.get_ref().clone()));
    let discrepancy = cashflow_service.get_discrepancy(discrepancy_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(discrepancy),
        message: None,
        error: None,
    }))
}

/// Update discrepancy
pub async fn update_discrepancy(
    path: web::Path<Uuid>,
    req: web::Json<UpdateDiscrepancyRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let discrepancy_id = path.into_inner();
    let update = UpdateCashflowDiscrepancy {
        status: req.status.clone(),
        resolved_by: req.resolved_by.map(Some),
        resolved_at: None,
        resolution_notes: req.resolution_notes.clone(),
    };
    
    let cashflow_service = CashflowService::new(Arc::new(data.get_ref().clone()));
    let discrepancy = cashflow_service.update_discrepancy(discrepancy_id, update).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(discrepancy),
        message: Some("Discrepancy updated successfully".to_string()),
        error: None,
    }))
}

/// Resolve discrepancy
pub async fn resolve_discrepancy(
    path: web::Path<Uuid>,
    req: web::Json<ResolveDiscrepancyRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let discrepancy_id = path.into_inner();
    let user_id = extract_user_id(&http_req)?;
    let notes = req.notes.clone();
    
    let cashflow_service = CashflowService::new(Arc::new(data.get_ref().clone()));
    let discrepancy = cashflow_service.resolve_discrepancy(discrepancy_id, user_id, notes).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(discrepancy),
        message: Some("Discrepancy resolved successfully".to_string()),
        error: None,
    }))
}

/// Get cashflow metrics
pub async fn get_metrics(
    query: web::Query<SearchQueryParams>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let project_id = query.project_id.as_ref()
        .and_then(|s| Uuid::parse_str(s).ok())
        .ok_or_else(|| AppError::Validation("project_id is required".to_string()))?;
    
    let cashflow_service = CashflowService::new(Arc::new(data.get_ref().clone()));
    let analysis = cashflow_service.get_analysis(project_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(analysis),
        message: None,
        error: None,
    }))
}

/// Export cashflow data
pub async fn export_cashflow(
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

