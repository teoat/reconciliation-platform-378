#!/bin/bash
# ============================================================================
# MCP SERVER SETUP (Bash version)
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_DIR="$PROJECT_ROOT/mcp-server"

# Ensure we have proper PATH
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

echo "============================================================================"
echo "MCP SERVER SETUP"
echo "============================================================================"

# Link Node.js if needed
if ! command -v node &> /dev/null; then
    echo "Linking Node.js..."
    brew link --overwrite node 2>&1 || true
    export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    echo "✅ Node.js: $NODE_VERSION"
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ Node.js not found. Please run: brew link --overwrite node"
    exit 1
fi

# Setup MCP server
cd "$MCP_DIR"
echo ""
echo "Installing dependencies..."
npm install --no-audit --no-fund

echo ""
echo "Building TypeScript..."
npm run build

# Create .env if needed
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
    else
        cat > .env <<EOF
DATABASE_URL=postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app
REDIS_URL=redis://:redis_pass@localhost:6379
PROJECT_ROOT=$PROJECT_ROOT
BACKEND_URL=http://localhost:2000
EOF
        echo "✅ Created .env template"
    fi
fi

echo ""
echo "============================================================================"
echo "✅ MCP SERVER SETUP COMPLETE"
echo "============================================================================"
echo ""
echo "Test with: cd $MCP_DIR && npm start"

