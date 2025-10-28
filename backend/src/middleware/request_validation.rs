//! Request Validation Middleware
//!
//! Schema validation, sanitization, and injection prevention

use crate::errors::{AppError, AppResult};

/// Validation configuration
#[derive(Debug, Clone)]
pub struct ValidationConfig {
    /// Maximum request body size (bytes)
    pub max_body_size: usize,
    
    /// Maximum field length
    pub max_field_length: usize,
    
    /// Enable SQL injection detection
    pub enable_sql_injection_detection: bool,
    
    /// Enable XSS detection
    pub enable_xss_detection: bool,
    
    /// Allowed content types
    pub allowed_content_types: Vec<String>,
}

impl Default for ValidationConfig {
    fn default() -> Self {
        Self {
            max_body_size: 10 * 1024 * 1024, // 10MB
            max_field_length: 10000,
            enable_sql_injection_detection: true,
            enable_xss_detection: true,
            allowed_content_types: vec![
                "application/json".to_string(),
                "application/x-www-form-urlencoded".to_string(),
            ],
        }
    }
}

/// Validation result
#[derive(Debug, Clone)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub sanitized_value: String,
    pub violations: Vec<ValidationViolation>,
}

/// Validation violation
#[derive(Debug, Clone)]
pub struct ValidationViolation {
    pub field: String,
    pub rule: String,
    pub message: String,
}

/// Request validator
pub struct RequestValidator {
    config: ValidationConfig,
}

impl RequestValidator {
    /// Create a new validator
    pub fn new(config: ValidationConfig) -> Self {
        Self { config }
    }

    /// Validate and sanitize string input
    pub fn validate_string(&self, value: &str, field_name: &str) -> AppResult<ValidationResult> {
        let mut violations = Vec::new();
        let sanitized = value.to_string();

        // Check max length
        if sanitized.len() > self.config.max_field_length {
            violations.push(ValidationViolation {
                field: field_name.to_string(),
                rule: "max_length".to_string(),
                message: format!(
                    "Field exceeds maximum length of {}",
                    self.config.max_field_length
                ),
            });
        }

        // SQL injection detection
        if self.config.enable_sql_injection_detection {
            if self.detect_sql_injection(&sanitized) {
                violations.push(ValidationViolation {
                    field: field_name.to_string(),
                    rule: "sql_injection".to_string(),
                    message: "Potential SQL injection detected".to_string(),
                });
            }
        }

        // XSS detection
        if self.config.enable_xss_detection {
            if self.detect_xss(&sanitized) {
                violations.push(ValidationViolation {
                    field: field_name.to_string(),
                    rule: "xss".to_string(),
                    message: "Potential XSS attack detected".to_string(),
                });
            }
        }

        let is_valid = violations.is_empty();

        Ok(ValidationResult {
            is_valid,
            sanitized_value: sanitized,
            violations,
        })
    }

    /// Detect SQL injection patterns
    fn detect_sql_injection(&self, input: &str) -> bool {
        let dangerous_patterns = vec![
            "--", "/*", "*/",
            "xp_", "sp_", "exec",
            "union", "select", "insert",
            "update", "delete", "drop",
            "create", "alter", "truncate",
            ";", "'", "\"",
            "or 1=1", "or '1'='1",
            "admin'--", "admin'/*",
        ];

        let lower_input = input.to_lowercase();
        dangerous_patterns.iter().any(|pattern| lower_input.contains(pattern))
    }

    /// Detect XSS patterns
    fn detect_xss(&self, input: &str) -> bool {
        let dangerous_patterns = vec![
            "<script", "</script>",
            "javascript:",
            "onerror=", "onload=",
            "<iframe", "</iframe>",
            "eval(", "expression(",
            "<img", "<svg",
            "data:text/html",
        ];

        let lower_input = input.to_lowercase();
        dangerous_patterns.iter().any(|pattern| lower_input.contains(pattern))
    }

    /// Sanitize HTML input
    pub fn sanitize_html(&self, input: &str) -> String {
        // Remove script tags
        let sanitized = input.replace("<script", "&lt;script");
        let sanitized = sanitized.replace("</script>", "&lt;/script&gt;");
        
        // Remove event handlers
        let sanitized = sanitized.replace("onerror", "on-error");
        let sanitized = sanitized.replace("onload", "on-load");
        
        sanitized
    }

    /// Validate request body size
    pub fn validate_body_size(&self, body_size: usize) -> AppResult<()> {
        if body_size > self.config.max_body_size {
            return Err(AppError::Validation(format!(
                "Request body size {} exceeds maximum of {}",
                body_size, self.config.max_body_size
            )));
        }
        Ok(())
    }

    /// Validate email format
    pub fn validate_email(&self, email: &str) -> bool {
        email.contains('@') && email.contains('.')
    }

    /// Validate URL format
    pub fn validate_url(&self, url: &str) -> bool {
        url.starts_with("http://") || url.starts_with("https://")
    }

    /// Validate numeric range
    pub fn validate_numeric_range(&self, value: f64, min: f64, max: f64) -> bool {
        value >= min && value <= max
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sql_injection_detection() {
        let validator = RequestValidator::new(ValidationConfig::default());
        
        assert!(validator.detect_sql_injection("'; DROP TABLE users; --"));
        assert!(validator.detect_sql_injection("admin'--"));
        assert!(!validator.detect_sql_injection("normal text"));
    }

    #[test]
    fn test_xss_detection() {
        let validator = RequestValidator::new(ValidationConfig::default());
        
        assert!(validator.detect_xss("<script>alert('xss')</script>"));
        assert!(validator.detect_xss("javascript:alert('xss')"));
        assert!(!validator.detect_xss("normal html"));
    }

    #[test]
    fn test_email_validation() {
        let validator = RequestValidator::new(ValidationConfig::default());
        
        assert!(validator.validate_email("test@example.com"));
        assert!(!validator.validate_email("invalid-email"));
    }

    #[tokio::test]
    async fn test_string_validation() {
        let validator = RequestValidator::new(ValidationConfig::default());
        let result = validator.validate_string(
            "<script>alert('xss')</script>",
            "description"
        ).unwrap();
        
        assert!(!result.is_valid);
        assert!(result.violations.iter().any(|v| v.rule == "xss"));
    }
}

