use actix_web::{web, HttpResponse, Responder};
use crate::database::Database;
use crate::errors::AppError;
use crate::models::security_policy::{SecurityPolicy, CreateSecurityPolicy};
use diesel::prelude::*;

/// Update security policy
pub async fn update_policy(
    path: web::Path<uuid::Uuid>,
    policy_data: web::Json<CreateSecurityPolicy>,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    use crate::models::schema::security_policies::dsl::*;

    let policy_id = path.into_inner();
    let mut conn = data.get().await?;

    let updated_policy = diesel::update(security_policies.filter(id.eq(policy_id)))
        .set((
            name.eq(&policy_data.name),
            description.eq(&policy_data.description),
            category.eq(&policy_data.category),
            rules.eq(serde_json::to_value(&policy_data.rules)?),
            updated_at.eq(diesel::dsl::now),
        ))
        .get_result::<SecurityPolicy>(&mut conn)
        .await?;

    Ok(HttpResponse::Ok().json(updated_policy))
}

/// Get security audit logs/events
pub async fn get_audit_logs(
    data: web::Data<Database>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, AppError> {
    use crate::models::schema::security_events::dsl::*;

    let limit = query.get("limit")
        .and_then(|s| s.parse::<i64>().ok())
        .unwrap_or(50)
        .min(200); // Max 200 records

    let offset_val = query.get("offset")
        .and_then(|s| s.parse::<i64>().ok())
        .unwrap_or(0);

    let event_type_filter = query.get("event_type");
    let severity_filter = query.get("severity");

    let mut conn = data.get().await?;
    let mut query_builder = security_events.order(created_at.desc()).into_boxed();

    if let Some(et) = event_type_filter {
        query_builder = query_builder.filter(event_type.eq(et));
    }

    if let Some(sev) = severity_filter {
        query_builder = query_builder.filter(severity.eq(sev));
    }

    let events = query_builder
        .limit(limit)
        .offset(offset_val)
        .load::<crate::models::SecurityEvent>(&mut conn)
        .await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "events": events,
        "limit": limit,
        "offset": offset_val,
        "total": events.len(),
        "filters": {
            "event_type": event_type_filter,
            "severity": severity_filter
        }
    })))
}

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    // Configure routes here
}
