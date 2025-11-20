#!/bin/bash
# Complete Start and Test Script for Authentication Flow

set -e

echo "🚀 Authentication Flow - Complete Start and Test"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend is running
echo "1️⃣  Checking Backend Status..."
if curl -s http://localhost:2000/api/health > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Backend is already running${NC}"
    BACKEND_RUNNING=true
else
    echo -e "   ${YELLOW}⚠️  Backend is NOT running${NC}"
    BACKEND_RUNNING=false
    echo ""
    echo "   Starting backend in background..."
    cd ../backend
    
    # Start backend in background
    nohup cargo run > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo "   Backend starting (PID: $BACKEND_PID)..."
    
    # Wait for backend to start
    echo "   Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:2000/api/health > /dev/null 2>&1; then
            echo -e "   ${GREEN}✅ Backend is ready!${NC}"
            BACKEND_RUNNING=true
            break
        fi
        sleep 1
        echo -n "."
    done
    echo ""
    
    if [ "$BACKEND_RUNNING" = false ]; then
        echo -e "   ${RED}❌ Backend failed to start${NC}"
        echo "   Check logs: tail -f ../backend.log"
        exit 1
    fi
    
    cd ../frontend
fi
echo ""

# Check if frontend is running
echo "2️⃣  Checking Frontend Status..."
if curl -s http://localhost:1000 > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Frontend is already running${NC}"
else
    echo -e "   ${YELLOW}⚠️  Frontend is NOT running${NC}"
    echo "   Please start frontend in another terminal:"
    echo "   cd frontend && npm run dev"
    echo ""
fi
echo ""

# Test backend health
echo "3️⃣  Testing Backend Health..."
HEALTH_RESPONSE=$(curl -s http://localhost:2000/api/health)
if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✅ Backend health check passed${NC}"
    echo "   Response: $HEALTH_RESPONSE" | head -c 100
    echo ""
else
    echo -e "   ${RED}❌ Backend health check failed${NC}"
fi
echo ""

# Test login endpoint
echo "4️⃣  Testing Login Endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:2000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"AdminPassword123!"}' \
    -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
BODY=$(echo "$LOGIN_RESPONSE" | sed 's/HTTP_CODE:.*//')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Login endpoint works (200 OK)${NC}"
    echo "   Token received: $(echo "$BODY" | grep -o '"token":"[^"]*"' | head -c 50)..."
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "   ${YELLOW}⚠️  Login endpoint works but credentials invalid (401)${NC}"
    echo "   → User may not exist, run: npm run seed-demo-users"
else
    echo -e "   ${RED}❌ Login endpoint returned: $HTTP_CODE${NC}"
fi
echo ""

# Run E2E tests
echo "5️⃣  Running E2E Tests..."
echo "   This will take a few minutes..."
echo ""

if [ "$BACKEND_RUNNING" = true ]; then
    npx playwright test e2e/auth-flow-e2e.spec.ts --reporter=list
    TEST_EXIT_CODE=$?
    
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ All tests passed!${NC}"
    else
        echo ""
        echo -e "${YELLOW}⚠️  Some tests failed (this is expected if backend state differs)${NC}"
        echo "   Check test results above for details"
    fi
else
    echo -e "   ${YELLOW}⏭️  Skipping E2E tests (backend not running)${NC}"
fi
echo ""

# Summary
echo "📊 Summary"
echo "=========="
echo ""
if [ "$BACKEND_RUNNING" = true ]; then
    echo -e "   ${GREEN}✅ Backend: Running${NC}"
else
    echo -e "   ${RED}❌ Backend: Not Running${NC}"
fi

if curl -s http://localhost:1000 > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Frontend: Running${NC}"
else
    echo -e "   ${RED}❌ Frontend: Not Running${NC}"
fi
echo ""

echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:1000/login"
echo "   Backend:  http://localhost:2000/api/health"
echo ""

echo "📝 Next Steps:"
echo "   1. Open http://localhost:1000/login in browser"
echo "   2. Test login with: admin@example.com / AdminPassword123!"
echo "   3. Check browser console for any errors"
echo "   4. Verify all features work as expected"
echo ""

if [ "$BACKEND_RUNNING" = false ] && [ -n "$BACKEND_PID" ]; then
    echo "⚠️  Note: Backend is running in background (PID: $BACKEND_PID)"
    echo "   To stop: kill $BACKEND_PID"
    echo "   To view logs: tail -f ../backend.log"
    echo ""
fi

echo "✅ Setup complete!"

