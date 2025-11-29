//! Reconciliation handlers module
//!
//! This module provides HTTP handlers for reconciliation operations split into:
//! - `jobs`: Job CRUD and control operations
//! - `results`: Results retrieval and match operations
//! - `export`: Export operations
//! - `sample`: Sample onboarding

pub mod jobs;
pub mod results;
pub mod export;
pub mod sample;

// Re-export handlers for OpenAPI documentation
pub use jobs::{get_reconciliation_jobs, create_reconciliation_job, get_reconciliation_job};
pub use results::get_reconciliation_results;

use actix_web::web;

/// Configure reconciliation routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/jobs", web::get().to(jobs::get_reconciliation_jobs))
        .route("/jobs", web::post().to(jobs::create_reconciliation_job))
        .route("/batch-resolve", web::post().to(results::batch_resolve_conflicts))
        .route("/jobs/{job_id}", web::get().to(jobs::get_reconciliation_job))
        .route("/jobs/{job_id}", web::put().to(jobs::update_reconciliation_job))
        .route(
            "/jobs/{job_id}",
            web::delete().to(jobs::delete_reconciliation_job),
        )
        .route(
            "/jobs/{job_id}/start",
            web::post().to(jobs::start_reconciliation_job),
        )
        .route(
            "/jobs/{job_id}/stop",
            web::post().to(jobs::stop_reconciliation_job),
        )
        .route(
            "/jobs/{job_id}/results",
            web::get().to(results::get_reconciliation_results),
        )
        .route("/jobs/{job_id}/export", web::post().to(export::start_export_job))
        .route(
            "/jobs/{job_id}/export/status",
            web::get().to(export::get_export_status),
        )
        .route(
            "/matches/{match_id}",
            web::put().to(results::update_reconciliation_match),
        )
        .route(
            "/jobs/{job_id}/export/download",
            web::get().to(export::download_export_file),
        )
        .route(
            "/jobs/{job_id}/progress",
            web::get().to(jobs::get_reconciliation_progress),
        )
        .route("/active", web::get().to(jobs::get_active_reconciliation_jobs))
        .route("/queued", web::get().to(jobs::get_queued_reconciliation_jobs))
        .route("/sample/onboard", web::post().to(sample::start_sample_onboarding));
}

