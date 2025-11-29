//! Reconciliation results operations

use crate::errors::{AppError, AppResult};
use crate::models::schema::reconciliation_results;
use crate::models::ReconciliationResult;
use crate::services::reconciliation::ReconciliationService;
use bigdecimal::BigDecimal;
use chrono::Utc;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
use std::str::FromStr;
use uuid::Uuid;

use super::super::types::ReconciliationResultDetail;

/// Match resolve request (from handlers)
#[derive(Debug, Clone, serde::Deserialize)]
pub struct MatchResolve {
    pub match_id: Uuid,
    pub action: String, // "approve" | "reject"
    pub notes: Option<String>,
}

/// Result of batch approval operation
#[derive(Debug, serde::Serialize)]
pub struct BatchApprovalResult {
    pub approved: i32,
    pub rejected: i32,
    pub errors: Option<Vec<String>>,
}

/// Updated match result
#[derive(Debug, serde::Serialize)]
pub struct UpdatedMatch {
    pub id: Uuid,
    pub status: String,
    pub confidence_score: Option<f64>,
    pub reviewed_by: Option<String>,
    pub updated_at: chrono::DateTime<Utc>,
}

/// Gets paginated reconciliation results for a job.
pub async fn get_reconciliation_results(
    service: &ReconciliationService,
    job_id: Uuid,
    page: Option<i64>,
    per_page: Option<i64>,
    _lean: Option<bool>,
) -> AppResult<Vec<ReconciliationResultDetail>> {
    let page = page.unwrap_or(1).max(1);
    let per_page = per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;
    let mut conn = service.db.get_connection()?;
    let results = reconciliation_results::table
        .filter(reconciliation_results::job_id.eq(job_id))
        .order(reconciliation_results::confidence_score.desc())
        .limit(per_page)
        .offset(offset)
        .load::<ReconciliationResult>(&mut conn)
        .map_err(AppError::Database)?;
    let details = results
        .into_iter()
        .map(|r| ReconciliationResultDetail {
            id: r.id,
            job_id: r.job_id,
            record_a_id: r.record_a_id,
            record_b_id: r.record_b_id,
            match_type: r.match_type,
            confidence_score: r
                .confidence_score
                .map(|c| c.to_string().parse::<f64>().unwrap_or(0.0)),
            status: r.status.unwrap_or_else(|| "pending".to_string()),
            notes: r.notes,
            created_at: r.created_at,
            updated_at: r.updated_at.unwrap_or(r.created_at),
        })
        .collect();
    Ok(details)
}

/// Batch approve or reject matches within a single transaction
pub async fn batch_approve_matches(
    service: &ReconciliationService,
    _user_id: Uuid,
    resolves: Vec<MatchResolve>,
) -> AppResult<BatchApprovalResult> {
    crate::database::transaction::with_transaction(service.db.get_pool(), |tx| {
        let mut approved = 0i32;
        let mut rejected = 0i32;
        let mut errors: Vec<String> = Vec::new();

        for item in &resolves {
            let action = item.action.to_lowercase();
            let status_val = match action.as_str() {
                "approve" => {
                    approved += 1;
                    "approved"
                }
                "reject" => {
                    rejected += 1;
                    "rejected"
                }
                _ => {
                    errors.push(format!(
                        "Invalid action '{}' for match {}",
                        item.action, item.match_id
                    ));
                    continue;
                }
            };

            let rows = diesel::update(
                reconciliation_results::table.filter(reconciliation_results::id.eq(item.match_id)),
            )
            .set((
                reconciliation_results::status.eq(status_val),
                reconciliation_results::updated_at.eq(Utc::now()),
                reconciliation_results::notes.eq(item.notes.clone()),
            ))
            .execute(tx)
            .map_err(AppError::Database)?;

            if rows == 0 {
                errors.push(format!("Match {} not found", item.match_id));
            }
        }

        Ok(BatchApprovalResult {
            approved,
            rejected,
            errors: if errors.is_empty() {
                None
            } else {
                Some(errors)
            },
        })
    })
    .await
}

/// Update individual reconciliation match
pub async fn update_match(
    service: &ReconciliationService,
    _user_id: Uuid,
    match_id: Uuid,
    status: Option<&str>,
    confidence_score: Option<f64>,
    reviewed_by: Option<&str>,
) -> AppResult<UpdatedMatch> {
    let mut conn = service.db.get_connection()?;

    // Build the update query dynamically
    // Convert parameters to proper types
    let status_val = status.map(Some).unwrap_or(None);
    let confidence_val = if let Some(confidence) = confidence_score {
        // Convert f64 to BigDecimal using string conversion
        Some(
            BigDecimal::from_str(&confidence.to_string())
                .map_err(|_| AppError::Validation("Invalid confidence score".to_string()))?,
        )
    } else {
        None
    };
    let reviewer_val = if let Some(reviewer) = reviewed_by {
        Some(
            Uuid::parse_str(reviewer)
                .map_err(|_| AppError::Validation("Invalid reviewer UUID".to_string()))?,
        )
    } else {
        None
    };

    let rows = diesel::update(
        reconciliation_results::table.filter(reconciliation_results::id.eq(match_id)),
    )
    .set((
        reconciliation_results::status.eq(status_val),
        reconciliation_results::confidence_score.eq(confidence_val),
        reconciliation_results::reviewed_by.eq(reviewer_val),
        reconciliation_results::updated_at.eq(Utc::now()),
    ))
    .execute(&mut conn)
    .map_err(AppError::Database)?;

    if rows == 0 {
        return Err(AppError::NotFound("Match not found".to_string()));
    }

    // Fetch the updated match
    let updated_match: ReconciliationResult = reconciliation_results::table
        .find(match_id)
        .first(&mut conn)
        .map_err(AppError::Database)?;

    Ok(UpdatedMatch {
        id: updated_match.id,
        status: updated_match
            .status
            .unwrap_or_else(|| "pending".to_string()),
        confidence_score: updated_match
            .confidence_score
            .map(|c| c.to_string().parse::<f64>().unwrap_or(0.0)),
        reviewed_by: updated_match.reviewed_by.map(|u| u.to_string()),
        updated_at: updated_match.updated_at.unwrap_or(updated_match.created_at),
    })
}
