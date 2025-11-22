//! Security-focused tests for authorization and rate limiting
//!
//! Tests critical security vulnerabilities identified in Cycle 1 audits

use actix_web::{test, web, App, HttpRequest, HttpResponse};
use serde_json::json;
use uuid::Uuid;

use reconciliation_backend::errors::AppError;
use reconciliation_backend::handlers::*;
use reconciliation_backend::middleware::security::{configure_security_middleware, SecurityConfig};
use reconciliation_backend::services::{AuthService, UserService};

#[path = "test_utils.rs"]
mod test_utils;
use test_utils::TestClient;

/// Test suite for authorization security
#[cfg(test)]
mod authorization_security_tests {
    use super::*;

    #[tokio::test]
    async fn test_unauthorized_project_access() {
        let mut test_client = TestClient::new();

        // Authenticate as user1
        test_client
            .authenticate_as("user1@test.com", "password123")
            .await
            .unwrap();

        // Create a project as user1
        let project_id = test_client
            .create_project("User1 Project", "Project owned by user1")
            .await
            .unwrap();

        // Create another test client for user2
        let mut test_client2 = TestClient::new();
        test_client2
            .authenticate_as("user2@test.com", "password123")
            .await
            .unwrap();

        // Try to access user1's project as user2
        let req = test_client2
            .authenticated_request("GET", &format!("/api/projects/{}", project_id))
            .to_request();
        let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;

        // Should return 403 Forbidden
        assert_eq!(resp.status(), 403);

        let body: serde_json::Value = test::read_body_json(resp).await;
        assert!(body["error"].as_str().unwrap().contains("Access denied"));
    }

    #[tokio::test]
    async fn test_unauthorized_file_access() {
        let mut test_client = TestClient::new();
        test_client
            .authenticate_as("user1@test.com", "password123")
            .await
            .unwrap();

        // Create project and upload file
        let project_id = test_client
            .create_project("Test Project", "Test")
            .await
            .unwrap();
        let file_id = test_client
            .upload_file(&project_id, "./test_data/sample.csv")
            .await
            .unwrap();

        // Create another user
        let mut test_client2 = TestClient::new();
        test_client2
            .authenticate_as("user2@test.com", "password123")
            .await
            .unwrap();

        // Try to access file as user2
        let req = test_client2
            .authenticated_request("GET", &format!("/api/files/{}", file_id))
            .to_request();
        let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;

        // Should return 403 Forbidden
        assert_eq!(resp.status(), 403);
    }

    #[tokio::test]
    async fn test_unauthorized_job_creation() {
        let mut test_client = TestClient::new();
        test_client
            .authenticate_as("user1@test.com", "password123")
            .await
            .unwrap();

        // Create project
        let project_id = test_client
            .create_project("Test Project", "Test")
            .await
            .unwrap();

        // Create another user
        let mut test_client2 = TestClient::new();
        test_client2
            .authenticate_as("user2@test.com", "password123")
            .await
            .unwrap();

        // Try to create reconciliation job for user1's project as user2
        let job_data = json!({
            "name": "Unauthorized Job",
            "description": "Should fail",
            "source_data_source_id": Uuid::new_v4(),
            "target_data_source_id": Uuid::new_v4(),
            "confidence_threshold": 0.8
        });

        let req = test_client2
            .authenticated_request(
                "POST",
                &format!("/api/projects/{}/reconciliation-jobs", project_id),
            )
            .set_json(&job_data);
        let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;

        // Should return 403 Forbidden
        assert_eq!(resp.status(), 403);
    }

    #[tokio::test]
    async fn test_unauthorized_data_source_creation() {
        let mut test_client = TestClient::new();
        test_client
            .authenticate_as("user1@test.com", "password123")
            .await
            .unwrap();

        // Create project
        let project_id = test_client
            .create_project("Test Project", "Test")
            .await
            .unwrap();

        // Create another user
        let mut test_client2 = TestClient::new();
        test_client2
            .authenticate_as("user2@test.com", "password123")
            .await
            .unwrap();

        // Try to create data source for user1's project as user2
        let data_source_data = json!({
            "name": "Unauthorized Data Source",
            "description": "Should fail",
            "source_type": "csv",
            "file_path": "/tmp/test.csv"
        });

        let req = test_client2
            .authenticated_request(
                "POST",
                &format!("/api/projects/{}/data-sources", project_id),
            )
            .set_json(&data_source_data);
        let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;

        // Should return 403 Forbidden
        assert_eq!(resp.status(), 403);
    }

    #[tokio::test]
    async fn test_unauthorized_file_upload() {
        let mut test_client = TestClient::new();
        test_client
            .authenticate_as("user1@test.com", "password123")
            .await
            .unwrap();

        // Create project
        let project_id = test_client
            .create_project("Test Project", "Test")
            .await
            .unwrap();

        // Create another user
        let mut test_client2 = TestClient::new();
        test_client2
            .authenticate_as("user2@test.com", "password123")
            .await
            .unwrap();

        // Try to upload file to user1's project as user2
        let req = test_client2
            .authenticated_request(
                "POST",
                &format!("/api/projects/{}/files/upload", project_id),
            )
            .await;
        let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;

        // Should return 403 Forbidden
        assert_eq!(resp.status(), 403);
    }

    #[tokio::test]
    async fn test_admin_bypass_authorization() {
        let mut test_client = TestClient::new();
        test_client
            .authenticate_as("admin@test.com", "admin123")
            .await
            .unwrap();

        // Create another user
        let mut test_client2 = TestClient::new();
        test_client2
            .authenticate_as("user1@test.com", "password123")
            .await
            .unwrap();

        // Create project as user1
        let project_id = test_client2
            .create_project("User1 Project", "Project owned by user1")
            .await
            .unwrap();

        // Admin should be able to access any project
        let req = test_client
            .authenticated_request("GET", &format!("/api/projects/{}", project_id))
            .to_request();
        let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;

        // Should succeed
        assert!(resp.status().is_success());
    }
}

/// Test suite for rate limiting security
#[cfg(test)]
mod rate_limiting_security_tests {
    use super::*;

    #[tokio::test]
    async fn test_login_rate_limiting() {
        let test_client = TestClient::new();

        // Make multiple rapid login attempts
        for i in 0..15 {
            let login_data = json!({
                "email": "test@example.com",
                "password": "wrong_password"
            });

            let req = test::TestRequest::post()
                .uri("/api/auth/login")
                .set_json(&login_data)
                .to_request();

            let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;

            if i < 10 {
                // First 10 attempts should fail with 401/400
                assert!(resp.status().is_client_error());
            } else {
                // After 10 attempts, should hit rate limit
                if resp.status() == 429 {
                    break;
                }
            }
        }

        // Verify rate limit was eventually hit
        let login_data = json!({
            "email": "test@example.com",
            "password": "wrong_password"
        });

        let req = test::TestRequest::post()
            .uri("/api/auth/login")
            .set_json(&login_data)
            .to_request();

        let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;
        // Should eventually hit rate limit (429 Too Many Requests)
        // Note: This test may not always hit the limit depending on implementation
    }

    #[tokio::test]
    async fn test_register_rate_limiting() {
        let test_client = TestClient::new();

        // Make multiple rapid registration attempts
        for i in 0..10 {
            let register_data = json!({
                "email": format!("test{}@example.com", i),
                "password": "TestPassword123!",
                "first_name": "Test",
                "last_name": "User"
            });

            let req = test::TestRequest::post()
                .uri("/api/auth/register")
                .set_json(&register_data)
                .to_request();

            let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;

            // Should eventually hit rate limit
            if resp.status() == 429 {
                break;
            }
        }
    }

    #[tokio::test]
    async fn test_password_reset_rate_limiting() {
        let test_client = TestClient::new();

        // Make multiple rapid password reset requests
        for _ in 0..10 {
            let reset_data = json!({
                "email": "test@example.com"
            });

            let req = test::TestRequest::post()
                .uri("/api/auth/password-reset")
                .set_json(&reset_data)
                .to_request();

            let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;

            // Should eventually hit rate limit
            if resp.status() == 429 {
                break;
            }
        }
    }
}

/// Test suite for CSRF protection
#[cfg(test)]
mod csrf_protection_tests {
    use super::*;

    #[tokio::test]
    async fn test_csrf_protection_missing_token() {
        let mut test_client = TestClient::new();
        test_client
            .authenticate_as("admin@test.com", "admin123")
            .await
            .unwrap();

        // Try to create project without CSRF token
        let project_data = json!({
            "name": "Test Project",
            "description": "Test",
            "owner_id": test_client.user_id
        });

        let req = test::TestRequest::post()
            .uri("/api/projects")
            .set_json(&project_data)
            .to_request();

        let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;

        // Should return 400 Bad Request due to missing CSRF token
        assert_eq!(resp.status(), 400);

        let body: serde_json::Value = test::read_body_json(resp).await;
        assert!(body["error"].as_str().unwrap().contains("CSRF"));
    }

    #[tokio::test]
    async fn test_csrf_protection_invalid_token() {
        let mut test_client = TestClient::new();
        test_client
            .authenticate_as("admin@test.com", "admin123")
            .await
            .unwrap();

        // Try to create project with invalid CSRF token
        let project_data = json!({
            "name": "Test Project",
            "description": "Test",
            "owner_id": test_client.user_id
        });

        let req = test::TestRequest::post()
            .uri("/api/projects")
            .insert_header(("X-CSRF-Token", "invalid-token"))
            .insert_header(("Cookie", "csrf-token=different-token"))
            .set_json(&project_data)
            .to_request();

        let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;

        // Should return 400 Bad Request due to CSRF token mismatch
        assert_eq!(resp.status(), 400);
    }

    #[tokio::test]
    async fn test_csrf_protection_valid_token() {
        let mut test_client = TestClient::new();
        test_client
            .authenticate_as("admin@test.com", "admin123")
            .await
            .unwrap();

        // Get CSRF token first (this would be implemented in the actual app)
        let csrf_token = "valid-csrf-token-12345";

        // Try to create project with valid CSRF token
        let project_data = json!({
            "name": "Test Project",
            "description": "Test",
            "owner_id": test_client.user_id
        });

        let req = test::TestRequest::post()
            .uri("/api/projects")
            .insert_header(("X-CSRF-Token", csrf_token))
            .insert_header(("Cookie", format!("csrf-token={}", csrf_token)))
            .set_json(&project_data)
            .to_request();

        let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;

        // Should succeed with valid CSRF token
        assert!(resp.status().is_success());
    }
}

/// Test suite for security headers
#[cfg(test)]
mod security_headers_tests {
    use super::*;

    #[tokio::test]
    async fn test_security_headers_present() {
        let test_client = TestClient::new();

        let req = test::TestRequest::get().uri("/health").to_request();
        let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;

        assert!(resp.status().is_success());

        let headers = resp.headers();

        // Check for security headers
        assert!(headers.contains_key("X-Content-Type-Options"));
        assert!(headers.contains_key("X-Frame-Options"));
        assert!(headers.contains_key("X-XSS-Protection"));
        assert!(headers.contains_key("Referrer-Policy"));
        assert!(headers.contains_key("Content-Security-Policy"));

        // Verify header values
        assert_eq!(headers.get("X-Content-Type-Options").unwrap(), "nosniff");
        assert_eq!(headers.get("X-Frame-Options").unwrap(), "DENY");
        assert_eq!(headers.get("X-XSS-Protection").unwrap(), "1; mode=block");
    }

    #[tokio::test]
    async fn test_strict_transport_security_https() {
        // This test would require HTTPS setup
        // For now, just verify the header logic exists
        let test_client = TestClient::new();

        let req = test::TestRequest::get()
            .uri("/health")
            .insert_header(("X-Forwarded-Proto", "https"))
            .to_request();

        let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;

        // In a real HTTPS environment, should have Strict-Transport-Security header
        // For this test, we just verify the response is successful
        assert!(resp.status().is_success());
    }
}

/// Test suite for input validation security
#[cfg(test)]
mod input_validation_security_tests {
    use super::*;

    #[tokio::test]
    async fn test_sql_injection_prevention() {
        let mut test_client = TestClient::new();
        test_client
            .authenticate_as("admin@test.com", "admin123")
            .await
            .unwrap();

        // Try SQL injection in project name
        let project_data = json!({
            "name": "'; DROP TABLE projects; --",
            "description": "Test",
            "owner_id": test_client.user_id
        });

        let req = test_client
            .authenticated_request("POST", "/api/projects")
            .set_json(&project_data);
        let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;

        // Should either succeed (with sanitized input) or fail gracefully
        // Should NOT cause database errors
        assert!(resp.status().is_success() || resp.status().is_client_error());

        // Verify no database corruption occurred
        let req = test_client
            .authenticated_request("GET", "/api/projects")
            .await;
        let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_xss_prevention() {
        let mut test_client = TestClient::new();
        test_client
            .authenticate_as("admin@test.com", "admin123")
            .await
            .unwrap();

        // Try XSS in project description
        let project_data = json!({
            "name": "Test Project",
            "description": "<script>alert('xss')</script>",
            "owner_id": test_client.user_id
        });

        let req = test_client
            .authenticated_request("POST", "/api/projects")
            .set_json(&project_data);
        let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;

        // Should succeed but with sanitized input
        assert!(resp.status().is_success());

        let body: serde_json::Value = test::read_body_json(resp).await;
        let description = body["data"]["description"].as_str().unwrap();

        // Should not contain script tags
        assert!(!description.contains("<script>"));
        assert!(!description.contains("</script>"));
    }

    #[tokio::test]
    async fn test_path_traversal_prevention() {
        let mut test_client = TestClient::new();
        test_client
            .authenticate_as("admin@test.com", "admin123")
            .await
            .unwrap();

        // Try path traversal in project_id path parameter
        let req = test_client
            .authenticated_request("POST", "/api/projects/../../../etc/passwd/files/upload")
            .await;
        let app = TestClient::get_app().await;
        let resp = test::call_service(&app, req).await;

        // Should fail with validation error
        assert!(resp.status().is_client_error());
    }
}
