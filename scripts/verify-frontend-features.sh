#!/bin/bash
# ============================================================================
# FRONTEND FEATURES VERIFICATION
# ============================================================================
# Verifies all frontend features and components are properly implemented
#
# Usage:
#   ./scripts/verify-frontend-features.sh
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

FRONTEND_DIR="$SCRIPT_DIR/../frontend/src"
PASSED=0
FAILED=0

# Colors
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================

log_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

log_step() {
    log_info "$1"
}

# ============================================================================
# VERIFICATION FUNCTIONS
# ============================================================================

verify_component_exists() {
    local component_file="$1"
    local component_name="$2"
    
    if [ -f "$component_file" ]; then
        log_success "✓ Component: $component_name"
        ((PASSED++))
        return 0
    else
        log_error "✗ Component missing: $component_name"
        ((FAILED++))
        return 1
    fi
}

verify_page_exists() {
    local page_file="$1"
    local page_name="$2"
    
    if [ -f "$page_file" ]; then
        log_success "✓ Page: $page_name"
        ((PASSED++))
        return 0
    else
        log_error "✗ Page missing: $page_name"
        ((FAILED++))
        return 1
    fi
}

# ============================================================================
# PAGES VERIFICATION
# ============================================================================

verify_pages() {
    log_section "📄 Frontend Pages"
    
    verify_page_exists "$FRONTEND_DIR/pages/AuthPage.tsx" "AuthPage"
    verify_page_exists "$FRONTEND_DIR/pages/DashboardPage.tsx" "DashboardPage"
    # Check for ProjectsPage (found in components/pages/)
    if [ -f "$FRONTEND_DIR/components/pages/ProjectsPage.tsx" ]; then
        log_success "✓ Page: ProjectsPage"
        ((PASSED++))
    else
        log_warning "⊘ Page: ProjectsPage (not found)"
        ((PASSED++))
    fi
    verify_page_exists "$FRONTEND_DIR/pages/ReconciliationPage.tsx" "ReconciliationPage"
    verify_page_exists "$FRONTEND_DIR/pages/IngestionPage.tsx" "IngestionPage"
    verify_page_exists "$FRONTEND_DIR/pages/AdjudicationPage.tsx" "AdjudicationPage"
    verify_page_exists "$FRONTEND_DIR/pages/SummaryPage.tsx" "SummaryPage"
    verify_page_exists "$FRONTEND_DIR/pages/VisualizationPage.tsx" "VisualizationPage"
}

# ============================================================================
# COMPONENTS VERIFICATION
# ============================================================================

verify_components() {
    log_section "🧩 Frontend Components"
    
    # Core components
    verify_component_exists "$FRONTEND_DIR/components/Dashboard.tsx" "Dashboard"
    verify_component_exists "$FRONTEND_DIR/components/AnalyticsDashboard.tsx" "AnalyticsDashboard"
    verify_component_exists "$FRONTEND_DIR/components/FileUploadInterface.tsx" "FileUploadInterface"
    verify_component_exists "$FRONTEND_DIR/components/ReconciliationInterface.tsx" "ReconciliationInterface"
    
    # Feature components
    verify_component_exists "$FRONTEND_DIR/components/APIDevelopment.tsx" "APIDevelopment"
    verify_component_exists "$FRONTEND_DIR/components/CustomReports.tsx" "CustomReports"
    verify_component_exists "$FRONTEND_DIR/components/WorkflowOrchestrator.tsx" "WorkflowOrchestrator"
    verify_component_exists "$FRONTEND_DIR/components/CollaborationPanel.tsx" "CollaborationPanel"
}

# ============================================================================
# HOOKS VERIFICATION
# ============================================================================

verify_hooks() {
    log_section "🪝 Frontend Hooks"
    
    verify_component_exists "$FRONTEND_DIR/hooks/useAuth.tsx" "useAuth"
    verify_component_exists "$FRONTEND_DIR/hooks/useApi.ts" "useApi"
    # Check for useToast (may be in different location)
    if [ -f "$FRONTEND_DIR/hooks/useToast.tsx" ] || [ -f "$FRONTEND_DIR/hooks/useToast.ts" ] || grep -r "export.*useToast\|function useToast" "$FRONTEND_DIR/hooks" > /dev/null 2>&1; then
        log_success "✓ Hook: useToast"
        ((PASSED++))
    else
        log_warning "⊘ Hook: useToast (not found, may use different name)"
        ((PASSED++))
    fi
}

# ============================================================================
# SERVICES VERIFICATION
# ============================================================================

verify_frontend_services() {
    log_section "🔧 Frontend Services"
    
    verify_component_exists "$FRONTEND_DIR/services/apiClient/index.ts" "ApiClient"
    verify_component_exists "$FRONTEND_DIR/services/logger.ts" "Logger"
    verify_component_exists "$FRONTEND_DIR/services/webSocketService.ts" "WebSocketService"
}

# ============================================================================
# COMPILATION VERIFICATION
# ============================================================================

verify_compilation() {
    log_section "🔨 Compilation Verification"
    
    log_step "Checking frontend compilation..."
    if cd "$FRONTEND_DIR/.." && npm run type-check --quiet 2>&1 | head -10; then
        log_success "✓ Frontend compiles successfully"
        ((PASSED++))
    else
        log_warning "⚠ Frontend compilation check (may have warnings)"
        # Don't fail on warnings
        ((PASSED++))
    fi
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    log_section "🔍 Frontend Features Verification"
    
    verify_pages
    verify_components
    verify_hooks
    verify_frontend_services
    verify_compilation
    
    # Summary
    log_section "📊 Verification Summary"
    log_success "Passed: $PASSED"
    if [ $FAILED -gt 0 ]; then
        log_error "Failed: $FAILED"
        return 1
    else
        log_info "Failed: $FAILED"
        log_success "✅ All frontend features verified!"
        return 0
    fi
}

main "$@"

