//! Reconciliation Backend Library
//! 
//! This is the main library crate for the Reconciliation Platform backend.
//! It provides all the core functionality for data reconciliation, user management,
//! authentication, and API services.

pub mod config;
pub mod monitoring;
pub mod database;
pub mod models;
pub mod handlers;
pub mod services {
    pub mod accessibility;
    pub mod advanced_metrics;
    pub mod analytics;
    pub mod api_versioning;
    pub mod auth;
    pub mod backup_recovery;
    pub mod billing;
    pub mod cache;
    pub mod critical_alerts;
    pub mod data_source;
    pub mod database_migration;
    pub mod database_sharding;
    pub mod email;
    pub mod error_recovery;
    pub mod error_translation;
    pub mod file;
    pub mod internationalization;
    pub mod mobile_optimization;
    pub mod monitoring;
    pub mod offline_persistence;
    pub mod optimistic_ui;
    pub mod performance;
    pub mod project;
    pub mod query_optimizer;
    pub mod realtime;
    pub mod reconciliation;
    pub mod reconciliation_engine;
    pub mod secrets;
    pub mod security;
    pub mod security_monitor;
    pub mod structured_logging;
    pub mod user;
    pub mod validation;
}
pub mod middleware;
pub mod utils;
pub mod errors;
pub mod websocket;
pub mod integrations;
pub mod api {
    pub mod gdpr;
}

// Re-export commonly used types
pub use config::Config;
pub use database::Database;
pub use errors::{AppError, AppResult};

/// Application version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Application name
pub const APP_NAME: &str = "Reconciliation Backend";