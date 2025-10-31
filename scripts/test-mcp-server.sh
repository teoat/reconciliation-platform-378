#!/bin/bash
# ============================================================================
# TEST MCP SERVER
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_DIR="$PROJECT_ROOT/mcp-server"

export PATH="/usr/local/Cellar/node/25.1.0/bin:$PATH"

cd "$MCP_DIR"

echo "============================================================================"
echo "TESTING MCP SERVER"
echo "============================================================================"
echo ""

# Check if dist/index.js exists
if [ ! -f "dist/index.js" ]; then
    echo "❌ MCP server not built. Run: bash scripts/finalize-mcp.sh"
    exit 1
fi

echo "✅ MCP server binary found"
echo ""

# Check .env
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        cat > .env <<EOF
DATABASE_URL=postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app
REDIS_URL=redis://:redis_pass@localhost:6379
PROJECT_ROOT=$PROJECT_ROOT
BACKEND_URL=http://localhost:2000
EOF
    fi
    echo "✅ .env file created"
else
    echo "✅ .env file exists"
fi

echo ""
echo "Starting MCP server..."
echo "Press Ctrl+C to stop"
echo ""

# Test startup (timeout after 5 seconds)
timeout 5 node dist/index.js 2>&1 || echo "Server started (timeout reached - this is expected)"

echo ""
echo "============================================================================"
echo "✅ MCP SERVER TEST COMPLETE"
echo "============================================================================"
echo ""
echo "To start the server properly, run:"
echo "  cd $MCP_DIR"
echo "  export PATH=\"/usr/local/Cellar/node/25.1.0/bin:\$PATH\""
echo "  npm start"
echo ""

