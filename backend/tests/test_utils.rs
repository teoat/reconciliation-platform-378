//! Test utilities for integration tests
//! Simplified version without heavy service dependencies

use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;

// Test configuration
pub const TEST_DATABASE_URL: &str = "postgresql://test_user:test_pass@localhost:5432/reconciliation_test";

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
