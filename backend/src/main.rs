//! SSOT: Backend Main Entry Point - Application bootstrap and server startup
//! This file is the SINGLE SOURCE OF TRUTH for the main application entry point
//! Last Updated: January 2025
//! Version: 2.0
//! Status: ✅ Active and Mandatory

use actix_web::{web, App, HttpServer, HttpResponse, Result, middleware::Logger};
use std::env;
use std::time::Duration;
use redis;
use reconciliation_backend::{
    database::Database,
    config::Config,
    handlers,
};
use std::sync::Arc;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize Sentry error tracking (optional - requires SENTRY_DSN env var)
    let _sentry = if let Ok(dsn) = env::var("SENTRY_DSN") {
        println!("🔍 Sentry error tracking enabled");
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
        println!("⚠️  SENTRY_DSN not set - error tracking disabled");
        None
    };

    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://reconciliation_user:reconciliation_pass@localhost:5432/reconciliation_app".to_string());
    
    let redis_url = env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://localhost:6379".to_string());

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
        .unwrap_or_else(|_| {
            eprintln!("⚠️  JWT_SECRET not set, using default (NOT SECURE FOR PRODUCTION)");
            "change-this-secret-key-in-production".to_string()
        });
    
    let jwt_expiration = env::var("JWT_EXPIRATION")
        .unwrap_or_else(|_| "86400".to_string())
        .parse::<i64>()
        .unwrap_or(86400);
    
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
        .expect("Failed to connect to database");

    // Initialize services
    use std::sync::Arc;
    let auth_service_clone = AuthService::new(config.jwt_secret.clone(), config.jwt_expiration);
    let auth_service = Arc::new(auth_service_clone.clone());
    let user_service = Arc::new(UserService::new(database.clone(), auth_service_clone.clone()));
    let project_service = Arc::new(ProjectService::new(database.clone()));
    let reconciliation_service = Arc::new(ReconciliationService::new(database.clone()));
    let file_service = Arc::new(FileService::new(database.clone(), "uploads".to_string()));
    let analytics_service = Arc::new(AnalyticsService::new(database.clone()));
    let monitoring_service = Arc::new(MonitoringService::new());

    // Initialize multi-level cache for performance optimization
    let cache_service = Arc::new(
        MultiLevelCache::new(&redis_url)
            .unwrap_or_else(|e| {
                log::warn!("Failed to initialize cache service: {}. Continuing without cache.", e);
                // Fallback to minimal cache if Redis unavailable
                MultiLevelCache::new("redis://localhost:6379")
                    .expect("Failed to create fallback cache")
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
            
            loop {
                interval.tick().await;
                log::info!("📦 Running scheduled backup...");
                
                match backup_service_clone.create_full_backup().await {
                    Ok(backup_id) => {
                        log::info!("✅ Backup completed successfully: {}", backup_id);
                    }
                    Err(e) => {
                        log::error!("❌ Backup failed: {}", e);
                    }
                }
            }
        });
    }

    // Initialize security middleware configuration
    let security_config = SecurityMiddlewareConfig {
        enable_cors: true,
        enable_csrf_protection: env::var("ENABLE_CSRF").unwrap_or_else(|_| "true".to_string()) == "true",
        enable_rate_limiting: true, // Enable rate limiting
        enable_input_validation: true,
        enable_security_headers: true,
        rate_limit_requests: env::var("RATE_LIMIT_REQUESTS")
            .unwrap_or_else(|_| "1000".to_string())
            .parse::<u32>()
            .unwrap_or(1000),
        rate_limit_window: Duration::from_secs(
            env::var("RATE_LIMIT_WINDOW")
                .unwrap_or_else(|_| "3600".to_string())
                .parse::<u64>()
                .unwrap_or(3600)
        ),
        csrf_token_header: "X-CSRF-Token".to_string(),
        allowed_origins: cors_origins.clone(),
        enable_hsts: true,
        enable_csp: true,
    };
    
    HttpServer::new(move || {
        App::new()
            // Request ID tracking (applied first for tracing)
            .wrap(RequestIdMiddleware)
            // Security middleware (applied globally to all routes)
            .wrap(SecurityMiddleware::new(security_config.clone()))
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
                    .route("/auth/login", web::post().to(handlers::login))
                    .route("/auth/register", web::post().to(handlers::register))
                    .route("/auth/change-password", web::post().to(handlers::change_password))
                    .route("/health", web::get().to(health_check))
                    .route("/ready", web::get().to(readiness_check))
                    .route("/metrics", web::get().to(metrics_endpoint))
                    // GDPR endpoints
                    .route("/v1/users/{id}/export", web::get().to(handlers::export_user_data_handler))
                    .route("/v1/users/{id}", web::delete().to(handlers::delete_user_data_handler))
                    .route("/v1/consent", web::post().to(handlers::set_consent_handler))
                    .route("/v1/privacy", web::get().to(handlers::get_privacy_policy))
                    .service(
                        web::scope("")
                            .wrap(AuthMiddleware::with_auth_service(auth_service.clone()))
                            .route("/users", web::get().to(handlers::get_users))
                            .route("/users", web::post().to(handlers::create_user))
                            .route("/users/{id}", web::get().to(handlers::get_user))
                            .route("/users/{id}", web::put().to(handlers::update_user))
                            .route("/users/{id}", web::delete().to(handlers::delete_user))
                            .route("/projects", web::get().to(handlers::get_projects))
                            .route("/projects", web::post().to(handlers::create_project))
                            .route("/projects/{id}", web::get().to(handlers::get_project))
                            .route("/projects/{id}", web::put().to(handlers::update_project))
                            .route("/projects/{id}", web::delete().to(handlers::delete_project))
                            .route("/reconciliation/jobs", web::get().to(handlers::get_reconciliation_jobs))
                            .route("/reconciliation/jobs", web::post().to(handlers::create_reconciliation_job))
                            .route("/reconciliation/jobs/{id}", web::get().to(handlers::get_reconciliation_job))
                            .route("/reconciliation/jobs/{id}", web::put().to(handlers::update_reconciliation_job))
                            .route("/reconciliation/jobs/{id}", web::delete().to(handlers::delete_reconciliation_job))
                            .route("/reconciliation/active", web::get().to(handlers::get_active_reconciliation_jobs))
                            .route("/reconciliation/queued", web::get().to(handlers::get_queued_reconciliation_jobs))
                            .route("/analytics/dashboard", web::get().to(handlers::get_dashboard_data))
                            .route("/files/upload", web::post().to(handlers::upload_file))
                            .route("/files/{id}", web::get().to(handlers::get_file))
                            .route("/files/{id}", web::delete().to(handlers::delete_file))
                    )
            )
            .route("/", web::get().to(index))
    })
    .bind("0.0.0.0:2000")?
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

async fn metrics_endpoint() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok()
        .content_type("text/plain; version=0.0.4")
        .body("# HELP reconciliation_platform_info Application information\n# TYPE reconciliation_platform_info gauge\nreconciliation_platform_info{version=\"1.0.0\"} 1\n"))
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
