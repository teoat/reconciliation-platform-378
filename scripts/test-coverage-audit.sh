#!/bin/bash
# Test Coverage Audit Script
# Analyzes current test coverage and identifies gaps

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

echo "📊 Running Test Coverage Audit..."

# Frontend coverage
if [ -d "frontend" ]; then
    echo ""
    echo "=== Frontend Test Coverage ==="
    cd frontend
    
    # Check if vitest is available
    if command -v npm &> /dev/null; then
        if npm list vitest &> /dev/null || [ -f "package.json" ]; then
            echo "Running frontend test coverage..."
            npm run test:coverage 2>/dev/null || echo "⚠️  Test coverage command not configured"
        else
            echo "⚠️  Vitest not found. Install with: npm install -D vitest @vitest/coverage-v8"
        fi
    else
        echo "⚠️  npm not found. Skipping frontend coverage."
    fi
    
    cd ..
fi

# Backend coverage
if [ -d "backend" ]; then
    echo ""
    echo "=== Backend Test Coverage ==="
    cd backend
    
    # Check if tarpaulin is available
    if command -v cargo-tarpaulin &> /dev/null; then
        echo "Running backend test coverage with cargo-tarpaulin..."
        cargo tarpaulin --out Html --output-dir coverage 2>/dev/null || echo "⚠️  Coverage generation failed"
    else
        echo "⚠️  cargo-tarpaulin not found. Install with: cargo install cargo-tarpaulin"
        echo "   Or run tests manually: cargo test"
    fi
    
    cd ..
fi

echo ""
echo "✅ Coverage audit complete!"
echo ""
echo "📈 Coverage Reports:"
echo "  - Frontend: frontend/coverage/index.html"
echo "  - Backend: backend/coverage/tarpaulin-report.html"
echo ""
echo "💡 Target Coverage: 80% for critical paths"

