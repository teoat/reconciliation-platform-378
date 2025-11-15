//! Business rules validation

use crate::errors::{AppError, AppResult};
use std::collections::HashMap;

pub struct BusinessRulesValidator;

impl BusinessRulesValidator {
    pub fn new() -> AppResult<Self> {
        Ok(Self)
    }

    pub fn validate(&self, entity_type: &str, data: &HashMap<String, serde_json::Value>) -> Result<(), AppError> {
        match entity_type {
            "user" => self.validate_user_business_rules(data)?,
            "project" => self.validate_project_business_rules(data)?,
            "reconciliation_job" => self.validate_reconciliation_job_business_rules(data)?,
            "data_source" => self.validate_data_source_business_rules(data)?,
            _ => return Err(AppError::Validation("Unknown entity type".to_string())),
        }

        Ok(())
    }

    fn validate_user_business_rules(&self, data: &HashMap<String, serde_json::Value>) -> AppResult<()> {
        if let Some(role) = data.get("role") {
            if let Some(role_str) = role.as_str() {
                let valid_roles = vec!["admin", "user", "analyst", "viewer"];
                if !valid_roles.contains(&role_str) {
                    return Err(AppError::Validation(
                        format!("Invalid role: {}. Valid roles are: {}", role_str, valid_roles.join(", "))
                    ));
                }
            }
        }

        Ok(())
    }

    fn validate_project_business_rules(&self, data: &HashMap<String, serde_json::Value>) -> AppResult<()> {
        if let Some(max_users) = data.get("max_concurrent_users") {
            if let Some(max_users_num) = max_users.as_u64() {
                if max_users_num > 100 {
                    return Err(AppError::Validation(
                        "Maximum concurrent users cannot exceed 100".to_string()
                    ));
                }
            }
        }

        Ok(())
    }

    fn validate_reconciliation_job_business_rules(&self, data: &HashMap<String, serde_json::Value>) -> AppResult<()> {
        if let Some(confidence_threshold) = data.get("confidence_threshold") {
            if let Some(threshold) = confidence_threshold.as_f64() {
                if !(0.0..=1.0).contains(&threshold) {
                    return Err(AppError::Validation(
                        "Confidence threshold must be between 0.0 and 1.0".to_string()
                    ));
                }
            }
        }

        Ok(())
    }

    fn validate_data_source_business_rules(&self, data: &HashMap<String, serde_json::Value>) -> AppResult<()> {
        if let Some(source_type) = data.get("source_type") {
            if let Some(type_str) = source_type.as_str() {
                let valid_types = vec!["csv", "xlsx", "xls", "json", "xml", "database"];
                if !valid_types.contains(&type_str) {
                    return Err(AppError::Validation(
                        format!("Invalid source type: {}. Valid types are: {}", type_str, valid_types.join(", "))
                    ));
                }
            }
        }

        Ok(())
    }
}

