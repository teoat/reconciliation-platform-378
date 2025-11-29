#!/bin/bash
# Run Full Test Suite
# Runs all tests (unit, integration, E2E) and generates coverage report

# Source common functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "🧪 Running full test suite..."

# Configuration
COVERAGE_THRESHOLD=80
FAILED_TESTS=0

# Step 1: Backend unit tests
log_info "Step 1: Running backend unit tests..."
cd backend
if cargo test --lib 2>&1 | tee /tmp/backend-unit-tests.log; then
    log_success "✅ Backend unit tests passed"
else
    log_error "❌ Backend unit tests failed"
    ((FAILED_TESTS++))
fi
cd ..

# Step 2: Backend integration tests
log_info "Step 2: Running backend integration tests..."
cd backend
if cargo test --test '*' 2>&1 | tee /tmp/backend-integration-tests.log; then
    log_success "✅ Backend integration tests passed"
else
    log_error "❌ Backend integration tests failed"
    ((FAILED_TESTS++))
fi
cd ..

# Step 3: Frontend unit tests
log_info "Step 3: Running frontend unit tests..."
cd frontend
if npm run test:unit 2>&1 | tee /tmp/frontend-unit-tests.log; then
    log_success "✅ Frontend unit tests passed"
else
    log_error "❌ Frontend unit tests failed"
    ((FAILED_TESTS++))
fi
cd ..

# Step 4: Frontend integration tests
log_info "Step 4: Running frontend integration tests..."
cd frontend
if npm run test:integration 2>&1 | tee /tmp/frontend-integration-tests.log; then
    log_success "✅ Frontend integration tests passed"
else
    log_error "❌ Frontend integration tests failed"
    ((FAILED_TESTS++))
fi
cd ..

# Step 5: E2E tests
log_info "Step 5: Running E2E tests..."
cd frontend
if npm run test:e2e 2>&1 | tee /tmp/e2e-tests.log; then
    log_success "✅ E2E tests passed"
else
    log_error "❌ E2E tests failed"
    ((FAILED_TESTS++))
fi
cd ..

# Step 6: Generate coverage report
log_info "Step 6: Generating coverage report..."

# Backend coverage
log_info "Backend coverage..."
cd backend
if command -v cargo-tarpaulin &> /dev/null; then
    cargo tarpaulin --out Html --output-dir ../coverage/backend 2>&1 | tee /tmp/backend-coverage.log
    BACKEND_COVERAGE=$(grep -oP '\d+\.\d+%' /tmp/backend-coverage.log | head -1 | sed 's/%//')
    if [ -n "$BACKEND_COVERAGE" ]; then
        log_info "Backend coverage: ${BACKEND_COVERAGE}%"
        if (( $(echo "$BACKEND_COVERAGE >= $COVERAGE_THRESHOLD" | bc -l) )); then
            log_success "✅ Backend coverage meets threshold"
        else
            log_warning "⚠️  Backend coverage below threshold (${BACKEND_COVERAGE}% < ${COVERAGE_THRESHOLD}%)"
        fi
    fi
else
    log_warning "⚠️  cargo-tarpaulin not installed, skipping backend coverage"
fi
cd ..

# Frontend coverage
log_info "Frontend coverage..."
cd frontend
if npm run test:coverage 2>&1 | tee /tmp/frontend-coverage.log; then
    FRONTEND_COVERAGE=$(grep -oP '\d+\.\d+%' /tmp/frontend-coverage.log | head -1 | sed 's/%//')
    if [ -n "$FRONTEND_COVERAGE" ]; then
        log_info "Frontend coverage: ${FRONTEND_COVERAGE}%"
        if (( $(echo "$FRONTEND_COVERAGE >= $COVERAGE_THRESHOLD" | bc -l) )); then
            log_success "✅ Frontend coverage meets threshold"
        else
            log_warning "⚠️  Frontend coverage below threshold (${FRONTEND_COVERAGE}% < ${COVERAGE_THRESHOLD}%)"
        fi
    fi
else
    log_warning "⚠️  Frontend coverage generation failed"
fi
cd ..

# Summary
log_info "📊 Test Suite Summary:"
if [ $FAILED_TESTS -eq 0 ]; then
    log_success "✅ All tests passed"
    exit 0
else
    log_error "❌ $FAILED_TESTS test suite(s) failed"
    exit 1
fi

