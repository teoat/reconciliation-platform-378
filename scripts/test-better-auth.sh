#!/bin/bash
# Automated Better Auth Integration Tests
# Tests all authentication flows end-to-end

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Configuration
AUTH_SERVER_URL="${AUTH_SERVER_URL:-http://localhost:4000}"
BACKEND_URL="${BACKEND_URL:-http://localhost:2000}"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="SecurePass123!"

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_condition="$3"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo ""
    echo "======================================"
    echo "Test $TESTS_TOTAL: $test_name"
    echo "======================================"
    
    # Run test
    RESPONSE=$(eval "$test_command" 2>&1)
    EXIT_CODE=$?
    
    # Check result
    if eval "$expected_condition"; then
        log_success "✅ PASS: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        log_error "❌ FAIL: $test_name"
        echo "Response: $RESPONSE"
        echo "Exit Code: $EXIT_CODE"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Start tests
log_info "Starting Better Auth Integration Tests..."
log_info "Auth Server: $AUTH_SERVER_URL"
log_info "Backend: $BACKEND_URL"
log_info "Test User: $TEST_EMAIL"
echo ""

# Test 1: Health Check
run_test "Health Check" \
    "curl -s -w '\n%{http_code}' $AUTH_SERVER_URL/health" \
    "echo \"\$RESPONSE\" | grep -q '200' && echo \"\$RESPONSE\" | grep -q '\"status\":\"ok\"'"

# Test 2: User Registration
run_test "User Registration" \
    "curl -s -w '\n%{http_code}' -X POST $AUTH_SERVER_URL/api/auth/register \
        -H 'Content-Type: application/json' \
        -d '{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"first_name\":\"Test\",\"last_name\":\"User\"}'" \
    "echo \"\$RESPONSE\" | grep -q '200' && echo \"\$RESPONSE\" | grep -q '\"token\"'"

# Extract token from registration
TOKEN=$(curl -s -X POST $AUTH_SERVER_URL/api/auth/register \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"test2-$(date +%s)@example.com\",\"password\":\"$TEST_PASSWORD\",\"first_name\":\"Test\",\"last_name\":\"User\"}" \
    | jq -r '.token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    log_warning "Could not extract token from registration, using test token"
    TOKEN="test-token"
fi

# Test 3: User Login
run_test "User Login" \
    "curl -s -w '\n%{http_code}' -X POST $AUTH_SERVER_URL/api/auth/login \
        -H 'Content-Type: application/json' \
        -d '{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}'" \
    "echo \"\$RESPONSE\" | grep -q '200' && echo \"\$RESPONSE\" | grep -q '\"token\"'"

# Test 4: Invalid Credentials
run_test "Invalid Credentials" \
    "curl -s -w '\n%{http_code}' -X POST $AUTH_SERVER_URL/api/auth/login \
        -H 'Content-Type: application/json' \
        -d '{\"email\":\"$TEST_EMAIL\",\"password\":\"WrongPassword\"}'" \
    "echo \"\$RESPONSE\" | grep -q '401'"

# Test 5: Weak Password Rejection
run_test "Weak Password Rejection" \
    "curl -s -w '\n%{http_code}' -X POST $AUTH_SERVER_URL/api/auth/register \
        -H 'Content-Type: application/json' \
        -d '{\"email\":\"weak@example.com\",\"password\":\"weak\",\"first_name\":\"Test\",\"last_name\":\"User\"}'" \
    "echo \"\$RESPONSE\" | grep -q '400' || echo \"\$RESPONSE\" | grep -q 'Password'"

# Test 6: Get Current User (if token is valid)
if [ "$TOKEN" != "test-token" ]; then
    run_test "Get Current User" \
        "curl -s -w '\n%{http_code}' -H 'Authorization: Bearer $TOKEN' \
            $AUTH_SERVER_URL/api/auth/me" \
        "echo \"\$RESPONSE\" | grep -q '200' && echo \"\$RESPONSE\" | grep -q '\"email\"'"
    
    # Test 7: Token Refresh
    run_test "Token Refresh" \
        "curl -s -w '\n%{http_code}' -X POST $AUTH_SERVER_URL/api/auth/refresh \
            -H 'Authorization: Bearer $TOKEN'" \
        "echo \"\$RESPONSE\" | grep -q '200' && echo \"\$RESPONSE\" | grep -q '\"token\"'"
    
    # Test 8: Logout
    run_test "Logout" \
        "curl -s -w '\n%{http_code}' -X POST $AUTH_SERVER_URL/api/auth/logout \
            -H 'Authorization: Bearer $TOKEN'" \
        "echo \"\$RESPONSE\" | grep -q '200'"
fi

# Test 9: SQL Injection Prevention
run_test "SQL Injection Prevention" \
    "curl -s -w '\n%{http_code}' -X POST $AUTH_SERVER_URL/api/auth/login \
        -H 'Content-Type: application/json' \
        -d '{\"email\":\"admin@example.com; DROP TABLE users; --\",\"password\":\"anything\"}'" \
    "echo \"\$RESPONSE\" | grep -q '401' || echo \"\$RESPONSE\" | grep -q '400'"

# Test 10: Backend Health (if backend is running)
if curl -s -f "$BACKEND_URL/health" > /dev/null 2>&1; then
    run_test "Backend Health Check" \
        "curl -s -w '\n%{http_code}' $BACKEND_URL/health" \
        "echo \"\$RESPONSE\" | grep -q '200'"
else
    log_warning "Backend not running, skipping backend tests"
fi

# Summary
echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
log_info "Total Tests: $TESTS_TOTAL"
log_success "Passed: $TESTS_PASSED"
if [ $TESTS_FAILED -gt 0 ]; then
    log_error "Failed: $TESTS_FAILED"
else
    log_success "Failed: $TESTS_FAILED"
fi

# Calculate percentage
if [ $TESTS_TOTAL -gt 0 ]; then
    PASS_RATE=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    echo "Pass Rate: $PASS_RATE%"
fi

# Exit code
if [ $TESTS_FAILED -eq 0 ]; then
    log_success "🎉 All tests passed!"
    exit 0
else
    log_error "❌ Some tests failed"
    exit 1
fi

