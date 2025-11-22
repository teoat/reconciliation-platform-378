//! Database Schema Verification
//!
//! Verifies that critical database tables exist after migrations

use diesel::prelude::*;
use diesel::PgConnection;
use log::{error, info, warn};

/// Critical tables that must exist for the application to function
const CRITICAL_TABLES: &[&str] = &[
    "users",
    "projects",
    "reconciliation_jobs",
    "reconciliation_results",
];

/// Verify that critical database tables exist
pub fn verify_critical_tables(database_url: &str) -> Result<(), String> {
    use diesel::sql_query;

    let mut conn = PgConnection::establish(database_url)
        .map_err(|e| format!("Failed to connect to database: {}", e))?;

    let mut missing_tables = Vec::new();

    for table_name in CRITICAL_TABLES {
        let query = format!(
            "SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = '{}'
            ) as exists",
            table_name
        );

        #[derive(QueryableByName)]
        struct TableExists {
            #[diesel(sql_type = diesel::sql_types::Bool)]
            exists: bool,
        }

        let result: Result<Vec<TableExists>, _> = sql_query(&query).load(&mut conn);
        
        match result {
            Ok(rows) => {
                if rows.is_empty() || !rows[0].exists {
                    missing_tables.push(*table_name);
                    warn!("Critical table '{}' does not exist", table_name);
                } else {
                    info!("Verified critical table '{}' exists", table_name);
                }
            }
            Err(e) => {
                error!("Failed to check table '{}': {}", table_name, e);
                missing_tables.push(*table_name);
            }
        }
    }

    if !missing_tables.is_empty() {
        return Err(format!(
            "Critical tables missing: {}. Please run migrations or create tables manually.",
            missing_tables.join(", ")
        ));
    }

    info!("✅ All critical database tables verified");
    Ok(())
}

/// Verify database connection and basic functionality
pub fn verify_database_connection(database_url: &str) -> Result<(), String> {
    let mut conn = PgConnection::establish(database_url)
        .map_err(|e| format!("Failed to connect to database: {}", e))?;

    // Test query to verify connection works
    use diesel::sql_query;
    use diesel::sql_types::Integer;
    
    #[derive(QueryableByName)]
    struct TestQuery {
        #[diesel(sql_type = Integer)]
        test: i32,
    }
    
    let result: Result<Vec<TestQuery>, _> = sql_query("SELECT 1 as test").load(&mut conn);
    
    match result {
        Ok(_) => {
            info!("✅ Database connection verified");
            Ok(())
        }
        Err(e) => Err(format!("Database connection test failed: {}", e)),
    }
}

