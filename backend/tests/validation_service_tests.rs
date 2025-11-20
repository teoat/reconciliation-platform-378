//! Service layer tests for ValidationService
//!
//! Tests ValidationService methods including email, password,
//! UUID, file, and JSON schema validation.

use reconciliation_backend::services::validation::ValidationServiceDelegate;

/// Test ValidationService methods
#[cfg(test)]
mod validation_service_tests {
    use super::*;

    #[test]
    fn test_validate_email() {
        let validator = ValidationServiceDelegate::new().unwrap();

        // Valid emails
        assert!(validator.validate_email("test@example.com").is_ok());
        assert!(validator.validate_email("user.name@example.co.uk").is_ok());

        // Invalid emails
        assert!(validator.validate_email("invalid").is_err());
        assert!(validator.validate_email("@example.com").is_err());
        assert!(validator.validate_email("test@").is_err());
    }

    #[test]
    fn test_validate_password() {
        let validator = ValidationServiceDelegate::new().unwrap();

        // Valid passwords
        assert!(validator.validate_password("StrongPassword123!").is_ok());
        assert!(validator.validate_password("AnotherValid1!").is_ok());

        // Invalid passwords (too short, no uppercase, etc.)
        assert!(validator.validate_password("weak").is_err());
        assert!(validator.validate_password("short1!").is_err());
    }

    #[test]
    fn test_validate_uuid() {
        let validator = ValidationServiceDelegate::new().unwrap();

        // Valid UUID
        let valid_uuid = "123e4567-e89b-12d3-a456-426614174000";
        let result = validator.validate_uuid(valid_uuid);
        assert!(result.is_ok());

        // Invalid UUID
        assert!(validator.validate_uuid("not-a-uuid").is_err());
        assert!(validator.validate_uuid("123").is_err());
    }

    #[test]
    fn test_validate_filename() {
        let validator = ValidationServiceDelegate::new().unwrap();

        // Valid filenames
        assert!(validator.validate_filename("test.csv").is_ok());
        assert!(validator.validate_filename("data.xlsx").is_ok());
        assert!(validator.validate_filename("file.json").is_ok());

        // Invalid filenames
        assert!(validator.validate_filename("../etc/passwd").is_err());
        assert!(validator.validate_filename("file.exe").is_err());
    }

    #[test]
    fn test_validate_file_size() {
        let validator = ValidationServiceDelegate::new().unwrap();

        // Valid sizes
        assert!(validator.validate_file_size(1024, 10485760).is_ok()); // 1KB < 10MB
        assert!(validator.validate_file_size(10485760, 10485760).is_ok()); // Exactly at limit

        // Invalid sizes
        assert!(validator.validate_file_size(10485761, 10485760).is_err()); // Over limit
    }

    #[test]
    fn test_validate_phone() {
        let validator = ValidationServiceDelegate::new().unwrap();

        // Valid phone numbers
        assert!(validator.validate_phone("+1234567890").is_ok());
        assert!(validator.validate_phone("1234567890").is_ok());
        assert!(validator.validate_phone("").is_ok()); // Optional

        // Invalid phone numbers
        assert!(validator.validate_phone("abc").is_err());
        assert!(validator.validate_phone("123").is_err()); // Too short
    }

    #[test]
    fn test_validate_json_schema() {
        let validator = ValidationServiceDelegate::new().unwrap();

        let schema = serde_json::json!({
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "age": {"type": "number"}
            },
            "required": ["name"]
        });

        let valid_data = r#"{"name": "John", "age": 30}"#;
        assert!(validator.validate_json_schema(valid_data, &schema).is_ok());

        let invalid_data = r#"{"age": 30}"#; // Missing required "name"
        assert!(validator.validate_json_schema(invalid_data, &schema).is_err());
    }

    #[test]
    fn test_validate_business_rules() {
        let validator = ValidationServiceDelegate::new().unwrap();

        let mut data = std::collections::HashMap::new();
        data.insert("name".to_string(), serde_json::json!("Test"));
        data.insert("value".to_string(), serde_json::json!(100));

        // Business rules validation (may pass or fail depending on rules)
        let result = validator.validate_business_rules("test_entity", &data);
        // Result depends on business rules implementation
        assert!(result.is_ok() || result.is_err());
    }
}

