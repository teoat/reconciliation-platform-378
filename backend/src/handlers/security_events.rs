//! Security Events Handlers
//!
//! API endpoints for security event logging and retrieval.

use actix_web::{web, HttpResponse, Result};
use serde::Deserialize;

use crate::errors::AppError;
use crate::handlers::types::ApiResponse;
use crate::services::security_event_logging::{
    SecurityEventLoggingService, SecurityEventFilters, SecurityEventType, SecurityEventSeverity,
};

/// Configure security events routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/events")
            .route("", web::get().to(get_security_events))
            .route("/statistics", web::get().to(get_security_statistics))
    );
}

/// Get security events
#[utoipa::path(
    get,
    path = "/api/v1/security/events",
    tag = "Security",
    params(
        ("event_type" = Option<String>, Query, description = "Filter by event type"),
        ("severity" = Option<String>, Query, description = "Filter by severity"),
        ("user_id" = Option<String>, Query, description = "Filter by user ID"),
        ("start_time" = Option<i64>, Query, description = "Start timestamp"),
        ("end_time" = Option<i64>, Query, description = "End timestamp"),
        ("limit" = Option<usize>, Query, description = "Limit results"),
    ),
    responses(
        (status = 200, description = "Security events retrieved successfully", body = ApiResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_security_events(
    query: web::Query<SecurityEventsQuery>,
    service: web::Data<SecurityEventLoggingService>,
) -> Result<HttpResponse, AppError> {
    let filters = SecurityEventFilters {
        event_type: query.event_type.as_ref().and_then(|s| {
            match s.as_str() {
                "LoginAttempt" => Some(SecurityEventType::LoginAttempt),
                "LoginSuccess" => Some(SecurityEventType::LoginSuccess),
                "LoginFailure" => Some(SecurityEventType::LoginFailure),
                "AuthorizationDenied" => Some(SecurityEventType::AuthorizationDenied),
                "SuspiciousActivity" => Some(SecurityEventType::SuspiciousActivity),
                _ => None,
            }
        }),
        severity: query.severity.as_ref().and_then(|s| {
            match s.as_str() {
                "Low" => Some(SecurityEventSeverity::Low),
                "Medium" => Some(SecurityEventSeverity::Medium),
                "High" => Some(SecurityEventSeverity::High),
                "Critical" => Some(SecurityEventSeverity::Critical),
                _ => None,
            }
        }),
        user_id: query.user_id.clone(),
        start_time: query.start_time,
        end_time: query.end_time,
        limit: query.limit,
    };

    let events = service.get_events(filters).await;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "events": events,
            "count": events.len(),
        })),
        message: None,
        error: None,
    }))
}

/// Get security event statistics
#[utoipa::path(
    get,
    path = "/api/v1/security/events/statistics",
    tag = "Security",
    responses(
        (status = 200, description = "Security event statistics retrieved successfully", body = ApiResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_security_statistics(
    service: web::Data<SecurityEventLoggingService>,
) -> Result<HttpResponse, AppError> {
    let stats = service.get_statistics().await;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::to_value(stats)?),
        message: None,
        error: None,
    }))
}

/// Security events query parameters
#[derive(Debug, Deserialize)]
pub struct SecurityEventsQuery {
    pub event_type: Option<String>,
    pub severity: Option<String>,
    pub user_id: Option<String>,
    pub start_time: Option<i64>,
    pub end_time: Option<i64>,
    pub limit: Option<usize>,
}

