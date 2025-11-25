#!/bin/bash
# ============================================================================
# QUICK COMMANDS - Common Script Execution
# ============================================================================
# Quick shortcuts for common operations
#
# Usage:
#   ./scripts/QUICK_COMMANDS.sh verify
#   ./scripts/QUICK_COMMANDS.sh deploy staging
#   ./scripts/QUICK_COMMANDS.sh test
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

show_help() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}                    QUICK COMMANDS${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Usage: ./scripts/QUICK_COMMANDS.sh [command]"
    echo ""
    echo "Commands:"
    echo "  verify          - Verify backend and frontend"
    echo "  verify-backend  - Verify backend functions only"
    echo "  verify-frontend - Verify frontend features only"
    echo "  deploy-staging  - Quick deploy to staging"
    echo "  deploy-prod     - Deploy to production"
    echo "  test            - Run all tests"
    echo "  test-quick      - Run quick tests"
    echo "  status          - Show system status"
    echo "  help            - Show this help"
    echo ""
}

verify_all() {
    log_section "🔍 Quick Verification"
    
    log_info "Verifying backend functions..."
    "$SCRIPT_DIR/verify-backend-functions.sh" 2>&1 | tail -3
    
    echo ""
    log_info "Verifying frontend features..."
    "$SCRIPT_DIR/verify-frontend-features.sh" 2>&1 | tail -3
    
    log_success "✅ Quick verification complete!"
}

verify_backend() {
    log_info "Verifying backend functions..."
    "$SCRIPT_DIR/verify-backend-functions.sh"
}

verify_frontend() {
    log_info "Verifying frontend features..."
    "$SCRIPT_DIR/verify-frontend-features.sh"
}

deploy_staging() {
    local version=${1:-latest}
    log_info "Deploying to staging (version: $version)..."
    "$SCRIPT_DIR/quick-deploy-all.sh" "$version"
}

deploy_prod() {
    local version=${1:-latest}
    log_warning "⚠️  Production deployment requires confirmation"
    log_info "Run: ./scripts/orchestrate-production-deployment.sh $version production"
}

run_tests() {
    log_info "Running all tests..."
    "$SCRIPT_DIR/run-all-tests.sh"
}

run_quick_tests() {
    log_info "Running quick tests..."
    "$SCRIPT_DIR/run-tests-quick.sh"
}

show_status() {
    log_section "📊 System Status"
    
    echo ""
    log_info "Backend Functions:"
    "$SCRIPT_DIR/verify-backend-functions.sh" 2>&1 | grep -E "(Passed|Failed)" | head -1
    
    echo ""
    log_info "Frontend Features:"
    "$SCRIPT_DIR/verify-frontend-features.sh" 2>&1 | grep -E "(Passed|Failed)" | head -1
    
    echo ""
    log_info "Scripts Available:"
    ls -1 "$SCRIPT_DIR"/*.sh 2>/dev/null | wc -l | xargs echo "   Total:"
}

# Main
case "${1:-help}" in
    verify)
        verify_all
        ;;
    verify-backend)
        verify_backend
        ;;
    verify-frontend)
        verify_frontend
        ;;
    deploy-staging)
        deploy_staging "${2:-latest}"
        ;;
    deploy-prod)
        deploy_prod "${2:-latest}"
        ;;
    test)
        run_tests
        ;;
    test-quick)
        run_quick_tests
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac

