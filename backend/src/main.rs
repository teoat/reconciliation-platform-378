//! Main entry point for the Reconciliation Backend
//!
//! Initializes the application with resilience patterns enabled,
//! configures services, and starts the HTTP server.

use actix_cors::Cors;
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
    eprintln!("Initializing logging...");
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    eprintln!("Logging initialized");
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
    log::info!("Logging initialized");

    // Load configuration (initial load from env - needed for database connection)
    log::info!("Loading configuration...");
    let config = match Config::from_env() {
        Ok(cfg) => {
            log::info!("Configuration loaded successfully from environment");
            cfg
        }
        Err(e) => {
            eprintln!("Failed to load configuration: {}", e);
            log::error!("Configuration error: {}", e);
            std::process::exit(1);
        }
    };

    // Run database migrations before initializing services
    // Note: Migrations may fail if base tables don't exist yet - that's OK, we'll continue
    log::info!("Running database migrations...");
    match reconciliation_backend::database_migrations::run_migrations(&config.database_url) {
        Ok(_) => {
            log::info!("Database migrations completed successfully");
        }
        Err(e) => {
            log::warn!("Database migrations encountered issues: {}", e);
            log::warn!("Continuing startup - tables may be created on first use");
            eprintln!("Migration warning (non-fatal): {}", e);
            // Don't exit - allow application to start even if migrations fail
            // This allows the app to work with an empty database
        }
    }

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

    // Initialize authentication and user services
    use std::sync::Arc;
    use reconciliation_backend::services::password_manager::PasswordManager;
    use reconciliation_backend::services::auth::AuthService;
    use reconciliation_backend::services::user::UserService;
    
    // Create auth service (not wrapped in Arc yet, as UserService needs the value)
    let auth_service_value = AuthService::new(
        config.jwt_secret.clone(),
        config.jwt_expiration,
    );
    log::info!("Auth service initialized");
    
    // Create user service (requires database and auth service value)
    let user_service_value = UserService::new(
        Arc::new(database.clone()),
        auth_service_value.clone(),
    );
    log::info!("User service initialized");
    
    // Now wrap both in Arc for app_data
    let auth_service = Arc::new(auth_service_value);
    let user_service = Arc::new(user_service_value);
    
    // Initialize password manager
    let master_key = std::env::var("PASSWORD_MASTER_KEY")
        .unwrap_or_else(|_| {
            log::warn!("PASSWORD_MASTER_KEY not set, using default (CHANGE IN PRODUCTION!)");
            "default-master-key-change-in-production".to_string()
        }); // Safe: Default value for development
    
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
    
    // Application secrets are now managed via environment variables (.env)
    // No longer using password manager for application secrets
    // See: docs/architecture/PASSWORD_SYSTEM_ORCHESTRATION.md

    // Configuration now uses environment variables directly
    // Application secrets are no longer stored in password manager
    // See: docs/architecture/PASSWORD_SYSTEM_ORCHESTRATION.md

    use actix_web::{web, HttpServer};

    // Create HTTP server with resilience-protected services
    HttpServer::new(move || {
        // Configure CORS - use permissive for development (allows all origins)
        // In production, configure specific origins via CORS_ORIGINS env var
        // Note: Cors::permissive() allows all origins, methods, and headers
        let cors = Cors::permissive();

        actix_web::App::new()
            // Add correlation ID middleware (must be first to propagate IDs)
            .wrap(CorrelationIdMiddleware)
            // Add error handler middleware (ensures correlation IDs in error responses)
            .wrap(ErrorHandlerMiddleware)
            // Add CORS middleware (after other middleware)
            .wrap(cors)
            // Configure app data with resilience-protected services
            .app_data(web::Data::new(database.clone()))
            .app_data(web::Data::new(cache.clone()))
            .app_data(web::Data::new(resilience.clone()))
            .app_data(web::Data::new(password_manager.clone()))
            // Add authentication and user services (required by auth handlers)
            .app_data(web::Data::new(auth_service.clone()))
            .app_data(web::Data::new(user_service.clone()))
            // Configure routes
            .configure(handlers::configure_routes)
    })
    .bind(format!("{}:{}", config.host, config.port))?
    .run()
    .await
}
