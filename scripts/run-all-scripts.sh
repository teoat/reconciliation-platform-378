#!/bin/bash
# ============================================================================
# MASTER SCRIPT RUNNER
# ============================================================================
# Interactive script to run all available scripts with proper organization
#
# Usage:
#   ./scripts/run-all-scripts.sh [category] [script_name]
#   ./scripts/run-all-scripts.sh deployment orchestrate-production-deployment
#   ./scripts/run-all-scripts.sh verify all
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Colors
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ============================================================================
# SCRIPT CATEGORIES
# ============================================================================

show_menu() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}                    MASTER SCRIPT RUNNER${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Available Categories:"
    echo ""
    echo "  1) deployment     - Deployment and orchestration scripts"
    echo "  2) verification   - Service and feature verification"
    echo "  3) testing        - Test execution and coverage"
    echo "  4) diagnostics   - Diagnostic and analysis scripts"
    echo "  5) maintenance    - Maintenance and cleanup scripts"
    echo "  6) setup          - Setup and configuration scripts"
    echo "  7) all            - Run all scripts in sequence"
    echo ""
    echo "Usage:"
    echo "  ./scripts/run-all-scripts.sh [category] [script_name]"
    echo "  ./scripts/run-all-scripts.sh deployment orchestrate-production-deployment"
    echo "  ./scripts/run-all-scripts.sh verify all"
    echo ""
}

# ============================================================================
# DEPLOYMENT SCRIPTS
# ============================================================================

run_deployment_scripts() {
    local script_name=${1:-all}
    
    case "$script_name" in
        all|orchestrate)
            log_info "Running production deployment orchestration..."
            "$SCRIPT_DIR/orchestrate-production-deployment.sh" "${2:-latest}" "${3:-production}"
            ;;
        quick)
            log_info "Running quick deployment..."
            "$SCRIPT_DIR/quick-deploy-all.sh" "${2:-latest}"
            ;;
        staging)
            log_info "Running staging deployment..."
            "$SCRIPT_DIR/deploy-staging.sh" "${2:-latest}"
            ;;
        production)
            log_info "Running production deployment..."
            "$SCRIPT_DIR/deploy-production.sh" "${2:-latest}"
            ;;
        docker)
            log_info "Running Docker deployment..."
            "$SCRIPT_DIR/deployment/deploy-docker.sh" "${2:-staging}"
            ;;
        *)
            log_error "Unknown deployment script: $script_name"
            echo "Available: orchestrate, quick, staging, production, docker"
            exit 1
            ;;
    esac
}

# ============================================================================
# VERIFICATION SCRIPTS
# ============================================================================

run_verification_scripts() {
    local script_name=${1:-all}
    
    case "$script_name" in
        all)
            log_info "Running all verification scripts..."
            "$SCRIPT_DIR/verify-all-services.sh" "${2:-production}" "${3:-}"
            "$SCRIPT_DIR/verify-production-readiness.sh"
            "$SCRIPT_DIR/verify-backend-health.sh"
            "$SCRIPT_DIR/verify-performance.sh"
            "$SCRIPT_DIR/smoke-tests.sh" "${2:-production}" "${3:-}"
            ;;
        services)
            log_info "Verifying all services..."
            "$SCRIPT_DIR/verify-all-services.sh" "${2:-production}" "${3:-}"
            ;;
        readiness)
            log_info "Verifying production readiness..."
            "$SCRIPT_DIR/verify-production-readiness.sh"
            ;;
        health)
            log_info "Verifying backend health..."
            "$SCRIPT_DIR/verify-backend-health.sh"
            ;;
        performance)
            log_info "Verifying performance..."
            "$SCRIPT_DIR/verify-performance.sh"
            ;;
        smoke)
            log_info "Running smoke tests..."
            "$SCRIPT_DIR/smoke-tests.sh" "${2:-production}" "${3:-}"
            ;;
        features)
            log_info "Verifying all features..."
            "$SCRIPT_DIR/verify-all-features.sh" "${2:-production}" "${3:-}"
            ;;
        backend)
            log_info "Verifying backend functions..."
            "$SCRIPT_DIR/verify-backend-functions.sh"
            ;;
        frontend)
            log_info "Verifying frontend features..."
            "$SCRIPT_DIR/verify-frontend-features.sh"
            ;;
        *)
            log_error "Unknown verification script: $script_name"
            echo "Available: all, services, readiness, health, performance, smoke, features, backend, frontend"
            exit 1
            ;;
    esac
}

# ============================================================================
# TESTING SCRIPTS
# ============================================================================

run_testing_scripts() {
    local script_name=${1:-all}
    
    case "$script_name" in
        all)
            log_info "Running all tests..."
            "$SCRIPT_DIR/run-all-tests.sh"
            ;;
        quick)
            log_info "Running quick tests..."
            "$SCRIPT_DIR/run-tests-quick.sh"
            ;;
        coverage)
            log_info "Running test coverage..."
            "$SCRIPT_DIR/test-coverage-audit-enhanced.sh"
            ;;
        uat)
            log_info "Running UAT tests..."
            "$SCRIPT_DIR/run-uat.sh"
            ;;
        *)
            log_error "Unknown testing script: $script_name"
            echo "Available: all, quick, coverage, uat"
            exit 1
            ;;
    esac
}

# ============================================================================
# DIAGNOSTIC SCRIPTS
# ============================================================================

run_diagnostic_scripts() {
    local script_name=${1:-all}
    
    case "$script_name" in
        all)
            log_info "Running all diagnostics..."
            "$SCRIPT_DIR/run-all-diagnostics.sh"
            ;;
        comprehensive)
            log_info "Running comprehensive diagnostic..."
            "$SCRIPT_DIR/comprehensive-diagnostic.sh"
            ;;
        *)
            log_error "Unknown diagnostic script: $script_name"
            echo "Available: all, comprehensive"
            exit 1
            ;;
    esac
}

# ============================================================================
# MAINTENANCE SCRIPTS
# ============================================================================

run_maintenance_scripts() {
    local script_name=${1:-all}
    
    case "$script_name" in
        all)
            log_info "Running maintenance tasks..."
            "$SCRIPT_DIR/audit-technical-debt.sh"
            "$SCRIPT_DIR/update-dependencies.sh"
            ;;
        audit)
            log_info "Running technical debt audit..."
            "$SCRIPT_DIR/audit-technical-debt.sh"
            ;;
        dependencies)
            log_info "Updating dependencies..."
            "$SCRIPT_DIR/update-dependencies.sh"
            ;;
        *)
            log_error "Unknown maintenance script: $script_name"
            echo "Available: all, audit, dependencies"
            exit 1
            ;;
    esac
}

# ============================================================================
# SETUP SCRIPTS
# ============================================================================

run_setup_scripts() {
    local script_name=${1:-all}
    
    case "$script_name" in
        all)
            log_info "Running all setup scripts..."
            "$SCRIPT_DIR/setup-monitoring.sh"
            "$SCRIPT_DIR/setup-test-database.sh"
            ;;
        monitoring)
            log_info "Setting up monitoring..."
            "$SCRIPT_DIR/setup-monitoring.sh"
            ;;
        database)
            log_info "Setting up test database..."
            "$SCRIPT_DIR/setup-test-database.sh"
            ;;
        *)
            log_error "Unknown setup script: $script_name"
            echo "Available: all, monitoring, database"
            exit 1
            ;;
    esac
}

# ============================================================================
# RUN ALL SCRIPTS
# ============================================================================

run_all_scripts() {
    log_section "🚀 Running All Scripts in Sequence"
    
    # 1. Setup
    log_info "Step 1: Setup..."
    run_setup_scripts all || log_warning "Some setup scripts failed"
    
    # 2. Verification
    log_info "Step 2: Verification..."
    run_verification_scripts all || log_warning "Some verification failed"
    
    # 3. Testing
    log_info "Step 3: Testing..."
    run_testing_scripts all || log_warning "Some tests failed"
    
    # 4. Diagnostics
    log_info "Step 4: Diagnostics..."
    run_diagnostic_scripts all || log_warning "Some diagnostics failed"
    
    log_success "All scripts execution complete!"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    local category=${1:-}
    local script_name=${2:-}
    shift 2 2>/dev/null || true
    
    if [ -z "$category" ]; then
        show_menu
        exit 0
    fi
    
    case "$category" in
        deployment)
            run_deployment_scripts "$script_name" "$@"
            ;;
        verify|verification)
            run_verification_scripts "$script_name" "$@"
            ;;
        test|testing)
            run_testing_scripts "$script_name" "$@"
            ;;
        diagnostic|diagnostics)
            run_diagnostic_scripts "$script_name" "$@"
            ;;
        maintenance)
            run_maintenance_scripts "$script_name" "$@"
            ;;
        setup)
            run_setup_scripts "$script_name" "$@"
            ;;
        all)
            run_all_scripts
            ;;
        *)
            log_error "Unknown category: $category"
            show_menu
            exit 1
            ;;
    esac
}

main "$@"

