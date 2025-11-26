//! Environment Variable Validation
//!
//! Provides comprehensive validation of required environment variables at startup.
//! Fails fast with clear error messages if required variables are missing.

use crate::errors::{AppError, AppResult};
use std::env;

/// Environment variable validation result
#[derive(Debug, Clone)]
pub struct ValidationResult {
    pub missing_required: Vec<String>,
    pub missing_optional: Vec<String>,
    pub invalid_values: Vec<(String, String)>, // (variable_name, error_message)
}

impl ValidationResult {
    /// Check if validation passed
    pub fn is_valid(&self) -> bool {
        self.missing_required.is_empty() && self.invalid_values.is_empty()
    }

    /// Get formatted error message
    pub fn error_message(&self) -> String {
        let mut errors = Vec::new();

        if !self.missing_required.is_empty() {
            errors.push(format!(
                "Missing required environment variables:\n  - {}",
                self.missing_required.join("\n  - ")
            ));
        }

        if !self.invalid_values.is_empty() {
            let invalid_msgs: Vec<String> = self
                .invalid_values
                .iter()
                .map(|(var, msg)| format!("{}: {}", var, msg))
                .collect();
            errors.push(format!(
                "Invalid environment variable values:\n  - {}",
                invalid_msgs.join("\n  - ")
            ));
        }

        if !self.missing_optional.is_empty() {
            errors.push(format!(
                "Missing optional environment variables (using defaults):\n  - {}",
                self.missing_optional.join("\n  - ")
            ));
        }

        errors.join("\n\n")
    }
}

/// Validate all required environment variables
///
/// This function checks that all required environment variables are set
/// and have valid values. Returns a ValidationResult with any issues found.
///
/// # Returns
/// * `Ok(ValidationResult)` - Validation result (check `is_valid()`)
/// * Errors are included in the ValidationResult, not returned as Err
pub fn validate_environment() -> ValidationResult {
    let mut result = ValidationResult {
        missing_required: Vec::new(),
        missing_optional: Vec::new(),
        invalid_values: Vec::new(),
    };

    // Required variables (must be set)
    let required_vars = vec![
        "DATABASE_URL",
        "JWT_SECRET",
        "JWT_REFRESH_SECRET",
    ];

    // Optional variables (have defaults)
    let optional_vars = vec![
        "HOST",
        "PORT",
        "REDIS_URL",
        "JWT_EXPIRATION",
        "CORS_ORIGINS",
        "LOG_LEVEL",
        "MAX_FILE_SIZE",
        "UPLOAD_PATH",
    ];

    // Check required variables
    for var in required_vars {
        if env::var(var).is_err() {
            result.missing_required.push(var.to_string());
        }
    }

    // Check optional variables (for informational purposes)
    for var in optional_vars {
        if env::var(var).is_err() {
            result.missing_optional.push(var.to_string());
        }
    }

    // Validate variable values
    validate_variable_values(&mut result);

    result
}

/// Validate environment variable values
fn validate_variable_values(result: &mut ValidationResult) {
    // Validate PORT
    if let Ok(port_str) = env::var("PORT") {
        if let Err(e) = port_str.parse::<u16>() {
            result.invalid_values.push((
                "PORT".to_string(),
                format!("Invalid port number: {}", e),
            ));
        }
    }

    // Validate JWT_EXPIRATION
    if let Ok(exp_str) = env::var("JWT_EXPIRATION") {
        if let Err(e) = exp_str.parse::<i64>() {
            result.invalid_values.push((
                "JWT_EXPIRATION".to_string(),
                format!("Invalid expiration value: {}", e),
            ));
        } else if let Ok(exp) = exp_str.parse::<i64>() {
            if exp <= 0 {
                result.invalid_values.push((
                    "JWT_EXPIRATION".to_string(),
                    "Must be a positive number".to_string(),
                ));
            }
        }
    }

    // Validate MAX_FILE_SIZE
    if let Ok(size_str) = env::var("MAX_FILE_SIZE") {
        if let Err(e) = size_str.parse::<usize>() {
            result.invalid_values.push((
                "MAX_FILE_SIZE".to_string(),
                format!("Invalid file size: {}", e),
            ));
        } else if let Ok(size) = size_str.parse::<usize>() {
            if size == 0 {
                result.invalid_values.push((
                    "MAX_FILE_SIZE".to_string(),
                    "Must be greater than 0".to_string(),
                ));
            }
        }
    }

    // Validate DATABASE_URL format
    if let Ok(db_url) = env::var("DATABASE_URL") {
        if !db_url.starts_with("postgresql://") && !db_url.starts_with("postgres://") {
            result.invalid_values.push((
                "DATABASE_URL".to_string(),
                "Must start with 'postgresql://' or 'postgres://'".to_string(),
            ));
        }
    }

    // Validate REDIS_URL format (if set)
    if let Ok(redis_url) = env::var("REDIS_URL") {
        if !redis_url.starts_with("redis://") && !redis_url.starts_with("rediss://") {
            result.invalid_values.push((
                "REDIS_URL".to_string(),
                "Must start with 'redis://' or 'rediss://'".to_string(),
            ));
        }
    }
}

/// Validate environment and exit if validation fails
///
/// This function validates all required environment variables and exits
/// the process with a clear error message if validation fails.
///
/// # Panics
/// Exits the process with code 1 if validation fails
pub fn validate_and_exit_on_error() {
    let result = validate_environment();

    if !result.is_valid() {
        eprintln!("\n❌ Environment validation failed!\n");
        eprintln!("{}", result.error_message());
        eprintln!("\n💡 Tip: Copy env.consolidated to .env and update required variables");
        eprintln!("   See docs/deployment/ENVIRONMENT_VARIABLES.md for details\n");
        // Force flush before exit to ensure error message is visible
        use std::io::Write;
        std::io::stderr().flush().unwrap_or(());
        std::io::stdout().flush().unwrap_or(());
        std::process::exit(1);
    }

    if !result.missing_optional.is_empty() {
        log::info!(
            "Using default values for optional variables: {}",
            result.missing_optional.join(", ")
        );
    }

    log::info!("✅ Environment validation passed");
}

/// Validate environment and return result
///
/// Returns an AppResult that can be used in application startup.
pub fn validate_environment_result() -> AppResult<()> {
    let result = validate_environment();

    if !result.is_valid() {
        return Err(AppError::Config(format!(
            "Environment validation failed:\n{}",
            result.error_message()
        )));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validation_result_is_valid() {
        let result = ValidationResult {
            missing_required: vec![],
            missing_optional: vec![],
            invalid_values: vec![],
        };
        assert!(result.is_valid());

        let result = ValidationResult {
            missing_required: vec!["DATABASE_URL".to_string()],
            missing_optional: vec![],
            invalid_values: vec![],
        };
        assert!(!result.is_valid());
    }

    #[test]
    fn test_validation_result_error_message() {
        let result = ValidationResult {
            missing_required: vec!["DATABASE_URL".to_string(), "JWT_SECRET".to_string()],
            missing_optional: vec!["REDIS_URL".to_string()],
            invalid_values: vec![("PORT".to_string(), "Invalid port".to_string())],
        };

        let msg = result.error_message();
        assert!(msg.contains("DATABASE_URL"));
        assert!(msg.contains("JWT_SECRET"));
        assert!(msg.contains("PORT"));
        assert!(msg.contains("REDIS_URL"));
    }
}

