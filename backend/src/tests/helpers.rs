//! Integration test helper utilities
//!
//! This module re-exports common test utilities and provides
//! integration-test-specific helpers.

// Re-export test utilities from the centralized test_utils module
pub use crate::test_utils::database::create_test_db;

use crate::database::Database;
use actix_web::{web, App};
use std::sync::Arc;

/// Create a test application with full service configuration
/// This is for integration tests that need the full app context
pub async fn create_integration_test_app() -> App<
    impl actix_web::dev::ServiceFactory<
        actix_web::dev::ServiceRequest,
        Config = (),
        Error = actix_web::Error,
        InitError = (),
    >,
> {
    let db = create_test_db().await;

    App::new()
        .app_data(web::Data::new(Arc::new(db)))
        .configure(crate::handlers::configure_routes)
}

/// Cleanup test environment after integration tests
pub async fn cleanup_integration_test_env(db: &Database) {
    if let Err(e) = crate::test_utils::database::cleanup_test_data(db).await {
        log::warn!("Failed to cleanup test data: {}", e);
    }
}
