#!/bin/bash
# ============================================================================
# START FRONTEND SERVER
# ============================================================================

set -e

echo "🎨 Starting Frontend Server..."
echo ""

# Set environment variables
export VITE_API_URL=http://localhost:2000/api
export VITE_WS_URL=ws://localhost:2000
export NODE_ENV=development

cd frontend

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🚀 Starting frontend dev server on port 1000..."
echo ""

npm run dev

echo ""
echo "✅ Frontend running at http://localhost:1000"

