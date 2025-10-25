//! String utility functions

use regex::Regex;

/// Convert string to title case
pub fn to_title_case(s: &str) -> String {
    s.split_whitespace()
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                None => String::new(),
                Some(first) => first.to_uppercase().collect::<String>() + &chars.as_str().to_lowercase(),
            }
        })
        .collect::<Vec<String>>()
        .join(" ")
}

/// Convert string to snake_case
pub fn to_snake_case(s: &str) -> String {
    let re = Regex::new(r"([A-Z])").unwrap();
    re.replace_all(s, "_$1")
        .to_lowercase()
        .trim_start_matches('_')
        .to_string()
}

/// Convert string to camelCase
pub fn to_camel_case(s: &str) -> String {
    let parts: Vec<&str> = s.split('_').collect();
    if parts.is_empty() {
        return String::new();
    }
    
    let first = parts[0].to_lowercase();
    let rest: String = parts[1..]
        .iter()
        .map(|part| to_title_case(part))
        .collect();
    
    format!("{}{}", first, rest)
}

/// Truncate string to specified length with ellipsis
pub fn truncate_string(s: &str, max_length: usize) -> String {
    if s.len() <= max_length {
        s.to_string()
    } else {
        format!("{}...", &s[..max_length.saturating_sub(3)])
    }
}

/// Remove all whitespace from string
pub fn remove_whitespace(s: &str) -> String {
    s.chars().filter(|c| !c.is_whitespace()).collect()
}

/// Check if string contains only alphanumeric characters
pub fn is_alphanumeric(s: &str) -> bool {
    s.chars().all(|c| c.is_alphanumeric())
}

/// Check if string contains only alphabetic characters
pub fn is_alphabetic(s: &str) -> bool {
    s.chars().all(|c| c.is_alphabetic())
}

/// Check if string contains only numeric characters
pub fn is_numeric(s: &str) -> bool {
    s.chars().all(|c| c.is_numeric())
}

/// Capitalize first letter of string
pub fn capitalize_first(s: &str) -> String {
    if s.is_empty() {
        return String::new();
    }
    
    let mut chars = s.chars();
    let first = chars.next().unwrap().to_uppercase();
    format!("{}{}", first, chars.as_str())
}

/// Remove special characters from string, keeping only alphanumeric and spaces
pub fn sanitize_string(s: &str) -> String {
    s.chars()
        .filter(|c| c.is_alphanumeric() || c.is_whitespace())
        .collect()
}

/// Check if string is a valid identifier (starts with letter or underscore, contains only alphanumeric and underscores)
pub fn is_valid_identifier(s: &str) -> bool {
    if s.is_empty() {
        return false;
    }
    
    let first_char = s.chars().next().unwrap();
    if !first_char.is_alphabetic() && first_char != '_' {
        return false;
    }
    
    s.chars().all(|c| c.is_alphanumeric() || c == '_')
}
