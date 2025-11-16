#!/bin/bash
# Test coverage script for Rust backend
# Usage: ./coverage.sh

set -e

echo "🔍 Running test coverage analysis..."

# Check if cargo-tarpaulin is installed
if ! command -v cargo-tarpaulin &> /dev/null; then
    echo "❌ cargo-tarpaulin is not installed"
    echo "📦 Install it with: cargo install cargo-tarpaulin"
    exit 1
fi

# Run tests with coverage
echo "🧪 Running tests with coverage..."
cargo tarpaulin \
    --out Html \
    --out Xml \
    --out Stdout \
    --output-dir coverage \
    --timeout 300 \
    --fail-under 50.0

# Check if coverage directory was created
if [ -d "coverage" ]; then
    echo "✅ Coverage report generated in coverage/index.html"
    echo "📊 Open coverage/index.html in your browser to view the report"
else
    echo "⚠️  Coverage directory not found"
fi

