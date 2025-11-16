// Database Migrations Runner
// Manual migration execution for Diesel

use diesel::migration::MigrationVersion;
use diesel::{Connection, PgConnection};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use log::{info, error};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

/// Run all pending migrations
pub fn run_migrations(database_url: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut conn = PgConnection::establish(database_url)
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
    
    info!("Running database migrations...");

    // Apply all migrations
    match conn.run_pending_migrations(MIGRATIONS) {
        Ok(_) => {},
        Err(e) => {
            error!("Migration failed: {}", e);
            return Err(format!("Migration error: {}", e).into());
        }
    }

    info!("All migrations applied successfully!");
    
    Ok(())
}

/// Get migration version
pub fn migration_version(database_url: &str) -> Result<Vec<MigrationVersion<'static>>, Box<dyn std::error::Error + Send + Sync>> {
    let mut conn = PgConnection::establish(database_url)
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
    // Get applied migrations using Diesel migration harness
    let applied = conn.applied_migrations()
        .map_err(|e| format!("Migration version error: {}", e))?;
    Ok(applied)
}

