//! OpenAPI/Swagger documentation module
//!
//! This module defines the OpenAPI schema for the Reconciliation Platform API
//! using utoipa. The schema is automatically generated from handler annotations.
//!
//! Note: Currently includes only handlers with complete utoipa annotations.
//! Additional handlers can be added as annotations are completed.
//! See backend/openapi.yaml for the complete manual API specification.

use utoipa::OpenApi;

use crate::handlers::{auth, projects};

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
    ),
    components(schemas(
        // Note: Schemas are automatically derived from handler annotations
        // Additional schemas can be added as types are annotated with ToSchema
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

