//! Tests for FileValidator

use reconciliation_backend::services::validation::file::FileValidator;
use regex::Regex;

#[cfg(test)]
mod validation_file_tests {
    use super::*;

    #[test]
    fn test_file_validator_creation() {
        let validator = FileValidator::new();
        assert!(validator.is_ok());
    }

    #[test]
    fn test_file_validator_with_regex() {
        let custom_regex = Regex::new(r"^\.(csv|json)$").unwrap();
        let validator = FileValidator::with_regex(custom_regex);
        
        // Should accept csv and json
        assert!(validator.validate_filename("test.csv").is_ok());
        assert!(validator.validate_filename("data.json").is_ok());
        
        // Should reject xlsx (not in custom regex)
        assert!(validator.validate_filename("data.xlsx").is_err());
    }

    #[test]
    fn test_validate_filename_valid() {
        let validator = FileValidator::new().unwrap();

        let valid_filenames = vec![
            "test.csv",
            "data.xlsx",
            "report.xls",
            "config.json",
            "log.txt",
            "data.xml",
            "file_name.csv",
            "file-name.csv",
            "file123.csv",
        ];

        for filename in valid_filenames {
            assert!(validator.validate_filename(filename).is_ok(), "Filename '{}' should be valid", filename);
        }
    }

    #[test]
    fn test_validate_filename_invalid() {
        let validator = FileValidator::new().unwrap();

        let invalid_filenames = vec![
            "",
            "file.exe",
            "page.html",
            "code.php",
            "data.sql",
            "file.zip",
            "document.pdf",
            "../etc/passwd",
            "C:\\Windows\\System32",
            "/etc/passwd",
            "file<script>.csv",
            "file",
        ];

        for filename in invalid_filenames {
            assert!(validator.validate_filename(filename).is_err(), "Filename '{}' should be invalid", filename);
        }
    }

    #[test]
    fn test_validate_filename_too_long() {
        let validator = FileValidator::new().unwrap();

        // Create a filename that's exactly 255 characters
        let long_filename = format!("{}.csv", "a".repeat(250));
        assert!(validator.validate_filename(&long_filename).is_ok());

        // Create a filename that's over 255 characters
        let too_long_filename = format!("{}.csv", "a".repeat(251));
        assert!(validator.validate_filename(&too_long_filename).is_err());
    }

    #[test]
    fn test_validate_filename_path_traversal() {
        let validator = FileValidator::new().unwrap();

        // Path traversal attempts
        assert!(validator.validate_filename("../file.csv").is_err());
        assert!(validator.validate_filename("../../file.csv").is_err());
        assert!(validator.validate_filename("..\\file.csv").is_err());
        assert!(validator.validate_filename("file/../other.csv").is_err());
    }

    #[test]
    fn test_validate_filename_no_extension() {
        let validator = FileValidator::new().unwrap();

        // Files without extensions
        assert!(validator.validate_filename("file").is_err());
        assert!(validator.validate_filename("file.").is_err());
    }

    #[test]
    fn test_validate_file_size_valid() {
        let validator = FileValidator::new().unwrap();

        // Valid sizes
        assert!(validator.validate_size(1024, 10240).is_ok()); // 1KB within 10KB limit
        assert!(validator.validate_size(10240, 10240).is_ok()); // Exactly at limit
        assert!(validator.validate_size(0, 10240).is_err()); // Empty file (should fail)
    }

    #[test]
    fn test_validate_file_size_invalid() {
        let validator = FileValidator::new().unwrap();

        // Invalid sizes
        assert!(validator.validate_size(10241, 10240).is_err()); // Over limit
        assert!(validator.validate_size(1048576, 10240).is_err()); // Much larger
    }

    #[test]
    fn test_validate_file_size_edge_cases() {
        let validator = FileValidator::new().unwrap();

        // Edge cases
        assert!(validator.validate_size(1, 10240).is_ok()); // One byte
        assert!(validator.validate_size(10239, 10240).is_ok()); // One byte under limit
        assert!(validator.validate_size(10240, 10240).is_ok()); // Exactly at limit
        assert!(validator.validate_size(10241, 10240).is_err()); // One byte over limit
    }

    #[test]
    fn test_validate_file_size_large_files() {
        let validator = FileValidator::new().unwrap();

        // Large file limits
        let max_size = 10 * 1024 * 1024; // 10MB
        assert!(validator.validate_size(max_size - 1, max_size).is_ok());
        assert!(validator.validate_size(max_size, max_size).is_ok());
        assert!(validator.validate_size(max_size + 1, max_size).is_err());
    }
}

