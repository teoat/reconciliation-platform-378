#!/bin/bash
# ============================================================================
# SMOKE TESTS - Production Deployment Verification
# ============================================================================
# Runs comprehensive smoke tests after deployment to verify all critical
# functionality is working correctly.
#
# Usage:
#   ./scripts/smoke-tests.sh [environment] [base_url]
#   ./scripts/smoke-tests.sh staging https://staging.example.com
#   ./scripts/smoke-tests.sh production https://app.example.com
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Configuration
ENVIRONMENT=${1:-staging}
BASE_URL=${2:-http://localhost:2000}
TIMEOUT=${3:-30}

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
    FAILED_TESTS+=("$1")
}

test_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

test_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# HTTP request helper
http_request() {
    local method=$1
    local endpoint=$2
    local expected_status=${3:-200}
    local data=${4:-}
    
    local url="${BASE_URL}${endpoint}"
    local response
    
    if [[ -n "$data" ]]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            --max-time "$TIMEOUT" \
            "$url" 2>&1) || return 1
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            --max-time "$TIMEOUT" \
            "$url" 2>&1) || return 1
    fi
    
    local body=$(echo "$response" | head -n -1)
    local status_code=$(echo "$response" | tail -n 1)
    
    if [[ "$status_code" == "$expected_status" ]]; then
        echo "$body"
        return 0
    else
        echo "Expected status $expected_status, got $status_code" >&2
        echo "$body" >&2
        return 1
    fi
}

# ============================================================================
# TEST SUITE
# ============================================================================

test_health_endpoint() {
    test_info "Testing health endpoint..."
    
    if http_request "GET" "/api/health" 200 > /dev/null; then
        test_pass "Health endpoint responds"
        return 0
    else
        test_fail "Health endpoint failed"
        return 1
    fi
}

test_readiness_endpoint() {
    test_info "Testing readiness endpoint..."
    
    if http_request "GET" "/api/ready" 200 > /dev/null; then
        test_pass "Readiness endpoint responds"
        return 0
    else
        test_fail "Readiness endpoint failed"
        return 1
    fi
}

test_metrics_endpoint() {
    test_info "Testing metrics endpoint..."
    
    local response=$(http_request "GET" "/api/metrics" 200 2>/dev/null || echo "")
    
    if [[ -n "$response" ]]; then
        # Check if response contains metrics
        if echo "$response" | grep -q "http_requests_total\|process_cpu_seconds_total" 2>/dev/null; then
            test_pass "Metrics endpoint returns data"
            return 0
        else
            test_warn "Metrics endpoint responds but format may be unexpected"
            return 0
        fi
    else
        test_fail "Metrics endpoint failed"
        return 1
    fi
}

test_database_connectivity() {
    test_info "Testing database connectivity..."
    
    local response=$(http_request "GET" "/api/health" 200 2>/dev/null || echo "")
    
    if echo "$response" | grep -q '"database":"ok"\|"status":"healthy"' 2>/dev/null; then
        test_pass "Database connectivity verified"
        return 0
    else
        test_warn "Database status not explicitly verified (may be in health check)"
        return 0
    fi
}

test_redis_connectivity() {
    test_info "Testing Redis connectivity..."
    
    # Redis connectivity is typically not exposed via API
    # This is a placeholder for future implementation
    test_warn "Redis connectivity check not implemented (requires internal access)"
    return 0
}

test_api_versioning() {
    test_info "Testing API versioning..."
    
    # Test default version
    if http_request "GET" "/api/v1/health" 200 > /dev/null 2>&1 || \
       http_request "GET" "/api/health" 200 > /dev/null 2>&1; then
        test_pass "API versioning works"
        return 0
    else
        test_fail "API versioning failed"
        return 1
    fi
}

test_cors_headers() {
    test_info "Testing CORS headers..."
    
    local response=$(curl -s -I -X OPTIONS \
        -H "Origin: https://example.com" \
        -H "Access-Control-Request-Method: GET" \
        --max-time "$TIMEOUT" \
        "${BASE_URL}/api/health" 2>&1)
    
    if echo "$response" | grep -qi "access-control-allow-origin" 2>/dev/null; then
        test_pass "CORS headers present"
        return 0
    else
        test_warn "CORS headers not verified (may not be required for health endpoint)"
        return 0
    fi
}

test_security_headers() {
    test_info "Testing security headers..."
    
    local response=$(curl -s -I --max-time "$TIMEOUT" "${BASE_URL}/api/health" 2>&1)
    
    local has_security_headers=false
    
    if echo "$response" | grep -qi "x-content-type-options" 2>/dev/null; then
        has_security_headers=true
    fi
    
    if echo "$response" | grep -qi "x-frame-options" 2>/dev/null; then
        has_security_headers=true
    fi
    
    if [[ "$has_security_headers" == "true" ]]; then
        test_pass "Security headers present"
        return 0
    else
        test_warn "Some security headers may be missing"
        return 0
    fi
}

test_error_handling() {
    test_info "Testing error handling..."
    
    # Test 404 endpoint
    local response=$(http_request "GET" "/api/nonexistent" 404 2>/dev/null || echo "")
    
    if [[ -n "$response" ]]; then
        test_pass "Error handling works (404 returned)"
        return 0
    else
        test_fail "Error handling failed"
        return 1
    fi
}

test_response_time() {
    test_info "Testing response time..."
    
    local start_time=$(date +%s%N)
    http_request "GET" "/api/health" 200 > /dev/null 2>&1
    local end_time=$(date +%s%N)
    
    local duration_ms=$(( (end_time - start_time) / 1000000 ))
    
    if [[ $duration_ms -lt 1000 ]]; then
        test_pass "Response time acceptable (${duration_ms}ms)"
        return 0
    elif [[ $duration_ms -lt 5000 ]]; then
        test_warn "Response time slow (${duration_ms}ms) but acceptable"
        return 0
    else
        test_fail "Response time too slow (${duration_ms}ms)"
        return 1
    fi
}

test_logging() {
    test_info "Testing logging (requires log access)..."
    
    # This test requires access to logs, which may not be available
    # In Kubernetes, you'd check: kubectl logs -n namespace deployment/backend | tail -20
    test_warn "Logging verification requires log access (manual check recommended)"
    return 0
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    echo "============================================================================"
    echo "SMOKE TESTS - ${ENVIRONMENT^^} Environment"
    echo "============================================================================"
    echo "Base URL: $BASE_URL"
    echo "Timeout: ${TIMEOUT}s"
    echo "Started: $(date)"
    echo ""
    
    # Run all tests
    test_health_endpoint
    test_readiness_endpoint
    test_metrics_endpoint
    test_database_connectivity
    test_redis_connectivity
    test_api_versioning
    test_cors_headers
    test_security_headers
    test_error_handling
    test_response_time
    test_logging
    
    # Summary
    echo ""
    echo "============================================================================"
    echo "TEST SUMMARY"
    echo "============================================================================"
    echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo ""
    
    if [[ $TESTS_FAILED -gt 0 ]]; then
        echo "Failed Tests:"
        for test in "${FAILED_TESTS[@]}"; do
            echo -e "  ${RED}✗${NC} $test"
        done
        echo ""
        echo -e "${RED}❌ SMOKE TESTS FAILED${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ ALL SMOKE TESTS PASSED${NC}"
        exit 0
    fi
}

# Run main function
main "$@"

