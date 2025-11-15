//! Example: Application Startup with Resilience Manager
//!
//! This example demonstrates how to initialize the application
//! with resilience patterns enabled.

use actix_web::{web, App, HttpServer};
use std::sync::Arc;
use reconciliation_backend::{
    Config, 
    AppStartup, 
    resilience_config_from_env,
    handlers::configure_routes,
};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize logging
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
    // Load configuration
    let config = Config::from_env()
        .expect("Failed to load configuration");
    
    // Load resilience configuration from environment (or use defaults)
    let resilience_config = resilience_config_from_env();
    
    // Initialize application with resilience patterns
    let app_startup = AppStartup::with_resilience_config(&config, resilience_config)
        .await
        .expect("Failed to initialize application");
    
    log::info!("🚀 Starting Reconciliation Backend Server...");
    log::info!("📊 Health check: http://{}:{}/api/health", config.host, config.port);
    log::info!("🔌 Circuit breakers enabled for database, cache, and API");
    
    // Create HTTP server with resilience-protected services
    HttpServer::new(move || {
        App::new()
            // Configure app data with resilience-protected services
            .configure(|cfg| {
                app_startup.configure_app_data(cfg);
            })
            // Configure routes
            .configure(configure_routes)
    })
    .bind(format!("{}:{}", config.host, config.port))?
    .run()
    .await
}

