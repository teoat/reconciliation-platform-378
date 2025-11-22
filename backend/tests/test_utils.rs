//! Test utilities for integration tests
//! Simplified version without heavy service dependencies

use actix_web::{test, web, App};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

// Test configuration
pub const TEST_DATABASE_URL: &str =
    "postgresql://test_user:test_pass@localhost:5432/reconciliation_test";

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
            app_storage: None,
        }
    }

    /// Get test app service - creates a fresh app for each call
    pub async fn get_app() -> impl actix_web::dev::Service<
        actix_web::dev::ServiceRequest,
        Response = actix_web::dev::ServiceResponse<actix_web::body::BoxBody>,
        Error = actix_web::Error,
    > {
        use reconciliation_backend::{config::Config, database::Database, handlers::configure_routes};
        
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

        test::init_service(
            App::new()
                .app_data(web::Data::new(db))
                .app_data(web::Data::new(config))
                .configure(configure_routes),
        )
        .await
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
            .set_json(&login_data);

        let app = Self::get_app().await;
        let resp = test::call_service(&app, req.to_request()).await;
        
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
            .set_json(&project_data);

        let app = Self::get_app().await;
        let resp = test::call_service(&app, req.to_request()).await;
        
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
            .set_json(&file_data);

        let app = Self::get_app().await;
        let resp = test::call_service(&app, req.to_request()).await;
        
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
            .set_json(&job_data);

        let app = Self::get_app().await;
        let resp = test::call_service(&app, req.to_request()).await;
        
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
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestUser {
    pub id: String,
    pub email: String,
    pub password: String,
    pub first_name: String,
    pub last_name: String,
    pub role: String,
    pub is_active: bool,
}

impl TestUser {
    pub fn new_admin() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            email: "admin@test.com".to_string(),
            password: "admin123".to_string(),
            first_name: "Admin".to_string(),
            last_name: "User".to_string(),
            role: "admin".to_string(),
            is_active: true,
        }
    }

    pub fn new_user() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            email: "user@test.com".to_string(),
            password: "user123".to_string(),
            first_name: "Test".to_string(),
            last_name: "User".to_string(),
            role: "user".to_string(),
            is_active: true,
        }
    }
}

/// Test project data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestProject {
    pub id: String,
    pub name: String,
    pub description: String,
    pub owner_id: String,
    pub status: String,
}

impl TestProject {
    pub fn new(owner_id: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name: "Test Project".to_string(),
            description: "A test project for reconciliation".to_string(),
            owner_id,
            status: "active".to_string(),
        }
    }
}

/// Test data source
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestDataSource {
    pub id: String,
    pub name: String,
    pub source_type: String,
    pub project_id: String,
}

impl TestDataSource {
    pub fn new_csv(project_id: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name: "test_data.csv".to_string(),
            source_type: "csv".to_string(),
            project_id,
        }
    }

    pub fn new_json(project_id: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name: "test_data.json".to_string(),
            source_type: "json".to_string(),
            project_id,
        }
    }
}

/// Test reconciliation job
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestReconciliationJob {
    pub id: String,
    pub name: String,
    pub project_id: String,
    pub source_a_id: String,
    pub source_b_id: String,
    pub status: String,
}

impl TestReconciliationJob {
    pub fn new(project_id: String, source_a_id: String, source_b_id: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name: "Test Reconciliation Job".to_string(),
            project_id,
            source_a_id,
            source_b_id,
            status: "pending".to_string(),
        }
    }
}

// ============================================================================
// TEST DATA HELPERS
// ============================================================================

/// Generate test CSV data
pub fn get_test_csv_data() -> &'static str {
    r#"id,name,amount,date
1,Item A,1000,2024-01-01
2,Item B,2000,2024-01-02
3,Item C,3000,2024-01-03"#
}

/// Generate test JSON data
pub fn get_test_json_data() -> serde_json::Value {
    json!([
        {"id": 1, "name": "Item A", "amount": 1000, "date": "2024-01-01"},
        {"id": 2, "name": "Item B", "amount": 2000, "date": "2024-01-02"},
        {"id": 3, "name": "Item C", "amount": 3000, "date": "2024-01-03"}
    ])
}

/// JWT test data
pub struct TestJwtData {
    pub secret: String,
    pub user_id: String,
    pub email: String,
    pub role: String,
    pub expires_in: i64,
}

impl TestJwtData {
    pub fn new() -> Self {
        Self {
            secret: "test-secret-key".to_string(),
            user_id: Uuid::new_v4().to_string(),
            email: "test@example.com".to_string(),
            role: "user".to_string(),
            expires_in: 3600,
        }
    }
}

impl Default for TestJwtData {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// PERFORMANCE TEST UTILITIES
// ============================================================================

use std::time::{Duration, Instant};

/// Measure execution time
pub fn measure_time<F, R>(f: F) -> (R, Duration)
where
    F: FnOnce() -> R,
{
    let start = Instant::now();
    let result = f();
    let duration = start.elapsed();
    (result, duration)
}

/// Assert performance threshold
pub fn assert_performance_threshold(duration: Duration, max_duration: Duration) {
    assert!(
        duration <= max_duration,
        "Operation took {:?}, expected <= {:?}",
        duration,
        max_duration
    );
}

/// Generate test data for performance testing
pub fn generate_test_data(count: usize) -> Vec<serde_json::Value> {
    (0..count)
        .map(|i| {
            json!({
                "id": i,
                "name": format!("Test User {}", i),
                "email": format!("user{}@example.com", i),
                "amount": i * 100,
            })
        })
        .collect()
}

// ============================================================================
// MOCK UTILITIES
// ============================================================================

use std::collections::HashMap;
use std::sync::Mutex;

/// Mock Redis client for testing
pub struct MockRedisClient {
    data: Mutex<HashMap<String, String>>,
}

impl MockRedisClient {
    pub fn new() -> Self {
        Self {
            data: Mutex::new(HashMap::new()),
        }
    }

    pub fn set(&self, key: &str, value: &str) -> Result<(), String> {
        let mut data = self.data.lock().unwrap();
        data.insert(key.to_string(), value.to_string());
        Ok(())
    }

    pub fn get(&self, key: &str) -> Result<Option<String>, String> {
        let data = self.data.lock().unwrap();
        Ok(data.get(key).cloned())
    }

    pub fn delete(&self, key: &str) -> Result<(), String> {
        let mut data = self.data.lock().unwrap();
        data.remove(key);
        Ok(())
    }

    pub fn exists(&self, key: &str) -> Result<bool, String> {
        let data = self.data.lock().unwrap();
        Ok(data.contains_key(key))
    }

    pub fn flushall(&self) -> Result<(), String> {
        let mut data = self.data.lock().unwrap();
        data.clear();
        Ok(())
    }
}

impl Default for MockRedisClient {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

/// Test configuration
pub struct TestConfig {
    pub database_url: String,
    pub redis_url: String,
    pub jwt_secret: String,
}

impl Default for TestConfig {
    fn default() -> Self {
        Self {
            database_url: TEST_DATABASE_URL.to_string(),
            redis_url: "redis://localhost:6379".to_string(),
            jwt_secret: "test-secret-key".to_string(),
        }
    }
}
