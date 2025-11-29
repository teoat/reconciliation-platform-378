#!/bin/bash

# Fresh Backend Restart Script
# Kills all backend processes and starts fresh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "🛑 Stopping all backend processes..."
echo ""

# Kill all cargo and backend processes
pkill -f "cargo.*reconciliation-backend" 2>/dev/null || true
pkill -f "reconciliation-backend" 2>/dev/null || true
kill $(lsof -ti:2000) 2>/dev/null || true
sleep 2

echo "✅ All backend processes stopped"
echo ""
echo "🔨 Building backend..."
cd "$BACKEND_DIR"
cargo build --bin reconciliation-backend 2>&1 | tail -5

echo ""
echo "🚀 Starting backend..."
echo "   (Keep this terminal open - backend needs to keep running)"
echo ""

# Start backend in foreground so user can see output
cargo run --bin reconciliation-backend

