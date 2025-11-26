//! Password hashing and validation

use crate::config::password_config::{PasswordConfig, PasswordStrength};
use crate::errors::{AppError, AppResult};
use bcrypt::{hash, verify};
use rand::distributions::Alphanumeric;
use rand::{Rng, seq::SliceRandom};

/// Password manager
pub struct PasswordManager;

impl PasswordManager {
    /// Get password configuration
    fn get_config() -> PasswordConfig {
        PasswordConfig::from_env()
    }
    /// Hash a password using bcrypt with configurable cost factor
    /// This provides strong security while maintaining reasonable performance
    pub fn hash_password(password: &str) -> AppResult<String> {
        let config = Self::get_config();
        hash(password, config.bcrypt_cost)
            .map_err(|e| AppError::Internal(format!("Password hashing failed: {}", e)))
    }

    /// Verify a password against its hash
    pub fn verify_password(password: &str, hash: &str) -> AppResult<bool> {
        verify(password, hash)
            .map_err(|e| AppError::Internal(format!("Password verification failed: {}", e)))
    }

    /// Unified password strength validator
    /// Validates password strength with configurable requirements
    pub fn validate_password_strength(password: &str) -> AppResult<()> {
        let config = Self::get_config();
        
        // Common banned passwords list
        let banned_passwords = ["password", "12345678", "password123", "admin123", "qwerty123",
            "welcome123", "letmein", "monkey", "dragon", "master"];
        
        let password_lower = password.to_lowercase();
        if banned_passwords.contains(&password_lower.as_str()) {
            return Err(AppError::Validation(
                "Password is too common. Please choose a stronger password.".to_string(),
            ));
        }

        if password.len() < config.min_length {
            return Err(AppError::Validation(
                format!("Password must be at least {} characters long", config.min_length),
            ));
        }

        if password.len() > config.max_length {
            return Err(AppError::Validation(
                format!("Password must be no more than {} characters long", config.max_length),
            ));
        }

        if config.require_uppercase && !password.chars().any(|c| c.is_uppercase()) {
            return Err(AppError::Validation(
                "Password must contain at least one uppercase letter".to_string(),
            ));
        }

        if config.require_lowercase && !password.chars().any(|c| c.is_lowercase()) {
            return Err(AppError::Validation(
                "Password must contain at least one lowercase letter".to_string(),
            ));
        }

        if config.require_number && !password.chars().any(|c| c.is_numeric()) {
            return Err(AppError::Validation(
                "Password must contain at least one number".to_string(),
            ));
        }

        if config.require_special && !password
            .chars()
            .any(|c| "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(c))
        {
            return Err(AppError::Validation(
                "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)".to_string(),
            ));
        }

        // Check for common patterns
        if password.chars().all(|c| c.is_ascii_alphanumeric() || "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(c)) {
            // Check for sequential characters (e.g., "1234", "abcd")
            let chars: Vec<char> = password.chars().collect();
            let mut sequential_count = 1;
            for i in 1..chars.len() {
                if chars[i] as u32 == chars[i-1] as u32 + 1 {
                    sequential_count += 1;
                    if sequential_count > config.max_sequential_chars {
                        return Err(AppError::Validation(
                            format!("Password contains more than {} sequential characters. Please choose a stronger password.", config.max_sequential_chars),
                        ));
                    }
                } else {
                    sequential_count = 1;
                }
            }
        }

        Ok(())
    }
    
    /// Calculate password strength score
    /// Returns a strength level (weak, fair, good, strong)
    pub fn calculate_password_strength(password: &str) -> PasswordStrength {
        let mut score: u32 = 0;
        
        // Length scoring
        if password.len() >= 16 {
            score += 3;
        } else if password.len() >= 12 {
            score += 2;
        } else if password.len() >= 8 {
            score += 1;
        }
        
        // Character variety
        if password.chars().any(|c| c.is_uppercase()) {
            score += 1;
        }
        if password.chars().any(|c| c.is_lowercase()) {
            score += 1;
        }
        if password.chars().any(|c| c.is_numeric()) {
            score += 1;
        }
        if password.chars().any(|c| "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(c)) {
            score += 1;
        }
        
        // Complexity bonus
        if password.len() >= 20 {
            score += 1;
        }
        
        // Check for common patterns (penalty)
        let password_lower = password.to_lowercase();
        let banned = ["password", "12345678", "password123", "admin123", "qwerty123"];
        if banned.contains(&password_lower.as_str()) {
            score = 0;
        }
        
        // Score is always non-negative (u32), so we can safely match
        if score <= 2 {
            PasswordStrength::Weak
        } else if score <= 4 {
            PasswordStrength::Fair
        } else if score <= 6 {
            PasswordStrength::Good
        } else {
            PasswordStrength::Strong
        }
    }

    /// Generate a secure random token for password reset
    pub fn generate_reset_token() -> AppResult<String> {
        let token: String = rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(32)
            .map(char::from)
            .collect();

        Ok(token)
    }

    /// Generate a secure initial password for testing/pre-production
    /// 
    /// Creates a password that meets all validation requirements:
    /// - 12-16 characters long
    /// - Contains uppercase, lowercase, number, and special character
    /// - Cryptographically secure random generation
    /// 
    /// Format: [Upper][Lower][Number][Special][RandomChars]
    pub fn generate_initial_password() -> AppResult<String> {
        // Character sets (exclude ambiguous characters)
        const UPPERCASE: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ"; // Exclude I and O for clarity
        const LOWERCASE: &[u8] = b"abcdefghijkmnpqrstuvwxyz"; // Exclude l and o
        const NUMBERS: &[u8] = b"23456789"; // Exclude 0 and 1
        const SPECIAL: &[u8] = b"!@#$%^&*()_+-=[]{}|;:,.<>?";
        const ALL_CHARS: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*()_+-=[]{}|;:,.<>?";
        
        let mut rng = rand::thread_rng();
        
        // Ensure we have at least one of each required character type
        let mut password = String::new();
        
        // Add one uppercase
        password.push(char::from(*UPPERCASE.choose(&mut rng)
            .ok_or_else(|| AppError::Internal("Failed to generate password: UPPERCASE character set is empty".to_string()))?));
        
        // Add one lowercase
        password.push(char::from(*LOWERCASE.choose(&mut rng)
            .ok_or_else(|| AppError::Internal("Failed to generate password: LOWERCASE character set is empty".to_string()))?));
        
        // Add one number
        password.push(char::from(*NUMBERS.choose(&mut rng)
            .ok_or_else(|| AppError::Internal("Failed to generate password: NUMBERS character set is empty".to_string()))?));
        
        // Add one special character
        password.push(char::from(*SPECIAL.choose(&mut rng)
            .ok_or_else(|| AppError::Internal("Failed to generate password: SPECIAL character set is empty".to_string()))?));
        
        // Add random characters to reach 12-16 total length
        let target_length = rng.gen_range(12..=16);
        while password.len() < target_length {
            password.push(char::from(*ALL_CHARS.choose(&mut rng)
                .ok_or_else(|| AppError::Internal("Failed to generate password: ALL_CHARS character set is empty".to_string()))?));
        }
        
        // Shuffle the password to avoid predictable pattern
        let mut chars: Vec<char> = password.chars().collect();
        chars.shuffle(&mut rng);
        password = chars.into_iter().collect();
        
        // Validate the generated password meets requirements
        Self::validate_password_strength(&password)?;
        
        Ok(password)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

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
}
