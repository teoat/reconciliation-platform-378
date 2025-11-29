#!/bin/bash

# Run Database Migrations Script
# This script runs all pending database migrations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "🔄 Running Database Migrations..."
echo ""

cd "$BACKEND_DIR"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set"
    echo "   Please set DATABASE_URL in .env file"
    exit 1
fi

echo "✅ DATABASE_URL configured"
echo ""

# Check if diesel CLI is installed
if ! command -v diesel &> /dev/null; then
    echo "📦 Installing diesel CLI..."
    cargo install diesel_cli --no-default-features --features postgres
    echo ""
fi

# Run migrations
echo "🚀 Running migrations..."
diesel migration run

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Restart backend (if running)"
    echo "   2. Test health endpoint: curl http://localhost:2000/health"
    echo "   3. Create demo users: ./scripts/create-demo-users-and-test.sh"
else
    echo ""
    echo "❌ Migrations failed"
    echo "   Check the error messages above"
    exit 1
fi

