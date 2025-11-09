//! Comprehensive Testing Suite
//! 
//! This module provides comprehensive testing utilities, fixtures, and helpers
//! for unit tests, integration tests, and end-to-end tests.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use actix_web::{test, web, App, HttpRequest, HttpResponse};
use actix_web::middleware::Logger;
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool};

use crate::database::Database;
use crate::services::{
    AuthService, UserService, ProjectService, ReconciliationService,
    FileService, AnalyticsService, SecurityService
};
use crate::middleware::{
    SecurityMiddleware, SecurityMiddlewareConfig,
    AuthMiddleware, AuthMiddlewareConfig,
    PerformanceMiddleware, PerformanceMonitoringConfig,
    LoggingMiddleware, LoggingConfig
};

/// Test configuration
#[derive(Debug, Clone)]
pub struct TestConfig {
    pub database_url: String,
    pub test_data_path: String,
    pub mock_external_services: bool,
    pub enable_logging: bool,
    pub test_timeout: Duration,
}

impl Default for TestConfig {
    fn default() -> Self {
        Self {
            database_url: "postgresql://test_user:test_pass@localhost:5432/test_db".to_string(),
            test_data_path: "./test_data".to_string(),
            mock_external_services: true,
            enable_logging: false,
            test_timeout: Duration::from_secs(30),
        }
    }
}

/// Test database manager
pub struct TestDatabaseManager {
    pub pool: Pool<ConnectionManager<PgConnection>>,
    pub test_db_name: String,
}

impl TestDatabaseManager {
    pub fn new(database_url: &str) -> Self {
        let manager = ConnectionManager::<PgConnection>::new(database_url);
        let pool = Pool::builder()
            .max_size(10)
            .build(manager)
            .expect("Failed to create test database pool");
        
        Self {
            pool,
            test_db_name: "test_db".to_string(),
        }
    }
    
    /// Create test database
    pub async fn create_test_database(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Create test database if it doesn't exist
        // This would be implemented based on your database setup
        Ok(())
    }
    
    /// Drop test database
    pub async fn drop_test_database(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Drop test database
        // This would be implemented based on your database setup
        Ok(())
    }
    
    /// Run migrations
    pub async fn run_migrations(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Run database migrations
        // This would be implemented based on your migration system
        Ok(())
    }
    
    /// Clean test data
    pub async fn clean_test_data(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Clean all test data
        // This would be implemented based on your database schema
        Ok(())
    }
}

/// Test fixtures
pub struct TestFixtures {
    pub users: Vec<TestUser>,
    pub projects: Vec<TestProject>,
    pub data_sources: Vec<TestDataSource>,
    pub reconciliation_jobs: Vec<TestReconciliationJob>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestUser {
    pub id: String,
    pub email: String,
    pub password: String,
    pub role: String,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestProject {
    pub id: String,
    pub name: String,
    pub description: String,
    pub owner_id: String,
    pub settings: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestDataSource {
    pub id: String,
    pub name: String,
    pub source_type: String,
    pub project_id: String,
    pub file_path: Option<String>,
    pub schema: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestReconciliationJob {
    pub id: String,
    pub name: String,
    pub project_id: String,
    pub status: String,
    pub settings: HashMap<String, serde_json::Value>,
}

impl TestFixtures {
    pub fn new() -> Self {
        Self {
            users: vec![
                TestUser {
                    id: Uuid::new_v4().to_string(),
                    email: "admin@test.com".to_string(),
                    password: "admin123".to_string(),
                    role: "admin".to_string(),
                    is_active: true,
                },
                TestUser {
                    id: Uuid::new_v4().to_string(),
                    email: "user@test.com".to_string(),
                    password: "user123".to_string(),
                    role: "user".to_string(),
                    is_active: true,
                },
            ],
            projects: vec![
                TestProject {
                    id: Uuid::new_v4().to_string(),
                    name: "Test Project 1".to_string(),
                    description: "A test project".to_string(),
                    owner_id: "admin_id".to_string(),
                    settings: HashMap::new(),
                },
            ],
            data_sources: vec![
                TestDataSource {
                    id: Uuid::new_v4().to_string(),
                    name: "Test Data Source".to_string(),
                    source_type: "csv".to_string(),
                    project_id: "project_id".to_string(),
                    file_path: Some("./test_data/sample.csv".to_string()),
                    schema: HashMap::new(),
                },
            ],
            reconciliation_jobs: vec![
                TestReconciliationJob {
                    id: Uuid::new_v4().to_string(),
                    name: "Test Reconciliation Job".to_string(),
                    project_id: "project_id".to_string(),
                    status: "pending".to_string(),
                    settings: HashMap::new(),
                },
            ],
        }
    }
}

/// Test service factory
pub struct TestServiceFactory {
    pub config: TestConfig,
    pub fixtures: TestFixtures,
}

impl TestServiceFactory {
    pub fn new(config: TestConfig) -> Self {
        Self {
            config,
            fixtures: TestFixtures::new(),
        }
    }
    
    /// Create test auth service
    pub fn create_auth_service(&self) -> AuthService {
        AuthService::new(
            "test_jwt_secret".to_string(),
            3600
        )
    }
    
    /// Create test user service
    pub fn create_user_service(&self) -> UserService {
        UserService::new(Database::new(&self.config.database_url).unwrap())
    }
    
    /// Create test project service
    pub fn create_project_service(&self) -> ProjectService {
        ProjectService::new(Database::new(&self.config.database_url).unwrap())
    }
    
    /// Create test reconciliation service
    pub fn create_reconciliation_service(&self) -> ReconciliationService {
        ReconciliationService::new(Database::new(&self.config.database_url).unwrap())
    }
    
    /// Create test file service
    pub fn create_file_service(&self) -> FileService {
        FileService::new(
            Database::new(&self.config.database_url).unwrap(),
            "./test_uploads".to_string()
        )
    }
    
    /// Create test analytics service
    pub fn create_analytics_service(&self) -> AnalyticsService {
        AnalyticsService::new(Database::new(&self.config.database_url).unwrap())
    }
    
    /// Create test security service
    pub fn create_security_service(&self) -> SecurityService {
        SecurityService::new(crate::services::security::SecurityConfig::default())
    }
}

/// Test client for API testing
pub struct TestClient {
    pub app: actix_web::test::TestApp,
    pub auth_token: Option<String>,
    pub user_id: Option<String>,
}

impl TestClient {
    pub fn new() -> Self {
        let app = test::init_service(App::new().configure(|cfg| {
            // Configure test app
        })).await;
        
        Self {
            app,
            auth_token: None,
            user_id: None,
        }
    }
    
    /// Authenticate as a test user
    pub async fn authenticate_as(&mut self, email: &str, password: &str) -> Result<(), Box<dyn std::error::Error>> {
        let login_request = serde_json::json!({
            "email": email,
            "password": password
        });
        
        let req = test::TestRequest::post()
            .uri("/api/auth/login")
            .set_json(&login_request)
            .to_request();
        
        let resp = test::call_service(&self.app, req).await;
        assert!(resp.status().is_success());
        
        let body: serde_json::Value = test::read_body_json(resp).await;
        self.auth_token = body["token"].as_str().map(|s| s.to_string());
        self.user_id = body["user"]["id"].as_str().map(|s| s.to_string());
        
        Ok(())
    }
    
    /// Make authenticated request
    pub async fn authenticated_request(&self, method: &str, uri: &str) -> test::TestRequest {
        let mut req = match method {
            "GET" => test::TestRequest::get().uri(uri),
            "POST" => test::TestRequest::post().uri(uri),
            "PUT" => test::TestRequest::put().uri(uri),
            "DELETE" => test::TestRequest::delete().uri(uri),
            _ => panic!("Unsupported HTTP method: {}", method),
        };
        
        if let Some(token) = &self.auth_token {
            req = req.insert_header(("Authorization", format!("Bearer {}", token)));
        }
        
        req.to_request()
    }
    
    /// Create test project
    pub async fn create_project(&self, name: &str, description: &str) -> Result<String, Box<dyn std::error::Error>> {
        let project_data = serde_json::json!({
            "name": name,
            "description": description
        });
        
        let req = self.authenticated_request("POST", "/api/projects")
            .set_json(&project_data);
        
        let resp = test::call_service(&self.app, req).await;
        assert!(resp.status().is_success());
        
        let body: serde_json::Value = test::read_body_json(resp).await;
        Ok(body["id"].as_str().unwrap().to_string())
    }
    
    /// Upload test file
    pub async fn upload_file(&self, project_id: &str, file_path: &str) -> Result<String, Box<dyn std::error::Error>> {
        // This would implement file upload testing
        Ok(Uuid::new_v4().to_string())
    }
    
    /// Create reconciliation job
    pub async fn create_reconciliation_job(&self, project_id: &str, name: &str) -> Result<String, Box<dyn std::error::Error>> {
        let job_data = serde_json::json!({
            "name": name,
            "project_id": project_id,
            "description": "Test reconciliation job"
        });
        
        let req = self.authenticated_request("POST", "/api/reconciliation/jobs")
            .set_json(&job_data);
        
        let resp = test::call_service(&self.app, req).await;
        assert!(resp.status().is_success());
        
        let body: serde_json::Value = test::read_body_json(resp).await;
        Ok(body["id"].as_str().unwrap().to_string())
    }
}

/// Performance testing utilities
pub struct PerformanceTestUtils {
    pub test_scenarios: Vec<PerformanceTestScenario>,
}

#[derive(Debug, Clone)]
pub struct PerformanceTestScenario {
    pub name: String,
    pub description: String,
    pub concurrent_users: u32,
    pub duration_seconds: u64,
    pub requests_per_second: u32,
    pub endpoints: Vec<String>,
}

impl PerformanceTestUtils {
    pub fn new() -> Self {
        Self {
            test_scenarios: vec![
                PerformanceTestScenario {
                    name: "Light Load".to_string(),
                    description: "Test with light load".to_string(),
                    concurrent_users: 10,
                    duration_seconds: 60,
                    requests_per_second: 10,
                    endpoints: vec!["/api/health".to_string(), "/api/projects".to_string()],
                },
                PerformanceTestScenario {
                    name: "Medium Load".to_string(),
                    description: "Test with medium load".to_string(),
                    concurrent_users: 50,
                    duration_seconds: 300,
                    requests_per_second: 50,
                    endpoints: vec!["/api/health".to_string(), "/api/projects".to_string(), "/api/reconciliation/jobs".to_string()],
                },
                PerformanceTestScenario {
                    name: "Heavy Load".to_string(),
                    description: "Test with heavy load".to_string(),
                    concurrent_users: 100,
                    duration_seconds: 600,
                    requests_per_second: 100,
                    endpoints: vec!["/api/health".to_string(), "/api/projects".to_string(), "/api/reconciliation/jobs".to_string(), "/api/analytics".to_string()],
                },
            ],
        }
    }
    
    /// Run performance test scenario
    pub async fn run_scenario(&self, scenario: &PerformanceTestScenario, client: &TestClient) -> PerformanceTestResults {
        let start_time = SystemTime::now();
        let mut total_requests = 0;
        let mut successful_requests = 0;
        let mut failed_requests = 0;
        let mut response_times = Vec::new();
        
        // Simulate concurrent users
        let mut handles = Vec::new();
        
        for _ in 0..scenario.concurrent_users {
            let client_clone = client.clone();
            let endpoints = scenario.endpoints.clone();
            let duration = scenario.duration_seconds;
            let rps = scenario.requests_per_second;
            
            let handle = tokio::spawn(async move {
                let mut user_requests = 0;
                let mut user_successful = 0;
                let mut user_failed = 0;
                let mut user_response_times = Vec::new();
                
                let start = SystemTime::now();
                while start.elapsed().unwrap().as_secs() < duration {
                    for endpoint in &endpoints {
                        let request_start = SystemTime::now();
                        
                        match client_clone.authenticated_request("GET", endpoint).await {
                            Ok(resp) => {
                                if resp.status().is_success() {
                                    user_successful += 1;
                                } else {
                                    user_failed += 1;
                                }
                                user_response_times.push(request_start.elapsed().unwrap().as_millis() as u64);
                            }
                            Err(_) => {
                                user_failed += 1;
                            }
                        }
                        
                        user_requests += 1;
                        
                        // Rate limiting
                        tokio::time::sleep(Duration::from_millis(1000 / rps as u64)).await;
                    }
                }
                
                (user_requests, user_successful, user_failed, user_response_times)
            });
            
            handles.push(handle);
        }
        
        // Collect results
        for handle in handles {
            let (requests, successful, failed, times) = handle.await.unwrap();
            total_requests += requests;
            successful_requests += successful;
            failed_requests += failed;
            response_times.extend(times);
        }
        
        let end_time = SystemTime::now();
        let duration = end_time.duration_since(start_time).unwrap();
        
        PerformanceTestResults {
            scenario_name: scenario.name.clone(),
            duration_seconds: duration.as_secs(),
            total_requests,
            successful_requests,
            failed_requests,
            requests_per_second: total_requests as f64 / duration.as_secs() as f64,
            average_response_time_ms: response_times.iter().sum::<u64>() as f64 / response_times.len() as f64,
            min_response_time_ms: response_times.iter().min().copied().unwrap_or(0),
            max_response_time_ms: response_times.iter().max().copied().unwrap_or(0),
            error_rate: failed_requests as f64 / total_requests as f64 * 100.0,
        }
    }
}

#[derive(Debug, Clone)]
pub struct PerformanceTestResults {
    pub scenario_name: String,
    pub duration_seconds: u64,
    pub total_requests: u32,
    pub successful_requests: u32,
    pub failed_requests: u32,
    pub requests_per_second: f64,
    pub average_response_time_ms: f64,
    pub min_response_time_ms: u64,
    pub max_response_time_ms: u64,
    pub error_rate: f64,
}

/// Mock external services
pub struct MockExternalServices {
    pub mock_services: Arc<RwLock<HashMap<String, MockService>>>,
}

#[derive(Debug, Clone)]
pub struct MockService {
    pub name: String,
    pub base_url: String,
    pub responses: HashMap<String, MockResponse>,
    pub call_count: u32,
    pub last_called: Option<u64>,
}

#[derive(Debug, Clone)]
pub struct MockResponse {
    pub status_code: u16,
    pub body: String,
    pub headers: HashMap<String, String>,
    pub delay_ms: u64,
}

impl MockExternalServices {
    pub fn new() -> Self {
        Self {
            mock_services: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    /// Add mock service
    pub async fn add_mock_service(&self, name: String, base_url: String) {
        let mut services = self.mock_services.write().await;
        services.insert(name.clone(), MockService {
            name,
            base_url,
            responses: HashMap::new(),
            call_count: 0,
            last_called: None,
        });
    }
    
    /// Add mock response
    pub async fn add_mock_response(&self, service_name: &str, endpoint: &str, response: MockResponse) {
        let mut services = self.mock_services.write().await;
        if let Some(service) = services.get_mut(service_name) {
            service.responses.insert(endpoint.to_string(), response);
        }
    }
    
    /// Get mock service
    pub async fn get_mock_service(&self, name: &str) -> Option<MockService> {
        let services = self.mock_services.read().await;
        services.get(name).cloned()
    }
    
    /// Record service call
    pub async fn record_call(&self, service_name: &str) {
        let mut services = self.mock_services.write().await;
        if let Some(service) = services.get_mut(service_name) {
            service.call_count += 1;
            service.last_called = Some(SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs());
        }
    }
}

/// Test assertions
pub mod assertions {
    use super::*;
    
    /// Assert API response
    pub fn assert_api_response(resp: &actix_web::test::TestResponse, expected_status: u16) {
        assert_eq!(resp.status().as_u16(), expected_status);
    }
    
    /// Assert JSON response
    pub fn assert_json_response<T>(resp: &actix_web::test::TestResponse, expected_data: &T)
    where
        T: serde::Serialize + PartialEq,
    {
        let body: T = test::read_body_json(resp);
        assert_eq!(body, *expected_data);
    }
    
    /// Assert performance results
    pub fn assert_performance_results(results: &PerformanceTestResults, max_response_time_ms: u64, max_error_rate: f64) {
        assert!(results.average_response_time_ms <= max_response_time_ms as f64,
                "Average response time {}ms exceeds maximum {}ms", 
                results.average_response_time_ms, max_response_time_ms);
        
        assert!(results.error_rate <= max_error_rate,
                "Error rate {}% exceeds maximum {}%", 
                results.error_rate, max_error_rate);
    }
    
    /// Assert database state
    pub async fn assert_database_state<F>(db: &Database, assertion: F) -> Result<(), Box<dyn std::error::Error>>
    where
        F: FnOnce(&Database) -> Result<(), Box<dyn std::error::Error>>,
    {
        assertion(db)
    }
}

/// Test utilities
pub mod test_utils {
    use super::*;
    
    /// Generate test data
    pub fn generate_test_data(count: usize) -> Vec<HashMap<String, serde_json::Value>> {
        (0..count).map(|i| {
            let mut data = HashMap::new();
            data.insert("id".to_string(), serde_json::Value::String(Uuid::new_v4().to_string()));
            data.insert("name".to_string(), serde_json::Value::String(format!("Test Item {}", i)));
            data.insert("value".to_string(), serde_json::Value::Number(serde_json::Number::from(i)));
            data
        }).collect()
    }
    
    /// Create test file
    pub async fn create_test_file(path: &str, content: &str) -> Result<(), Box<dyn std::error::Error>> {
        tokio::fs::write(path, content).await?;
        Ok(())
    }
    
    /// Clean test files
    pub async fn clean_test_files(directory: &str) -> Result<(), Box<dyn std::error::Error>> {
        let mut entries = tokio::fs::read_dir(directory).await?;
        while let Some(entry) = entries.next_entry().await? {
            if entry.file_type().await?.is_file() {
                tokio::fs::remove_file(entry.path()).await?;
            }
        }
        Ok(())
    }
    
    /// Wait for condition
    pub async fn wait_for_condition<F>(condition: F, timeout: Duration) -> Result<(), Box<dyn std::error::Error>>
    where
        F: Fn() -> bool,
    {
        let start = SystemTime::now();
        while start.elapsed().unwrap() < timeout {
            if condition() {
                return Ok(());
            }
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
        Err("Condition not met within timeout".into())
    }
}
