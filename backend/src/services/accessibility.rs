// backend/src/services/accessibility.rs
use crate::errors::{AppError, AppResult};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Accessibility compliance level
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ComplianceLevel {
    A,
    AA,
    AAA,
}

/// Accessibility guideline
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessibilityGuideline {
    pub id: String,
    pub title: String,
    pub description: String,
    pub level: ComplianceLevel,
    pub category: AccessibilityCategory,
    pub criteria: Vec<AccessibilityCriteria>,
}

/// Accessibility category
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AccessibilityCategory {
    Perceivable,
    Operable,
    Understandable,
    Robust,
}

/// Accessibility criteria
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessibilityCriteria {
    pub id: String,
    pub title: String,
    pub description: String,
    pub level: ComplianceLevel,
    pub test_methods: Vec<String>,
    pub success_criteria: Vec<String>,
}

/// Accessibility audit result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessibilityAudit {
    pub id: Uuid,
    pub page_url: String,
    pub audit_date: DateTime<Utc>,
    pub compliance_level: ComplianceLevel,
    pub total_issues: u32,
    pub critical_issues: u32,
    pub serious_issues: u32,
    pub moderate_issues: u32,
    pub minor_issues: u32,
    pub issues: Vec<AccessibilityIssue>,
    pub score: f64,
}

/// Accessibility issue
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessibilityIssue {
    pub id: String,
    pub type_: IssueType,
    pub severity: IssueSeverity,
    pub title: String,
    pub description: String,
    pub element: Option<String>,
    pub guideline_id: String,
    pub fix_suggestion: String,
    pub automated: bool,
}

/// Issue types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum IssueType {
    ColorContrast,
    MissingAltText,
    MissingLabels,
    KeyboardNavigation,
    ScreenReader,
    FocusManagement,
    SemanticMarkup,
    FormValidation,
    ErrorHandling,
    LanguageDeclaration,
}

/// Issue severity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IssueSeverity {
    Critical,
    Serious,
    Moderate,
    Minor,
}

/// Accessibility service
pub struct AccessibilityService {
    guidelines: Arc<RwLock<HashMap<String, AccessibilityGuideline>>>,
    audits: Arc<RwLock<HashMap<Uuid, AccessibilityAudit>>>,
    compliance_stats: Arc<RwLock<ComplianceStats>>,
}

/// Compliance statistics
#[derive(Debug, Clone, Default)]
pub struct ComplianceStats {
    pub total_audits: u32,
    pub compliant_pages: u32,
    pub non_compliant_pages: u32,
    pub average_score: f64,
    pub most_common_issues: HashMap<IssueType, u32>,
}

impl AccessibilityService {
    pub async fn new() -> Self {
        let mut service = Self {
            guidelines: Arc::new(RwLock::new(HashMap::new())),
            audits: Arc::new(RwLock::new(HashMap::new())),
            compliance_stats: Arc::new(RwLock::new(ComplianceStats::default())),
        };

        service.initialize_wcag_guidelines().await;
        service
    }

    /// Initialize WCAG 2.1 guidelines
    async fn initialize_wcag_guidelines(&mut self) {
        let guidelines = vec![
            AccessibilityGuideline {
                id: "1.1".to_string(),
                title: "Non-text Content".to_string(),
                description: "All non-text content has a text alternative".to_string(),
                level: ComplianceLevel::A,
                category: AccessibilityCategory::Perceivable,
                criteria: vec![AccessibilityCriteria {
                    id: "1.1.1".to_string(),
                    title: "Non-text Content".to_string(),
                    description:
                        "All non-text content that is presented to the user has a text alternative"
                            .to_string(),
                    level: ComplianceLevel::A,
                    test_methods: vec![
                        "Automated testing".to_string(),
                        "Manual inspection".to_string(),
                    ],
                    success_criteria: vec![
                        "Images have alt text".to_string(),
                        "Charts have descriptions".to_string(),
                    ],
                }],
            },
            AccessibilityGuideline {
                id: "1.4".to_string(),
                title: "Distinguishable".to_string(),
                description: "Make it easier for users to see and hear content".to_string(),
                level: ComplianceLevel::AA,
                category: AccessibilityCategory::Perceivable,
                criteria: vec![AccessibilityCriteria {
                    id: "1.4.3".to_string(),
                    title: "Contrast (Minimum)".to_string(),
                    description: "Text has a contrast ratio of at least 4.5:1".to_string(),
                    level: ComplianceLevel::AA,
                    test_methods: vec!["Color contrast analyzer".to_string()],
                    success_criteria: vec![
                        "Normal text: 4.5:1 ratio".to_string(),
                        "Large text: 3:1 ratio".to_string(),
                    ],
                }],
            },
            AccessibilityGuideline {
                id: "2.1".to_string(),
                title: "Keyboard Accessible".to_string(),
                description: "Make all functionality available from a keyboard".to_string(),
                level: ComplianceLevel::A,
                category: AccessibilityCategory::Operable,
                criteria: vec![AccessibilityCriteria {
                    id: "2.1.1".to_string(),
                    title: "Keyboard".to_string(),
                    description: "All functionality is available from a keyboard".to_string(),
                    level: ComplianceLevel::A,
                    test_methods: vec!["Keyboard navigation testing".to_string()],
                    success_criteria: vec![
                        "All interactive elements accessible via keyboard".to_string()
                    ],
                }],
            },
        ];

        for guideline in guidelines {
            self.guidelines
                .write()
                .await
                .insert(guideline.id.clone(), guideline);
        }
    }

    /// Perform accessibility audit
    pub async fn perform_audit(
        &self,
        page_url: String,
        content: String,
    ) -> AppResult<AccessibilityAudit> {
        let audit_id = Uuid::new_v4();
        let mut issues = Vec::new();

        // Check for missing alt text
        if content.contains("<img") && !content.contains("alt=") {
            issues.push(AccessibilityIssue {
                id: "missing-alt-text".to_string(),
                type_: IssueType::MissingAltText,
                severity: IssueSeverity::Critical,
                title: "Missing Alt Text".to_string(),
                description: "Images are missing alt text attributes".to_string(),
                element: Some("img".to_string()),
                guideline_id: "1.1.1".to_string(),
                fix_suggestion: "Add alt text to all images".to_string(),
                automated: true,
            });
        }

        // Check for missing form labels
        if content.contains("<input") && !content.contains("<label") {
            issues.push(AccessibilityIssue {
                id: "missing-labels".to_string(),
                type_: IssueType::MissingLabels,
                severity: IssueSeverity::Serious,
                title: "Missing Form Labels".to_string(),
                description: "Form inputs are missing labels".to_string(),
                element: Some("input".to_string()),
                guideline_id: "1.3.1".to_string(),
                fix_suggestion: "Add labels to all form inputs".to_string(),
                automated: true,
            });
        }

        // Check for keyboard navigation
        if content.contains("onclick") && !content.contains("onkeydown") {
            issues.push(AccessibilityIssue {
                id: "keyboard-navigation".to_string(),
                type_: IssueType::KeyboardNavigation,
                severity: IssueSeverity::Serious,
                title: "Missing Keyboard Support".to_string(),
                description: "Interactive elements lack keyboard support".to_string(),
                element: Some("button".to_string()),
                guideline_id: "2.1.1".to_string(),
                fix_suggestion: "Add keyboard event handlers".to_string(),
                automated: true,
            });
        }

        // Calculate score
        let total_issues = issues.len() as u32;
        let critical_issues = issues
            .iter()
            .filter(|i| matches!(i.severity, IssueSeverity::Critical))
            .count() as u32;
        let serious_issues = issues
            .iter()
            .filter(|i| matches!(i.severity, IssueSeverity::Serious))
            .count() as u32;
        let moderate_issues = issues
            .iter()
            .filter(|i| matches!(i.severity, IssueSeverity::Moderate))
            .count() as u32;
        let minor_issues = issues
            .iter()
            .filter(|i| matches!(i.severity, IssueSeverity::Minor))
            .count() as u32;

        let score = if total_issues == 0 {
            100.0
        } else {
            let penalty = critical_issues as f64 * 20.0
                + serious_issues as f64 * 10.0
                + moderate_issues as f64 * 5.0
                + minor_issues as f64 * 2.0;
            (100.0 - penalty).max(0.0)
        };

        let audit = AccessibilityAudit {
            id: audit_id,
            page_url,
            audit_date: Utc::now(),
            compliance_level: if score >= 90.0 {
                ComplianceLevel::AA
            } else {
                ComplianceLevel::A
            },
            total_issues,
            critical_issues,
            serious_issues,
            moderate_issues,
            minor_issues,
            issues,
            score,
        };

        self.audits.write().await.insert(audit_id, audit.clone());
        self.update_compliance_stats(&audit).await;

        Ok(audit)
    }

    /// Update compliance statistics
    async fn update_compliance_stats(&self, audit: &AccessibilityAudit) {
        let mut stats = self.compliance_stats.write().await;
        stats.total_audits += 1;

        if audit.score >= 90.0 {
            stats.compliant_pages += 1;
        } else {
            stats.non_compliant_pages += 1;
        }

        // Update average score
        let total_score = stats.average_score * (stats.total_audits - 1) as f64 + audit.score;
        stats.average_score = total_score / stats.total_audits as f64;

        // Update most common issues
        for issue in &audit.issues {
            *stats
                .most_common_issues
                .entry(issue.type_.clone())
                .or_insert(0) += 1;
        }
    }

    /// Get accessibility guideline
    pub async fn get_guideline(&self, id: &str) -> AppResult<Option<AccessibilityGuideline>> {
        let guidelines = self.guidelines.read().await;
        Ok(guidelines.get(id).cloned())
    }

    /// List accessibility guidelines
    pub async fn list_guidelines(&self) -> AppResult<Vec<AccessibilityGuideline>> {
        let guidelines = self.guidelines.read().await;
        Ok(guidelines.values().cloned().collect())
    }

    /// Get audit result
    pub async fn get_audit(&self, audit_id: Uuid) -> AppResult<Option<AccessibilityAudit>> {
        let audits = self.audits.read().await;
        Ok(audits.get(&audit_id).cloned())
    }

    /// List audits
    pub async fn list_audits(
        &self,
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> AppResult<Vec<AccessibilityAudit>> {
        let audits = self.audits.read().await;
        let audits_vec: Vec<_> = audits.values().cloned().collect();

        let offset = offset.unwrap_or(0);
        let limit = limit.unwrap_or(100);

        Ok(audits_vec.into_iter().skip(offset).take(limit).collect())
    }

    /// Get compliance statistics
    pub async fn get_compliance_stats(&self) -> AppResult<ComplianceStats> {
        let stats = self.compliance_stats.read().await.clone();
        Ok(stats)
    }

    /// Generate accessibility report
    pub async fn generate_report(&self, audit_id: Uuid) -> AppResult<String> {
        let audits = self.audits.read().await;
        if let Some(audit) = audits.get(&audit_id) {
            let mut report = "# Accessibility Audit Report\n\n".to_string();
            report.push_str(&format!("**Page:** {}\n", audit.page_url));
            report.push_str(&format!("**Date:** {}\n", audit.audit_date));
            report.push_str(&format!("**Score:** {:.1}/100\n", audit.score));
            report.push_str(&format!(
                "**Compliance Level:** {:?}\n\n",
                audit.compliance_level
            ));

            report.push_str("## Issues Summary\n\n");
            report.push_str(&format!("- **Total Issues:** {}\n", audit.total_issues));
            report.push_str(&format!("- **Critical:** {}\n", audit.critical_issues));
            report.push_str(&format!("- **Serious:** {}\n", audit.serious_issues));
            report.push_str(&format!("- **Moderate:** {}\n", audit.moderate_issues));
            report.push_str(&format!("- **Minor:** {}\n\n", audit.minor_issues));

            if !audit.issues.is_empty() {
                report.push_str("## Detailed Issues\n\n");
                for issue in &audit.issues {
                    report.push_str(&format!("### {}\n", issue.title));
                    report.push_str(&format!("**Severity:** {:?}\n", issue.severity));
                    report.push_str(&format!("**Description:** {}\n", issue.description));
                    report.push_str(&format!("**Fix:** {}\n\n", issue.fix_suggestion));
                }
            }

            Ok(report)
        } else {
            Err(AppError::Validation("Audit not found".to_string()))
        }
    }
}

impl Default for AccessibilityService {
    fn default() -> Self {
        // Create a synchronous version for Default
        Self {
            guidelines: Arc::new(RwLock::new(HashMap::new())),
            audits: Arc::new(RwLock::new(HashMap::new())),
            compliance_stats: Arc::new(RwLock::new(ComplianceStats::default())),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_accessibility_service() {
        let service = AccessibilityService::new().await;

        // Test performing audit
        let content = r#"
            <html>
                <body>
                    <img src="image.jpg">
                    <input type="text" name="email">
                    <button onclick="submit()">Submit</button>
                </body>
            </html>
        "#
        .to_string();

        let audit = service
            .perform_audit("https://example.com".to_string(), content)
            .await
            .expect("Failed to perform audit");

        assert!(audit.total_issues > 0);
        assert!(audit.score < 100.0);

        // Test getting audit
        let retrieved_audit = service
            .get_audit(audit.id)
            .await
            .expect("Failed to get audit");
        assert!(retrieved_audit.is_some());

        // Test listing audits
        let audits = service
            .list_audits(Some(10), None)
            .await
            .expect("Failed to list audits");
        assert!(!audits.is_empty());

        // Test getting guidelines
        let guidelines = service
            .list_guidelines()
            .await
            .expect("Failed to list guidelines");
        assert!(!guidelines.is_empty());

        // Test getting compliance stats
        let stats = service
            .get_compliance_stats()
            .await
            .expect("Failed to get compliance stats");
        assert!(stats.total_audits > 0);

        // Test generating report
        let report = service
            .generate_report(audit.id)
            .await
            .expect("Failed to generate report");
        assert!(report.contains("Accessibility Audit Report"));
    }
}
