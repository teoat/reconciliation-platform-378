//! JSON schema validation

use crate::errors::{AppError, AppResult};
use regex::Regex;

pub struct JsonSchemaValidator;

impl JsonSchemaValidator {
    pub fn new() -> AppResult<Self> {
        Ok(Self)
    }

    pub fn validate(&self, data: &str, schema: &serde_json::Value) -> Result<(), AppError> {
        let parsed_data: serde_json::Value = serde_json::from_str(data)
            .map_err(|_| AppError::Validation("Invalid JSON format".to_string()))?;

        self.validate_json_against_schema(&parsed_data, schema)
    }

    fn validate_json_against_schema(
        &self,
        data: &serde_json::Value,
        schema: &serde_json::Value,
    ) -> AppResult<()> {
        match schema.get("type") {
            Some(serde_json::Value::String(schema_type)) => match schema_type.as_str() {
                "object" => self.validate_object(data, schema)?,
                "array" => self.validate_array(data, schema)?,
                "string" => self.validate_string(data, schema)?,
                "number" => self.validate_number(data, schema)?,
                "integer" => self.validate_integer(data, schema)?,
                "boolean" => self.validate_boolean(data, schema)?,
                _ => return Err(AppError::Validation("Unknown schema type".to_string())),
            },
            _ => return Err(AppError::Validation("Schema must have a type".to_string())),
        }

        Ok(())
    }

    fn validate_object(
        &self,
        data: &serde_json::Value,
        schema: &serde_json::Value,
    ) -> AppResult<()> {
        if !data.is_object() {
            return Err(AppError::Validation("Expected object".to_string()));
        }

        if let Some(properties) = schema.get("properties") {
            if let Some(properties_obj) = properties.as_object() {
                for (key, prop_schema) in properties_obj {
                    if let Some(data_value) = data.get(key) {
                        self.validate_json_against_schema(data_value, prop_schema)?;
                    } else if schema
                        .get("required")
                        .and_then(|r| r.as_array())
                        .is_some_and(|r| r.contains(&serde_json::Value::String(key.clone())))
                    {
                        return Err(AppError::Validation(format!(
                            "Required field '{}' is missing",
                            key
                        )));
                    }
                }
            }
        }

        Ok(())
    }

    fn validate_array(
        &self,
        data: &serde_json::Value,
        schema: &serde_json::Value,
    ) -> AppResult<()> {
        if !data.is_array() {
            return Err(AppError::Validation("Expected array".to_string()));
        }

        if let Some(items_schema) = schema.get("items") {
            if let Some(array) = data.as_array() {
                for item in array {
                    self.validate_json_against_schema(item, items_schema)?;
                }
            }
        }

        Ok(())
    }

    fn validate_string(
        &self,
        data: &serde_json::Value,
        schema: &serde_json::Value,
    ) -> AppResult<()> {
        if !data.is_string() {
            return Err(AppError::Validation("Expected string".to_string()));
        }

        let string_value = data.as_str().unwrap();

        if let Some(min_length) = schema.get("minLength").and_then(|v| v.as_u64()) {
            if string_value.len() < min_length as usize {
                return Err(AppError::Validation(format!(
                    "String length {} is less than minimum {}",
                    string_value.len(),
                    min_length
                )));
            }
        }

        if let Some(max_length) = schema.get("maxLength").and_then(|v| v.as_u64()) {
            if string_value.len() > max_length as usize {
                return Err(AppError::Validation(format!(
                    "String length {} exceeds maximum {}",
                    string_value.len(),
                    max_length
                )));
            }
        }

        if let Some(pattern) = schema.get("pattern").and_then(|v| v.as_str()) {
            let regex = Regex::new(pattern)
                .map_err(|_| AppError::Validation("Invalid regex pattern in schema".to_string()))?;
            if !regex.is_match(string_value) {
                return Err(AppError::Validation(format!(
                    "String does not match pattern: {}",
                    pattern
                )));
            }
        }

        Ok(())
    }

    fn validate_number(
        &self,
        data: &serde_json::Value,
        schema: &serde_json::Value,
    ) -> AppResult<()> {
        if !data.is_number() {
            return Err(AppError::Validation("Expected number".to_string()));
        }

        let number_value = data.as_f64().unwrap();

        if let Some(minimum) = schema.get("minimum").and_then(|v| v.as_f64()) {
            if number_value < minimum {
                return Err(AppError::Validation(format!(
                    "Number {} is less than minimum {}",
                    number_value, minimum
                )));
            }
        }

        if let Some(maximum) = schema.get("maximum").and_then(|v| v.as_f64()) {
            if number_value > maximum {
                return Err(AppError::Validation(format!(
                    "Number {} exceeds maximum {}",
                    number_value, maximum
                )));
            }
        }

        Ok(())
    }

    fn validate_integer(
        &self,
        data: &serde_json::Value,
        schema: &serde_json::Value,
    ) -> AppResult<()> {
        if !data.is_number() || !data.is_i64() {
            return Err(AppError::Validation("Expected integer".to_string()));
        }

        let int_value = data.as_i64().unwrap();

        if let Some(minimum) = schema.get("minimum").and_then(|v| v.as_i64()) {
            if int_value < minimum {
                return Err(AppError::Validation(format!(
                    "Integer {} is less than minimum {}",
                    int_value, minimum
                )));
            }
        }

        if let Some(maximum) = schema.get("maximum").and_then(|v| v.as_i64()) {
            if int_value > maximum {
                return Err(AppError::Validation(format!(
                    "Integer {} exceeds maximum {}",
                    int_value, maximum
                )));
            }
        }

        Ok(())
    }

    fn validate_boolean(
        &self,
        data: &serde_json::Value,
        _schema: &serde_json::Value,
    ) -> AppResult<()> {
        if !data.is_boolean() {
            return Err(AppError::Validation("Expected boolean".to_string()));
        }
        Ok(())
    }
}
