//! SSOT: Backend Main Entry Point - Application bootstrap and server startup
//! This file is the SINGLE SOURCE OF TRUTH for the main application entry point
//! Last Updated: January 2025
//! Version: 2.0
//! Status: ✅ Active and Mandatory

use actix_web::{web, App, HttpServer, HttpResponse, Result};
use std::env;
use reconciliation_backend::{
    database::Database,
    config::Config,
    services::{AuthService, UserService, ProjectService, ReconciliationService, FileService, AnalyticsService, MonitoringService},
    middleware::AuthMiddleware,
    handlers,
};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://reconciliation_user:reconciliation_pass@localhost:5432/reconciliation_app".to_string());
    
    let redis_url = env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://localhost:6379".to_string());

    println!("🚀 Starting 378 Reconciliation Platform Backend");
    println!("📊 Database URL: {}", database_url);
    println!("🔴 Redis URL: {}", redis_url);

    // Create config first
    let config = Config {
        host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
        port: env::var("PORT").unwrap_or_else(|_| "2000".to_string()).parse().unwrap_or(2000),
        database_url: database_url.clone(),
        redis_url: redis_url.clone(),
        jwt_secret: env::var("JWT_SECRET").unwrap_or_else(|_| "your-jwt-secret".to_string()),
        jwt_expiration: 86400,
        cors_origins: env::var("CORS_ORIGINS")
            .unwrap_or_else(|_| "http://localhost:3000,http://localhost:1000".to_string())
            .split(',')
            .map(|s| s.to_string())
            .collect(),
        log_level: env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
        max_file_size: env::var("MAX_FILE_SIZE")
            .unwrap_or_else(|_| "10485760".to_string())
            .parse()
            .unwrap_or(10485760),
        upload_path: env::var("UPLOAD_PATH").unwrap_or_else(|_| "uploads".to_string()),
    };

    // Initialize database
    let database = Database::new(&database_url).await
        .expect("Failed to connect to database");

    // Initialize services
    let auth_service = AuthService::new(config.jwt_secret.clone(), config.jwt_expiration);
    let user_service = UserService::new(database.clone(), auth_service.clone());
    let project_service = ProjectService::new(database.clone());
    let reconciliation_service = ReconciliationService::new(database.clone());
    let file_service = FileService::new(database.clone(), "uploads".to_string());
    let analytics_service = AnalyticsService::new(database.clone());
    let monitoring_service = MonitoringService::new();

    HttpServer::new(move || {
        App::new()
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
                            .route("/projects/{project_id}/data-sources", web::get().to(handlers::get_project_data_sources))
                            .route("/projects/{project_id}/data-sources", web::post().to(handlers::create_data_source))
                            .route("/data-sources/{id}", web::get().to(handlers::get_data_source))
                            .route("/data-sources/{id}", web::put().to(handlers::update_data_source))
                            .route("/data-sources/{id}", web::delete().to(handlers::delete_data_source))
                            .route("/analytics/dashboard", web::get().to(handlers::get_analytics_dashboard))
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
