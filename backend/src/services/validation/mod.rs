//! Validation service module
//! 
//! Provides comprehensive input validation for various data types

pub mod email;
pub mod password;
pub mod uuid;
pub mod file;
pub mod json_schema;
pub mod business_rules;
pub mod types;

// Re-exports
pub use types::{ValidationResult, CustomValidationError, ValidationService, SchemaValidator, ValidationRule, ValidationErrorType};

// Main validation service that delegates to specialized validators
use crate::errors::{AppError, AppResult};
use std::collections::HashMap;

pub struct ValidationServiceDelegate {
    email_validator: email::EmailValidator,
    password_validator: password::PasswordValidator,
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
            uuid_validator: uuid::UuidValidator::new().unwrap_or_else(|_| uuid::UuidValidator {}),
            file_validator: file::FileValidator::new()?,
            json_schema_validator: json_schema::JsonSchemaValidator::new().unwrap_or_else(|_| json_schema::JsonSchemaValidator {}),
            business_rules_validator: business_rules::BusinessRulesValidator::new().unwrap_or_else(|_| business_rules::BusinessRulesValidator {}),
        })
    }

    pub fn validate_email(&self, email: &str) -> AppResult<()> {
        self.email_validator.validate(email)
    }

    pub fn validate_password(&self, password: &str) -> AppResult<()> {
        self.password_validator.validate(password)
    }

    pub fn validate_uuid(&self, uuid_str: &str) -> AppResult<uuid::Uuid> {
        uuid::Uuid::parse_str(uuid_str)
            .map_err(|_| crate::errors::AppError::Validation("Invalid UUID format".to_string()))
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

    pub fn validate_business_rules(&self, entity_type: &str, data: &HashMap<String, serde_json::Value>) -> AppResult<()> {
        self.business_rules_validator.validate(entity_type, data)
    }

    pub fn validate_phone(&self, phone: &str) -> AppResult<()> {
        use regex::Regex;
        if phone.is_empty() {
            return Ok(()); // Phone is optional
        }
        let phone_regex = Regex::new(r"^\+?[1-9]\d{1,14}$")
            .map_err(|_| AppError::InternalServerError("Failed to compile phone regex".to_string()))?;
        if !phone_regex.is_match(phone) {
            return Err(AppError::Validation("Invalid phone number format".to_string()));
        }
        Ok(())
    }
}

impl Default for ValidationServiceDelegate {
    fn default() -> Self {
        Self::new().unwrap_or_else(|e| {
            // Fallback if initialization fails - create with empty validators
            log::error!("Failed to initialize ValidationServiceDelegate: {:?}", e);
            Self {
                email_validator: email::EmailValidator::new().expect("Failed to create email validator"),
                password_validator: password::PasswordValidator::new().expect("Failed to create password validator"),
                uuid_validator: uuid::UuidValidator {},
                file_validator: file::FileValidator::new().expect("Failed to create file validator"),
                json_schema_validator: json_schema::JsonSchemaValidator {},
                business_rules_validator: business_rules::BusinessRulesValidator {},
            }
        })
    }
}

