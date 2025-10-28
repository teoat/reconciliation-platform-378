//! Reconciliation Backend Library
//! 
//! This is the main library crate for the Reconciliation Platform backend.
//! It provides all the core functionality for data reconciliation, user management,
//! authentication, and API services.

pub mod config;
pub mod database;
pub mod models;
pub mod handlers;
pub mod services;
pub mod middleware;
pub釆mod utils;
pub mod errors;
pub mod websocket;
pub mod integrations;
pub mod api;

// Re-export commonly used types
pub use config::Config;
pub use database::Database;
pub use errors::{AppError, AppResult};

/// Application version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Application name
pub const APP_NAME: &str = "Reconciliation Backend";