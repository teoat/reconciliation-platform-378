//! Main entry point for the Reconciliation Backend
//!
//! Initializes the application with resilience patterns enabled,
//! configures services, and starts the HTTP server.

use reconciliation_backend::{
    config::Config,
    handlers,
    middleware::{correlation_id::CorrelationIdMiddleware, error_handler::ErrorHandlerMiddleware},
    services::performance::QueryOptimizer,
    startup::{resilience_config_from_env, AppStartup},
};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Set up panic handler to capture panics
    std::panic::set_hook(Box::new(|panic_info| {
        eprintln!("PANIC: {:?}", panic_info);
        eprintln!("Location: {:?}", panic_info.location());
        if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
            eprintln!("Message: {}", s);
        } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
            eprintln!("Message: {}", s);
        }
    }));

    // Print to stderr immediately (before logging init) for debugging
    eprintln!("🚀 Backend starting...");
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());

    // Initialize logging
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    log::info!("Logging initialized");

    // Load configuration
    log::info!("Loading configuration...");
    let config = match Config::from_env() {
        Ok(cfg) => {
            log::info!("Configuration loaded successfully");
            cfg
        }
        Err(e) => {
            eprintln!("Failed to load configuration: {}", e);
            log::error!("Configuration error: {}", e);
            std::process::exit(1);
        }
    };

    // Load resilience configuration from environment (or use defaults)
    let resilience_config = resilience_config_from_env();

    // Initialize application with resilience patterns
    let app_startup = match AppStartup::with_resilience_config(&config, resilience_config).await {
        Ok(startup) => startup,
        Err(e) => {
            eprintln!("Failed to initialize application: {}", e);
            std::process::exit(1);
        }
    };

    log::info!("🚀 Starting Reconciliation Backend Server...");
    log::info!(
        "📊 Health check: http://{}:{}/api/health",
        config.host,
        config.port
    );
    log::info!("🔌 Circuit breakers enabled for database, cache, and API");
    log::info!(
        "📈 Resilience metrics: http://{}:{}/api/health/resilience",
        config.host,
        config.port
    );

    // Initialize query optimizer after startup (non-blocking, don't fail if it errors)
    let query_optimizer = QueryOptimizer::new();
    if let Ok(indexes) = query_optimizer.optimize_reconciliation_queries().await {
        log::info!("Generated {} query optimization indexes", indexes.len());
    } else {
        log::warn!("Query optimizer initialization failed, continuing without optimization");
    }

    // Extract cloneable components for use in HttpServer closure
    let database = app_startup.database().clone();
    let cache = app_startup.cache().clone();
    let resilience = app_startup.resilience().clone();

    // Initialize password manager
    use std::sync::Arc;
    use reconciliation_backend::services::password_manager::PasswordManager;
    
    let master_key = std::env::var("PASSWORD_MASTER_KEY")
        .unwrap_or_else(|_| {
            log::warn!("PASSWORD_MASTER_KEY not set, using default (CHANGE IN PRODUCTION!)");
            "default-master-key-change-in-production".to_string()
        });
    
    let password_manager = Arc::new(PasswordManager::new(
        Arc::new(database.clone()),
        master_key,
    ));
    
    // Initialize default passwords on startup
    if let Err(e) = password_manager.initialize_default_passwords().await {
        log::warn!("Failed to initialize default passwords: {:?}", e);
    } else {
        log::info!("Default passwords initialized: AldiBabi, AldiAnjing, YantoAnjing, YantoBabi");
    }
    
    // Initialize all application passwords from environment (migration)
    if let Err(e) = password_manager.initialize_application_passwords().await {
        log::warn!("Failed to initialize application passwords: {:?}", e);
    } else {
        log::info!("Application passwords migrated to password manager");
    }

    use actix_web::{web, HttpServer};

    // Create HTTP server with resilience-protected services
    HttpServer::new(move || {
        actix_web::App::new()
            // Add correlation ID middleware (must be first to propagate IDs)
            .wrap(CorrelationIdMiddleware)
            // Add error handler middleware (ensures correlation IDs in error responses)
            .wrap(ErrorHandlerMiddleware)
            // Configure app data with resilience-protected services
            .app_data(web::Data::new(database.clone()))
            .app_data(web::Data::new(cache.clone()))
            .app_data(web::Data::new(resilience.clone()))
            .app_data(web::Data::from(password_manager.clone()))
            // Configure routes
            .configure(handlers::configure_routes)
    })
    .bind(format!("{}:{}", config.host, config.port))?
    .run()
    .await
}
