//! Test data management system for the Reconciliation Platform
//! 
//! This module provides comprehensive test data factories, fixtures,
//! and management utilities for all testing scenarios.

use std::collections::HashMap;
use uuid::Uuid;
use chrono::{Utc, Duration};
use serde_json::{json, Value};
use rand::Rng;

use crate::models::{
    User, NewUser, Project, NewProject, DataSource, NewDataSource,
    ReconciliationJob, NewReconciliationJob, UserRole, ProjectStatus,
};

/// Test data factory for generating consistent test data
pub struct TestDataFactory {
    rng: rand::rngs::ThreadRng,
    user_counter: u32,
    project_counter: u32,
    data_source_counter: u32,
    reconciliation_job_counter: u32,
}

impl TestDataFactory {
    pub fn new() -> Self {
        Self {
            rng: rand::thread_rng(),
            user_counter: 0,
            project_counter: 0,
            data_source_counter: 0,
            reconciliation_job_counter: 0,
        }
    }
    
    /// Generate a test user with specified role
    pub fn create_user(&mut self, role: UserRole) -> TestUser {
        self.user_counter += 1;
        
        TestUser {
            id: Uuid::new_v4(),
            email: format!("testuser{}@example.com", self.user_counter),
            password: "TestPassword123!".to_string(),
            first_name: self.generate_first_name(),
            last_name: self.generate_last_name(),
            role,
            is_active: true,
            created_at: Utc::now() - Duration::days(self.rng.gen_range(1..365)),
            updated_at: Utc::now(),
            last_login: Some(Utc::now() - Duration::hours(self.rng.gen_range(1..24))),
        }
    }
    
    /// Generate a test project
    pub fn create_project(&mut self, owner_id: Uuid) -> TestProject {
        self.project_counter += 1;
        
        TestProject {
            id: Uuid::new_v4(),
            name: format!("Test Project {}", self.project_counter),
            description: Some(format!("A test project for testing purposes {}", self.project_counter)),
            owner_id,
            status: self.generate_project_status(),
            settings: Some(json!({
                "auto_reconciliation": true,
                "confidence_threshold": 0.8,
                "notification_enabled": true
            })),
            created_at: Utc::now() - Duration::days(self.rng.gen_range(1..180)),
            updated_at: Utc::now(),
        }
    }
    
    /// Generate a test data source
    pub fn create_data_source(&mut self, project_id: Uuid) -> TestDataSource {
        self.data_source_counter += 1;
        
        TestDataSource {
            id: Uuid::new_v4(),
            project_id,
            name: format!("Test Data Source {}", self.data_source_counter),
            source_type: self.generate_source_type(),
            file_path: Some(format!("/tmp/test_file_{}.csv", self.data_source_counter)),
            file_size: Some(self.rng.gen_range(1024..10485760)), // 1KB to 10MB
            file_hash: Some(format!("hash_{}", self.rng.gen::<u32>())),
            schema: Some(self.generate_schema()),
            status: self.generate_data_source_status(),
            created_at: Utc::now() - Duration::days(self.rng.gen_range(1..30)),
            updated_at: Utc::now(),
        }
    }
    
    /// Generate a test reconciliation job
    pub fn create_reconciliation_job(&mut self, project_id: Uuid) -> TestReconciliationJob {
        self.reconciliation_job_counter += 1;
        
        TestReconciliationJob {
            id: Uuid::new_v4(),
            project_id,
            name: format!("Test Reconciliation Job {}", self.reconciliation_job_counter),
            description: Some(format!("A test reconciliation job for testing purposes {}", self.reconciliation_job_counter)),
            status: self.generate_job_status(),
            confidence_threshold: self.rng.gen_range(0.7..0.95),
            settings: Some(json!({
                "matching_rules": [
                    {
                        "field_a": "name",
                        "field_b": "name",
                        "rule_type": "exact",
                        "weight": 1.0,
                        "exact_match": true
                    },
                    {
                        "field_a": "email",
                        "field_b": "email",
                        "rule_type": "fuzzy",
                        "weight": 0.8,
                        "threshold": 0.9
                    }
                ],
                "auto_process": true,
                "notification_enabled": true
            })),
            created_at: Utc::now() - Duration::days(self.rng.gen_range(1..7)),
            updated_at: Utc::now(),
            started_at: Some(Utc::now() - Duration::hours(self.rng.gen_range(1..12))),
            completed_at: None,
        }
    }
    
    /// Generate test CSV data
    pub fn generate_csv_data(&mut self, record_count: usize) -> String {
        let mut csv_data = String::from("name,email,phone,address,amount,date\n");
        
        for i in 0..record_count {
            let name = self.generate_full_name();
            let email = format!("user{}@example.com", i);
            let phone = format!("555-{:04}", self.rng.gen_range(1000..9999));
            let address = format!("{} {} St", self.rng.gen_range(1..9999), self.generate_street_name());
            let amount = self.rng.gen_range(10.0..1000.0);
            let date = (Utc::now() - Duration::days(self.rng.gen_range(1..365))).format("%Y-%m-%d").to_string();
            
            csv_data.push_str(&format!("{},{},{},{},{:.2},{}\n", name, email, phone, address, amount, date));
        }
        
        csv_data
    }
    
    /// Generate test JSON data
    pub fn generate_json_data(&mut self, record_count: usize) -> Value {
        let mut records = Vec::new();
        
        for i in 0..record_count {
            let record = json!({
                "id": i,
                "name": self.generate_full_name(),
                "email": format!("user{}@example.com", i),
                "phone": format!("555-{:04}", self.rng.gen_range(1000..9999)),
                "address": format!("{} {} St", self.rng.gen_range(1..9999), self.generate_street_name()),
                "amount": self.rng.gen_range(10.0..1000.0),
                "date": (Utc::now() - Duration::days(self.rng.gen_range(1..365))).format("%Y-%m-%d").to_string(),
                "status": self.generate_record_status(),
                "category": self.generate_category(),
                "tags": self.generate_tags(),
            });
            
            records.push(record);
        }
        
        json!(records)
    }
    
    /// Generate test reconciliation results
    pub fn generate_reconciliation_results(&mut self, record_count: usize) -> Vec<TestReconciliationResult> {
        let mut results = Vec::new();
        
        for i in 0..record_count {
            let result = TestReconciliationResult {
                id: Uuid::new_v4(),
                source_record_id: Uuid::new_v4(),
                target_record_id: Uuid::new_v4(),
                confidence_score: self.rng.gen_range(0.0..1.0),
                match_type: self.generate_match_type(),
                status: self.generate_result_status(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            
            results.push(result);
        }
        
        results
    }
    
    /// Generate test analytics data
    pub fn generate_analytics_data(&mut self) -> TestAnalyticsData {
        TestAnalyticsData {
            total_users: self.rng.gen_range(100..1000),
            total_projects: self.rng.gen_range(50..500),
            total_reconciliation_jobs: self.rng.gen_range(200..2000),
            successful_reconciliations: self.rng.gen_range(150..1800),
            failed_reconciliations: self.rng.gen_range(10..100),
            average_confidence_score: self.rng.gen_range(0.7..0.95),
            total_data_processed: self.rng.gen_range(1000000..10000000),
            average_processing_time: self.rng.gen_range(5.0..30.0),
            last_updated: Utc::now(),
        }
    }
    
    // Helper methods for generating random data
    
    fn generate_first_name(&mut self) -> String {
        let first_names = vec![
            "John", "Jane", "Bob", "Alice", "Charlie", "Diana", "Eve", "Frank",
            "Grace", "Henry", "Ivy", "Jack", "Kate", "Liam", "Mia", "Noah",
            "Olivia", "Paul", "Quinn", "Ruby", "Sam", "Tina", "Uma", "Victor",
            "Wendy", "Xavier", "Yara", "Zoe"
        ];
        
        first_names[self.rng.gen_range(0..first_names.len())].to_string()
    }
    
    fn generate_last_name(&mut self) -> String {
        let last_names = vec![
            "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
            "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
            "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
            "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
            "Ramirez", "Lewis", "Robinson"
        ];
        
        last_names[self.rng.gen_range(0..last_names.len())].to_string()
    }
    
    fn generate_full_name(&mut self) -> String {
        format!("{} {}", self.generate_first_name(), self.generate_last_name())
    }
    
    fn generate_street_name(&mut self) -> String {
        let street_names = vec![
            "Main", "Oak", "Pine", "Maple", "Cedar", "Elm", "Ash", "Birch",
            "Cherry", "Dogwood", "Fir", "Hickory", "Juniper", "Linden", "Magnolia",
            "Poplar", "Redwood", "Spruce", "Sycamore", "Walnut", "Willow", "Yew"
        ];
        
        street_names[self.rng.gen_range(0..street_names.len())].to_string()
    }
    
    fn generate_project_status(&mut self) -> ProjectStatus {
        let statuses = vec![ProjectStatus::Active, ProjectStatus::Inactive, ProjectStatus::Archived];
        statuses[self.rng.gen_range(0..statuses.len())]
    }
    
    fn generate_source_type(&mut self) -> String {
        let types = vec!["csv", "json", "xlsx", "txt"];
        types[self.rng.gen_range(0..types.len())].to_string()
    }
    
    fn generate_data_source_status(&mut self) -> String {
        let statuses = vec!["uploaded", "processing", "processed", "error"];
        statuses[self.rng.gen_range(0..statuses.len())].to_string()
    }
    
    fn generate_job_status(&mut self) -> String {
        let statuses = vec!["pending", "running", "completed", "failed", "cancelled"];
        statuses[self.rng.gen_range(0..statuses.len())].to_string()
    }
    
    fn generate_record_status(&mut self) -> String {
        let statuses = vec!["active", "inactive", "pending", "processed"];
        statuses[self.rng.gen_range(0..statuses.len())].to_string()
    }
    
    fn generate_category(&mut self) -> String {
        let categories = vec!["finance", "operations", "sales", "marketing", "hr", "it"];
        categories[self.rng.gen_range(0..categories.len())].to_string()
    }
    
    fn generate_tags(&mut self) -> Vec<String> {
        let all_tags = vec![
            "urgent", "important", "review", "approved", "pending", "completed",
            "finance", "operations", "sales", "marketing", "hr", "it"
        ];
        
        let tag_count = self.rng.gen_range(1..4);
        let mut tags = Vec::new();
        
        for _ in 0..tag_count {
            let tag = all_tags[self.rng.gen_range(0..all_tags.len())].to_string();
            if !tags.contains(&tag) {
                tags.push(tag);
            }
        }
        
        tags
    }
    
    fn generate_match_type(&mut self) -> String {
        let types = vec!["exact", "fuzzy", "partial", "no_match"];
        types[self.rng.gen_range(0..types.len())].to_string()
    }
    
    fn generate_result_status(&mut self) -> String {
        let statuses = vec!["matched", "unmatched", "pending", "review"];
        statuses[self.rng.gen_range(0..statuses.len())].to_string()
    }
    
    fn generate_schema(&mut self) -> Value {
        json!({
            "fields": [
                {
                    "name": "name",
                    "type": "string",
                    "required": true,
                    "max_length": 100
                },
                {
                    "name": "email",
                    "type": "string",
                    "required": true,
                    "format": "email"
                },
                {
                    "name": "phone",
                    "type": "string",
                    "required": false,
                    "format": "phone"
                },
                {
                    "name": "address",
                    "type": "string",
                    "required": false,
                    "max_length": 200
                },
                {
                    "name": "amount",
                    "type": "number",
                    "required": true,
                    "min": 0,
                    "max": 10000
                },
                {
                    "name": "date",
                    "type": "date",
                    "required": true,
                    "format": "YYYY-MM-DD"
                }
            ]
        })
    }
}

/// Test data structures
#[derive(Debug, Clone)]
pub struct TestUser {
    pub id: Uuid,
    pub email: String,
    pub password: String,
    pub first_name: String,
    pub last_name: String,
    pub role: UserRole,
    pub is_active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub last_login: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Clone)]
pub struct TestProject {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub owner_id: Uuid,
    pub status: ProjectStatus,
    pub settings: Option<Value>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone)]
pub struct TestDataSource {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub source_type: String,
    pub file_path: Option<String>,
    pub file_size: Option<i64>,
    pub file_hash: Option<String>,
    pub schema: Option<Value>,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone)]
pub struct TestReconciliationJob {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub confidence_threshold: f64,
    pub settings: Option<Value>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub started_at: Option<chrono::DateTime<chrono::Utc>>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Clone)]
pub struct TestReconciliationResult {
    pub id: Uuid,
    pub source_record_id: Uuid,
    pub target_record_id: Uuid,
    pub confidence_score: f64,
    pub match_type: String,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone)]
pub struct TestAnalyticsData {
    pub total_users: u32,
    pub total_projects: u32,
    pub total_reconciliation_jobs: u32,
    pub successful_reconciliations: u32,
    pub failed_reconciliations: u32,
    pub average_confidence_score: f64,
    pub total_data_processed: u64,
    pub average_processing_time: f64,
    pub last_updated: chrono::DateTime<chrono::Utc>,
}

/// Test data manager for managing test data lifecycle
pub struct TestDataManager {
    factory: TestDataFactory,
    users: HashMap<Uuid, TestUser>,
    projects: HashMap<Uuid, TestProject>,
    data_sources: HashMap<Uuid, TestDataSource>,
    reconciliation_jobs: HashMap<Uuid, TestReconciliationJob>,
}

impl TestDataManager {
    pub fn new() -> Self {
        Self {
            factory: TestDataFactory::new(),
            users: HashMap::new(),
            projects: HashMap::new(),
            data_sources: HashMap::new(),
            reconciliation_jobs: HashMap::new(),
        }
    }
    
    /// Create a complete test dataset
    pub fn create_test_dataset(&mut self) -> TestDataset {
        let mut dataset = TestDataset::new();
        
        // Create users
        let admin_user = self.factory.create_user(UserRole::Admin);
        let manager_user = self.factory.create_user(UserRole::Manager);
        let regular_user = self.factory.create_user(UserRole::User);
        
        self.users.insert(admin_user.id, admin_user.clone());
        self.users.insert(manager_user.id, manager_user.clone());
        self.users.insert(regular_user.id, regular_user.clone());
        
        dataset.users = vec![admin_user, manager_user, regular_user];
        
        // Create projects for each user
        for user in &dataset.users {
            let project = self.factory.create_project(user.id);
            self.projects.insert(project.id, project.clone());
            dataset.projects.push(project);
        }
        
        // Create data sources for each project
        for project in &dataset.projects {
            let data_source = self.factory.create_data_source(project.id);
            self.data_sources.insert(data_source.id, data_source.clone());
            dataset.data_sources.push(data_source);
        }
        
        // Create reconciliation jobs for each project
        for project in &dataset.projects {
            let job = self.factory.create_reconciliation_job(project.id);
            self.reconciliation_jobs.insert(job.id, job.clone());
            dataset.reconciliation_jobs.push(job);
        }
        
        // Generate additional test data
        dataset.csv_data = self.factory.generate_csv_data(100);
        dataset.json_data = self.factory.generate_json_data(100);
        dataset.reconciliation_results = self.factory.generate_reconciliation_results(50);
        dataset.analytics_data = self.factory.generate_analytics_data();
        
        dataset
    }
    
    /// Clean up test data
    pub fn cleanup(&mut self) {
        self.users.clear();
        self.projects.clear();
        self.data_sources.clear();
        self.reconciliation_jobs.clear();
    }
    
    /// Get user by ID
    pub fn get_user(&self, id: Uuid) -> Option<&TestUser> {
        self.users.get(&id)
    }
    
    /// Get project by ID
    pub fn get_project(&self, id: Uuid) -> Option<&TestProject> {
        self.projects.get(&id)
    }
    
    /// Get data source by ID
    pub fn get_data_source(&self, id: Uuid) -> Option<&TestDataSource> {
        self.data_sources.get(&id)
    }
    
    /// Get reconciliation job by ID
    pub fn get_reconciliation_job(&self, id: Uuid) -> Option<&TestReconciliationJob> {
        self.reconciliation_jobs.get(&id)
    }
}

/// Complete test dataset
#[derive(Debug, Clone)]
pub struct TestDataset {
    pub users: Vec<TestUser>,
    pub projects: Vec<TestProject>,
    pub data_sources: Vec<TestDataSource>,
    pub reconciliation_jobs: Vec<TestReconciliationJob>,
    pub csv_data: String,
    pub json_data: Value,
    pub reconciliation_results: Vec<TestReconciliationResult>,
    pub analytics_data: TestAnalyticsData,
}

impl TestDataset {
    pub fn new() -> Self {
        Self {
            users: Vec::new(),
            projects: Vec::new(),
            data_sources: Vec::new(),
            reconciliation_jobs: Vec::new(),
            csv_data: String::new(),
            json_data: json!([]),
            reconciliation_results: Vec::new(),
            analytics_data: TestAnalyticsData {
                total_users: 0,
                total_projects: 0,
                total_reconciliation_jobs: 0,
                successful_reconciliations: 0,
                failed_reconciliations: 0,
                average_confidence_score: 0.0,
                total_data_processed: 0,
                average_processing_time: 0.0,
                last_updated: Utc::now(),
            },
        }
    }
    
    /// Get user by role
    pub fn get_user_by_role(&self, role: UserRole) -> Option<&TestUser> {
        self.users.iter().find(|user| user.role == role)
    }
    
    /// Get projects by owner
    pub fn get_projects_by_owner(&self, owner_id: Uuid) -> Vec<&TestProject> {
        self.projects.iter().filter(|project| project.owner_id == owner_id).collect()
    }
    
    /// Get data sources by project
    pub fn get_data_sources_by_project(&self, project_id: Uuid) -> Vec<&TestDataSource> {
        self.data_sources.iter().filter(|ds| ds.project_id == project_id).collect()
    }
    
    /// Get reconciliation jobs by project
    pub fn get_reconciliation_jobs_by_project(&self, project_id: Uuid) -> Vec<&TestReconciliationJob> {
        self.reconciliation_jobs.iter().filter(|job| job.project_id == project_id).collect()
    }
    
    /// Get statistics
    pub fn get_statistics(&self) -> TestDatasetStatistics {
        TestDatasetStatistics {
            user_count: self.users.len(),
            project_count: self.projects.len(),
            data_source_count: self.data_sources.len(),
            reconciliation_job_count: self.reconciliation_jobs.len(),
            reconciliation_result_count: self.reconciliation_results.len(),
            csv_record_count: self.csv_data.lines().count() - 1, // Subtract header
            json_record_count: self.json_data.as_array().map(|arr| arr.len()).unwrap_or(0),
        }
    }
}

/// Test dataset statistics
#[derive(Debug, Clone)]
pub struct TestDatasetStatistics {
    pub user_count: usize,
    pub project_count: usize,
    pub data_source_count: usize,
    pub reconciliation_job_count: usize,
    pub reconciliation_result_count: usize,
    pub csv_record_count: usize,
    pub json_record_count: usize,
}

impl Default for TestDataFactory {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for TestDataManager {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for TestDataset {
    fn default() -> Self {
        Self::new()
    }
}
