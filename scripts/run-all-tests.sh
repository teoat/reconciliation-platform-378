#!/bin/bash
# Comprehensive Test Runner with Timeouts
# Prevents tests from hanging indefinitely

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Timeout settings (in seconds)
BACKEND_UNIT_TIMEOUT=180
BACKEND_INTEGRATION_TIMEOUT=300
FRONTEND_UNIT_TIMEOUT=120
FRONTEND_E2E_TIMEOUT=600

# Test results
BACKEND_UNIT_RESULT=0
BACKEND_INTEGRATION_RESULT=0
FRONTEND_UNIT_RESULT=0
FRONTEND_E2E_RESULT=0

echo "🧪 Running All Tests with Timeouts"
echo "===================================="
echo ""

# Function to run command with timeout
run_with_timeout() {
    local timeout=$1
    local description=$2
    shift 2
    local cmd="$@"
    
    echo -e "${BLUE}[TEST]${NC} $description (timeout: ${timeout}s)"
    
    # Use gtimeout on macOS, timeout on Linux
    if command -v gtimeout >/dev/null 2>&1; then
        gtimeout $timeout $cmd || return $?
    elif command -v timeout >/dev/null 2>&1; then
        timeout $timeout $cmd || return $?
    else
        # Fallback: run without timeout but with background process monitoring
        echo -e "${YELLOW}[WARN]${NC} No timeout command found, running without timeout"
        $cmd || return $?
    fi
}

# Function to check test results
check_test_result() {
    local result=$1
    local test_name=$2
    
    if [ $result -eq 0 ]; then
        echo -e "${GREEN}✅ $test_name: PASSED${NC}"
        return 0
    elif [ $result -eq 124 ]; then
        echo -e "${RED}⏱️  $test_name: TIMEOUT${NC}"
        return 1
    else
        echo -e "${RED}❌ $test_name: FAILED${NC}"
        return 1
    fi
}

# Create reports directory
mkdir -p reports

# 1. Backend Unit Tests
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. Backend Unit Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd backend
if run_with_timeout $BACKEND_UNIT_TIMEOUT "Backend Unit Tests" cargo test --lib -- --test-threads=1 2>&1 | tee ../reports/backend-unit.log | tail -20; then
    BACKEND_UNIT_RESULT=0
else
    BACKEND_UNIT_RESULT=$?
fi
check_test_result $BACKEND_UNIT_RESULT "Backend Unit Tests"
cd ..

# 2. Backend Integration Tests (quick check only)
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. Backend Integration Tests (Quick)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd backend
if run_with_timeout $BACKEND_INTEGRATION_TIMEOUT "Backend Integration Tests" cargo test --test '*' -- --test-threads=1 --skip slow 2>&1 | tee ../reports/backend-integration.log | tail -20; then
    BACKEND_INTEGRATION_RESULT=0
else
    BACKEND_INTEGRATION_RESULT=$?
fi
check_test_result $BACKEND_INTEGRATION_RESULT "Backend Integration Tests"
cd ..

# 3. Frontend Unit Tests
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. Frontend Unit Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd frontend
if [ -f "package.json" ]; then
    if run_with_timeout $FRONTEND_UNIT_TIMEOUT "Frontend Unit Tests" npm test -- --run --reporter=verbose 2>&1 | tee ../reports/frontend-unit.log | tail -30; then
        FRONTEND_UNIT_RESULT=0
    else
        FRONTEND_UNIT_RESULT=$?
    fi
    check_test_result $FRONTEND_UNIT_RESULT "Frontend Unit Tests"
else
    echo -e "${YELLOW}⚠️  Frontend package.json not found, skipping${NC}"
    FRONTEND_UNIT_RESULT=0
fi
cd ..

# 4. Frontend E2E Tests (optional, can be skipped if taking too long)
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4. Frontend E2E Tests (Optional)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "${SKIP_E2E:-false}" != "true" ]; then
    cd frontend
    if [ -f "package.json" ] && grep -q "playwright" package.json; then
        echo -e "${YELLOW}[INFO]${NC} E2E tests can take a while, use SKIP_E2E=true to skip"
        if run_with_timeout $FRONTEND_E2E_TIMEOUT "Frontend E2E Tests" npm run test:e2e 2>&1 | tee ../reports/frontend-e2e.log | tail -30; then
            FRONTEND_E2E_RESULT=0
        else
            FRONTEND_E2E_RESULT=$?
        fi
        check_test_result $FRONTEND_E2E_RESULT "Frontend E2E Tests"
    else
        echo -e "${YELLOW}⚠️  Playwright not configured, skipping E2E tests${NC}"
        FRONTEND_E2E_RESULT=0
    fi
    cd ..
else
    echo -e "${YELLOW}⏭️  E2E tests skipped (SKIP_E2E=true)${NC}"
    FRONTEND_E2E_RESULT=0
fi

# Summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

check_test_result $BACKEND_UNIT_RESULT "Backend Unit Tests"
check_test_result $BACKEND_INTEGRATION_RESULT "Backend Integration Tests"
check_test_result $FRONTEND_UNIT_RESULT "Frontend Unit Tests"
check_test_result $FRONTEND_E2E_RESULT "Frontend E2E Tests"

echo ""
TOTAL_FAILED=$((BACKEND_UNIT_RESULT + BACKEND_INTEGRATION_RESULT + FRONTEND_UNIT_RESULT + FRONTEND_E2E_RESULT))

if [ $TOTAL_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed or timed out${NC}"
    echo -e "${YELLOW}📄 Check reports/ directory for detailed logs${NC}"
    exit 1
fi








