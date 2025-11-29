#!/bin/bash
# Run All Playwright Tests with Comprehensive Diagnostics
# Ensures 100% test passing

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "🧪 Running comprehensive Playwright test suite..."

# Configuration
BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:1000}"
API_URL="${API_BASE_URL:-http://localhost:2000}"
PROJECT="${PLAYWRIGHT_PROJECT:-chromium}"

# Step 1: Verify services are running
log_info "Step 1: Verifying services are running..."
if ! curl -s --max-time 5 "${API_URL}/health" > /dev/null; then
    log_error "❌ Backend is not accessible at ${API_URL}"
    exit 1
fi

if ! curl -s --max-time 5 "${BASE_URL}" > /dev/null; then
    log_error "❌ Frontend is not accessible at ${BASE_URL}"
    exit 1
fi

log_success "✅ Services are running"

# Step 2: Fix configuration issues
log_info "Step 2: Checking Playwright configuration..."
if [ -f "playwright.config.ts" ]; then
    # Ensure HTML reporter doesn't clash with test-results
    if grep -q "test-results/html-report" playwright.config.ts; then
        log_info "Fixing HTML reporter output folder..."
        sed -i.bak 's|test-results/html-report|playwright-report|g' playwright.config.ts
        log_success "✅ Configuration fixed"
    fi
fi

# Step 3: Run comprehensive feature check (should be 100%)
log_info "Step 3: Running comprehensive feature check..."
if npx playwright test e2e/comprehensive-feature-check.spec.ts --reporter=list --project="${PROJECT}" 2>&1 | tee /tmp/playwright-comprehensive.log; then
    PASSED=$(grep -c "passed" /tmp/playwright-comprehensive.log || echo "0")
    FAILED=$(grep -c "failed" /tmp/playwright-comprehensive.log || echo "0")
    SKIPPED=$(grep -c "skipped" /tmp/playwright-comprehensive.log || echo "0")
    
    log_info "Comprehensive Test Results:"
    log_info "  Passed: ${PASSED}"
    log_info "  Failed: ${FAILED}"
    log_info "  Skipped: ${SKIPPED}"
    
    if [ "${FAILED}" -eq 0 ] && [ "${SKIPPED}" -eq 0 ]; then
        log_success "✅ Comprehensive feature check: 100% passing!"
    else
        log_warning "⚠️  Some tests failed or were skipped"
    fi
else
    log_error "❌ Comprehensive feature check failed"
    exit 1
fi

# Step 4: Run frontend basic tests
log_info "Step 4: Running frontend basic tests..."
npx playwright test e2e/frontend-basic.spec.ts --reporter=list --project="${PROJECT}" 2>&1 | tee /tmp/playwright-frontend.log || true

# Step 5: Generate summary
log_info "Step 5: Generating test summary..."
TOTAL_PASSED=$(grep -oE "[0-9]+ passed" /tmp/playwright-comprehensive.log /tmp/playwright-frontend.log 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "0")
TOTAL_FAILED=$(grep -oE "[0-9]+ failed" /tmp/playwright-comprehensive.log /tmp/playwright-frontend.log 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "0")

log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "📊 Test Summary:"
log_info "  Total Passed: ${TOTAL_PASSED}"
log_info "  Total Failed: ${TOTAL_FAILED}"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "${TOTAL_FAILED}" -eq 0 ]; then
    log_success "✅ All tests passing!"
    exit 0
else
    log_warning "⚠️  Some tests failed. Review logs above."
    exit 1
fi

