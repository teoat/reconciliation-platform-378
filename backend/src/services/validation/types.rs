//! Validation types and common structures

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use regex::Regex;

use crate::errors::{AppError, AppResult};

/// Validation result for data validation operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub errors: Vec<CustomValidationError>,
    pub warnings: Vec<String>,
}

/// Validation error with detailed information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomValidationError {
    pub field: String,
    pub code: String,
    pub message: String,
    pub value: Option<serde_json::Value>,
}

/// Input validation service (backward compatibility wrapper)
#[derive(Clone)]
pub struct ValidationService {
    email_regex: Regex,
    phone_regex: Regex,
    password_regex: Regex,
    file_extension_regex: Regex,
}

impl ValidationService {
    pub fn new() -> Result<Self, regex::Error> {
        Ok(Self {
            email_regex: Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")?,
            phone_regex: Regex::new(r"^\+?[1-9]\d{1,14}$")?,
            password_regex: Regex::new(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$")?,
            file_extension_regex: Regex::new(r"^\.(csv|xlsx|xls|json|xml|txt)$")?,
        })
    }

    pub fn validate_email(&self, email: &str) -> AppResult<()> {
        use super::email::EmailValidator;
        let validator = EmailValidator::new()
            .map_err(|e| AppError::InternalServerError(format!("Failed to create email validator: {:?}", e)))?;
        validator.validate(email)
    }

    pub fn validate_password(&self, password: &str) -> AppResult<()> {
        use super::password::PasswordValidator;
        let validator = PasswordValidator::new()
            .map_err(|e| AppError::InternalServerError(format!("Failed to create password validator: {:?}", e)))?;
        validator.validate(password)
    }

    pub fn validate_phone(&self, phone: &str) -> AppResult<()> {
        if phone.is_empty() {
            return Ok(()); // Phone is optional
        }
        if !self.phone_regex.is_match(phone) {
            return Err(AppError::Validation("Invalid phone number format".to_string()));
        }
        Ok(())
    }

    pub fn validate_uuid(&self, uuid_str: &str) -> AppResult<uuid::Uuid> {
        uuid::Uuid::parse_str(uuid_str)
            .map_err(|_| AppError::Validation("Invalid UUID format".to_string()))
    }

    pub fn validate_filename(&self, filename: &str) -> AppResult<()> {
        use super::file::FileValidator;
        let validator = FileValidator::new()
            .map_err(|e| AppError::InternalServerError(format!("Failed to create file validator: {:?}", e)))?;
        validator.validate_filename(filename)
    }

    pub fn validate_file_size(&self, size: u64, max_size: u64) -> AppResult<()> {
        use super::file::FileValidator;
        let validator = FileValidator::new()
            .map_err(|e| AppError::InternalServerError(format!("Failed to create file validator: {:?}", e)))?;
        validator.validate_size(size, max_size)
    }

    pub fn validate_csv_structure(&self, data: &str) -> AppResult<Vec<String>> {
        let lines: Vec<&str> = data.lines().collect();
        
        if lines.is_empty() {
            return Err(AppError::Validation("CSV file is empty".to_string()));
        }

        let header_line = lines[0];
        let headers: Vec<String> = header_line.split(',').map(|s| s.trim().to_string()).collect();

        if headers.is_empty() {
            return Err(AppError::Validation("CSV file has no headers".to_string()));
        }

        // Check for duplicate headers
        let mut seen_headers = std::collections::HashSet::new();
        for header in &headers {
            if !seen_headers.insert(header) {
                return Err(AppError::Validation(
                    format!("Duplicate header found: {}", header)
                ));
            }
        }

        // Validate data rows
        for (line_num, line) in lines.iter().enumerate().skip(1) {
            let fields: Vec<&str> = line.split(',').collect();
            if fields.len() != headers.len() {
                return Err(AppError::Validation(
                    format!("Row {} has {} fields, expected {}", line_num + 1, fields.len(), headers.len())
                ));
            }
        }

        Ok(headers)
    }

    pub fn validate_json_schema(&self, data: &str, schema: &serde_json::Value) -> AppResult<()> {
        use super::json_schema::JsonSchemaValidator;
        let validator = JsonSchemaValidator::new()?;
        validator.validate(data, schema)
    }

    pub fn validate_data_integrity(&self, data: &HashMap<String, serde_json::Value>) -> AppResult<()> {
        // Check for required fields
        let required_fields = vec!["id", "created_at", "updated_at"];
        for field in required_fields {
            if !data.contains_key(field) {
                return Err(AppError::Validation(
                    format!("Required field '{}' is missing", field)
                ));
            }
        }

        // Validate ID format
        if let Some(id_value) = data.get("id") {
            if let Some(id_str) = id_value.as_str() {
                self.validate_uuid(id_str)?;
            }
        }

        // Validate timestamps
        if let Some(created_at) = data.get("created_at") {
            if let Some(created_at_str) = created_at.as_str() {
                chrono::DateTime::parse_from_rfc3339(created_at_str)
                    .map_err(|_| AppError::Validation("Invalid created_at timestamp format".to_string()))?;
            }
        }

        if let Some(updated_at) = data.get("updated_at") {
            if let Some(updated_at_str) = updated_at.as_str() {
                chrono::DateTime::parse_from_rfc3339(updated_at_str)
                    .map_err(|_| AppError::Validation("Invalid updated_at timestamp format".to_string()))?;
            }
        }

        Ok(())
    }

    pub fn validate_business_rules(&self, entity_type: &str, data: &HashMap<String, serde_json::Value>) -> AppResult<()> {
        use super::business_rules::BusinessRulesValidator;
        let validator = BusinessRulesValidator::new()?;
        validator.validate(entity_type, data)
    }

    pub fn validate_comprehensive(&self, entity_type: &str, data: &HashMap<String, serde_json::Value>) -> AppResult<ValidationResult> {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();

        // Basic data integrity validation
        if let Err(e) = self.validate_data_integrity(data) {
            errors.push(CustomValidationError {
                field: "data_integrity".to_string(),
                code: "INTEGRITY_ERROR".to_string(),
                message: e.to_string(),
                value: None,
            });
        }

        // Business rules validation
        if let Err(e) = self.validate_business_rules(entity_type, data) {
            errors.push(CustomValidationError {
                field: "business_rules".to_string(),
                code: "BUSINESS_RULE_ERROR".to_string(),
                message: e.to_string(),
                value: None,
            });
        }

        // Field-specific validations
        for (field, value) in data {
            match field.as_str() {
                "email" => {
                    if let Some(email_str) = value.as_str() {
                        if let Err(e) = self.validate_email(email_str) {
                            errors.push(CustomValidationError {
                                field: field.clone(),
                                code: "EMAIL_ERROR".to_string(),
                                message: e.to_string(),
                                value: Some(value.clone()),
                            });
                        }
                    }
                }
                "password" => {
                    if let Some(password_str) = value.as_str() {
                        if let Err(e) = self.validate_password(password_str) {
                            errors.push(CustomValidationError {
                                field: field.clone(),
                                code: "PASSWORD_ERROR".to_string(),
                                message: e.to_string(),
                                value: None,
                            });
                        }
                    }
                }
                "phone" => {
                    if let Some(phone_str) = value.as_str() {
                        if let Err(e) = self.validate_phone(phone_str) {
                            errors.push(CustomValidationError {
                                field: field.clone(),
                                code: "PHONE_ERROR".to_string(),
                                message: e.to_string(),
                                value: Some(value.clone()),
                            });
                        }
                    }
                }
                _ => {
                    if value.is_string() {
                        if let Some(str_value) = value.as_str() {
                            if str_value.len() > 1000 {
                                warnings.push(format!("Field '{}' is very long ({} characters)", field, str_value.len()));
                            }
                        }
                    }
                }
            }
        }

        Ok(ValidationResult {
            is_valid: errors.is_empty(),
            errors,
            warnings,
        })
    }
}

impl Default for ValidationService {
    fn default() -> Self {
        Self::new().expect("Failed to create ValidationService")
    }
}

/// Schema validator
#[derive(Debug, Clone)]
pub struct SchemaValidator {
    pub schema: HashMap<String, serde_json::Value>,
}

/// Validation rule
#[derive(Debug, Clone)]
pub struct ValidationRule {
    pub field: String,
    pub rule_type: String,
}

/// Validation error type
#[derive(Debug, Clone)]
pub enum ValidationErrorType {
    Missing,
    Invalid,
    Mismatch,
}

