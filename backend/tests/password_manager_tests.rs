//! Integration tests for password manager

use reconciliation_backend::database::Database;
use reconciliation_backend::errors::AppResult;
use reconciliation_backend::services::password_manager::PasswordManager;
use std::sync::Arc;
use uuid::Uuid;

#[tokio::test]
async fn test_password_manager_create_and_retrieve() -> AppResult<()> {
    // This test requires a database connection
    // In CI/CD, use test database
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app".to_string());
    
    let db = Database::new(&database_url).await?;
    let master_key = "test-master-key".to_string();
    let pm = PasswordManager::new(Arc::new(db), master_key);
    
    // Create a test password
    let entry = pm.create_password("test-password", "test-secret", 90, None).await?;
    assert_eq!(entry.name, "test-password");
    assert!(!entry.encrypted_password.is_empty());
    
    // Retrieve the password
    let retrieved = pm.get_password_by_name("test-password", None).await?;
    assert_eq!(retrieved, "test-secret");
    
    // Cleanup
    let _ = pm.deactivate_password("test-password").await;
    
    Ok(())
}

#[tokio::test]
async fn test_password_manager_user_specific_encryption() -> AppResult<()> {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app".to_string());
    
    let db = Database::new(&database_url).await?;
    let master_key = "test-master-key".to_string();
    let pm = PasswordManager::new(Arc::new(db), master_key);
    
    let user_id = Uuid::new_v4();
    
    // Note: set_user_master_key and clear_user_master_key are deprecated
    // Master keys are no longer stored in memory, so we test without them
    // Create password with user-specific encryption (user_id is used for encryption context)
    let entry = pm.create_password("user-password", "secret-value", 90, Some(user_id)).await?;
    
    // Retrieve with correct user
    let retrieved = pm.get_password_by_name("user-password", Some(user_id)).await?;
    assert_eq!(retrieved, "secret-value");
    
    // Cleanup
    let _ = pm.deactivate_password("user-password").await;
    
    Ok(())
}

#[tokio::test]
async fn test_password_manager_rotation() -> AppResult<()> {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app".to_string());
    
    let db = Database::new(&database_url).await?;
    let master_key = "test-master-key".to_string();
    let pm = PasswordManager::new(Arc::new(db), master_key);
    
    // Create password
    let entry1 = pm.create_password("rotatable", "old-password", 90, None).await?;
    
    // Rotate password
    let entry2 = pm.rotate_password("rotatable", Some("new-password"), None).await?;
    assert_ne!(entry2.encrypted_password, entry1.encrypted_password);
    assert!(entry2.last_rotated_at.is_some());
    
    // Verify new password
    let retrieved = pm.get_password_by_name("rotatable", None).await?;
    assert_eq!(retrieved, "new-password");
    
    // Cleanup
    let _ = pm.deactivate_password("rotatable").await;
    
    Ok(())
}

