#!/bin/bash

# Complete Quick Start: Run All Critical Flow Tests
# This script loads environment variables and runs all tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "🚀 Quick Start: Running All Critical Flow Tests"
echo "================================================"
echo ""

# Load environment variables (handle .env files safely)
if [ -f ".env" ]; then
    echo "📋 Loading environment from .env file..."
    # Use export to load .env safely (handles variable expansion)
    export $(grep -v '^#' .env | grep -v '^$' | xargs) 2>/dev/null || true
    echo "✅ Environment loaded"
elif [ -f "config/dev.env.example" ]; then
    echo "📋 Loading environment from config/dev.env.example..."
    export $(grep -v '^#' config/dev.env.example | grep -v '^$' | xargs) 2>/dev/null || true
    echo "✅ Environment loaded"
fi

# Set defaults if not set
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app}"
export JWT_SECRET="${JWT_SECRET:-dev_jwt_secret_378_local_change_me}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-dev_jwt_refresh_secret_378_local_change_me}"

# Expand DATABASE_URL if it has variables (handle ${VAR} syntax)
if [[ "$DATABASE_URL" == *"\${"* ]] || [[ "$DATABASE_URL" == *"\$"* ]]; then
    export DATABASE_URL=$(eval echo "$DATABASE_URL")
fi

# Set API URLs
export API_BASE_URL="${API_BASE_URL:-http://localhost:2000}"
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:1000}"

echo ""
echo "📋 Configuration:"
echo "   DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "   API_BASE_URL: $API_BASE_URL"
echo ""

# Check if backend is running
echo "🔍 Checking backend status..."
if curl -s -f http://localhost:2000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is already running"
    BACKEND_RUNNING=true
else
    echo "⚠️  Backend is not running"
    BACKEND_RUNNING=false
    
    echo ""
    echo "🔧 Starting backend server..."
    echo "   (This may take 1-2 minutes to compile and start)"
    echo ""
    
    cd "$PROJECT_ROOT/backend"
    
    # Start backend in background with proper environment
    nohup cargo run > /tmp/backend-test.log 2>&1 &
    BACKEND_PID=$!
    echo "   Backend starting (PID: $BACKEND_PID)"
    echo "   Logs: tail -f /tmp/backend-test.log"
    
    # Wait for backend to be ready
    echo ""
    echo "⏳ Waiting for backend to start (this may take a minute)..."
    MAX_WAIT=180
    WAITED=0
    while [ $WAITED -lt $MAX_WAIT ]; do
        if curl -s -f http://localhost:2000/api/health > /dev/null 2>&1; then
            echo ""
            echo "✅ Backend is ready!"
            break
        fi
        sleep 3
        WAITED=$((WAITED + 3))
        if [ $((WAITED % 15)) -eq 0 ]; then
            echo "   Still waiting... ($WAITED/$MAX_WAIT seconds)"
        fi
    done
    
    if [ $WAITED -ge $MAX_WAIT ]; then
        echo ""
        echo "❌ Backend failed to start within $MAX_WAIT seconds"
        echo ""
        echo "📋 Check logs for errors:"
        echo "   tail -50 /tmp/backend-test.log"
        echo ""
        echo "💡 Common issues:"
        echo "   - Database not running: Start PostgreSQL"
        echo "   - Wrong DATABASE_URL: Check .env file"
        echo "   - Port 2000 in use: Change PORT in .env"
        echo ""
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
fi

# Check Playwright
if [ ! -d "node_modules/@playwright" ]; then
    echo ""
    echo "📦 Installing Playwright browsers..."
    npx playwright install chromium
fi

# Run the tests
echo ""
echo "🧪 Running Critical Flow Tests..."
echo "=================================="
echo ""

if npx playwright test e2e/critical-flows.spec.ts \
    --project=chromium \
    --reporter=list,html \
    --timeout=60000; then
    echo ""
    echo "✅ All tests completed!"
    TEST_RESULT=0
else
    echo ""
    echo "⚠️  Some tests failed (check report for details)"
    TEST_RESULT=1
fi

echo ""
echo "📊 View HTML report:"
echo "   npx playwright show-report"
echo ""

# Cleanup
if [ "$BACKEND_RUNNING" = false ] && [ -n "$BACKEND_PID" ]; then
    echo "🧹 Stopping backend server (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null || true
    sleep 2
    echo "✅ Cleanup complete"
fi

echo ""
exit $TEST_RESULT

