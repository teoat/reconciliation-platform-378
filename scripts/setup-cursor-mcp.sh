#!/bin/bash
# Setup script for Cursor IDE MCP servers and configuration
# This script builds the custom MCP server and validates the configuration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_SERVER_DIR="$PROJECT_ROOT/mcp-server"
CURSOR_CONFIG="$PROJECT_ROOT/.cursor/mcp.json"

echo "🚀 Setting up Cursor IDE MCP Configuration..."
echo ""

# Check if MCP server directory exists
if [ ! -d "$MCP_SERVER_DIR" ]; then
    echo "❌ Error: MCP server directory not found at $MCP_SERVER_DIR"
    exit 1
fi

# Build custom MCP server
echo "📦 Building custom MCP server..."
cd "$MCP_SERVER_DIR"

if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in MCP server directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Build the server
echo "🔨 Building TypeScript..."
npm run build

# Verify build output
if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: Build failed - dist/index.js not found"
    exit 1
fi

echo "✅ MCP server built successfully!"
echo ""

# Validate JSON configuration
echo "🔍 Validating MCP configuration..."
if command -v jq &> /dev/null; then
    if jq empty "$CURSOR_CONFIG" 2>/dev/null; then
        echo "✅ MCP configuration JSON is valid"
        
        # Check for placeholder API keys
        echo "⚠️  Checking for placeholder API keys..."
        if grep -q "YOUR_.*_HERE" "$CURSOR_CONFIG"; then
            echo "⚠️  Warning: Found placeholder API keys in configuration"
            echo "   Please update .cursor/mcp.json with actual API keys"
        else
            echo "✅ No placeholder API keys found"
        fi
        
        # List configured servers
        echo ""
        echo "📋 Configured MCP Servers:"
        jq -r '.mcpServers | keys[]' "$CURSOR_CONFIG" | while read server; do
            echo "   - $server"
        done
    else
        echo "❌ Error: Invalid JSON in MCP configuration"
        exit 1
    fi
else
    echo "⚠️  Warning: jq not installed, skipping JSON validation"
    echo "   Install jq for validation: brew install jq (macOS) or apt-get install jq (Linux)"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Review and update API keys in .cursor/mcp.json"
echo "   2. Restart Cursor IDE to load the new configuration"
echo "   3. Verify MCP servers are connected in Cursor settings"
echo ""
echo "📚 Documentation: docs/CURSOR_OPTIMIZATION_GUIDE.md"

