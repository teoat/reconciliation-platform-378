#!/bin/bash

# Complete script to run all critical flow tests
# This script starts the backend (if needed) and runs all tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "🚀 Quick Start: Running All Critical Flow Tests"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend is running
echo "🔍 Checking backend status..."
if curl -s -f http://localhost:2000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is already running${NC}"
    BACKEND_RUNNING=true
else
    echo -e "${YELLOW}⚠️  Backend is not running${NC}"
    BACKEND_RUNNING=false
fi

# Start backend if not running
if [ "$BACKEND_RUNNING" = false ]; then
    echo ""
    echo "🔧 Starting backend server..."
    echo "   (This may take a minute to compile and start)"
    echo ""
    
    cd "$PROJECT_ROOT/backend"
    
    # Start backend in background
    cargo run > /tmp/backend-test.log 2>&1 &
    BACKEND_PID=$!
    echo "   Backend starting (PID: $BACKEND_PID)"
    echo "   Logs: /tmp/backend-test.log"
    
    # Wait for backend to be ready
    echo ""
    echo "⏳ Waiting for backend to start..."
    MAX_WAIT=120
    WAITED=0
    while [ $WAITED -lt $MAX_WAIT ]; do
        if curl -s -f http://localhost:2000/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is ready!${NC}"
            break
        fi
        sleep 2
        WAITED=$((WAITED + 2))
        echo -n "."
    done
    
    if [ $WAITED -ge $MAX_WAIT ]; then
        echo -e "${RED}❌ Backend failed to start within $MAX_WAIT seconds${NC}"
        echo "   Check logs: tail -f /tmp/backend-test.log"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    
    echo ""
fi

# Set environment variables
export API_BASE_URL="${API_BASE_URL:-http://localhost:2000}"
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:1000}"

echo ""
echo "📋 Test Configuration:"
echo "   API Base URL: $API_BASE_URL"
echo "   Frontend URL: $PLAYWRIGHT_BASE_URL"
echo ""

# Check Playwright installation
if [ ! -d "node_modules/@playwright" ]; then
    echo "📦 Installing Playwright browsers..."
    npx playwright install chromium
fi

# Run the tests
echo ""
echo "🧪 Running Critical Flow Tests..."
echo "=================================="
echo ""

cd "$PROJECT_ROOT"

# Run tests with proper error handling
if npx playwright test e2e/critical-flows.spec.ts \
    --project=chromium \
    --reporter=list,html \
    --timeout=60000; then
    echo ""
    echo -e "${GREEN}✅ All tests completed successfully!${NC}"
    echo ""
    echo "📊 View HTML report:"
    echo "   npx playwright show-report"
    TEST_RESULT=0
else
    echo ""
    echo -e "${YELLOW}⚠️  Some tests failed or backend was not available${NC}"
    echo ""
    echo "📊 View HTML report for details:"
    echo "   npx playwright show-report"
    TEST_RESULT=1
fi

# Cleanup: Stop backend if we started it
if [ "$BACKEND_RUNNING" = false ] && [ -n "$BACKEND_PID" ]; then
    echo ""
    echo "🧹 Cleaning up: Stopping backend server..."
    kill $BACKEND_PID 2>/dev/null || true
    sleep 2
    echo "✅ Cleanup complete"
fi

echo ""
exit $TEST_RESULT

