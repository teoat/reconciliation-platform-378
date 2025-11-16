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
    pub mod error_logging;
    pub mod error_recovery;
    pub mod error_translation;
    pub mod file;
    pub mod internationalization;
    pub mod internationalization_data;
    pub mod internationalization_models;
    pub mod mobile_optimization;
    pub mod monitoring;
    pub mod offline_persistence;
    pub mod optimistic_ui;
    pub mod password_manager;
    pub mod performance;
    pub mod project;
    pub mod project_aggregations;
    pub mod project_analytics;
    pub mod project_crud;
    pub mod project_models;
    pub mod project_permissions;
    pub mod project_queries;
    pub mod query_optimizer;
    pub mod realtime;
    pub mod reconciliation;
    pub mod reconciliation_engine;
    pub mod resilience;
    pub mod secrets;
    pub mod security;
    pub mod security_monitor;
    pub mod structured_logging;
    pub mod user;
    pub mod validation;
}
pub mod errors;
pub mod integrations;
pub mod middleware;
pub mod utils;
pub mod websocket;
pub mod api {
    pub mod gdpr;
}
pub mod startup;

// Re-export commonly used types
pub use config::Config;
pub use database::Database;
pub use errors::{AppError, AppResult};
pub use startup::{resilience_config_from_env, AppStartup};

/// Application version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Application name
pub const APP_NAME: &str = "Reconciliation Backend";
