//! Tests for EmailValidator

use reconciliation_backend::services::validation::email::EmailValidator;
use regex::Regex;

#[cfg(test)]
mod validation_email_tests {
    use super::*;

    #[test]
    fn test_email_validator_creation() {
        let validator = EmailValidator::new();
        assert!(validator.is_ok());
    }

    #[test]
    fn test_email_validator_with_regex() {
        let custom_regex = Regex::new(r"^[a-z]+@[a-z]+\.[a-z]+$").unwrap();
        let validator = EmailValidator::with_regex(custom_regex);
        
        // Should accept simple emails
        assert!(validator.validate("test@example.com").is_ok());
        
        // Should reject emails with numbers (based on custom regex)
        assert!(validator.validate("test123@example.com").is_err());
    }

    #[test]
    fn test_validate_email_valid() {
        let validator = EmailValidator::new().unwrap();

        let valid_emails = vec![
            "test@example.com",
            "user.name@domain.com",
            "user+tag@example.com",
            "test@sub.domain.example.com",
            "123@test.co.uk",
            "a@b.co",
            "user_name@example-domain.com",
            "user@123.456.789",
        ];

        for email in valid_emails {
            assert!(validator.validate(email).is_ok(), "Email '{}' should be valid", email);
        }
    }

    #[test]
    fn test_validate_email_invalid() {
        let validator = EmailValidator::new().unwrap();

        let invalid_emails = vec![
            "",
            "@example.com",
            "user@",
            "user",
            "user@.com",
            "@",
            "user@@example.com",
            "user@example..com",
            "user example.com",
            "user@example",
            "user@example.",
        ];

        for email in invalid_emails {
            assert!(validator.validate(email).is_err(), "Email '{}' should be invalid", email);
        }
    }

    #[test]
    fn test_validate_email_too_long() {
        let validator = EmailValidator::new().unwrap();

        // Create an email that's exactly 254 characters (RFC limit)
        let long_email = format!("{}@example.com", "a".repeat(240));
        assert!(validator.validate(&long_email).is_ok());

        // Create an email that's over 254 characters
        let too_long_email = format!("{}@example.com", "a".repeat(241));
        assert!(validator.validate(&too_long_email).is_err());
    }

    #[test]
    fn test_validate_email_edge_cases() {
        let validator = EmailValidator::new().unwrap();

        // Edge cases
        assert!(validator.validate("user.name+tag@example.co.uk").is_ok());
        assert!(validator.validate("user_name@example-domain.com").is_ok());
        assert!(validator.validate("user@sub-domain.example.com").is_ok());
        
        // Invalid edge cases
        assert!(validator.validate("user@example..com").is_err());
        assert!(validator.validate("user..name@example.com").is_err());
        assert!(validator.validate("user@example.c").is_err()); // TLD too short
    }
}

