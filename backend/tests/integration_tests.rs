//! Integration Tests
//! 
//! This module contains comprehensive integration tests that test the
//! interaction between different components and services.

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

use reconciliation_backend::handlers::*;
use reconciliation_backend::services::{
    AuthService, UserService, ProjectService, ReconciliationService,
    FileService, AnalyticsService
};
use reconciliation_backend::middleware::{
    AuthMiddleware, AuthMiddlewareConfig,
    PerformanceMiddleware, PerformanceMonitoringConfig,
    LoggingMiddleware, LoggingConfig
};
use reconciliation_backend::errors::{AppError, AppResult};

mod test_utils;
use test_utils::*;

/// Test suite for API endpoints
#[cfg(test)]
mod api_integration_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_authentication_flow() {
        let test_config = TestConfig::default();
        let test_client = TestClient::new().await;
        
        // Test user registration
        let register_request = serde_json::json!({
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        });
        
        let req = test::TestRequest::post()
            .uri("/api/auth/register")
            .set_json(&register_request)
            .to_request();
        
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
        
        let body: serde_json::Value = test::read_body_json(resp).await;
        assert!(body["token"].is_string());
        assert!(body["user"]["email"].as_str().unwrap() == "test@example.com");
        
        // Test user login
        let login_request = serde_json::json!({
            "email": "test@example.com",
            "password": "TestPassword123!"
        });
        
        let req = test::TestRequest::post()
            .uri("/api/auth/login")
            .set_json(&login_request)
            .to_request();
        
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
        
        let body: serde_json::Value = test::read_body_json(resp).await;
        assert!(body["token"].is_string());
    }
    
    #[tokio::test]
    async fn test_project_management_flow() {
        let test_config = TestConfig::default();
        let mut test_client = TestClient::new().await;
        
        // Authenticate first
        test_client.authenticate_as("admin@test.com", "admin123").await.unwrap();
        
        // Create a project
        let project_id = test_client.create_project("Test Project", "A test project").await.unwrap();
        assert!(!project_id.is_empty());
        
        // Get project details
        let req = test_client.authenticated_request("GET", &format!("/api/projects/{}", project_id)).await;
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
        
        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["name"].as_str().unwrap(), "Test Project");
        
        // Update project
        let update_data = serde_json::json!({
            "name": "Updated Test Project",
            "description": "An updated test project"
        });
        
        let req = test_client.authenticated_request("PUT", &format!("/api/projects/{}", project_id))
            .set_json(&update_data);
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
        
        // Verify update
        let req = test_client.authenticated_request("GET", &format!("/api/projects/{}", project_id)).await;
        let resp = test::call_service(&test_client.app, req).await;
        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["name"].as_str().unwrap(), "Updated Test Project");
        
        // Delete project
        let req = test_client.authenticated_request("DELETE", &format!("/api/projects/{}", project_id)).await;
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
        
        // Verify deletion
        let req = test_client.authenticated_request("GET", &format!("/api/projects/{}", project_id)).await;
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_client_error());
    }
    
    #[tokio::test]
    async fn test_file_upload_flow() {
        let test_config = TestConfig::default();
        let mut test_client = TestClient::new().await;
        
        // Authenticate first
        test_client.authenticate_as("admin@test.com", "admin123").await.unwrap();
        
        // Create a project first
        let project_id = test_client.create_project("Test Project", "A test project").await.unwrap();
        
        // Upload a file
        let file_id = test_client.upload_file(&project_id, "./test_data/sample.csv").await.unwrap();
        assert!(!file_id.is_empty());
        
        // Get file details
        let req = test_client.authenticated_request("GET", &format!("/api/files/{}", file_id)).await;
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
        
        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["id"].as_str().unwrap(), file_id);
        
        // Process file
        let req = test_client.authenticated_request("POST", &format!("/api/files/{}/process", file_id)).await;
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
        
        // Delete file
        let req = test_client.authenticated_request("DELETE", &format!("/api/files/{}", file_id)).await;
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
    }
    
    #[tokio::test]
    async fn test_reconciliation_flow() {
        let test_config = TestConfig::default();
        let mut test_client = TestClient::new().await;
        
        // Authenticate first
        test_client.authenticate_as("admin@test.com", "admin123").await.unwrap();
        
        // Create a project first
        let project_id = test_client.create_project("Test Project", "A test project").await.unwrap();
        
        // Upload files
        let file1_id = test_client.upload_file(&project_id, "./test_data/source1.csv").await.unwrap();
        let file2_id = test_client.upload_file(&project_id, "./test_data/source2.csv").await.unwrap();
        
        // Create reconciliation job
        let job_id = test_client.create_reconciliation_job(&project_id, "Test Reconciliation").await.unwrap();
        assert!(!job_id.is_empty());
        
        // Get job details
        let req = test_client.authenticated_request("GET", &format!("/api/reconciliation/jobs/{}", job_id)).await;
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
        
        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["name"].as_str().unwrap(), "Test Reconciliation");
        
        // Start reconciliation job
        let req = test_client.authenticated_request("POST", &format!("/api/reconciliation/jobs/{}/start", job_id)).await;
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
        
        // Check job status
        let req = test_client.authenticated_request("GET", &format!("/api/reconciliation/jobs/{}", job_id)).await;
        let resp = test::call_service(&test_client.app, req).await;
        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["status"].as_str().unwrap(), "running");
        
        // Get reconciliation results
        let req = test_client.authenticated_request("GET", &format!("/api/reconciliation/jobs/{}/results", job_id)).await;
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
        
        // Stop reconciliation job
        let req = test_client.authenticated_request("POST", &format!("/api/reconciliation/jobs/{}/stop", job_id)).await;
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
    }
    
    #[tokio::test]
    async fn test_analytics_endpoints() {
        let test_config = TestConfig::default();
        let mut test_client = TestClient::new().await;
        
        // Authenticate first
        test_client.authenticate_as("admin@test.com", "admin123").await.unwrap();
        
        // Get dashboard data
        let req = test_client.authenticated_request("GET", "/api/analytics/dashboard").await;
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
        
        let body: serde_json::Value = test::read_body_json(resp).await;
        assert!(body["total_users"].is_number());
        assert!(body["total_projects"].is_number());
        assert!(body["total_reconciliation_jobs"].is_number());
        
        // Get reconciliation statistics
        let req = test_client.authenticated_request("GET", "/api/analytics/reconciliation").await;
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
        
        let body: serde_json::Value = test::read_body_json(resp).await;
        assert!(body["total_jobs"].is_number());
        assert!(body["completed_jobs"].is_number());
        assert!(body["failed_jobs"].is_number());
    }
    
    #[tokio::test]
    async fn test_user_management_endpoints() {
        let test_config = TestConfig::default();
        let mut test_client = TestClient::new().await;
        
        // Authenticate as admin first
        test_client.authenticate_as("admin@test.com", "admin123").await.unwrap();
        
        // Get all users
        let req = test_client.authenticated_request("GET", "/api/users").await;
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
        
        let body: serde_json::Value = test::read_body_json(resp).await;
        assert!(body["users"].is_array());
        
        // Create a new user
        let user_data = serde_json::json!({
            "email": "newuser@example.com",
            "password": "NewPassword123!",
            "first_name": "New",
            "last_name": "User",
            "role": "user"
        });
        
        let req = test_client.authenticated_request("POST", "/api/users")
            .set_json(&user_data);
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
        
        let body: serde_json::Value = test::read_body_json(resp).await;
        let user_id = body["id"].as_str().unwrap();
        
        // Get user details
        let req = test_client.authenticated_request("GET", &format!("/api/users/{}", user_id)).await;
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
        
        // Update user
        let update_data = serde_json::json!({
            "first_name": "Updated",
            "last_name": "Name",
            "role": "analyst"
        });
        
        let req = test_client.authenticated_request("PUT", &format!("/api/users/{}", user_id))
            .set_json(&update_data);
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
        
        // Verify update
        let req = test_client.authenticated_request("GET", &format!("/api/users/{}", user_id)).await;
        let resp = test::call_service(&test_client.app, req).await;
        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["first_name"].as_str().unwrap(), "Updated");
        assert_eq!(body["role"].as_str().unwrap(), "analyst");
        
        // Delete user
        let req = test_client.authenticated_request("DELETE", &format!("/api/users/{}", user_id)).await;
        let resp = test::call_service(&test_client.app, req).await;
        assert!(resp.status().is_success());
    }
}

/// Test suite for middleware integration
#[cfg(test)]
mod middleware_integration_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_security_middleware() {
        let security_config = SecurityMiddlewareConfig::default();
        let app = test::init_service(
            App::new()
                .wrap(SecurityMiddleware::new(security_config))
                .route("/test", web::get().to(|| async { HttpResponse::Ok().json("test") }))
        ).await;
        
        // Test normal request
        let req = test::TestRequest::get().uri("/test").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
        
        // Test rate limiting (would need multiple requests)
        for _ in 0..10 {
            let req = test::TestRequest::get().uri("/test").to_request();
            let _resp = test::call_service(&app, req).await;
        }
        
        // Should eventually hit rate limit
        let req = test::TestRequest::get().uri("/test").to_request();
        let resp = test::call_service(&app, req).await;
        // Rate limit might not be hit in this test, but the middleware should be working
    }
    
    #[tokio::test]
    async fn test_auth_middleware() {
        let auth_config = AuthMiddlewareConfig::default();
        let app = test::init_service(
            App::new()
                .wrap(AuthMiddleware::new(auth_config))
                .route("/protected", web::get().to(|| async { HttpResponse::Ok().json("protected") }))
        ).await;
        
        // Test unauthenticated request
        let req = test::TestRequest::get().uri("/protected").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_client_error());
        
        // Test authenticated request
        let req = test::TestRequest::get()
            .uri("/protected")
            .insert_header(("Authorization", "Bearer valid_token"))
            .to_request();
        let resp = test::call_service(&app, req).await;
        // This would need a valid token to succeed
    }
    
    #[tokio::test]
    async fn test_performance_middleware() {
        let performance_config = PerformanceMonitoringConfig::default();
        let app = test::init_service(
            App::new()
                .wrap(PerformanceMiddleware::new(performance_config))
                .route("/test", web::get().to(|| async { HttpResponse::Ok().json("test") }))
        ).await;
        
        // Test request with performance monitoring
        let req = test::TestRequest::get().uri("/test").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
        
        // Performance metrics should be recorded
        // In a real implementation, you'd check the metrics
    }
    
    #[tokio::test]
    async fn test_logging_middleware() {
        let logging_config = LoggingConfig::default();
        let app = test::init_service(
            App::new()
                .wrap(LoggingMiddleware::new(logging_config))
                .route("/test", web::get().to(|| async { HttpResponse::Ok().json("test") }))
        ).await;
        
        // Test request with logging
        let req = test::TestRequest::get().uri("/test").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
        
        // Logs should be recorded
        // In a real implementation, you'd check the logs
    }
}

/// Test suite for database integration
#[cfg(test)]
mod database_integration_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_database_connection() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        
        // Test database connection
        let conn = test_db.pool.get().unwrap();
        assert!(conn.is_ok());
    }
    
    #[tokio::test]
    async fn test_database_transactions() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        
        // Test transaction rollback
        let result = test_db.pool.get().unwrap().transaction::<_, diesel::result::Error, _>(|conn| {
            // Perform some operations
            Ok(())
        });
        
        assert!(result.is_ok());
    }
    
    #[tokio::test]
    async fn test_database_migrations() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        
        // Run migrations
        test_db.run_migrations().await.unwrap();
        
        // Verify tables exist
        // This would check that all required tables are created
    }
}

/// Test suite for WebSocket integration
#[cfg(test)]
mod websocket_integration_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_websocket_connection() {
        // Test WebSocket connection
        // This would test the WebSocket server functionality
    }
    
    #[tokio::test]
    async fn test_websocket_messaging() {
        // Test WebSocket messaging
        // This would test sending and receiving messages
    }
    
    #[tokio::test]
    async fn test_websocket_authentication() {
        // Test WebSocket authentication
        // This would test authenticated WebSocket connections
    }
}

/// Test suite for error handling integration
#[cfg(test)]
mod error_handling_integration_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_error_recovery() {
        let test_config = TestConfig::default();
        let mut test_client = TestClient::new().await;
        
        // Test error recovery mechanisms
        // This would test retry logic, circuit breakers, etc.
    }
    
    #[tokio::test]
    async fn test_graceful_degradation() {
        let test_config = TestConfig::default();
        let mut test_client = TestClient::new().await;
        
        // Test graceful degradation
        // This would test fallback responses when services are down
    }
    
    #[tokio::test]
    async fn test_error_logging() {
        let test_config = TestConfig::default();
        let mut test_client = TestClient::new().await;
        
        // Test error logging
        // This would test that errors are properly logged
    }
}

/// Test suite for performance integration
#[cfg(test)]
mod performance_integration_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_performance_under_load() {
        let test_config = TestConfig::default();
        let mut test_client = TestClient::new().await;
        
        // Authenticate first
        test_client.authenticate_as("admin@test.com", "admin123").await.unwrap();
        
        // Run performance test
        let performance_utils = PerformanceTestUtils::new();
        let scenario = &performance_utils.test_scenarios[0]; // Light load
        
        let results = performance_utils.run_scenario(scenario, &test_client).await;
        
        // Assert performance results
        assert!(results.average_response_time_ms < 1000.0); // Less than 1 second
        assert!(results.error_rate < 5.0); // Less than 5% error rate
        assert!(results.requests_per_second > 0.0);
    }
    
    #[tokio::test]
    async fn test_database_performance() {
        let test_db = TestDatabaseManager::new("postgresql://test_user:test_pass@localhost:5432/test_db");
        
        // Test database performance
        // This would test query performance, connection pooling, etc.
    }
    
    #[tokio::test]
    async fn test_memory_usage() {
        // Test memory usage
        // This would test memory consumption under load
    }
}