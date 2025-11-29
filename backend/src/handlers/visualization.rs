//! Visualization handlers module
//!
//! Handles charts, dashboards, and reports management

use actix_web::{web, HttpRequest, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::database::Database;
use crate::errors::AppError;
use crate::handlers::helpers::extract_user_id;
use crate::handlers::types::{
    ApiResponse, PaginatedResponse, SearchQueryParams,
    visualization::{ScheduleReportRequest, ExportVisualizationRequest},
};
use crate::services::cache::MultiLevelCache;
use crate::services::visualization::VisualizationService;
use crate::models::{NewChart, NewDashboard, NewReport, UpdateChart, UpdateDashboard, UpdateReport};
use std::sync::Arc;

/// Configure visualization routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    // Charts
    cfg.route("/charts", web::get().to(list_charts))
        .route("/charts", web::post().to(create_chart))
        .route("/charts/{id}", web::get().to(get_chart))
        .route("/charts/{id}", web::put().to(update_chart))
        .route("/charts/{id}", web::delete().to(delete_chart))
        // Dashboards
        .route("/dashboards", web::get().to(list_dashboards))
        .route("/dashboards", web::post().to(create_dashboard))
        .route("/dashboards/{id}", web::get().to(get_dashboard))
        .route("/dashboards/{id}", web::put().to(update_dashboard))
        .route("/dashboards/{id}", web::delete().to(delete_dashboard))
        // Reports
        .route("/reports", web::get().to(list_reports))
        .route("/reports", web::post().to(create_report))
        .route("/reports/{id}", web::get().to(get_report))
        .route("/reports/{id}", web::put().to(update_report))
        .route("/reports/{id}", web::delete().to(delete_report))
        .route("/reports/{id}/generate", web::post().to(generate_report))
        .route("/reports/{id}/schedule", web::post().to(schedule_report))
        // Export
        .route("/export", web::post().to(export_visualization));
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Chart {
    pub id: Uuid,
    pub name: String,
    pub chart_type: String,
    pub config: serde_json::Value,
    pub data_source: Option<String>,
    pub created_by: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateChartRequest {
    pub name: String,
    pub chart_type: String,
    pub config: serde_json::Value,
    pub data_source: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateChartRequest {
    pub name: Option<String>,
    pub chart_type: Option<String>,
    pub config: Option<serde_json::Value>,
    pub data_source: Option<String>,
}

/// List charts
pub async fn list_charts(
    query: web::Query<SearchQueryParams>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
    _cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let page = query.page.unwrap_or(1) as i64;
    let per_page = query.per_page.unwrap_or(20).min(100) as i64;
    let project_id = None; // Could come from query params
    
    let visualization_service = VisualizationService::new(Arc::new(data.get_ref().clone()));
    let (charts, total) = visualization_service.list_charts(project_id, page, per_page).await?;
    
    let total_pages = (total as f64 / per_page as f64).ceil() as i32;
    
    let paginated = PaginatedResponse {
        items: charts,
        total,
        page: page as i32,
        per_page: per_page as i32,
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Create chart
pub async fn create_chart(
    req: web::Json<CreateChartRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    
    let new_chart = NewChart {
        project_id: None, // Could come from request
        name: req.name.clone(),
        chart_type: req.chart_type.clone(),
        configuration: req.config.clone(),
        data_source: req.data_source.clone(),
        is_public: req.is_public.unwrap_or(false),
        created_by: user_id,
    };
    
    let visualization_service = VisualizationService::new(Arc::new(data.get_ref().clone()));
    let chart = visualization_service.create_chart(new_chart).await?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(chart),
        message: Some("Chart created successfully".to_string()),
        error: None,
    }))
}

/// Get chart
pub async fn get_chart(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let chart_id = path.into_inner();
    let visualization_service = VisualizationService::new(Arc::new(data.get_ref().clone()));
    let chart = visualization_service.get_chart(chart_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(chart),
        message: None,
        error: None,
    }))
}

/// Update chart
pub async fn update_chart(
    path: web::Path<Uuid>,
    req: web::Json<UpdateChartRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let chart_id = path.into_inner();
    let update = UpdateChart {
        name: req.name.clone(),
        configuration: req.config.clone(),
        data_source: req.data_source.clone(),
    };
    
    let visualization_service = VisualizationService::new(Arc::new(data.get_ref().clone()));
    let chart = visualization_service.update_chart(chart_id, update).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(chart),
        message: Some("Chart updated successfully".to_string()),
        error: None,
    }))
}

/// Delete chart
pub async fn delete_chart(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let chart_id = path.into_inner();
    let visualization_service = VisualizationService::new(Arc::new(data.get_ref().clone()));
    visualization_service.delete_chart(chart_id).await?;
    Ok(HttpResponse::NoContent().finish())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Dashboard {
    pub id: Uuid,
    pub name: String,
    pub layout: serde_json::Value,
    pub charts: Vec<Uuid>,
    pub created_by: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDashboardRequest {
    pub name: String,
    pub layout: serde_json::Value,
    pub charts: Vec<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDashboardRequest {
    pub name: Option<String>,
    pub layout: Option<serde_json::Value>,
    pub charts: Option<Vec<Uuid>>,
}

/// List dashboards
pub async fn list_dashboards(
    query: web::Query<SearchQueryParams>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
    _cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let page = query.page.unwrap_or(1) as i64;
    let per_page = query.per_page.unwrap_or(20).min(100) as i64;
    let project_id = None; // Could come from query params
    
    let visualization_service = VisualizationService::new(Arc::new(data.get_ref().clone()));
    let (dashboards, total) = visualization_service.list_dashboards(project_id, page, per_page).await?;
    
    let total_pages = (total as f64 / per_page as f64).ceil() as i32;
    
    let paginated = PaginatedResponse {
        items: dashboards,
        total,
        page: page as i32,
        per_page: per_page as i32,
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Create dashboard
pub async fn create_dashboard(
    req: web::Json<CreateDashboardRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    
    let new_dashboard = NewDashboard {
        project_id: None, // Could come from request
        name: req.name.clone(),
        layout: req.layout.clone(),
        chart_ids: req.charts.clone(),
        created_by: user_id,
    };
    
    let visualization_service = VisualizationService::new(Arc::new(data.get_ref().clone()));
    let dashboard = visualization_service.create_dashboard(new_dashboard).await?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(dashboard),
        message: Some("Dashboard created successfully".to_string()),
        error: None,
    }))
}

/// Get dashboard
pub async fn get_dashboard(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let dashboard_id = path.into_inner();
    let visualization_service = VisualizationService::new(Arc::new(data.get_ref().clone()));
    let dashboard = visualization_service.get_dashboard(dashboard_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(dashboard),
        message: None,
        error: None,
    }))
}

/// Update dashboard
pub async fn update_dashboard(
    path: web::Path<Uuid>,
    req: web::Json<UpdateDashboardRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let dashboard_id = path.into_inner();
    let update = UpdateDashboard {
        name: req.name.clone(),
        layout: req.layout.clone(),
        chart_ids: req.charts.clone(),
    };
    
    let visualization_service = VisualizationService::new(Arc::new(data.get_ref().clone()));
    let dashboard = visualization_service.update_dashboard(dashboard_id, update).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(dashboard),
        message: Some("Dashboard updated successfully".to_string()),
        error: None,
    }))
}

/// Delete dashboard
pub async fn delete_dashboard(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let dashboard_id = path.into_inner();
    let visualization_service = VisualizationService::new(Arc::new(data.get_ref().clone()));
    visualization_service.delete_dashboard(dashboard_id).await?;
    Ok(HttpResponse::NoContent().finish())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Report {
    pub id: Uuid,
    pub name: String,
    pub report_type: String,
    pub config: serde_json::Value,
    pub schedule: Option<serde_json::Value>,
    pub created_by: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateReportRequest {
    pub name: String,
    pub report_type: String,
    pub config: serde_json::Value,
    pub schedule: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateReportRequest {
    pub name: Option<String>,
    pub report_type: Option<String>,
    pub config: Option<serde_json::Value>,
    pub schedule: Option<serde_json::Value>,
}

/// List reports
pub async fn list_reports(
    query: web::Query<SearchQueryParams>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
    _cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let page = query.page.unwrap_or(1) as i64;
    let per_page = query.per_page.unwrap_or(20).min(100) as i64;
    let project_id = None; // Could come from query params
    
    let visualization_service = VisualizationService::new(Arc::new(data.get_ref().clone()));
    let (reports, total) = visualization_service.list_reports(project_id, page, per_page).await?;
    
    let total_pages = (total as f64 / per_page as f64).ceil() as i32;
    
    let paginated = PaginatedResponse {
        items: reports,
        total,
        page: page as i32,
        per_page: per_page as i32,
        total_pages,
    };
    
    Ok(HttpResponse::Ok().json(paginated))
}

/// Create report
pub async fn create_report(
    req: web::Json<CreateReportRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    
    let new_report = NewReport {
        project_id: None, // Could come from request
        name: req.name.clone(),
        description: None,
        template: req.config.clone(),
        schedule: req.schedule.clone(),
        status: "draft".to_string(),
        created_by: user_id,
    };
    
    let visualization_service = VisualizationService::new(Arc::new(data.get_ref().clone()));
    let report = visualization_service.create_report(new_report).await?;
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: Some(report),
        message: Some("Report created successfully".to_string()),
        error: None,
    }))
}

/// Get report
pub async fn get_report(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let report_id = path.into_inner();
    let visualization_service = VisualizationService::new(Arc::new(data.get_ref().clone()));
    let report = visualization_service.get_report(report_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(report),
        message: None,
        error: None,
    }))
}

/// Update report
pub async fn update_report(
    path: web::Path<Uuid>,
    req: web::Json<UpdateReportRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let report_id = path.into_inner();
    let update = UpdateReport {
        name: req.name.clone(),
        description: None,
        template: req.config.clone(),
        schedule: req.schedule.clone(),
        status: None,
        last_generated_at: None,
    };
    
    let visualization_service = VisualizationService::new(Arc::new(data.get_ref().clone()));
    let report = visualization_service.update_report(report_id, update).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(report),
        message: Some("Report updated successfully".to_string()),
        error: None,
    }))
}

/// Delete report
pub async fn delete_report(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let report_id = path.into_inner();
    let visualization_service = VisualizationService::new(Arc::new(data.get_ref().clone()));
    visualization_service.delete_report(report_id).await?;
    Ok(HttpResponse::NoContent().finish())
}

/// Generate report
pub async fn generate_report(
    path: web::Path<Uuid>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let report_id = path.into_inner();
    let visualization_service = VisualizationService::new(Arc::new(data.get_ref().clone()));
    let result = visualization_service.generate_report(report_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(result),
        message: Some("Report generation started".to_string()),
        error: None,
    }))
}

/// Schedule report
pub async fn schedule_report(
    path: web::Path<Uuid>,
    req: web::Json<ScheduleReportRequest>,
    _http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    req.validate().map_err(|e| AppError::Validation(format!("Validation error: {:?}", e)))?;
    let report_id = path.into_inner();
    
    // Update report with schedule
    let update = UpdateReport {
        schedule: Some(req.schedule.clone()),
        ..Default::default()
    };
    let visualization_service = VisualizationService::new(Arc::new(data.get_ref().clone()));
    let _report = visualization_service.update_report(report_id, update).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "scheduled": true,
            "next_run": chrono::Utc::now() + chrono::Duration::days(1)
        })),
        message: Some("Report scheduled successfully".to_string()),
        error: None,
    }))
}

/// Export visualization data
pub async fn export_visualization(
    req: web::Json<ExportVisualizationRequest>,
    _http_req: HttpRequest,
    _data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    req.validate().map_err(|e| AppError::Validation(format!("Validation error: {:?}", e)))?;
    let _format = req.format.clone().unwrap_or_else(|| "json".to_string());
    let _data_type = req.data_type.clone();
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "export_id": Uuid::new_v4(),
            "status": "processing",
            "download_url": None::<String>
        })),
        message: Some("Export started".to_string()),
        error: None,
    }))
}

