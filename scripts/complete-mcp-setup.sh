#!/bin/bash
# ============================================================================
# COMPLETE MCP SETUP (Using full Node.js paths)
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_DIR="$PROJECT_ROOT/mcp-server"

# Find Node.js
NODE_BIN="/usr/local/Cellar/node/25.1.0/bin/node"
NPM_BIN="/usr/local/Cellar/node/25.1.0/bin/npm"

if [ ! -f "$NODE_BIN" ]; then
    # Try to find it
    NODE_BIN=$(find /usr/local/Cellar/node -name node -type f 2>/dev/null | head -1 || echo "")
    if [ -z "$NODE_BIN" ]; then
        echo "❌ Node.js not found"
        exit 1
    fi
    NPM_BIN="$(dirname "$NODE_BIN")/npm"
fi

echo "============================================================================"
echo "MCP SERVER SETUP (Using Node.js from: $NODE_BIN)"
echo "============================================================================"
echo ""
echo "✅ Node.js: $($NODE_BIN --version)"
echo "✅ npm: $($NPM_BIN --version)"
echo ""

cd "$MCP_DIR"

# Install dependencies
echo "Installing dependencies..."
export PATH="$(dirname "$NODE_BIN"):$PATH"
$NPM_BIN install --no-audit --no-fund

# Build TypeScript
echo ""
echo "Building TypeScript..."
$NPM_BIN run build

# Create .env if needed
echo ""
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
        echo "✅ Created .env file"
    fi
    echo ""
    echo "⚠️  Please review .env file and update values if needed:"
    echo "   cd $MCP_DIR && nano .env"
else
    echo "✅ .env file already exists"
fi

# Verify build
if [ -f "dist/index.js" ]; then
    echo ""
    echo "✅ MCP server built successfully"
    echo ""
    echo "============================================================================"
    echo "✅ MCP SERVER SETUP COMPLETE"
    echo "============================================================================"
    echo ""
    echo "To test the server:"
    echo "  cd $MCP_DIR"
    echo "  export PATH=\"$(dirname "$NODE_BIN"):\$PATH\""
    echo "  npm start"
    echo ""
else
    echo "❌ Build failed - dist/index.js not found"
    exit 1
fi

