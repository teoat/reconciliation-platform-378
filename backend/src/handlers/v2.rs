use actix_web::web;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    // V2 API routes - Enhanced user management and future features

    // User management routes (V2)
    cfg.service(
        web::scope("/users")
            .configure(crate::api::v2::handlers::users::configure_routes)
    );

    // Future V2 routes can be added here:
    // - Enhanced project management
    // - Advanced analytics
    // - Batch operations
    // - Real-time features
}
