//! Compliance Reporting Handlers
//!
//! API endpoints for generating compliance reports.

use actix_web::{web, HttpResponse, Result};
use chrono::{DateTime, Utc};
use serde::Deserialize;

use crate::errors::AppError;
use crate::handlers::types::ApiResponse;
use crate::services::compliance_reporting::{
    ComplianceReportingService, ComplianceFramework,
};

/// Configure compliance routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/reports")
            .route("", web::post().to(generate_compliance_report))
            .route("/{framework}", web::get().to(get_compliance_report))
    );
}

/// Generate compliance report
#[utoipa::path(
    post,
    path = "/api/v1/compliance/reports",
    tag = "Compliance",
    request_body = GenerateReportRequest,
    responses(
        (status = 200, description = "Compliance report generated successfully", body = ApiResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn generate_compliance_report(
    body: web::Json<GenerateReportRequest>,
    service: web::Data<ComplianceReportingService>,
) -> Result<HttpResponse, AppError> {
    let framework = match body.framework.as_str() {
        "GDPR" => ComplianceFramework::GDPR,
        "SOX" => ComplianceFramework::SOX,
        "PCI" => ComplianceFramework::PCI,
        "HIPAA" => ComplianceFramework::HIPAA,
        _ => return Err(AppError::Validation("Invalid compliance framework".to_string())),
    };

    let period_start = body.period_start.unwrap_or_else(|| {
        Utc::now() - chrono::Duration::days(30)
    });
    let period_end = body.period_end.unwrap_or_else(|| Utc::now());

    let report = service.generate_report(framework, period_start, period_end).await?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::to_value(report)?),
        message: None,
        error: None,
    }))
}

/// Get compliance report
#[utoipa::path(
    get,
    path = "/api/v1/compliance/reports/{framework}",
    tag = "Compliance",
    params(
        ("framework" = String, Path, description = "Compliance framework (GDPR, SOX, PCI, HIPAA)"),
        ("period_start" = Option<String>, Query, description = "Period start (ISO 8601)"),
        ("period_end" = Option<String>, Query, description = "Period end (ISO 8601)"),
    ),
    responses(
        (status = 200, description = "Compliance report retrieved successfully", body = ApiResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_compliance_report(
    path: web::Path<String>,
    query: web::Query<GetReportQuery>,
    service: web::Data<ComplianceReportingService>,
) -> Result<HttpResponse, AppError> {
    let framework = match path.as_str() {
        "GDPR" => ComplianceFramework::GDPR,
        "SOX" => ComplianceFramework::SOX,
        "PCI" => ComplianceFramework::PCI,
        "HIPAA" => ComplianceFramework::HIPAA,
        _ => return Err(AppError::Validation("Invalid compliance framework".to_string())),
    };

    let period_start = query.period_start
        .as_ref()
        .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(|| Utc::now() - chrono::Duration::days(30));

    let period_end = query.period_end
        .as_ref()
        .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(|| Utc::now());

    let report = service.generate_report(framework, period_start, period_end).await?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::to_value(report)?),
        message: None,
        error: None,
    }))
}

/// Generate report request
#[derive(Debug, Deserialize)]
pub struct GenerateReportRequest {
    pub framework: String,
    pub period_start: Option<DateTime<Utc>>,
    pub period_end: Option<DateTime<Utc>>,
}

/// Get report query parameters
#[derive(Debug, Deserialize)]
pub struct GetReportQuery {
    pub period_start: Option<String>,
    pub period_end: Option<String>,
}

