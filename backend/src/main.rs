//! Main entry point for the Reconciliation Backend
//!
//! Initializes the application with resilience patterns enabled,
//! configures services, and starts the HTTP server.

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize logging
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
    // Load configuration
    let config = crate::config::Config::from_env()
        .map_err(|e| {
            eprintln!("Failed to load configuration: {}", e);
            std::process::exit(1);
        })?;
    
    // Load resilience configuration from environment (or use defaults)
    let resilience_config = crate::startup::resilience_config_from_env();
    
    // Initialize application with resilience patterns
    let app_startup = crate::startup::AppStartup::with_resilience_config(&config, resilience_config)
        .await
        .map_err(|e| {
            eprintln!("Failed to initialize application: {}", e);
            std::process::exit(1);
        })?;
    
    log::info!("🚀 Starting Reconciliation Backend Server...");
    log::info!("📊 Health check: http://{}:{}/api/health", config.host, config.port);
    log::info!("🔌 Circuit breakers enabled for database, cache, and API");
    log::info!("📈 Resilience metrics: http://{}:{}/api/health/resilience", config.host, config.port);
    
    // Initialize query optimizer after startup
    use crate::services::performance::QueryOptimizer;
    let query_optimizer = QueryOptimizer::new();
    if let Ok(indexes) = query_optimizer.optimize_reconciliation_queries().await {
        log::info!("Generated {} query optimization indexes", indexes.len());
    }
    
    use actix_web::HttpServer;
    
    // Create HTTP server with resilience-protected services
    HttpServer::new(move || {
        actix_web::App::new()
            // Add correlation ID middleware (must be first to propagate IDs)
            .wrap(crate::middleware::correlation_id::CorrelationIdMiddleware)
            // Add error handler middleware (ensures correlation IDs in error responses)
            .wrap(crate::middleware::error_handler::ErrorHandlerMiddleware)
            // Configure app data with resilience-protected services
            .configure(|cfg| {
                app_startup.configure_app_data(cfg);
            })
            // Configure routes
            .configure(crate::handlers::configure_routes)
    })
    .bind(format!("{}:{}", config.host, config.port))?
    .run()
    .await
}
