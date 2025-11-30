use crate::database::Database;
use crate::errors::AppError;
use crate::models::{NewUser, User};
use crate::services::auth::{
    AuthService,
    EnhancedAuthService,
    oauth::OAuthService,
    two_factor::TwoFactorAuthService,
    types::{Claims, SessionInfo},
};
use crate::services::user::{UserService, traits::{CreateOAuthUserRequest, CreateUserRequest}};
use crate::test_utils::TestUser;
use actix_web::web::Redirect;
use chrono::{Duration, Utc};
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
use std::sync::Arc;
use uuid::Uuid;
use crate::models::schema::user_sessions;
use tokio;

// Helper to create a test database instance
async fn create_test_db() -> Database {
    Database::new("postgresql://test:test@localhost/reconciliation_test").unwrap()
}

// Helper to create AuthService for tests
fn create_test_auth_service() -> AuthService {
    AuthService::new("test_jwt_secret".to_string(), 3600)
}

// Helper to create EnhancedAuthService for tests
async fn create_test_enhanced_auth_service(db: Arc<Database>) -> EnhancedAuthService {
    EnhancedAuthService::new("test_jwt_secret".to_string(), 3600, db)
}

// Helper to create UserService for tests
async fn create_test_user_service(db: Arc<Database>) -> UserService {
    UserService::new(db.clone(), create_test_auth_service())
}

// Helper to create OAuthService for tests
async fn create_test_oauth_service(db: Arc<Database>) -> OAuthService {
    let config = crate::config::Config::from_env().unwrap(); // Load test config
    let user_service = Arc::new(create_test_user_service(db.clone()).await);
    let auth_service = Arc::new(create_test_auth_service());
    OAuthService::new( &config, user_service, auth_service, db)
}

// =========================================================================
// EnhancedAuthService Tests
// =========================================================================

#[tokio::test]
async fn test_create_session() -> Result<(), AppError> {
    let db = Arc::new(create_test_db().await);
    let enhanced_auth_service = create_test_enhanced_auth_service(db.clone()).await;
    let user_service = create_test_user_service(db.clone()).await;

    let test_user = TestUser::new();
    let new_user_request = CreateUserRequest {
        email: test_user.email.clone(),
        password: "TestPassword123!".to_string(),
        first_name: "Test".to_string(),
        last_name: "User".to_string(),
        role: Some("user".to_string()),
    };
    let user_info = user_service.create_user(new_user_request).await?;
    let user = user_service.get_user_by_id_raw(user_info.id).await?;

    let ip_address = Some("127.0.0.1".to_string());
    let user_agent = Some("test-agent".to_string());

    let session_info = enhanced_auth_service.create_session(&user, &db, ip_address.clone(), user_agent.clone()).await?;

    assert!(!session_info.session_token.is_empty());
    assert!(session_info.refresh_token.is_some());
    assert_eq!(session_info.user_id, user.id);
    assert_eq!(session_info.email, user.email);

    // Verify session is in DB
    let mut conn = db.get_connection()?;
    let db_session = user_sessions::table
        .filter(user_sessions::user_id.eq(user.id))
        .first::<UserSession>(&mut conn)?;

    assert_eq!(db_session.session_token, session_info.session_token);
    assert_eq!(db_session.refresh_token, session_info.refresh_token);
    assert_eq!(db_session.ip_address, ip_address);
    assert_eq!(db_session.user_agent, user_agent);
    assert!(db_session.is_active);
    assert!(db_session.expires_at > Utc::now());

    Ok(())
}

#[tokio::test]
async fn test_create_rotated_session() -> Result<(), AppError> {
    let db = Arc::new(create_test_db().await);
    let enhanced_auth_service = create_test_enhanced_auth_service(db.clone()).await;
    let user_service = create_test_user_service(db.clone()).await;

    let test_user = TestUser::new();
    let new_user_request = CreateUserRequest {
        email: test_user.email.clone(),
        password: "TestPassword123!".to_string(),
        first_name: "Test".to_string(),
        last_name: "User".to_string(),
        role: Some("user".to_string()),
    };
    let user_info = user_service.create_user(new_user_request).await?;
    let user = user_service.get_user_by_id_raw(user_info.id).await?;

    let ip_address = Some("127.0.0.1".to_string());
    let user_agent = Some("test-agent".to_string());

    let initial_session = enhanced_auth_service.create_session(&user, &db, ip_address.clone(), user_agent.clone()).await?;
    let initial_refresh_token = initial_session.refresh_token.clone().unwrap();

    // Rotate session
    let rotated_session = enhanced_auth_service.create_rotated_session(&user, &db, &initial_refresh_token, ip_address.clone(), user_agent.clone()).await?;

    assert!(!rotated_session.session_token.is_empty());
    assert!(rotated_session.refresh_token.is_some());
    assert_ne!(rotated_session.session_token, initial_session.session_token);
    assert_ne!(rotated_session.refresh_token, initial_session.refresh_token);

    // Verify old refresh token is inactive in DB
    let mut conn = db.get_connection()?;
    let old_session_in_db = user_sessions::table
        .filter(user_sessions::refresh_token.eq(initial_refresh_token))
        .first::<UserSession>(&mut conn)?;
    assert!(!old_session_in_db.is_active);

    // Verify new session is active in DB
    let new_session_in_db = user_sessions::table
        .filter(user_sessions::refresh_token.eq(rotated_session.refresh_token.clone().unwrap()))
        .first::<UserSession>(&mut conn)?;
    assert!(new_session_in_db.is_active);

    Ok(())
}

#[tokio::test]
async fn test_validate_refresh_token() -> Result<(), AppError> {
    let db = Arc::new(create_test_db().await);
    let enhanced_auth_service = create_test_enhanced_auth_service(db.clone()).await;
    let user_service = create_test_user_service(db.clone()).await;

    let test_user = TestUser::new();
    let new_user_request = CreateUserRequest {
        email: test_user.email.clone(),
        password: "TestPassword123!".to_string(),
        first_name: "Test".to_string(),
        last_name: "User".to_string(),
        role: Some("user".to_string()),
    };
    let user_info = user_service.create_user(new_user_request).await?;
    let user = user_service.get_user_by_id_raw(user_info.id).await?;

    let initial_session = enhanced_auth_service.create_session(&user, &db, None, None).await?;
    let refresh_token = initial_session.refresh_token.clone().unwrap();

    // Valid token
    let validated_session = enhanced_auth_service.validate_refresh_token(&db, &refresh_token).await?;
    assert_eq!(validated_session.user_id, user.id);
    assert!(validated_session.is_active);

    // Invalid token
    assert!(enhanced_auth_service.validate_refresh_token(&db, "invalid_token").await.is_err());

    // Expired token (simulate by manually setting expiry)
    let mut conn = db.get_connection()?;
    diesel::update(user_sessions::table)
        .filter(user_sessions::refresh_token.eq(&refresh_token))
        .set(user_sessions::expires_at.eq(Utc::now() - Duration::days(1)))
        .execute(&mut conn)?;
    assert!(enhanced_auth_service.validate_refresh_token(&db, &refresh_token).await.is_err());

    Ok(())
}

#[tokio::test]
async fn test_invalidate_refresh_token() -> Result<(), AppError> {
    let db = Arc::new(create_test_db().await);
    let enhanced_auth_service = create_test_enhanced_auth_service(db.clone()).await;
    let user_service = create_test_user_service(db.clone()).await;

    let test_user = TestUser::new();
    let new_user_request = CreateUserRequest {
        email: test_user.email.clone(),
        password: "TestPassword123!".to_string(),
        first_name: "Test".to_string(),
        last_name: "User".to_string(),
        role: Some("user".to_string()),
    };
    let user_info = user_service.create_user(new_user_request).await?;
    let user = user_service.get_user_by_id_raw(user_info.id).await?;

    let session_info = enhanced_auth_service.create_session(&user, &db, None, None).await?;
    let refresh_token = session_info.refresh_token.clone().unwrap();

    enhanced_auth_service.invalidate_refresh_token(&db, &refresh_token).await?;

    // Verify token is inactive
    let mut conn = db.get_connection()?;
    let db_session = user_sessions::table
        .filter(user_sessions::refresh_token.eq(&refresh_token))
        .first::<UserSession>(&mut conn)?;
    assert!(!db_session.is_active);

    // Should not be able to validate an invalidated token
    assert!(enhanced_auth_service.validate_refresh_token(&db, &refresh_token).await.is_err());

    Ok(())
}

#[tokio::test]
async fn test_invalidate_all_user_refresh_tokens() -> Result<(), AppError> {
    let db = Arc::new(create_test_db().await);
    let enhanced_auth_service = create_test_enhanced_auth_service(db.clone()).await;
    let user_service = create_test_user_service(db.clone()).await;

    let test_user = TestUser::new();
    let new_user_request = CreateUserRequest {
        email: test_user.email.clone(),
        password: "TestPassword123!".to_string(),
        first_name: "Test".to_string(),
        last_name: "User".to_string(),
        role: Some("user".to_string()),
    };
    let user_info = user_service.create_user(new_user_request).await?;
    let user = user_service.get_user_by_id_raw(user_info.id).await?;

    // Create multiple sessions
    enhanced_auth_service.create_session(&user, &db, None, None).await?;
    enhanced_auth_service.create_session(&user, &db, None, None).await?;
    enhanced_auth_service.create_session(&user, &db, None, None).await?;

    enhanced_auth_service.invalidate_all_user_refresh_tokens(&db, user.id).await?;

    // Verify all tokens are inactive
    let mut conn = db.get_connection()?;
    let active_sessions_count = user_sessions::table
        .filter(user_sessions::user_id.eq(user.id))
        .filter(user_sessions::is_active.eq(true))
        .count()
        .get_result::<i64>(&mut conn)?;
    assert_eq!(active_sessions_count, 0);

    Ok(())
}

// =========================================================================
// TwoFactorAuthService Tests
// =========================================================================

#[tokio::test]
async fn test_get_or_create_2fa_record() -> Result<(), AppError> {
    let db = Arc::new(create_test_db().await);
    let two_factor_service = TwoFactorAuthService::new(db.clone());
    let user_id = Uuid::new_v4();

    // Create new record
    let record = two_factor_service.get_or_create_2fa_record(user_id).await?;
    assert_eq!(record.user_id, user_id);
    assert!(!record.is_enabled);
    assert!(record.secret.is_none());

    // Get existing record
    let existing_record = two_factor_service.get_or_create_2fa_record(user_id).await?;
    assert_eq!(record.id, existing_record.id);

    Ok(())
}

#[tokio::test]
async fn test_generate_totp_secret_and_qr() -> Result<(), AppError> {
    let db = Arc::new(create_test_db().await);
    let two_factor_service = TwoFactorAuthService::new(db.clone());
    let user_id = Uuid::new_v4();
    let user_email = "test@example.com";

    // Ensure a 2FA record exists
    two_factor_service.get_or_create_2fa_record(user_id).await?;

    let (secret, qr_code_image) = two_factor_service.generate_totp_secret_and_qr(user_id, user_email).await?;

    assert!(!secret.is_empty());
    assert!(!qr_code_image.is_empty());
    assert!(qr_code_image.starts_with("iVBORw0KGgo")); // Should be base64 encoded PNG

    // Verify secret is stored in DB
    let mut conn = db.get_connection()?;
    let record = two_factor_auth::table
        .filter(two_factor_auth::user_id.eq(user_id))
        .first::<TwoFactorAuth>(&mut conn)?;
    assert_eq!(record.secret, Some(secret));

    Ok(())
}

#[tokio::test]
async fn test_verify_totp_code() -> Result<(), AppError> {
    let db = Arc::new(create_test_db().await);
    let two_factor_service = TwoFactorAuthService::new(db.clone());
    let user_id = Uuid::new_v4();
    let user_email = "test@example.com";

    two_factor_service.get_or_create_2fa_record(user_id).await?;
    let (secret, _) = two_factor_service.generate_totp_secret_and_qr(user_id, user_email).await?;

    // Generate a valid TOTP code for testing (using the same secret)
    let totp = TOTP::new(
        Secret::Encoded(secret),
        6, 1, 30, None, Some("ReconciliationPlatform".to_string()),
    ).map_err(|e| AppError::Internal(format!("Failed to create TOTP: {}", e)))?;
    let valid_code = totp.generate_current().unwrap();

    // Valid code
    assert!(two_factor_service.verify_totp_code(user_id, &valid_code).await?);

    // Invalid code
    assert!(!two_factor_service.verify_totp_code(user_id, "999999").await?);

    Ok(())
}

#[tokio::test]
async fn test_enable_and_disable_2fa() -> Result<(), AppError> {
    let db = Arc::new(create_test_db().await);
    let two_factor_service = TwoFactorAuthService::new(db.clone());
    let user_id = Uuid::new_v4();
    let user_email = "test@example.com";

    two_factor_service.get_or_create_2fa_record(user_id).await?;
    two_factor_service.generate_totp_secret_and_qr(user_id, user_email).await?;

    // Initially disabled
    assert!(!two_factor_service.is_2fa_enabled(user_id).await?);

    // Enable 2FA
    two_factor_service.enable_2fa(user_id).await?;
    assert!(two_factor_service.is_2fa_enabled(user_id).await?);

    // Disable 2FA
    two_factor_service.disable_2fa(user_id).await?;
    assert!(!two_factor_service.is_2fa_enabled(user_id).await?);

    // Verify secret and backup codes are cleared after disabling
    let mut conn = db.get_connection()?;
    let record = two_factor_auth::table
        .filter(two_factor_auth::user_id.eq(user_id))
        .first::<TwoFactorAuth>(&mut conn)?;
    assert!(record.secret.is_none());
    assert!(record.backup_codes.is_none());

    Ok(())
}

#[tokio::test]
async fn test_generate_and_verify_recovery_codes() -> Result<(), AppError> {
    let db = Arc::new(create_test_db().await);
    let two_factor_service = TwoFactorAuthService::new(db.clone());
    let user_id = Uuid::new_v4();

    two_factor_service.get_or_create_2fa_record(user_id).await?;

    let codes = two_factor_service.generate_recovery_codes(user_id).await?;
    assert_eq!(codes.len(), 10);

    // Verify a code
    let valid_code = codes[0].clone();
    assert!(two_factor_service.verify_recovery_code(user_id, &valid_code).await?);

    // Verify used code is no longer valid
    assert!(!two_factor_service.verify_recovery_code(user_id, &valid_code).await?);

    // Verify invalid code
    assert!(!two_factor_service.verify_recovery_code(user_id, "INVALID_CODE").await?);

    // Verify that the remaining codes are still in the DB (one should be removed)
    let mut conn = db.get_connection()?;
    let record = two_factor_auth::table
        .filter(two_factor_auth::user_id.eq(user_id))
        .first::<TwoFactorAuth>(&mut conn)?;
    let remaining_codes: Vec<String> = serde_json::from_value(record.backup_codes.unwrap()).unwrap();
    assert_eq!(remaining_codes.len(), 9);

    Ok(())
}

// =========================================================================
// OAuthService Tests
// =========================================================================

#[tokio::test]
async fn test_get_google_authorize_url() -> Result<(), AppError> {
    let db = Arc::new(create_test_db().await);
    let oauth_service = create_test_oauth_service(db.clone()).await;

    let redirect = oauth_service.get_google_authorize_url()?;
    let url = Url::parse(redirect.uri().as_str()).unwrap();

    assert_eq!(url.scheme(), "https");
    assert_eq!(url.host_str(), Some("accounts.google.com"));
    assert!(url.path().contains("o/oauth2/v2/auth"));
    assert!(url.query_pairs().any(|(k, _)| k == "client_id"));
    assert!(url.query_pairs().any(|(k, _)| k == "redirect_uri"));
    assert!(url.query_pairs().any(|(k, _)| k == "scope"));
    assert!(url.query_pairs().any(|(k, _)| k == "state"));
    assert!(url.query_pairs().any(|(k, _)| k == "response_type" && _ == "code"));

    Ok(())
}

#[tokio::test]
async fn test_get_github_authorize_url() -> Result<(), AppError> {
    let db = Arc::new(create_test_db().await);
    let oauth_service = create_test_oauth_service(db.clone()).await;

    let redirect = oauth_service.get_github_authorize_url()?;
    let url = Url::parse(redirect.uri().as_str()).unwrap();

    assert_eq!(url.scheme(), "https");
    assert_eq!(url.host_str(), Some("github.com"));
    assert!(url.path().contains("login/oauth/authorize"));
    assert!(url.query_pairs().any(|(k, _)| k == "client_id"));
    assert!(url.query_pairs().any(|(k, _)| k == "redirect_uri"));
    assert!(url.query_pairs().any(|(k, _)| k == "scope"));
    assert!(url.query_pairs().any(|(k, _)| k == "state"));

    Ok(())
}

// Note: Testing OAuth callbacks directly is challenging as it involves external services.
// These would typically be covered by integration/E2E tests where external services are mocked.
// For unit tests, we'd mock the HTTP client within handle_google_callback and handle_github_callback.
