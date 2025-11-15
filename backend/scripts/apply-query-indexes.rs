//! Script to apply query optimization indexes
//! Run with: cargo run --bin apply-query-indexes

use diesel::prelude::*;
use diesel::PgConnection;
use std::env;

fn main() {
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    let mut conn = PgConnection::establish(&database_url)
        .expect("Failed to connect to database");

    println!("🚀 Applying query optimization indexes...");

    // Get query optimizer
    let optimizer = reconciliation_backend::services::performance::QueryOptimizer::new();
    
    // Generate optimization indexes
    let indexes = futures::executor::block_on(
        optimizer.optimize_reconciliation_queries()
    ).expect("Failed to generate optimization indexes");

    println!("📊 Generated {} optimization indexes", indexes.len());

    // Apply each index
    for (i, index_sql) in indexes.iter().enumerate() {
        println!("  [{}/{}] Applying index...", i + 1, indexes.len());
        
        match diesel::sql_query(index_sql).execute(&mut conn) {
            Ok(_) => println!("    ✅ Index applied successfully"),
            Err(e) => println!("    ⚠️  Warning: {}", e),
        }
    }

    println!("✅ Query optimization indexes applied!");
}

