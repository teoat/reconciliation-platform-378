//! Test utilities and fixtures for the Reconciliation Backend
//! 
//! This module provides test utilities, mock data, and helper functions
//! for comprehensive testing of the backend services.

use uuid::Uuid;
use chrono::Utc;
use serde_json::json;

use crate::models::{
    User, NewUser, Project, NewProject, DataSource, NewDataSource,
    ReconciliationJob, NewReconciliationJob, UserRole, ProjectStatus,
};

/// Test database configuration
pub const TEST_DATABASE_URL: &str = "postgresql://test_user:test_pass@localhost:5432/reconciliation_test";

/// Test user data
pub struct TestUser {
    pub id: Uuid,
    pub email: String,
    pub password: String,
    pub first_name: String,
    pub last_name: String,
    pub role: UserRole,
}

impl TestUser {
    pub fn new() -> Self {
        Self {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            password: "TestPassword123!".to_string(),
            first_name: "Test".to_string(),
            last_name: "User".to_string(),
            role: UserRole::User,
        }
    }
    
    pub fn admin() -> Self {
        Self {
            id: Uuid::new_v4(),
            email: "admin@example.com".to_string(),
            password: "AdminPassword123!".to_string(),
            first_name: "Admin".to_string(),
            last_name: "User".to_string(),
            role: UserRole::Admin,
        }
    }
    
    pub fn manager() -> Self {
        Self {
            id: Uuid::new_v4(),
            email: "manager@example.com".to_string(),
            password: "ManagerPassword123!".to_string(),
            first_name: "Manager".to_string(),
            last_name: "User".to_string(),
            role: UserRole::Manager,
        }
    }
    
    pub fn to_new_user(&self, password_hash: String) -> NewUser {
        NewUser {
            id: self.id,
            email: self.email.clone(),
            password_hash,
            first_name: self.first_name.clone(),
            last_name: self.last_name.clone(),
            role: self.role.to_string(),
            is_active: true,
        }
    }
}

/// Test project data
pub struct TestProject {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub owner_id: Uuid,
    pub status: ProjectStatus,
}

impl TestProject {
    pub fn new(owner_id: Uuid) -> Self {
        Self {
            id: Uuid::new_v4(),
            name: "Test Project".to_string(),
            description: Some("A test project for unit testing".to_string()),
            owner_id,
            status: ProjectStatus::Active,
        }
    }
    
    pub fn to_new_project(&self) -> NewProject {
        NewProject {
            id: self.id,
            name: self.name.clone(),
            description: self.description.clone(),
            owner_id: self.owner_id,
            status: self.status.to_string(),
            settings: None,
        }
    }
}

/// Test data source data
pub struct TestDataSource {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub source_type: String,
    pub file_path: Option<String>,
    pub file_size: Option<i64>,
    pub file_hash: Option<String>,
}

impl TestDataSource {
    pub fn new(project_id: Uuid) -> Self {
        Self {
            id: Uuid::new_v4(),
            project_id,
            name: "Test Data Source".to_string(),
            source_type: "csv".to_string(),
            file_path: Some("/tmp/test_file.csv".to_string()),
            file_size: Some(1024),
            file_hash: Some("test_hash_123".to_string()),
        }
    }
    
    pub fn to_new_data_source(&self) -> NewDataSource {
        NewDataSource {
            id: self.id,
            project_id: self.project_id,
            name: self.name.clone(),
            source_type: self.source_type.clone(),
            file_path: self.file_path.clone(),
            file_size: self.file_size,
            file_hash: self.file_hash.clone(),
            schema: None,
            status: "uploaded".to_string(),
        }
    }
}

/// Test reconciliation job data
pub struct TestReconciliationJob {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub confidence_threshold: f64,
}

impl TestReconciliationJob {
    pub fn new(project_id: Uuid) -> Self {
        Self {
            id: Uuid::new_v4(),
            project_id,
            name: "Test Reconciliation Job".to_string(),
            description: Some("A test reconciliation job".to_string()),
            confidence_threshold: 0.8,
        }
    }
    
    pub fn to_new_reconciliation_job(&self) -> NewReconciliationJob {
        NewReconciliationJob {
            id: self.id,
            project_id: self.project_id,
            name: self.name.clone(),
            description: self.description.clone(),
            status: "pending".to_string(),
            confidence_threshold: self.confidence_threshold,
            settings: Some(json!({
                "matching_rules": [
                    {
                        "field_a": "name",
                        "field_b": "name",
                        "rule_type": "exact",
                        "weight": 1.0,
                        "exact_match": true
                    }
                ]
            })),
        }
    }
}

/// Test CSV data
pub fn get_test_csv_data() -> &'static str {
    r#"name,email,phone,address
John Doe,john@example.com,555-1234,123 Main St
Jane Smith,jane@example.com,555-5678,456 Oak Ave
Bob Johnson,bob@example.com,555-9012,789 Pine Rd"#
}

/// Test JSON data
pub fn get_test_json_data() -> serde_json::Value {
    json!([
        {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "555-1234",
            "address": "123 Main St"
        },
        {
            "name": "Jane Smith",
            "email": "jane@example.com",
            "phone": "555-5678",
            "address": "456 Oak Ave"
        },
        {
            "name": "Bob Johnson",
            "email": "bob@example.com",
            "phone": "555-9012",
            "address": "789 Pine Rd"
        }
    ])
}

/// Test JWT token data
pub struct TestJwtData {
    pub user_id: Uuid,
    pub email: String,
    pub role: String,
}

impl TestJwtData {
    pub fn new() -> Self {
        Self {
            user_id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            role: "user".to_string(),
        }
    }
    
    pub fn admin() -> Self {
        Self {
            user_id: Uuid::new_v4(),
            email: "admin@example.com".to_string(),
            role: "admin".to_string(),
        }
    }
}

/// Database test utilities
pub mod database {
    use super::*;
    use crate::database::Database;
    use diesel::prelude::*;
    use crate::models::schema::users;
    use crate::models::schema::projects::{projects, data_sources, reconciliation_jobs};
    
    /// Create a test database connection
    pub async fn create_test_db() -> Database {
        Database::new(TEST_DATABASE_URL)
            .await
            .unwrap()
    }
    
    /// Setup test database (alias for create_test_db for backward compatibility)
    pub async fn setup_test_database() -> (Database, ()) {
        let db = create_test_db().await;
        (db, ())
    }
    
    /// Clean up test data
    pub async fn cleanup_test_data(db: &Database) -> Result<(), Box<dyn std::error::Error>> {
        let mut conn = db.get_connection()?;
        
        // Delete in reverse order of dependencies
        diesel::delete(reconciliation_jobs::table).execute(&mut conn)?;
        diesel::delete(data_sources::table).execute(&mut conn)?;
        diesel::delete(projects::table).execute(&mut conn)?;
        diesel::delete(users::table).execute(&mut conn)?;
        
        Ok(())
    }
    
    /// Setup test data
    pub async fn setup_test_data(db: &Database) -> Result<TestData, Box<dyn std::error::Error>> {
        let mut conn = db.get_connection()?;
        
        // Create test users
        let test_user = TestUser::new();
        let admin_user = TestUser::admin();
        
        let user_password_hash = "hashed_password_user";
        let admin_password_hash = "hashed_password_admin";
        
        diesel::insert_into(users::table)
            .values(&test_user.to_new_user(user_password_hash.to_string()))
            .execute(&mut conn)?;
        
        diesel::insert_into(users::table)
            .values(&admin_user.to_new_user(admin_password_hash.to_string()))
            .execute(&mut conn)?;
        
        // Create test projects
        let test_project = TestProject::new(test_user.id);
        let admin_project = TestProject::new(admin_user.id);
        
        diesel::insert_into(projects::table)
            .values(&test_project.to_new_project())
            .execute(&mut conn)?;
        
        diesel::insert_into(projects::table)
            .values(&admin_project.to_new_project())
            .execute(&mut conn)?;
        
        // Create test data sources
        let test_data_source = TestDataSource::new(test_project.id);
        let admin_data_source = TestDataSource::new(admin_project.id);
        
        diesel::insert_into(data_sources::table)
            .values(&test_data_source.to_new_data_source())
            .execute(&mut conn)?;
        
        diesel::insert_into(data_sources::table)
            .values(&admin_data_source.to_new_data_source())
            .execute(&mut conn)?;
        
        // Create test reconciliation jobs
        let test_job = TestReconciliationJob::new(test_project.id);
        let admin_job = TestReconciliationJob::new(admin_project.id);
        
        diesel::insert_into(reconciliation_jobs::table)
            .values(&test_job.to_new_reconciliation_job())
            .execute(&mut conn)?;
        
        diesel::insert_into(reconciliation_jobs::table)
            .values(&admin_job.to_new_reconciliation_job())
            .execute(&mut conn)?;
        
        Ok(TestData {
            users: vec![test_user, admin_user],
            projects: vec![test_project, admin_project],
            data_sources: vec![test_data_source, admin_data_source],
            reconciliation_jobs: vec![test_job, admin_job],
        })
    }
}

/// Test data container
pub struct TestData {
    pub users: Vec<TestUser>,
    pub projects: Vec<TestProject>,
    pub data_sources: Vec<TestDataSource>,
    pub reconciliation_jobs: Vec<TestReconciliationJob>,
}

/// HTTP test utilities
pub mod http {
    use actix_web::{test, web, App};
    use serde_json::json;
    
    use crate::handlers::configure_routes;
    use crate::config::Config;
    use crate::database::Database;
    
    /// Create test app
    pub async fn create_test_app() -> Result<App, Box<dyn std::error::Error>> {
        let config = Config::from_env().map_err(|e| {
            format!("Failed to load test config: {}", e)
        })?;
        let db = Database::new(&config.database_url)
            .await
            .map_err(|e| format!("Failed to create test database: {}", e))?;
        
        App::new()
            .app_data(web::Data::new(db))
            .app_data(web::Data::new(config))
            .configure(configure_routes)
    }
    
    /// Create test request (simplified for unit tests)
    pub fn create_test_request(method: &str, uri: &str) -> test::TestRequest {
        test::TestRequest::with_uri(uri).method(method)
    }
    
    /// Create authenticated test request (simplified for unit tests)
    pub fn create_authenticated_request(method: &str, uri: &str, token: &str) -> test::TestRequest {
        test::TestRequest::with_uri(uri)
            .method(method)
            .insert_header(("Authorization", format!("Bearer {}", token)))
    }
    
    /// Assert response status
    pub fn assert_status(response: &mut actix_web::dev::ServiceResponse, expected_status: u16) {
        assert_eq!(response.status().as_u16(), expected_status);
    }
    
    /// Assert JSON response
    pub async fn assert_json_response<T: serde::de::DeserializeOwned>(
        response: &mut actix_web::dev::ServiceResponse,
    ) -> T {
        let body = test::read_body(response).await;
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        serde_json::from_str(&body_str).unwrap()
    }
}

/// Performance test utilities
pub mod performance {
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
                serde_json::json!({
                    "id": i,
                    "name": format!("Test User {}", i),
                    "email": format!("user{}@example.com", i),
                    "phone": format!("555-{:04}", i),
                    "address": format!("{} Test St", i)
                })
            })
            .collect()
    }
}

/// Mock utilities
pub mod mock {
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
}
