#!/bin/bash

# Script to run critical flow tests
# This script sets up the environment and runs the critical flow E2E tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "🧪 Running Critical Flow Tests"
echo "================================"

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js and npm."
    exit 1
fi

# Check if Playwright browsers are installed
if [ ! -d "node_modules/@playwright" ]; then
    echo "📦 Installing Playwright browsers..."
    npx playwright install chromium
fi

# Set API base URL (default to backend port)
export API_BASE_URL="${API_BASE_URL:-http://localhost:2000}"
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:1000}"

echo ""
echo "Configuration:"
echo "  API Base URL: $API_BASE_URL"
echo "  Frontend URL: $PLAYWRIGHT_BASE_URL"
echo ""

# Check if backend is running
echo "🔍 Checking backend health..."
if curl -s -f "${API_BASE_URL}/api/health" > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "⚠️  Warning: Backend is not running on ${API_BASE_URL}"
    echo "   Some tests may fail. Start the backend with:"
    echo "   cd backend && cargo run"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🚀 Running tests..."
echo ""

# Run the critical flow tests
npx playwright test e2e/critical-flows.spec.ts \
    --project=chromium \
    --reporter=list,html \
    "$@"

echo ""
echo "✅ Tests completed!"
echo ""
echo "📊 View HTML report:"
echo "   npx playwright show-report"

