//! SSOT: Backend Main Entry Point - Application bootstrap and server startup
//! This file is the SINGLE SOURCE OF TRUTH for the main application entry point
//! Last Updated: January 2025
//! Version: 2.0
//! Status: ✅ Active and Mandatory

use actix_web::{web, App, HttpServer, HttpResponse, Result, middleware::Logger};
use actix_cors::Cors;
use std::env;
use std::time::Duration;
use redis;
use log::{info, warn, error};
use uuid::Uuid;
use num_cpus;
use reconciliation_backend::{
    database::Database,
    config::Config,
    handlers,
    api::gdpr,
    services::cache::MultiLevelCache,
    services::backup_recovery::{BackupConfig, BackupSchedule, RetentionPolicy, StorageConfig},
    middleware::{AuthMiddleware, RequestIdMiddleware},
};
// Import concrete services from their modules
use reconciliation_backend::services::auth::AuthService;
use reconciliation_backend::services::user::UserService;
use reconciliation_backend::services::project::ProjectService;
use reconciliation_backend::services::reconciliation::ReconciliationService;
use reconciliation_backend::services::file::FileService;
use reconciliation_backend::services::analytics::AnalyticsService;
use reconciliation_backend::services::monitoring::MonitoringService;
use reconciliation_backend::services::backup_recovery::BackupService;
use reconciliation_backend::services::critical_alerts::CriticalAlertManager;
use reconciliation_backend::services::database_migration::DatabaseMigrationService;

/// Validate required environment variables at startup
fn validate_environment() -> Result<(), String> {
    let env_name = env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string());
    let is_production = !env_name.eq_ignore_ascii_case("development") 
        && !env_name.eq_ignore_ascii_case("dev") 
        && !env_name.eq_ignore_ascii_case("test");

    let mut errors = Vec::new();

    // Required variables
    let required_vars = vec!["DATABASE_URL", "JWT_SECRET"];
    for var in required_vars {
        match env::var(var) {
            Ok(val) if val.trim().is_empty() => {
                errors.push(format!("{} cannot be empty", var));
            }
            Err(_) => {
                errors.push(format!("{} is required", var));
            }
            _ => {}
        }
    }

    // Validate JWT_SECRET length in production
    if is_production {
        if let Ok(jwt_secret) = env::var("JWT_SECRET") {
            if jwt_secret.len() < 32 {
                errors.push("JWT_SECRET must be at least 32 characters in production".to_string());
            }
        }
    }

    // Validate DATABASE_URL format
    if let Ok(db_url) = env::var("DATABASE_URL") {
        if !db_url.starts_with("postgresql://") && !db_url.starts_with("postgres://") {
            errors.push("DATABASE_URL must start with 'postgresql://' or 'postgres://'".to_string());
        }
    }

    // Validate REDIS_URL in production
    if is_production {
        if env::var("REDIS_URL").is_err() {
            errors.push("REDIS_URL is required in production".to_string());
        } else if let Ok(redis_url) = env::var("REDIS_URL") {
            if !redis_url.starts_with("redis://") && !redis_url.starts_with("rediss://") {
                errors.push("REDIS_URL must start with 'redis://' or 'rediss://'".to_string());
            }
        }
    }

    // Validate CSRF_SECRET in production
    if is_production {
        match env::var("CSRF_SECRET") {
            Ok(secret) if secret.len() < 32 => {
                errors.push("CSRF_SECRET must be at least 32 characters in production".to_string());
            }
            Err(_) => {
                errors.push("CSRF_SECRET is required in production".to_string());
            }
            _ => {}
        }
    }

    // Validate optional but important variables
    if env::var("SENTRY_DSN").is_err() && is_production {
        warn!("SENTRY_DSN not set - error tracking disabled (recommended in production)");
    }

    // Validate backup configuration if enabled
    if let Ok(enabled) = env::var("ENABLE_AUTOMATED_BACKUPS") {
        if enabled == "true" {
            if env::var("BACKUP_S3_BUCKET").is_err() {
                errors.push("BACKUP_S3_BUCKET is required when ENABLE_AUTOMATED_BACKUPS=true".to_string());
            }
            if let Ok(key) = env::var("BACKUP_ENCRYPTION_KEY") {
                if key.len() < 32 {
                    warn!("BACKUP_ENCRYPTION_KEY is shorter than recommended 32 characters");
                }
            } else if is_production {
                errors.push("BACKUP_ENCRYPTION_KEY is required when ENABLE_AUTOMATED_BACKUPS=true in production".to_string());
            }
        }
    }

    // Validate CORS_ORIGINS format
    if let Ok(cors_origins) = env::var("CORS_ORIGINS") {
        for origin in cors_origins.split(',') {
            let origin = origin.trim();
            if !origin.starts_with("http://") && !origin.starts_with("https://") {
                errors.push(format!("Invalid CORS origin format: {} (must start with http:// or https://)", origin));
            }
        }
    }

    if !errors.is_empty() {
        return Err(errors.join("; "));
    }

    Ok(())
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Validate environment variables at startup
    if let Err(e) = validate_environment() {
        error!("Environment validation failed: {}", e);
        error!("Please set the required environment variables and restart the application");
        std::process::exit(1);
    }

    info!("Environment validation passed");

    // Get database URL from environment
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL environment variable must be set");

    // Initialize Sentry error tracking (optional - requires SENTRY_DSN env var)
    let _sentry = if let Ok(dsn) = env::var("SENTRY_DSN") {
        info!("Sentry error tracking enabled");
        Some(sentry::init((
            dsn,
            sentry::ClientOptions {
                release: sentry::release_name!(),
                environment: Some(
                    env::var("ENVIRONMENT")
                        .unwrap_or_else(|_| "development".to_string())
                        .into()
                ),
                ..Default::default()
            },
        )))
    } else {
        warn!("SENTRY_DSN not set - error tracking disabled");
        None
    };

    // Initialize monitoring alerts
    let critical_alert_manager = CriticalAlertManager::new();
    log::info!("Critical alerts configured: {} alerts", critical_alert_manager.get_alerts().len());
    
    // Initialize database migration service
    let mut migration_service = DatabaseMigrationService::new(&database_url)
        .map_err(|e| {
            error!("Failed to initialize migration service: {}", e);
            std::io::Error::new(std::io::ErrorKind::Other, e.to_string())
        })?;
    
    // Check if database needs migrations
    if !migration_service
        .is_database_up_to_date()
        .await
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?
    {
        log::info!("Database migrations needed - running migrations...");
        let result = migration_service
            .run_migrations()
            .await
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        log::info!("Migrations completed: {} applied, {} failed", 
            result.applied_migrations.len(), result.failed_migrations.len());
    } else {
        log::info!("Database is up to date");
    }

    // Enforce REDIS_URL in non-development environments
    let redis_url = match env::var("REDIS_URL") {
        Ok(url) => url,
        Err(_) => {
            let env_name = env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string());
            if env_name.eq_ignore_ascii_case("development") || env_name.eq_ignore_ascii_case("dev") || env_name.eq_ignore_ascii_case("test") {
                "redis://localhost:6379".to_string()
            } else {
                error!("REDIS_URL is required in non-development environments");
                std::process::exit(1);
            }
        }
    };

    // Structured logging initialization
    if env::var("RUST_LOG").is_err() {
        env::set_var("RUST_LOG", "info");
    }
    env_logger::init();
    
    log::info!("🚀 Starting 378 Reconciliation Platform Backend");
    log::info!("📊 Database URL: {}", database_url);
    log::info!("🔴 Redis URL: {}", redis_url);

    // JWT secret from environment
    let jwt_secret = env::var("JWT_SECRET")
        .expect("JWT_SECRET environment variable must be set for security");
    
    let jwt_expiration = env::var("JWT_EXPIRATION")
        .unwrap_or_else(|_| "86400".to_string())
        .parse::<i64>()
        .unwrap_or_else(|_| {
            warn!("Invalid JWT_EXPIRATION value, using default 86400");
            86400
        });
    
    // CORS origins from environment
    let cors_origins = env::var("CORS_ORIGINS")
        .unwrap_or_else(|_| "http://localhost:1000,http://localhost:3000,http://localhost:5173".to_string())
        .split(',')
        .map(|s| s.trim().to_string())
        .collect::<Vec<String>>();
    
    // Create config first
    let config = Config {
        host: "0.0.0.0".to_string(),
        port: 2000,
        database_url: database_url.clone(),
        redis_url: redis_url.clone(),
        jwt_secret: jwt_secret.clone(),
        jwt_expiration,
        cors_origins: cors_origins.clone(),
        log_level: "info".to_string(),
        max_file_size: 10485760,
        upload_path: "./uploads".to_string(),
    };

    // Initialize database
    let database = Database::new(&database_url).await
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;

    // Initialize services
use std::sync::Arc;
    let auth_service = Arc::new(AuthService::new(config.jwt_secret.clone(), config.jwt_expiration));
    let security_metrics = Arc::new(reconciliation_backend::monitoring::SecurityMetrics::default());
    let user_service = Arc::new(UserService::new(database.clone(), (*auth_service).clone()));
    let project_service = Arc::new(ProjectService::new(database.clone()));
    let reconciliation_service = Arc::new(ReconciliationService::new(database.clone()));
    let file_service = Arc::new(FileService::new(database.clone(), "uploads".to_string()));
    let analytics_service = Arc::new(AnalyticsService::new(database.clone()));
    let monitoring_service = Arc::new(MonitoringService::new());

    // Initialize multi-level cache for performance optimization
    let cache_service = Arc::new(
        MultiLevelCache::new(&redis_url)
            .unwrap_or_else(|e| {
                log::warn!("Failed to initialize cache service with Redis URL {}: {}. Attempting fallback to localhost for development.", redis_url, e);
                // Fallback to localhost only for development
                let env_name = env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string());
                if env_name.eq_ignore_ascii_case("development") || env_name.eq_ignore_ascii_case("dev") {
                    MultiLevelCache::new("redis://localhost:6379")
                        .unwrap_or_else(|fallback_err| {
                            error!("Failed to create fallback cache: {}. Redis connection required.", fallback_err);
                            panic!("Cannot proceed without cache service")
                        })
                } else {
                    error!("Redis connection failed in non-development environment. Cannot proceed.");
                    panic!("Redis connection required in production")
                }
            })
    );
    log::info!("✅ Multi-level cache initialized");

    // OPTIONAL: Initialize automated backup service if enabled
    if env::var("ENABLE_AUTOMATED_BACKUPS").unwrap_or_else(|_| "false".to_string()) == "true" {
        log::info!("📦 Automated backups enabled");
        
        // Initialize backup service with S3 storage
        let backup_bucket = env::var("BACKUP_S3_BUCKET").expect("BACKUP_S3_BUCKET must be set when ENABLE_AUTOMATED_BACKUPS=true");
        let aws_region = env::var("AWS_REGION").unwrap_or_else(|_| "us-east-1".to_string());
        
        let backup_config = BackupConfig {
            enabled: true,
            schedule: BackupSchedule::Interval(Duration::from_secs(3600)), // Hourly
            retention_policy: RetentionPolicy {
                daily_retention_days: 7,
                weekly_retention_weeks: 4,
                monthly_retention_months: 12,
                yearly_retention_years: 5,
            },
            storage_config: StorageConfig::S3 {
                bucket: backup_bucket,
                region: aws_region,
                prefix: "backups/".to_string(),
            },
            compression: true,
            encryption: true,
            encryption_key: env::var("BACKUP_ENCRYPTION_KEY").ok(),
        };
        
        let backup_service = Arc::new(BackupService::new(backup_config.clone()));
        
        // Spawn background backup task
        let backup_service_clone = backup_service.clone();
        tokio::spawn(async move {
            log::info!("🔄 Starting automated backup scheduler");
            let mut interval = tokio::time::interval(Duration::from_secs(3600));
            let mut consecutive_failures: u32 = 0;
            loop {
                interval.tick().await;
                log::info!("📦 Running scheduled backup...");
                match backup_service_clone.create_full_backup().await {
                    Ok(backup_id) => {
                        log::info!("✅ Backup completed successfully: {}", backup_id);
                        consecutive_failures = 0;
                    }
                    Err(e) => {
                        consecutive_failures = consecutive_failures.saturating_add(1);
                        log::error!("❌ Backup failed (attempt {}): {}", consecutive_failures, e);
                        // Exponential backoff capped to 32 minutes
                        let backoff_secs = (2u64.saturating_pow(consecutive_failures.min(5))) * 60;
                        log::warn!("Waiting {}s before next backup attempt due to failures", backoff_secs);
                        tokio::time::sleep(Duration::from_secs(backoff_secs)).await;
                    }
                }
            }
        });
    }

    // Initialize Redis client for rate limiting
    let redis_client = Arc::new(
        redis::Client::open(redis_url.clone())
            .map_err(|e| {
                error!("Failed to create Redis client: {}", e);
                std::io::Error::new(std::io::ErrorKind::ConnectionRefused, e.to_string())
            })?
    );

    // Initialize and validate security configuration values
    let csrf_secret = match env::var("CSRF_SECRET") {
        Ok(secret) => {
            if secret.len() < 32 {
                let env_name = env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string());
                if env_name.eq_ignore_ascii_case("development") || env_name.eq_ignore_ascii_case("dev") {
                    warn!("CSRF_SECRET is too short ({} chars, minimum 32 recommended). Using in development only.", secret.len());
                    secret
                } else {
                    error!("CSRF_SECRET is too short ({} chars). Minimum 32 characters required for production.", secret.len());
                    return Err(std::io::Error::new(
                        std::io::ErrorKind::InvalidInput,
                        "CSRF_SECRET must be at least 32 characters in production"
                    ));
                }
            } else {
                secret
            }
        }
        Err(_) => {
            let env_name = env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string());
            if env_name.eq_ignore_ascii_case("development") || env_name.eq_ignore_ascii_case("dev") {
                warn!("CSRF_SECRET not set. Generating temporary secret for development. Set CSRF_SECRET for production.");
                // Generate a random secret using UUIDs
                format!("{}-{}", uuid::Uuid::new_v4(), uuid::Uuid::new_v4())
            } else {
                error!("CSRF_SECRET environment variable must be set in production");
                return Err(std::io::Error::new(
                    std::io::ErrorKind::InvalidInput,
                    "CSRF_SECRET environment variable must be set"
                ));
            }
        }
    };
    let mut rate_limit_requests = env::var("RATE_LIMIT_REQUESTS").ok().and_then(|v| v.parse().ok()).unwrap_or(1000);
    let mut rate_limit_window = env::var("RATE_LIMIT_WINDOW").ok().and_then(|v| v.parse().ok()).unwrap_or(3600);
    if rate_limit_requests == 0 { rate_limit_requests = 1000; }
    if rate_limit_requests > 1_000_000 { rate_limit_requests = 1_000_000; }
    if rate_limit_window < 10 { rate_limit_window = 10; }
    if rate_limit_window > 86_400 { rate_limit_window = 86_400; }
    
    // Configure request size limits
    let max_request_size = env::var("MAX_REQUEST_SIZE")
        .ok()
        .and_then(|v| v.parse::<usize>().ok())
        .unwrap_or(10 * 1024 * 1024); // Default: 10MB

    // Configure security headers
    let security_headers_config = {
        let mut config = reconciliation_backend::middleware::SecurityHeadersConfig::default();

        // Allow disabling individual security headers via environment variables
        if let Ok(val) = env::var("DISABLE_CSP") {
            if val == "true" { config.enable_csp = false; }
        }
        if let Ok(val) = env::var("DISABLE_HSTS") {
            if val == "true" { config.enable_hsts = false; }
        }
        if let Ok(val) = env::var("DISABLE_X_FRAME_OPTIONS") {
            if val == "true" { config.enable_x_frame_options = false; }
        }
        if let Ok(val) = env::var("DISABLE_X_CONTENT_TYPE_OPTIONS") {
            if val == "true" { config.enable_x_content_type_options = false; }
        }
        if let Ok(val) = env::var("DISABLE_X_XSS_PROTECTION") {
            if val == "true" { config.enable_x_xss_protection = false; }
        }
        if let Ok(val) = env::var("DISABLE_REFERRER_POLICY") {
            if val == "true" { config.enable_referrer_policy = false; }
        }

        // Custom CSP directives
        if let Ok(csp) = env::var("CUSTOM_CSP") {
            config.csp_directives = Some(csp);
        }

        // Custom HSTS max age
        if let Ok(val) = env::var("HSTS_MAX_AGE") {
            if let Ok(max_age) = val.parse::<u32>() {
                config.hsts_max_age = Some(max_age);
            }
        }

        // Custom frame options
        if let Ok(frame_options) = env::var("X_FRAME_OPTIONS") {
            config.frame_options = Some(frame_options);
        }

        // Custom referrer policy
        if let Ok(referrer_policy) = env::var("REFERRER_POLICY") {
            config.referrer_policy = Some(referrer_policy);
        }

        config
    };
    
    HttpServer::new(move || {
        let cors_mw = {
            let mut cors = Cors::default();
            for origin in cors_origins.iter() {
                cors = cors.allowed_origin(origin);
            }
            cors.allowed_methods(vec!["GET","POST","PUT","PATCH","DELETE","OPTIONS"])
                .allowed_headers(vec![
                    actix_web::http::header::AUTHORIZATION,
                    actix_web::http::header::CONTENT_TYPE,
                    actix_web::http::header::HeaderName::from_static("x-csrf-token"),
                ])
                .max_age(3600)
        };
        App::new()
            // Configure JSON payload size limit
            .app_data(web::JsonConfig::default().limit(max_request_size))
            // Configure form data size limit
            .app_data(web::FormConfig::default().limit(max_request_size))
            // Configure multipart form size limit (for file uploads)
            .app_data(web::PayloadConfig::default().limit(max_request_size * 10)) // 100MB for multipart
            // Request ID tracking (applied first for tracing)
            .wrap(RequestIdMiddleware)
            // CORS middleware
            .wrap(cors_mw)
            // Security middleware (applied globally to all routes)
            .wrap(reconciliation_backend::middleware::security::SecurityHeadersMiddleware::new(security_headers_config.clone()))
            .wrap(reconciliation_backend::middleware::security::CsrfProtectionMiddleware::new(csrf_secret.clone()))
            .wrap(reconciliation_backend::middleware::security::RateLimitMiddleware::new(rate_limit_requests, rate_limit_window))
            .wrap(Logger::default())
            .app_data(web::Data::new(database.clone()))
            .app_data(web::Data::new(auth_service.clone()))
            .app_data(web::Data::new(user_service.clone()))
            .app_data(web::Data::new(project_service.clone()))
            .app_data(web::Data::new(reconciliation_service.clone()))
            .app_data(web::Data::new(file_service.clone()))
            .app_data(web::Data::new(analytics_service.clone()))
            .app_data(web::Data::new(monitoring_service.clone()))
            .app_data(web::Data::new(cache_service.clone()))
            .app_data(web::Data::new(config.clone()))
            .service(
                web::scope("/api")
                    // Versioned API v1
                    .service(
                        web::scope("/v1")
                            // Health check endpoints
                            .route("/health", web::get().to(health_check))
                            .route("/ready", web::get().to(readiness_check))
                            .route("/metrics", web::get().to(metrics_endpoint))
                            // GDPR endpoints
                            .service(
                                web::scope("/gdpr")
                                    .route("/export/{user_id}", web::get().to(gdpr::export_user_data))
                                    .route("/delete/{user_id}", web::post().to(gdpr::delete_user_data))
                                    .route("/consent", web::post().to(gdpr::set_consent))
                            )
                            // API routes using modular handler structure
                            .service(
                                web::scope("/auth")
                                    // Public auth endpoints (no auth required)
                                    .route("/login", web::post().to(handlers::auth::login))
                                    .route("/register", web::post().to(handlers::auth::register))
                                    .route("/refresh", web::post().to(handlers::auth::refresh_token))
                                    .route("/change-password", web::post().to(handlers::auth::change_password))
                            )
                            // Protected endpoints (require authentication)
                            .service(
                                web::scope("")
                                    .wrap(AuthMiddleware::with_auth_service(auth_service.clone(), security_metrics.clone()))
                                    // User management routes
                                    .service(web::scope("/users").configure(handlers::users::configure_routes))
                                    // Project management routes
                                    .service(web::scope("/projects").configure(handlers::projects::configure_routes))
                                    // Reconciliation routes
                                    .service(web::scope("/reconciliation").configure(handlers::reconciliation::configure_routes))
                                    // Analytics routes
                                    .service(web::scope("/analytics").configure(handlers::analytics::configure_routes))
                                    // File management routes
                                    .service(web::scope("/files").configure(handlers::files::configure_routes))
                            )
                    )
            )
            // Top-level health endpoints for Docker healthchecks
            .route("/health", web::get().to(health_check))
            .route("/ready", web::get().to(readiness_check))
            .route("/", web::get().to(index))
    })
    .bind("0.0.0.0:2000")?
    .workers(
        env::var("WORKER_THREADS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(num_cpus::get())
    )
    .shutdown_timeout(30)
    .run()
    .await
}

async fn health_check(db: web::Data<Database>) -> Result<HttpResponse> {
    let mut status = "ok";
    let mut services_status = serde_json::json!({});
    
    // Check database connectivity
    match db.get_connection() {
        Ok(_conn) => {
            services_status["database"] = serde_json::json!({
                "status": "connected",
                "type": "postgresql"
            });
        }
        Err(e) => {
            status = "degraded";
            services_status["database"] = serde_json::json!({
                "status": "disconnected",
                "error": format!("{}", e)
            });
        }
    }
    
    // Check Redis connectivity
    let redis_url = env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://localhost:6379".to_string());
    
    match redis::Client::open(redis_url) {
        Ok(client) => {
            match client.get_connection() {
                Ok(mut conn) => {
                    let _: () = redis::cmd("PING").query(&mut conn).unwrap_or(());
                    services_status["redis"] = serde_json::json!({
                        "status": "connected",
                        "type": "redis"
                    });
                }
                Err(e) => {
                    status = "degraded";
                    services_status["redis"] = serde_json::json!({
                        "status": "disconnected",
                        "error": format!("{}", e)
                    });
                }
            }
        }
        Err(e) => {
            status = "degraded";
            services_status["redis"] = serde_json::json!({
                "status": "unavailable",
                "error": format!("{}", e)
            });
        }
    }
    
    // Get database pool statistics
    let pool_stats = db.get_pool_stats();
    
    let response = serde_json::json!({
        "status": status,
        "message": "378 Reconciliation Platform Backend is running",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "version": "1.0.0",
        "services": services_status,
        "database_pool": {
            "size": pool_stats.size,
            "idle": pool_stats.idle,
            "active": pool_stats.active
        }
    });
    
    if status == "degraded" {
        Ok(HttpResponse::Accepted().json(response))
    } else {
        Ok(HttpResponse::Ok().json(response))
    }
}

async fn readiness_check(db: web::Data<Database>) -> Result<HttpResponse> {
    let mut services_status = serde_json::json!({});
    let mut all_ready = true;
    
    // Check database readiness
    match db.get_connection() {
        Ok(_) => {
            services_status["database"] = serde_json::json!({
                "status": "ready",
                "type": "postgresql"
            });
        }
        Err(e) => {
            all_ready = false;
            services_status["database"] = serde_json::json!({
                "status": "not_ready",
                "error": format!("{}", e)
            });
        }
    }
    
    // Check Redis readiness
    let redis_url = env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://localhost:6379".to_string());
    
    match redis::Client::open(redis_url) {
        Ok(client) => {
            match client.get_connection() {
                Ok(_) => {
                    services_status["redis"] = serde_json::json!({
                        "status": "ready",
                        "type": "redis"
                    });
                }
                Err(e) => {
                    all_ready = false;
                    services_status["redis"] = serde_json::json!({
                        "status": "not_ready",
                        "error": format!("{}", e)
                    });
                }
            }
        }
        Err(e) => {
            all_ready = false;
            services_status["redis"] = serde_json::json!({
                "status": "unavailable",
                "error": format!("{}", e)
            });
        }
    }
    
    // Check Sentry status
    services_status["sentry"] = serde_json::json!({
        "status": if env::var("SENTRY_DSN").is_ok() { "enabled" } else { "disabled" }
    });
    
    let response = serde_json::json!({
        "status": if all_ready { "ready" } else { "not_ready" },
        "services": services_status,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "uptime": "running" // In a real implementation, track actual uptime
    });
    
    if all_ready {
        Ok(HttpResponse::Ok().json(response))
    } else {
        Ok(HttpResponse::ServiceUnavailable().json(response))
    }
}

async fn metrics_endpoint(db: web::Data<Database>) -> Result<HttpResponse> {
    // Refresh database pool metrics before gathering
    let pool_stats = db.get_pool_stats();
    reconciliation_backend::monitoring::metrics::update_pool_metrics(
        pool_stats.active as usize,
        pool_stats.idle as usize,
        pool_stats.size as usize
    );
    
    // Gather all Prometheus metrics (database, cache, HTTP, etc.)
    let mut body = reconciliation_backend::monitoring::metrics::gather_all_metrics();
    
    // Add security metrics from middleware
    let security_metrics = reconciliation_backend::middleware::security::get_all_security_metrics();
    body.push_str(&security_metrics);
    
    // Add application info
    body.push_str(
        "\n# HELP reconciliation_platform_info Application information\n# TYPE reconciliation_platform_info gauge\nreconciliation_platform_info{version=\"1.0.0\"} 1\n"
    );
    
    Ok(HttpResponse::Ok()
        .content_type("text/plain; version=0.0.4")
        .body(body))
}

async fn index() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "name": "378 Reconciliation Platform",
        "version": "1.0.0",
        "description": "Enterprise-grade reconciliation platform",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "api_health": "/api/health"
        }
    })))
}
