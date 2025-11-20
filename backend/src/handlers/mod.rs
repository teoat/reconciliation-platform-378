//! API handlers module for the Reconciliation Backend
//! 
//! This module contains all HTTP request handlers organized by domain.

// Core handler modules
pub mod types;
pub mod helpers;

// Handler domain modules
pub mod auth;
pub mod users;
pub mod projects;
pub mod reconciliation;
pub mod files;
pub mod analytics;
pub mod settings;
pub mod profile;

// Placeholder modules for future implementation
#[allow(unused_imports)]
mod system {
    pub fn configure_routes(_cfg: &mut actix_web::web::ServiceConfig) {}
}
#[allow(unused_imports)]
mod monitoring {
    pub fn configure_routes(_cfg: &mut actix_web::web::ServiceConfig) {}
}
#[allow(unused_imports)]
mod sync {
    pub fn configure_routes(_cfg: &mut actix_web::web::ServiceConfig) {}
}

// Health check handlers
pub mod health;

// Re-export types for backward compatibility
pub use types::{ApiResponse, PaginatedResponse, SearchQueryParams, UserQueryParams};
pub use helpers::{mask_email, get_client_ip, get_user_agent, extract_user_id};

use actix_web::web;

/// Configure all API routes
/// This is the main entry point for route configuration
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    // API v1 Scope
    cfg.service(
        web::scope("/api/v1")
            // Authentication routes
            .service(
                web::scope("/auth")
                    .configure(auth::configure_routes)
            )
            // User management routes
            .service(
                web::scope("/users")
                    .configure(users::configure_routes)
            )
            // Project management routes
            .service(
                web::scope("/projects")
                    .configure(projects::configure_routes)
            )
            // Reconciliation routes
            .service(
                web::scope("/reconciliation")
                    .configure(reconciliation::configure_routes)
            )
            // File upload routes
            .service(
                web::scope("/files")
                    .configure(files::configure_routes)
            )
            // Analytics routes
            .service(
                web::scope("/analytics")
                    .configure(analytics::configure_routes)
            )
            // Settings routes
            .service(
                web::scope("/settings")
                    .configure(settings::configure_routes)
            )
            // Profile routes
            .service(
                web::scope("/profile")
                    .configure(profile::configure_routes)
            )
            // System routes
            .service(
                web::scope("/system")
                    .configure(system::configure_routes)
            )
            // Monitoring and alerts routes
            .service(
                web::scope("/monitoring")
                    .configure(monitoring::configure_routes)
            )
            // Offline and sync routes
            .service(
                web::scope("/sync")
                    .configure(sync::configure_routes)
            )
    )
    // Backward compatibility / Legacy routes (optional, but good for safety during migration)
    .service(
        web::scope("/api/auth").configure(auth::configure_routes)
    )
    // Health check routes (keep at root/api level as well for K8s probes)
    .configure(health::configure_health_routes);
}
