#!/bin/bash
# MCP Server Diagnostic Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_SERVER_DIR="$PROJECT_ROOT/mcp-server"

echo "🔍 MCP Server Diagnostic"
echo "========================"
echo ""

# Check if MCP server directory exists
if [ ! -d "$MCP_SERVER_DIR" ]; then
  echo "❌ MCP server directory not found: $MCP_SERVER_DIR"
  exit 1
fi

echo "✅ MCP server directory exists"

# Check if dist/index.js exists
if [ ! -f "$MCP_SERVER_DIR/dist/index.js" ]; then
  echo "❌ Compiled server not found. Building..."
  cd "$MCP_SERVER_DIR"
  npm run build
else
  echo "✅ Compiled server exists"
fi

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null || echo "not found")
echo "📦 Node.js version: $NODE_VERSION"

# Check if node command is available
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found in PATH"
  exit 1
fi

echo "✅ Node.js is available"

# Test server startup
echo ""
echo "🧪 Testing server startup..."
cd "$MCP_SERVER_DIR"

timeout 3 node dist/index.js 2>&1 | head -5 || true

if [ ${PIPESTATUS[0]} -eq 124 ]; then
  echo "✅ Server starts successfully (timeout expected for stdio server)"
else
  echo "⚠️  Server startup test completed"
fi

# Check dependencies
echo ""
echo "📋 Checking dependencies..."
cd "$MCP_SERVER_DIR"
if [ -d "node_modules" ]; then
  echo "✅ node_modules exists"
  
  # Check key dependencies
  if [ -d "node_modules/@modelcontextprotocol" ]; then
    echo "✅ @modelcontextprotocol/sdk installed"
  else
    echo "❌ @modelcontextprotocol/sdk not found. Run: npm install"
  fi
else
  echo "❌ node_modules not found. Run: npm install"
fi

# Check configuration files
echo ""
echo "📝 Checking configuration..."
if [ -f "$PROJECT_ROOT/claude-desktop-config.json" ]; then
  echo "✅ claude-desktop-config.json exists"
  
  # Check if paths are correct
  if grep -q "/Users/Arief/Documents/GitHub/reconciliation-platform-378" "$PROJECT_ROOT/claude-desktop-config.json"; then
    echo "✅ Paths in config are correct"
  else
    echo "⚠️  Paths in config may need updating"
  fi
else
  echo "⚠️  claude-desktop-config.json not found"
fi

# Check .env file
if [ -f "$MCP_SERVER_DIR/.env" ]; then
  echo "✅ .env file exists in mcp-server directory"
else
  echo "⚠️  .env file not found (using defaults)"
fi

echo ""
echo "✅ Diagnostic complete!"
echo ""
echo "If errors persist, check:"
echo "1. Cursor IDE MCP configuration at .cursor/mcp.json"
echo "2. Claude Desktop config at ~/Library/Application Support/Claude/claude_desktop_config.json"
echo "3. Server logs in Cursor IDE settings"

