//! API handlers module for the Reconciliation Backend
//!
//! This module contains all HTTP request handlers organized by domain.

// Core handler modules
pub mod helpers;
pub mod types;

// Handler domain modules
pub mod analytics;
pub mod auth;
pub mod files;
pub mod profile;
pub mod projects;
pub mod reconciliation;
pub mod settings;
pub mod users;

// System handlers
pub mod system;

// Monitoring handlers
pub mod monitoring;

// Sync handlers
pub mod sync;
pub mod sql_sync;

// Health check handlers
pub mod health;

// Password manager handlers
pub mod password_manager;

// AI handlers
pub mod ai;

// Onboarding handlers
pub mod onboarding;

// Logging handlers
pub mod logs;

// Security handlers
pub mod security;
pub mod security_events;
pub mod compliance;

// Metrics handlers
pub mod metrics;

// WebSocket handlers
use crate::websocket;

// Re-export types for backward compatibility
pub use helpers::{extract_user_id, get_client_ip, get_user_agent, mask_email};
pub use types::{ApiResponse, PaginatedResponse, SearchQueryParams, UserQueryParams};

use actix_web::web;

/// Configure all API routes
/// This is the main entry point for route configuration
/// Note: Auth rate limiting middleware is applied at the App level in main.rs
/// 
/// API Versioning Strategy:
/// - Version 1 routes: `/api/v1/{resource}` (primary, documented in OpenAPI)
/// - Legacy routes: `/api/{resource}` (backward compatibility, will be deprecated)
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    // Version 1 API routes (primary, documented in OpenAPI)
    cfg.service(
        web::scope("/api/v1")
            // Authentication routes
            .service(web::scope("/auth").configure(auth::configure_routes))
            // User management routes
            .service(web::scope("/users").configure(users::configure_routes))
            // Project management routes
            .service(web::scope("/projects").configure(projects::configure_routes))
            // Reconciliation routes
            .service(web::scope("/reconciliation").configure(reconciliation::configure_routes))
            // File upload routes
            .service(web::scope("/files").configure(files::configure_routes))
            // Analytics routes
            .service(web::scope("/analytics").configure(analytics::configure_routes))
            // Settings routes
            .service(web::scope("/settings").configure(settings::configure_routes))
            // Profile routes
            .service(web::scope("/profile").configure(profile::configure_routes))
            // System routes
            .service(web::scope("/system").configure(system::configure_routes))
            // Monitoring and alerts routes
            .service(web::scope("/monitoring").configure(monitoring::configure_routes))
            // Offline and sync routes
            .service(web::scope("/sync").configure(sync::configure_routes))
            // SQL data synchronization routes
            .service(web::scope("/sync").configure(sql_sync::configure_routes))
            // Password manager routes
            .service(web::scope("/passwords").configure(password_manager::configure_routes))
            // Onboarding routes
            .service(web::scope("/onboarding").configure(onboarding::configure_routes))
            // AI service routes
            .service(web::scope("/ai").configure(ai::configure_routes))
            // Logging routes
            .route("/logs", web::post().to(logs::post_logs))
            // Security routes
            .service(web::scope("/security").configure(security::configure_routes))
            // Security events routes
            .service(web::scope("/security").configure(security_events::configure_routes))
            // Compliance routes
            .service(web::scope("/compliance").configure(compliance::configure_routes))
            // Health check routes
            .service(web::scope("/health").configure(health::configure_health_routes))
            // Metrics routes
            .service(web::scope("/metrics").configure(metrics::configure_routes))
    );
    
    // Legacy routes (backward compatibility - will be deprecated)
    // These routes will be removed in a future version
    cfg
        // Authentication routes
        .service(web::scope("/api/auth").configure(auth::configure_routes))
        // User management routes
        .service(web::scope("/api/users").configure(users::configure_routes))
        // Project management routes
        .service(web::scope("/api/projects").configure(projects::configure_routes))
        // Reconciliation routes
        .service(web::scope("/api/reconciliation").configure(reconciliation::configure_routes))
        // File upload routes
        .service(web::scope("/api/files").configure(files::configure_routes))
        // Analytics routes
        .service(web::scope("/api/analytics").configure(analytics::configure_routes))
        // Settings routes
        .service(web::scope("/api/settings").configure(settings::configure_routes))
        // Profile routes
        .service(web::scope("/api/profile").configure(profile::configure_routes))
        // System routes
        .service(web::scope("/api/system").configure(system::configure_routes))
        // Monitoring and alerts routes
        .service(web::scope("/api/monitoring").configure(monitoring::configure_routes))
        // Offline and sync routes
        .service(web::scope("/api/sync").configure(sync::configure_routes))
        // Password manager routes
        .service(web::scope("/api/passwords").configure(password_manager::configure_routes))
        // Onboarding routes
        .service(web::scope("/api/onboarding").configure(onboarding::configure_routes))
        // AI service routes
        .service(web::scope("/api/ai").configure(ai::configure_routes))
        // Logging routes
        .service(web::scope("/api").route("/logs", web::post().to(logs::post_logs)))
        // Security routes
        .service(web::scope("/api/security")
            .configure(security::configure_routes)
            .configure(security_events::configure_routes)
        )
        // Compliance routes
        .service(web::scope("/api/compliance").configure(compliance::configure_routes))
        // Health check routes (from existing health.rs)
        // Register at both /health and /api/health for compatibility
        .configure(health::configure_health_routes)
        .service(web::scope("/api").configure(health::configure_health_routes))
        // Metrics routes
        .service(web::scope("/api/metrics").configure(metrics::configure_routes))
        // WebSocket routes (register at root level, not under /api)
        .configure(websocket::configure_websocket_routes);
}
