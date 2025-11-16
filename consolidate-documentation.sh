#!/bin/bash
# Consolidate Duplicate and Unused Documentation Files
# Moves files to archive directories based on diagnostic report

set -e

ARCHIVE_BASE="archive/docs"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Documentation Consolidation Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to move file to archive
move_to_archive() {
    local source="$1"
    local dest="$2"
    local category="$3"
    
    if [ -f "$source" ]; then
        mkdir -p "$(dirname "$dest")"
        mv "$source" "$dest"
        echo -e "${GREEN}✓${NC} Moved: $category"
        echo -e "   ${YELLOW}$source${NC} → ${YELLOW}$dest${NC}"
    else
        echo -e "${YELLOW}⚠${NC} Not found: $source"
    fi
}

echo -e "${BLUE}Phase 1: Archiving Completion/Status Reports${NC}"
echo "=========================================="

# TODO/Completion Reports
move_to_archive "ALL_TODOS_COMPLETE.md" "$ARCHIVE_BASE/completion-reports/ALL_TODOS_COMPLETE.md" "TODO Report"
move_to_archive "ALL_TODOS_COMPLETE_FINAL.md" "$ARCHIVE_BASE/completion-reports/ALL_TODOS_COMPLETE_FINAL.md" "TODO Report Final"
move_to_archive "ALL_TODOS_COMPLETED.md" "$ARCHIVE_BASE/completion-reports/ALL_TODOS_COMPLETED.md" "TODO Completed"
move_to_archive "ALL_TODOS_COMPLETION_REPORT.md" "$ARCHIVE_BASE/completion-reports/ALL_TODOS_COMPLETION_REPORT.md" "TODO Completion Report"
move_to_archive "TODOS_COMPLETED.md" "$ARCHIVE_BASE/completion-reports/TODOS_COMPLETED.md" "TODOS Completed"
move_to_archive "TODOS_COMPLETION_SUMMARY.md" "$ARCHIVE_BASE/completion-reports/TODOS_COMPLETION_SUMMARY.md" "TODOS Summary"
move_to_archive "TODOS_AND_RECOMMENDATIONS_COMPLETE.md" "$ARCHIVE_BASE/completion-reports/TODOS_AND_RECOMMENDATIONS_COMPLETE.md" "TODOS Recommendations"
move_to_archive "CODE_QUALITY_AND_TESTING_TODOS.md" "$ARCHIVE_BASE/completion-reports/CODE_QUALITY_AND_TESTING_TODOS.md" "Code Quality TODOS"

# General Completion Summaries
move_to_archive "COMPLETION_STATUS.md" "$ARCHIVE_BASE/completion-reports/COMPLETION_STATUS.md" "Completion Status"
move_to_archive "COMPLETION_SUMMARY.md" "$ARCHIVE_BASE/completion-reports/COMPLETION_SUMMARY.md" "Completion Summary"
move_to_archive "COMPLETION_SUMMARY_TECHNICAL.md" "$ARCHIVE_BASE/completion-reports/COMPLETION_SUMMARY_TECHNICAL.md" "Technical Summary"
move_to_archive "FINAL_COMPLETION_REPORT.md" "$ARCHIVE_BASE/completion-reports/FINAL_COMPLETION_REPORT.md" "Final Completion"
move_to_archive "FINAL_STATUS_REPORT.md" "$ARCHIVE_BASE/completion-reports/FINAL_STATUS_REPORT.md" "Final Status Report"
move_to_archive "FINAL_STATUS.md" "$ARCHIVE_BASE/completion-reports/FINAL_STATUS.md" "Final Status"
move_to_archive "FINAL_100_STATUS.md" "$ARCHIVE_BASE/completion-reports/FINAL_100_STATUS.md" "Final 100 Status"
move_to_archive "CURRENT_STATUS.md" "$ARCHIVE_BASE/completion-reports/CURRENT_STATUS.md" "Current Status"
move_to_archive "CRITICAL_STATUS_UPDATE.md" "$ARCHIVE_BASE/completion-reports/CRITICAL_STATUS_UPDATE.md" "Critical Status"
move_to_archive "PHASE_COMPLETION_STATUS.md" "$ARCHIVE_BASE/completion-reports/PHASE_COMPLETION_STATUS.md" "Phase Completion"
move_to_archive "PHASE_COMPLETION_SUMMARY.md" "$ARCHIVE_BASE/completion-reports/PHASE_COMPLETION_SUMMARY.md" "Phase Summary"
move_to_archive "ALL_TASKS_COMPLETION_REPORT.md" "$ARCHIVE_BASE/completion-reports/ALL_TASKS_COMPLETION_REPORT.md" "All Tasks Report"
move_to_archive "REMAINING_WORK_COMPLETE.md" "$ARCHIVE_BASE/completion-reports/REMAINING_WORK_COMPLETE.md" "Remaining Work"

# Refactoring Reports
move_to_archive "REFACTORING_COMPLETE_SUMMARY.md" "$ARCHIVE_BASE/completion-reports/REFACTORING_COMPLETE_SUMMARY.md" "Refactoring Summary"
move_to_archive "REFACTORING_COMPLETION_SUMMARY.md" "$ARCHIVE_BASE/completion-reports/REFACTORING_COMPLETION_SUMMARY.md" "Refactoring Completion"
move_to_archive "REFACTORING_FINAL_STATUS.md" "$ARCHIVE_BASE/completion-reports/REFACTORING_FINAL_STATUS.md" "Refactoring Final"
move_to_archive "REFACTORING_PHASE1_COMPLETE.md" "$ARCHIVE_BASE/completion-reports/REFACTORING_PHASE1_COMPLETE.md" "Refactoring Phase 1"
move_to_archive "REFACTORING_PROGRESS_SUMMARY.md" "$ARCHIVE_BASE/completion-reports/REFACTORING_PROGRESS_SUMMARY.md" "Refactoring Progress"
move_to_archive "ALL_REFACTORING_PHASES_COMPLETE.md" "$ARCHIVE_BASE/completion-reports/ALL_REFACTORING_PHASES_COMPLETE.md" "All Refactoring Phases"
move_to_archive "NEXT_STEPS_COMPLETE_REFACTORING.md" "$ARCHIVE_BASE/completion-reports/NEXT_STEPS_COMPLETE_REFACTORING.md" "Next Steps Refactoring"
move_to_archive "COMPONENT_REFACTORING_SUMMARY.md" "$ARCHIVE_BASE/completion-reports/COMPONENT_REFACTORING_SUMMARY.md" "Component Refactoring"
move_to_archive "QUICK_REFACTOR_SUMMARY.md" "$ARCHIVE_BASE/completion-reports/QUICK_REFACTOR_SUMMARY.md" "Quick Refactor"

# Backend Fixes/Status
move_to_archive "BACKEND_FIXES_COMPLETE.md" "$ARCHIVE_BASE/completion-reports/BACKEND_FIXES_COMPLETE.md" "Backend Fixes"
move_to_archive "BACKEND_STABILIZATION_SUMMARY.md" "$ARCHIVE_BASE/completion-reports/BACKEND_STABILIZATION_SUMMARY.md" "Backend Stabilization"
move_to_archive "BACKEND_RUNNING_SUMMARY.md" "$ARCHIVE_BASE/completion-reports/BACKEND_RUNNING_SUMMARY.md" "Backend Running"
move_to_archive "BACKEND_ERRORS_FIXES_COMPLETE.md" "$ARCHIVE_BASE/completion-reports/BACKEND_ERRORS_FIXES_COMPLETE.md" "Backend Errors"
move_to_archive "CRITICAL_FIXES_COMPLETE.md" "$ARCHIVE_BASE/completion-reports/CRITICAL_FIXES_COMPLETE.md" "Critical Fixes"
move_to_archive "CRITICAL_FIXES_SOLUTION.md" "$ARCHIVE_BASE/completion-reports/CRITICAL_FIXES_SOLUTION.md" "Critical Fixes Solution"
move_to_archive "FIXES_IMPLEMENTATION_SUMMARY.md" "$ARCHIVE_BASE/completion-reports/FIXES_IMPLEMENTATION_SUMMARY.md" "Fixes Implementation"

# Session/Progress Reports
move_to_archive "SESSION_SUMMARY.md" "$ARCHIVE_BASE/completion-reports/SESSION_SUMMARY.md" "Session Summary"
move_to_archive "SESSION_SUMMARY_NOV16.md" "$ARCHIVE_BASE/completion-reports/SESSION_SUMMARY_NOV16.md" "Session Nov 16"
move_to_archive "DAY1_SUMMARY.md" "$ARCHIVE_BASE/completion-reports/DAY1_SUMMARY.md" "Day 1 Summary"
move_to_archive "RAPID_PROGRESS_LOG.md" "$ARCHIVE_BASE/completion-reports/RAPID_PROGRESS_LOG.md" "Rapid Progress"
move_to_archive "PROGRESS_TRACKER.md" "$ARCHIVE_BASE/completion-reports/PROGRESS_TRACKER.md" "Progress Tracker"
move_to_archive "AGENT_HANDOFF_SUMMARY.md" "$ARCHIVE_BASE/completion-reports/AGENT_HANDOFF_SUMMARY.md" "Agent Handoff"

echo ""
echo -e "${BLUE}Phase 2: Archiving Deployment Status Reports${NC}"
echo "=========================================="

move_to_archive "DEPLOYMENT_COMPLETE.md" "$ARCHIVE_BASE/deployment-status/DEPLOYMENT_COMPLETE.md" "Deployment Complete"
move_to_archive "DEPLOYMENT_GUIDE_COMPLETE.md" "$ARCHIVE_BASE/deployment-status/DEPLOYMENT_GUIDE_COMPLETE.md" "Deployment Guide Complete"
move_to_archive "DEPLOYMENT_OPTIMIZATION_COMPLETE.md" "$ARCHIVE_BASE/deployment-status/DEPLOYMENT_OPTIMIZATION_COMPLETE.md" "Deployment Optimization"
move_to_archive "DEPLOYMENT_SUMMARY.md" "$ARCHIVE_BASE/deployment-status/DEPLOYMENT_SUMMARY.md" "Deployment Summary"
move_to_archive "BACKEND_DEPLOYMENT.md" "$ARCHIVE_BASE/deployment-status/BACKEND_DEPLOYMENT.md" "Backend Deployment"
move_to_archive "DEPLOY_NOW_INSTRUCTIONS.md" "$ARCHIVE_BASE/deployment-status/DEPLOY_NOW_INSTRUCTIONS.md" "Deploy Now"
move_to_archive "POST_DEPLOYMENT_REPORT.md" "$ARCHIVE_BASE/deployment-status/POST_DEPLOYMENT_REPORT.md" "Post Deployment"
move_to_archive "REDEPLOYMENT_COMPLETE.md" "$ARCHIVE_BASE/deployment-status/REDEPLOYMENT_COMPLETE.md" "Redeployment"

# .deployment directory
move_to_archive ".deployment/DEPLOYMENT_GUIDE.md" "$ARCHIVE_BASE/deployment-status/.deployment_DEPLOYMENT_GUIDE.md" "Deployment Guide"
move_to_archive ".deployment/ACTION_ITEMS_COMPLETE.md" "$ARCHIVE_BASE/deployment-status/.deployment_ACTION_ITEMS_COMPLETE.md" "Action Items"
move_to_archive ".deployment/NEXT_STEPS_COMPLETION_REPORT.md" "$ARCHIVE_BASE/deployment-status/.deployment_NEXT_STEPS_COMPLETION_REPORT.md" "Next Steps"
move_to_archive ".deployment/OPTIMIZATION_SUMMARY.md" "$ARCHIVE_BASE/deployment-status/.deployment_OPTIMIZATION_SUMMARY.md" "Optimization Summary"
move_to_archive ".deployment/SERVICE_STATUS_REPORT.md" "$ARCHIVE_BASE/deployment-status/.deployment_SERVICE_STATUS_REPORT.md" "Service Status"

echo ""
echo -e "${BLUE}Phase 3: Archiving Diagnostic Reports${NC}"
echo "=========================================="

move_to_archive "COMPREHENSIVE_DIAGNOSTIC_STATUS.md" "$ARCHIVE_BASE/diagnostics/COMPREHENSIVE_DIAGNOSTIC_STATUS.md" "Diagnostic Status"
move_to_archive "COMPREHENSIVE_DUPLICATE_UNUSED_FILES_DIAGNOSTIC.md" "$ARCHIVE_BASE/diagnostics/COMPREHENSIVE_DUPLICATE_UNUSED_FILES_DIAGNOSTIC.md" "Duplicate Files Diagnostic"
move_to_archive "DIAGNOSTIC_REPORT.md" "$ARCHIVE_BASE/diagnostics/DIAGNOSTIC_REPORT.md" "Diagnostic Report"
move_to_archive "DIAGNOSTIC_FRAMEWORK_V1_COMPREHENSIVE.md" "$ARCHIVE_BASE/diagnostics/DIAGNOSTIC_FRAMEWORK_V1_COMPREHENSIVE.md" "Framework V1"
move_to_archive "ADVANCED_DIAGNOSTIC_FRAMEWORK_V2.md" "$ARCHIVE_BASE/diagnostics/ADVANCED_DIAGNOSTIC_FRAMEWORK_V2.md" "Framework V2"
move_to_archive "ADDITIONAL_DIAGNOSTIC_ASPECTS_PROPOSAL.md" "$ARCHIVE_BASE/diagnostics/ADDITIONAL_DIAGNOSTIC_ASPECTS_PROPOSAL.md" "Additional Aspects"
move_to_archive "BACKEND_DIAGNOSIS.md" "$ARCHIVE_BASE/diagnostics/BACKEND_DIAGNOSIS.md" "Backend Diagnosis"
move_to_archive "BACKEND_DIAGNOSTIC_REPORT.md" "$ARCHIVE_BASE/diagnostics/BACKEND_DIAGNOSTIC_REPORT.md" "Backend Diagnostic"
move_to_archive "FRONTEND_DIAGNOSTICS_REPORT.md" "$ARCHIVE_BASE/diagnostics/FRONTEND_DIAGNOSTICS_REPORT.md" "Frontend Diagnostics"
move_to_archive "FRONTEND_FINESSE_AUDIT_REPORT.md" "$ARCHIVE_BASE/diagnostics/FRONTEND_FINESSE_AUDIT_REPORT.md" "Frontend Finesse"
move_to_archive "frontend/DIAGNOSTIC_REPORT.md" "$ARCHIVE_BASE/diagnostics/frontend_DIAGNOSTIC_REPORT.md" "Frontend Diagnostic"
move_to_archive "frontend/QUICK_DIAGNOSTIC.md" "$ARCHIVE_BASE/diagnostics/frontend_QUICK_DIAGNOSTIC.md" "Frontend Quick"
move_to_archive "FULL_STACK_AUDIT_REPORT.md" "$ARCHIVE_BASE/diagnostics/FULL_STACK_AUDIT_REPORT.md" "Full Stack Audit"
move_to_archive "AUDIT_FIXES_SUMMARY.md" "$ARCHIVE_BASE/diagnostics/AUDIT_FIXES_SUMMARY.md" "Audit Fixes"
move_to_archive "AUDIT_TASKS_COMPLETION_SUMMARY.md" "$ARCHIVE_BASE/diagnostics/AUDIT_TASKS_COMPLETION_SUMMARY.md" "Audit Tasks"
move_to_archive "LOGSTASH_DIAGNOSTIC_REPORT.md" "$ARCHIVE_BASE/diagnostics/LOGSTASH_DIAGNOSTIC_REPORT.md" "Logstash Diagnostic"
move_to_archive "PASSWORD_MANAGER_DIAGNOSIS.md" "$ARCHIVE_BASE/diagnostics/PASSWORD_MANAGER_DIAGNOSIS.md" "Password Manager Diagnosis"
move_to_archive "PASSWORD_MANAGER_DIAGNOSTIC_REPORT.md" "$ARCHIVE_BASE/diagnostics/PASSWORD_MANAGER_DIAGNOSTIC_REPORT.md" "Password Manager Diagnostic"
move_to_archive "TODO_DIAGNOSIS_REPORT.md" "$ARCHIVE_BASE/diagnostics/TODO_DIAGNOSIS_REPORT.md" "TODO Diagnosis"

echo ""
echo -e "${BLUE}Phase 4: Archiving Password Manager Status Reports${NC}"
echo "=========================================="

move_to_archive "PASSWORD_MANAGER_ACCELERATED_IMPLEMENTATION.md" "$ARCHIVE_BASE/feature-status/password-manager/PASSWORD_MANAGER_ACCELERATED_IMPLEMENTATION.md" "Accelerated Implementation"
move_to_archive "PASSWORD_MANAGER_COMPLETION_STATUS.md" "$ARCHIVE_BASE/feature-status/password-manager/PASSWORD_MANAGER_COMPLETION_STATUS.md" "Completion Status"
move_to_archive "PASSWORD_MANAGER_COMPREHENSIVE_INVESTIGATION_AND_PROPOSAL.md" "$ARCHIVE_BASE/feature-status/password-manager/PASSWORD_MANAGER_COMPREHENSIVE_INVESTIGATION_AND_PROPOSAL.md" "Investigation"
move_to_archive "PASSWORD_MANAGER_COVERAGE_SUMMARY.md" "$ARCHIVE_BASE/feature-status/password-manager/PASSWORD_MANAGER_COVERAGE_SUMMARY.md" "Coverage Summary"
move_to_archive "PASSWORD_MANAGER_FINAL_STATUS.md" "$ARCHIVE_BASE/feature-status/password-manager/PASSWORD_MANAGER_FINAL_STATUS.md" "Final Status"
move_to_archive "PASSWORD_MANAGER_IMPLEMENTATION_COMPLETE.md" "$ARCHIVE_BASE/feature-status/password-manager/PASSWORD_MANAGER_IMPLEMENTATION_COMPLETE.md" "Implementation Complete"
move_to_archive "PASSWORD_MANAGER_IMPLEMENTATION_STATUS.md" "$ARCHIVE_BASE/feature-status/password-manager/PASSWORD_MANAGER_IMPLEMENTATION_STATUS.md" "Implementation Status"
move_to_archive "PASSWORD_MANAGER_INTEGRATION_PLAN.md" "$ARCHIVE_BASE/feature-status/password-manager/PASSWORD_MANAGER_INTEGRATION_PLAN.md" "Integration Plan"
move_to_archive "PASSWORD_MANAGER_OAUTH_INTEGRATION.md" "$ARCHIVE_BASE/feature-status/password-manager/PASSWORD_MANAGER_OAUTH_INTEGRATION.md" "OAuth Integration"
move_to_archive "PASSWORD_MANAGER_SETUP_COMPLETE.md" "$ARCHIVE_BASE/feature-status/password-manager/PASSWORD_MANAGER_SETUP_COMPLETE.md" "Setup Complete"

echo ""
echo -e "${BLUE}Phase 5: Archiving Logstash Status Reports${NC}"
echo "=========================================="

move_to_archive "LOGSTASH_ANALYSIS_SUMMARY.md" "$ARCHIVE_BASE/feature-status/logstash/LOGSTASH_ANALYSIS_SUMMARY.md" "Analysis Summary"
move_to_archive "LOGSTASH_COMPREHENSIVE_ANALYSIS.md" "$ARCHIVE_BASE/feature-status/logstash/LOGSTASH_COMPREHENSIVE_ANALYSIS.md" "Comprehensive Analysis"
move_to_archive "LOGSTASH_FIXES_COMPLETE.md" "$ARCHIVE_BASE/feature-status/logstash/LOGSTASH_FIXES_COMPLETE.md" "Fixes Complete"
move_to_archive "LOGSTASH_MONITORING_SETUP_COMPLETE.md" "$ARCHIVE_BASE/feature-status/logstash/LOGSTASH_MONITORING_SETUP_COMPLETE.md" "Monitoring Setup"
move_to_archive "LOGSTASH_NEXT_PROPOSALS.md" "$ARCHIVE_BASE/feature-status/logstash/LOGSTASH_NEXT_PROPOSALS.md" "Next Proposals"
move_to_archive "LOGSTASH_NEXT_STEPS_GUIDE.md" "$ARCHIVE_BASE/feature-status/logstash/LOGSTASH_NEXT_STEPS_GUIDE.md" "Next Steps"
move_to_archive "LOGSTASH_TODOS_COMPLETE.md" "$ARCHIVE_BASE/feature-status/logstash/LOGSTASH_TODOS_COMPLETE.md" "TODOS Complete"
move_to_archive "LOGSTASH_VERIFICATION_RESULTS.md" "$ARCHIVE_BASE/feature-status/logstash/LOGSTASH_VERIFICATION_RESULTS.md" "Verification Results"

echo ""
echo -e "${BLUE}Phase 6: Archiving Database Status Reports${NC}"
echo "=========================================="

move_to_archive "DATABASE_SETUP_COMPLETE.md" "$ARCHIVE_BASE/feature-status/database/DATABASE_SETUP_COMPLETE.md" "Setup Complete"
move_to_archive "DATABASE_SETUP_COMPLETE_FINAL.md" "$ARCHIVE_BASE/feature-status/database/DATABASE_SETUP_COMPLETE_FINAL.md" "Setup Complete Final"
move_to_archive "DATABASE_SETUP_FINAL.md" "$ARCHIVE_BASE/feature-status/database/DATABASE_SETUP_FINAL.md" "Setup Final"
move_to_archive "DATABASE_READY.md" "$ARCHIVE_BASE/feature-status/database/DATABASE_READY.md" "Database Ready"

echo ""
echo -e "${BLUE}Phase 7: Archiving Accessibility Status Reports${NC}"
echo "=========================================="

move_to_archive "ACCESSIBILITY_COMPLETION_REPORT.md" "$ARCHIVE_BASE/feature-status/accessibility/ACCESSIBILITY_COMPLETION_REPORT.md" "Completion Report"
move_to_archive "ACCESSIBILITY_VERIFICATION_COMPLETE.md" "$ARCHIVE_BASE/feature-status/accessibility/ACCESSIBILITY_VERIFICATION_COMPLETE.md" "Verification Complete"
move_to_archive "ACCESSIBILITY_NEXT_STEPS.md" "$ARCHIVE_BASE/feature-status/accessibility/ACCESSIBILITY_NEXT_STEPS.md" "Next Steps"
move_to_archive "CONTRAST_FIXES_SUMMARY.md" "$ARCHIVE_BASE/feature-status/accessibility/CONTRAST_FIXES_SUMMARY.md" "Contrast Fixes"

echo ""
echo -e "${BLUE}Phase 8: Archiving Frontend Status Reports${NC}"
echo "=========================================="

move_to_archive "frontend/BLANK_PAGE_FIX_SUMMARY.md" "$ARCHIVE_BASE/feature-status/frontend/BLANK_PAGE_FIX_SUMMARY.md" "Blank Page Fix"
move_to_archive "frontend/CSP_FIX_SUMMARY.md" "$ARCHIVE_BASE/feature-status/frontend/CSP_FIX_SUMMARY.md" "CSP Fix"
move_to_archive "frontend/CSP_IMPROVEMENTS_COMPLETE.md" "$ARCHIVE_BASE/feature-status/frontend/CSP_IMPROVEMENTS_COMPLETE.md" "CSP Improvements"
move_to_archive "frontend/ERROR_CONTEXT_INTEGRATION_VERIFICATION.md" "$ARCHIVE_BASE/feature-status/frontend/ERROR_CONTEXT_INTEGRATION_VERIFICATION.md" "Error Context"
move_to_archive "FRONTEND_CONFIGURATION_SUMMARY.md" "$ARCHIVE_BASE/feature-status/frontend/FRONTEND_CONFIGURATION_SUMMARY.md" "Configuration Summary"

echo ""
echo -e "${BLUE}Phase 9: Archiving Cursor/.cursor Documentation${NC}"
echo "=========================================="

move_to_archive ".cursor/MCP_CHECKLIST_RESULTS.md" "$ARCHIVE_BASE/cursor-docs/MCP_CHECKLIST_RESULTS.md" "MCP Checklist"
move_to_archive ".cursor/MCP_DEEP_DIAGNOSTIC_REPORT.md" "$ARCHIVE_BASE/cursor-docs/MCP_DEEP_DIAGNOSTIC_REPORT.md" "MCP Deep Diagnostic"
move_to_archive ".cursor/MCP_DIAGNOSIS_REPORT.md" "$ARCHIVE_BASE/cursor-docs/MCP_DIAGNOSIS_REPORT.md" "MCP Diagnosis"
move_to_archive ".cursor/MCP_OPTIMIZATION_COMPLETE.md" "$ARCHIVE_BASE/cursor-docs/MCP_OPTIMIZATION_COMPLETE.md" "MCP Optimization"
move_to_archive ".cursor/MCP_OPTIMIZATION_SUMMARY_FINAL.md" "$ARCHIVE_BASE/cursor-docs/MCP_OPTIMIZATION_SUMMARY_FINAL.md" "MCP Optimization Final"
move_to_archive ".cursor/MCP_OPTIMIZATION_SUMMARY.md" "$ARCHIVE_BASE/cursor-docs/MCP_OPTIMIZATION_SUMMARY.md" "MCP Optimization Summary"
move_to_archive ".cursor/MCP_OPTIMIZATION_UNDER_80.md" "$ARCHIVE_BASE/cursor-docs/MCP_OPTIMIZATION_UNDER_80.md" "MCP Under 80"
move_to_archive ".cursor/MCP_CONFIGURATION_UPDATE.md" "$ARCHIVE_BASE/cursor-docs/MCP_CONFIGURATION_UPDATE.md" "MCP Configuration"
move_to_archive ".cursor/MCP_ISSUES_RESOLVED.md" "$ARCHIVE_BASE/cursor-docs/MCP_ISSUES_RESOLVED.md" "MCP Issues"
move_to_archive ".cursor/OPTIMIZATION_SUMMARY.md" "$ARCHIVE_BASE/cursor-docs/OPTIMIZATION_SUMMARY.md" "Optimization Summary"

echo ""
echo -e "${BLUE}Phase 10: Archiving Other Status Reports${NC}"
echo "=========================================="

move_to_archive "DOCKER_OPTIMIZATION_COMPLETE.md" "$ARCHIVE_BASE/completion-reports/DOCKER_OPTIMIZATION_COMPLETE.md" "Docker Optimization"
move_to_archive "DOCUMENTATION_CONSOLIDATION_COMPLETE.md" "$ARCHIVE_BASE/completion-reports/DOCUMENTATION_CONSOLIDATION_COMPLETE.md" "Documentation Consolidation"
move_to_archive "DOCUMENTATION_CONSOLIDATION_SUMMARY.md" "$ARCHIVE_BASE/completion-reports/DOCUMENTATION_CONSOLIDATION_SUMMARY.md" "Documentation Summary"
move_to_archive "PLAYWRIGHT_MCP_SETUP_COMPLETE.md" "$ARCHIVE_BASE/completion-reports/PLAYWRIGHT_MCP_SETUP_COMPLETE.md" "Playwright MCP"
move_to_archive "POSTGRES_MCP_FIX_COMPLETE.md" "$ARCHIVE_BASE/completion-reports/POSTGRES_MCP_FIX_COMPLETE.md" "Postgres MCP"
move_to_archive "COMPLETE_VERIFICATION_REPORT.md" "$ARCHIVE_BASE/completion-reports/COMPLETE_VERIFICATION_REPORT.md" "Verification Report"
move_to_archive "HEALTH_SCORE_SUMMARY.md" "$ARCHIVE_BASE/completion-reports/HEALTH_SCORE_SUMMARY.md" "Health Score"
move_to_archive "INTEGRATION_SYNC_REPORT.md" "$ARCHIVE_BASE/completion-reports/INTEGRATION_SYNC_REPORT.md" "Integration Sync"
move_to_archive "NEXT_STEPS_COMPLETED.md" "$ARCHIVE_BASE/completion-reports/NEXT_STEPS_COMPLETED.md" "Next Steps"
move_to_archive "NEXT_STEPS_EXECUTED.md" "$ARCHIVE_BASE/completion-reports/NEXT_STEPS_EXECUTED.md" "Next Steps Executed"
move_to_archive "NEXT_STEPS_PROPOSAL.md" "$ARCHIVE_BASE/completion-reports/NEXT_STEPS_PROPOSAL.md" "Next Steps Proposal"
move_to_archive "OLD_CODE_INVESTIGATION_REPORT.md" "$ARCHIVE_BASE/completion-reports/OLD_CODE_INVESTIGATION_REPORT.md" "Old Code Investigation"
move_to_archive "ERROR_INVESTIGATION_REPORT.md" "$ARCHIVE_BASE/completion-reports/ERROR_INVESTIGATION_REPORT.md" "Error Investigation"
move_to_archive "KNOWN_ISSUE_INVESTIGATION.md" "$ARCHIVE_BASE/completion-reports/KNOWN_ISSUE_INVESTIGATION.md" "Known Issue"
move_to_archive "BACKEND_ERRORS_REPORT.md" "$ARCHIVE_BASE/completion-reports/BACKEND_ERRORS_REPORT.md" "Backend Errors"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Documentation Consolidation Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  Files archived to: ${YELLOW}$ARCHIVE_BASE${NC}"
echo -e "  Check ${YELLOW}DOCUMENTATION_DUPLICATES_DIAGNOSTIC.md${NC} for details"
echo ""

