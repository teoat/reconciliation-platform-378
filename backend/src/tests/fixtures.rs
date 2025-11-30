// Test fixtures for backend tests

use serde_json::json;

/// Create a test user fixture
pub fn test_user() -> serde_json::Value {
    json!({
        "id": "test-user-123",
        "username": "testuser",
        "email": "test@example.com",
        "role": "user"
    })
}

/// Create a test project fixture
pub fn test_project() -> serde_json::Value {
    json!({
        "id": "test-project-123",
        "name": "Test Project",
        "description": "A test project",
        "status": "active"
    })
}

/// Create a test auth token
pub fn test_auth_token() -> String {
    "test-token-123".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fixtures_serialize() {
        let user = test_user();
        assert!(user["id"].is_string());

        let project = test_project();
        assert!(project["name"].is_string());

        let token = test_auth_token();
        assert!(!token.is_empty());
    }
}
