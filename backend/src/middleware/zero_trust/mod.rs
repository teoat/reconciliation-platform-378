//! Zero-Trust Security Middleware
//!
//! Implements zero-trust security principles: never trust, always verify

mod config;
mod identity;
mod mtls;
mod network;
mod privilege;

pub use config::ZeroTrustConfig;
pub use identity::{verify_identity, extract_token_from_request};
pub use mtls::verify_mtls;
pub use network::{check_network_segmentation, is_ip_in_ranges};
pub use privilege::{enforce_least_privilege, extract_resource_from_path, extract_action_from_method};

use crate::services::auth::AuthService;
use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error,
};
use futures::future::{ready, Ready};
use redis::Client as RedisClient;
use std::pin::Pin;
use std::sync::Arc;

/// Zero-trust middleware
///
/// Implements zero-trust security principles: never trust, always verify.
/// Provides identity verification, mTLS support, RBAC enforcement, and network segmentation.
pub struct ZeroTrustMiddleware {
    config: ZeroTrustConfig,
    auth_service: Option<Arc<AuthService>>,
    redis_client: Option<Arc<RedisClient>>,
}

impl ZeroTrustMiddleware {
    pub fn new(config: ZeroTrustConfig) -> Self {
        // Try to initialize Redis client for token revocation list
        let redis_client = match std::env::var("REDIS_URL") {
            Ok(redis_url) => match RedisClient::open(redis_url) {
                Ok(client) => {
                    log::info!("Zero Trust middleware using Redis for token revocation list");
                    Some(Arc::new(client))
                }
                Err(e) => {
                    log::warn!("Failed to connect to Redis for token revocation, will use database fallback: {}", e);
                    None
                }
            },
            Err(_) => {
                log::warn!("REDIS_URL not set, token revocation will use database fallback");
                None
            }
        };

        Self {
            config,
            auth_service: None,
            redis_client,
        }
    }

    /// Add authentication service to middleware
    pub fn with_auth_service(mut self, auth_service: Arc<AuthService>) -> Self {
        self.auth_service = Some(auth_service);
        self
    }

    pub fn with_redis_client(mut self, redis_client: Arc<RedisClient>) -> Self {
        self.redis_client = Some(redis_client);
        self
    }
}

impl<S, B> Transform<S, ServiceRequest> for ZeroTrustMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = ZeroTrustMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(ZeroTrustMiddlewareService {
            service: Arc::new(service),
            config: self.config.clone(),
            auth_service: self.auth_service.clone(),
            redis_client: self.redis_client.clone(),
        }))
    }
}

pub struct ZeroTrustMiddlewareService<S> {
    service: Arc<S>,
    config: ZeroTrustConfig,
    auth_service: Option<Arc<AuthService>>,
    redis_client: Option<Arc<RedisClient>>,
}

impl<S, B> Service<ServiceRequest> for ZeroTrustMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn std::future::Future<Output = Result<Self::Response, Self::Error>> + 'static>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let config = self.config.clone();
        let service = Arc::clone(&self.service);

        let auth_service_clone = self.auth_service.clone();
        let redis_client_clone = self.redis_client.clone();
        Box::pin(async move {
            // Allow OPTIONS requests (CORS preflight) to bypass ZeroTrust checks
            if req.method() == actix_web::http::Method::OPTIONS {
                return service.call(req).await;
            }

            // Skip zero-trust checks for public authentication endpoints
            // These endpoints are used to obtain authentication tokens
            let path = req.path();
            let should_skip = path == "/health"
                || path.starts_with("/health/")
                || path == "/api/auth/login"
                || path.starts_with("/api/auth/login")
                || path == "/api/auth/register"
                || path.starts_with("/api/auth/register")
                || path == "/api/auth/google"
                || path.starts_with("/api/auth/google")
                || path.starts_with("/api/auth/password-reset");
            
            if should_skip {
                log::debug!("Skipping zero-trust check for path: {}", path);
                return service.call(req).await;
            }

            // Verify identity
            if config.require_identity_verification {
                if let Err(e) = verify_identity(&req, auth_service_clone.as_ref(), redis_client_clone.as_ref()).await {
                    log::warn!("Identity verification failed: {}", e);
                    return Err(actix_web::error::ErrorUnauthorized("Identity verification failed"));
                }
            }

            // Verify mTLS if required
            if config.require_mtls {
                if let Err(e) = verify_mtls(&req).await {
                    log::warn!("mTLS verification failed: {}", e);
                    return Err(actix_web::error::ErrorForbidden("mTLS verification failed"));
                }
            }

            // Enforce least privilege
            if config.enforce_least_privilege {
                if let Err(e) = enforce_least_privilege(&req, auth_service_clone.as_ref()).await {
                    log::warn!("Least privilege check failed: {}", e);
                    return Err(actix_web::error::ErrorForbidden("Insufficient privileges"));
                }
            }

            // Check network segmentation
            if config.network_segmentation {
                if let Err(e) = check_network_segmentation(&req).await {
                    log::warn!("Network segmentation check failed: {}", e);
                    return Err(actix_web::error::ErrorForbidden("Network segmentation violation"));
                }
            }

            service.call(req).await
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::{test, web, App, HttpResponse};
    use crate::services::auth::AuthService;
    use crate::test_utils::TestUser;
    use std::sync::Arc;
    use chrono::Utc;

    async fn test_handler() -> HttpResponse {
        HttpResponse::Ok().json(serde_json::json!({"status": "ok"}))
    }

    /// Helper function to create a test User from TestUser
    fn create_test_user(test_user: &TestUser, status: &str) -> crate::models::User {
        crate::models::User {
            id: test_user.id,
            email: test_user.email.clone(),
            username: None,
            first_name: Some(test_user.first_name.clone()),
            last_name: Some(test_user.last_name.clone()),
            password_hash: "hashed_password".to_string(),
            status: status.to_string(),
            email_verified: true,
            email_verified_at: Some(Utc::now()),
            last_login_at: None,
            last_active_at: None,
            password_expires_at: None,
            password_last_changed: Some(Utc::now()),
            password_history: Some(serde_json::json!([])),
            is_initial_password: false,
            initial_password_set_at: None,
            auth_provider: Some("password".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    #[tokio::test]
    async fn test_zero_trust_middleware_identity_verification() {
        let auth_service = Arc::new(AuthService::new("test_secret".to_string(), 3600));
        let test_user = TestUser::new();
        
        let user = create_test_user(&test_user, &test_user.role.to_string());
        let token = auth_service.generate_token(&user).expect("Failed to generate token");

        let config = ZeroTrustConfig {
            require_identity_verification: true,
            require_mtls: false,
            enforce_least_privilege: false,
            network_segmentation: false,
        };

        let app = test::init_service(
            App::new()
                .wrap(ZeroTrustMiddleware::new(config.clone()).with_auth_service(auth_service.clone()))
                .route("/test", web::get().to(test_handler))
        ).await;

        // Test with valid token
        let req = test::TestRequest::get()
            .uri("/test")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 200);

        // Test with missing token
        let req = test::TestRequest::get()
            .uri("/test")
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 401);
    }

    #[tokio::test]
    async fn test_network_segmentation() {
        let _config = ZeroTrustConfig {
            require_identity_verification: false,
            require_mtls: false,
            enforce_least_privilege: false,
            network_segmentation: true,
        };

        // Test internal IP ranges
        assert!(is_ip_in_ranges("10.0.0.1", &[
            ("10.0.0.0", "10.255.255.255"),
            ("172.16.0.0", "172.31.255.255"),
            ("192.168.0.0", "192.168.255.255"),
            ("127.0.0.1", "127.0.0.1"),
        ]));

        assert!(is_ip_in_ranges("192.168.1.1", &[
            ("10.0.0.0", "10.255.255.255"),
            ("172.16.0.0", "172.31.255.255"),
            ("192.168.0.0", "192.168.255.255"),
            ("127.0.0.1", "127.0.0.1"),
        ]));

        // Test external IP
        assert!(!is_ip_in_ranges("8.8.8.8", &[
            ("10.0.0.0", "10.255.255.255"),
            ("172.16.0.0", "172.31.255.255"),
            ("192.168.0.0", "192.168.255.255"),
            ("127.0.0.1", "127.0.0.1"),
        ]));
    }

    #[tokio::test]
    async fn test_extract_resource_from_path() {
        assert_eq!(extract_resource_from_path("/api/users/123"), "users");
        assert_eq!(extract_resource_from_path("/api/projects/456"), "projects");
        assert_eq!(extract_resource_from_path("/api/reconciliation/jobs"), "reconciliation");
        assert_eq!(extract_resource_from_path("/api/admin/users"), "system");
        assert_eq!(extract_resource_from_path("/api/unknown"), "unknown");
    }

    #[tokio::test]
    async fn test_extract_action_from_method() {
        assert_eq!(extract_action_from_method("GET"), "read");
        assert_eq!(extract_action_from_method("POST"), "create");
        assert_eq!(extract_action_from_method("PUT"), "update");
        assert_eq!(extract_action_from_method("PATCH"), "update");
        assert_eq!(extract_action_from_method("DELETE"), "delete");
    }

    #[tokio::test]
    async fn test_zero_trust_config_defaults() {
        let config = ZeroTrustConfig::default();
        assert!(config.require_identity_verification);
        assert!(!config.require_mtls);
        assert!(config.enforce_least_privilege);
        assert!(config.network_segmentation);
    }
}

