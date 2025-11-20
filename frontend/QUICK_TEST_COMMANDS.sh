#!/bin/bash
# Quick Test Commands for Authentication Flow

echo "🔍 Authentication Flow - Quick Test Commands"
echo "=============================================="
echo ""

# Check backend
echo "1. Checking Backend..."
if curl -s http://localhost:2000/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running"
    curl -s http://localhost:2000/api/health | head -c 100
    echo ""
else
    echo "   ❌ Backend is NOT running"
    echo "   → Start with: cd ../backend && cargo run"
fi
echo ""

# Check frontend
echo "2. Checking Frontend..."
if curl -s http://localhost:1000 > /dev/null 2>&1; then
    echo "   ✅ Frontend is running"
else
    echo "   ❌ Frontend is NOT running"
    echo "   → Start with: npm run dev"
fi
echo ""

# Test login endpoint
echo "3. Testing Login Endpoint..."
if curl -s http://localhost:2000/api/health > /dev/null 2>&1; then
    echo "   Testing with demo credentials..."
    RESPONSE=$(curl -s -X POST http://localhost:2000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@example.com","password":"AdminPassword123!"}' \
        -w "\nHTTP_CODE:%{http_code}")
    
    HTTP_CODE=$(echo "$RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | sed 's/HTTP_CODE:.*//')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✅ Login endpoint works (200 OK)"
        echo "   Response: $(echo "$BODY" | head -c 100)..."
    elif [ "$HTTP_CODE" = "401" ]; then
        echo "   ⚠️  Login endpoint works but credentials invalid (401)"
        echo "   → User may not exist, run: npm run seed-demo-users"
    else
        echo "   ❌ Login endpoint returned: $HTTP_CODE"
        echo "   Response: $BODY"
    fi
else
    echo "   ⏭️  Skipping (backend not running)"
fi
echo ""

# Run E2E tests
echo "4. Running E2E Tests..."
echo "   Command: npx playwright test e2e/auth-flow-e2e.spec.ts --reporter=list"
echo "   (Run manually to see full output)"
echo ""

echo "✅ Quick check complete!"
echo ""
echo "Next steps:"
echo "  1. Ensure backend is running: cd ../backend && cargo run"
echo "  2. Ensure frontend is running: npm run dev"
echo "  3. Run E2E tests: npx playwright test e2e/auth-flow-e2e.spec.ts"
echo "  4. Manual test: Open http://localhost:1000/login in browser"

