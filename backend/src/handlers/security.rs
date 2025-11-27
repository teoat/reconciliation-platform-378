//! Security handlers module
//!
//! Provides endpoints for security-related operations including CSP reporting

use actix_web::{web, HttpResponse, Result};
use serde::Deserialize;
use utoipa;

use crate::errors::AppError;

/// CSP violation report from browser
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct CSPViolationReport {
    #[serde(rename = "csp-report")]
    pub csp_report: CSPReport,
}

/// CSP report details
#[derive(Debug, Deserialize)]
pub struct CSPReport {
    #[serde(rename = "document-uri")]
    pub document_uri: Option<String>,
    #[serde(rename = "referrer")]
    pub referrer: Option<String>,
    #[serde(rename = "violated-directive")]
    pub violated_directive: Option<String>,
    #[serde(rename = "effective-directive")]
    pub effective_directive: Option<String>,
    #[serde(rename = "original-policy")]
    pub original_policy: Option<String>,
    #[serde(rename = "disposition")]
    pub disposition: Option<String>,
    #[serde(rename = "blocked-uri")]
    pub blocked_uri: Option<String>,
    #[serde(rename = "line-number")]
    pub line_number: Option<u32>,
    #[serde(rename = "column-number")]
    pub column_number: Option<u32>,
    #[serde(rename = "source-file")]
    pub source_file: Option<String>,
    #[serde(rename = "status-code")]
    pub status_code: Option<u16>,
    #[serde(rename = "script-sample")]
    pub script_sample: Option<String>,
}

/// POST /api/security/csp-report - Receive CSP violation reports
/// 
/// Receives Content Security Policy violation reports from browsers.
#[utoipa::path(
    post,
    path = "/api/v1/security/csp-report",
    tag = "Security",
    request_body = CSPViolationReport,
    responses(
        (status = 204, description = "CSP report received successfully"),
        (status = 400, description = "Invalid report format", body = ErrorResponse)
    )
)]
pub async fn post_csp_report(
    body: web::Json<CSPViolationReport>,
) -> Result<HttpResponse, AppError> {
    let report = &body.csp_report;

    // Log CSP violation (in production, this would go to a security monitoring service)
    log::warn!(
        "CSP Violation: {} - Blocked URI: {}",
        report
            .violated_directive
            .as_deref()
            .unwrap_or("unknown"),
        report.blocked_uri.as_deref().unwrap_or("unknown")
    );

    // Log full report details at debug level
    log::debug!("CSP Report Details: {:#?}", report);

    // In production, you might want to:
    // 1. Store in database for analysis
    // 2. Send to security monitoring service
    // 3. Alert security team for critical violations
    // 4. Aggregate violations for policy tuning

    // Return 204 No Content (CSP spec requires this)
    Ok(HttpResponse::NoContent().finish())
}

/// Configure security routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/csp-report", web::post().to(post_csp_report));
}

