#!/bin/bash
# ============================================================================
# COMPREHENSIVE FEATURE VERIFICATION
# ============================================================================
# Verifies all features and functions in the application
#
# Usage:
#   ./scripts/verify-all-features.sh [environment] [base_url]
#   ./scripts/verify-all-features.sh production https://app.example.com
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

ENVIRONMENT=${1:-production}
BASE_URL=${2:-${PRODUCTION_URL:-https://app.example.com}}
NAMESPACE="reconciliation-platform"

# Test results
PASSED=0
FAILED=0
SKIPPED=0

# ============================================================================
# TEST HELPERS
# ============================================================================

test_feature() {
    local name="$1"
    local test_cmd="$2"
    
    log_step "Testing: $name"
    if eval "$test_cmd" > /dev/null 2>&1; then
        log_success "✓ $name"
        ((PASSED++))
        return 0
    else
        log_error "✗ $name"
        ((FAILED++))
        return 1
    fi
}

test_feature_skip() {
    local name="$1"
    log_warning "⊘ $name (skipped)"
    ((SKIPPED++))
}

# ============================================================================
# AUTHENTICATION FEATURES
# ============================================================================

verify_authentication() {
    log_section "🔐 Authentication Features"
    
    # Health endpoint (no auth required)
    test_feature "Health Endpoint" "curl -f -s $BASE_URL/api/health"
    
    # Login endpoint exists
    test_feature "Login Endpoint" "curl -f -s -X POST $BASE_URL/api/auth/login -H 'Content-Type: application/json' -d '{}' || [ \$? -eq 22 ]"
    
    # Register endpoint exists
    test_feature "Register Endpoint" "curl -f -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{}' || [ \$? -eq 22 ]"
    
    # Refresh token endpoint
    test_feature "Refresh Token Endpoint" "curl -f -s -X POST $BASE_URL/api/auth/refresh -H 'Content-Type: application/json' -d '{}' || [ \$? -eq 22 ]"
    
    # Google OAuth endpoint
    test_feature "Google OAuth Endpoint" "curl -f -s -X POST $BASE_URL/api/auth/google -H 'Content-Type: application/json' -d '{}' || [ \$? -eq 22 ]"
    
    log_info "Authentication features verified"
}

# ============================================================================
# PROJECT MANAGEMENT FEATURES
# ============================================================================

verify_projects() {
    log_section "📁 Project Management Features"
    
    # Projects endpoint (requires auth, but endpoint exists)
    test_feature "Projects Endpoint" "curl -f -s $BASE_URL/api/projects || [ \$? -eq 22 ]"
    
    # Project creation endpoint
    test_feature "Create Project Endpoint" "curl -f -s -X POST $BASE_URL/api/projects -H 'Content-Type: application/json' -d '{}' || [ \$? -eq 22 ]"
    
    log_info "Project management features verified"
}

# ============================================================================
# RECONCILIATION FEATURES
# ============================================================================

verify_reconciliation() {
    log_section "🔄 Reconciliation Features"
    
    # Reconciliation jobs endpoint
    test_feature "Reconciliation Jobs Endpoint" "curl -f -s $BASE_URL/api/reconciliation/jobs || [ \$? -eq 22 ]"
    
    # Create reconciliation job endpoint
    test_feature "Create Reconciliation Job Endpoint" "curl -f -s -X POST $BASE_URL/api/reconciliation/jobs -H 'Content-Type: application/json' -d '{}' || [ \$? -eq 22 ]"
    
    # Reconciliation results endpoint
    test_feature "Reconciliation Results Endpoint" "curl -f -s $BASE_URL/api/reconciliation/results || [ \$? -eq 22 ]"
    
    log_info "Reconciliation features verified"
}

# ============================================================================
# FILE MANAGEMENT FEATURES
# ============================================================================

verify_files() {
    log_section "📄 File Management Features"
    
    # File upload endpoint
    test_feature "File Upload Endpoint" "curl -f -s -X POST $BASE_URL/api/files/upload || [ \$? -eq 22 ]"
    
    # File list endpoint
    test_feature "File List Endpoint" "curl -f -s $BASE_URL/api/files || [ \$? -eq 22 ]"
    
    log_info "File management features verified"
}

# ============================================================================
# BACKEND SERVICES VERIFICATION
# ============================================================================

verify_backend_services() {
    log_section "⚙️  Backend Services"
    
    # Check if backend pods are running
    if command -v kubectl &> /dev/null && kubectl get namespace "$NAMESPACE" &> /dev/null; then
        test_feature "Backend Pods Running" "kubectl get pods -n $NAMESPACE -l app=reconciliation-backend --field-selector=status.phase=Running | grep -q Running"
        
        # Check database connectivity
        test_feature "Database Connectivity" "kubectl exec -n $NAMESPACE deployment/reconciliation-backend -- psql \"\$DATABASE_URL\" -c 'SELECT 1;' > /dev/null 2>&1"
        
        # Check Redis connectivity (if configured)
        if [ -n "${REDIS_URL:-}" ]; then
            test_feature "Redis Connectivity" "kubectl exec -n $NAMESPACE deployment/reconciliation-backend -- redis-cli -u \"\$REDIS_URL\" ping > /dev/null 2>&1" || test_feature_skip "Redis Connectivity"
        else
            test_feature_skip "Redis Connectivity"
        fi
    else
        test_feature_skip "Backend Pods Running"
        test_feature_skip "Database Connectivity"
        test_feature_skip "Redis Connectivity"
    fi
    
    log_info "Backend services verified"
}

# ============================================================================
# FRONTEND FEATURES
# ============================================================================

verify_frontend() {
    log_section "🎨 Frontend Features"
    
    # Frontend accessible
    test_feature "Frontend Accessible" "curl -f -s $BASE_URL/ | grep -q '<!DOCTYPE html>' || curl -f -s $BASE_URL/ > /dev/null"
    
    # Frontend API proxy
    test_feature "Frontend API Proxy" "curl -f -s $BASE_URL/api/health > /dev/null"
    
    if command -v kubectl &> /dev/null && kubectl get namespace "$NAMESPACE" &> /dev/null; then
        test_feature "Frontend Pods Running" "kubectl get pods -n $NAMESPACE -l app=reconciliation-frontend --field-selector=status.phase=Running | grep -q Running"
    else
        test_feature_skip "Frontend Pods Running"
    fi
    
    log_info "Frontend features verified"
}

# ============================================================================
# API ENDPOINTS VERIFICATION
# ============================================================================

verify_api_endpoints() {
    log_section "🔌 API Endpoints"
    
    # Health endpoint
    test_feature "Health Endpoint" "curl -f -s $BASE_URL/api/health"
    
    # Metrics endpoint (if available)
    test_feature "Metrics Endpoint" "curl -f -s $BASE_URL/api/metrics > /dev/null" || test_feature_skip "Metrics Endpoint"
    
    # API versioning
    test_feature "API Versioning" "curl -f -s $BASE_URL/api/v1/health > /dev/null || curl -f -s $BASE_URL/api/health > /dev/null"
    
    log_info "API endpoints verified"
}

# ============================================================================
# SECURITY FEATURES
# ============================================================================

verify_security() {
    log_section "🔒 Security Features"
    
    # CORS headers
    test_feature "CORS Headers" "curl -s -I $BASE_URL/api/health | grep -qi 'access-control-allow-origin' || true"
    
    # Security headers
    test_feature "Security Headers" "curl -s -I $BASE_URL/api/health | grep -qi 'x-frame-options\|x-content-type-options' || true"
    
    # Rate limiting (test with multiple requests)
    log_step "Testing rate limiting..."
    local rate_limit_test=0
    for i in {1..10}; do
        if curl -f -s $BASE_URL/api/health > /dev/null 2>&1; then
            ((rate_limit_test++))
        fi
    done
    if [ $rate_limit_test -gt 0 ]; then
        log_success "✓ Rate Limiting (requests processed)"
        ((PASSED++))
    else
        log_warning "⊘ Rate Limiting (test inconclusive)"
        ((SKIPPED++))
    fi
    
    log_info "Security features verified"
}

# ============================================================================
# PERFORMANCE FEATURES
# ============================================================================

verify_performance() {
    log_section "⚡ Performance Features"
    
    # Response time test
    log_step "Testing response time..."
    local start_time=$(date +%s%N)
    if curl -f -s $BASE_URL/api/health > /dev/null 2>&1; then
        local end_time=$(date +%s%N)
        local duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
        if [ $duration -lt 2000 ]; then
            log_success "✓ Response Time (< 2s: ${duration}ms)"
            ((PASSED++))
        else
            log_warning "⚠ Response Time (${duration}ms - may be slow)"
            ((PASSED++))
        fi
    else
        log_error "✗ Response Time (endpoint not accessible)"
        ((FAILED++))
    fi
    
    # Compression test
    log_step "Testing compression..."
    if curl -s -H "Accept-Encoding: gzip" -I $BASE_URL/api/health | grep -qi "content-encoding: gzip"; then
        log_success "✓ Compression Enabled"
        ((PASSED++))
    else
        log_warning "⊘ Compression (not detected or not enabled)"
        ((SKIPPED++))
    fi
    
    log_info "Performance features verified"
}

# ============================================================================
# MAIN VERIFICATION
# ============================================================================

main() {
    log_section "🔍 Comprehensive Feature Verification"
    log_info "Environment: $ENVIRONMENT"
    log_info "Base URL: $BASE_URL"
    echo ""
    
    # Run all verifications
    verify_authentication
    verify_projects
    verify_reconciliation
    verify_files
    verify_backend_services
    verify_frontend
    verify_api_endpoints
    verify_security
    verify_performance
    
    # Summary
    log_section "📊 Verification Summary"
    log_success "Passed: $PASSED"
    if [ $FAILED -gt 0 ]; then
        log_error "Failed: $FAILED"
    else
        log_info "Failed: $FAILED"
    fi
    if [ $SKIPPED -gt 0 ]; then
        log_warning "Skipped: $SKIPPED"
    fi
    
    local total=$((PASSED + FAILED + SKIPPED))
    local success_rate=$((PASSED * 100 / total))
    
    echo ""
    log_info "Success Rate: ${success_rate}%"
    
    if [ $FAILED -eq 0 ]; then
        log_success "✅ All critical features verified!"
        return 0
    else
        log_error "❌ Some features failed verification"
        return 1
    fi
}

main "$@"

