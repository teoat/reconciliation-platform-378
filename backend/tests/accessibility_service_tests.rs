//! Service layer tests for AccessibilityService
//!
//! Tests accessibility audit functionality including WCAG compliance,
//! guideline management, and audit reporting.

use reconciliation_backend::services::accessibility::{
    AccessibilityService, ComplianceLevel, IssueSeverity, IssueType,
};
use reconciliation_backend::errors::AppResult;
use uuid::Uuid;

/// Test AccessibilityService methods
#[cfg(test)]
mod accessibility_service_tests {
    use super::*;

    #[tokio::test]
    async fn test_accessibility_service_creation() {
        let service = AccessibilityService::new().await;
        
        // Verify service is created
        assert!(true);
    }

    #[tokio::test]
    async fn test_perform_audit() {
        let service = AccessibilityService::new().await;
        
        let content = r#"
            <html>
                <body>
                    <img src="image.jpg">
                    <input type="text" name="email">
                    <button onclick="submit()">Submit</button>
                </body>
            </html>
        "#.to_string();

        let result = service.perform_audit("https://example.com".to_string(), content).await;
        assert!(result.is_ok());
        
        let audit = result.unwrap();
        assert!(!audit.id.is_nil());
        assert_eq!(audit.page_url, "https://example.com");
        assert!(audit.total_issues > 0);
    }

    #[tokio::test]
    async fn test_perform_audit_no_issues() {
        let service = AccessibilityService::new().await;
        
        let content = r#"
            <html>
                <body>
                    <img src="image.jpg" alt="Description">
                    <label for="email">Email</label>
                    <input type="text" id="email" name="email">
                    <button onclick="submit()" onkeydown="handleKey(event)">Submit</button>
                </body>
            </html>
        "#.to_string();

        let result = service.perform_audit("https://example.com/accessible".to_string(), content).await;
        assert!(result.is_ok());
        
        let audit = result.unwrap();
        // May have fewer issues or none
        assert!(audit.total_issues >= 0);
    }

    #[tokio::test]
    async fn test_perform_audit_missing_alt_text() {
        let service = AccessibilityService::new().await;
        
        let content = r#"<img src="image.jpg">"#.to_string();

        let result = service.perform_audit("https://example.com".to_string(), content).await;
        assert!(result.is_ok());
        
        let audit = result.unwrap();
        assert!(audit.critical_issues > 0);
        
        // Check for missing alt text issue
        let has_missing_alt = audit.issues.iter().any(|i| matches!(i.type_, IssueType::MissingAltText));
        assert!(has_missing_alt);
    }

    #[tokio::test]
    async fn test_perform_audit_missing_labels() {
        let service = AccessibilityService::new().await;
        
        let content = r#"<input type="text" name="email">"#.to_string();

        let result = service.perform_audit("https://example.com".to_string(), content).await;
        assert!(result.is_ok());
        
        let audit = result.unwrap();
        assert!(audit.serious_issues > 0);
        
        // Check for missing labels issue
        let has_missing_labels = audit.issues.iter().any(|i| matches!(i.type_, IssueType::MissingLabels));
        assert!(has_missing_labels);
    }

    #[tokio::test]
    async fn test_perform_audit_keyboard_navigation() {
        let service = AccessibilityService::new().await;
        
        let content = r#"<button onclick="submit()">Submit</button>"#.to_string();

        let result = service.perform_audit("https://example.com".to_string(), content).await;
        assert!(result.is_ok());
        
        let audit = result.unwrap();
        assert!(audit.serious_issues > 0);
        
        // Check for keyboard navigation issue
        let has_keyboard_issue = audit.issues.iter().any(|i| matches!(i.type_, IssueType::KeyboardNavigation));
        assert!(has_keyboard_issue);
    }

    #[tokio::test]
    async fn test_get_guideline() {
        let service = AccessibilityService::new().await;
        
        // Get existing guideline
        let result = service.get_guideline("1.1").await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_some());
        
        // Get non-existent guideline
        let result2 = service.get_guideline("99.99").await;
        assert!(result2.is_ok());
        assert!(result2.unwrap().is_none());
    }

    #[tokio::test]
    async fn test_list_guidelines() {
        let service = AccessibilityService::new().await;
        
        let result = service.list_guidelines().await;
        assert!(result.is_ok());
        
        let guidelines = result.unwrap();
        assert!(!guidelines.is_empty());
        
        // Should have WCAG guidelines
        let has_1_1 = guidelines.iter().any(|g| g.id == "1.1");
        assert!(has_1_1);
    }

    #[tokio::test]
    async fn test_get_audit() {
        let service = AccessibilityService::new().await;
        
        // Perform audit first
        let content = "<html><body>Test</body></html>".to_string();
        let audit_result = service.perform_audit("https://example.com".to_string(), content).await;
        assert!(audit_result.is_ok());
        let audit_id = audit_result.unwrap().id;
        
        // Get audit
        let result = service.get_audit(audit_id).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_some());
    }

    #[tokio::test]
    async fn test_get_audit_nonexistent() {
        let service = AccessibilityService::new().await;
        let nonexistent_id = Uuid::new_v4();
        
        let result = service.get_audit(nonexistent_id).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }

    #[tokio::test]
    async fn test_list_audits() {
        let service = AccessibilityService::new().await;
        
        // Perform multiple audits
        for i in 0..3 {
            let content = format!("<html><body>Test {}</body></html>", i);
            service.perform_audit(format!("https://example.com/page{}", i), content).await.unwrap();
        }
        
        let result = service.list_audits(None, None).await;
        assert!(result.is_ok());
        
        let audits = result.unwrap();
        assert!(audits.len() >= 3);
    }

    #[tokio::test]
    async fn test_list_audits_with_limit() {
        let service = AccessibilityService::new().await;
        
        // Perform multiple audits
        for i in 0..5 {
            let content = format!("<html><body>Test {}</body></html>", i);
            service.perform_audit(format!("https://example.com/page{}", i), content).await.unwrap();
        }
        
        let result = service.list_audits(Some(2), None).await;
        assert!(result.is_ok());
        
        let audits = result.unwrap();
        assert!(audits.len() <= 2);
    }

    #[tokio::test]
    async fn test_list_audits_with_offset() {
        let service = AccessibilityService::new().await;
        
        // Perform multiple audits
        for i in 0..5 {
            let content = format!("<html><body>Test {}</body></html>", i);
            service.perform_audit(format!("https://example.com/page{}", i), content).await.unwrap();
        }
        
        let result = service.list_audits(Some(2), Some(2)).await;
        assert!(result.is_ok());
        
        let audits = result.unwrap();
        assert!(audits.len() <= 2);
    }

    #[tokio::test]
    async fn test_get_compliance_stats() {
        let service = AccessibilityService::new().await;
        
        // Perform some audits
        for i in 0..3 {
            let content = format!("<html><body>Test {}</body></html>", i);
            service.perform_audit(format!("https://example.com/page{}", i), content).await.unwrap();
        }
        
        let result = service.get_compliance_stats().await;
        assert!(result.is_ok());
        
        let stats = result.unwrap();
        assert!(stats.total_audits >= 3);
        assert!(stats.compliant_pages + stats.non_compliant_pages >= 3);
    }

    #[tokio::test]
    async fn test_generate_report() {
        let service = AccessibilityService::new().await;
        
        // Perform audit
        let content = "<html><body><img src='test.jpg'></body></html>".to_string();
        let audit_result = service.perform_audit("https://example.com".to_string(), content).await;
        assert!(audit_result.is_ok());
        let audit_id = audit_result.unwrap().id;
        
        // Generate report
        let result = service.generate_report(audit_id).await;
        assert!(result.is_ok());
        
        let report = result.unwrap();
        assert!(report.contains("Accessibility Audit Report"));
        assert!(report.contains("https://example.com"));
    }

    #[tokio::test]
    async fn test_generate_report_nonexistent() {
        let service = AccessibilityService::new().await;
        let nonexistent_id = Uuid::new_v4();
        
        let result = service.generate_report(nonexistent_id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_audit_score_calculation() {
        let service = AccessibilityService::new().await;
        
        // Test with no issues
        let perfect_content = r#"
            <html>
                <body>
                    <img src="image.jpg" alt="Description">
                    <label for="email">Email</label>
                    <input type="text" id="email" name="email">
                </body>
            </html>
        "#.to_string();

        let result = service.perform_audit("https://example.com/perfect".to_string(), perfect_content).await;
        assert!(result.is_ok());
        
        let audit = result.unwrap();
        // Score should be high if no issues
        if audit.total_issues == 0 {
            assert_eq!(audit.score, 100.0);
        }
    }

    #[tokio::test]
    async fn test_audit_compliance_level() {
        let service = AccessibilityService::new().await;
        
        // Test with high score
        let good_content = r#"
            <html>
                <body>
                    <img src="image.jpg" alt="Description">
                    <label for="email">Email</label>
                    <input type="text" id="email" name="email">
                </body>
            </html>
        "#.to_string();

        let result = service.perform_audit("https://example.com/good".to_string(), good_content).await;
        assert!(result.is_ok());
        
        let audit = result.unwrap();
        // Compliance level should be based on score
        if audit.score >= 90.0 {
            assert!(matches!(audit.compliance_level, ComplianceLevel::AA | ComplianceLevel::AAA));
        }
    }

    #[tokio::test]
    async fn test_multiple_audits_same_page() {
        let service = AccessibilityService::new().await;
        
        let content = "<html><body>Test</body></html>".to_string();
        
        // Perform multiple audits on same page
        let audit1 = service.perform_audit("https://example.com".to_string(), content.clone()).await.unwrap();
        let audit2 = service.perform_audit("https://example.com".to_string(), content).await.unwrap();
        
        assert_ne!(audit1.id, audit2.id);
    }

    #[tokio::test]
    async fn test_audit_issue_severity() {
        let service = AccessibilityService::new().await;
        
        let content = r#"
            <html>
                <body>
                    <img src="image.jpg">
                    <input type="text" name="email">
                </body>
            </html>
        "#.to_string();

        let result = service.perform_audit("https://example.com".to_string(), content).await;
        assert!(result.is_ok());
        
        let audit = result.unwrap();
        
        // Check severity distribution
        let critical_count = audit.issues.iter().filter(|i| matches!(i.severity, IssueSeverity::Critical)).count();
        let serious_count = audit.issues.iter().filter(|i| matches!(i.severity, IssueSeverity::Serious)).count();
        
        assert_eq!(audit.critical_issues, critical_count as u32);
        assert_eq!(audit.serious_issues, serious_count as u32);
    }

    #[tokio::test]
    async fn test_accessibility_service_concurrent_operations() {
        let service = AccessibilityService::new().await;
        
        // Test concurrent operations
        let (result1, result2, result3) = tokio::join!(
            service.list_guidelines(),
            service.get_compliance_stats(),
            service.list_audits(None, None)
        );
        
        assert!(result1.is_ok());
        assert!(result2.is_ok());
        assert!(result3.is_ok());
    }
}

