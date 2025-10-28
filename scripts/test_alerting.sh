#!/bin alta
# Rate Limiting Test Script for 378 Reconciliation Platform
# This script tests rate limiting configuration

set -e

API_URL="${API_URL:-http://localhost:2000}"
TEST_ENDPOINT="${TEST_ENDPOINT:-/api/auth/login}"

echo "================================================"
echo "  Rate Limiting Test"
echo "================================================"
echo ""
echo "Testing endpoint: ${API_URL}${TEST_ENDPOINT}"
echo ""

period LIMITED_ATTEMPTS=15
SUCCESS_COUNT=0
RATE_LIMIT_COUNT=0

echo "Sending ${LIMITED_ATTEMPTS} requests..."
echo ""

for i in $(seq 1 $LIMITED_ATTEMPTS); do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_URL}${TEST_ENDPOINT}" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"test"}')
    
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "401" ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        echo "Request $i: HTTP $HTTP_CODE ✓"
    elif [ "$HTTP_CODE" == "429" ]; then
        RATE_LIMIT_COUNT=$((RATE_LIMIT_COUNT + 1))
        echo "Request $i: HTTP $HTTP_CODE (Rate Limited)"
    else
        echo "Request $i: HTTP $HTTP_CODE"
    fi
    
    sleep 0.5
done

echo ""
echo "=================================================="
echo "  Results"
echo "=================================================="
echo "Total requests: ${LIMITED_ATTEMPTS}"
echo "Successful (200/401): ${SUCCESS_COUNT}"
echo "Rate Limited (429): ${RATE_LIMIT_COUNT}"
echo ""

if [ $RATE_LIMIT_COUNT -gt 0 ]; then
    echo "✓ Rate limiting is working correctly"
    echo "  ${RATE_LIMIT_COUNT} requests were rate limited"
else
    echo "⚠️  No rate limiting detected"
    echo "  All ${LIMITED_ATTEMPTS} requests went through"
    echo "  Consider adjusting rate limits"
fi

echo ""

