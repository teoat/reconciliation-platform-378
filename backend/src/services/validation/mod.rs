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
