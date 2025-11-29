//! Tests for PasswordValidator

use reconciliation_backend::services::validation::password::PasswordValidator;
use regex::Regex;

#[cfg(test)]
mod validation_password_tests {
    use super::*;

    #[test]
    fn test_password_validator_creation() {
        let validator = PasswordValidator::new();
        assert!(validator.is_ok());
    }

    #[test]
    fn test_password_validator_with_regex() {
        let custom_regex = Regex::new(r"^[A-Za-z\d@$!%*?&]{8,}$").unwrap();
        let validator = PasswordValidator::with_regex(custom_regex);
        
        // Should accept valid password
        assert!(validator.validate("ValidPass123!").is_ok());
    }

    #[test]
    fn test_validate_password_valid() {
        let validator = PasswordValidator::new().unwrap();

        let valid_passwords = vec![
            "ValidPass123!",
            "Complex@Pass#2024",
            "Str0ng!P@ssw0rd",
            "MySecure123$",
            "Test1234@",
            "Password1!",
            "Abc123!@#",
        ];

        for password in valid_passwords {
            assert!(validator.validate(password).is_ok(), "Password '{}' should be valid", password);
        }
    }

    #[test]
    fn test_validate_password_invalid() {
        let validator = PasswordValidator::new().unwrap();

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
            assert!(validator.validate(password).is_err(), "Password '{}' should be invalid", password);
        }
    }

    #[test]
    fn test_validate_password_too_short() {
        let validator = PasswordValidator::new().unwrap();

        // Exactly 7 characters (too short)
        assert!(validator.validate("Pass123").is_err());
        
        // Exactly 8 characters (minimum)
        assert!(validator.validate("Pass123!").is_ok());
    }

    #[test]
    fn test_validate_password_too_long() {
        let validator = PasswordValidator::new().unwrap();

        // Create a password that's exactly 128 characters
        let long_password = format!("{}1A!", "a".repeat(124));
        assert!(validator.validate(&long_password).is_ok());

        // Create a password that's over 128 characters
        let too_long_password = format!("{}1A!", "a".repeat(125));
        assert!(validator.validate(&too_long_password).is_err());
    }

    #[test]
    fn test_validate_password_character_requirements() {
        let validator = PasswordValidator::new().unwrap();

        // Missing lowercase
        assert!(validator.validate("PASSWORD123!").is_err());
        
        // Missing uppercase
        assert!(validator.validate("password123!").is_err());
        
        // Missing digit
        assert!(validator.validate("Password!").is_err());
        
        // Missing special character
        assert!(validator.validate("Password123").is_err());
        
        // All requirements met
        assert!(validator.validate("Password123!").is_ok());
    }

    #[test]
    fn test_validate_password_invalid_characters() {
        let validator = PasswordValidator::new().unwrap();

        // Contains invalid characters (not in allowed set)
        assert!(validator.validate("Password123!<").is_err()); // Contains '<'
        assert!(validator.validate("Password123!>").is_err()); // Contains '>'
        assert!(validator.validate("Password123! ").is_err()); // Contains space
    }

    #[test]
    fn test_validate_password_allowed_special_characters() {
        let validator = PasswordValidator::new().unwrap();

        // Test each allowed special character
        let special_chars = vec!['@', '$', '!', '%', '*', '?', '&'];
        
        for char in special_chars {
            let password = format!("Password123{}", char);
            assert!(validator.validate(&password).is_ok(), "Password with '{}' should be valid", char);
        }
    }
}

