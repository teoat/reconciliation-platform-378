//! Reconciliation Backend Library
//!
//! This is the main library crate for the Reconciliation Platform backend.
//! It provides all the core functionality for data reconciliation, user management,
//! authentication, and API services.

pub mod config;
pub mod database;
pub mod database_migrations;
pub mod handlers;
pub mod models;
pub mod monitoring;
pub mod services;
pub mod errors;
pub mod integrations;
pub mod middleware;
pub mod utils;
pub mod websocket;
pub mod api {
    pub mod gdpr;
}
pub mod startup;

// Test utilities module - always available for test code
// Note: This is safe to always include as it's only used in test contexts
mod test_utils;

// Export test utilities for use in tests
// Note: Made always available since test files in tests/ directory are separate crates
pub mod test_utils_export {
    pub use crate::test_utils::*;
}

// Re-export commonly used types
pub use config::Config;
pub use database::Database;
pub use errors::{AppError, AppResult};
pub use startup::{resilience_config_from_env, AppStartup};

/// Application version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Application name
pub const APP_NAME: &str = "Reconciliation Backend";
