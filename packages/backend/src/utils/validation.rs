//! Validation utility functions

use regex::Regex;
use uuid::Uuid;

/// Validate email format
pub fn validate_email(email: &str) -> Result<(), String> {
    let email_regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
        .map_err(|e| format!("Invalid regex: {}", e))?;
    
    if email_regex.is_match(email) {
        Ok(())
    } else {
        Err("Invalid email format".to_string())
    }
}

/// Validate password strength
pub fn validate_password(password: &str) -> Result<(), String> {
    if password.len() < 8 {
        return Err("Password must be at least 8 characters long".to_string());
    }
    
    if !password.chars().any(|c| c.is_uppercase()) {
        return Err("Password must contain at least one uppercase letter".to_string());
    }
    
    if !password.chars().any(|c| c.is_lowercase()) {
        return Err("Password must contain at least one lowercase letter".to_string());
    }
    
    if !password.chars().any(|c| c.is_numeric()) {
        return Err("Password must contain at least one number".to_string());
    }
    
    Ok(())
}

/// Validate UUID string
pub fn validate_uuid(uuid_str: &str) -> Result<Uuid, String> {
    Uuid::parse_str(uuid_str)
        .map_err(|e| format!("Invalid UUID: {}", e))
}

/// Validate required field
pub fn validate_required<T>(value: &Option<T>, field_name: &str) -> Result<(), String> {
    if value.is_none() {
        Err(format!("{} is required", field_name))
    } else {
        Ok(())
    }
}

/// Validate string length
pub fn validate_string_length(value: &str, min: usize, max: usize, field_name: &str) -> Result<(), String> {
    if value.len() < min {
        Err(format!("{} must be at least {} characters long", field_name, min))
    } else if value.len() > max {
        Err(format!("{} must be no more than {} characters long", field_name, max))
    } else {
        Ok(())
    }
}

/// Validate numeric range
pub fn validate_numeric_range<T>(value: T, min: T, max: T, field_name: &str) -> Result<(), String>
where
    T: PartialOrd + std::fmt::Display,
{
    if value < min {
        Err(format!("{} must be at least {}", field_name, min))
    } else if value > max {
        Err(format!("{} must be no more than {}", field_name, max))
    } else {
        Ok(())
    }
}

/// Validate that a string is not empty
pub fn validate_not_empty(value: &str, field_name: &str) -> Result<(), String> {
    if value.trim().is_empty() {
        Err(format!("{} cannot be empty", field_name))
    } else {
        Ok(())
    }
}

/// Validate role string
pub fn validate_role(role: &str) -> Result<(), String> {
    let valid_roles = ["admin", "user", "viewer", "manager"];
    if valid_roles.contains(&role.to_lowercase().as_str()) {
        Ok(())
    } else {
        Err(format!("Invalid role: {}. Must be one of: {}", role, valid_roles.join(", ")))
    }
}
