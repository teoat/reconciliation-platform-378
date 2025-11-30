//! OAuth2/OIDC integration service

use actix_web::web::Redirect;
use oauth2::basic::{BasicClient, BasicTokenResponse};
use oauth2::{
    AuthUrl,
    AuthorizationCode,
    ClientId,
    ClientSecret,
    CsrfToken,
    PkceCodeChallenge,
    RedirectUrl,
    Scope,
    TokenResponse,
    TokenUrl,
};
use serde::{Deserialize, Serialize};
use url::Url;

use crate::config::Config;
use crate::errors::{AppError, AppResult};
use crate::services::user::UserService;
use crate::database::Database;
use std::sync::Arc;
use crate::services::auth::AuthService;
use crate::services::user::traits::{CreateOAuthUserRequest, UserInfo};

/// OAuth2 service
#[derive(Clone)]
pub struct OAuthService {
    google_client: Option<BasicClient>,
    github_client: Option<BasicClient>,
    user_service: Arc<UserService>,
    auth_service: Arc<AuthService>,
    db: Arc<Database>,
}

impl OAuthService {
    pub fn new(
        config: &Config,
        user_service: Arc<UserService>,
        auth_service: Arc<AuthService>,
        db: Arc<Database>,
    ) -> Self {
        let google_client = if let (
            Some(google_client_id),
            Some(google_client_secret),
            Some(google_redirect_url),
        ) = (
            config.google_oauth_client_id.clone(),
            config.google_oauth_client_secret.clone(),
            config.google_oauth_redirect_url.clone(),
        ) {
            let client_id = ClientId::new(google_client_id);
            let client_secret = ClientSecret::new(google_client_secret);
            let auth_url = AuthUrl::new("https://accounts.google.com/o/oauth2/v2/auth".to_string())
                .expect("Invalid Google Auth URL");
            let token_url = TokenUrl::new("https://oauth2.googleapis.com/token".to_string())
                .expect("Invalid Google Token URL");

            Some(
                BasicClient::new(
                    client_id,
                    Some(client_secret),
                    auth_url,
                    Some(token_url),
                )
                .set_redirect_uri(
                    RedirectUrl::new(google_redirect_url).expect("Invalid Google Redirect URL"),
                ),
            )
        } else {
            None
        };

        let github_client = if let (
            Some(github_client_id),
            Some(github_client_secret),
            Some(github_redirect_url),
        ) = (
            config.github_oauth_client_id.clone(),
            config.github_oauth_client_secret.clone(),
            config.github_oauth_redirect_url.clone(),
        ) {
            let client_id = ClientId::new(github_client_id);
            let client_secret = ClientSecret::new(github_client_secret);
            let auth_url = AuthUrl::new("https://github.com/login/oauth/authorize".to_string())
                .expect("Invalid GitHub Auth URL");
            let token_url = TokenUrl::new("https://github.com/login/oauth/access_token".to_string())
                .expect("Invalid GitHub Token URL");

            Some(
                BasicClient::new(
                    client_id,
                    Some(client_secret),
                    auth_url,
                    Some(token_url),
                )
                .set_redirect_uri(
                    RedirectUrl::new(github_redirect_url).expect("Invalid GitHub Redirect URL"),
                ),
            )
        } else {
            None
        };

        Self {
            google_client,
            github_client,
            user_service,
            auth_service,
            db,
        }
    }

    /// Get Google authorization URL
    pub fn get_google_authorize_url(&self) -> AppResult<Redirect> {
        let client = self
            .google_client
            .as_ref()
            .ok_or_else(|| AppError::Config("Google OAuth not configured".to_string()))?;

        let (authorize_url, _csrf_state) = client
            .authorize_url(CsrfToken::new_random)
            .add_scope(Scope::new("email".to_string()))
            .add_scope(Scope::new("profile".to_string()))
            .url();

        Ok(Redirect::to(authorize_url))
    }

    /// Handle Google OAuth callback
    pub async fn handle_google_callback(
        &self,
        code: String,
        state: String,
    ) -> AppResult<(UserInfo, String)> {
        let client = self
            .google_client
            .as_ref()
            .ok_or_else(|| AppError::Config("Google OAuth not configured".to_string()))?;

        let token_response = client
            .exchange_code(AuthorizationCode::new(code))
            .request_async(oauth2::reqwest::async_http_client)
            .await
            .map_err(|e| AppError::Authentication(format!("Failed to exchange code: {}", e)))?;

        // Get user info from Google (e.g., using reqwest to call Google's userinfo API)
        let http_client = reqwest::Client::new();
        let user_info_url = Url::parse_with_params(
            "https://openidconnect.googleapis.com/v1/userinfo",
            &[("alt", "json")],
        )
        .map_err(|e| AppError::Internal(format!("Invalid userinfo URL: {}", e)))?;

        #[derive(Debug, Deserialize)]
        struct GoogleUserInfo {
            email: String,
            given_name: Option<String>,
            family_name: Option<String>,
            sub: String, // Provider specific user ID
            picture: Option<String>,
        }

        let google_user_info: GoogleUserInfo = http_client
            .get(user_info_url)
            .bearer_auth(token_response.access_token().secret())
            .send()
            .await
            .map_err(|e| AppError::Authentication(format!("Failed to get user info: {}", e)))?
            .json()
            .await
            .map_err(|e| AppError::Authentication(format!("Failed to parse user info: {}", e)))?;

        // Find or create user in our database
        let user_info = self.find_or_create_oauth_user(
            &google_user_info.email,
            &google_user_info.given_name.unwrap_or_default(),
            &google_user_info.family_name.unwrap_or_default(),
            &google_user_info.sub, // Pass provider_id
            "google",
        ).await?;

        // Generate JWT access token
        let user = self.user_service.get_user_by_id_raw(user_info.id).await?;
        let access_token = self.auth_service.generate_token(&user)?;

        Ok((user_info, access_token))
    }

    /// Get GitHub authorization URL
    pub fn get_github_authorize_url(&self) -> AppResult<Redirect> {
        let client = self
            .github_client
            .as_ref()
            .ok_or_else(|| AppError::Config("GitHub OAuth not configured".to_string()))?;

        let (authorize_url, _csrf_state) = client
            .authorize_url(CsrfToken::new_random)
            .add_scope(Scope::new("user:email".to_string()))
            .url();

        Ok(Redirect::to(authorize_url))
    }

    /// Handle GitHub OAuth callback
    pub async fn handle_github_callback(
        &self,
        code: String,
        state: String,
    ) -> AppResult<(UserInfo, String)> {
        let client = self
            .github_client
            .as_ref()
            .ok_or_else(|| AppError::Config("GitHub OAuth not configured".to_string()))?;

        let token_response = client
            .exchange_code(AuthorizationCode::new(code))
            .request_async(oauth2::reqwest::async_http_client)
            .await
            .map_err(|e| AppError::Authentication(format!("Failed to exchange code: {}", e)))?;

        // Get user info from GitHub
        let http_client = reqwest::Client::new();
        let user_info_response: serde_json::Value = http_client
            .get("https://api.github.com/user")
            .header(reqwest::header::USER_AGENT, "reconciliation-platform") // GitHub API requires User-Agent
            .bearer_auth(token_response.access_token().secret())
            .send()
            .await
            .map_err(|e| AppError::Authentication(format!("Failed to get user info: {}", e)))?
            .json()
            .await
            .map_err(|e| AppError::Authentication(format!("Failed to parse user info: {}", e)))?;
        
        let email = user_info_response["email"]
            .as_str()
            .ok_or_else(|| AppError::Authentication("GitHub user email not found".to_string()))?
            .to_string();

        let name_parts: Vec<&str> = user_info_response["name"]
            .as_str()
            .unwrap_or_default()
            .splitn(2, ' ')
            .collect();

        let first_name = name_parts.get(0).unwrap_or(&"").to_string();
        let last_name = name_parts.get(1).unwrap_or(&"").to_string();
        let github_id = user_info_response["id"]
            .as_u64()
            .ok_or_else(|| AppError::Authentication("GitHub user ID not found".to_string()))?
            .to_string();

        // Find or create user in our database
        let user_info = self.find_or_create_oauth_user(
            &email,
            &first_name,
            &last_name,
            &github_id, // Pass provider_id
            "github",
        ).await?;

        // Generate JWT access token
        let user = self.user_service.get_user_by_id_raw(user_info.id).await?;
        let access_token = self.auth_service.generate_token(&user)?;

        Ok((user_info, access_token))
    }

    /// Helper to find or create a user based on OAuth provider info
    async fn find_or_create_oauth_user(
        &self,
        email: &str,
        first_name: &str,
        last_name: &str,
        provider_id: &str,
        auth_provider_name: &str,
    ) -> AppResult<UserInfo> {
        // Try to find user by provider_id first
        if let Ok(user) = self.user_service.get_user_by_provider_id(provider_id).await {
            // User found by provider_id, return it
            return self.user_service.get_user_by_id(user.id).await;
        }

        // If not found by provider_id, try to find by email
        if let Ok(user) = self.user_service.get_user_by_email(email).await {
            // User found by email, but without provider_id - link this OAuth account
            let update_req = crate::services::user::traits::UpdateUserRequest {
                email: None,
                first_name: None,
                last_name: None,
                role: None,
                is_active: Some(true), // OAuth users are considered email_verified
                // Set auth_provider and provider_id through direct update in service
            };
            
            // Directly update user with provider_id and auth_provider (requires new service method)
            return self.user_service.link_oauth_to_user(user.id, provider_id, auth_provider_name).await;
        }

        // If no user found, create a new one
        let create_req = CreateOAuthUserRequest {
            email: email.to_string(),
            first_name: first_name.to_string(),
            last_name: last_name.to_string(),
            role: Some("user".to_string()), // Default role for new OAuth users
            picture: None, // Can be extended later
            provider_id: Some(provider_id.to_string()),
            auth_provider: Some(auth_provider_name.to_string()),
        };

        self.user_service.create_oauth_user(create_req).await
    }
}
