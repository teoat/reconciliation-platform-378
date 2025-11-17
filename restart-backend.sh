#!/bin/bash

# Script to restart backend with CORS fixes
# This will stop the current backend and start a new one

cd "$(dirname "$0")/backend"

echo "🛑 Stopping backend on port 2000..."
lsof -ti :2000 | xargs kill -9 2>/dev/null || echo "No process found on port 2000"

echo "⏳ Waiting 2 seconds..."
sleep 2

echo "🚀 Starting backend with CORS fixes..."
cargo run

