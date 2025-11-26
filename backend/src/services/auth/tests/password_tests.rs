//! Password system tests
//!
//! Comprehensive tests for password hashing, validation, strength scoring,
//! and expiration handling.

#[cfg(test)]
mod tests {
    use super::super::password::PasswordManager;
    use crate::config::PasswordStrength;

    #[test]
    fn test_password_hashing() {
        let password = "TestPassword123!";
        let hash = PasswordManager::hash_password(password).unwrap();
        
        // Verify hash is different from password
        assert_ne!(password, hash);
        
        // Verify password matches hash
        let is_valid = PasswordManager::verify_password(password, &hash).unwrap();
        assert!(is_valid);
        
        // Verify wrong password doesn't match
        let is_invalid = PasswordManager::verify_password("WrongPassword", &hash).unwrap();
        assert!(!is_invalid);
    }

    #[test]
    fn test_password_strength_validation() {
        // Valid password
        assert!(PasswordManager::validate_password_strength("ValidPass123!").is_ok());
        
        // Too short
        assert!(PasswordManager::validate_password_strength("Short1!").is_err());
        
        // Missing uppercase
        assert!(PasswordManager::validate_password_strength("lowercase123!").is_err());
        
        // Missing lowercase
        assert!(PasswordManager::validate_password_strength("UPPERCASE123!").is_err());
        
        // Missing number
        assert!(PasswordManager::validate_password_strength("NoNumber!").is_err());
        
        // Missing special character
        assert!(PasswordManager::validate_password_strength("NoSpecial123").is_err());
        
        // Banned password
        assert!(PasswordManager::validate_password_strength("password123").is_err());
    }

    #[test]
    fn test_password_strength_scoring() {
        // Weak password
        let weak = PasswordManager::calculate_password_strength("weak");
        assert_eq!(weak, PasswordStrength::Weak);
        
        // Fair password
        let fair = PasswordManager::calculate_password_strength("FairPass123");
        assert!(matches!(fair, PasswordStrength::Fair | PasswordStrength::Good));
        
        // Good password
        let good = PasswordManager::calculate_password_strength("GoodPassword123!");
        assert!(matches!(good, PasswordStrength::Good | PasswordStrength::Strong));
        
        // Strong password
        let strong = PasswordManager::calculate_password_strength("VeryStrongPassword123!@#");
        assert_eq!(strong, PasswordStrength::Strong);
    }

    #[test]
    fn test_initial_password_generation() {
        let password = PasswordManager::generate_initial_password().unwrap();
        
        // Should meet all validation requirements
        assert!(PasswordManager::validate_password_strength(&password).is_ok());
        
        // Should be 12-16 characters
        assert!(password.len() >= 12 && password.len() <= 16);
        
        // Should contain required character types
        assert!(password.chars().any(|c| c.is_uppercase()));
        assert!(password.chars().any(|c| c.is_lowercase()));
        assert!(password.chars().any(|c| c.is_numeric()));
        assert!(password.chars().any(|c| "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(c)));
    }

    #[test]
    fn test_password_config_defaults() {
        use crate::config::PasswordConfig;
        
        let config = PasswordConfig::default();
        
        assert_eq!(config.expiration_days, 90);
        assert_eq!(config.initial_expiration_days, 7);
        assert_eq!(config.history_limit, 5);
        assert_eq!(config.bcrypt_cost, 12);
        assert_eq!(config.warning_days_before_expiry, 7);
        assert_eq!(config.min_length, 8);
        assert_eq!(config.max_length, 128);
    }

    #[test]
    fn test_password_config_durations() {
        use crate::config::PasswordConfig;
        
        let config = PasswordConfig::default();
        
        // Test duration calculations
        let expiration = config.expiration_duration();
        assert_eq!(expiration.num_days(), 90);
        
        let initial_expiration = config.initial_expiration_duration();
        assert_eq!(initial_expiration.num_days(), 7);
        
        let warning = config.warning_threshold_duration();
        assert_eq!(warning.num_days(), 7);
    }
}

