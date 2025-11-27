//! OpenAPI/Swagger documentation module
//!
//! This module defines the OpenAPI schema for the Reconciliation Platform API
//! using utoipa. The schema is automatically generated from handler annotations.
//!
//! Note: Currently includes only handlers with complete utoipa annotations.
//! Additional handlers can be added as annotations are completed.
//! See backend/openapi.yaml for the complete manual API specification.

use utoipa::OpenApi;

use crate::handlers::{ai, analytics, auth, files, health, logs, metrics, monitoring, onboarding, password_manager, profile, projects, reconciliation, security, settings, sync, system, users};

/// OpenAPI documentation for the Reconciliation Platform API
/// 
/// This schema is automatically generated from handler function annotations.
/// For complete API documentation, see backend/openapi.yaml
#[derive(OpenApi)]
#[openapi(
    paths(
        // Authentication endpoints (with utoipa annotations)
        auth::login,
        
        // Project management endpoints (with utoipa annotations)
        projects::get_projects,
        
        // Logging endpoints (with utoipa annotations)
        logs::post_logs,
        
        // User management endpoints (with utoipa annotations)
        users::get_users,
        users::create_user,
        users::get_user,
        
        // Health check endpoints (with utoipa annotations)
        health::health_check,
        health::get_resilience_status,
        
        // File management endpoints (with utoipa annotations)
        files::get_file,
        files::delete_file,
        files::init_resumable_upload,
        
        // Reconciliation endpoints (with utoipa annotations)
        reconciliation::get_reconciliation_jobs,
        reconciliation::create_reconciliation_job,
        reconciliation::get_reconciliation_job,
        reconciliation::get_reconciliation_results,
        
        // Monitoring endpoints (with utoipa annotations)
        monitoring::get_health,
        monitoring::get_metrics,
        monitoring::get_alerts,
        monitoring::get_system_metrics,
        
        // Settings endpoints (with utoipa annotations)
        settings::get_settings,
        settings::update_settings,
        settings::reset_settings,
        
        // Profile endpoints (with utoipa annotations)
        profile::get_profile,
        profile::update_profile,
        profile::upload_avatar,
        profile::get_profile_stats,
        
        // System endpoints (with utoipa annotations)
        system::get_metrics,
        
        // Additional user endpoints (with utoipa annotations)
        users::update_user,
        users::delete_user,
        users::search_users,
        users::get_user_statistics,
        users::get_user_preferences,
        users::update_user_preferences,
        
        // Analytics endpoints (with utoipa annotations)
        analytics::get_dashboard_data,
        analytics::get_project_stats,
        analytics::get_user_activity,
        analytics::get_reconciliation_stats,
        
        // Sync endpoints (with utoipa annotations)
        sync::get_sync_status,
        sync::sync_data,
        sync::get_synced_data,
        sync::get_unsynced_data,
        sync::recover_unsynced,
        
        // AI endpoints (with utoipa annotations)
        ai::chat_handler,
        ai::health_handler,
        
        // Security endpoints (with utoipa annotations)
        security::post_csp_report,
        
        // Metrics endpoints (with utoipa annotations)
        metrics::get_metrics,
        metrics::get_metrics_summary,
        metrics::get_metric,
        metrics::health_with_metrics,
        
        // Password Manager endpoints (with utoipa annotations)
        password_manager::list_passwords,
        password_manager::get_password,
        password_manager::create_password,
        password_manager::rotate_password,
        password_manager::update_rotation_interval,
        password_manager::get_rotation_schedule,
        
        // Onboarding endpoints (with utoipa annotations)
        onboarding::get_onboarding_progress,
        onboarding::sync_onboarding_progress,
        onboarding::register_device,
        onboarding::get_user_devices,
    ),
    components(schemas(
        // Error response schema
        crate::errors::ErrorResponse,
        // Note: ApiResponse and PaginatedResponse are generic types
        // They are automatically included via handler annotations
    )),
    tags(
        (name = "Authentication", description = "User authentication and authorization endpoints"),
        (name = "Users", description = "User management operations"),
        (name = "Projects", description = "Project management operations"),
        (name = "Reconciliation", description = "Reconciliation job operations"),
        (name = "Files", description = "File upload and management"),
        (name = "Health", description = "Health check and system status endpoints"),
        (name = "Monitoring", description = "Monitoring, metrics, and alerting endpoints"),
        (name = "System", description = "System information endpoints"),
        (name = "Profile", description = "User profile management"),
        (name = "Settings", description = "User settings management"),
        (name = "Sync", description = "Offline data synchronization"),
        (name = "Password Manager", description = "Password manager operations"),
        (name = "Onboarding", description = "User onboarding operations"),
        (name = "Logging", description = "Client-side logging endpoints"),
        (name = "Analytics", description = "Analytics and statistics endpoints"),
        (name = "AI", description = "AI service endpoints"),
        (name = "Security", description = "Security-related endpoints"),
        (name = "Metrics", description = "System metrics endpoints"),
    ),
    info(
        title = "Reconciliation Platform API",
        version = "2.0.0",
        description = "Enterprise-grade reconciliation platform API with comprehensive endpoints for data reconciliation, user management, and system monitoring.",
        contact(
            name = "API Support",
            email = "api-support@reconciliation.platform"
        ),
        license(
            name = "Proprietary"
        )
    ),
    servers(
        (url = "http://localhost:2000/api", description = "Local development server"),
        (url = "https://api.reconciliation.platform/api", description = "Production server")
    )
)]
pub struct ApiDoc;

