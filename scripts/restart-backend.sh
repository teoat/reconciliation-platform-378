#!/bin/bash

# Restart Backend Server Script
# This script stops any running backend and restarts it with the latest code

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "🔄 Restarting Backend Server..."
echo ""

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Error: Backend directory not found at $BACKEND_DIR"
    exit 1
fi

cd "$BACKEND_DIR"

# Try to find and kill existing backend processes
echo "🔍 Checking for running backend processes..."
BACKEND_PIDS=$(ps aux | grep -E "cargo.*run|reconciliation-backend" | grep -v grep | awk '{print $2}' || true)

if [ -n "$BACKEND_PIDS" ]; then
    echo "⚠️  Found running backend processes: $BACKEND_PIDS"
    echo "🛑 Stopping existing processes..."
    echo "$BACKEND_PIDS" | xargs kill -9 2>/dev/null || true
    sleep 2
    echo "✅ Processes stopped"
else
    echo "ℹ️  No running backend processes found"
fi

echo ""
echo "🔨 Building backend..."
cargo build --release

echo ""
echo "🚀 Starting backend server..."
echo "   (Press Ctrl+C to stop)"
echo ""

# Run the backend
cargo run

