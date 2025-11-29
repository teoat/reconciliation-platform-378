//! Auth Proxy Handler
//!
//! This module provides proxy routes to forward authentication requests to Better Auth server.
//! Supports token introspection, refresh, and session management.

use actix_web::{web, HttpRequest, HttpResponse};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;

use crate::errors::{AppError, AppResult};
use crate::services::structured_logging::{LogLevel, StructuredLogging};

/// Auth proxy service configuration
#[derive(Debug, Clone)]
pub struct AuthProxyConfig {
    pub auth_server_url: String,
    pub timeout_seconds: u64,
    pub enable_logging: bool,
}

impl Default for AuthProxyConfig {
    fn default() -> Self {
        Self {
            auth_server_url: std::env::var("AUTH_SERVER_URL")
                .unwrap_or_else(|_| "http://localhost:3001".to_string()),
            timeout_seconds: 10,
            enable_logging: true,
        }
    }
}

/// Auth proxy service
pub struct AuthProxyService {
    config: AuthProxyConfig,
    http_client: reqwest::Client,
    logger: StructuredLogging,
}

impl AuthProxyService {
    pub fn new(config: AuthProxyConfig) -> Self {
        let http_client = reqwest::Client::builder()
            .timeout(Duration::from_secs(config.timeout_seconds))
            .build()
            .unwrap_or_default();

        let logger = StructuredLogging::new("auth_proxy".to_string());

        Self {
            config,
            http_client,
            logger,
        }
    }

    /// Proxy request to Better Auth server
    async fn proxy_request(
        &self,
        endpoint: &str,
        body: serde_json::Value,
    ) -> AppResult<serde_json::Value> {
        let url = format!("{}{}", self.config.auth_server_url, endpoint);

        if self.config.enable_logging {
            let mut fields = std::collections::HashMap::new();
            fields.insert("endpoint".to_string(), serde_json::json!(endpoint));
            fields.insert("url".to_string(), serde_json::json!(url));
            self.logger
                .log(LogLevel::Info, "Proxying auth request", fields);
        }

        let response = self
            .http_client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| {
                AppError::InternalError(format!("Auth server request failed: {}", e))
            })?;

        let status = response.status();
        let response_body = response.text().await.map_err(|e| {
            AppError::InternalError(format!("Failed to read auth server response: {}", e))
        })?;

        if !status.is_success() {
            return Err(AppError::Unauthorized(format!(
                "Auth server returned error: {}",
                response_body
            )));
        }

        serde_json::from_str(&response_body).map_err(|e| {
            AppError::InternalError(format!("Failed to parse auth server response: {}", e))
        })
    }
}

/// Token introspection request
#[derive(Debug, Deserialize, Serialize)]
pub struct TokenIntrospectionRequest {
    pub token: String,
}

/// Token introspection response
#[derive(Debug, Deserialize, Serialize)]
pub struct TokenIntrospectionResponse {
    pub active: bool,
    pub sub: Option<String>,
    pub email: Option<String>,
    pub role: Option<String>,
    pub exp: Option<i64>,
    pub iat: Option<i64>,
}

/// Token refresh request
#[derive(Debug, Deserialize, Serialize)]
pub struct TokenRefreshRequest {
    pub refresh_token: String,
}

/// Token refresh response
#[derive(Debug, Deserialize, Serialize)]
pub struct TokenRefreshResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
}

/// Login request
#[derive(Debug, Deserialize, Serialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

/// Login response
#[derive(Debug, Deserialize, Serialize)]
pub struct LoginResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub user: UserResponse,
}

/// User response
#[derive(Debug, Deserialize, Serialize)]
pub struct UserResponse {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
    pub role: String,
}

/// Register request
#[derive(Debug, Deserialize, Serialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub name: Option<String>,
}

/// Register response
#[derive(Debug, Deserialize, Serialize)]
pub struct RegisterResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub user: UserResponse,
}

/// Logout request
#[derive(Debug, Deserialize, Serialize)]
pub struct LogoutRequest {
    pub token: String,
}

/// Token introspection endpoint
///
/// Validates a token and returns its claims.
///
/// # Arguments
/// * `req` - Token introspection request
/// * `service` - Auth proxy service
///
/// # Returns
/// * Token introspection response with claims
pub async fn introspect_token(
    req: web::Json<TokenIntrospectionRequest>,
    service: web::Data<Arc<AuthProxyService>>,
) -> AppResult<HttpResponse> {
    let response = service
        .proxy_request("/api/auth/introspect", serde_json::to_value(&req.0)?)
        .await?;

    Ok(HttpResponse::Ok().json(response))
}

/// Token refresh endpoint
///
/// Refreshes an access token using a refresh token.
///
/// # Arguments
/// * `req` - Token refresh request
/// * `service` - Auth proxy service
///
/// # Returns
/// * New access token and refresh token
pub async fn refresh_token(
    req: web::Json<TokenRefreshRequest>,
    service: web::Data<Arc<AuthProxyService>>,
) -> AppResult<HttpResponse> {
    let response = service
        .proxy_request("/api/auth/refresh", serde_json::to_value(&req.0)?)
        .await?;

    Ok(HttpResponse::Ok().json(response))
}

/// Login endpoint (proxy to Better Auth)
///
/// Proxies login request to Better Auth server.
///
/// # Arguments
/// * `req` - Login request
/// * `service` - Auth proxy service
///
/// # Returns
/// * Access token, refresh token, and user information
pub async fn login_proxy(
    req: web::Json<LoginRequest>,
    service: web::Data<Arc<AuthProxyService>>,
) -> AppResult<HttpResponse> {
    let response = service
        .proxy_request("/api/auth/login", serde_json::to_value(&req.0)?)
        .await?;

    Ok(HttpResponse::Ok().json(response))
}

/// Register endpoint (proxy to Better Auth)
///
/// Proxies registration request to Better Auth server.
///
/// # Arguments
/// * `req` - Register request
/// * `service` - Auth proxy service
///
/// # Returns
/// * Access token, refresh token, and user information
pub async fn register_proxy(
    req: web::Json<RegisterRequest>,
    service: web::Data<Arc<AuthProxyService>>,
) -> AppResult<HttpResponse> {
    let response = service
        .proxy_request("/api/auth/register", serde_json::to_value(&req.0)?)
        .await?;

    Ok(HttpResponse::Ok().json(response))
}

/// Logout endpoint (proxy to Better Auth)
///
/// Proxies logout request to Better Auth server.
///
/// # Arguments
/// * `req` - Logout request
/// * `service` - Auth proxy service
///
/// # Returns
/// * Success response
pub async fn logout_proxy(
    req: web::Json<LogoutRequest>,
    service: web::Data<Arc<AuthProxyService>>,
) -> AppResult<HttpResponse> {
    let response = service
        .proxy_request("/api/auth/logout", serde_json::to_value(&req.0)?)
        .await?;

    Ok(HttpResponse::Ok().json(response))
}

/// OAuth callback endpoint (proxy to Better Auth)
///
/// Handles OAuth provider callbacks.
///
/// # Arguments
/// * `http_req` - HTTP request
/// * `service` - Auth proxy service
///
/// # Returns
/// * OAuth callback response
pub async fn oauth_callback_proxy(
    http_req: HttpRequest,
    service: web::Data<Arc<AuthProxyService>>,
) -> AppResult<HttpResponse> {
    let query_string = http_req.query_string();
    let url = format!(
        "{}/api/auth/callback?{}",
        service.config.auth_server_url, query_string
    );

    let response = service
        .http_client
        .get(&url)
        .send()
        .await
        .map_err(|e| AppError::InternalError(format!("OAuth callback failed: {}", e)))?;

    let status = response.status();
    let body = response.text().await.map_err(|e| {
        AppError::InternalError(format!("Failed to read OAuth callback response: {}", e))
    })?;

    if !status.is_success() {
        return Err(AppError::Unauthorized(format!(
            "OAuth callback failed: {}",
            body
        )));
    }

    Ok(HttpResponse::Ok().body(body))
}

/// Session verification endpoint
///
/// Verifies if a session is valid.
///
/// # Arguments
/// * `http_req` - HTTP request
/// * `service` - Auth proxy service
///
/// # Returns
/// * Session status
pub async fn verify_session(
    http_req: HttpRequest,
    service: web::Data<Arc<AuthProxyService>>,
) -> AppResult<HttpResponse> {
    // Extract token from Authorization header
    let auth_header = http_req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(AppError::Unauthorized(
            "Missing Authorization header".to_string(),
        ))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(AppError::Unauthorized("Invalid token format".to_string()))?;

    let introspection_req = TokenIntrospectionRequest {
        token: token.to_string(),
    };

    let response = service
        .proxy_request(
            "/api/auth/introspect",
            serde_json::to_value(&introspection_req)?,
        )
        .await?;

    Ok(HttpResponse::Ok().json(response))
}

/// Configure auth proxy routes
pub fn configure_auth_proxy(cfg: &mut web::ServiceConfig, service: Arc<AuthProxyService>) {
    cfg.app_data(web::Data::new(service))
        .service(
            web::scope("/api/auth-proxy")
                .route("/introspect", web::post().to(introspect_token))
                .route("/refresh", web::post().to(refresh_token))
                .route("/login", web::post().to(login_proxy))
                .route("/register", web::post().to(register_proxy))
                .route("/logout", web::post().to(logout_proxy))
                .route("/callback", web::get().to(oauth_callback_proxy))
                .route("/verify", web::get().to(verify_session)),
        );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_auth_proxy_config_default() {
        let config = AuthProxyConfig::default();
        assert!(config.auth_server_url.contains("localhost") || config.auth_server_url.contains("http"));
        assert_eq!(config.timeout_seconds, 10);
        assert!(config.enable_logging);
    }
}

