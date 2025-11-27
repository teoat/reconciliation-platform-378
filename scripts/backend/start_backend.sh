#!/bin/bash
# Start Backend Script with Environment Variables

set -e

cd "$(dirname "$0")"

echo "🔍 Backend Startup Diagnostic"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "✅ .env file found"
echo ""

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Verify required variables
echo "📋 Checking environment variables:"
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set"
    exit 1
else
    echo "✅ DATABASE_URL is set"
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET is not set"
    exit 1
else
    echo "✅ JWT_SECRET is set"
fi

if [ -z "$JWT_REFRESH_SECRET" ]; then
    echo "❌ JWT_REFRESH_SECRET is not set"
    exit 1
else
    echo "✅ JWT_REFRESH_SECRET is set"
fi

echo ""
echo "🚀 Starting backend with increased stack size..."
echo ""

# Export stack size before starting
export RUST_MIN_STACK=8388608

# Start backend with environment variables
cargo run

