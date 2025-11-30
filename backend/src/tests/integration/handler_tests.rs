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
    use crate::handlers;
    use actix_web::{http::StatusCode, test, App};

    // Note: These tests require a running database and configured services
    // For now, we are scaffolding the tests. In a real implementation,
    // we would use the helpers::create_test_app() which sets up all dependencies.

    #[actix_web::test]
    async fn test_login_with_valid_credentials() {
        // Setup
        let app = test::init_service(App::new().configure(handlers::configure_routes)).await;

        // Execute
        let req = test::TestRequest::post()
            .uri("/api/v1/auth/login")
            .set_json(serde_json::json!({
                "email": "test@example.com",
                "password": "password123"
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;

        // Verify
        assert_eq!(resp.status(), StatusCode::OK);
    }

    #[actix_web::test]
    #[ignore]
    async fn test_login_with_invalid_credentials() {
        let app = test::init_service(App::new().configure(handlers::configure_routes)).await;

        let req = test::TestRequest::post()
            .uri("/api/v1/auth/login")
            .set_json(serde_json::json!({
                "email": "test@example.com",
                "password": "wrongpassword"
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;

        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    }
}

#[cfg(test)]
mod project_tests {
    use crate::handlers;
    use actix_web::{http::StatusCode, test, App};

    #[actix_web::test]
    #[ignore]
    async fn test_list_projects_requires_auth() {
        let app = test::init_service(App::new().configure(handlers::configure_routes)).await;

        let req = test::TestRequest::get()
            .uri("/api/v1/projects")
            .to_request();

        let resp = test::call_service(&app, req).await;

        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    }
}

#[cfg(test)]
mod security_tests {
    // TODO: Add security endpoint tests
    // - Test list policies
    // - Test compliance reports
    // - Test audit logs
}
