use actix_web::{web, App, HttpServer, HttpResponse, Result};
use std::env;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://reconciliation_user:reconciliation_pass@localhost:5432/reconciliation_app".to_string());
    
    let redis_url = env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://localhost:6379".to_string());

    println!("🚀 Starting 378 Reconciliation Platform Backend");
    println!("📊 Database URL: {}", database_url);
    println!("🔴 Redis URL: {}", redis_url);

    HttpServer::new(|| {
        App::new()
            .route("/health", web::get().to(health_check))
            .route("/", web::get().to(index))
            .route("/api/health", web::get().to(health_check))
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
