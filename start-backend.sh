#!/bin/bash
# ============================================================================
# START BACKEND SERVER
# ============================================================================

set -e

echo "🚀 Starting Backend Server..."
echo ""

# Set environment variables
export DATABASE_URL=postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app
export REDIS_URL=redis://localhost:6379
export JWT_SECRET=dev-secret-key-change-in-production
export PORT=2000
export HOST=0.0.0.0
export RUST_LOG=info

cd backend

echo "📦 Compiling backend..."
cargo build --release 2>/dev/null || cargo build

echo ""
echo "✅ Starting server on http://localhost:2000"
echo ""

cargo run

