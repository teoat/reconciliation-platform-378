//! Test utilities for integration tests
//! Simplified version without heavy service dependencies

use actix_web::{test, web, App};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

// Test configuration
const TEST_DATABASE_URL: &str = "postgresql://postgres:postgres@localhost:5432/reconciliation_test";

/// Helper function to create test app configuration - can be used from any test
pub async fn get_test_config_and_db() -> (reconciliation_backend::database::Database, reconciliation_backend::config::Config) {
    use reconciliation_backend::{config::Config, database::Database};
    
    let config = Config::from_env().unwrap_or_else(|_| {
        Config {
            host: "0.0.0.0".to_string(),
            port: 2000,
            database_url: TEST_DATABASE_URL.to_string(),
            redis_url: "redis://localhost:6379".to_string(),
            jwt_secret: "test-secret-key".to_string(),
            jwt_expiration: 3600,
            cors_origins: vec!["http://localhost:3000".to_string()],
            log_level: "info".to_string(),
            max_file_size: 10485760,
            upload_path: "./uploads".to_string(),
        }
    });
    
    let db = Database::new(&config.database_url)
        .await
        .unwrap_or_else(|_| {
            panic!("Failed to create test database. Please ensure PostgreSQL is running.");
        });

    (db, config)
}

// ============================================================================
// TEST CLIENT
// ============================================================================

/// Test client for making authenticated API requests
/// Note: App service is created fresh via get_app() method to avoid complex type storage
pub struct TestClient {
    pub auth_token: Option<String>,
    pub user_id: Option<Uuid>,
}

impl TestClient {
    /// Create a new test client
    pub fn new() -> Self {
        Self {
            auth_token: None,
            user_id: None,
        }
    }


    /// Authenticate as a user
    pub async fn authenticate_as(&mut self, email: &str, password: &str) -> Result<(), String> {
        let login_data = json!({
            "email": email,
            "password": password,
        });

        let req = test::TestRequest::post()
            .uri("/api/auth/login")
            .insert_header(("Content-Type", "application/json"))
            .set_json(&login_data)
            .to_request();

        let (db, config) = get_test_config_and_db().await;
        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db))
                .app_data(web::Data::new(config))
                .configure(reconciliation_backend::handlers::configure_routes),
        )
        .await;
        let resp = test::call_service(&app, req).await;
        
        if resp.status().is_success() {
            let body: serde_json::Value = test::read_body_json(resp).await;
            if let Some(token) = body.get("data").and_then(|d| d.get("token")).and_then(|t| t.as_str()) {
                self.auth_token = Some(token.to_string());
                Ok(())
            } else {
                Err("Token not found in response".to_string())
            }
        } else {
            Err(format!("Authentication failed: {}", resp.status()))
        }
    }

    /// Create an authenticated request
    pub fn authenticated_request(&self, method: &str, uri: &str) -> test::TestRequest {
        let mut req = match method {
            "GET" => test::TestRequest::get(),
            "POST" => test::TestRequest::post(),
            "PUT" => test::TestRequest::put(),
            "DELETE" => test::TestRequest::delete(),
            "PATCH" => test::TestRequest::patch(),
            _ => test::TestRequest::default(),
        };

        req = req.uri(uri);

        if let Some(ref token) = self.auth_token {
            req = req.insert_header(("Authorization", format!("Bearer {}", token)));
        }

        req
    }

    /// Create a project
    pub async fn create_project(&self, name: &str, description: &str) -> Result<String, String> {
        let project_data = json!({
            "name": name,
            "description": description,
        });

        let req = self
            .authenticated_request("POST", "/api/projects")
            .insert_header(("Content-Type", "application/json"))
            .set_json(&project_data)
            .to_request();

        let (db, config) = get_test_config_and_db().await;
        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db))
                .app_data(web::Data::new(config))
                .configure(reconciliation_backend::handlers::configure_routes),
        )
        .await;
        let resp = test::call_service(&app, req).await;
        
        if resp.status().is_success() {
            let body: serde_json::Value = test::read_body_json(resp).await;
            if let Some(id) = body.get("data").and_then(|d| d.get("id")).and_then(|i| i.as_str()) {
                Ok(id.to_string())
            } else {
                Err("Project ID not found in response".to_string())
            }
        } else {
            Err(format!("Failed to create project: {}", resp.status()))
        }
    }

    /// Upload a file
    pub async fn upload_file(&self, project_id: &str, file_path: &str) -> Result<String, String> {
        // Simplified file upload - in real tests, would read file and create multipart request
        let file_data = json!({
            "project_id": project_id,
            "file_path": file_path,
        });

        let req = self
            .authenticated_request("POST", "/api/files/upload")
            .insert_header(("Content-Type", "application/json"))
            .set_json(&file_data)
            .to_request();

        let (db, config) = get_test_config_and_db().await;
        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db))
                .app_data(web::Data::new(config))
                .configure(reconciliation_backend::handlers::configure_routes),
        )
        .await;
        let resp = test::call_service(&app, req).await;
        
        if resp.status().is_success() {
            let body: serde_json::Value = test::read_body_json(resp).await;
            if let Some(id) = body.get("data").and_then(|d| d.get("id")).and_then(|i| i.as_str()) {
                Ok(id.to_string())
            } else {
                Err("File ID not found in response".to_string())
            }
        } else {
            Err(format!("Failed to upload file: {}", resp.status()))
        }
    }

    /// Create a reconciliation job
    pub async fn create_reconciliation_job(
        &self,
        project_id: &str,
        name: &str,
    ) -> Result<String, String> {
        let job_data = json!({
            "project_id": project_id,
            "name": name,
        });

        let req = self
            .authenticated_request("POST", &format!("/api/projects/{}/reconciliation-jobs", project_id))
            .insert_header(("Content-Type", "application/json"))
            .set_json(&job_data)
            .to_request();

        let (db, config) = get_test_config_and_db().await;
        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(db))
                .app_data(web::Data::new(config))
                .configure(reconciliation_backend::handlers::configure_routes),
        )
        .await;
        let resp = test::call_service(&app, req).await;
        
        if resp.status().is_success() {
            let body: serde_json::Value = test::read_body_json(resp).await;
            if let Some(id) = body.get("data").and_then(|d| d.get("id")).and_then(|i| i.as_str()) {
                Ok(id.to_string())
            } else {
                Err("Job ID not found in response".to_string())
            }
        } else {
            Err(format!("Failed to create reconciliation job: {}", resp.status()))
        }
    }
}

// ============================================================================
// TEST FIXTURES
// ============================================================================

/// Test user data
pub struct TestUser {
    pub email: String,
    pub password: String,
    pub first_name: String,
    pub last_name: String,
    pub role: String,
}

impl Default for TestUser {
    fn default() -> Self {
        Self {
            email: "test@example.com".to_string(),
            password: "TestPassword123!".to_string(),
            first_name: "Test".to_string(),
            last_name: "User".to_string(),
            role: "user".to_string(),
        }
    }
}

/// Test configuration
#[derive(Clone, Debug)]
pub struct TestConfig {
    pub database_url: String,
    pub jwt_secret: String,
}

impl Default for TestConfig {
    fn default() -> Self {
        Self {
            database_url: TEST_DATABASE_URL.to_string(),
            jwt_secret: "test-secret-key".to_string(),
        }
    }
}
