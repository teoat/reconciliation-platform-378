#!/bin/bash
# Authentication Flow Testing Script
# Tests signup, login, and OAuth flows

set -e

BASE_URL="${BASE_URL:-http://localhost:2000}"
API_URL="${BASE_URL}/api/v1/auth"

echo "🧪 Authentication Flow Testing"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Test 1: Check backend is running
echo "1. Checking backend availability..."
if curl -s -f "${BASE_URL}/health" > /dev/null 2>&1 || curl -s -f "${BASE_URL}/api/health" > /dev/null 2>&1; then
    test_result 0 "Backend is running"
else
    test_result 1 "Backend is not running - start with: cd backend && cargo run"
    echo ""
    echo "⚠️  Backend not available. Please start the backend server first:"
    echo "   cd backend && cargo run"
    exit 1
fi

# Test 2: Test signup endpoint
echo ""
echo "2. Testing signup endpoint..."
TEST_EMAIL="test_$(date +%s)@example.com"
SIGNUP_RESPONSE=$(curl -s -X POST "${API_URL}/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"${TEST_EMAIL}\",
        \"password\": \"Test123!@#\",
        \"first_name\": \"Test\",
        \"last_name\": \"User\"
    }" 2>&1)

if echo "$SIGNUP_RESPONSE" | grep -q "token\|user"; then
    test_result 0 "Signup successful"
    TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")
    if [ -n "$TOKEN" ]; then
        echo "   Token received: ${TOKEN:0:20}..."
    fi
else
    test_result 1 "Signup failed: $SIGNUP_RESPONSE"
fi

# Test 3: Test login endpoint
echo ""
echo "3. Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"${TEST_EMAIL}\",
        \"password\": \"Test123!@#\"
    }" 2>&1)

if echo "$LOGIN_RESPONSE" | grep -q "token\|user"; then
    test_result 0 "Login successful"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")
    if [ -n "$TOKEN" ]; then
        echo "   Token received: ${TOKEN:0:20}..."
    fi
else
    test_result 1 "Login failed: $LOGIN_RESPONSE"
fi

# Test 4: Test protected endpoint
if [ -n "$TOKEN" ]; then
    echo ""
    echo "4. Testing protected endpoint..."
    ME_RESPONSE=$(curl -s -X GET "${API_URL}/me" \
        -H "Authorization: Bearer ${TOKEN}" 2>&1)
    
    if echo "$ME_RESPONSE" | grep -q "email\|user"; then
        test_result 0 "Protected endpoint accessible"
    else
        test_result 1 "Protected endpoint failed: $ME_RESPONSE"
    fi
fi

# Test 5: Database verification
echo ""
echo "5. Verifying database state..."
if command -v psql &> /dev/null; then
    cd backend
    source .env 2>/dev/null || true
    
    DB_CHECK=$(PGPASSWORD="${DATABASE_URL##*:}" psql "$DATABASE_URL" -t -c "
        SELECT 
            CASE WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'auth_provider'
            ) THEN 'YES' ELSE 'NO' END,
            (SELECT COUNT(*) FROM users WHERE email = '${TEST_EMAIL}'),
            (SELECT auth_provider FROM users WHERE email = '${TEST_EMAIL}' LIMIT 1),
            (SELECT email_verified FROM users WHERE email = '${TEST_EMAIL}' LIMIT 1)
    " 2>&1 | tr -d ' ')
    
    if echo "$DB_CHECK" | grep -q "YES"; then
        test_result 0 "Database migration applied (auth_provider column exists)"
        if echo "$DB_CHECK" | grep -q "password"; then
            test_result 0 "User has correct auth_provider (password)"
        else
            test_result 1 "User auth_provider incorrect"
        fi
    else
        test_result 1 "Database migration not applied"
    fi
else
    echo -e "${YELLOW}⚠️  psql not available - skipping database verification${NC}"
fi

# Summary
echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"
    exit 1
else
    echo -e "${GREEN}Failed: ${TESTS_FAILED}${NC}"
    exit 0
fi

