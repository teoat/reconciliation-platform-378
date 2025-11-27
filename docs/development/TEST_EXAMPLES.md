# Backend Test Examples

## Overview
This document provides examples of common testing patterns for the reconciliation platform backend.

## Unit Test Examples

### Service Layer Test
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::*;

    #[tokio::test]
    async fn test_reconciliation_service_creates_job() {
        // Arrange
        let db = database::create_test_db().await;
        let test_project = TestProject::new(Uuid::new_v4());
        let service = ReconciliationService::new(db);

        // Act
        let job = service.create_job(test_project.id, "Test Job").await;

        // Assert
        assert!(job.is_ok());
        let job = job.unwrap();
        assert_eq!(job.name, "Test Job");
    }
}
```

### Handler Test
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::*;
    use actix_web::{test, web, App};

    #[tokio::test]
    async fn test_create_project_handler() {
        // Arrange
        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(create_test_db().await))
                .route("/api/projects", web::post().to(create_project))
        ).await;

        let test_user = TestUser::new();
        let token = create_test_token(&test_user);

        // Act
        let req = test::TestRequest::post()
            .uri("/api/projects")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(json!({
                "name": "Test Project",
                "description": "A test project"
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;

        // Assert
        assert!(resp.status().is_success());
    }
}
```

### Database Test
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::*;

    #[tokio::test]
    async fn test_database_connection() {
        // Arrange
        let db = database::create_test_db().await;

        // Act
        let result = db.get_connection();

        // Assert
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_database_cleanup() {
        // Arrange
        let db = database::create_test_db().await;
        let test_data = database::setup_test_data(&db).await.unwrap();

        // Act
        let result = database::cleanup_test_data(&db).await;

        // Assert
        assert!(result.is_ok());
    }
}
```

## Integration Test Examples

### API Endpoint Test
```rust
#[tokio::test]
async fn test_authentication_flow() {
    // Arrange
    let app = test_utils::http::create_test_app().await.unwrap();
    let test_user = TestUser::new();

    // Act - Register
    let register_req = test::TestRequest::post()
        .uri("/api/auth/register")
        .set_json(json!({
            "email": test_user.email,
            "password": test_user.password,
            "first_name": test_user.first_name,
            "last_name": test_user.last_name
        }))
        .to_request();

    let register_resp = test::call_service(&app, register_req).await;
    assert!(register_resp.status().is_success());

    // Act - Login
    let login_req = test::TestRequest::post()
        .uri("/api/auth/login")
        .set_json(json!({
            "email": test_user.email,
            "password": test_user.password
        }))
        .to_request();

    let login_resp = test::call_service(&app, login_req).await;
    assert!(login_resp.status().is_success());

    // Assert
    let body: serde_json::Value = test::read_body_json(login_resp).await;
    assert!(body["token"].is_string());
}
```

## Performance Test Examples

```rust
use crate::test_utils::performance::*;

#[tokio::test]
async fn test_reconciliation_performance() {
    // Arrange
    let service = ReconciliationService::new(create_test_db().await);
    let test_data = generate_test_data(1000);

    // Act
    let (result, duration) = measure_time(|| {
        service.process_reconciliation(test_data)
    });

    // Assert
    assert_performance_threshold(duration, Duration::from_secs(5));
    assert!(result.is_ok());
}
```

## Mock Examples

```rust
use crate::test_utils::mock::*;

#[tokio::test]
async fn test_with_mock_redis() {
    // Arrange
    let mock_redis = MockRedisClient::new();
    let service = CacheService::new(mock_redis);

    // Act
    service.set("key", "value").await.unwrap();
    let value = service.get("key").await.unwrap();

    // Assert
    assert_eq!(value, Some("value".to_string()));
}
```

## Test Patterns

### 1. Arrange-Act-Assert (AAA)
Always structure tests with clear sections:
- **Arrange**: Set up test data and dependencies
- **Act**: Execute the code under test
- **Assert**: Verify the results

### 2. Test Isolation
- Each test should be independent
- Use `setup_test_data()` and `cleanup_test_data()` for database tests
- Use unique identifiers (UUIDs) to avoid conflicts

### 3. Error Testing
```rust
#[tokio::test]
async fn test_handles_invalid_input() {
    // Arrange
    let service = ValidationService::new();

    // Act
    let result = service.validate("invalid").await;

    // Assert
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), AppError::ValidationError);
}
```

### 4. Async Testing
Always use `#[tokio::test]` for async functions:
```rust
#[tokio::test]
async fn test_async_operation() {
    let result = async_function().await;
    assert!(result.is_ok());
}
```

## Best Practices

1. **Use Test Fixtures**: Leverage `TestUser`, `TestProject`, etc.
2. **Clean Up**: Always clean up test data after tests
3. **Isolation**: Each test should be independent
4. **Naming**: Use descriptive test names (`test_<what>_<when>_<expected>`)
5. **Error Handling**: Test both success and error paths
6. **Performance**: Use performance utilities for timing tests

---

**Last Updated**: January 2025

