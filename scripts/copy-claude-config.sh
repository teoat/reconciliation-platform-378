#!/bin/bash
# ============================================================================
# COPY CLAUDE DESKTOP CONFIG
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_CONFIG="$PROJECT_ROOT/claude-desktop-config.json"
TARGET_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

echo "============================================================================"
echo "COPYING CLAUDE DESKTOP CONFIG"
echo "============================================================================"
echo ""

# Create directory if needed
mkdir -p "$HOME/Library/Application Support/Claude"

# Check if source exists
if [ ! -f "$SOURCE_CONFIG" ]; then
    echo "❌ Source config not found: $SOURCE_CONFIG"
    exit 1
fi

# Check if target already exists
if [ -f "$TARGET_CONFIG" ]; then
    echo "⚠️  Config file already exists at:"
    echo "   $TARGET_CONFIG"
    echo ""
    read -p "Overwrite? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipped"
        exit 0
    fi
fi

# Copy config
cp "$SOURCE_CONFIG" "$TARGET_CONFIG"
echo "✅ Config copied successfully"
echo ""
echo "Location: $TARGET_CONFIG"
echo ""
echo "Next step: Restart Claude Desktop to load the MCP server"
echo ""

