//! Tests for BusinessRulesValidator

use reconciliation_backend::services::validation::business_rules::BusinessRulesValidator;
use std::collections::HashMap;

#[cfg(test)]
mod validation_business_rules_tests {
    use super::*;

    #[test]
    fn test_business_rules_validator_creation() {
        let validator = BusinessRulesValidator::new();
        assert!(validator.is_ok());
    }

    #[test]
    fn test_validate_user_business_rules() {
        let validator = BusinessRulesValidator::new().unwrap();

        // Valid user roles
        let valid_roles = vec!["admin", "user", "analyst", "viewer"];
        
        for role in valid_roles {
            let mut data = HashMap::new();
            data.insert("role".to_string(), serde_json::json!(role));
            
            assert!(validator.validate("user", &data).is_ok(), "Role '{}' should be valid", role);
        }

        // Invalid user role
        let mut invalid_data = HashMap::new();
        invalid_data.insert("role".to_string(), serde_json::json!("invalid_role"));
        
        assert!(validator.validate("user", &invalid_data).is_err());
    }

    #[test]
    fn test_validate_project_business_rules() {
        let validator = BusinessRulesValidator::new().unwrap();

        // Valid max concurrent users
        let mut valid_data = HashMap::new();
        valid_data.insert("max_concurrent_users".to_string(), serde_json::json!(50));
        assert!(validator.validate("project", &valid_data).is_ok());

        // At limit
        let mut at_limit_data = HashMap::new();
        at_limit_data.insert("max_concurrent_users".to_string(), serde_json::json!(100));
        assert!(validator.validate("project", &at_limit_data).is_ok());

        // Over limit
        let mut invalid_data = HashMap::new();
        invalid_data.insert("max_concurrent_users".to_string(), serde_json::json!(101));
        assert!(validator.validate("project", &invalid_data).is_err());
    }

    #[test]
    fn test_validate_reconciliation_job_business_rules() {
        let validator = BusinessRulesValidator::new().unwrap();

        // Valid confidence threshold
        let mut valid_data = HashMap::new();
        valid_data.insert("confidence_threshold".to_string(), serde_json::json!(0.5));
        assert!(validator.validate("reconciliation_job", &valid_data).is_ok());

        // At minimum
        let mut min_data = HashMap::new();
        min_data.insert("confidence_threshold".to_string(), serde_json::json!(0.0));
        assert!(validator.validate("reconciliation_job", &min_data).is_ok());

        // At maximum
        let mut max_data = HashMap::new();
        max_data.insert("confidence_threshold".to_string(), serde_json::json!(1.0));
        assert!(validator.validate("reconciliation_job", &max_data).is_ok());

        // Below minimum
        let mut invalid_data = HashMap::new();
        invalid_data.insert("confidence_threshold".to_string(), serde_json::json!(-0.1));
        assert!(validator.validate("reconciliation_job", &invalid_data).is_err());

        // Above maximum
        let mut invalid_data2 = HashMap::new();
        invalid_data2.insert("confidence_threshold".to_string(), serde_json::json!(1.1));
        assert!(validator.validate("reconciliation_job", &invalid_data2).is_err());
    }

    #[test]
    fn test_validate_data_source_business_rules() {
        let validator = BusinessRulesValidator::new().unwrap();

        // Valid source types
        let valid_types = vec!["csv", "xlsx", "xls", "json", "xml", "database"];
        
        for source_type in valid_types {
            let mut data = HashMap::new();
            data.insert("source_type".to_string(), serde_json::json!(source_type));
            
            assert!(validator.validate("data_source", &data).is_ok(), "Source type '{}' should be valid", source_type);
        }

        // Invalid source type
        let mut invalid_data = HashMap::new();
        invalid_data.insert("source_type".to_string(), serde_json::json!("invalid_type"));
        
        assert!(validator.validate("data_source", &invalid_data).is_err());
    }

    #[test]
    fn test_validate_unknown_entity_type() {
        let validator = BusinessRulesValidator::new().unwrap();

        let mut data = HashMap::new();
        data.insert("name".to_string(), serde_json::json!("test"));
        
        assert!(validator.validate("unknown_entity", &data).is_err());
    }

    #[test]
    fn test_validate_business_rules_empty_data() {
        let validator = BusinessRulesValidator::new().unwrap();

        let empty_data = HashMap::new();
        
        // Empty data should be valid for entities that don't require specific fields
        assert!(validator.validate("user", &empty_data).is_ok());
        assert!(validator.validate("project", &empty_data).is_ok());
        assert!(validator.validate("reconciliation_job", &empty_data).is_ok());
        assert!(validator.validate("data_source", &empty_data).is_ok());
    }

    #[test]
    fn test_validate_business_rules_optional_fields() {
        let validator = BusinessRulesValidator::new().unwrap();

        // User without role (optional)
        let mut user_data = HashMap::new();
        user_data.insert("email".to_string(), serde_json::json!("test@example.com"));
        assert!(validator.validate("user", &user_data).is_ok());

        // Project without max_concurrent_users (optional)
        let mut project_data = HashMap::new();
        project_data.insert("name".to_string(), serde_json::json!("Test Project"));
        assert!(validator.validate("project", &project_data).is_ok());
    }
}

