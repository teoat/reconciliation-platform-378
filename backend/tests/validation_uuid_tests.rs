//! Tests for UuidValidator

use reconciliation_backend::services::validation::uuid::UuidValidator;

#[cfg(test)]
mod validation_uuid_tests {
    use super::*;

    #[test]
    fn test_uuid_validator_creation() {
        let validator = UuidValidator::new();
        assert!(validator.is_ok());
    }

    #[test]
    fn test_validate_uuid_valid() {
        let validator = UuidValidator::new().unwrap();

        let valid_uuids = vec![
            "550e8400-e29b-41d4-a716-446655440000", // UUID v4
            "6ba7b810-9dad-11d1-80b4-00c04fd430c8", // UUID v1
            "00000000-0000-0000-0000-000000000000", // Nil UUID
            "ffffffff-ffff-ffff-ffff-ffffffffffff", // Max UUID
        ];

        for uuid_str in valid_uuids {
            let result = validator.validate(uuid_str);
            assert!(result.is_ok(), "UUID '{}' should be valid", uuid_str);
            assert_eq!(result.unwrap().to_string(), uuid_str);
        }
    }

    #[test]
    fn test_validate_uuid_invalid() {
        let validator = UuidValidator::new().unwrap();

        let invalid_uuids = vec![
            "",
            "invalid-uuid",
            "550e8400-e29b-41d4-a716", // Too short
            "550e8400-e29b-41d4-a716-446655440000-extra", // Too long
            "550e8400e29b41d4a716446655440000", // No dashes
            "gggggggg-gggg-gggg-gggg-gggggggggggg", // Invalid hex
            "550e8400-e29b-41d4-a716-44665544000g", // Invalid character
        ];

        for uuid_str in invalid_uuids {
            assert!(validator.validate(uuid_str).is_err(), "UUID '{}' should be invalid", uuid_str);
        }
    }

    #[test]
    fn test_validate_uuid_different_versions() {
        let validator = UuidValidator::new().unwrap();

        // Test different UUID versions
        let uuid_v1 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
        let uuid_v4 = "550e8400-e29b-41d4-a716-446655440000";
        let uuid_v5 = "886313e1-3b8a-5372-9b90-0c9aee199e5d";

        assert!(validator.validate(uuid_v1).is_ok());
        assert!(validator.validate(uuid_v4).is_ok());
        assert!(validator.validate(uuid_v5).is_ok());
    }

    #[test]
    fn test_validate_uuid_case_insensitive() {
        let validator = UuidValidator::new().unwrap();

        // UUIDs should be case-insensitive
        let uppercase = "550E8400-E29B-41D4-A716-446655440000";
        let lowercase = "550e8400-e29b-41d4-a716-446655440000";
        let mixed = "550E8400-e29b-41D4-A716-446655440000";

        assert!(validator.validate(uppercase).is_ok());
        assert!(validator.validate(lowercase).is_ok());
        assert!(validator.validate(mixed).is_ok());
    }
}

