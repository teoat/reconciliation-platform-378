#!/bin/bash

# Start Backend with Environment Variables
# This script loads .env and starts the backend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "🔧 Loading environment variables..."
cd "$BACKEND_DIR"

# Load .env file if it exists
if [ -f .env ]; then
    echo "✅ Found .env file"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found"
fi

# Ensure DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set"
    echo "   Please set DATABASE_URL in .env file or environment"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""
echo "🚀 Starting backend..."
echo "   (Keep this terminal open - backend needs to keep running)"
echo ""

# Start backend
cargo run --bin reconciliation-backend

