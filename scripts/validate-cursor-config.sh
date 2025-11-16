#!/bin/bash
# Validation script for Cursor IDE MCP configuration
# Checks JSON validity, paths, and configuration completeness

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CURSOR_CONFIG="$PROJECT_ROOT/.cursor/mcp.json"
MCP_SERVER_DIR="$PROJECT_ROOT/mcp-server"

echo "🔍 Validating Cursor IDE MCP Configuration..."
echo ""

ERRORS=0
WARNINGS=0

# Check if config file exists
if [ ! -f "$CURSOR_CONFIG" ]; then
    echo "❌ Error: MCP configuration file not found at $CURSOR_CONFIG"
    exit 1
fi

# Validate JSON syntax
echo "📋 Checking JSON syntax..."
if command -v jq &> /dev/null; then
    if jq empty "$CURSOR_CONFIG" 2>/dev/null; then
        echo "✅ JSON syntax is valid"
    else
        echo "❌ Error: Invalid JSON syntax"
        ERRORS=$((ERRORS + 1))
        exit 1
    fi
else
    echo "⚠️  Warning: jq not installed, skipping JSON validation"
    echo "   Install: brew install jq (macOS) or apt-get install jq (Linux)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for placeholder API keys
echo ""
echo "🔑 Checking for placeholder API keys..."
PLACEHOLDERS=$(grep -c "YOUR_.*_HERE" "$CURSOR_CONFIG" 2>/dev/null || true)
if [ -z "$PLACEHOLDERS" ]; then
    PLACEHOLDERS=0
fi
if [ "$PLACEHOLDERS" -gt 0 ]; then
    echo "⚠️  Warning: Found $PLACEHOLDERS placeholder API key(s)"
    echo "   Please update .cursor/mcp.json with actual API keys:"
    grep -n "YOUR_.*_HERE" "$CURSOR_CONFIG" | sed 's/^/     /'
    WARNINGS=$((WARNINGS + PLACEHOLDERS))
else
    echo "✅ No placeholder API keys found"
fi

# Check MCP server paths
echo ""
echo "📁 Checking MCP server paths..."
if command -v jq &> /dev/null; then
    # Check filesystem server path
    FS_PATH=$(jq -r '.mcpServers.filesystem.args[-1]' "$CURSOR_CONFIG" 2>/dev/null)
    if [ -n "$FS_PATH" ] && [ "$FS_PATH" != "null" ]; then
        if [ -d "$FS_PATH" ]; then
            echo "✅ Filesystem server path is valid: $FS_PATH"
        else
            echo "❌ Error: Filesystem server path does not exist: $FS_PATH"
            ERRORS=$((ERRORS + 1))
        fi
    fi
    
    # Check git server path
    GIT_PATH=$(jq -r '.mcpServers.git.args[-1]' "$CURSOR_CONFIG" 2>/dev/null)
    if [ -n "$GIT_PATH" ] && [ "$GIT_PATH" != "null" ]; then
        if [ -d "$GIT_PATH" ]; then
            echo "✅ Git server path is valid: $GIT_PATH"
        else
            echo "❌ Error: Git server path does not exist: $GIT_PATH"
            ERRORS=$((ERRORS + 1))
        fi
    fi
    
    # Check custom MCP server
    CUSTOM_SERVER=$(jq -r '.mcpServers["reconciliation-platform"].args[0]' "$CURSOR_CONFIG" 2>/dev/null)
    if [ -n "$CUSTOM_SERVER" ] && [ "$CUSTOM_SERVER" != "null" ]; then
        if [ -f "$CUSTOM_SERVER" ]; then
            echo "✅ Custom MCP server exists: $CUSTOM_SERVER"
        else
            echo "⚠️  Warning: Custom MCP server not built: $CUSTOM_SERVER"
            echo "   Run: ./scripts/setup-cursor-mcp.sh"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
fi

# List configured servers
echo ""
echo "📋 Configured MCP Servers:"
if command -v jq &> /dev/null; then
    jq -r '.mcpServers | keys[]' "$CURSOR_CONFIG" | while read server; do
        STATUS=$(jq -r ".mcpServers[\"$server\"].command" "$CURSOR_CONFIG" 2>/dev/null)
        if [ "$STATUS" != "null" ]; then
            echo "   ✅ $server"
        else
            echo "   ⚠️  $server (incomplete configuration)"
            WARNINGS=$((WARNINGS + 1))
        fi
    done
fi

# Check rules directory
echo ""
echo "📚 Checking rules directory..."
RULES_DIR="$PROJECT_ROOT/.cursor/rules"
if [ -d "$RULES_DIR" ]; then
    RULE_COUNT=$(find "$RULES_DIR" -name "*.mdc" | wc -l | tr -d ' ')
    echo "✅ Found $RULE_COUNT rule file(s)"
    find "$RULES_DIR" -name "*.mdc" | sed 's|.*/|     - |'
else
    echo "⚠️  Warning: Rules directory not found: $RULES_DIR"
    WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ Validation passed! Configuration looks good."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Validation completed with $WARNINGS warning(s)"
    echo "   Review warnings above and fix as needed"
    exit 0
else
    echo "❌ Validation failed with $ERRORS error(s) and $WARNINGS warning(s)"
    echo "   Please fix errors before using Cursor IDE"
    exit 1
fi

