//! Main entry point for the Reconciliation Backend
//! 
//! This module sets up the Actix-web server with all necessary middleware,
//! routes, and services.

use actix_web::{web, App, HttpServer, middleware::Logger};
use actix_cors::Cors;
use std::env;

mod config;
mod database;
mod errors;
mod handlers;
mod middleware;
mod models;
mod services;
mod websocket;

use config::Config;
use database::Database;
use handlers::configure_routes;
use websocket::{WsServer, configure_websocket_routes};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize logging
    env_logger::init();

    // Load configuration
    let config = Config::from_env();
    
    // Initialize database
    let database = Database::new(&config.database_url)
        .expect("Failed to initialize database");

    // Run database migrations
    database.run_migrations()
        .expect("Failed to run database migrations");
    
    // Initialize WebSocket server
    let ws_server = WsServer::new(std::sync::Arc::new(database.clone())).start();

    // Get server configuration
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse::<u16>()
        .expect("Invalid PORT value");

    log::info!("Starting Reconciliation Backend server on {}:{}", host, port);

    // Start the server
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            // Add configuration
            .app_data(web::Data::new(config.clone()))
            .app_data(web::Data::new(database.clone()))
            .app_data(web::Data::new(ws_server.clone()))
            
            // Add middleware
            .wrap(Logger::default())
            .wrap(cors)
            .wrap(middleware::error_handler::error_handler())
            .wrap(middleware::logging::request_logging())
            .wrap(middleware::default_headers())
            .wrap(middleware::performance::compression_middleware())
            .wrap(middleware::performance::performance_middleware())
            .wrap(middleware::rate_limit::rate_limit_middleware())
            .wrap(middleware::sanitization::sanitization_middleware_fn)
            .wrap(middleware::csrf::csrf_middleware_fn)
            
            // Configure routes
            .configure(configure_routes)
            .configure(configure_websocket_routes)
            
            // Health check endpoint
            .route("/health", web::get().to(health_check))
    })
    .bind(format!("{}:{}", host, port))?
    .run()
    .await
}

/// Simple health check endpoint
async fn health_check() -> actix_web::Result<actix_web::HttpResponse> {
    Ok(actix_web::HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "service": "reconciliation-backend",
        "version": env!("CARGO_PKG_VERSION"),
        "timestamp": chrono::Utc::now()
    })))
}