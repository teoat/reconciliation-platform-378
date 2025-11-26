#!/bin/bash
# ==============================================================================
# Documentation Consolidation Script
# ==============================================================================
# Archives completion/summary/report files and consolidates duplicates
# Usage: ./scripts/consolidate-documentation.sh
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

ARCHIVE_BASE="docs/archive"
COMPLETE_ARCHIVE="$ARCHIVE_BASE/completion-reports/2025-01"
SUMMARY_ARCHIVE="$ARCHIVE_BASE/summary-reports/2025-01"
REPORT_ARCHIVE="$ARCHIVE_BASE/diagnostic-reports/2025-01"

mkdir -p "$COMPLETE_ARCHIVE" "$SUMMARY_ARCHIVE" "$REPORT_ARCHIVE"

log_info "Starting documentation consolidation..."

# Archive COMPLETE files
log_info "Archiving COMPLETE files..."
COMPLETE_FILES=(
    "DEPLOYMENT_COMPLETE.md"
    "ALL_TODOS_COMPLETED_CONFIRMED.md"
    "FINAL_VERIFICATION_COMPLETE.md"
    "ALL_NEXT_STEPS_COMPLETED.md"
    "NEXT_STEPS_COMPLETED.md"
    "PROPOSED_FIXES_COMPLETED.md"
    "AGENT_COORDINATION_COMPLETE.md"
    "docs/operations/KUBERNETES_DOCKER_SYNC_COMPLETE.md"
    "docs/development/MCP_SETUP_COMPLETE.md"
    "docs/development/AGENT_COORDINATION_IMPLEMENTATION_COMPLETE.md"
    "docs/operations/SYNCHRONIZATION_COMPLETE.md"
    "docs/operations/SYNC_NOTES_FIXES_COMPLETE.md"
    "docs/operations/NEXT_STEPS_COMPLETE.md"
    "docs/operations/GITHUB_LOCAL_SYNC_COMPLETE.md"
    "docs/features/frenly-ai/FRENLY_OPTIMIZATION_COMPLETE.md"
    "docs/features/FEATURE_REGISTRY_INTEGRATION_COMPLETE.md"
    "docs/operations/MCP_FRENLY_INTEGRATION_COMPLETE.md"
    "docs/operations/MCP_VERIFICATION_COMPLETE.md"
    "docs/operations/MCP_COMPLETE_VERIFICATION.md"
    "docs/AGGRESSIVE_CONSOLIDATION_COMPLETE.md"
    "docs/DOCUMENTATION_CONSOLIDATION_COMPLETE.md"
    "backend/tests/ALL_FIXES_COMPLETE.md"
    "backend/tests/ALL_ISSUES_COMPLETE.md"
    "backend/tests/GROUP_FIXES_COMPLETE.md"
    "backend/tests/TEST_FIXES_COMPLETE.md"
    "docs/features/meta-agent/meta-agent-acceleration-complete.md"
)

for file in "${COMPLETE_FILES[@]}"; do
    if [ -f "$file" ]; then
        mkdir -p "$COMPLETE_ARCHIVE/$(dirname "$file")"
        mv "$file" "$COMPLETE_ARCHIVE/$file" 2>/dev/null || log_warning "Could not move $file"
        log_info "Archived: $file"
    fi
done

# Archive SUMMARY files
log_info "Archiving SUMMARY files..."
SUMMARY_FILES=(
    "DEPLOYMENT_SUMMARY.md"
    "COMPLETION_SUMMARY.md"
    "TECHNICAL_IMPROVEMENTS_EXECUTIVE_SUMMARY.md"
    "TECHNICAL_IMPROVEMENTS_SUMMARY.md"
    "PROGRESS_SUMMARY.md"
    "NEXT_STEPS_EXECUTION_SUMMARY.md"
    "100_SCORE_IMPROVEMENT_SUMMARY.md"
    "LINTING_WARNINGS_FIX_SUMMARY.md"
    "REMAINING_WORK_COMPLETION_SUMMARY.md"
    "NEXT_STEPS_COMPLETION_SUMMARY.md"
    "FIX_COMPLETION_SUMMARY.md"
    "DIAGNOSTIC_COMPLETION_SUMMARY.md"
    "CRITICAL_PRIORITIES_COMPLETION_SUMMARY.md"
    "COMPREHENSIVE_DIAGNOSTIC_SUMMARY.md"
    "docs/architecture/NEXT_STEPS_COMPLETION_SUMMARY.md"
    "docs/project-management/REFACTORING_ORCHESTRATION_SUMMARY.md"
    "docs/development/AGENT_COORDINATION_SUMMARY.md"
    "docs/deployment/COMPREHENSIVE_FIXES_SUMMARY.md"
    "docs/operations/ERROR_FIXES_SUMMARY.md"
    "docs/project-management/ROADMAP_EXECUTION_SUMMARY.md"
    "docs/project-management/BUILD_ROADMAP_SUMMARY.md"
    "docs/DOCUMENTATION_CONSOLIDATION_SUMMARY.md"
    "k8s/optimized/SECRET_MANAGEMENT_SUMMARY.md"
    "backend/tests/FINAL_FIXES_SUMMARY.md"
    "backend/tests/PARALLEL_WORK_SUMMARY.md"
    "docs/improvements/SIGNUP_TESTING_SUMMARY.md"
    "frontend/ALL_ISSUES_FIXED_SUMMARY.md"
    "frontend/FINAL_COMPLETION_SUMMARY.md"
    "frontend/REMAINING_WORK_COMPLETION_SUMMARY.md"
    "frontend/TEST_EXECUTION_SUMMARY.md"
    "frontend/PHASE_COMPLETION_SUMMARY.md"
    "frontend/TYPESCRIPT_FIXES_SUMMARY.md"
    "docs/architecture/ORCHESTRATION_IMPLEMENTATION_SUMMARY.md"
    "frontend/DIAGNOSTIC_SUMMARY.md"
    "frontend/CSP_FIX_SUMMARY.md"
    "frontend/BLANK_PAGE_FIX_SUMMARY.md"
    "accessibility-reports/TEST_RESULTS_SUMMARY.md"
    "docs/features/frenly-ai/frenly-optimization-summary.md"
    "docs/testing/UAT_SUMMARY.md"
)

for file in "${SUMMARY_FILES[@]}"; do
    if [ -f "$file" ]; then
        mkdir -p "$SUMMARY_ARCHIVE/$(dirname "$file")"
        mv "$file" "$SUMMARY_ARCHIVE/$file" 2>/dev/null || log_warning "Could not move $file"
        log_info "Archived: $file"
    fi
done

# Archive REPORT files (keep security audit reports)
log_info "Archiving REPORT files..."
REPORT_FILES=(
    "FOLLOW_UP_COMPLETION_REPORT.md"
    "TODOS_COMPLETION_REPORT.md"
    "VERIFICATION_REPORT.md"
    "FINAL_COMPLETION_REPORT.md"
    "docker-diagnostic-report-20251126-233343.md"
    "docker-diagnostic-report-20251126-233247.md"
    "COMPREHENSIVE_BUGS_AND_IMPROVEMENTS_REPORT.md"
    "COMPREHENSIVE_APP_DIAGNOSIS_REPORT.md"
    "BACKEND_RESTART_FINAL_REPORT.md"
    "COMPREHENSIVE_DIAGNOSTIC_REPORT.md"
    "docs/project-management/DIAGNOSTIC_COMPLETION_REPORT.md"
    "backend/tests/COMPLETION_REPORT.md"
    "frontend/DIAGNOSTIC_REPORT.md"
    "docs/features/meta-agent/meta-agent-analysis-report.md"
)

for file in "${REPORT_FILES[@]}"; do
    if [ -f "$file" ]; then
        mkdir -p "$REPORT_ARCHIVE/$(dirname "$file")"
        mv "$file" "$REPORT_ARCHIVE/$file" 2>/dev/null || log_warning "Could not move $file"
        log_info "Archived: $file"
    fi
done

log_success "Documentation consolidation complete"
log_info "Archived files to:"
log_info "  - Completion reports: $COMPLETE_ARCHIVE"
log_info "  - Summary reports: $SUMMARY_ARCHIVE"
log_info "  - Diagnostic reports: $REPORT_ARCHIVE"

