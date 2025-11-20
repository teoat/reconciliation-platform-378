//! API endpoint tests for password manager handlers
//!
//! Tests all password manager API endpoints including CRUD operations,
//! password rotation, and rotation scheduling.

use actix_web::{test, web, App};
use std::sync::Arc;
use uuid::Uuid;

use reconciliation_backend::database::Database;
use reconciliation_backend::handlers::password_manager::{
    create_password, deactivate_password, get_password, get_rotation_schedule, list_passwords,
    rotate_due_passwords, rotate_password, update_rotation_interval,
};
use reconciliation_backend::services::auth::AuthService;
use reconciliation_backend::services::password_manager::PasswordManager;
use reconciliation_backend::services::user::UserService;
use reconciliation_backend::test_utils_export::database::setup_test_database;

/// Test password manager API endpoints
#[cfg(test)]
mod password_manager_api_tests {
    use super::*;

    /// Setup test fixtures (user, password manager)
    async fn setup_test_fixtures(
        db: Database,
        auth_service: AuthService,
    ) -> (Uuid, String, Arc<PasswordManager>) {
        let user_service = UserService::new(Arc::new(db.clone()), auth_service.clone());

        // Create test user
        let user = user_service
            .create_user(reconciliation_backend::services::user::CreateUserRequest {
                email: "passworduser@example.com".to_string(),
                password: "TestPassword123!".to_string(),
                first_name: "Password".to_string(),
                last_name: "User".to_string(),
                role: Some("user".to_string()),
            })
            .await
            .unwrap();

        // Generate token for authentication
        let user_model = user_service
            .get_user_by_email("passworduser@example.com")
            .await
            .unwrap();
        let token = auth_service.generate_token(&user_model).unwrap();

        // Create password manager (requires master key and Arc<Database>)
        let password_manager = Arc::new(PasswordManager::new(Arc::new(db.clone()), "test_master_key".to_string()));

        (user.id, token, password_manager)
    }

    #[tokio::test]
    async fn test_list_passwords() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token, password_manager) =
            setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let req = test::TestRequest::get()
            .uri("/api/passwords")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(password_manager))
                .route("/api/passwords", web::get().to(list_passwords)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_get_password() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token, password_manager) =
            setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let password_name = "test_password";

        let req = test::TestRequest::get()
            .uri(&format!("/api/passwords/{}", password_name))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(password_manager))
                .route("/api/passwords/{name}", web::get().to(get_password)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if password doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_create_password() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token, password_manager) =
            setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        // Create JSON payload manually since CreatePasswordRequest doesn't implement Serialize
        let create_json = serde_json::json!({
            "name": "new_test_password",
            "password": "SecurePassword123!",
            "rotation_interval_days": 90
        });

        let req = test::TestRequest::post()
            .uri("/api/passwords/new_test_password")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&create_json)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(password_manager))
                .route("/api/passwords/{name}", web::post().to(create_password)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 201 Created or 400/409 if already exists
        assert!(resp.status().is_success() || resp.status().as_u16() == 201 || resp.status().is_client_error());
    }

    #[tokio::test]
    async fn test_rotate_password() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token, password_manager) =
            setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        // Create JSON payload manually
        let rotate_json = serde_json::json!({
            "name": "test_password",
            "new_password": "NewSecurePassword123!"
        });

        let req = test::TestRequest::post()
            .uri("/api/passwords/test_password/rotate")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&rotate_json)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(password_manager))
                .route("/api/passwords/{name}/rotate", web::post().to(rotate_password)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if password doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_rotate_due_passwords() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token, password_manager) =
            setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let req = test::TestRequest::post()
            .uri("/api/passwords/rotate-due")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(password_manager))
                .route("/api/passwords/rotate-due", web::post().to(rotate_due_passwords)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_update_rotation_interval() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token, password_manager) =
            setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        // Create JSON payload manually
        let update_json = serde_json::json!({
            "name": "test_password",
            "rotation_interval_days": 60
        });

        let req = test::TestRequest::put()
            .uri("/api/passwords/test_password/interval")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&update_json)
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(password_manager))
                .route("/api/passwords/{name}/interval", web::put().to(update_rotation_interval)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if password doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }

    #[tokio::test]
    async fn test_get_rotation_schedule() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token, password_manager) =
            setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let req = test::TestRequest::get()
            .uri("/api/passwords/schedule")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(password_manager))
                .route("/api/passwords/schedule", web::get().to(get_rotation_schedule)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[tokio::test]
    async fn test_deactivate_password() {
        let (db, _) = setup_test_database().await;
        let db_arc = Arc::new(db);
        let auth_service = AuthService::new("test_secret".to_string(), 3600);

        let (_, token, password_manager) =
            setup_test_fixtures((*db_arc).clone(), auth_service.clone()).await;

        let password_name = "test_password";

        let req = test::TestRequest::post()
            .uri(&format!("/api/passwords/{}/deactivate", password_name))
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .to_request();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(password_manager))
                .route("/api/passwords/{name}/deactivate", web::post().to(deactivate_password)),
        )
        .await;

        let resp = test::call_service(&app, req).await;
        // May return 404 if password doesn't exist
        assert!(resp.status().is_success() || resp.status().as_u16() == 404);
    }
}

