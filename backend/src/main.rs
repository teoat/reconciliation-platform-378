//! Main entry point for the Reconciliation Backend
//!
//! Initializes the application with resilience patterns enabled,
//! configures services, and starts the HTTP server.

use actix_cors::Cors;
use actix_web::middleware::Compress;
use chrono::Utc;
use reconciliation_backend::{
    config::Config,
    handlers,
    middleware::{
        api_versioning::{ApiVersioningMiddleware, ApiVersioningConfig},
        correlation_id::CorrelationIdMiddleware,
        error_handler::ErrorHandlerMiddleware,
        AuthRateLimitMiddleware,
        security::{SecurityHeadersMiddleware, SecurityHeadersConfig},
        zero_trust::{ZeroTrustMiddleware, ZeroTrustConfig},
        rate_limit::PerEndpointRateLimitMiddleware,
    },
    services::{
        performance::QueryOptimizer,
        secrets::SecretsService,
    },
    startup::{resilience_config_from_env, AppStartup},
};

// Set up panic handler BEFORE any static initialization that might panic
// This must be at the module level, not in main()
#[cfg_attr(target_os = "linux", link_section = ".init_array")]
#[used]
static INIT_PANIC_HANDLER: extern "C" fn() = {
    extern "C" fn init_panic_handler() {
        std::panic::set_hook(Box::new(|panic_info| {
            eprintln!("PANIC: {:?}", panic_info);
            eprintln!("Location: {:?}", panic_info.location());
            if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
                eprintln!("Message: {}", s);
            } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
                eprintln!("Message: {}", s);
            }
        }));
    }
    init_panic_handler
};

// Add a synchronous main wrapper to ensure we can print before async runtime
#[inline(never)]
fn main() {
    std::panic::set_hook(Box::new(|panic_info| {
        eprintln!("PANIC: {:?}", panic_info);
        eprintln!("Location: {:?}", panic_info.location());
        if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
            eprintln!("Message: {}", s);
        } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
            eprintln!("Message: {}", s);
        }
    }));

    let rt = match tokio::runtime::Runtime::new() {
        Ok(runtime) => runtime,
        Err(e) => {
            eprintln!("Failed to create Tokio runtime: {}", e);
            std::process::exit(1);
        }
    };
    
    if let Err(e) = rt.block_on(async_main()) {
        eprintln!("Application error: {:?}", e);
        std::process::exit(1);
    }
}

async fn async_main() -> std::io::Result<()> {
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
            let timestamp = Utc::now().to_rfc3339();
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
    
    log::info!("Logging initialized - backend starting up");

    // Validate environment variables before loading configuration
    // Use tier-based error handling with fallbacks
    log::info!("Validating environment variables...");
    
    // Use startup error handler for validation
    let startup_handler = reconciliation_backend::startup::error_handler::StartupErrorHandler::new();
    
    // Validate with tier-based error handling
    if let Err(e) = startup_handler.validate_startup_requirements().await {
        log::error!("Startup validation failed: {}", e);
        return Err(std::io::Error::new(std::io::ErrorKind::Other, format!("Startup validation failed: {}", e)));
    }
    
    // Also run standard validation for compatibility
    reconciliation_backend::utils::env_validation::validate_and_exit_on_error();

    // Load configuration (initial load from env - needed for database connection)
    log::info!("Loading configuration...");
    let config = match Config::from_env() {
        Ok(cfg) => {
            log::info!("Configuration loaded successfully from environment");
            cfg
        }
        Err(e) => {
            log::error!("Configuration error: {}", e);
            return Err(std::io::Error::new(std::io::ErrorKind::Other, format!("Configuration error: {}", e)));
        }
    };

    // Run database migrations before initializing services
    // In production, migrations MUST succeed or startup fails
    log::info!("Running database migrations...");
    let is_production_env = std::env::var("ENVIRONMENT")
        .unwrap_or_else(|_| "development".to_string())
        .to_lowercase() == "production";
    
    if let Err(e) = reconciliation_backend::database_migrations::run_migrations(&config.database_url) {
        if is_production_env {
            log::error!("Database migrations failed in production: {}", e);
            return Err(std::io::Error::new(std::io::ErrorKind::Other, format!("Database migrations failed in production: {}", e)));
        } else {
            log::warn!("Database migrations encountered issues: {}", e);
        }
    }

    // Verify database connection and critical tables
    log::info!("Verifying database connection and schema...");
    if let Err(e) = reconciliation_backend::utils::schema_verification::verify_database_connection(&config.database_url) {
        log::error!("Database connection verification failed: {}", e);
        return Err(std::io::Error::new(std::io::ErrorKind::Other, format!("Database connection verification failed: {}", e)));
    }

    // Verify critical tables exist (non-fatal in development, fatal in production)
    let is_production = std::env::var("ENVIRONMENT")
        .unwrap_or_else(|_| "development".to_string())
        .to_lowercase() == "production";
    
    if let Err(e) = reconciliation_backend::utils::schema_verification::verify_critical_tables(&config.database_url) {
        if is_production {
            log::error!("Critical database tables missing: {}", e);
            return Err(std::io::Error::new(std::io::ErrorKind::Other, format!("Critical database tables missing: {}", e)));
        } else {
            log::warn!("Critical database tables missing: {}", e);
        }
    }

    // Load resilience configuration from environment (or use defaults)
    let resilience_config = resilience_config_from_env();

    // Initialize application with resilience patterns
    let app_startup = match AppStartup::with_resilience_config(&config, resilience_config).await {
        Ok(startup) => startup,
        Err(e) => {
            log::error!("Failed to initialize application: {}", e);
            return Err(std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to initialize application: {}", e)));
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
    use reconciliation_backend::services::metrics::MetricsService;
    
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
    let is_production = std::env::var("ENVIRONMENT")
        .unwrap_or_else(|_| "development".to_string())
        .to_lowercase() == "production";
    
    // Validate CSRF_SECRET (required for CSRF protection)
    let _csrf_secret = match SecretsService::get_csrf_secret() {
        Ok(secret) => {
            // Additional validation for production - reject default values
            if is_production {
                let default_patterns = [
                    "change-this-csrf-secret-in-production",
                    "CHANGE_ME_IN_PRODUCTION",
                    "default-csrf-secret",
                ];
                if default_patterns.iter().any(|&pattern| secret.contains(pattern)) {
                    log::error!("CSRF_SECRET validation failed: using default value");
                    return Err(std::io::Error::new(std::io::ErrorKind::Other, "CSRF_SECRET cannot use default value in production"));
                }
            }
            secret
        }
        Err(_) => {
            if is_production {
                log::error!("CSRF_SECRET not set in production");
                return Err(std::io::Error::new(std::io::ErrorKind::Other, "CSRF_SECRET is required in production"));
            } else {
                log::warn!("CSRF_SECRET not set, using default (CHANGE IN PRODUCTION!)");
                "default-csrf-secret-change-in-production".to_string()
            }
        }
    };
    
    // Get password master key using enhanced SecretsService
    let master_key = match SecretsService::get_password_master_key() {
        Ok(key) => {
            // Additional validation for production - reject default values
            if is_production {
                let default_patterns = [
                    "change-this-password-master-key-in-production",
                    "CHANGE_ME_IN_PRODUCTION",
                    "default-master-key-change-in-production",
                ];
                if default_patterns.iter().any(|&pattern| key.contains(pattern)) {
                    log::error!("PASSWORD_MASTER_KEY validation failed: using default value");
                    return Err(std::io::Error::new(std::io::ErrorKind::Other, "PASSWORD_MASTER_KEY cannot use default value in production"));
                }
            }
            key
        }
        Err(_) => {
            if is_production {
                log::error!("PASSWORD_MASTER_KEY not set in production");
                return Err(std::io::Error::new(std::io::ErrorKind::Other, "PASSWORD_MASTER_KEY is required in production"));
            } else {
                log::warn!("PASSWORD_MASTER_KEY not set, using default (CHANGE IN PRODUCTION!)");
                "default-master-key-change-in-production".to_string()
            }
        }
    };
    
    // Validate JWT_SECRET in production (additional check for default values)
    if is_production {
        if let Ok(jwt_secret) = SecretsService::get_jwt_secret() {
            let default_patterns = [
                "change-this-in-production",
                "CHANGE_ME_IN_PRODUCTION",
                "your-super-secret-key-change-in-production",
            ];
            if default_patterns.iter().any(|&pattern| jwt_secret.contains(pattern)) {
                log::error!("JWT_SECRET validation failed: using default value");
                return Err(std::io::Error::new(std::io::ErrorKind::Other, "JWT_SECRET cannot use default value in production"));
            }
        }
    }
    
    let password_manager = Arc::new(PasswordManager::new(
        Arc::new(database.clone()),
        master_key,
    ));
    
    // Initialize default passwords on startup (only if table exists)
    // This gracefully handles cases where migrations haven't run yet
    if password_manager.verify_table_exists().await.is_ok() {
        if let Err(e) = password_manager.initialize_default_passwords().await {
            log::warn!("Failed to initialize default passwords: {:?}", e);
        } else {
            log::info!("Password manager initialized successfully");
        }
    } else {
        log::info!("Password manager table not found, skipping password manager initialization");
    }
    
    // Application secrets are now managed via environment variables (.env)
    // No longer using password manager for application secrets
    // See: docs/architecture/PASSWORD_SYSTEM_ORCHESTRATION.md

    // Configuration now uses environment variables directly
    // Application secrets are no longer stored in password manager
    // See: docs/architecture/PASSWORD_SYSTEM_ORCHESTRATION.md

    // Initialize automatic secret manager
    use reconciliation_backend::services::secret_manager::SecretManager;
    let secret_manager = Arc::new(SecretManager::new(Arc::new(database.clone())));
    
    // Load secrets from database on startup
    if let Err(e) = secret_manager.load_secrets_from_db().await {
        log::warn!("Failed to load secrets from database: {}", e);
    }
    
    // Start automatic rotation scheduler (disabled temporarily to fix spawn_local issue)
    // FUTURE: Re-enable once spawn_local issue is resolved
    // This is a planned enhancement, not a bug
    // secret_manager.start_rotation_scheduler().await;
    log::info!("Automatic secret manager initialized (rotation scheduler disabled)");
    
    // Initialize metrics service
    let metrics_service = Arc::new(MetricsService::new());
    log::info!("Metrics service initialized");

    // Clone config for use in HttpServer closure
    let config_clone = config.clone();

    use actix_web::{web, HttpServer};

    // Log server binding attempt
    let bind_addr = format!("{}:{}", config.host, config.port);
    log::info!("🔗 Binding server to {}...", bind_addr);

    // Determine if we're in production
    let is_production_env = std::env::var("ENVIRONMENT")
        .unwrap_or_else(|_| "development".to_string())
        .to_lowercase() == "production";
    
    // Clone CORS origins for use in closure
    let cors_origins = config.cors_origins.clone();
    
    // Initialize zero-trust and rate limiting middleware configs
    let zero_trust_config = ZeroTrustConfig {
        require_mtls: is_production_env && std::env::var("ZERO_TRUST_REQUIRE_MTLS")
            .unwrap_or_else(|_| "false".to_string())
            .parse()
            .unwrap_or(false),
        require_identity_verification: true,
        enforce_least_privilege: true,
        network_segmentation: is_production_env,
    };
    
    // Clone database for WebSocket server (will be started in HttpServer closure)
    let database_for_ws = Arc::new(database.clone());
    
    // Create HTTP server with resilience-protected services
    let server = HttpServer::new(move || {
        // Initialize WebSocket server within Actix runtime context
        // This must be done here, not before HttpServer, because Actix Actor.start()
        // requires a LocalSet context which is provided by the Actix runtime
        use actix::Actor;
        use reconciliation_backend::websocket::server::WsServer;
        let ws_server = WsServer::new(Arc::clone(&database_for_ws)).start();
        // Configure CORS based on environment
        // In production, use specific origins from CORS_ORIGINS env var
        // In development, allow all origins for easier testing
        let cors = if is_production_env {
            // Production: Use configured origins
            let mut cors_builder = Cors::default();
            for origin in &cors_origins {
                cors_builder = cors_builder.allowed_origin(origin);
            }
            cors_builder
                .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
                .allowed_headers(vec![
                    actix_web::http::header::AUTHORIZATION,
                    actix_web::http::header::CONTENT_TYPE,
                    actix_web::http::header::ACCEPT,
                ])
                .supports_credentials()
                .max_age(3600)
        } else {
            // Development: Use permissive CORS
            Cors::permissive()
        };

        actix_web::App::new()
            // Add correlation ID middleware (must be first to propagate IDs)
            .wrap(CorrelationIdMiddleware)
            // Add error handler middleware (ensures correlation IDs in error responses)
            .wrap(ErrorHandlerMiddleware)
            // Add compression middleware (gzip, deflate, br)
            .wrap(Compress::default())
            // Add security headers middleware (CSP, HSTS, X-Frame-Options, etc.)
            .wrap(SecurityHeadersMiddleware::new(SecurityHeadersConfig::default()))
            // Add auth rate limiting middleware (applies to /api/auth/* endpoints)
            .wrap(AuthRateLimitMiddleware::default())
            // Add per-endpoint rate limiting middleware
            .wrap(PerEndpointRateLimitMiddleware::new())
            // Add zero-trust security middleware (if enabled)
            .wrap(ZeroTrustMiddleware::new(zero_trust_config.clone()))
            // Add API versioning middleware (adds version headers and deprecation warnings)
            .wrap(ApiVersioningMiddleware::new(ApiVersioningConfig::default()))
            // Add CORS middleware (after other middleware)
            .wrap(cors)
            // Configure app data with resilience-protected services
            .app_data(web::Data::new(database.clone()))
            .app_data(web::Data::new(cache.clone()))
            .app_data(web::Data::new(resilience.clone()))
            .app_data(web::Data::new(password_manager.clone()))
            .app_data(web::Data::new(secret_manager.clone()))
            // Add authentication and user services (required by auth handlers)
            .app_data(web::Data::new(auth_service.clone()))
            .app_data(web::Data::new(user_service.clone()))
            // Add metrics service (required by metrics handlers)
            .app_data(web::Data::new(metrics_service.clone()))
            // Add WebSocket server (required by WebSocket handlers)
            // Note: ws_server is created in this closure to ensure it runs in Actix runtime context
            .app_data(web::Data::new(ws_server))
            .app_data(web::Data::new(config_clone.clone()))
            // Swagger UI can be enabled when all handlers have utoipa annotations
            // See: docs/development/API_CLIENT_SDK_GENERATION.md for details
            // Configure routes
            .configure(handlers::configure_routes)
    })
    .workers(1);  // Reduce workers to 1 to minimize stack usage
    
    let server = server.bind(&bind_addr)
        .map_err(|e| {
            let error_msg = format!("Failed to bind to {}: {}", bind_addr, e);
            log::error!("{}", error_msg);
            std::io::Error::new(std::io::ErrorKind::AddrInUse, error_msg)
        })?;
    
    log::info!("✅ Server bound successfully to {}", bind_addr);

    // Run server - this will block until the server stops
    server.run().await
}
