#!/bin/bash
# ============================================================================
# FINALIZE MCP SETUP
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_DIR="$PROJECT_ROOT/mcp-server"

# Node.js path
NODE_BIN="/usr/local/Cellar/node/25.1.0/bin/node"
NPM_BIN="/usr/local/Cellar/node/25.1.0/bin/npm"
export PATH="/usr/local/Cellar/node/25.1.0/bin:$PATH"

cd "$MCP_DIR"

echo "Installing @types/dockerode..."
$NPM_BIN install --save-dev @types/dockerode

echo ""
echo "Building TypeScript..."
$NPM_BIN run build

echo ""
echo "✅ Build complete!"

