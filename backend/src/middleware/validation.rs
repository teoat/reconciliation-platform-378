// backend/src/middleware/validation.rs
use actix_web::{
    dev::{forward_ready, Service, ServiceFactory, ServiceRequest, ServiceResponse},
    Error, HttpMessage, HttpResponse,
};
use futures::future::{LocalBoxFuture, Ready};
use std::{
    rc::Rc,
    task::{Context, Poll},
};
use crate::services::ValidationService;
use crate::errors::AppError;
use actix_web::web::Data;
use serde_json::json;
use std::collections::HashMap;

/// Validation middleware for request validation
pub struct ValidationMiddleware<S> {
    service: Rc<S>,
    validation_service: ValidationService,
}

impl<S> ValidationMiddleware<S> {
    pub fn new(service: Rc<S>) -> Self {
        Self {
            service,
            validation_service: ValidationService::new(),
        }
    }
}

impl<S, B> Service<ServiceRequest> for ValidationMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let validation_service = self.validation_service.clone();

        Box::pin(async move {
            // Extract request data for validation
            let path = req.path().to_string();
            let method = req.method().to_string();
            
            // Validate based on endpoint
            if let Err(validation_error) = validate_endpoint(&validation_service, &path, &method, &req).await {
                let error_response = HttpResponse::BadRequest().json(json!({
                    "error": "VALIDATION_ERROR",
                    "message": validation_error.to_string(),
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }));
                
                return Ok(req.into_response(error_response));
            }

            // Continue with the request
            service.call(req).await
        })
    }
}

/// Validate endpoint-specific requirements
async fn validate_endpoint(
    validation_service: &ValidationService,
    path: &str,
    method: &str,
    req: &ServiceRequest,
) -> Result<(), AppError> {
    match (method.as_str(), path) {
        ("POST", "/api/auth/register") => {
            validate_register_request(validation_service, req).await
        }
        ("POST", "/api/auth/login") => {
            validate_login_request(validation_service, req).await
        }
        ("POST", "/api/projects") => {
            validate_create_project_request(validation_service, req).await
        }
        ("POST", "/api/files/upload") => {
            validate_file_upload_request(validation_service, req).await
        }
        ("POST", "/api/reconciliation/jobs") => {
            validate_create_job_request(validation_service, req).await
        }
        ("PUT", path) if path.starts_with("/api/projects/") => {
            validate_update_project_request(validation_service, req).await
        }
        ("PUT", path) if path.starts_with("/api/users/") => {
            validate_update_user_request(validation_service, req).await
        }
        _ => Ok(()), // No validation needed for other endpoints
    }
}

/// Validate user registration request
async fn validate_register_request(
    validation_service: &ValidationService,
    req: &ServiceRequest,
) -> Result<(), AppError> {
    // Extract JSON body
    let body = extract_json_body(req).await?;
    
    // Validate required fields
    let required_fields = vec!["email", "password", "first_name", "last_name"];
    for field in required_fields {
        if !body.contains_key(field) {
            return Err(AppError::Validation(
                format!("Required field '{}' is missing", field)
            ));
        }
    }

    // Validate email
    if let Some(email) = body.get("email").and_then(|v| v.as_str()) {
        validation_service.validate_email(email)?;
    }

    // Validate password
    if let Some(password) = body.get("password").and_then(|v| v.as_str()) {
        validation_service.validate_password(password)?;
    }

    // Validate names
    if let Some(first_name) = body.get("first_name").and_then(|v| v.as_str()) {
        if first_name.is_empty() || first_name.len() > 100 {
            return Err(AppError::Validation(
                "First name must be between 1 and 100 characters".to_string()
            ));
        }
    }

    if let Some(last_name) = body.get("last_name").and_then(|v| v.as_str()) {
        if last_name.is_empty() || last_name.len() > 100 {
            return Err(AppError::Validation(
                "Last name must be between 1 and 100 characters".to_string()
            ));
        }
    }

    Ok(())
}

/// Validate user login request
async fn validate_login_request(
    validation_service: &ValidationService,
    req: &ServiceRequest,
) -> Result<(), AppError> {
    let body = extract_json_body(req).await?;
    
    // Validate required fields
    let required_fields = vec!["email", "password"];
    for field in required_fields {
        if !body.contains_key(field) {
            return Err(AppError::Validation(
                format!("Required field '{}' is missing", field)
            ));
        }
    }

    // Validate email format
    if let Some(email) = body.get("email").and_then(|v| v.as_str()) {
        validation_service.validate_email(email)?;
    }

    // Validate password is not empty
    if let Some(password) = body.get("password").and_then(|v| v.as_str()) {
        if password.is_empty() {
            return Err(AppError::Validation("Password cannot be empty".to_string()));
        }
    }

    Ok(())
}

/// Validate create project request
async fn validate_create_project_request(
    validation_service: &ValidationService,
    req: &ServiceRequest,
) -> Result<(), AppError> {
    let body = extract_json_body(req).await?;
    
    // Validate required fields
    if !body.contains_key("name") {
                return Err(AppError::Validation("Project name is required".to_string()));
    }

    // Validate project name
    if let Some(name) = body.get("name").and_then(|v| v.as_str()) {
        if name.is_empty() || name.len() > 200 {
            return Err(AppError::Validation(
                "Project name must be between 1 and 200 characters".to_string()
            ));
        }
    }

    // Validate description if provided
    if let Some(description) = body.get("description").and_then(|v| v.as_str()) {
        if description.len() > 1000 {
            return Err(AppError::Validation(
                "Description cannot exceed 1000 characters".to_string()
            ));
        }
    }

    // Validate settings if provided
    if let Some(settings) = body.get("settings") {
        if let Some(settings_obj) = settings.as_object() {
            if let Some(max_users) = settings_obj.get("max_concurrent_users") {
                if let Some(max_users_num) = max_users.as_u64() {
                    if max_users_num > 100 {
                        return Err(AppError::Validation(
                            "Maximum concurrent users cannot exceed 100".to_string()
                        ));
                    }
                }
            }
        }
    }

    Ok(())
}

/// Validate file upload request
async fn validate_file_upload_request(
    validation_service: &ValidationService,
    req: &ServiceRequest,
) -> Result<(), AppError> {
    // Check if request has multipart data
    if req.content_type() != "multipart/form-data" {
                return Err(AppError::Validation(
            "File upload must use multipart/form-data content type".to_string()
        ));
    }

    // Extract multipart data
    let mut payload = actix_multipart::Multipart::new(req.headers(), req.payload());
    
    let mut file_found = false;
    let mut project_id_found = false;

    while let Some(item) = payload.try_next().await.map_err(|_| AppError::Validation("Invalid multipart data".to_string()))? {
        match item.name() {
            "file" => {
                file_found = true;
                
                // Validate filename
                if let Some(filename) = item.filename() {
                    validation_service.validate_filename(filename)?;
                } else {
                    return Err(AppError::Validation("File must have a filename".to_string()));
                }

                // Validate file size (basic check)
                let mut file_data = Vec::new();
                while let Some(chunk) = item.try_next().await.map_err(|_| AppError::Validation("Error reading file data".to_string()))? {
                    file_data.extend_from_slice(&chunk);
                    if file_data.len() > 100 * 1024 * 1024 { // 100MB limit
                        return Err(AppError::Validation(
                            "File size exceeds maximum allowed size of 100MB".to_string()
                        ));
                    }
                }
            }
            "project_id" => {
                project_id_found = true;
                
                // Validate project ID format
                let mut project_id_data = Vec::new();
                while let Some(chunk) = item.try_next().await.map_err(|_| AppError::Validation("Error reading project_id".to_string()))? {
                    project_id_data.extend_from_slice(&chunk);
                }
                
                let project_id_str = String::from_utf8(project_id_data)
                    .map_err(|_| AppError::Validation("Invalid project_id format".to_string()))?;
                
                validation_service.validate_uuid(&project_id_str)?;
            }
            _ => {} // Ignore other fields
        }
    }

    if !file_found {
        return Err(AppError::Validation("File is required".to_string()));
    }

    if !project_id_found {
        return Err(AppError::Validation("project_id is required".to_string()));
    }

    Ok(())
}

/// Validate create reconciliation job request
async fn validate_create_job_request(
    validation_service: &ValidationService,
    req: &ServiceRequest,
) -> Result<(), AppError> {
    let body = extract_json_body(req).await?;
    
    // Validate required fields
    let required_fields = vec!["name", "project_id", "source_data_source_id", "target_data_source_id"];
    for field in required_fields {
        if !body.contains_key(field) {
            return Err(AppError::Validation(
                format!("Required field '{}' is missing", field)
            ));
        }
    }

    // Validate UUID fields
    if let Some(project_id) = body.get("project_id").and_then(|v| v.as_str()) {
        validation_service.validate_uuid(project_id)?;
    }

    if let Some(source_id) = body.get("source_data_source_id").and_then(|v| v.as_str()) {
        validation_service.validate_uuid(source_id)?;
    }

    if let Some(target_id) = body.get("target_data_source_id").and_then(|v| v.as_str()) {
        validation_service.validate_uuid(target_id)?;
    }

    // Validate job name
    if let Some(name) = body.get("name").and_then(|v| v.as_str()) {
        if name.is_empty() || name.len() > 200 {
            return Err(AppError::Validation(
                "Job name must be between 1 and 200 characters".to_string()
            ));
        }
    }

    // Validate confidence threshold
    if let Some(threshold) = body.get("confidence_threshold").and_then(|v| v.as_f64()) {
        if threshold < 0.0 || threshold > 1.0 {
            return Err(AppError::Validation(
                "Confidence threshold must be between 0.0 and 1.0".to_string()
            ));
        }
    }

    // Validate matching rules
    if let Some(rules) = body.get("matching_rules") {
        if let Some(rules_array) = rules.as_array() {
            if rules_array.is_empty() {
                return Err(AppError::Validation(
                    "At least one matching rule is required".to_string()
                ));
            }

            for rule in rules_array {
                if let Some(rule_obj) = rule.as_object() {
                    if !rule_obj.contains_key("field") || !rule_obj.contains_key("type") {
                        return Err(AppError::Validation(
                            "Each matching rule must have 'field' and 'type' properties".to_string()
                        ));
                    }

                    if let Some(rule_type) = rule_obj.get("type").and_then(|v| v.as_str()) {
                        let valid_types = vec!["exact", "fuzzy", "contains", "starts_with", "ends_with"];
                        if !valid_types.contains(&rule_type) {
                            return Err(AppError::Validation(
                                format!("Invalid rule type: {}. Valid types are: {}", rule_type, valid_types.join(", "))
                            ));
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

/// Validate update project request
async fn validate_update_project_request(
    validation_service: &ValidationService,
    req: &ServiceRequest,
) -> Result<(), AppError> {
    let body = extract_json_body(req).await?;
    
    // Validate project name if provided
    if let Some(name) = body.get("name").and_then(|v| v.as_str()) {
        if name.is_empty() || name.len() > 200 {
            return Err(AppError::Validation(
                "Project name must be between 1 and 200 characters".to_string()
            ));
        }
    }

    // Validate description if provided
    if let Some(description) = body.get("description").and_then(|v| v.as_str()) {
        if description.len() > 1000 {
            return Err(AppError::Validation(
                "Description cannot exceed 1000 characters".to_string()
            ));
        }
    }

    Ok(())
}

/// Validate update user request
async fn validate_update_user_request(
    validation_service: &ValidationService,
    req: &ServiceRequest,
) -> Result<(), AppError> {
    let body = extract_json_body(req).await?;
    
    // Validate email if provided
    if let Some(email) = body.get("email").and_then(|v| v.as_str()) {
        validation_service.validate_email(email)?;
    }

    // Validate phone if provided
    if let Some(phone) = body.get("phone").and_then(|v| v.as_str()) {
        validation_service.validate_phone(phone)?;
    }

    // Validate role if provided
    if let Some(role) = body.get("role").and_then(|v| v.as_str()) {
        let valid_roles = vec!["admin", "user", "analyst", "viewer"];
        if !valid_roles.contains(&role) {
            return Err(AppError::Validation(
                format!("Invalid role: {}. Valid roles are: {}", role, valid_roles.join(", "))
            ));
        }
    }

    Ok(())
}

/// Extract JSON body from request
async fn extract_json_body(req: &ServiceRequest) -> Result<HashMap<String, serde_json::Value>, AppError> {
    let mut body = req.payload();
    let mut bytes = Vec::new();
    
    while let Some(chunk) = body.try_next().await.map_err(|_| AppError::Validation("Error reading request body".to_string()))? {
        bytes.extend_from_slice(&chunk);
    }
    
    let json_str = String::from_utf8(bytes)
        .map_err(|_| AppError::Validation("Invalid UTF-8 in request body".to_string()))?;
    
    serde_json::from_str(&json_str)
        .map_err(|_| AppError::Validation("Invalid JSON format".to_string()))
}

/// Validation middleware factory
pub fn validation_middleware<S>(service: Rc<S>) -> ValidationMiddleware<S> {
    ValidationMiddleware::new(service)
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::{test, web, App, http};
    use serde_json::json;

    #[actix_web::test]
    async fn test_validation_middleware() {
        let app = test::init_service(
            App::new()
                .wrap_fn(|req, srv| {
                    let fut = srv.call(req);
                    async move {
                        let res = fut.await?;
                        Ok(res)
                    }
                })
                .route("/test", web::post().to(|| async { HttpResponse::Ok().json("success") }))
        ).await;

        // Test valid request
        let req = test::TestRequest::post()
            .uri("/test")
            .set_json(&json!({"test": "data"}))
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), http::StatusCode::OK);
    }
}
