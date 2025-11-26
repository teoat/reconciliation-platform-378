// Database Migrations Runner
// Manual migration execution for Diesel

use diesel::migration::MigrationVersion;
use diesel::{Connection, PgConnection};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use log::{error, info, warn};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

/// Run all pending migrations
/// 
/// # Arguments
/// * `database_url` - PostgreSQL connection string
/// 
/// # Returns
/// * `Result<(), Box<dyn std::error::Error + Send + Sync>>` - Success or error
/// 
/// # Behavior
/// - In production: Fails fast on any migration error
/// - In development: Allows startup to continue if base schema doesn't exist
pub fn run_migrations(database_url: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut conn = PgConnection::establish(database_url)
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;

    info!("Running database migrations...");

    let is_production = std::env::var("ENVIRONMENT")
        .unwrap_or_else(|_| "development".to_string())
        .to_lowercase() == "production";

    // Apply all pending migrations
    match conn.run_pending_migrations(MIGRATIONS) {
        Ok(versions) => {
            if versions.is_empty() {
                info!("No pending migrations to apply");
            } else {
                info!("Applied {} migration(s) successfully: {:?}", versions.len(), versions);
            }
        }
        Err(e) => {
            let error_msg = format!("Migration error: {}", e);
            error!("{}", error_msg);
            
            // In production, fail fast on any migration error
            if is_production {
                return Err(error_msg.into());
            }
            
            // In development, allow startup if error is due to missing base schema
            let error_str = e.to_string().to_lowercase();
            if error_str.contains("does not exist") || 
               error_str.contains("relation") ||
               error_str.contains("table") {
                warn!("Migration failed due to missing tables - this is expected if base schema hasn't been created yet. Error: {}", e);
                info!("Continuing startup in development mode - tables will be created when needed");
                return Ok(());
            }
            
            // For other errors in development, still fail but log as warning
            warn!("Migration error in development: {}", error_msg);
            return Err(error_msg.into());
        }
    }

    info!("✅ Database migrations completed successfully");

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
