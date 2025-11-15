
use actix_web::{web, App, HttpServer, middleware::Logger};
use actix_cors::Cors;
use std::env;

pub async fn run_test_server() -> std::io::Result<()> {
    // Initialize logging
    env_logger::init();
    
    println!("🚀 Starting Rust Reconciliation API Server (Test Mode)");
    println!("📊 Port: 2000");
    println!("🌐 Host: localhost");
    println!("🔧 Environment: test");
    
    HttpServer::new(|| {
        let cors = Cors::default()
            .allowed_origin("http://localhost:1000")
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
            .allowed_headers(vec![
                "Content-Type",
                "Authorization",
                "X-Requested-With",
                "Accept",
                "Origin",
            ])
            .max_age(3600);
        
        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .service(
                web::scope("/api")
                    .service(web::scope("/test").configure(test_routes))
                    //.service(performance_routes())
            )
            .route("/health", web::get().to(health_check))
    })
    .bind("localhost:2000")?
    .run()
    .await
}

async fn health_check() -> actix_web::Result<actix_web::HttpResponse> {
    Ok(actix_web::HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now(),
        "version": env!("CARGO_PKG_VERSION"),
        "mode": "test"
    })))
}

// Import the test routes
//use crate::handlers::test_endpoints::test_routes;
//use crate::handlers::performance::performance_routes;

fn test_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::resource("/hello").to(|| async { "Hello test!" })
    );
}
