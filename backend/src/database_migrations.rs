// Database Migrations Runner
// Manual migration execution for Diesel

use diesel::migration::MigrationVersion;
use diesel::{Connection, PgConnection, RunQueryDsl};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use std::fs;
use log::{info, error};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations/");

/// Run all pending migrations
pub fn run_migrations(database_url: &str) -> Result<(), Box<dyn std::error::Error>> {
    let mut conn = PgConnection::establish(database_url)?;
    
    info!("Running database migrations...");

    // Apply all migrations
    conn.run_pending_migrations(MIGRATIONS)
        .map_err(|e| {
            error!("Migration failed: {}", e);
            e
        })?;

    info!("All migrations applied successfully!");
    
    Ok(())
}

/// Get migration version
pub fn migration_version(database_url: &str) -> ExecResult<Vec<MigrationVersion>, diesel::result::Error> {
    let mut conn = PgConnection::establish(database_url)?;
    conn.version()
}

