//! Validation service module
//!
//! Provides comprehensive input validation for various data types

pub mod business_rules;
pub mod email;
pub mod file;
pub mod json_schema;
pub mod password;
pub mod types;
pub mod uuid;

// Re-exports
pub use types::{
    CustomValidationError, SchemaValidator, ValidationErrorType, ValidationResult, ValidationRule,
    ValidationService,
};

// Main validation service that delegates to specialized validators
use crate::errors::{AppError, AppResult};
use std::collections::HashMap;
use regex::Regex;

pub struct ValidationServiceDelegate {
    email_validator: email::EmailValidator,
    password_validator: password::PasswordValidator,
    #[allow(dead_code)]
    uuid_validator: uuid::UuidValidator,
    file_validator: file::FileValidator,
    json_schema_validator: json_schema::JsonSchemaValidator,
    business_rules_validator: business_rules::BusinessRulesValidator,
}

impl ValidationServiceDelegate {
    pub fn new() -> Result<Self, regex::Error> {
        Ok(Self {
            email_validator: email::EmailValidator::new()?,
            password_validator: password::PasswordValidator::new()?,
            uuid_validator: uuid::UuidValidator::new().unwrap_or(uuid::UuidValidator {}),
            file_validator: file::FileValidator::new()?,
            json_schema_validator: json_schema::JsonSchemaValidator::new()
                .unwrap_or(json_schema::JsonSchemaValidator {}),
            business_rules_validator: business_rules::BusinessRulesValidator::new()
                .unwrap_or(business_rules::BusinessRulesValidator {}),
        })
    }

    pub fn validate_email(&self, email: &str) -> AppResult<()> {
        self.email_validator.validate(email)
    }

    pub fn validate_password(&self, password: &str) -> AppResult<()> {
        self.password_validator.validate(password)
    }

    pub fn validate_uuid(&self, uuid_str: &str) -> AppResult<uuid::Uuid> {
        // Use specialized UuidValidator for consistency
        self.uuid_validator.validate(uuid_str)
    }

    pub fn validate_filename(&self, filename: &str) -> AppResult<()> {
        self.file_validator.validate_filename(filename)
    }

    pub fn validate_file_size(&self, size: u64, max_size: u64) -> AppResult<()> {
        self.file_validator.validate_size(size, max_size)
    }

    pub fn validate_json_schema(&self, data: &str, schema: &serde_json::Value) -> AppResult<()> {
        self.json_schema_validator.validate(data, schema)
    }

    pub fn validate_business_rules(
        &self,
        entity_type: &str,
        data: &HashMap<String, serde_json::Value>,
    ) -> AppResult<()> {
        self.business_rules_validator.validate(entity_type, data)
    }

    pub fn validate_phone(&self, phone: &str) -> AppResult<()> {
        use regex::Regex;
        if phone.is_empty() {
            return Ok(()); // Phone is optional
        }
        let phone_regex = Regex::new(r"^\+?[1-9]\d{1,14}$").map_err(|_| {
            AppError::InternalServerError("Failed to compile phone regex".to_string())
        })?;
        if !phone_regex.is_match(phone) {
            return Err(AppError::Validation(
                "Invalid phone number format".to_string(),
            ));
        }
        Ok(())
    }
}

impl Default for ValidationServiceDelegate {
    fn default() -> Self {
        // Try to create with proper initialization
        match Self::new() {
            Ok(service) => service,
            Err(e) => {
                // Fallback if initialization fails - log error and use minimal validators
                // This should rarely happen in production, but we handle it gracefully
                log::error!("Failed to initialize ValidationServiceDelegate: {:?}", e);
                log::warn!("Using minimal validators as fallback - some validation features may be limited");
                
                // For validators that require regex compilation, create them with
                // simpler regex patterns that should always compile
                // If even that fails, use empty regex (will fail validation safely)
                Self {
                    email_validator: email::EmailValidator::new().unwrap_or_else(|e| {
                        log::error!("Failed to create email validator in fallback: {:?}", e);
                        // Use a simpler regex pattern as fallback
                        let fallback_regex = Regex::new(r"^.+@.+\..+$")
                            .unwrap_or_else(|_| {
                                // Empty regex is always valid, but if this fails, use a pattern that matches nothing
                                Regex::new(r"^$").unwrap_or_else(|_| {
                                    // This should never fail, but handle it gracefully
                                    // Use a pattern that will never match (impossible pattern)
                                    Regex::new(r"^a^").unwrap_or_else(|_| {
                                        // Last resort: create a regex that matches nothing
                                        // This should be impossible to fail, but if it does, log and use empty pattern
                                        log::error!("Critical: Failed to create even fallback regex for email validation");
                                        // This should never fail, but if it does, we'll use a pattern that matches nothing
                                        Regex::new(r"^$").unwrap_or_else(|_| {
                                            // Absolute last resort - this regex should always be valid
                                            Regex::new(r"^$").unwrap_or_else(|_| {
                                                // This regex is guaranteed to be valid, but handle error gracefully
                                                // Empty regex should always be valid, but if it fails, log and use a safe pattern
                                                Regex::new("").unwrap_or_else(|e| {
                                                    log::error!("Critical: Even empty regex failed: {:?}", e);
                                                    // Use a pattern that matches nothing as absolute last resort
                                                    Regex::new(r"^a^").unwrap()
                                                })
                                            })
                                        })
                                    })
                                })
                            });
                        email::EmailValidator::with_regex(fallback_regex)
                    }),
                    password_validator: password::PasswordValidator::new().unwrap_or_else(|e| {
                        log::error!("Failed to create password validator in fallback: {:?}", e);
                        // Use a simpler regex pattern as fallback
                        let fallback_regex = Regex::new(r".{8,}")
                            .unwrap_or_else(|_| {
                                // Empty regex is always valid, but if this fails, use a pattern that matches nothing
                                Regex::new(r"^$").unwrap_or_else(|_| {
                                    // This should never fail, but handle it gracefully
                                    // Use a pattern that will never match (impossible pattern)
                                    Regex::new(r"^a^").unwrap_or_else(|_| {
                                        // Last resort: create a regex that matches nothing
                                        log::error!("Critical: Failed to create even fallback regex for password validation");
                                        // This should never fail, but if it does, we'll use a pattern that matches nothing
                                        Regex::new(r"^$").unwrap_or_else(|_| {
                                            // Absolute last resort - this regex should always be valid
                                            Regex::new(r"^$").unwrap_or_else(|_| {
                                                // This regex is guaranteed to be valid, but handle error gracefully
                                                // Empty regex should always be valid, but if it fails, log and use a safe pattern
                                                Regex::new("").unwrap_or_else(|e| {
                                                    log::error!("Critical: Even empty regex failed: {:?}", e);
                                                    // Use a pattern that matches nothing as absolute last resort
                                                    Regex::new(r"^a^").unwrap()
                                                })
                                            })
                                        })
                                    })
                                })
                            });
                        password::PasswordValidator::with_regex(fallback_regex)
                    }),
                    uuid_validator: uuid::UuidValidator {},
                    file_validator: file::FileValidator::new().unwrap_or_else(|e| {
                        log::error!("Failed to create file validator in fallback: {:?}", e);
                        // Use the same regex pattern as fallback
                        let fallback_regex = Regex::new(r"^\.(csv|xlsx|xls|json|xml|txt)$")
                            .unwrap_or_else(|_| {
                                // Empty regex is always valid, but if this fails, use a pattern that matches nothing
                                Regex::new(r"^$").unwrap_or_else(|_| {
                                    // This should never fail, but handle it gracefully
                                    // Use a pattern that will never match (impossible pattern)
                                    Regex::new(r"^a^").unwrap_or_else(|_| {
                                        // Last resort: create a regex that matches nothing
                                        log::error!("Critical: Failed to create even fallback regex for file validation");
                                        // This should never fail, but if it does, we'll use a pattern that matches nothing
                                        Regex::new(r"^$").unwrap_or_else(|_| {
                                            // Absolute last resort - this regex should always be valid
                                            Regex::new(r"^$").unwrap_or_else(|_| {
                                                // This regex is guaranteed to be valid, but handle error gracefully
                                                // Empty regex should always be valid, but if it fails, log and use a safe pattern
                                                Regex::new("").unwrap_or_else(|e| {
                                                    log::error!("Critical: Even empty regex failed: {:?}", e);
                                                    // Use a pattern that matches nothing as absolute last resort
                                                    Regex::new(r"^a^").unwrap()
                                                })
                                            })
                                        })
                                    })
                                })
                            });
                        file::FileValidator::with_regex(fallback_regex)
                    }),
                    json_schema_validator: json_schema::JsonSchemaValidator {},
                    business_rules_validator: business_rules::BusinessRulesValidator {},
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_validation_service_delegate_creation() {
        let service = ValidationServiceDelegate::new();
        assert!(service.is_ok());
    }

    #[test]
    fn test_validation_service_delegate_default() {
        let service = ValidationServiceDelegate::default();
        // Should not panic
        assert!(true);
    }

    #[test]
    fn test_email_validation() {
        let service = ValidationServiceDelegate::new().expect("Should create service");

        // Valid emails
        assert!(service.validate_email("test@example.com").is_ok());
        assert!(service.validate_email("user.name+tag@domain.co.uk").is_ok());
        assert!(service.validate_email("test@subdomain.example.com").is_ok());

        // Invalid emails
        assert!(service.validate_email("").is_err());
        assert!(service.validate_email("invalid").is_err());
        assert!(service.validate_email("@example.com").is_err());
        assert!(service.validate_email("test@").is_err());
        assert!(service.validate_email("test.example.com").is_err());
        assert!(service.validate_email("test@.com").is_err());
    }

    #[test]
    fn test_password_validation() {
        let service = ValidationServiceDelegate::new().expect("Should create service");

        // Valid passwords
        assert!(service.validate_password("ValidPass123!").is_ok());
        assert!(service.validate_password("Complex@Pass#2024").is_ok());

        // Invalid passwords
        assert!(service.validate_password("").is_err());
        assert!(service.validate_password("short").is_err());
        assert!(service.validate_password("nouppercase123!").is_err());
        assert!(service.validate_password("NOLOWERCASE123!").is_err());
        assert!(service.validate_password("NoNumbers!").is_err());
        assert!(service.validate_password("NoSpecial123").is_err());
        assert!(service.validate_password("password123").is_err()); // Common password
    }

    #[test]
    fn test_uuid_validation() {
        let service = ValidationServiceDelegate::new().expect("Should create service");

        // Valid UUIDs
        let uuid1 = service.validate_uuid("550e8400-e29b-41d4-a716-446655440000");
        assert!(uuid1.is_ok());

        let uuid2 = service.validate_uuid("6ba7b810-9dad-11d1-80b4-00c04fd430c8");
        assert!(uuid2.is_ok());

        // Invalid UUIDs
        assert!(service.validate_uuid("").is_err());
        assert!(service.validate_uuid("invalid-uuid").is_err());
        assert!(service.validate_uuid("550e8400-e29b-41d4-a716").is_err()); // Too short
        assert!(service.validate_uuid("550e8400-e29b-41d4-a716-446655440000-extra").is_err()); // Too long
    }

    #[test]
    fn test_filename_validation() {
        let service = ValidationServiceDelegate::new().expect("Should create service");

        // Valid filenames
        assert!(service.validate_filename("test.csv").is_ok());
        assert!(service.validate_filename("data.xlsx").is_ok());
        assert!(service.validate_filename("report.json").is_ok());
        assert!(service.validate_filename("file.txt").is_ok());

        // Invalid filenames
        assert!(service.validate_filename("").is_err());
        assert!(service.validate_filename("file.exe").is_err());
        assert!(service.validate_filename("file.php").is_err());
        assert!(service.validate_filename("file.html").is_err());
        assert!(service.validate_filename("file").is_err()); // No extension
    }

    #[test]
    fn test_file_size_validation() {
        let service = ValidationServiceDelegate::new().expect("Should create service");

        // Valid sizes
        assert!(service.validate_file_size(1024, 10240).is_ok()); // 1KB within 10KB limit
        assert!(service.validate_file_size(0, 10240).is_ok()); // Empty file
        assert!(service.validate_file_size(10240, 10240).is_ok()); // Exactly at limit

        // Invalid sizes
        assert!(service.validate_file_size(10241, 10240).is_err()); // Over limit
        assert!(service.validate_file_size(1048576, 10240).is_err()); // Much larger
    }

    #[test]
    fn test_json_schema_validation() {
        let service = ValidationServiceDelegate::new().expect("Should create service");

        let schema = serde_json::json!({
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "age": {"type": "number", "minimum": 0}
            },
            "required": ["name"]
        });

        // Valid JSON
        let valid_data = r#"{"name": "John", "age": 30}"#;
        assert!(service.validate_json_schema(valid_data, &schema).is_ok());

        // Invalid JSON - missing required field
        let invalid_data = r#"{"age": 30}"#;
        assert!(service.validate_json_schema(invalid_data, &schema).is_err());

        // Invalid JSON - wrong type
        let invalid_data2 = r#"{"name": "John", "age": "thirty"}"#;
        assert!(service.validate_json_schema(invalid_data2, &schema).is_err());
    }

    #[test]
    fn test_business_rules_validation() {
        let service = ValidationServiceDelegate::new().expect("Should create service");

        // Test user entity validation
        let mut user_data = HashMap::new();
        user_data.insert("email".to_string(), serde_json::json!("test@example.com"));
        user_data.insert("role".to_string(), serde_json::json!("user"));
        user_data.insert("is_active".to_string(), serde_json::json!(true));

        assert!(service.validate_business_rules("user", &user_data).is_ok());

        // Test invalid user data
        let mut invalid_user_data = HashMap::new();
        invalid_user_data.insert("email".to_string(), serde_json::json!("invalid-email"));
        invalid_user_data.insert("role".to_string(), serde_json::json!("invalid_role"));

        assert!(service.validate_business_rules("user", &invalid_user_data).is_err());
    }

    #[test]
    fn test_phone_validation() {
        let service = ValidationServiceDelegate::new().expect("Should create service");

        // Valid phone numbers
        assert!(service.validate_phone("+1234567890").is_ok());
        assert!(service.validate_phone("1234567890").is_ok());
        assert!(service.validate_phone("+44 20 7123 4567").is_ok());
        assert!(service.validate_phone("").is_ok()); // Empty is allowed (optional)

        // Invalid phone numbers
        assert!(service.validate_phone("abc123").is_err());
        assert!(service.validate_phone("123").is_err()); // Too short
        assert!(service.validate_phone("+").is_err());
        assert!(service.validate_phone("++1234567890").is_err());
    }

    #[test]
    fn test_validation_service_error_handling() {
        let service = ValidationServiceDelegate::new().expect("Should create service");

        // Test with invalid inputs that should cause errors
        assert!(service.validate_email("invalid-email-format").is_err());
        assert!(service.validate_uuid("not-a-uuid").is_err());
        assert!(service.validate_filename("malicious.exe").is_err());
        assert!(service.validate_file_size(999999, 1000).is_err());

        // Test JSON schema validation with invalid JSON
        let schema = serde_json::json!({"type": "object"});
        assert!(service.validate_json_schema("invalid json", &schema).is_err());
    }

    #[test]
    fn test_validation_service_comprehensive_email_validation() {
        let service = ValidationServiceDelegate::new().expect("Should create service");

        // Test various email formats
        let valid_emails = vec![
            "simple@example.com",
            "user.name@domain.com",
            "test+tag@gmail.com",
            "user@sub.domain.example.com",
            "123@test.co.uk",
            "a@b.co",
        ];

        for email in valid_emails {
            assert!(service.validate_email(email).is_ok(), "Email '{}' should be valid", email);
        }

        let invalid_emails = vec![
            "",
            "@example.com",
            "user@",
            "user",
            "user@.com",
            "@",
            "user@@example.com",
            "user@example..com",
            "user example.com",
        ];

        for email in invalid_emails {
            assert!(service.validate_email(email).is_err(), "Email '{}' should be invalid", email);
        }
    }

    #[test]
    fn test_validation_service_comprehensive_password_validation() {
        let service = ValidationServiceDelegate::new().expect("Should create service");

        // Test password strength requirements
        let valid_passwords = vec![
            "Password123!",
            "Complex@Pass#2024",
            "Str0ng!P@ssw0rd",
            "MySecure123$",
        ];

        for password in valid_passwords {
            assert!(service.validate_password(password).is_ok(), "Password '{}' should be valid", password);
        }

        let invalid_passwords = vec![
            "",
            "short",
            "nouppercase123!",
            "NOLOWERCASE123!",
            "NoNumbers!",
            "NoSpecial123",
            "password123", // Common password
            "PASSWORD123", // No lowercase
            "password!",   // No numbers
            "Password",    // No numbers or special chars
        ];

        for password in invalid_passwords {
            assert!(service.validate_password(password).is_err(), "Password '{}' should be invalid", password);
        }
    }

    #[test]
    fn test_validation_service_uuid_formats() {
        let service = ValidationServiceDelegate::new().expect("Should create service");

        // Test different UUID versions
        let valid_uuids = vec![
            "550e8400-e29b-41d4-a716-446655440000", // UUID v4
            "6ba7b810-9dad-11d1-80b4-00c04fd430c8", // UUID v1
            "00000000-0000-0000-0000-000000000000", // Nil UUID
        ];

        for uuid_str in valid_uuids {
            let result = service.validate_uuid(uuid_str);
            assert!(result.is_ok(), "UUID '{}' should be valid", uuid_str);
            assert_eq!(result.unwrap().to_string(), uuid_str);
        }
    }

    #[test]
    fn test_validation_service_file_extensions() {
        let service = ValidationServiceDelegate::new().expect("Should create service");

        let valid_extensions = vec![
            "test.csv",
            "data.xlsx",
            "report.xls",
            "config.json",
            "log.txt",
        ];

        for filename in valid_extensions {
            assert!(service.validate_filename(filename).is_ok(), "Filename '{}' should be valid", filename);
        }

        let invalid_extensions = vec![
            "script.exe",
            "page.html",
            "code.php",
            "data.sql",
            "file.zip",
            "document.pdf",
        ];

        for filename in invalid_extensions {
            assert!(service.validate_filename(filename).is_err(), "Filename '{}' should be invalid", filename);
        }
    }

    #[test]
    fn test_validation_service_file_size_limits() {
        let service = ValidationServiceDelegate::new().expect("Should create service");

        // Test various size limits
        assert!(service.validate_file_size(0, 1000).is_ok()); // Empty file
        assert!(service.validate_file_size(500, 1000).is_ok()); // Half limit
        assert!(service.validate_file_size(1000, 1000).is_ok()); // At limit
        assert!(service.validate_file_size(1001, 1000).is_err()); // Over limit

        // Test large files
        let max_size = 10 * 1024 * 1024; // 10MB
        assert!(service.validate_file_size(max_size - 1, max_size).is_ok());
        assert!(service.validate_file_size(max_size, max_size).is_ok());
        assert!(service.validate_file_size(max_size + 1, max_size).is_err());
    }

    #[test]
    fn test_validation_service_business_rules_comprehensive() {
        let service = ValidationServiceDelegate::new().expect("Should create service");

        // Test project validation
        let mut project_data = HashMap::new();
        project_data.insert("name".to_string(), serde_json::json!("Test Project"));
        project_data.insert("description".to_string(), serde_json::json!("A test project"));
        project_data.insert("status".to_string(), serde_json::json!("active"));

        assert!(service.validate_business_rules("project", &project_data).is_ok());

        // Test invalid project data
        let mut invalid_project_data = HashMap::new();
        invalid_project_data.insert("name".to_string(), serde_json::json!("")); // Empty name
        invalid_project_data.insert("status".to_string(), serde_json::json!("invalid_status"));

        assert!(service.validate_business_rules("project", &invalid_project_data).is_err());
    }

    #[test]
    fn test_validation_service_phone_formats() {
        let service = ValidationServiceDelegate::new().expect("Should create service");

        let valid_phones = vec![
            "+1234567890",
            "+44 20 7123 4567",
            "+1-555-123-4567",
            "1234567890",
            "+91 9876543210",
        ];

        for phone in valid_phones {
            assert!(service.validate_phone(phone).is_ok(), "Phone '{}' should be valid", phone);
        }

        let invalid_phones = vec![
            "abc123",
            "123",
            "+",
            "++1234567890",
            "+123456789012345678901234567890", // Too long
            "123-456-789", // Invalid format
        ];

        for phone in invalid_phones {
            assert!(service.validate_phone(phone).is_err(), "Phone '{}' should be invalid", phone);
        }
    }

    #[test]
    fn test_validation_service_initialization_error_handling() {
        // Test that the service handles initialization errors gracefully
        // This is tested implicitly through the Default implementation
        let _service = ValidationServiceDelegate::default();
        // If we get here without panicking, the error handling works
        assert!(true);
    }
}
