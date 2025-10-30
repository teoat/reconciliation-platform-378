//! Migrations for Reconciliation Backend
//! 
//! This module provides a simple migration runner that can be used
//! independently of the main application.

use std::env;

/// Run migrations using simple SQL execution
pub fn run_migrations_simple() -> Result<(), Box<dyn std::error::Error>> {
    use diesel::PgConnection;
    use diesel::Connection;
    
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    
    let mut conn = PgConnection::establish(&database_url)
        .expect("Failed to create database connection");
    
    // Read and execute migration files
    let migrations_dir = "migrations";
    
    if !std::path::Path::new(migrations_dir).exists() {
        eprintln!("❌ Migrations directory not found: {}", migrations_dir);
        return Err("Migrations directory not found".into());
    }
    
    println!("🔧 Running migrations from: {}", migrations_dir);
    
    // Get all migration directories
    let mut migration_dirs: Vec<_> = std::fs::read_dir(migrations_dir)?
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let path = entry.path();
            if path.is_dir() && path.file_name()?.to_str()?.starts_with("2024-") {
                Some(path)
            } else {
                None
            }
        })
        .collect();
    
    migration_dirs.sort();
    
    for migration_dir in migration_dirs {
        let up_file = migration_dir.join("up.sql");
        
        if up_file.exists() {
            println!("  ✅ Running: {}", migration_dir.file_name().unwrap().to_str().unwrap());
            
            let sql = std::fs::read_to_string(&up_file)?;
            
            diesel::sql_query(&sql)
                .execute(&mut conn)
                .map_err(|e| {
                    eprintln!("  ❌ Failed to run migration: {}", e);
                    e
                })?;
        }
    }
    
    println!("✅ All migrations completed successfully!");
    
    Ok(())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv::dotenv().ok();
    run_migrations_simple()
}

