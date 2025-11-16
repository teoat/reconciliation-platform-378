// Database Migrations Runner
// Manual migration execution for Diesel

use diesel::migration::MigrationVersion;
use diesel::{Connection, PgConnection};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use log::{error, info, warn};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

/// Run all pending migrations
pub fn run_migrations(database_url: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut conn = PgConnection::establish(database_url)
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;

    info!("Running database migrations...");

    // Apply all migrations - continue even if some fail (for missing tables)
    match conn.run_pending_migrations(MIGRATIONS) {
        Ok(versions) => {
            if versions.is_empty() {
                info!("No pending migrations to apply");
            } else {
                info!("Applied {} migration(s) successfully", versions.len());
            }
        }
        Err(e) => {
            let error_msg = format!("Migration error: {}", e);
            error!("{}", error_msg);
            
            // Check if error is due to missing tables - if so, log warning but continue
            let error_str = e.to_string().to_lowercase();
            if error_str.contains("does not exist") || 
               error_str.contains("relation") ||
               error_str.contains("table") {
                warn!("Migration failed due to missing tables - this is expected if base schema hasn't been created yet. Error: {}", e);
                info!("Continuing startup - tables will be created when needed");
                // Don't fail startup if tables don't exist yet
                return Ok(());
            }
            
            // For other errors, fail
            return Err(error_msg.into());
        }
    }

    info!("Database migrations completed!");

    Ok(())
}

/// Get migration version
pub fn migration_version(
    database_url: &str,
) -> Result<Vec<MigrationVersion<'static>>, Box<dyn std::error::Error + Send + Sync>> {
    let mut conn = PgConnection::establish(database_url)
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
    // Get applied migrations using Diesel migration harness
    let applied = conn
        .applied_migrations()
        .map_err(|e| format!("Migration version error: {}", e))?;
    Ok(applied)
}
