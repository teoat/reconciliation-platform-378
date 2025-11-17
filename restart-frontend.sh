#!/bin/bash

# Script to restart frontend with API path fixes
# This will stop the current frontend and start a new one

cd "$(dirname "$0")/frontend"

echo "🛑 Stopping frontend on port 1000..."
lsof -ti :1000 | xargs kill -9 2>/dev/null || echo "No process found on port 1000"

echo "⏳ Waiting 2 seconds..."
sleep 2

echo "🧹 Clearing Vite cache..."
rm -rf node_modules/.vite dist

echo "🚀 Starting frontend with API path fixes..."
npm run dev

