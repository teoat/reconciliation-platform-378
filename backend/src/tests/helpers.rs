// Test helper utilities for backend integration tests

use actix_web::{test, App, web};
use std::sync::Arc;
use tokio_postgres::{NoTls, Client};

/// Create a test database connection
pub async fn create_test_db() -> Arc<crate::database::Database> {
    // Get test database URL from environment or use default
    let database_url = std::env::var("TEST_DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://postgres:postgres@localhost:5432/reconciliation_test".to_string());
    
    // Connect to PostgreSQL
    let (client, connection) = tokio_postgres::connect(&database_url, NoTls)
        .await
        .expect("Failed to connect to test database");
    
    // Spawn connection handler
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("Test database connection error: {}", e);
        }
    });
    
    // Create database pool wrapper
    let pool = deadpool_postgres::Pool::builder(
        deadpool_postgres::Manager::new(
            tokio_postgres::Config::from(database_url.parse::<tokio_postgres::Config>().unwrap()),
            NoTls,
        )
    )
    .max_size(5)
    .build()
    .expect("Failed to create test pool");
    
    Arc::new(crate::database::Database { pool })
}

/// Create a test application instance
pub fn create_test_app(db: web::Data<crate::database::Database>) -> App {
    use crate::routes;
    
    test::init_service(
        App::new()
            .app_data(db.clone())
            .configure(routes::configure_routes)
    )
}

/// Clean up test database after tests
pub async fn cleanup_test_db(db: Arc<crate::database::Database>) {
    // Truncate all tables for cleanup
    let tables = vec![
        "audit_logs", "password_history", "matches", "files", 
        "jobs", "projects", "sessions", "users"
    ];
    
    for table in tables {
        let query = format!("TRUNCATE TABLE {} CASCADE", table);
        if let Err(e) = db.pool.get().await.unwrap().execute(&query, &[]).await {
            eprintln!("Failed to truncate {}: {}", table, e);
        }
    }
}

// TODO: Fix test - pool field is private, need to add a public method to Database
// #[cfg(test)]
// mod tests {
//     use super::*;
//
//     #[tokio::test]
//     async fn test_database_connection() {
//         let db = create_test_db().await;
//         assert!(db.pool.get().await.is_ok());
//         cleanup_test_db(db).await;
//     }
// }

