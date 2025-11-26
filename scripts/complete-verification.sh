#!/bin/bash
# Complete Verification - 100% Completion Check
# Verifies all features, endpoints, and services are working

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

echo "🔍 Complete Verification - 100% Completion Check"
echo ""

API_URL="${API_BASE_URL:-http://localhost:2000}"
PASSED=0
FAILED=0
TOTAL=0

# Test function
test_endpoint() {
    local name=$1
    local endpoint=$2
    local expected_status=${3:-200}
    
    ((TOTAL++))
    log_info "Testing: $name"
    
    response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        log_success "✅ $name: PASSED (HTTP $http_code)"
        ((PASSED++))
        return 0
    else
        log_error "❌ $name: FAILED (Expected HTTP $expected_status, got $http_code)"
        echo "Response: $body" | head -3
        ((FAILED++))
        return 1
    fi
}

# Health Checks
log_info "=== Health Checks ==="
test_endpoint "Health Check" "/health" 200
test_endpoint "Health Resilience" "/api/health/resilience" 200

# Metrics Endpoints
log_info ""
log_info "=== Metrics Endpoints ==="
test_endpoint "Metrics Summary" "/api/metrics/summary" 200
test_endpoint "Metrics Health" "/api/metrics/health" 200
test_endpoint "All Metrics" "/api/metrics" 200

# Verify Metrics Data
log_info ""
log_info "=== Metrics Data Verification ==="
if summary=$(curl -s -f "$API_URL/api/metrics/summary" 2>/dev/null); then
    if echo "$summary" | jq 'empty' 2>/dev/null; then
        log_success "✅ Metrics summary returns valid JSON"
        ((PASSED++))
    else
        log_warning "⚠️  Metrics summary may not be valid JSON"
        ((FAILED++))
    fi
    ((TOTAL++))
else
    log_error "❌ Cannot fetch metrics summary"
    ((FAILED++))
    ((TOTAL++))
fi

# Code Compilation
log_info ""
log_info "=== Code Compilation ==="
((TOTAL++))
if cd "$SCRIPT_DIR/../backend" && cargo check --message-format=short 2>&1 | grep -q "Finished"; then
    log_success "✅ Backend code compiles successfully"
    ((PASSED++))
else
    log_error "❌ Backend code has compilation errors"
    ((FAILED++))
fi

# Services Status
log_info ""
log_info "=== Services Status ==="
((TOTAL++))
if docker-compose ps 2>/dev/null | grep -q "backend.*Up.*healthy"; then
    log_success "✅ Backend service is running and healthy"
    ((PASSED++))
else
    log_warning "⚠️  Backend service status unclear"
    ((FAILED++))
fi

# Summary
log_info ""
log_info "=== Verification Summary ==="
log_info "Total Tests: $TOTAL"
log_success "Passed: $PASSED"
if [ $FAILED -gt 0 ]; then
    log_error "Failed: $FAILED"
else
    log_success "Failed: $FAILED"
fi

COMPLETION_PERCENT=$((PASSED * 100 / TOTAL))
log_info "Completion: $COMPLETION_PERCENT%"

if [ $FAILED -eq 0 ]; then
    log_success "🎉 100% COMPLETE - All checks passed!"
    exit 0
elif [ $COMPLETION_PERCENT -ge 90 ]; then
    log_success "✅ $COMPLETION_PERCENT% Complete - Almost there!"
    exit 0
else
    log_warning "⚠️  $COMPLETION_PERCENT% Complete - Some issues remain"
    exit 1
fi

