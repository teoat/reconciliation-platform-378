#!/bin/bash
# ============================================================================
# CREATE INTEGRATION TESTS
# ============================================================================
# Generates integration tests for API endpoints
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

BACKEND_DIR="$SCRIPT_DIR/../backend"

log_info "Creating integration tests..."

cat > "$BACKEND_DIR/tests/integration/auth_api_test.rs" << 'EOF'
#[cfg(test)]
mod tests {
    use actix_web::{test, web, App};
    use reconciliation_backend::handlers;
    use serde_json::json;

    async fn create_test_app() -> impl actix_web::dev::Service<actix_web::dev::Request, Response = actix_web::dev::ServiceResponse, Error = actix_web::Error> {
        test::init_service(
            App::new()
                .configure(handlers::configure_routes)
        ).await
    }

    #[actix_web::test]
    async fn test_health_endpoint() {
        let app = create_test_app().await;
        let req = test::TestRequest::get().uri("/api/health").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[actix_web::test]
    async fn test_login_flow() {
        let app = create_test_app().await;
        
        // Test login with invalid credentials
        let req = test::TestRequest::post()
            .uri("/api/auth/login")
            .set_json(&json!({
                "email": "test@example.com",
                "password": "wrongpassword"
            }))
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        // Should return 401 Unauthorized
        assert_eq!(resp.status(), 401);
    }

    #[actix_web::test]
    async fn test_register_validation() {
        let app = create_test_app().await;
        
        // Test registration with invalid email
        let req = test::TestRequest::post()
            .uri("/api/auth/register")
            .set_json(&json!({
                "email": "invalid-email",
                "password": "password123",
                "first_name": "Test",
                "last_name": "User"
            }))
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        // Should return 400 Bad Request
        assert_eq!(resp.status(), 400);
    }

    #[actix_web::test]
    async fn test_projects_endpoint_requires_auth() {
        let app = create_test_app().await;
        let req = test::TestRequest::get().uri("/api/projects").to_request();
        let resp = test::call_service(&app, req).await;
        // Should return 401 Unauthorized (no auth token)
        assert_eq!(resp.status(), 401);
    }
}
EOF

log_success "✓ Integration tests created"
log_info "Run integration tests with: cd backend && cargo test --test integration"

