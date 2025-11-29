//! Tests for JsonSchemaValidator

use reconciliation_backend::services::validation::json_schema::JsonSchemaValidator;

#[cfg(test)]
mod validation_json_schema_tests {
    use super::*;

    #[test]
    fn test_json_schema_validator_creation() {
        let validator = JsonSchemaValidator::new();
        assert!(validator.is_ok());
    }

    #[test]
    fn test_validate_json_schema_object() {
        let validator = JsonSchemaValidator::new().unwrap();

        let schema = serde_json::json!({
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "age": {"type": "number"}
            },
            "required": ["name"]
        });

        // Valid object
        let valid_data = r#"{"name": "John", "age": 30}"#;
        assert!(validator.validate(valid_data, &schema).is_ok());

        // Missing required field
        let invalid_data = r#"{"age": 30}"#;
        assert!(validator.validate(invalid_data, &schema).is_err());

        // Wrong type
        let invalid_data2 = r#"{"name": "John", "age": "thirty"}"#;
        assert!(validator.validate(invalid_data2, &schema).is_err());
    }

    #[test]
    fn test_validate_json_schema_array() {
        let validator = JsonSchemaValidator::new().unwrap();

        let schema = serde_json::json!({
            "type": "array",
            "items": {"type": "string"}
        });

        // Valid array
        let valid_data = r#"["item1", "item2", "item3"]"#;
        assert!(validator.validate(valid_data, &schema).is_ok());

        // Invalid - not an array
        let invalid_data = r#"{"not": "array"}"#;
        assert!(validator.validate(invalid_data, &schema).is_err());

        // Invalid - wrong item type
        let invalid_data2 = r#"[1, 2, 3]"#;
        assert!(validator.validate(invalid_data2, &schema).is_err());
    }

    #[test]
    fn test_validate_json_schema_string() {
        let validator = JsonSchemaValidator::new().unwrap();

        let schema = serde_json::json!({
            "type": "string",
            "minLength": 3,
            "maxLength": 10
        });

        // Valid string
        assert!(validator.validate(r#""test""#, &schema).is_ok());
        assert!(validator.validate(r#""testing""#, &schema).is_ok());

        // Too short
        assert!(validator.validate(r#""ab""#, &schema).is_err());

        // Too long
        assert!(validator.validate(r#""this is too long""#, &schema).is_err());

        // Wrong type
        assert!(validator.validate("123", &schema).is_err());
    }

    #[test]
    fn test_validate_json_schema_string_pattern() {
        let validator = JsonSchemaValidator::new().unwrap();

        let schema = serde_json::json!({
            "type": "string",
            "pattern": "^[a-z]+$"
        });

        // Valid - matches pattern
        assert!(validator.validate(r#""test""#, &schema).is_ok());

        // Invalid - doesn't match pattern
        assert!(validator.validate(r#""Test""#, &schema).is_err());
        assert!(validator.validate(r#""test123""#, &schema).is_err());
    }

    #[test]
    fn test_validate_json_schema_number() {
        let validator = JsonSchemaValidator::new().unwrap();

        let schema = serde_json::json!({
            "type": "number",
            "minimum": 0,
            "maximum": 100
        });

        // Valid numbers
        assert!(validator.validate("0", &schema).is_ok());
        assert!(validator.validate("50", &schema).is_ok());
        assert!(validator.validate("100", &schema).is_ok());

        // Invalid - below minimum
        assert!(validator.validate("-1", &schema).is_err());

        // Invalid - above maximum
        assert!(validator.validate("101", &schema).is_err());

        // Invalid - wrong type
        assert!(validator.validate(r#""50""#, &schema).is_err());
    }

    #[test]
    fn test_validate_json_schema_integer() {
        let validator = JsonSchemaValidator::new().unwrap();

        let schema = serde_json::json!({
            "type": "integer",
            "minimum": 0,
            "maximum": 100
        });

        // Valid integers
        assert!(validator.validate("0", &schema).is_ok());
        assert!(validator.validate("50", &schema).is_ok());
        assert!(validator.validate("100", &schema).is_ok());

        // Invalid - not an integer (float)
        assert!(validator.validate("50.5", &schema).is_err());

        // Invalid - wrong type
        assert!(validator.validate(r#""50""#, &schema).is_err());
    }

    #[test]
    fn test_validate_json_schema_boolean() {
        let validator = JsonSchemaValidator::new().unwrap();

        let schema = serde_json::json!({
            "type": "boolean"
        });

        // Valid booleans
        assert!(validator.validate("true", &schema).is_ok());
        assert!(validator.validate("false", &schema).is_ok());

        // Invalid - wrong type
        assert!(validator.validate(r#""true""#, &schema).is_err());
        assert!(validator.validate("1", &schema).is_err());
    }

    #[test]
    fn test_validate_json_schema_invalid_json() {
        let validator = JsonSchemaValidator::new().unwrap();

        let schema = serde_json::json!({
            "type": "object"
        });

        // Invalid JSON format
        assert!(validator.validate("invalid json", &schema).is_err());
        assert!(validator.validate("{invalid}", &schema).is_err());
    }

    #[test]
    fn test_validate_json_schema_unknown_type() {
        let validator = JsonSchemaValidator::new().unwrap();

        let schema = serde_json::json!({
            "type": "unknown_type"
        });

        let data = r#"{"test": "value"}"#;
        assert!(validator.validate(data, &schema).is_err());
    }

    #[test]
    fn test_validate_json_schema_no_type() {
        let validator = JsonSchemaValidator::new().unwrap();

        let schema = serde_json::json!({
            "properties": {
                "name": {"type": "string"}
            }
        });

        let data = r#"{"name": "test"}"#;
        assert!(validator.validate(data, &schema).is_err());
    }
}

