//! Main entry point for the Reconciliation Backend
//!
//! Initializes the application with resilience patterns enabled,
//! configures services, and starts the HTTP server.

use actix_cors::Cors;
use chrono;
use futures::future;
use serde_json;
use reconciliation_backend::{
    config::Config,
    handlers,
    middleware::{
        correlation_id::CorrelationIdMiddleware,
        error_handler::ErrorHandlerMiddleware,
        AuthRateLimitMiddleware,
        security::{SecurityHeadersMiddleware, SecurityHeadersConfig},
    },
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

    // Initialize logging with unbuffered stderr output
    eprintln!("Initializing logging...");
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
    
    // Configure env_logger to write to stderr with unbuffered output
    // env_logger writes to stderr by default, which Docker captures
    // The write_style ensures colors/styles are always applied (for visibility)
    // Check if JSON logging is enabled via environment variable
    let use_json_logging = std::env::var("JSON_LOGGING")
        .unwrap_or_else(|_| "false".to_string())
        .parse::<bool>()
        .unwrap_or(false);
    
    let mut builder = env_logger::Builder::from_env(env_logger::Env::new().default_filter_or("info"));
    builder.target(env_logger::Target::Stderr);
    
    if use_json_logging {
        // Use JSON format for structured logging (better for log aggregation)
        builder.format(|buf, record| {
            use std::io::Write;
            let timestamp = chrono::Utc::now().to_rfc3339();
            let json = serde_json::json!({
                "timestamp": timestamp,
                "level": record.level().to_string(),
                "message": record.args().to_string(),
                "module": record.module_path().unwrap_or("unknown"),
                "file": record.file().unwrap_or("unknown"),
                "line": record.line().unwrap_or(0),
            });
            writeln!(buf, "{}", json)
        });
        log::info!("JSON logging enabled - logs will be in structured JSON format");
        eprintln!("JSON logging enabled - logs will be in structured JSON format");
    } else {
        // Use human-readable format (default)
        builder
            .format_timestamp_secs()
            .format_module_path(false)
            .format_level(true)
            .write_style(env_logger::WriteStyle::Always);
    }
    
    // Initialize logger
    builder.init();
    
    // Force flush stderr to ensure logs are visible immediately in Docker
    use std::io::Write;
    std::io::stderr().flush().unwrap_or(());
    
    eprintln!("Logging initialized");
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
    log::info!("Logging initialized - backend starting up");

    // Validate environment variables before loading configuration
    log::info!("Validating environment variables...");
    reconciliation_backend::utils::env_validation::validate_and_exit_on_error();

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

    // Log server binding attempt
    let bind_addr = format!("{}:{}", config.host, config.port);
    log::info!("🔗 Binding server to {}...", bind_addr);
    eprintln!("🔗 Binding server to {}...", bind_addr);
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());

    // Create HTTP server with resilience-protected services
    let server = HttpServer::new(move || {
        // Configure CORS - use permissive for development (allows all origins)
        // In production, configure specific origins via CORS_ORIGINS env var
        // Note: Cors::permissive() allows all origins, methods, and headers
        let cors = Cors::permissive();

        actix_web::App::new()
            // Add correlation ID middleware (must be first to propagate IDs)
            .wrap(CorrelationIdMiddleware)
            // Add error handler middleware (ensures correlation IDs in error responses)
            .wrap(ErrorHandlerMiddleware)
            // Add security headers middleware (CSP, HSTS, X-Frame-Options, etc.)
            .wrap(SecurityHeadersMiddleware::new(SecurityHeadersConfig::default()))
            // Add auth rate limiting middleware (applies to /api/auth/* endpoints)
            .wrap(AuthRateLimitMiddleware::default())
            // Add CORS middleware (after other middleware)
            .wrap(cors)
            // Note: Compression middleware temporarily removed due to type compatibility issues
            // Can be re-added later with proper type handling
            // Configure app data with resilience-protected services
            .app_data(web::Data::new(database.clone()))
            .app_data(web::Data::new(cache.clone()))
            .app_data(web::Data::new(resilience.clone()))
            .app_data(web::Data::new(password_manager.clone()))
            // Add authentication and user services (required by auth handlers)
            .app_data(web::Data::new(auth_service.clone()))
            .app_data(web::Data::new(user_service.clone()))
            // Add Swagger UI for API documentation
            // Note: Swagger UI integration requires all handlers to have utoipa annotations
            // Currently using manual openapi.yaml file - Swagger UI can be enabled when more handlers are annotated
            // .service(
            //     SwaggerUi::new("/swagger-ui/{_:.*}")
            //         .url("/api-docs/openapi.json", ApiDoc::openapi())
            // )
            // Configure routes
            .configure(handlers::configure_routes)
    })
    .bind(&bind_addr)
    .map_err(|e| {
        let error_msg = format!("Failed to bind to {}: {}", bind_addr, e);
        eprintln!("❌ {}", error_msg);
        log::error!("{}", error_msg);
        std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
        std::io::Error::new(std::io::ErrorKind::AddrInUse, error_msg)
    })?;

    // Log successful binding
    log::info!("✅ Server bound successfully to {}", bind_addr);
    eprintln!("✅ Server bound successfully to {}", bind_addr);
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());

    // Start server with detailed logging
    log::info!("🚀 Starting HTTP server...");
    eprintln!("🚀 Starting HTTP server...");
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());

    // Log runtime information for debugging
    log::info!("Runtime: Tokio runtime initialized by actix-web");
    eprintln!("Runtime: Tokio runtime initialized by actix-web");
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
    
    // Log that we're about to enter the blocking server.run() call
    log::info!("Entering server.run().await - this should block indefinitely");
    eprintln!("Entering server.run().await - this should block indefinitely");
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
    
    // Record start time to measure how long server runs
    let start_time = std::time::Instant::now();
    
    // Set up signal monitoring to log when signals are received
    // Note: Actix-web handles SIGTERM/SIGINT automatically, but we log for diagnostics
    let signal_handle = {
        let mut sigterm = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .map_err(|e| {
                log::warn!("Failed to register SIGTERM handler: {}", e);
                e
            }).ok();
        let mut sigint = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::interrupt())
            .map_err(|e| {
                log::warn!("Failed to register SIGINT handler: {}", e);
                e
            }).ok();
        
        tokio::spawn(async move {
            loop {
                tokio::select! {
                    _ = async {
                        if let Some(ref mut sig) = sigterm {
                            sig.recv().await
                        } else {
                            future::pending().await
                        }
                    } => {
                        log::warn!("📡 SIGTERM signal received - server will shutdown gracefully");
                        eprintln!("📡 SIGTERM signal received - server will shutdown gracefully");
                        std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
                    }
                    _ = async {
                        if let Some(ref mut sig) = sigint {
                            sig.recv().await
                        } else {
                            future::pending().await
                        }
                    } => {
                        log::warn!("📡 SIGINT signal received - server will shutdown gracefully");
                        eprintln!("📡 SIGINT signal received - server will shutdown gracefully");
                        std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
                    }
                }
            }
        })
    };
    
    // Run server - this will block until the server stops
    // Actix-web handles SIGTERM/SIGINT automatically for graceful shutdown
    // The server.run().await will complete when the server stops
    // Note: server.run().await returns Result<(), std::io::Error>
    // If it returns Ok(()), the server stopped gracefully
    // If it returns Err, there was an error
    let run_result = server.run().await;
    
    // Cancel signal monitoring task
    signal_handle.abort();
    
    // Calculate runtime duration
    let runtime_duration = start_time.elapsed();
    log::info!("Server.run().await completed after {:?}", runtime_duration);
    eprintln!("Server.run().await completed after {:?}", runtime_duration);
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
    
    match run_result {
        Ok(_) => {
            log::info!("Server stopped gracefully (Ok(())) after {:?}", runtime_duration);
            eprintln!("Server stopped gracefully (Ok(())) after {:?}", runtime_duration);
            std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
            
            // Log potential reasons for graceful shutdown
            if runtime_duration.as_secs() < 5 {
                log::warn!("⚠️  Server stopped very quickly ({:?}) - possible signal received or runtime issue", runtime_duration);
                eprintln!("⚠️  Server stopped very quickly ({:?}) - possible signal received or runtime issue", runtime_duration);
                std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
            }
        }
        Err(e) => {
            let error_msg = format!("Server error after {:?}: {}", runtime_duration, e);
            log::error!("❌ {}", error_msg);
            eprintln!("❌ {}", error_msg);
            std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
            return Err(e);
        }
    }
    
    // Log server completion (only reached if server stops)
    log::info!("✅ HTTP server stopped");
    eprintln!("✅ HTTP server stopped");
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());

    log::info!("👋 Backend shutting down gracefully");
    eprintln!("👋 Backend shutting down gracefully");
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());

    Ok(())
}
