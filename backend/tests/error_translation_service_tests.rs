//! Service layer tests for ErrorTranslationService
//!
//! Tests error translation functionality including error mapping,
//! context building, and user-friendly message generation.

use reconciliation_backend::services::error_translation::ErrorTranslationService;
use reconciliation_backend::services::error_translation::ErrorContextBuilder;
use uuid::Uuid;

/// Test ErrorTranslationService methods
#[cfg(test)]
mod error_translation_service_tests {
    use super::*;

    #[test]
    fn test_error_translation_service_creation() {
        let service = ErrorTranslationService::new();
        
        // Verify service is created
        assert!(true); // Service has no public state to verify
    }

    #[test]
    fn test_translate_unauthorized_error() {
        let service = ErrorTranslationService::new();
        let context = ErrorContextBuilder::new().build();

        let translated = service.translate_error("UNAUTHORIZED", context, None);

        assert!(translated.title.contains("Authentication") || translated.title.contains("Session"));
    }

    #[test]
    fn test_translate_forbidden_error() {
        let service = ErrorTranslationService::new();
        let context = ErrorContextBuilder::new().build();

        let translated = service.translate_error("FORBIDDEN", context, None);

        assert!(translated.title.contains("Access") || translated.title.contains("Denied"));
    }

    #[test]
    fn test_translate_validation_error() {
        let service = ErrorTranslationService::new();
        let context = ErrorContextBuilder::new().build();

        let translated = service.translate_error("VALIDATION_ERROR", context, Some("Invalid input".to_string()));

        assert!(translated.title.contains("Validation") || translated.message.contains("input"));
    }

    #[test]
    fn test_translate_with_context() {
        let service = ErrorTranslationService::new();
        let user_id = Uuid::new_v4();
        let project_id = Uuid::new_v4();
        
        let context = ErrorContextBuilder::new()
            .user_id(user_id)
            .project_id(project_id)
            .action("get_resource")
            .build();

        let translated = service.translate_error("NOT_FOUND", context, None);

        assert_eq!(translated.context.user_id, Some(user_id));
        assert_eq!(translated.context.project_id, Some(project_id));
    }

    #[test]
    fn test_error_context_builder() {
        let user_id = Uuid::new_v4();
        let project_id = Uuid::new_v4();
        
        let context = ErrorContextBuilder::new()
            .user_id(user_id)
            .project_id(project_id)
            .action("test_action")
            .workflow_stage("test_stage")
            .resource_type("test_resource")
            .resource_id("resource123")
            .build();

        assert_eq!(context.user_id, Some(user_id));
        assert_eq!(context.project_id, Some(project_id));
        assert_eq!(context.action, Some("test_action".to_string()));
        assert_eq!(context.workflow_stage, Some("test_stage".to_string()));
    }

    #[test]
    fn test_translate_database_error() {
        let service = ErrorTranslationService::new();
        let context = ErrorContextBuilder::new().build();

        let translated = service.translate_error("DATABASE_ERROR", context, Some("Connection failed".to_string()));

        // Should provide user-friendly message
        assert!(!translated.message.is_empty());
    }
}

