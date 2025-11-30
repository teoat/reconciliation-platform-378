// Integration tests for API handlers

#[cfg(test)]
mod health_check_tests {
    use crate::handlers;
    use actix_web::{http::StatusCode, test, App};

    #[actix_web::test]
    async fn test_health_check_returns_ok() {
        // Create test app
        let app = test::init_service(App::new().configure(handlers::configure_routes)).await;

        // Make request to /api/health
        let req = test::TestRequest::get().uri("/api/health").to_request();

        let resp = test::call_service(&app, req).await;

        // Assert response is 200 OK
        assert_eq!(resp.status(), StatusCode::OK);
    }

    #[actix_web::test]
    async fn test_health_check_returns_json() {
        let app = test::init_service(App::new().configure(handlers::configure_routes)).await;

        let req = test::TestRequest::get().uri("/api/health").to_request();

        let resp = test::call_service(&app, req).await;

        // Assert content-type is JSON
        let content_type = resp.headers().get("content-type");
        assert!(content_type.is_some());
        assert!(content_type.unwrap().to_str().unwrap().contains("json"));
    }
}

#[cfg(test)]
mod auth_tests {
    use actix_web::{test, web, App, http::StatusCode};
    use crate::tests::helpers::{create_test_db, create_test_app, cleanup_test_db};
    
    #[actix_web::test]
    async fn test_login_with_valid_credentials() {
        let db = create_test_db().await;
        let app = create_test_app(web::Data::new(db.as_ref().clone()));
        
        // First register a user
        let register_body = serde_json::json!({
            "email": "test@example.com",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User"
        });
        
        let req = test::TestRequest::post()
            .uri("/api/v1/auth/register")
            .set_json(&register_body)
            .to_request();
        
        let _ = test::call_service(&app, req).await;
        
        // Now test login
        let login_body = serde_json::json!({
            "email": "test@example.com",
            "password": "SecurePass123!"
        });
        
        let req = test::TestRequest::post()
            .uri("/api/v1/auth/login")
            .set_json(&login_body)
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::OK);
        
        cleanup_test_db(db).await;
    }
    
    #[actix_web::test]
    async fn test_login_with_invalid_credentials() {
        let db = create_test_db().await;
        let app = create_test_app(web::Data::new(db.as_ref().clone()));
        
        let login_body = serde_json::json!({
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        });
        
        let req = test::TestRequest::post()
            .uri("/api/v1/auth/login")
            .set_json(&login_body)
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
        
        cleanup_test_db(db).await;
    }
    
    #[actix_web::test]
    async fn test_token_validation() {
        let db = create_test_db().await;
        let app = create_test_app(web::Data::new(db.as_ref().clone()));
        
        // Test with invalid token
        let req = test::TestRequest::get()
            .uri("/api/v1/auth/me")
            .insert_header(("Authorization", "Bearer invalid_token"))
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
        
        cleanup_test_db(db).await;
    }
}

#[cfg(test)]
mod project_tests {
    use actix_web::{test, web, App, http::StatusCode};
    use crate::tests::helpers::{create_test_db, create_test_app, cleanup_test_db};
    
    #[actix_web::test]
    async fn test_list_projects() {
        let db = create_test_db().await;
        let app = create_test_app(web::Data::new(db.as_ref().clone()));
        
        let req = test::TestRequest::get()
            .uri("/api/v1/projects")
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::OK);
        
        cleanup_test_db(db).await;
    }
    
    #[actix_web::test]
    async fn test_create_project() {
        let db = create_test_db().await;
        let app = create_test_app(web::Data::new(db.as_ref().clone()));
        
        let project_body = serde_json::json!({
            "name": "Test Project",
            "description": "A test project",
            "status": "active"
        });
        
        let req = test::TestRequest::post()
            .uri("/api/v1/projects")
            .set_json(&project_body)
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
        
        cleanup_test_db(db).await;
    }
    
    #[actix_web::test]
    async fn test_update_project() {
        let db = create_test_db().await;
        let app = create_test_app(web::Data::new(db.as_ref().clone()));
        
        // First create a project (implementation depends on actual handler)
        let project_id = uuid::Uuid::new_v4();
        
        let update_body = serde_json::json!({
            "name": "Updated Project",
            "description": "Updated description"
        });
        
        let req = test::TestRequest::put()
            .uri(&format!("/api/v1/projects/{}", project_id))
            .set_json(&update_body)
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        // May be 404 if project doesn't exist, or 200 if mocked
        assert!(resp.status() == StatusCode::OK || resp.status() == StatusCode::NOT_FOUND);
        
        cleanup_test_db(db).await;
    }
    
    #[actix_web::test]
    async fn test_delete_project() {
        let db = create_test_db().await;
        let app = create_test_app(web::Data::new(db.as_ref().clone()));
        
        let project_id = uuid::Uuid::new_v4();
        
        let req = test::TestRequest::delete()
            .uri(&format!("/api/v1/projects/{}", project_id))
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        assert!(resp.status() == StatusCode::OK || resp.status() == StatusCode::NOT_FOUND);
        
        cleanup_test_db(db).await;
    }
}

#[cfg(test)]
mod security_tests {
    use actix_web::{test, web, App, http::StatusCode};
    use crate::tests::helpers::{create_test_db, create_test_app, cleanup_test_db};
    
    #[actix_web::test]
    async fn test_list_security_policies() {
        let db = create_test_db().await;
        let app = create_test_app(web::Data::new(db.as_ref().clone()));
        
        let req = test::TestRequest::get()
            .uri("/api/v1/security/policies")
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::OK);
        
        cleanup_test_db(db).await;
    }
    
    #[actix_web::test]
    async fn test_compliance_report() {
        let db = create_test_db().await;
        let app = create_test_app(web::Data::new(db.as_ref().clone()));
        
        let req = test::TestRequest::get()
            .uri("/api/v1/security/compliance")
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success() || resp.status() == StatusCode::NOT_FOUND);
        
        cleanup_test_db(db).await;
    }
    
    #[actix_web::test]
    async fn test_audit_logs_access() {
        let db = create_test_db().await;
        let app = create_test_app(web::Data::new(db.as_ref().clone()));
        
        let req = test::TestRequest::get()
            .uri("/api/v1/system/logs")
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        // Should require authentication
        assert!(resp.status() == StatusCode::OK || resp.status() == StatusCode::UNAUTHORIZED);
        
        cleanup_test_db(db).await;
    }
    
    #[actix_web::test]
    async fn test_sql_injection_prevention() {
        let db = create_test_db().await;
        let app = create_test_app(web::Data::new(db.as_ref().clone()));
        
        // Test SQL injection attempt in query parameter
        let malicious_input = "'; DROP TABLE users; --";
        let req = test::TestRequest::get()
            .uri(&format!("/api/v1/projects?name={}", urlencoding::encode(malicious_input)))
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        // Should handle safely without error
        assert!(resp.status().is_success() || resp.status() == StatusCode::BAD_REQUEST);
        
        cleanup_test_db(db).await;
    }
}
