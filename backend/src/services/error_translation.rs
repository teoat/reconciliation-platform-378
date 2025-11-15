//! Error Translation Service - Converts technical errors to user-friendly messages
//! 
//! This service provides a centralized way to translate backend errors into
//! user-friendly messages with proper context and guidance.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// User-friendly error message with context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserFriendlyError {
    pub code: String,
    pub title: String,
    pub message: String,
    pub suggestion: Option<String>,
    pub context: ErrorContext,
    pub timestamp: DateTime<Utc>,
}

/// Error context for better debugging and user guidance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorContext {
    pub user_id: Option<Uuid>,
    pub project_id: Option<Uuid>,
    pub workflow_stage: Option<String>,
    pub action: Option<String>,
    pub resource_type: Option<String>,
    pub resource_id: Option<String>,
}

/// Error translation service
pub struct ErrorTranslationService {
    translations: HashMap<String, ErrorTranslation>,
}

/// Error translation mapping
#[derive(Debug, Clone)]
struct ErrorTranslation {
    title: String,
    message: String,
    suggestion: Option<String>,
    category: ErrorCategory,
}

/// Error categories for grouping and handling
#[derive(Debug, Clone, PartialEq)]
pub enum ErrorCategory {
    Authentication,
    Authorization,
    Validation,
    Network,
    Database,
    File,
    Payment,
    System,
    UserAction,
}

impl ErrorTranslationService {
    /// Create new error translation service
    pub fn new() -> Self {
        let mut translations = HashMap::new();
        
        // Authentication errors
        translations.insert("UNAUTHORIZED".to_string(), ErrorTranslation {
            title: "Authentication Required".to_string(),
            message: "Please log in to continue".to_string(),
            suggestion: Some("Click the login button to sign in".to_string()),
            category: ErrorCategory::Authentication,
        });
        
        translations.insert("INVALID_TOKEN".to_string(), ErrorTranslation {
            title: "Session Expired".to_string(),
            message: "Your session has expired. Please log in again".to_string(),
            suggestion: Some("Click the login button to sign in again".to_string()),
            category: ErrorCategory::Authentication,
        });
        
        // Authorization errors
        translations.insert("FORBIDDEN".to_string(), ErrorTranslation {
            title: "Access Denied".to_string(),
            message: "You don't have permission to perform this action".to_string(),
            suggestion: Some("Contact your administrator if you believe this is an error".to_string()),
            category: ErrorCategory::Authorization,
        });
        
        // Validation errors
        translations.insert("VALIDATION_ERROR".to_string(), ErrorTranslation {
            title: "Invalid Input".to_string(),
            message: "Please check your input and try again".to_string(),
            suggestion: Some("Review the highlighted fields for errors".to_string()),
            category: ErrorCategory::Validation,
        });
        
        translations.insert("EMAIL_INVALID".to_string(), ErrorTranslation {
            title: "Invalid Email".to_string(),
            message: "Please enter a valid email address".to_string(),
            suggestion: Some("Check that your email address is formatted correctly".to_string()),
            category: ErrorCategory::Validation,
        });
        
        translations.insert("PASSWORD_TOO_WEAK".to_string(), ErrorTranslation {
            title: "Weak Password".to_string(),
            message: "Your password doesn't meet security requirements".to_string(),
            suggestion: Some("Use at least 8 characters with numbers and symbols".to_string()),
            category: ErrorCategory::Validation,
        });
        
        // Network errors
        translations.insert("NETWORK_ERROR".to_string(), ErrorTranslation {
            title: "Connection Problem".to_string(),
            message: "Unable to connect to the server".to_string(),
            suggestion: Some("Check your internet connection and try again".to_string()),
            category: ErrorCategory::Network,
        });
        
        translations.insert("TIMEOUT".to_string(), ErrorTranslation {
            title: "Request Timeout".to_string(),
            message: "The request took too long to complete".to_string(),
            suggestion: Some("Try again in a moment or contact support if the problem persists".to_string()),
            category: ErrorCategory::Network,
        });
        
        // Database errors
        translations.insert("DATABASE_ERROR".to_string(), ErrorTranslation {
            title: "Data Error".to_string(),
            message: "There was a problem accessing your data".to_string(),
            suggestion: Some("Try refreshing the page or contact support if the problem continues".to_string()),
            category: ErrorCategory::Database,
        });
        
        translations.insert("DUPLICATE_ENTRY".to_string(), ErrorTranslation {
            title: "Duplicate Entry".to_string(),
            message: "This item already exists".to_string(),
            suggestion: Some("Try using a different name or check if the item already exists".to_string()),
            category: ErrorCategory::Database,
        });
        
        // File errors
        translations.insert("FILE_TOO_LARGE".to_string(), ErrorTranslation {
            title: "File Too Large".to_string(),
            message: "The file you're trying to upload is too large".to_string(),
            suggestion: Some("Try uploading a smaller file or contact support for assistance".to_string()),
            category: ErrorCategory::File,
        });
        
        translations.insert("INVALID_FILE_TYPE".to_string(), ErrorTranslation {
            title: "Invalid File Type".to_string(),
            message: "This file type is not supported".to_string(),
            suggestion: Some("Please upload a CSV, Excel, or JSON file".to_string()),
            category: ErrorCategory::File,
        });
        
        // Payment errors
        translations.insert("PAYMENT_FAILED".to_string(), ErrorTranslation {
            title: "Payment Failed".to_string(),
            message: "Your payment could not be processed".to_string(),
            suggestion: Some("Check your payment method or try a different card".to_string()),
            category: ErrorCategory::Payment,
        });
        
        translations.insert("INSUFFICIENT_FUNDS".to_string(), ErrorTranslation {
            title: "Insufficient Funds".to_string(),
            message: "Your payment method has insufficient funds".to_string(),
            suggestion: Some("Try a different payment method or add funds to your account".to_string()),
            category: ErrorCategory::Payment,
        });
        
        // System errors
        translations.insert("INTERNAL_ERROR".to_string(), ErrorTranslation {
            title: "System Error".to_string(),
            message: "Something went wrong on our end".to_string(),
            suggestion: Some("Please try again in a few moments or contact support".to_string()),
            category: ErrorCategory::System,
        });
        
        translations.insert("SERVICE_UNAVAILABLE".to_string(), ErrorTranslation {
            title: "Service Unavailable".to_string(),
            message: "The service is temporarily unavailable".to_string(),
            suggestion: Some("Please try again later or check our status page".to_string()),
            category: ErrorCategory::System,
        });
        
        Self { translations }
    }
    
    /// Translate a technical error code to user-friendly message
    pub fn translate_error(
        &self,
        error_code: &str,
        context: ErrorContext,
        custom_message: Option<String>,
    ) -> UserFriendlyError {
        let translation = self.translations.get(error_code)
            .cloned()
            .unwrap_or_else(|| ErrorTranslation {
                title: "Unknown Error".to_string(),
                message: custom_message.unwrap_or_else(|| "An unexpected error occurred".to_string()),
                suggestion: Some("Please contact support if this problem persists".to_string()),
                category: ErrorCategory::System,
            });
        
        UserFriendlyError {
            code: error_code.to_string(),
            title: translation.title,
            message: translation.message,
            suggestion: translation.suggestion,
            context,
            timestamp: Utc::now(),
        }
    }
    
    /// Translate database error to user-friendly message
    pub fn translate_database_error(
        &self,
        db_error: &diesel::result::Error,
        context: ErrorContext,
    ) -> UserFriendlyError {
        let (code, custom_message) = match db_error {
            diesel::result::Error::NotFound => ("NOT_FOUND", Some("The requested item was not found".to_string())),
            diesel::result::Error::DatabaseError(kind, info) => {
                match kind {
                    diesel::result::DatabaseErrorKind::UniqueViolation => {
                        ("DUPLICATE_ENTRY", Some(format!("This {} already exists", 
                            context.resource_type.as_deref().unwrap_or("item"))))
                    },
                    diesel::result::DatabaseErrorKind::ForeignKeyViolation => {
                        ("FOREIGN_KEY_ERROR", Some("This item is being used elsewhere and cannot be deleted".to_string()))
                    },
                    diesel::result::DatabaseErrorKind::NotNullViolation => {
                        ("REQUIRED_FIELD_MISSING", Some("A required field is missing".to_string()))
                    },
                    _ => ("DATABASE_ERROR", Some("There was a problem with the database".to_string())),
                }
            },
            // ConnectionError variant may not exist in this diesel version
            // diesel::result::Error::ConnectionError(_) => {
            //     ("DATABASE_CONNECTION_ERROR", Some("Unable to connect to the database".to_string()))
            // },
            _ => ("DATABASE_ERROR", Some("A database error occurred".to_string())),
        };
        
        self.translate_error(code, context, custom_message)
    }
    
    /// Translate validation error to user-friendly message
    pub fn translate_validation_error(
        &self,
        field: &str,
        error: &str,
        context: ErrorContext,
    ) -> UserFriendlyError {
        let code = match error {
            "required" => "REQUIRED_FIELD",
            "email" => "EMAIL_INVALID",
            "min_length" => "TOO_SHORT",
            "max_length" => "TOO_LONG",
            "pattern" => "INVALID_FORMAT",
            _ => "VALIDATION_ERROR",
        };
        
        let custom_message = match code {
            "REQUIRED_FIELD" => format!("{} is required", field),
            "EMAIL_INVALID" => "Please enter a valid email address".to_string(),
            "TOO_SHORT" => format!("{} is too short", field),
            "TOO_LONG" => format!("{} is too long", field),
            "INVALID_FORMAT" => format!("{} format is invalid", field),
            _ => "Please check your input".to_string(),
        };
        
        self.translate_error(code, context, Some(custom_message))
    }
    
    /// Get error category for handling
    pub fn get_error_category(&self, error_code: &str) -> ErrorCategory {
        self.translations.get(error_code)
            .map(|t| t.category.clone())
            .unwrap_or(ErrorCategory::System)
    }
    
    /// Check if error should trigger retry
    pub fn should_retry(&self, error_code: &str) -> bool {
        matches!(self.get_error_category(error_code), 
            ErrorCategory::Network | ErrorCategory::System)
    }
    
    /// Get retry delay for error
    pub fn get_retry_delay(&self, error_code: &str, attempt: u32) -> u64 {
        match self.get_error_category(error_code) {
            ErrorCategory::Network => 1000 * (attempt as u64), // 1s, 2s, 3s...
            ErrorCategory::System => 2000 * (attempt as u64), // 2s, 4s, 6s...
            _ => 0, // No retry
        }
    }
}

impl Default for ErrorTranslationService {
    fn default() -> Self {
        Self::new()
    }
}

/// Error context builder for easier usage
pub struct ErrorContextBuilder {
    context: ErrorContext,
}

impl ErrorContextBuilder {
    pub fn new() -> Self {
        Self {
            context: ErrorContext {
                user_id: None,
                project_id: None,
                workflow_stage: None,
                action: None,
                resource_type: None,
                resource_id: None,
            },
        }
    }
    
    pub fn user_id(mut self, user_id: Uuid) -> Self {
        self.context.user_id = Some(user_id);
        self
    }
    
    pub fn project_id(mut self, project_id: Uuid) -> Self {
        self.context.project_id = Some(project_id);
        self
    }
    
    pub fn workflow_stage(mut self, stage: &str) -> Self {
        self.context.workflow_stage = Some(stage.to_string());
        self
    }
    
    pub fn action(mut self, action: &str) -> Self {
        self.context.action = Some(action.to_string());
        self
    }
    
    pub fn resource_type(mut self, resource_type: &str) -> Self {
        self.context.resource_type = Some(resource_type.to_string());
        self
    }
    
    pub fn resource_id(mut self, resource_id: &str) -> Self {
        self.context.resource_id = Some(resource_id.to_string());
        self
    }
    
    pub fn build(self) -> ErrorContext {
        self.context
    }
}

impl Default for ErrorContextBuilder {
    fn default() -> Self {
        Self::new()
    }
}
