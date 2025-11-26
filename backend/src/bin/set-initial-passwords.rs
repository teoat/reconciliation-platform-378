//! Binary to set initial passwords for existing users
//!
//! This binary is for testing and pre-production environments.
//! It generates secure initial passwords for users who don't have
//! initial passwords set, or for all users if --all flag is used.
//!
//! Usage:
//!   cargo run --bin set-initial-passwords [--all] [--output <file>]

use diesel::prelude::*;
use diesel::PgConnection;
use std::env;
use std::fs::File;
use std::io::Write;

// Import from the main backend crate
use reconciliation_backend::models::schema::users;
use reconciliation_backend::services::auth::password::PasswordManager;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().collect();
    let set_all = args.contains(&"--all".to_string());
    let output_file = args
        .iter()
        .position(|a| a == "--output")
        .and_then(|i| args.get(i + 1));

    // Get database URL from environment
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    // Connect to database
    let mut conn = PgConnection::establish(&database_url)
        .expect("Failed to connect to database");

    // Get users to update
    let users_to_update: Vec<(uuid::Uuid, String)> = if set_all {
        // Get all users
        users::table
            .select((users::id, users::email))
            .load::<(uuid::Uuid, String)>(&mut conn)?
    } else {
        // Get only users without initial passwords
        users::table
            .filter(users::is_initial_password.eq(false).or(users::is_initial_password.is_null()))
            .select((users::id, users::email))
            .load::<(uuid::Uuid, String)>(&mut conn)?
    };

    if users_to_update.is_empty() {
        println!("No users to update.");
        return Ok(());
    }

    println!("Generating initial passwords for {} users...", users_to_update.len());

    // Generate passwords and update database
    let mut password_list = Vec::new();
    let now = chrono::Utc::now();
    
    for (user_id, email) in users_to_update {
        // Generate initial password
        let initial_password = PasswordManager::generate_initial_password()
            .map_err(|e| format!("Failed to generate initial password: {}", e))?;
        
        // Hash password
        let password_hash = PasswordManager::hash_password(&initial_password)
            .map_err(|e| format!("Failed to hash password: {}", e))?;
        
        // Update user in database
        diesel::update(users::table.filter(users::id.eq(user_id)))
            .set((
                users::password_hash.eq(&password_hash),
                users::is_initial_password.eq(true),
                users::initial_password_set_at.eq(now),
                users::password_last_changed.eq(now),
                users::password_expires_at.eq({
                    let config = reconciliation_backend::config::PasswordConfig::from_env();
                    now + config.initial_expiration_duration()
                }),
                users::updated_at.eq(now),
            ))
            .execute(&mut conn)
            .map_err(|e| format!("Failed to update user {}: {}", email, e))?;
        
        password_list.push((email.clone(), initial_password));
        println!("✓ Generated initial password for: {}", email);
    }

    // Write passwords to file if specified
    if let Some(output_path) = output_file {
        let mut file = File::create(output_path)?;
        writeln!(file, "# Initial Passwords Generated: {}", now.to_rfc3339())?;
        writeln!(file, "# Total Users: {}", password_list.len())?;
        writeln!(file, "")?;
        
        for (email, password) in &password_list {
            writeln!(file, "Email: {}", email)?;
            writeln!(file, "Password: {}", password)?;
            writeln!(file, "")?;
        }
        
        println!("\nPasswords written to: {}", output_path);
    }

    // Print summary
    println!("\n=== Summary ===");
    println!("Total users updated: {}", password_list.len());
    println!("\nInitial passwords:");
    for (email, password) in &password_list {
        println!("  {} : {}", email, password);
    }
    
    println!("\n⚠️  IMPORTANT: Store these passwords securely!");
    println!("⚠️  Users must change their passwords on first login.");

    Ok(())
}

