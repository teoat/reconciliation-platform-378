use actix_web::{web, App, HttpServer, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize)]
struct HealthResponse {
    status: String,
    timestamp: String,
    version: String,
}

#[derive(Serialize, Deserialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    message: Option<String>,
}

async fn health_check() -> Result<HttpResponse> {
    let response = HealthResponse {
        status: "healthy".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
        version: "1.0.0".to_string(),
    };
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(response),
        message: None,
    }))
}

async fn get_projects() -> Result<HttpResponse> {
    let projects = vec![
        HashMap::from([
            ("id".to_string(), "1".to_string()),
            ("name".to_string(), "Sample Project 1".to_string()),
            ("status".to_string(), "active".to_string()),
        ]),
        HashMap::from([
            ("id".to_string(), "2".to_string()),
            ("name".to_string(), "Sample Project 2".to_string()),
            ("status".to_string(), "active".to_string()),
        ]),
    ];
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(projects),
        message: None,
    }))
}

async fn get_reconciliation_jobs() -> Result<HttpResponse> {
    let jobs = vec![
        HashMap::from([
            ("id".to_string(), "1".to_string()),
            ("project_id".to_string(), "1".to_string()),
            ("status".to_string(), "completed".to_string()),
            ("created_at".to_string(), chrono::Utc::now().to_rfc3339()),
        ]),
    ];
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(jobs),
        message: None,
    }))
}

async fn get_analytics() -> Result<HttpResponse> {
    let analytics = HashMap::from([
        ("total_projects".to_string(), 2),
        ("total_jobs".to_string(), 1),
        ("success_rate".to_string(), 95),
        ("avg_processing_time".to_string(), 120),
    ]);
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(analytics),
        message: None,
    }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("🚀 Starting 378 Reconciliation Backend Server...");
    println!("📊 Health check: http://localhost:2000/api/health");
    println!("📁 Projects: http://localhost:2000/api/projects");
    println!("⚙️  Jobs: http://localhost:2000/api/reconciliation-jobs");
    println!("📈 Analytics: http://localhost:2000/api/analytics");
    
    HttpServer::new(|| {
        App::new()
            .service(
                web::scope("/api")
                    .route("/health", web::get().to(health_check))
                    .route("/projects", web::get().to(get_projects))
                    .route("/reconciliation-jobs", web::get().to(get_reconciliation_jobs))
                    .route("/analytics", web::get().to(get_analytics))
            )
    })
    .bind("127.0.0.1:2000")?
    .run()
    .await
}