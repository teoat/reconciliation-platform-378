#!/bin/bash
# Run MCP Implementation Checklist
# Tests all verifiable items from the implementation checklist

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CURSOR_CONFIG="$PROJECT_ROOT/.cursor/mcp.json"
MCP_SERVER_DIR="$PROJECT_ROOT/mcp-server"

echo "🧪 Running MCP Implementation Checklist"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PASSED=0
FAILED=0
SKIPPED=0

# Function to check item
check_item() {
    local name="$1"
    local test_cmd="$2"
    local manual="$3"
    
    echo "🔍 Checking: $name"
    
    if [ "$manual" = "true" ]; then
        echo "   ⏭️  Manual check required - cannot be automated"
        echo "   💡 Action: $test_cmd"
        SKIPPED=$((SKIPPED + 1))
    else
        if eval "$test_cmd" > /dev/null 2>&1; then
            echo "   ✅ PASSED"
            PASSED=$((PASSED + 1))
        else
            echo "   ❌ FAILED"
            echo "   💡 $test_cmd"
            FAILED=$((FAILED + 1))
        fi
    fi
    echo ""
}

# 1. Restart Cursor IDE (Manual)
check_item "Restart Cursor IDE" "Please restart Cursor IDE manually to load new MCP configuration" "true"

# 2. Verify filesystem server works
check_item "Verify filesystem server configuration" "[ -f '$CURSOR_CONFIG' ] && jq -e '.mcpServers.filesystem' '$CURSOR_CONFIG' > /dev/null"

# 3. Test git server operations
check_item "Verify git server configuration" "[ -f '$CURSOR_CONFIG' ] && jq -e '.mcpServers.git' '$CURSOR_CONFIG' > /dev/null"

# 4. Check postgres connection
check_item "Verify postgres server configuration" "[ -f '$CURSOR_CONFIG' ] && jq -e '.mcpServers.postgres' '$CURSOR_CONFIG' > /dev/null"

# Check if postgres connection string is valid format
if [ -f "$CURSOR_CONFIG" ]; then
    PG_CONN=$(jq -r '.mcpServers.postgres.env.POSTGRES_CONNECTION_STRING' "$CURSOR_CONFIG" 2>/dev/null)
    if [[ "$PG_CONN" =~ ^postgresql:// ]]; then
        echo "🔍 Checking: Postgres connection string format"
        echo "   ✅ Valid format: $PG_CONN"
        PASSED=$((PASSED + 1))
    else
        echo "🔍 Checking: Postgres connection string format"
        echo "   ⚠️  Connection string format may be invalid"
        FAILED=$((FAILED + 1))
    fi
    echo ""
fi

# 5. Test playwright browser automation
check_item "Verify playwright server configuration" "[ -f '$CURSOR_CONFIG' ] && jq -e '.mcpServers.playwright' '$CURSOR_CONFIG' > /dev/null"

# 6. Verify memory server persistence
check_item "Verify memory server configuration" "[ -f '$CURSOR_CONFIG' ] && jq -e '.mcpServers.memory' '$CURSOR_CONFIG' > /dev/null"

# 7. Test custom reconciliation-platform tools
check_item "Verify custom reconciliation-platform server exists" "[ -f '$MCP_SERVER_DIR/dist/index.js' ]"

check_item "Verify custom reconciliation-platform server configuration" "[ -f '$CURSOR_CONFIG' ] && jq -e '.mcpServers[\"reconciliation-platform\"]' '$CURSOR_CONFIG' > /dev/null"

# Check custom server can be executed (syntax check)
if [ -f "$MCP_SERVER_DIR/dist/index.js" ]; then
    echo "🔍 Checking: Custom server syntax validation"
    if node -c "$MCP_SERVER_DIR/dist/index.js" 2>/dev/null; then
        echo "   ✅ Server file syntax is valid"
        PASSED=$((PASSED + 1))
    else
        echo "   ❌ Server file has syntax errors"
        FAILED=$((FAILED + 1))
    fi
    echo ""
fi

# 8. Check prometheus metrics access
check_item "Verify prometheus server configuration" "[ -f '$CURSOR_CONFIG' ] && jq -e '.mcpServers.prometheus' '$CURSOR_CONFIG' > /dev/null"

# Check prometheus URL format
if [ -f "$CURSOR_CONFIG" ]; then
    PROM_URL=$(jq -r '.mcpServers.prometheus.env.PROMETHEUS_URL' "$CURSOR_CONFIG" 2>/dev/null)
    if [[ "$PROM_URL" =~ ^http:// ]] || [[ "$PROM_URL" =~ ^https:// ]]; then
        echo "🔍 Checking: Prometheus URL format"
        echo "   ✅ Valid URL format: $PROM_URL"
        PASSED=$((PASSED + 1))
    else
        echo "🔍 Checking: Prometheus URL format"
        echo "   ⚠️  URL format may be invalid: $PROM_URL"
        FAILED=$((FAILED + 1))
    fi
    echo ""
fi

# Additional automated checks
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Additional Automated Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check all servers are configured
check_item "All 7 servers configured" "[ \$(jq '.mcpServers | length' '$CURSOR_CONFIG') -eq 7 ]"

# Check tool count
check_item "Tool count under limit" "./scripts/analyze-mcp-tools.sh 2>/dev/null | grep -q 'within limits'"

# Check paths are absolute
if [ -f "$CURSOR_CONFIG" ]; then
    FS_PATH=$(jq -r '.mcpServers.filesystem.args[-1]' "$CURSOR_CONFIG" 2>/dev/null)
    if [[ "$FS_PATH" =~ ^/ ]]; then
        echo "🔍 Checking: Filesystem path is absolute"
        echo "   ✅ Path is absolute: $FS_PATH"
        PASSED=$((PASSED + 1))
    else
        echo "🔍 Checking: Filesystem path is absolute"
        echo "   ⚠️  Path is relative, should be absolute"
        FAILED=$((FAILED + 1))
    fi
    echo ""
    
    GIT_PATH=$(jq -r '.mcpServers.git.args[-1]' "$CURSOR_CONFIG" 2>/dev/null)
    if [[ "$GIT_PATH" =~ ^/ ]]; then
        echo "🔍 Checking: Git path is absolute"
        echo "   ✅ Path is absolute: $GIT_PATH"
        PASSED=$((PASSED + 1))
    else
        echo "🔍 Checking: Git path is absolute"
        echo "   ⚠️  Path is relative, should be absolute"
        FAILED=$((FAILED + 1))
    fi
    echo ""
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Checklist Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ✅ Passed: $PASSED"
echo "   ❌ Failed: $FAILED"
echo "   ⏭️  Skipped (Manual): $SKIPPED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All automated checks passed!"
    echo ""
    echo "📝 Manual Actions Required:"
    echo "   1. Restart Cursor IDE to load MCP configuration"
    echo "   2. Test each server interactively in Cursor IDE"
    echo "   3. Verify servers appear in Cursor's MCP server list"
    exit 0
else
    echo "⚠️  Some checks failed. Please review errors above."
    exit 1
fi

