#!/bin/bash
# Analyze MCP server tool counts and optimize configuration
# This script helps identify which servers provide the most value

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CURSOR_CONFIG="$PROJECT_ROOT/.cursor/mcp.json"
MAX_TOOLS=80

echo "🔍 Analyzing MCP Server Tool Counts..."
echo "Target: Maximum $MAX_TOOLS tools combined"
echo ""

# Tool count estimates for standard MCP servers
# These are approximate based on typical MCP server implementations
# Format: server_name:tool_count
TOOL_COUNTS="
filesystem:8
postgres:6
git:12
docker:10
github:15
brave-search:3
prometheus:8
reconciliation-platform:16
sqlite:6
puppeteer:5
playwright:8
memory:4
fetch:3
"

TOTAL_TOOLS=0
echo "📊 Estimated Tool Counts by Server:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v jq &> /dev/null; then
    while IFS= read -r server; do
        if [ -z "$server" ]; then continue; fi
        SERVER_NAME=$(echo "$server" | cut -d: -f1)
        COUNT=$(echo "$server" | cut -d: -f2)
        
        # Check if server is in config
        if jq -e ".mcpServers[\"$SERVER_NAME\"]" "$CURSOR_CONFIG" > /dev/null 2>&1; then
            STATUS="✅"
            TOTAL_TOOLS=$((TOTAL_TOOLS + COUNT))
            printf "  %s %-30s %3d tools\n" "$STATUS" "$SERVER_NAME" "$COUNT"
        fi
    done <<< "$TOOL_COUNTS"
else
    echo "⚠️  jq not installed, showing all estimates:"
    while IFS= read -r server; do
        if [ -z "$server" ]; then continue; fi
        SERVER_NAME=$(echo "$server" | cut -d: -f1)
        COUNT=$(echo "$server" | cut -d: -f2)
        printf "  %-30s %3d tools\n" "$SERVER_NAME" "$COUNT"
        TOTAL_TOOLS=$((TOTAL_TOOLS + COUNT))
    done <<< "$TOOL_COUNTS"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📈 Total Estimated Tools: $TOTAL_TOOLS"
echo ""

if [ "$TOTAL_TOOLS" -gt "$MAX_TOOLS" ]; then
    EXCESS=$((TOTAL_TOOLS - MAX_TOOLS))
    echo "⚠️  Warning: Exceeds limit by $EXCESS tools"
    echo ""
    echo "💡 Optimization Recommendations:"
    echo ""
    echo "High Priority (Keep - ~42 tools):"
    echo "  ✅ reconciliation-platform (16 tools) - Custom project tools"
    echo "  ✅ filesystem (8 tools) - Core file operations"
    echo "  ✅ git (12 tools) - Version control essential"
    echo "  ✅ postgres (6 tools) - Database operations"
    echo ""
    echo "Medium Priority (Optional - adds ~33 tools):"
    echo "  ⚠️  docker (10 tools) - Useful but overlaps with custom server"
    echo "  ⚠️  github (15 tools) - Useful if actively using GitHub"
    echo "  ⚠️  prometheus (8 tools) - Useful for monitoring"
    echo ""
    echo "Low Priority (Can Remove - saves ~21 tools):"
    echo "  ❌ sqlite (6 tools) - Redundant if using postgres"
    echo "  ❌ puppeteer (5 tools) - Nice to have, not essential"
    echo "  ❌ memory (4 tools) - Optional context management"
    echo "  ❌ fetch (3 tools) - Can use custom server or curl"
    echo "  ❌ brave-search (3 tools) - Nice to have, not essential"
    echo ""
    echo "Suggested Optimized Configuration (42 tools):"
    echo "  - Keep: reconciliation-platform, filesystem, git, postgres"
    echo "  - Total: 16 + 8 + 12 + 6 = 42 tools ✅"
else
    echo "✅ Current configuration is within limits"
fi

echo ""
echo "📝 Next Steps:"
echo "  1. Review tool counts above"
echo "  2. Decide which servers to keep/remove"
echo "  3. Update .cursor/mcp.json accordingly"
echo "  4. Run validation: ./scripts/validate-cursor-config.sh"
