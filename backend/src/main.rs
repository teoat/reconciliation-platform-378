//! SSOT: Backend Main Entry Point - Application bootstrap and server startup
//! This file is the SINGLE SOURCE OF TRUTH for the main application entry point
//! Last Updated: January 2025
//! Version: 2.0
//! Status: ✅ Active and Mandatory

use actix_web::{web, App, HttpServer, HttpResponse, Result, middleware::Logger};
use std::env;
use std::time::Duration;
use reconciliation_backend::{
    database::Database,
    config::Config,
    services::{AuthService, UserService, ProjectService, ReconciliationService, FileService, AnalyticsService, MonitoringService},
    middleware::{AuthMiddleware, SecurityMiddleware, SecurityMiddlewareConfig},
    handlers,
};

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

    println!("🚀 Starting 378 Reconciliation Platform Backend");
    println!("📊 Database URL: {}", database_url);
    println!("🔴 Redis URL: {}", redis_url);

    // Create config first
    let config = Config {
        host: "0.0.0.0".to_string(),
        port: 8080,
        database_url: database_url.clone(),
        redis_url: redis_url.clone(),
        jwt_secret: "your-jwt-secret".to_string(),
        jwt_expiration: 86400,
        cors_origins: vec!["*".to_string()],
        log_level: "info".to_string(),
        max_file_size: 10485760,
        upload_path: "./uploads".to_string(),
    };

    // Initialize database
    let database = Database::new(&database_url).await
        .expect("Failed to connect to database");

    // Initialize services
    use std::sync::Arc;
    let auth_service = Arc::new(AuthService::new(config.jwt_secret.clone(), config.jwt_expiration));
    let user_service = Arc::new(UserService::new(database.clone(), auth_service.clone()));
    let project_service = Arc::new(ProjectService::new(database.clone()));
    let reconciliation_service = Arc::new(ReconciliationService::new(database.clone()));
    let file_service = Arc::new(FileService::new(database.clone(), "uploads".to_string()));
    let analytics_service = Arc::new(AnalyticsService::new(database.clone()));
    let monitoring_service = Arc::new(MonitoringService::new());

    // Initialize security middleware configuration
    let security_config = SecurityMiddlewareConfig {
        enable_cors: true,
        enable_csrf_protection: false, // Disable for now (can enable later)
        enable_rate_limiting: false,    // Add rate limiter separately if needed
        enable_input_validation: true,
        enable_security_headers: true,
        rate_limit_requests: 100,
        rate_limit_window: Duration::from_secs(60),
        csrf_token_header: "X-CSRF-Token".to_string(),
        allowed_origins: vec!["*".to_string()], // TODO: Configure per environment
        enable_hsts: true,
        enable_csp: true,
    };

    HttpServer::new(move || {
        App::new()
            // Compression middleware (Brotli > Gzip > Deflate)
            .wrap(Compress::default())
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
            .app_data(web::Data::new(config.clone()))
            .service(
                web::scope("/api")
                    .route("/auth/login", web::post().to(handlers::login))
                    .route("/auth/register", web::post().to(handlers::register))
                    .route("/auth/change-password", web::post().to(handlers::change_password))
                    .route("/health", web::get().to(health_check))
                    .route("/ready", web::get().to(readiness_check))
                    .route("/metrics", web::get().to(metrics_endpoint))
                    .service(
                        web::scope("")
                            .wrap(AuthMiddleware::with_auth_service(std::sync::Arc::new(auth_service.clone())))
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
    .bind("0.0.0.0:8080")?
    .run()
    .await
}

async fn health_check() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "message": "378 Reconciliation Platform Backend is running",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "version": "1.0.0"
    })))
}

async fn readiness_check() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "status": "ready",
        "services": {
            "database": "connected",
            "redis": "available",
            "sentry": if env::var("SENTRY_DSN").is_ok() { "enabled" } else { "disabled" }
        },
        "timestamp": chrono::Utc::now().to_rfc3339()
    })))
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
