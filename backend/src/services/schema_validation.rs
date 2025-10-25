// backend/src/services/schema_validation.rs
use crate::errors::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use serde_json::Value;
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// Schema definition for data validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemaDefinition {
    pub name: String,
    pub version: String,
    pub fields: HashMap<String, FieldDefinition>,
    pub constraints: Vec<ConstraintDefinition>,
}

/// Field definition in schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldDefinition {
    pub field_type: FieldType,
    pub required: bool,
    pub nullable: bool,
    pub default_value: Option<Value>,
    pub validation_rules: Vec<ValidationRule>,
}

/// Field types supported by schema validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FieldType {
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Uuid,
    Json,
    Array,
    Object,
}

/// Validation rule for fields
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationRule {
    pub rule_type: ValidationRuleType,
    pub parameters: HashMap<String, Value>,
}

/// Types of validation rules
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationRuleType {
    MinLength,
    MaxLength,
    MinValue,
    MaxValue,
    Pattern,
    Enum,
    Custom,
}

/// Constraint definition for schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConstraintDefinition {
    pub constraint_type: ConstraintType,
    pub fields: Vec<String>,
    pub parameters: HashMap<String, Value>,
}

/// Types of constraints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConstraintType {
    Unique,
    ForeignKey,
    Check,
    Index,
}

/// Schema validation service
pub struct SchemaValidationService {
    schemas: HashMap<String, SchemaDefinition>,
}

impl SchemaValidationService {
    pub fn new() -> Self {
        let mut service = Self {
            schemas: HashMap::new(),
        };
        
        // Initialize with default schemas
        service.initialize_default_schemas();
        service
    }

    /// Initialize default schemas for the application
    fn initialize_default_schemas(&mut self) {
        // User schema
        let user_schema = SchemaDefinition {
            name: "user".to_string(),
            version: "1.0".to_string(),
            fields: {
                let mut fields = HashMap::new();
                
                fields.insert("id".to_string(), FieldDefinition {
                    field_type: FieldType::Uuid,
                    required: true,
                    nullable: false,
                    default_value: None,
                    validation_rules: vec![],
                });
                
                fields.insert("email".to_string(), FieldDefinition {
                    field_type: FieldType::String,
                    required: true,
                    nullable: false,
                    default_value: None,
                    validation_rules: vec![
                        ValidationRule {
                            rule_type: ValidationRuleType::Pattern,
                            parameters: {
                                let mut params = HashMap::new();
                                params.insert("pattern".to_string(), Value::String(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$".to_string()));
                                params
                            },
                        },
                        ValidationRule {
                            rule_type: ValidationRuleType::MaxLength,
                            parameters: {
                                let mut params = HashMap::new();
                                params.insert("max_length".to_string(), Value::Number(254.into()));
                                params
                            },
                        },
                    ],
                });
                
                fields.insert("password_hash".to_string(), FieldDefinition {
                    field_type: FieldType::String,
                    required: true,
                    nullable: false,
                    default_value: None,
                    validation_rules: vec![
                        ValidationRule {
                            rule_type: ValidationRuleType::MinLength,
                            parameters: {
                                let mut params = HashMap::new();
                                params.insert("min_length".to_string(), Value::Number(8.into()));
                                params
                            },
                        },
                    ],
                });
                
                fields.insert("first_name".to_string(), FieldDefinition {
                    field_type: FieldType::String,
                    required: true,
                    nullable: false,
                    default_value: None,
                    validation_rules: vec![
                        ValidationRule {
                            rule_type: ValidationRuleType::MinLength,
                            parameters: {
                                let mut params = HashMap::new();
                                params.insert("min_length".to_string(), Value::Number(1.into()));
                                params
                            },
                        },
                        ValidationRule {
                            rule_type: ValidationRuleType::MaxLength,
                            parameters: {
                                let mut params = HashMap::new();
                                params.insert("max_length".to_string(), Value::Number(100.into()));
                                params
                            },
                        },
                    ],
                });
                
                fields.insert("last_name".to_string(), FieldDefinition {
                    field_type: FieldType::String,
                    required: true,
                    nullable: false,
                    default_value: None,
                    validation_rules: vec![
                        ValidationRule {
                            rule_type: ValidationRuleType::MinLength,
                            parameters: {
                                let mut params = HashMap::new();
                                params.insert("min_length".to_string(), Value::Number(1.into()));
                                params
                            },
                        },
                        ValidationRule {
                            rule_type: ValidationRuleType::MaxLength,
                            parameters: {
                                let mut params = HashMap::new();
                                params.insert("max_length".to_string(), Value::Number(100.into()));
                                params
                            },
                        },
                    ],
                });
                
                fields.insert("role".to_string(), FieldDefinition {
                    field_type: FieldType::String,
                    required: true,
                    nullable: false,
                    default_value: Some(Value::String("user".to_string())),
                    validation_rules: vec![
                        ValidationRule {
                            rule_type: ValidationRuleType::Enum,
                            parameters: {
                                let mut params = HashMap::new();
                                params.insert("values".to_string(), Value::Array(vec![
                                    Value::String("admin".to_string()),
                                    Value::String("user".to_string()),
                                    Value::String("analyst".to_string()),
                                    Value::String("viewer".to_string()),
                                ]));
                                params
                            },
                        },
                    ],
                });
                
                fields.insert("is_active".to_string(), FieldDefinition {
                    field_type: FieldType::Boolean,
                    required: true,
                    nullable: false,
                    default_value: Some(Value::Bool(true)),
                    validation_rules: vec![],
                });
                
                fields.insert("created_at".to_string(), FieldDefinition {
                    field_type: FieldType::DateTime,
                    required: true,
                    nullable: false,
                    default_value: None,
                    validation_rules: vec![],
                });
                
                fields.insert("updated_at".to_string(), FieldDefinition {
                    field_type: FieldType::DateTime,
                    required: true,
                    nullable: false,
                    default_value: None,
                    validation_rules: vec![],
                });
                
                fields
            },
            constraints: vec![
                ConstraintDefinition {
                    constraint_type: ConstraintType::Unique,
                    fields: vec!["email".to_string()],
                    parameters: HashMap::new(),
                },
            ],
        };
        
        self.schemas.insert("user".to_string(), user_schema);

        // Project schema
        let project_schema = SchemaDefinition {
            name: "project".to_string(),
            version: "1.0".to_string(),
            fields: {
                let mut fields = HashMap::new();
                
                fields.insert("id".to_string(), FieldDefinition {
                    field_type: FieldType::Uuid,
                    required: true,
                    nullable: false,
                    default_value: None,
                    validation_rules: vec![],
                });
                
                fields.insert("name".to_string(), FieldDefinition {
                    field_type: FieldType::String,
                    required: true,
                    nullable: false,
                    default_value: None,
                    validation_rules: vec![
                        ValidationRule {
                            rule_type: ValidationRuleType::MinLength,
                            parameters: {
                                let mut params = HashMap::new();
                                params.insert("min_length".to_string(), Value::Number(1.into()));
                                params
                            },
                        },
                        ValidationRule {
                            rule_type: ValidationRuleType::MaxLength,
                            parameters: {
                                let mut params = HashMap::new();
                                params.insert("max_length".to_string(), Value::Number(200.into()));
                                params
                            },
                        },
                    ],
                });
                
                fields.insert("description".to_string(), FieldDefinition {
                    field_type: FieldType::String,
                    required: false,
                    nullable: true,
                    default_value: None,
                    validation_rules: vec![
                        ValidationRule {
                            rule_type: ValidationRuleType::MaxLength,
                            parameters: {
                                let mut params = HashMap::new();
                                params.insert("max_length".to_string(), Value::Number(1000.into()));
                                params
                            },
                        },
                    ],
                });
                
                fields.insert("owner_id".to_string(), FieldDefinition {
                    field_type: FieldType::Uuid,
                    required: true,
                    nullable: false,
                    default_value: None,
                    validation_rules: vec![],
                });
                
                fields.insert("settings".to_string(), FieldDefinition {
                    field_type: FieldType::Json,
                    required: false,
                    nullable: true,
                    default_value: Some(Value::Object(serde_json::Map::new())),
                    validation_rules: vec![],
                });
                
                fields.insert("created_at".to_string(), FieldDefinition {
                    field_type: FieldType::DateTime,
                    required: true,
                    nullable: false,
                    default_value: None,
                    validation_rules: vec![],
                });
                
                fields.insert("updated_at".to_string(), FieldDefinition {
                    field_type: FieldType::DateTime,
                    required: true,
                    nullable: false,
                    default_value: None,
                    validation_rules: vec![],
                });
                
                fields
            },
            constraints: vec![
                ConstraintDefinition {
                    constraint_type: ConstraintType::ForeignKey,
                    fields: vec!["owner_id".to_string()],
                    parameters: {
                        let mut params = HashMap::new();
                        params.insert("reference_table".to_string(), Value::String("users".to_string()));
                        params.insert("reference_field".to_string(), Value::String("id".to_string()));
                        params
                    },
                },
            ],
        };
        
        self.schemas.insert("project".to_string(), project_schema);
    }

    /// Register a new schema
    pub fn register_schema(&mut self, schema: SchemaDefinition) -> AppResult<()> {
        if self.schemas.contains_key(&schema.name) {
            return Err(AppError::ValidationError(
                format!("Schema '{}' already exists", schema.name)
            ));
        }
        
        self.schemas.insert(schema.name.clone(), schema);
        Ok(())
    }

    /// Validate data against a schema
    pub fn validate_against_schema(&self, schema_name: &str, data: &HashMap<String, Value>) -> AppResult<()> {
        let schema = self.schemas.get(schema_name)
            .ok_or_else(|| AppError::ValidationError(format!("Schema '{}' not found", schema_name)))?;

        // Validate required fields
        for (field_name, field_def) in &schema.fields {
            if field_def.required && !data.contains_key(field_name) {
                return Err(AppError::ValidationError(
                    format!("Required field '{}' is missing", field_name)
                ));
            }
        }

        // Validate field types and rules
        for (field_name, value) in data {
            if let Some(field_def) = schema.fields.get(field_name) {
                self.validate_field(field_name, value, field_def)?;
            } else {
                return Err(AppError::ValidationError(
                    format!("Unknown field '{}' in schema '{}'", field_name, schema_name)
                ));
            }
        }

        // Validate constraints
        for constraint in &schema.constraints {
            self.validate_constraint(constraint, data)?;
        }

        Ok(())
    }

    /// Validate a single field
    fn validate_field(&self, field_name: &str, value: &Value, field_def: &FieldDefinition) -> AppResult<()> {
        // Check if value is null
        if value.is_null() {
            if !field_def.nullable {
                return Err(AppError::ValidationError(
                    format!("Field '{}' cannot be null", field_name)
                ));
            }
            return Ok(());
        }

        // Validate field type
        self.validate_field_type(field_name, value, &field_def.field_type)?;

        // Apply validation rules
        for rule in &field_def.validation_rules {
            self.apply_validation_rule(field_name, value, rule)?;
        }

        Ok(())
    }

    /// Validate field type
    fn validate_field_type(&self, field_name: &str, value: &Value, field_type: &FieldType) -> AppResult<()> {
        match field_type {
            FieldType::String => {
                if !value.is_string() {
                    return Err(AppError::ValidationError(
                        format!("Field '{}' must be a string", field_name)
                    ));
                }
            }
            FieldType::Integer => {
                if !value.is_i64() {
                    return Err(AppError::ValidationError(
                        format!("Field '{}' must be an integer", field_name)
                    ));
                }
            }
            FieldType::Float => {
                if !value.is_f64() {
                    return Err(AppError::ValidationError(
                        format!("Field '{}' must be a number", field_name)
                    ));
                }
            }
            FieldType::Boolean => {
                if !value.is_boolean() {
                    return Err(AppError::ValidationError(
                        format!("Field '{}' must be a boolean", field_name)
                    ));
                }
            }
            FieldType::DateTime => {
                if !value.is_string() {
                    return Err(AppError::ValidationError(
                        format!("Field '{}' must be a string", field_name)
                    ));
                }
                
                let date_str = value.as_str().unwrap();
                DateTime::parse_from_rfc3339(date_str)
                    .map_err(|_| AppError::ValidationError(
                        format!("Field '{}' must be a valid RFC3339 datetime", field_name)
                    ))?;
            }
            FieldType::Uuid => {
                if !value.is_string() {
                    return Err(AppError::ValidationError(
                        format!("Field '{}' must be a string", field_name)
                    ));
                }
                
                let uuid_str = value.as_str().unwrap();
                Uuid::parse_str(uuid_str)
                    .map_err(|_| AppError::ValidationError(
                        format!("Field '{}' must be a valid UUID", field_name)
                    ))?;
            }
            FieldType::Json => {
                // JSON type accepts any valid JSON value
            }
            FieldType::Array => {
                if !value.is_array() {
                    return Err(AppError::ValidationError(
                        format!("Field '{}' must be an array", field_name)
                    ));
                }
            }
            FieldType::Object => {
                if !value.is_object() {
                    return Err(AppError::ValidationError(
                        format!("Field '{}' must be an object", field_name)
                    ));
                }
            }
        }

        Ok(())
    }

    /// Apply validation rule to a field
    fn apply_validation_rule(&self, field_name: &str, value: &Value, rule: &ValidationRule) -> AppResult<()> {
        match rule.rule_type {
            ValidationRuleType::MinLength => {
                if let Some(min_length) = rule.parameters.get("min_length").and_then(|v| v.as_u64()) {
                    if let Some(str_value) = value.as_str() {
                        if str_value.len() < min_length as usize {
                            return Err(AppError::ValidationError(
                                format!("Field '{}' length {} is less than minimum {}", field_name, str_value.len(), min_length)
                            ));
                        }
                    }
                }
            }
            ValidationRuleType::MaxLength => {
                if let Some(max_length) = rule.parameters.get("max_length").and_then(|v| v.as_u64()) {
                    if let Some(str_value) = value.as_str() {
                        if str_value.len() > max_length as usize {
                            return Err(AppError::ValidationError(
                                format!("Field '{}' length {} exceeds maximum {}", field_name, str_value.len(), max_length)
                            ));
                        }
                    }
                }
            }
            ValidationRuleType::MinValue => {
                if let Some(min_value) = rule.parameters.get("min_value").and_then(|v| v.as_f64()) {
                    if let Some(num_value) = value.as_f64() {
                        if num_value < min_value {
                            return Err(AppError::ValidationError(
                                format!("Field '{}' value {} is less than minimum {}", field_name, num_value, min_value)
                            ));
                        }
                    }
                }
            }
            ValidationRuleType::MaxValue => {
                if let Some(max_value) = rule.parameters.get("max_value").and_then(|v| v.as_f64()) {
                    if let Some(num_value) = value.as_f64() {
                        if num_value > max_value {
                            return Err(AppError::ValidationError(
                                format!("Field '{}' value {} exceeds maximum {}", field_name, num_value, max_value)
                            ));
                        }
                    }
                }
            }
            ValidationRuleType::Pattern => {
                if let Some(pattern) = rule.parameters.get("pattern").and_then(|v| v.as_str()) {
                    if let Some(str_value) = value.as_str() {
                        let regex = regex::Regex::new(pattern)
                            .map_err(|_| AppError::ValidationError("Invalid regex pattern".to_string()))?;
                        if !regex.is_match(str_value) {
                            return Err(AppError::ValidationError(
                                format!("Field '{}' does not match required pattern", field_name)
                            ));
                        }
                    }
                }
            }
            ValidationRuleType::Enum => {
                if let Some(allowed_values) = rule.parameters.get("values").and_then(|v| v.as_array()) {
                    if !allowed_values.contains(value) {
                        return Err(AppError::ValidationError(
                            format!("Field '{}' has invalid value. Allowed values: {:?}", field_name, allowed_values)
                        ));
                    }
                }
            }
            ValidationRuleType::Custom => {
                // Custom validation rules would be implemented here
                // For now, we'll skip custom validation
            }
        }

        Ok(())
    }

    /// Validate constraint
    fn validate_constraint(&self, constraint: &ConstraintDefinition, data: &HashMap<String, Value>) -> AppResult<()> {
        match constraint.constraint_type {
            ConstraintType::Unique => {
                // Unique constraint validation would be implemented here
                // This would typically check against the database
            }
            ConstraintType::ForeignKey => {
                // Foreign key constraint validation would be implemented here
                // This would typically check against the referenced table
            }
            ConstraintType::Check => {
                // Check constraint validation would be implemented here
                // This would evaluate custom conditions
            }
            ConstraintType::Index => {
                // Index constraint validation would be implemented here
                // This would typically be handled by the database
            }
        }

        Ok(())
    }

    /// Get schema by name
    pub fn get_schema(&self, schema_name: &str) -> Option<&SchemaDefinition> {
        self.schemas.get(schema_name)
    }

    /// List all available schemas
    pub fn list_schemas(&self) -> Vec<String> {
        self.schemas.keys().cloned().collect()
    }

    /// Validate data integrity across multiple entities
    pub fn validate_data_integrity(&self, entities: &HashMap<String, HashMap<String, Value>>) -> AppResult<()> {
        for (entity_type, data) in entities {
            if let Some(schema) = self.schemas.get(entity_type) {
                self.validate_against_schema(entity_type, data)?;
            }
        }

        // Cross-entity validation
        self.validate_cross_entity_constraints(entities)?;

        Ok(())
    }

    /// Validate cross-entity constraints
    fn validate_cross_entity_constraints(&self, entities: &HashMap<String, HashMap<String, Value>>) -> AppResult<()> {
        // Example: Validate that project owner exists in users
        if let Some(projects) = entities.get("project") {
            if let Some(users) = entities.get("user") {
                for project in projects.values() {
                    if let Some(owner_id) = project.get("owner_id").and_then(|v| v.as_str()) {
                        let user_exists = users.values().any(|user| {
                            user.get("id").and_then(|v| v.as_str()) == Some(owner_id)
                        });
                        
                        if !user_exists {
                            return Err(AppError::ValidationError(
                                format!("Project owner '{}' does not exist in users", owner_id)
                            ));
                        }
                    }
                }
            }
        }

        Ok(())
    }
}

impl Default for SchemaValidationService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_schema_validation() {
        let service = SchemaValidationService::new();
        
        // Valid user data
        let mut user_data = HashMap::new();
        user_data.insert("id".to_string(), json!("550e8400-e29b-41d4-a716-446655440000"));
        user_data.insert("email".to_string(), json!("test@example.com"));
        user_data.insert("password_hash".to_string(), json!("hashed_password"));
        user_data.insert("first_name".to_string(), json!("John"));
        user_data.insert("last_name".to_string(), json!("Doe"));
        user_data.insert("role".to_string(), json!("user"));
        user_data.insert("is_active".to_string(), json!(true));
        user_data.insert("created_at".to_string(), json!("2024-01-01T00:00:00Z"));
        user_data.insert("updated_at".to_string(), json!("2024-01-01T00:00:00Z"));
        
        assert!(service.validate_against_schema("user", &user_data).is_ok());
        
        // Invalid user data (missing required field)
        let mut invalid_user_data = user_data.clone();
        invalid_user_data.remove("email");
        
        assert!(service.validate_against_schema("user", &invalid_user_data).is_err());
        
        // Invalid user data (invalid email format)
        let mut invalid_email_data = user_data.clone();
        invalid_email_data.insert("email".to_string(), json!("invalid-email"));
        
        assert!(service.validate_against_schema("user", &invalid_email_data).is_err());
    }

    #[test]
    fn test_field_type_validation() {
        let service = SchemaValidationService::new();
        
        let mut user_data = HashMap::new();
        user_data.insert("id".to_string(), json!("550e8400-e29b-41d4-a716-446655440000"));
        user_data.insert("email".to_string(), json!("test@example.com"));
        user_data.insert("password_hash".to_string(), json!("hashed_password"));
        user_data.insert("first_name".to_string(), json!("John"));
        user_data.insert("last_name".to_string(), json!("Doe"));
        user_data.insert("role".to_string(), json!("user"));
        user_data.insert("is_active".to_string(), json!(true));
        user_data.insert("created_at".to_string(), json!("2024-01-01T00:00:00Z"));
        user_data.insert("updated_at".to_string(), json!("2024-01-01T00:00:00Z"));
        
        // Invalid UUID format
        let mut invalid_uuid_data = user_data.clone();
        invalid_uuid_data.insert("id".to_string(), json!("not-a-uuid"));
        
        assert!(service.validate_against_schema("user", &invalid_uuid_data).is_err());
        
        // Invalid datetime format
        let mut invalid_datetime_data = user_data.clone();
        invalid_datetime_data.insert("created_at".to_string(), json!("invalid-datetime"));
        
        assert!(service.validate_against_schema("user", &invalid_datetime_data).is_err());
    }
}
