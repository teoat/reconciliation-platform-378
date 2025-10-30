// backend/src/services/validation.rs
use crate::errors::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use regex::Regex;
use uuid::Uuid;
use chrono::DateTime;

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

/// Input validation service
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

    /// Validate email address
    pub fn validate_email(&self, email: &str) -> AppResult<()> {
        if email.is_empty() {
            return Err(AppError::Validation("Email is required".to_string()));
        }

        if !self.email_regex.is_match(email) {
            return Err(AppError::Validation("Invalid email format".to_string()));
        }

        if email.len() > 254 {
            return Err(AppError::Validation("Email is too long".to_string()));
        }

        Ok(())
    }

    /// Validate password strength
    pub fn validate_password(&self, password: &str) -> AppResult<()> {
        if password.is_empty() {
            return Err(AppError::Validation("Password is required".to_string()));
        }

        if password.len() < 8 {
            return Err(AppError::Validation("Password must be at least 8 characters long".to_string()));
        }

        if password.len() > 128 {
            return Err(AppError::Validation("Password is too long".to_string()));
        }

        if !self.password_regex.is_match(password) {
            return Err(AppError::Validation(
                "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character".to_string()
            ));
        }

        Ok(())
    }

    /// Validate phone number
    pub fn validate_phone(&self, phone: &str) -> AppResult<()> {
        if phone.is_empty() {
            return Ok(()); // Phone is optional
        }

        if !self.phone_regex.is_match(phone) {
            return Err(AppError::Validation("Invalid phone number format".to_string()));
        }

        Ok(())
    }

    /// Validate UUID
    pub fn validate_uuid(&self, uuid_str: &str) -> AppResult<Uuid> {
        Uuid::parse_str(uuid_str)
            .map_err(|_| AppError::Validation("Invalid UUID format".to_string()))
    }

    /// Validate file name and extension
    pub fn validate_filename(&self, filename: &str) -> AppResult<()> {
        if filename.is_empty() {
            return Err(AppError::Validation("Filename is required".to_string()));
        }

        if filename.len() > 255 {
            return Err(AppError::Validation("Filename is too long".to_string()));
        }

        // Check for valid characters
        if filename.contains("..") || filename.contains("/") || filename.contains("\\") {
            return Err(AppError::Validation("Filename contains invalid characters".to_string()));
        }

        // Check file extension
        if let Some(extension) = filename.split('.').next_back() {
            let ext_with_dot = format!(".{}", extension);
            if !self.file_extension_regex.is_match(&ext_with_dot) {
                return Err(AppError::Validation("Unsupported file extension".to_string()));
            }
        } else {
            return Err(AppError::Validation("File must have an extension".to_string()));
        }

        Ok(())
    }

    /// Validate file size
    pub fn validate_file_size(&self, size: u64, max_size: u64) -> AppResult<()> {
        if size == 0 {
            return Err(AppError::Validation("File is empty".to_string()));
        }

        if size > max_size {
            return Err(AppError::Validation(
                format!("File size exceeds maximum allowed size of {} bytes", max_size)
            ));
        }

        Ok(())
    }

    /// Validate CSV data structure
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

    /// Validate JSON schema
    pub fn validate_json_schema(&self, data: &str, schema: &serde_json::Value) -> AppResult<()> {
        let parsed_data: serde_json::Value = serde_json::from_str(data)
            .map_err(|_| AppError::Validation("Invalid JSON format".to_string()))?;

        self.validate_json_against_schema(&parsed_data, schema)
    }

    /// Validate JSON data against schema
    fn validate_json_against_schema(&self, data: &serde_json::Value, schema: &serde_json::Value) -> AppResult<()> {
        match schema.get("type") {
            Some(serde_json::Value::String(schema_type)) => {
                match schema_type.as_str() {
                    "object" => self.validate_object(data, schema)?,
                    "array" => self.validate_array(data, schema)?,
                    "string" => self.validate_string(data, schema)?,
                    "number" => self.validate_number(data, schema)?,
                    "integer" => self.validate_integer(data, schema)?,
                    "boolean" => self.validate_boolean(data, schema)?,
                    _ => return Err(AppError::Validation("Unknown schema type".to_string())),
                }
            }
            _ => return Err(AppError::Validation("Schema must have a type".to_string())),
        }

        Ok(())
    }

    fn validate_object(&self, data: &serde_json::Value, schema: &serde_json::Value) -> AppResult<()> {
        if !data.is_object() {
            return Err(AppError::Validation("Expected object".to_string()));
        }

        if let Some(properties) = schema.get("properties") {
            if let Some(properties_obj) = properties.as_object() {
                for (key, prop_schema) in properties_obj {
                    if let Some(data_value) = data.get(key) {
                        self.validate_json_against_schema(data_value, prop_schema)?;
                    } else if schema.get("required").and_then(|r| r.as_array()).is_some_and(|r| r.contains(&serde_json::Value::String(key.clone()))) {
                        return Err(AppError::Validation(format!("Required field '{}' is missing", key)));
                    }
                }
            }
        }

        Ok(())
    }

    fn validate_array(&self, data: &serde_json::Value, schema: &serde_json::Value) -> AppResult<()> {
        if !data.is_array() {
            return Err(AppError::Validation("Expected array".to_string()));
        }

        if let Some(items_schema) = schema.get("items") {
            if let Some(array) = data.as_array() {
                for item in array {
                    self.validate_json_against_schema(item, items_schema)?;
                }
            }
        }

        Ok(())
    }

    fn validate_string(&self, data: &serde_json::Value, schema: &serde_json::Value) -> AppResult<()> {
        if !data.is_string() {
            return Err(AppError::Validation("Expected string".to_string()));
        }

        let string_value = data.as_str().ok_or_else(|| AppError::Validation("Expected string".to_string()))?;

        if let Some(min_length) = schema.get("minLength").and_then(|v| v.as_u64()) {
            if string_value.len() < min_length as usize {
                return Err(AppError::Validation(
                    format!("String length {} is less than minimum {}", string_value.len(), min_length)
                ));
            }
        }

        if let Some(max_length) = schema.get("maxLength").and_then(|v| v.as_u64()) {
            if string_value.len() > max_length as usize {
                return Err(AppError::Validation(
                    format!("String length {} exceeds maximum {}", string_value.len(), max_length)
                ));
            }
        }

        if let Some(pattern) = schema.get("pattern").and_then(|v| v.as_str()) {
            let regex = Regex::new(pattern)
                .map_err(|_| AppError::Validation("Invalid regex pattern in schema".to_string()))?;
            if !regex.is_match(string_value) {
                return Err(AppError::Validation(
                    format!("String does not match pattern: {}", pattern)
                ));
            }
        }

        Ok(())
    }

    fn validate_number(&self, data: &serde_json::Value, schema: &serde_json::Value) -> AppResult<()> {
        if !data.is_number() {
            return Err(AppError::Validation("Expected number".to_string()));
        }

        let number_value = data.as_f64().ok_or_else(|| AppError::Validation("Expected number".to_string()))?;

        if let Some(minimum) = schema.get("minimum").and_then(|v| v.as_f64()) {
            if number_value < minimum {
                return Err(AppError::Validation(
                    format!("Number {} is less than minimum {}", number_value, minimum)
                ));
            }
        }

        if let Some(maximum) = schema.get("maximum").and_then(|v| v.as_f64()) {
            if number_value > maximum {
                return Err(AppError::Validation(
                    format!("Number {} exceeds maximum {}", number_value, maximum)
                ));
            }
        }

        Ok(())
    }

    fn validate_integer(&self, data: &serde_json::Value, schema: &serde_json::Value) -> AppResult<()> {
        if !data.is_number() || !data.is_i64() {
            return Err(AppError::Validation("Expected integer".to_string()));
        }

        let int_value = data.as_i64().ok_or_else(|| AppError::Validation("Expected integer".to_string()))?;

        if let Some(minimum) = schema.get("minimum").and_then(|v| v.as_i64()) {
            if int_value < minimum {
                return Err(AppError::Validation(
                    format!("Integer {} is less than minimum {}", int_value, minimum)
                ));
            }
        }

        if let Some(maximum) = schema.get("maximum").and_then(|v| v.as_i64()) {
            if int_value > maximum {
                return Err(AppError::Validation(
                    format!("Integer {} exceeds maximum {}", int_value, maximum)
                ));
            }
        }

        Ok(())
    }

    fn validate_boolean(&self, data: &serde_json::Value, schema: &serde_json::Value) -> AppResult<()> {
        if !data.is_boolean() {
            return Err(AppError::Validation("Expected boolean".to_string()));
        }
        Ok(())
    }

    /// Validate data integrity constraints
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
                DateTime::parse_from_rfc3339(created_at_str)
                    .map_err(|_| AppError::Validation("Invalid created_at timestamp format".to_string()))?;
            }
        }

        if let Some(updated_at) = data.get("updated_at") {
            if let Some(updated_at_str) = updated_at.as_str() {
                DateTime::parse_from_rfc3339(updated_at_str)
                    .map_err(|_| AppError::Validation("Invalid updated_at timestamp format".to_string()))?;
            }
        }

        Ok(())
    }

    /// Validate business rules
    pub fn validate_business_rules(&self, entity_type: &str, data: &HashMap<String, serde_json::Value>) -> AppResult<()> {
        match entity_type {
            "user" => self.validate_user_business_rules(data)?,
            "project" => self.validate_project_business_rules(data)?,
            "reconciliation_job" => self.validate_reconciliation_job_business_rules(data)?,
            "data_source" => self.validate_data_source_business_rules(data)?,
            _ => return Err(AppError::Validation("Unknown entity type".to_string())),
        }

        Ok(())
    }

    fn validate_user_business_rules(&self, data: &HashMap<String, serde_json::Value>) -> AppResult<()> {
        // User-specific business rules
        if let Some(role) = data.get("role") {
            if let Some(role_str) = role.as_str() {
                let valid_roles = vec!["admin", "user", "analyst", "viewer"];
                if !valid_roles.contains(&role_str) {
                    return Err(AppError::Validation(
                        format!("Invalid role: {}. Valid roles are: {}", role_str, valid_roles.join(", "))
                    ));
                }
            }
        }

        Ok(())
    }

    fn validate_project_business_rules(&self, data: &HashMap<String, serde_json::Value>) -> AppResult<()> {
        // Project-specific business rules
        if let Some(max_users) = data.get("max_concurrent_users") {
            if let Some(max_users_num) = max_users.as_u64() {
                if max_users_num > 100 {
                    return Err(AppError::Validation(
                        "Maximum concurrent users cannot exceed 100".to_string()
                    ));
                }
            }
        }

        Ok(())
    }

    fn validate_reconciliation_job_business_rules(&self, data: &HashMap<String, serde_json::Value>) -> AppResult<()> {
        // Reconciliation job-specific business rules
        if let Some(confidence_threshold) = data.get("confidence_threshold") {
            if let Some(threshold) = confidence_threshold.as_f64() {
                if !(0.0..=1.0).contains(&threshold) {
                    return Err(AppError::Validation(
                        "Confidence threshold must be between 0.0 and 1.0".to_string()
                    ));
                }
            }
        }

        Ok(())
    }

    fn validate_data_source_business_rules(&self, data: &HashMap<String, serde_json::Value>) -> AppResult<()> {
        // Data source-specific business rules
        if let Some(source_type) = data.get("source_type") {
            if let Some(type_str) = source_type.as_str() {
                let valid_types = vec!["csv", "xlsx", "xls", "json", "xml", "database"];
                if !valid_types.contains(&type_str) {
                    return Err(AppError::Validation(
                        format!("Invalid source type: {}. Valid types are: {}", type_str, valid_types.join(", "))
                    ));
                }
            }
        }

        Ok(())
    }

    /// Comprehensive validation for any data
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
                                value: None, // Don't include password in response
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
                    // Generic validation for other fields
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
        Self::new().unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_email() {
        let service = ValidationService::new().unwrap();
        
        // Valid emails
        assert!(service.validate_email("test@example.com").is_ok());
        assert!(service.validate_email("user.name+tag@domain.co.uk").is_ok());
        
        // Invalid emails
        assert!(service.validate_email("").is_err());
        assert!(service.validate_email("invalid-email").is_err());
        assert!(service.validate_email("@example.com").is_err());
    }

    #[test]
    fn test_validate_password() {
        let service = ValidationService::new().unwrap();
        
        // Valid passwords
        assert!(service.validate_password("Password123!").is_ok());
        assert!(service.validate_password("MySecure@Pass1").is_ok());
        
        // Invalid passwords
        assert!(service.validate_password("").is_err());
        assert!(service.validate_password("short").is_err());
        assert!(service.validate_password("nouppercase123!").is_err());
        assert!(service.validate_password("NOLOWERCASE123!").is_err());
        assert!(service.validate_password("NoNumbers!").is_err());
        assert!(service.validate_password("NoSpecialChars123").is_err());
    }

    #[test]
    fn test_validate_csv_structure() {
        let service = ValidationService::new().unwrap();
        
        let valid_csv = "id,name,email\n1,John,john@example.com\n2,Jane,jane@example.com";
        let result = service.validate_csv_structure(valid_csv);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), vec!["id", "name", "email"]);
        
        let invalid_csv = "id,name\n1,John,john@example.com"; // Wrong number of fields
        assert!(service.validate_csv_structure(invalid_csv).is_err());
    }

    #[test]
    fn test_validate_uuid() {
        let service = ValidationService::new().unwrap();
        
        let valid_uuid = "550e8400-e29b-41d4-a716-446655440000";
        assert!(service.validate_uuid(valid_uuid).is_ok());
        
        let invalid_uuid = "not-a-uuid";
        assert!(service.validate_uuid(invalid_uuid).is_err());
    }
}

// ============================================================================
// SCHEMA VALIDATION (Merged from schema_validation.rs)  
// ============================================================================

#[derive(Debug, Clone)]
pub struct SchemaValidator {
    pub schema: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone)]
pub struct ValidationRule {
    pub field: String,
    pub rule_type: String,
}

#[derive(Debug, Clone)]
pub enum ValidationErrorType {
    Missing,
    Invalid,
    Mismatch,
}

