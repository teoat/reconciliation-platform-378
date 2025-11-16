#!/bin/bash
# Comprehensive MCP implementation check
# Verifies all servers are properly configured and accessible

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CURSOR_CONFIG="$PROJECT_ROOT/.cursor/mcp.json"
MCP_SERVER_DIR="$PROJECT_ROOT/mcp-server"

echo "🔍 Comprehensive MCP Implementation Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ERRORS=0
WARNINGS=0
PASSED=0

# Check 1: JSON Configuration
echo "1️⃣  Checking JSON Configuration..."
if command -v jq &> /dev/null; then
    if jq empty "$CURSOR_CONFIG" 2>/dev/null; then
        echo "   ✅ JSON syntax is valid"
        PASSED=$((PASSED + 1))
    else
        echo "   ❌ Invalid JSON syntax"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ⚠️  jq not installed, skipping JSON validation"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 2: Custom MCP Server Build
echo "2️⃣  Checking Custom MCP Server..."
if [ -f "$MCP_SERVER_DIR/dist/index.js" ]; then
    echo "   ✅ Custom server is built"
    PASSED=$((PASSED + 1))
    
    # Check if it's recent (within last 7 days)
    if [ -f "$MCP_SERVER_DIR/dist/index.js" ]; then
        BUILD_AGE=$(find "$MCP_SERVER_DIR/dist/index.js" -mtime -7 2>/dev/null | wc -l | tr -d ' ')
        if [ "$BUILD_AGE" -gt 0 ]; then
            echo "   ✅ Build is recent (< 7 days old)"
        else
            echo "   ⚠️  Build is older than 7 days, consider rebuilding"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
else
    echo "   ❌ Custom server not built"
    echo "   💡 Run: cd mcp-server && npm install && npm run build"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 3: Server Paths
echo "3️⃣  Checking Server Paths..."
if command -v jq &> /dev/null; then
    # Check filesystem path
    FS_PATH=$(jq -r '.mcpServers.filesystem.args[-1]' "$CURSOR_CONFIG" 2>/dev/null)
    if [ -n "$FS_PATH" ] && [ "$FS_PATH" != "null" ] && [ -d "$FS_PATH" ]; then
        echo "   ✅ Filesystem path is valid: $FS_PATH"
        PASSED=$((PASSED + 1))
    else
        echo "   ❌ Filesystem path invalid or missing: $FS_PATH"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check git path
    GIT_PATH=$(jq -r '.mcpServers.git.args[-1]' "$CURSOR_CONFIG" 2>/dev/null)
    if [ -n "$GIT_PATH" ] && [ "$GIT_PATH" != "null" ] && [ -d "$GIT_PATH" ]; then
        echo "   ✅ Git path is valid: $GIT_PATH"
        PASSED=$((PASSED + 1))
    else
        echo "   ❌ Git path invalid or missing: $GIT_PATH"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check custom server path
    CUSTOM_PATH=$(jq -r '.mcpServers["reconciliation-platform"].args[0]' "$CURSOR_CONFIG" 2>/dev/null)
    if [ -n "$CUSTOM_PATH" ] && [ "$CUSTOM_PATH" != "null" ] && [ -f "$CUSTOM_PATH" ]; then
        echo "   ✅ Custom server path is valid: $CUSTOM_PATH"
        PASSED=$((PASSED + 1))
    else
        echo "   ❌ Custom server path invalid: $CUSTOM_PATH"
        ERRORS=$((ERRORS + 1))
    fi
fi
echo ""

# Check 4: Required Dependencies
echo "4️⃣  Checking Required Dependencies..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js installed: $NODE_VERSION"
    PASSED=$((PASSED + 1))
else
    echo "   ❌ Node.js not installed"
    ERRORS=$((ERRORS + 1))
fi

if command -v npx &> /dev/null; then
    echo "   ✅ npx available"
    PASSED=$((PASSED + 1))
else
    echo "   ❌ npx not available"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 5: Server Count and Tool Limit
echo "5️⃣  Checking Server Configuration..."
if command -v jq &> /dev/null; then
    SERVER_COUNT=$(jq '.mcpServers | length' "$CURSOR_CONFIG" 2>/dev/null)
    echo "   ✅ Configured servers: $SERVER_COUNT"
    PASSED=$((PASSED + 1))
    
    # Estimate tool count
    echo "   📊 Tool count analysis:"
    ./scripts/analyze-mcp-tools.sh 2>/dev/null | grep "Total Estimated Tools" || echo "   ⚠️  Could not analyze tool counts"
fi
echo ""

# Check 6: Rules Directory
echo "6️⃣  Checking Rules Configuration..."
RULES_DIR="$PROJECT_ROOT/.cursor/rules"
if [ -d "$RULES_DIR" ]; then
    RULE_COUNT=$(find "$RULES_DIR" -name "*.mdc" 2>/dev/null | wc -l | tr -d ' ')
    echo "   ✅ Rules directory exists with $RULE_COUNT rule file(s)"
    PASSED=$((PASSED + 1))
    
    # Check for key rules
    KEY_RULES=("cursor_rules.mdc" "rust_patterns.mdc" "typescript_patterns.mdc" "security.mdc" "testing.mdc")
    for rule in "${KEY_RULES[@]}"; do
        if [ -f "$RULES_DIR/$rule" ] || find "$RULES_DIR" -name "$rule" -type f 2>/dev/null | grep -q .; then
            echo "   ✅ Found: $rule"
        else
            echo "   ⚠️  Missing: $rule"
            WARNINGS=$((WARNINGS + 1))
        fi
    done
else
    echo "   ❌ Rules directory not found: $RULES_DIR"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 7: Environment Configuration
echo "7️⃣  Checking Environment Configuration..."
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "   ✅ .env file exists"
    PASSED=$((PASSED + 1))
else
    echo "   ⚠️  .env file not found (may not be needed for MCP)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check postgres connection string
if command -v jq &> /dev/null; then
    PG_CONN=$(jq -r '.mcpServers.postgres.env.POSTGRES_CONNECTION_STRING' "$CURSOR_CONFIG" 2>/dev/null)
    if [ -n "$PG_CONN" ] && [ "$PG_CONN" != "null" ]; then
        echo "   ✅ PostgreSQL connection string configured"
        PASSED=$((PASSED + 1))
    else
        echo "   ⚠️  PostgreSQL connection string not configured"
        WARNINGS=$((WARNINGS + 1))
    fi
fi
echo ""

# Check 8: Documentation
echo "8️⃣  Checking Documentation..."
DOC_FILES=(
    "docs/CURSOR_OPTIMIZATION_GUIDE.md"
    "docs/MCP_OPTIMIZATION_REPORT.md"
    ".cursor/QUICK_REFERENCE.md"
    ".cursor/MCP_CONFIGURATION_UPDATE.md"
)
for doc in "${DOC_FILES[@]}"; do
    if [ -f "$PROJECT_ROOT/$doc" ]; then
        echo "   ✅ Found: $doc"
        PASSED=$((PASSED + 1))
    else
        echo "   ⚠️  Missing: $doc"
        WARNINGS=$((WARNINGS + 1))
    fi
done
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Implementation Check Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ✅ Passed: $PASSED"
echo "   ⚠️  Warnings: $WARNINGS"
echo "   ❌ Errors: $ERRORS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All checks passed! Implementation is complete."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Implementation complete with $WARNINGS warning(s)"
    echo "   Review warnings above for optimization opportunities"
    exit 0
else
    echo "❌ Implementation incomplete with $ERRORS error(s)"
    echo "   Please fix errors before using MCP servers"
    exit 1
fi

