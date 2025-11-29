//! Comprehensive tests for backend models
//!
//! Tests model validation, serialization, deserialization,
//! and business logic methods.

#[cfg(test)]
mod models_tests {
    use reconciliation_backend::models::*;
    use chrono::Utc;
    use uuid::Uuid;

    // =========================================================================
    // MatchType Enum Tests
    // =========================================================================

    #[test]
    fn test_match_type_from_str() {
        assert_eq!(MatchType::from_str("exact").unwrap(), MatchType::Exact);
        assert_eq!(MatchType::from_str("fuzzy").unwrap(), MatchType::Fuzzy);
        assert_eq!(MatchType::from_str("manual").unwrap(), MatchType::Manual);
        assert_eq!(MatchType::from_str("auto").unwrap(), MatchType::Auto);
    }

    #[test]
    fn test_match_type_from_str_case_insensitive() {
        assert_eq!(MatchType::from_str("EXACT").unwrap(), MatchType::Exact);
        assert_eq!(MatchType::from_str("Fuzzy").unwrap(), MatchType::Fuzzy);
        assert_eq!(MatchType::from_str("MANUAL").unwrap(), MatchType::Manual);
        assert_eq!(MatchType::from_str("Auto").unwrap(), MatchType::Auto);
    }

    #[test]
    fn test_match_type_from_str_invalid() {
        assert!(MatchType::from_str("invalid").is_err());
        assert!(MatchType::from_str("").is_err());
    }

    #[test]
    fn test_match_type_display() {
        assert_eq!(format!("{}", MatchType::Exact), "exact");
        assert_eq!(format!("{}", MatchType::Fuzzy), "fuzzy");
        assert_eq!(format!("{}", MatchType::Manual), "manual");
        assert_eq!(format!("{}", MatchType::Auto), "auto");
    }

    #[test]
    fn test_match_type_serialization() {
        let exact = MatchType::Exact;
        let json = serde_json::to_string(&exact).unwrap();
        assert!(json.contains("exact"));
    }

    #[test]
    fn test_match_type_deserialization() {
        let json = "\"exact\"";
        let match_type: MatchType = serde_json::from_str(json).unwrap();
        assert_eq!(match_type, MatchType::Exact);
    }

    // =========================================================================
    // ProjectStatus Enum Tests
    // =========================================================================

    #[test]
    fn test_project_status_from_str() {
        assert_eq!(ProjectStatus::from_str("active").unwrap(), ProjectStatus::Active);
        assert_eq!(ProjectStatus::from_str("inactive").unwrap(), ProjectStatus::Inactive);
        assert_eq!(ProjectStatus::from_str("archived").unwrap(), ProjectStatus::Archived);
        assert_eq!(ProjectStatus::from_str("draft").unwrap(), ProjectStatus::Draft);
        assert_eq!(ProjectStatus::from_str("completed").unwrap(), ProjectStatus::Completed);
    }

    #[test]
    fn test_project_status_from_str_case_insensitive() {
        assert_eq!(ProjectStatus::from_str("ACTIVE").unwrap(), ProjectStatus::Active);
        assert_eq!(ProjectStatus::from_str("Inactive").unwrap(), ProjectStatus::Inactive);
        assert_eq!(ProjectStatus::from_str("ARCHIVED").unwrap(), ProjectStatus::Archived);
    }

    #[test]
    fn test_project_status_from_str_invalid() {
        assert!(ProjectStatus::from_str("invalid").is_err());
        assert!(ProjectStatus::from_str("").is_err());
    }

    #[test]
    fn test_project_status_display() {
        assert_eq!(format!("{}", ProjectStatus::Active), "active");
        assert_eq!(format!("{}", ProjectStatus::Inactive), "inactive");
        assert_eq!(format!("{}", ProjectStatus::Archived), "archived");
        assert_eq!(format!("{}", ProjectStatus::Draft), "draft");
        assert_eq!(format!("{}", ProjectStatus::Completed), "completed");
    }

    #[test]
    fn test_project_status_serialization() {
        let status = ProjectStatus::Active;
        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("active"));
    }

    #[test]
    fn test_project_status_deserialization() {
        let json = "\"active\"";
        let status: ProjectStatus = serde_json::from_str(json).unwrap();
        assert_eq!(status, ProjectStatus::Active);
    }

    // =========================================================================
    // Project Model Tests
    // =========================================================================

    #[test]
    fn test_project_is_active() {
        let project = Project {
            id: Uuid::new_v4(),
            name: "Test Project".to_string(),
            description: None,
            owner_id: Uuid::new_v4(),
            status: "active".to_string(),
            settings: serde_json::json!({}),
            metadata: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        assert!(project.is_active());
    }

    #[test]
    fn test_project_is_active_draft() {
        let project = Project {
            id: Uuid::new_v4(),
            name: "Test Project".to_string(),
            description: None,
            owner_id: Uuid::new_v4(),
            status: "draft".to_string(),
            settings: serde_json::json!({}),
            metadata: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        assert!(project.is_active());
    }

    #[test]
    fn test_project_is_not_active() {
        let project = Project {
            id: Uuid::new_v4(),
            name: "Test Project".to_string(),
            description: None,
            owner_id: Uuid::new_v4(),
            status: "inactive".to_string(),
            settings: serde_json::json!({}),
            metadata: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        assert!(!project.is_active());
    }

    #[test]
    fn test_project_serialization() {
        let project = Project {
            id: Uuid::new_v4(),
            name: "Test Project".to_string(),
            description: Some("Description".to_string()),
            owner_id: Uuid::new_v4(),
            status: "active".to_string(),
            settings: serde_json::json!({"key": "value"}),
            metadata: Some(serde_json::json!({"meta": "data"})),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        let json = serde_json::to_string(&project).unwrap();
        assert!(json.contains("Test Project"));
        assert!(json.contains("active"));
    }

    #[test]
    fn test_project_deserialization() {
        let json = r#"{
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Test Project",
            "description": "Description",
            "owner_id": "550e8400-e29b-41d4-a716-446655440001",
            "status": "active",
            "settings": {},
            "metadata": null,
            "created_at": "2021-01-01T00:00:00Z",
            "updated_at": "2021-01-01T00:00:00Z"
        }"#;
        
        let project: Project = serde_json::from_str(json).unwrap();
        assert_eq!(project.name, "Test Project");
        assert_eq!(project.status, "active");
    }

    #[test]
    fn test_new_project_creation() {
        let new_project = NewProject {
            name: "New Project".to_string(),
            description: Some("Description".to_string()),
            owner_id: Uuid::new_v4(),
            status: "draft".to_string(),
            settings: serde_json::json!({}),
            metadata: None,
        };
        
        assert_eq!(new_project.name, "New Project");
        assert_eq!(new_project.status, "draft");
    }

    // =========================================================================
    // User Model Tests
    // =========================================================================

    #[test]
    fn test_user_serialization() {
        let user = User {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            username: Some("testuser".to_string()),
            first_name: Some("Test".to_string()),
            last_name: Some("User".to_string()),
            password_hash: "hash".to_string(),
            status: "active".to_string(),
            email_verified: true,
            email_verified_at: Some(Utc::now()),
            last_login_at: None,
            last_active_at: None,
            password_expires_at: None,
            password_last_changed: None,
            password_history: None,
            is_initial_password: false,
            initial_password_set_at: None,
            auth_provider: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        let json = serde_json::to_string(&user).unwrap();
        assert!(json.contains("test@example.com"));
        assert!(json.contains("testuser"));
    }

    #[test]
    fn test_new_user_creation() {
        let new_user = NewUser {
            email: "new@example.com".to_string(),
            username: Some("newuser".to_string()),
            first_name: Some("New".to_string()),
            last_name: Some("User".to_string()),
            password_hash: "hash".to_string(),
            status: "active".to_string(),
            email_verified: false,
            password_expires_at: None,
            password_last_changed: None,
            password_history: None,
            is_initial_password: Some(false),
            initial_password_set_at: None,
            auth_provider: None,
        };
        
        assert_eq!(new_user.email, "new@example.com");
        assert!(!new_user.email_verified);
    }

    #[test]
    fn test_update_user_creation() {
        let update_user = UpdateUser {
            email: Some("updated@example.com".to_string()),
            username: Some("updateduser".to_string()),
            first_name: None,
            last_name: None,
            status: Some("inactive".to_string()),
            email_verified: Some(true),
            last_login_at: Some(Utc::now()),
            last_active_at: None,
            password_expires_at: None,
            password_last_changed: None,
            password_history: None,
            is_initial_password: None,
            initial_password_set_at: None,
        };
        
        assert_eq!(update_user.email, Some("updated@example.com".to_string()));
        assert_eq!(update_user.status, Some("inactive".to_string()));
    }

    // =========================================================================
    // UserPreference Model Tests
    // =========================================================================

    #[test]
    fn test_user_preference_serialization() {
        let preference = UserPreference {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            preference_key: "theme".to_string(),
            preference_value: serde_json::json!({"theme": "dark"}),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        let json = serde_json::to_string(&preference).unwrap();
        assert!(json.contains("theme"));
    }

    #[test]
    fn test_new_user_preference_creation() {
        let new_preference = NewUserPreference {
            user_id: Uuid::new_v4(),
            preference_key: "language".to_string(),
            preference_value: serde_json::json!({"language": "en"}),
        };
        
        assert_eq!(new_preference.preference_key, "language");
    }

    // =========================================================================
    // ProjectMember Model Tests
    // =========================================================================

    #[test]
    fn test_project_member_serialization() {
        let member = ProjectMember {
            id: Uuid::new_v4(),
            project_id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            role: "member".to_string(),
            permissions: serde_json::json!({"read": true}),
            joined_at: Utc::now(),
            invited_by: Uuid::new_v4(),
            is_active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        let json = serde_json::to_string(&member).unwrap();
        assert!(json.contains("member"));
        assert!(json.contains("read"));
    }

    #[test]
    fn test_new_project_member_creation() {
        let new_member = NewProjectMember {
            project_id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            role: "admin".to_string(),
            permissions: serde_json::json!({"read": true, "write": true}),
            invited_by: Uuid::new_v4(),
            is_active: true,
        };
        
        assert_eq!(new_member.role, "admin");
        assert!(new_member.is_active);
    }

    // =========================================================================
    // ReconciliationRecord Model Tests
    // =========================================================================

    #[test]
    fn test_reconciliation_record_serialization() {
        let record = ReconciliationRecord {
            id: Uuid::new_v4(),
            project_id: Uuid::new_v4(),
            ingestion_job_id: Uuid::new_v4(),
            external_id: Some("ext123".to_string()),
            status: "matched".to_string(),
            amount: Some(100.50),
            transaction_date: Some(chrono::NaiveDate::from_ymd_opt(2021, 1, 1).unwrap()),
            description: Some("Transaction".to_string()),
            source_data: serde_json::json!({"key": "value"}),
            matching_results: serde_json::json!({"match": true}),
            confidence: Some(0.95),
            audit_trail: serde_json::json!({"action": "created"}),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        let json = serde_json::to_string(&record).unwrap();
        assert!(json.contains("matched"));
        assert!(json.contains("ext123"));
    }

    #[test]
    fn test_new_reconciliation_record_creation() {
        let new_record = NewReconciliationRecord {
            project_id: Uuid::new_v4(),
            ingestion_job_id: Uuid::new_v4(),
            external_id: Some("ext456".to_string()),
            status: "pending".to_string(),
            amount: Some(200.75),
            transaction_date: Some(chrono::NaiveDate::from_ymd_opt(2021, 2, 1).unwrap()),
            description: None,
            source_data: serde_json::json!({}),
            matching_results: serde_json::json!({}),
            confidence: None,
            audit_trail: serde_json::json!({}),
        };
        
        assert_eq!(new_record.status, "pending");
        assert_eq!(new_record.amount, Some(200.75));
    }

    // =========================================================================
    // Model Validation Tests
    // =========================================================================

    #[test]
    fn test_match_type_equality() {
        assert_eq!(MatchType::Exact, MatchType::Exact);
        assert_ne!(MatchType::Exact, MatchType::Fuzzy);
    }

    #[test]
    fn test_project_status_equality() {
        assert_eq!(ProjectStatus::Active, ProjectStatus::Active);
        assert_ne!(ProjectStatus::Active, ProjectStatus::Inactive);
    }

    #[test]
    fn test_project_clone() {
        let project = Project {
            id: Uuid::new_v4(),
            name: "Test".to_string(),
            description: None,
            owner_id: Uuid::new_v4(),
            status: "active".to_string(),
            settings: serde_json::json!({}),
            metadata: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        let cloned = project.clone();
        assert_eq!(project.id, cloned.id);
        assert_eq!(project.name, cloned.name);
    }

    #[test]
    fn test_match_type_clone() {
        let match_type = MatchType::Exact;
        let cloned = match_type.clone();
        assert_eq!(match_type, cloned);
    }

    #[test]
    fn test_project_status_clone() {
        let status = ProjectStatus::Active;
        let cloned = status.clone();
        assert_eq!(status, cloned);
    }

    // =========================================================================
    // Edge Cases
    // =========================================================================

    #[test]
    fn test_match_type_all_variants() {
        let variants = vec![
            MatchType::Exact,
            MatchType::Fuzzy,
            MatchType::Manual,
            MatchType::Auto,
        ];
        
        for variant in variants {
            let display = format!("{}", variant);
            let parsed = MatchType::from_str(&display).unwrap();
            assert_eq!(variant, parsed);
        }
    }

    #[test]
    fn test_project_status_all_variants() {
        let variants = vec![
            ProjectStatus::Active,
            ProjectStatus::Inactive,
            ProjectStatus::Archived,
            ProjectStatus::Draft,
            ProjectStatus::Completed,
        ];
        
        for variant in variants {
            let display = format!("{}", variant);
            let parsed = ProjectStatus::from_str(&display).unwrap();
            assert_eq!(variant, parsed);
        }
    }

    #[test]
    fn test_project_with_all_fields() {
        let project = Project {
            id: Uuid::new_v4(),
            name: "Full Project".to_string(),
            description: Some("Full description".to_string()),
            owner_id: Uuid::new_v4(),
            status: "active".to_string(),
            settings: serde_json::json!({"setting1": "value1", "setting2": 42}),
            metadata: Some(serde_json::json!({"meta1": "data1"})),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        assert!(!project.name.is_empty());
        assert!(project.description.is_some());
        assert!(project.metadata.is_some());
    }

    #[test]
    fn test_project_with_minimal_fields() {
        let project = Project {
            id: Uuid::new_v4(),
            name: "Minimal Project".to_string(),
            description: None,
            owner_id: Uuid::new_v4(),
            status: "draft".to_string(),
            settings: serde_json::json!({}),
            metadata: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        assert!(!project.name.is_empty());
        assert!(project.description.is_none());
        assert!(project.metadata.is_none());
    }
}

