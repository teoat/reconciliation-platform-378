#!/bin/bash
# Start script for frontend with correct PATH

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Set PATH to include Node.js
export PATH="/usr/local/Cellar/node/24.10.0/bin:$PATH"

echo "🚀 Starting Frontend Development Server..."
echo ""
echo "📦 Using Node.js $(node --version)"
echo "📦 Using npm $(npm --version)"
echo "📍 Current directory: $SCRIPT_DIR"
echo ""

# Run vite directly with node in PATH
node node_modules/.bin/vite --port 1000
