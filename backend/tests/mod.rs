//! Comprehensive Testing Suite
//!
//! This module provides a complete testing framework for the Reconciliation Backend
//! including unit tests, integration tests, and end-to-end tests.

mod e2e_tests;
mod integration_tests;
mod service_tests;
mod simple_tests;
mod test_utils;
mod unit_tests;

// Re-export test utilities for use in other test modules
pub use test_utils::*;

/// Test configuration for different environments
pub struct TestEnvironment {
    pub database_url: String,
    pub test_data_path: String,
    pub mock_services: bool,
    pub enable_logging: bool,
    pub test_timeout: Duration,
}

impl TestEnvironment {
    pub fn development() -> Self {
        Self {
            database_url: "postgresql://test_user:test_pass@localhost:5432/test_db".to_string(),
            test_data_path: "./test_data".to_string(),
            mock_services: true,
            enable_logging: false,
            test_timeout: Duration::from_secs(30),
        }
    }

    pub fn ci() -> Self {
        Self {
            database_url: std::env::var("TEST_DATABASE_URL").unwrap_or_else(|_| {
                "postgresql://test_user:test_pass@localhost:5432/test_db".to_string()
            }),
            test_data_path: "./test_data".to_string(),
            mock_services: true,
            enable_logging: false,
            test_timeout: Duration::from_secs(60),
        }
    }

    pub fn production_like() -> Self {
        Self {
            database_url: "postgresql://test_user:test_pass@localhost:5432/test_db".to_string(),
            test_data_path: "./test_data".to_string(),
            mock_services: false,
            enable_logging: true,
            test_timeout: Duration::from_secs(120),
        }
    }
}

/// Test runner for running all tests
pub struct TestRunner {
    pub environment: TestEnvironment,
    pub test_results: Arc<RwLock<Vec<TestResult>>>,
}

#[derive(Debug, Clone)]
pub struct TestResult {
    pub test_name: String,
    pub test_type: TestType,
    pub status: TestStatus,
    pub duration: Duration,
    pub error_message: Option<String>,
    pub timestamp: SystemTime,
}

#[derive(Debug, Clone)]
pub enum TestType {
    Unit,
    Integration,
    EndToEnd,
    Performance,
}

#[derive(Debug, Clone)]
pub enum TestStatus {
    Passed,
    Failed,
    Skipped,
    Timeout,
}

impl TestRunner {
    pub fn new(environment: TestEnvironment) -> Self {
        Self {
            environment,
            test_results: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Run all tests
    pub async fn run_all_tests(&self) -> TestSummary {
        let mut summary = TestSummary::new();

        // Run unit tests
        summary.merge(self.run_unit_tests().await);

        // Run integration tests
        summary.merge(self.run_integration_tests().await);

        // Run end-to-end tests
        summary.merge(self.run_e2e_tests().await);

        // Run performance tests
        summary.merge(self.run_performance_tests().await);

        summary
    }

    /// Run unit tests
    pub async fn run_unit_tests(&self) -> TestSummary {
        let mut summary = TestSummary::new();

        // This would run all unit tests
        // In a real implementation, you'd use a test runner like cargo test

        summary
    }

    /// Run integration tests
    pub async fn run_integration_tests(&self) -> TestSummary {
        let mut summary = TestSummary::new();

        // This would run all integration tests

        summary
    }

    /// Run end-to-end tests
    pub async fn run_e2e_tests(&self) -> TestSummary {
        let mut summary = TestSummary::new();

        // This would run all end-to-end tests

        summary
    }

    /// Run performance tests
    pub async fn run_performance_tests(&self) -> TestSummary {
        let mut summary = TestSummary::new();

        // This would run all performance tests

        summary
    }

    /// Record test result
    pub async fn record_test_result(&self, result: TestResult) {
        let mut results = self.test_results.write().await;
        results.push(result);
    }

    /// Get test results
    pub async fn get_test_results(&self) -> Vec<TestResult> {
        let results = self.test_results.read().await;
        results.clone()
    }
}

/// Test summary
#[derive(Debug, Clone)]
pub struct TestSummary {
    pub total_tests: u32,
    pub passed_tests: u32,
    pub failed_tests: u32,
    pub skipped_tests: u32,
    pub timeout_tests: u32,
    pub total_duration: Duration,
    pub test_results: Vec<TestResult>,
}

impl TestSummary {
    pub fn new() -> Self {
        Self {
            total_tests: 0,
            passed_tests: 0,
            failed_tests: 0,
            skipped_tests: 0,
            timeout_tests: 0,
            total_duration: Duration::from_secs(0),
            test_results: Vec::new(),
        }
    }

    pub fn merge(&mut self, other: TestSummary) {
        self.total_tests += other.total_tests;
        self.passed_tests += other.passed_tests;
        self.failed_tests += other.failed_tests;
        self.skipped_tests += other.skipped_tests;
        self.timeout_tests += other.timeout_tests;
        self.total_duration += other.total_duration;
        self.test_results.extend(other.test_results);
    }

    pub fn success_rate(&self) -> f64 {
        if self.total_tests == 0 {
            0.0
        } else {
            self.passed_tests as f64 / self.total_tests as f64 * 100.0
        }
    }

    pub fn print_summary(&self) {
        println!("Test Summary:");
        println!("  Total tests: {}", self.total_tests);
        println!("  Passed: {}", self.passed_tests);
        println!("  Failed: {}", self.failed_tests);
        println!("  Skipped: {}", self.skipped_tests);
        println!("  Timeout: {}", self.timeout_tests);
        println!("  Success rate: {:.2}%", self.success_rate());
        println!(
            "  Total duration: {:.2}s",
            self.total_duration.as_secs_f64()
        );

        if self.failed_tests > 0 {
            println!("\nFailed tests:");
            for result in &self.test_results {
                if matches!(result.status, TestStatus::Failed) {
                    println!(
                        "  - {}: {}",
                        result.test_name,
                        result.error_message.as_deref().unwrap_or("Unknown error")
                    );
                }
            }
        }
    }
}

/// Test fixtures for common test data
pub struct TestFixtures {
    pub users: Vec<TestUser>,
    pub projects: Vec<TestProject>,
    pub data_sources: Vec<TestDataSource>,
    pub reconciliation_jobs: Vec<TestReconciliationJob>,
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
                    email: "manager@test.com".to_string(),
                    password: "manager123".to_string(),
                    role: "manager".to_string(),
                    is_active: true,
                },
                TestUser {
                    id: Uuid::new_v4().to_string(),
                    email: "analyst@test.com".to_string(),
                    password: "analyst123".to_string(),
                    role: "analyst".to_string(),
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
                TestProject {
                    id: Uuid::new_v4().to_string(),
                    name: "Test Project 2".to_string(),
                    description: "Another test project".to_string(),
                    owner_id: "manager_id".to_string(),
                    settings: HashMap::new(),
                },
            ],
            data_sources: vec![
                TestDataSource {
                    id: Uuid::new_v4().to_string(),
                    name: "Test Data Source 1".to_string(),
                    source_type: "csv".to_string(),
                    project_id: "project_id".to_string(),
                    file_path: Some("./test_data/source1.csv".to_string()),
                    schema: HashMap::new(),
                },
                TestDataSource {
                    id: Uuid::new_v4().to_string(),
                    name: "Test Data Source 2".to_string(),
                    source_type: "csv".to_string(),
                    project_id: "project_id".to_string(),
                    file_path: Some("./test_data/source2.csv".to_string()),
                    schema: HashMap::new(),
                },
            ],
            reconciliation_jobs: vec![
                TestReconciliationJob {
                    id: Uuid::new_v4().to_string(),
                    name: "Test Reconciliation Job 1".to_string(),
                    project_id: "project_id".to_string(),
                    status: "pending".to_string(),
                    settings: HashMap::new(),
                },
                TestReconciliationJob {
                    id: Uuid::new_v4().to_string(),
                    name: "Test Reconciliation Job 2".to_string(),
                    project_id: "project_id".to_string(),
                    status: "completed".to_string(),
                    settings: HashMap::new(),
                },
            ],
        }
    }
}

/// Test data structures
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

/// Test utilities
pub mod utils {
    use super::*;

    /// Generate test data
    pub fn generate_test_data<T>(count: usize, generator: impl Fn(usize) -> T) -> Vec<T> {
        (0..count).map(generator).collect()
    }

    /// Create test file
    pub async fn create_test_file(
        path: &str,
        content: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
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
    pub async fn wait_for_condition<F>(
        condition: F,
        timeout: Duration,
    ) -> Result<(), Box<dyn std::error::Error>>
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
    pub fn assert_performance_results(
        results: &PerformanceTestResults,
        max_response_time_ms: u64,
        max_error_rate: f64,
    ) {
        assert!(
            results.average_response_time_ms <= max_response_time_ms as f64,
            "Average response time {}ms exceeds maximum {}ms",
            results.average_response_time_ms,
            max_response_time_ms
        );

        assert!(
            results.error_rate <= max_error_rate,
            "Error rate {}% exceeds maximum {}%",
            results.error_rate,
            max_error_rate
        );
    }
}

/// Performance test results
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

/// Main test entry point
pub async fn run_all_tests() -> TestSummary {
    let environment = TestEnvironment::development();
    let test_runner = TestRunner::new(environment);
    test_runner.run_all_tests().await
}

/// Run tests for specific environment
pub async fn run_tests_for_environment(environment: TestEnvironment) -> TestSummary {
    let test_runner = TestRunner::new(environment);
    test_runner.run_all_tests().await
}
