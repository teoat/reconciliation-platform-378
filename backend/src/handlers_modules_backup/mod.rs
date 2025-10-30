//! API handlers module for the Reconciliation Backend
//! 
//! This module contains all HTTP request handlers organized by domain.

pub mod auth;
pub mod users;
pub mod projects;
pub mod reconciliation;
pub mod files;
pub mod analytics;
pub mod system;
pub mod monitoring;
pub mod sync;
pub mod types;

// Re-export health and file_upload handlers from existing files
pub use health;
pub use file_upload;

// Re-export configure_routes function
pub use types::ApiResponse;
pub use types::PaginatedResponse;

use actix_web::web;

/// Configure all API routes
/// This is the main entry point for route configuration
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        // Authentication routes
        .service(
            web::scope("/api/auth")
                .configure(auth::configure_routes)
        )
        // User management routes
        .service(
            web::scope("/api/users")
                .configure(users::configure_routes)
        )
        // Project management routes
        .service(
            web::scope("/api/projects")
                .configure(projects::configure_routes)
        )
        // Reconciliation routes
        .service(
            web::scope("/api/reconciliation")
                .configure(reconciliation::configure_routes)
        )
        // File upload routes
        .service(
            web::scope("/api/files")
                .configure(files::configure_routes)
        )
        // Analytics routes
        .service(
            web::scope("/api/analytics")
                .configure(analytics::configure_routes)
        )
        // System routes
        .service(
            web::scope("/api/system")
                .configure(system::configure_routes)
        )
        // Monitoring and alerts routes
        .service(
            web::scope("/api/monitoring")
                .configure(monitoring::configure_routes)
        )
        // Offline and sync routes
        .service(
            web::scope("/api/sync")
                .configure(sync::configure_routes)
        )
        // Health check routes (from existing health.rs)
        .configure(health::configure_health_routes);
}
