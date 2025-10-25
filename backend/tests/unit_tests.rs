//! Unit Tests for Core Services
//! 
//! This module contains comprehensive unit tests for all core services
//! including authentication, user management, project management, and reconciliation.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use actix_web::{test, web, App, HttpRequest, HttpResponse};
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool};

use crate::services::{
    AuthService, UserService, ProjectService, ReconciliationService,
    FileService, AnalyticsService, SecurityService
};
use crate::services::auth::{LoginRequest, RegisterRequest, Claims};
use crate::services::security::{SecurityService, SecurityConfig};
use crate::errors::{AppError, AppResult};
use crate::models::{User, Project, ReconciliationJob, DataSource};

mod test_utils;
use test_utils::*;

/// Test suite for AuthService
#[cfg(test)]
mod auth_service_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_auth_service_creation() {
        let auth_service = AuthService::new(
            "test_secret".to_string(),
            3600
        );
        
        assert!(auth_service.jwt_secret == "test_secret");
        assert!(auth_service.expiration == 3600);
    }
    
    #[tokio::test]
    async fn test_jwt_token_generation() {
        let auth_service = AuthService::new(
            "test_secret".to_string(),
            3600
        );
        
        let claims = Claims {
            sub: "user123".to_string(),
            role: "user".to_string(),
            exp: (SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() + 3600) as usize,
            iat: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as usize,
        };
        
        let token = auth_service.generate_token(&claims).unwrap();
        assert!(!token.is_empty());
        
        // Verify token can be decoded
        let decoded_claims = auth_service.validate_token(&token).unwrap();
        assert_eq!(decoded_claims.sub, "user123");
        assert_eq!(decoded_claims.role, "user");
    }
    
    #[tokio::test]
    async fn test_password_hashing() {
        let auth_service = AuthService::new(
            "test_secret".to_string(),
            3600
        );
        
        let password = "test_password123";
        let hashed = auth_service.hash_password(password).unwrap();
        
        assert_ne!(password, hashed);
        assert!(auth_service.verify_password(password, &hashed).unwrap());
        assert!(!auth_service.verify_password("wrong_password", &hashed).unwrap());
    }
    
    #[tokio::test]
    async fn test_token_validation() {
        let auth_service = AuthService::new(
            "test_secret".to_string(),
            3600
        );
        
        let claims = Claims {
            sub: "user123".to_string(),
            role: "user".to_string(),
            exp: (SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() + 3600) as usize,
            iat: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as usize,
        };
        
        let token = auth_service.generate_token(&claims).unwrap();
        
        // Valid token
        let decoded_claims = auth_service.validate_token(&token).unwrap();
        assert_eq!(decoded_claims.sub, "user123");
        
        // Invalid token
        assert!(auth_service.validate_token("invalid_token").is_err());
        
        // Expired token
        let expired_claims = Claims {
            sub: "user123".to_string(),
            role: "user".to_string(),
            exp: (SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() - 3600) as usize,
            iat: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as usize,
        };
        
        let expired_token = auth_service.generate_token(&expired_claims).unwrap();
        assert!(auth_service.validate_token(&expired_token).is_err());
    }
}

/// Test suite for SecurityService
#[cfg(test)]
mod security_service_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_security_service_creation() {
        let config = SecurityConfig::default();
        let security_service = SecurityService::new(config);
        
        assert!(security_service.config.jwt_secret.len() > 0);
        assert!(security_service.config.max_login_attempts > 0);
    }
    
    #[tokio::test]
    async fn test_rate_limiting() {
        let config = SecurityConfig::default();
        let security_service = SecurityService::new(config);
        
        let identifier = "test_user";
        
        // First request should succeed
        assert!(security_service.check_rate_limit(identifier).await.is_ok());
        
        // Multiple requests should eventually fail
        for _ in 0..10 {
            let _ = security_service.check_rate_limit(identifier).await;
        }
        
        // Should eventually hit rate limit
        assert!(security_service.check_rate_limit(identifier).await.is_err());
    }
    
    #[tokio::test]
    async fn test_input_validation() {
        let config = SecurityConfig::default();
        let security_service = SecurityService::new(config);
        
        // Valid input
        assert!(security_service.validate_input("normal_text").is_ok());
        
        // SQL injection attempt
        assert!(security_service.validate_input("'; DROP TABLE users; --").is_err());
        
        // XSS attempt
        assert!(security_service.validate_input("<script>alert('xss')</script>").is_err());
        
        // Path traversal attempt
        assert!(security_service.validate_input("../../../etc/passwd").is_err());
    }
    
    #[tokio::test]
    async fn test_password_strength_validation() {
        let config = SecurityConfig::default();
        let security_service = SecurityService::new(config);
        
        // Weak password
        assert!(security_service.validate_password_strength("123").is_err());
        
        // Password without uppercase
        assert!(security_service.validate_password_strength("password123!").is_err());
        
        // Password without lowercase
        assert!(security_service.validate_password_strength("PASSWORD123!").is_err());
        
        // Password without digit
        assert!(security_service.validate_password_strength("Password!").is_err());
        
        // Password without special character
        assert!(security_service.validate_password_strength("Password123").is_err());
        
        // Strong password
        assert!(security_service.validate_password_strength("Password123!").is_ok());
    }
    
    #[tokio::test]
    async fn test_input_sanitization() {
        let config = SecurityConfig::default();
        let security_service = SecurityService::new(config);
        
        let input = "<script>alert('xss')</script>";
        let sanitized = security_service.sanitize_input(input);
        
        assert!(!sanitized.contains("<script>"));
        assert!(!sanitized.contains("</script>"));
        assert!(sanitized.contains("&lt;script&gt;"));
    }
}

/// Test suite for UserService
#[cfg(test)]
mod user_service_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_user_creation() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        let user_service = UserService::new(test_db.pool.get().unwrap());
        
        let user_data = crate::models::NewUser {
            email: "test@example.com".to_string(),
            password_hash: "hashed_password".to_string(),
            first_name: "Test".to_string(),
            last_name: "User".to_string(),
            role: "user".to_string(),
            is_active: true,
        };
        
        let user = user_service.create_user(user_data).await.unwrap();
        assert_eq!(user.email, "test@example.com");
        assert_eq!(user.first_name, "Test");
        assert_eq!(user.last_name, "User");
        assert_eq!(user.role, "user");
        assert!(user.is_active);
    }
    
    #[tokio::test]
    async fn test_user_retrieval() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        let user_service = UserService::new(test_db.pool.get().unwrap());
        
        // Create a user first
        let user_data = crate::models::NewUser {
            email: "test@example.com".to_string(),
            password_hash: "hashed_password".to_string(),
            first_name: "Test".to_string(),
            last_name: "User".to_string(),
            role: "user".to_string(),
            is_active: true,
        };
        
        let created_user = user_service.create_user(user_data).await.unwrap();
        
        // Retrieve the user
        let retrieved_user = user_service.get_user_by_id(created_user.id).await.unwrap();
        assert_eq!(retrieved_user.email, "test@example.com");
        
        // Retrieve by email
        let user_by_email = user_service.get_user_by_email("test@example.com").await.unwrap();
        assert_eq!(user_by_email.id, created_user.id);
    }
    
    #[tokio::test]
    async fn test_user_update() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        let user_service = UserService::new(test_db.pool.get().unwrap());
        
        // Create a user first
        let user_data = crate::models::NewUser {
            email: "test@example.com".to_string(),
            password_hash: "hashed_password".to_string(),
            first_name: "Test".to_string(),
            last_name: "User".to_string(),
            role: "user".to_string(),
            is_active: true,
        };
        
        let created_user = user_service.create_user(user_data).await.unwrap();
        
        // Update the user
        let update_data = crate::models::UpdateUser {
            first_name: Some("Updated".to_string()),
            last_name: Some("Name".to_string()),
            role: Some("admin".to_string()),
            is_active: Some(false),
        };
        
        let updated_user = user_service.update_user(created_user.id, update_data).await.unwrap();
        assert_eq!(updated_user.first_name, "Updated");
        assert_eq!(updated_user.last_name, "Name");
        assert_eq!(updated_user.role, "admin");
        assert!(!updated_user.is_active);
    }
    
    #[tokio::test]
    async fn test_user_deletion() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        let user_service = UserService::new(test_db.pool.get().unwrap());
        
        // Create a user first
        let user_data = crate::models::NewUser {
            email: "test@example.com".to_string(),
            password_hash: "hashed_password".to_string(),
            first_name: "Test".to_string(),
            last_name: "User".to_string(),
            role: "user".to_string(),
            is_active: true,
        };
        
        let created_user = user_service.create_user(user_data).await.unwrap();
        
        // Delete the user
        user_service.delete_user(created_user.id).await.unwrap();
        
        // Verify user is deleted
        assert!(user_service.get_user_by_id(created_user.id).await.is_err());
    }
}

/// Test suite for ProjectService
#[cfg(test)]
mod project_service_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_project_creation() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        let project_service = ProjectService::new(test_db.pool.get().unwrap());
        
        let project_data = crate::models::NewProject {
            name: "Test Project".to_string(),
            description: Some("A test project".to_string()),
            owner_id: Uuid::new_v4(),
            settings: Some(serde_json::json!({"key": "value"})),
        };
        
        let project = project_service.create_project(project_data).await.unwrap();
        assert_eq!(project.name, "Test Project");
        assert_eq!(project.description, Some("A test project".to_string()));
    }
    
    #[tokio::test]
    async fn test_project_retrieval() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        let project_service = ProjectService::new(test_db.pool.get().unwrap());
        
        // Create a project first
        let project_data = crate::models::NewProject {
            name: "Test Project".to_string(),
            description: Some("A test project".to_string()),
            owner_id: Uuid::new_v4(),
            settings: Some(serde_json::json!({"key": "value"})),
        };
        
        let created_project = project_service.create_project(project_data).await.unwrap();
        
        // Retrieve the project
        let retrieved_project = project_service.get_project_by_id(created_project.id).await.unwrap();
        assert_eq!(retrieved_project.name, "Test Project");
        
        // Get projects by owner
        let owner_projects = project_service.get_projects_by_owner(created_project.owner_id).await.unwrap();
        assert!(owner_projects.len() > 0);
        assert!(owner_projects.iter().any(|p| p.id == created_project.id));
    }
    
    #[tokio::test]
    async fn test_project_update() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        let project_service = ProjectService::new(test_db.pool.get().unwrap());
        
        // Create a project first
        let project_data = crate::models::NewProject {
            name: "Test Project".to_string(),
            description: Some("A test project".to_string()),
            owner_id: Uuid::new_v4(),
            settings: Some(serde_json::json!({"key": "value"})),
        };
        
        let created_project = project_service.create_project(project_data).await.unwrap();
        
        // Update the project
        let update_data = crate::models::UpdateProject {
            name: Some("Updated Project".to_string()),
            description: Some("An updated test project".to_string()),
            settings: Some(serde_json::json!({"key": "updated_value"})),
        };
        
        let updated_project = project_service.update_project(created_project.id, update_data).await.unwrap();
        assert_eq!(updated_project.name, "Updated Project");
        assert_eq!(updated_project.description, Some("An updated test project".to_string()));
    }
    
    #[tokio::test]
    async fn test_project_deletion() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        let project_service = ProjectService::new(test_db.pool.get().unwrap());
        
        // Create a project first
        let project_data = crate::models::NewProject {
            name: "Test Project".to_string(),
            description: Some("A test project".to_string()),
            owner_id: Uuid::new_v4(),
            settings: Some(serde_json::json!({"key": "value"})),
        };
        
        let created_project = project_service.create_project(project_data).await.unwrap();
        
        // Delete the project
        project_service.delete_project(created_project.id).await.unwrap();
        
        // Verify project is deleted
        assert!(project_service.get_project_by_id(created_project.id).await.is_err());
    }
}

/// Test suite for ReconciliationService
#[cfg(test)]
mod reconciliation_service_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_reconciliation_job_creation() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        let reconciliation_service = ReconciliationService::new(test_db.pool.get().unwrap());
        
        let job_data = crate::models::NewReconciliationJob {
            name: "Test Reconciliation Job".to_string(),
            description: Some("A test reconciliation job".to_string()),
            project_id: Uuid::new_v4(),
            status: "pending".to_string(),
            settings: Some(serde_json::json!({"threshold": 0.8})),
        };
        
        let job = reconciliation_service.create_reconciliation_job(job_data).await.unwrap();
        assert_eq!(job.name, "Test Reconciliation Job");
        assert_eq!(job.status, "pending");
    }
    
    #[tokio::test]
    async fn test_reconciliation_job_execution() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        let reconciliation_service = ReconciliationService::new(test_db.pool.get().unwrap());
        
        // Create a reconciliation job
        let job_data = crate::models::NewReconciliationJob {
            name: "Test Reconciliation Job".to_string(),
            description: Some("A test reconciliation job".to_string()),
            project_id: Uuid::new_v4(),
            status: "pending".to_string(),
            settings: Some(serde_json::json!({"threshold": 0.8})),
        };
        
        let job = reconciliation_service.create_reconciliation_job(job_data).await.unwrap();
        
        // Start the job
        reconciliation_service.start_reconciliation_job(job.id).await.unwrap();
        
        // Check job status
        let updated_job = reconciliation_service.get_reconciliation_job_status(job.id).await.unwrap();
        assert_eq!(updated_job.status, "running");
    }
    
    #[tokio::test]
    async fn test_reconciliation_results() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        let reconciliation_service = ReconciliationService::new(test_db.pool.get().unwrap());
        
        // Create a reconciliation job
        let job_data = crate::models::NewReconciliationJob {
            name: "Test Reconciliation Job".to_string(),
            description: Some("A test reconciliation job".to_string()),
            project_id: Uuid::new_v4(),
            status: "pending".to_string(),
            settings: Some(serde_json::json!({"threshold": 0.8})),
        };
        
        let job = reconciliation_service.create_reconciliation_job(job_data).await.unwrap();
        
        // Get results (should be empty initially)
        let results = reconciliation_service.get_reconciliation_results(job.id, 0, 10).await.unwrap();
        assert_eq!(results.len(), 0);
    }
}

/// Test suite for FileService
#[cfg(test)]
mod file_service_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_file_upload() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        let file_service = FileService::new(test_db.pool.get().unwrap(), "./test_uploads".to_string());
        
        // Create test file content
        let file_content = "test,data,here\n1,2,3\n4,5,6";
        let test_file_path = "./test_uploads/test_file.csv";
        
        // Create test file
        test_utils::create_test_file(test_file_path, file_content).await.unwrap();
        
        // Upload file
        let file_info = file_service.upload_file(
            test_file_path,
            Uuid::new_v4(),
            Uuid::new_v4(),
        ).await.unwrap();
        
        assert_eq!(file_info.file_name, "test_file.csv");
        assert!(file_info.file_size > 0);
        
        // Clean up
        test_utils::clean_test_files("./test_uploads").await.unwrap();
    }
    
    #[tokio::test]
    async fn test_file_processing() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        let file_service = FileService::new(test_db.pool.get().unwrap(), "./test_uploads".to_string());
        
        // Create test file content
        let file_content = "test,data,here\n1,2,3\n4,5,6";
        let test_file_path = "./test_uploads/test_file.csv";
        
        // Create test file
        test_utils::create_test_file(test_file_path, file_content).await.unwrap();
        
        // Upload file
        let file_info = file_service.upload_file(
            test_file_path,
            Uuid::new_v4(),
            Uuid::new_v4(),
        ).await.unwrap();
        
        // Process file
        let processing_result = file_service.process_file(file_info.id).await.unwrap();
        assert_eq!(processing_result.status, "processed");
        
        // Clean up
        test_utils::clean_test_files("./test_uploads").await.unwrap();
    }
}

/// Test suite for AnalyticsService
#[cfg(test)]
mod analytics_service_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_dashboard_data() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        let analytics_service = AnalyticsService::new(test_db.pool.get().unwrap());
        
        let dashboard_data = analytics_service.get_dashboard_data().await.unwrap();
        
        assert!(dashboard_data.total_users >= 0);
        assert!(dashboard_data.total_projects >= 0);
        assert!(dashboard_data.total_reconciliation_jobs >= 0);
        assert!(dashboard_data.total_data_sources >= 0);
    }
    
    #[tokio::test]
    async fn test_project_statistics() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        let analytics_service = AnalyticsService::new(test_db.pool.get().unwrap());
        
        let project_id = Uuid::new_v4();
        let project_stats = analytics_service.get_project_stats(project_id).await.unwrap();
        
        assert_eq!(project_stats.project_id, project_id);
        assert!(project_stats.total_jobs >= 0);
        assert!(project_stats.completed_jobs >= 0);
        assert!(project_stats.failed_jobs >= 0);
    }
    
    #[tokio::test]
    async fn test_user_activity_stats() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        let analytics_service = AnalyticsService::new(test_db.pool.get().unwrap());
        
        let user_id = Uuid::new_v4();
        let user_activity = analytics_service.get_user_activity_stats(user_id).await.unwrap();
        
        assert_eq!(user_activity.user_id, user_id);
        assert!(user_activity.total_actions >= 0);
        assert!(user_activity.projects_created >= 0);
        assert!(user_activity.jobs_created >= 0);
    }
    
    #[tokio::test]
    async fn test_reconciliation_statistics() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        let analytics_service = AnalyticsService::new(test_db.pool.get().unwrap());
        
        let reconciliation_stats = analytics_service.get_reconciliation_stats().await.unwrap();
        
        assert!(reconciliation_stats.total_jobs >= 0);
        assert!(reconciliation_stats.completed_jobs >= 0);
        assert!(reconciliation_stats.failed_jobs >= 0);
        assert!(reconciliation_stats.pending_jobs >= 0);
        assert!(reconciliation_stats.running_jobs >= 0);
    }
}
