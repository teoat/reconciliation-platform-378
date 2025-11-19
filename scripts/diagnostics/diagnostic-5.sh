#!/bin/bash
# ============================================================================
# DIAGNOSTIC AREA 5: Testing Coverage & Quality
# ============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

RESULTS_FILE="${RESULTS_FILE:-/tmp/diagnostic-5-results.json}"

log_info "Starting Testing Coverage & Quality Analysis..."

echo '{"checks": []}' > "$RESULTS_FILE"

add_check() {
    jq --arg name "$1" --arg status "$2" --arg msg "$3" --arg details "$4" \
        '.checks += [{"name": $name, "status": $status, "message": $msg, "details": $details}]' \
        "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
}

# 1. Backend test coverage
log_info "Checking backend test coverage..."
if [ -f "backend/Cargo.toml" ] && command -v cargo-tarpaulin &> /dev/null; then
    cd backend
    if cargo tarpaulin --out Xml --output-dir /tmp > /tmp/tarpaulin.log 2>&1; then
        COVERAGE=$(grep -oP 'line-rate="\K[0-9.]+' /tmp/cobertura.xml 2>/dev/null | head -1 || echo "0")
        COVERAGE_PCT=$(echo "$COVERAGE * 100" | bc 2>/dev/null | cut -d. -f1 || echo "0")
        if [ "$COVERAGE_PCT" -lt 80 ]; then
            log_warning "Backend coverage: ${COVERAGE_PCT}% (target: 80%)"
            add_check "backend_coverage" "warning" "Coverage: ${COVERAGE_PCT}%" "Target: 80%"
        else
            log_success "Backend coverage: ${COVERAGE_PCT}%"
            add_check "backend_coverage" "success" "Coverage: ${COVERAGE_PCT}%" ""
        fi
    else
        log_info "cargo-tarpaulin not available"
        add_check "backend_coverage" "info" "tarpaulin not installed" ""
    fi
    cd ..
fi

# 2. Frontend test coverage
log_info "Checking frontend test coverage..."
if [ -f "frontend/package.json" ]; then
    cd frontend
    if npm run test:coverage > /tmp/frontend-coverage.log 2>&1; then
        COVERAGE=$(grep -oP 'All files[^|]*\|\s+\K[0-9.]+' coverage/coverage-summary.json 2>/dev/null | head -1 || echo "0")
        if [ "$(echo "$COVERAGE < 80" | bc 2>/dev/null || echo "1")" = "1" ]; then
            log_warning "Frontend coverage: ${COVERAGE}% (target: 80%)"
            add_check "frontend_coverage" "warning" "Coverage: ${COVERAGE}%" "Target: 80%"
        else
            log_success "Frontend coverage: ${COVERAGE}%"
            add_check "frontend_coverage" "success" "Coverage: ${COVERAGE}%" ""
        fi
    else
        log_info "Coverage check not configured"
        add_check "frontend_coverage" "info" "Coverage not configured" ""
    fi
    cd ..
fi

# 3. E2E tests
log_info "Checking E2E tests..."
if [ -d "frontend/e2e" ]; then
    E2E_COUNT=$(find frontend/e2e -name "*.spec.ts" -o -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    log_success "Found $E2E_COUNT E2E test files"
    add_check "e2e_tests" "success" "$E2E_COUNT test files" ""
else
    log_warning "No E2E test directory"
    add_check "e2e_tests" "warning" "No E2E tests" ""
fi

# 4. Unit tests
log_info "Checking unit tests..."
BACKEND_TESTS=$(find backend/src -name "*test*.rs" -o -name "*tests.rs" 2>/dev/null | wc -l | tr -d ' ')
FRONTEND_TESTS=$(find frontend/src -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" 2>/dev/null | wc -l | tr -d ' ')
TOTAL_TESTS=$((BACKEND_TESTS + FRONTEND_TESTS))
log_info "Found $TOTAL_TESTS unit test files (Backend: $BACKEND_TESTS, Frontend: $FRONTEND_TESTS)"
add_check "unit_tests" "success" "$TOTAL_TESTS test files" "Backend: $BACKEND_TESTS, Frontend: $FRONTEND_TESTS"

log_success "Testing Coverage & Quality Analysis complete"
cat "$RESULTS_FILE" | jq '.'

