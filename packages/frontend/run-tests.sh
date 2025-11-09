#!/bin/bash

# Test runner script for the Reconciliation Frontend
echo "🧪 Running Frontend Tests..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run tests with coverage
echo "🔍 Running tests with coverage..."
npm run test:coverage

# Check if tests passed
if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
    echo "📊 Coverage report generated in coverage/"
else
    echo "❌ Some tests failed!"
    exit 1
fi
