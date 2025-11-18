#!/bin/bash

# Google OAuth Diagnostic Script
# Uses Playwright and Chrome DevTools to diagnose Google OAuth setup

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "🔍 Google OAuth Diagnostic Tool"
echo "==============================="
echo ""

# Check if frontend server is running
if ! lsof -ti:1000 > /dev/null 2>&1; then
    echo "⚠️  Frontend server is not running on port 1000"
    echo "   Starting frontend server..."
    cd "$FRONTEND_DIR"
    npm run dev > /dev/null 2>&1 &
    FRONTEND_PID=$!
    echo "   Frontend started (PID: $FRONTEND_PID)"
    echo "   Waiting 10 seconds for server to start..."
    sleep 10
    cd "$SCRIPT_DIR"
fi

# Check if tsx is available
if ! command -v tsx &> /dev/null; then
    echo "❌ tsx is not installed"
    echo "   Installing tsx..."
    cd "$FRONTEND_DIR"
    npm install --save-dev tsx
    cd "$SCRIPT_DIR"
fi

# Run diagnostic
echo "🚀 Running Playwright diagnostic..."
echo ""

cd "$FRONTEND_DIR"

# Option 1: Use Playwright test
if [ "$1" = "--playwright" ] || [ "$1" = "-p" ]; then
    echo "Using Playwright test runner..."
    npm run test:e2e:google-oauth:headed
else
    # Option 2: Use standalone diagnostic script
    echo "Using standalone diagnostic script..."
    if [ -f "$SCRIPT_DIR/diagnose-google-oauth.ts" ]; then
        # Copy script to frontend temporarily or run from frontend with correct path
        cd "$FRONTEND_DIR"
        npx tsx "$SCRIPT_DIR/diagnose-google-oauth.ts"
    else
        echo "❌ Diagnostic script not found: diagnose-google-oauth.ts"
        echo "   Falling back to Playwright test..."
        npm run test:e2e:google-oauth:headed
    fi
fi

echo ""
echo "📊 Diagnostic complete!"
echo ""
echo "📁 Results saved to: test-results/google-oauth-diagnostic/"
echo ""

