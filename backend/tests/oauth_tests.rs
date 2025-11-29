//! Integration tests for OAuth authentication

use reconciliation_backend::database::Database;
use reconciliation_backend::errors::AppResult;
use reconciliation_backend::services::auth::AuthService;
use reconciliation_backend::services::user::UserService;
use std::sync::Arc;

#[tokio::test]
async fn test_google_oauth_token_validation() -> AppResult<()> {
    // This test requires:
    // 1. Valid Google OAuth token
    // 2. GOOGLE_CLIENT_ID environment variable
    // 3. Database connection
    
    // Skip in CI if no token provided
    let test_token = std::env::var("TEST_GOOGLE_TOKEN").ok();
    if test_token.is_none() {
        println!("Skipping OAuth test - no TEST_GOOGLE_TOKEN provided");
        return Ok(());
    }
    
    // Test token validation logic
    // This would require mocking the Google tokeninfo endpoint
    // For now, this is a placeholder test structure
    
    Ok(())
}

#[tokio::test]
async fn test_oauth_user_creation() -> AppResult<()> {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app".to_string());
    
    let db = Database::new(&database_url)?;
    let auth_service = AuthService::new("test-secret".to_string(), 3600);
    let user_service = Arc::new(UserService::new(Arc::new(db), auth_service));
    
    // Test OAuth user creation
    let create_request = reconciliation_backend::services::user::CreateOAuthUserRequest {
        email: "oauth-test@example.com".to_string(),
        first_name: "OAuth".to_string(),
        last_name: "Test".to_string(),
        role: None,
        picture: None,
    };
    
    let user = user_service.create_oauth_user(create_request).await?;
    assert_eq!(user.email, "oauth-test@example.com");
    
    // Verify user can be retrieved
    let retrieved = user_service.get_user_by_email("oauth-test@example.com").await?;
    assert_eq!(retrieved.id, user.id);
    
    Ok(())
}

