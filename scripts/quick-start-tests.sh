#!/bin/bash

# Simplified quick start script
# Assumes backend is already running or will be started manually

set -e

cd "$(dirname "$0")/.."

echo "🧪 Quick Start: Critical Flow Tests"
echo "===================================="
echo ""

# Check if backend is running
if curl -s -f http://localhost:2000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is NOT running on http://localhost:2000"
    echo ""
    echo "Please start the backend first:"
    echo "  cd backend"
    echo "  cargo run"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Set environment
export API_BASE_URL="${API_BASE_URL:-http://localhost:2000}"
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:1000}"

echo "📋 Configuration:"
echo "   API: $API_BASE_URL"
echo "   Frontend: $PLAYWRIGHT_BASE_URL"
echo ""

# Run tests
echo "🚀 Running tests..."
echo ""

npx playwright test e2e/critical-flows.spec.ts \
    --project=chromium \
    --reporter=list,html \
    --timeout=60000

echo ""
echo "✅ Tests completed!"
echo ""
echo "📊 View report: npx playwright show-report"

