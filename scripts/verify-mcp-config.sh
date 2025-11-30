#!/bin/bash
# Verify MCP configuration and server status
# This script checks if MCP servers are properly configured and built

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_CONFIG="$PROJECT_ROOT/.cursor/mcp.json"
CLAUDE_CONFIG="$PROJECT_ROOT/claude-desktop-config.json"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       MCP Configuration Verification & Validation Tool        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

ISSUES=0

# Check if config files exist
echo -e "${BLUE}📋 Checking Configuration Files...${NC}"
if [ ! -f "$MCP_CONFIG" ]; then
    echo -e "${RED}❌ Cursor MCP configuration file not found: $MCP_CONFIG${NC}"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ Cursor MCP configuration file exists${NC}"
fi

if [ ! -f "$CLAUDE_CONFIG" ]; then
    echo -e "${YELLOW}⚠️  Claude Desktop configuration file not found: $CLAUDE_CONFIG${NC}"
    echo -e "${YELLOW}   Note: This is optional if you only use Cursor IDE${NC}"
else
    echo -e "${GREEN}✅ Claude Desktop configuration file exists${NC}"
fi
echo ""

# Check JSON validity
if [ -f "$MCP_CONFIG" ]; then
    echo -e "${BLUE}🔍 Validating JSON Syntax...${NC}"
    if ! jq empty "$MCP_CONFIG" 2>/dev/null; then
        echo -e "${RED}❌ Invalid JSON in Cursor MCP configuration${NC}"
        ISSUES=$((ISSUES + 1))
    else
        echo -e "${GREEN}✅ Cursor MCP JSON syntax is valid${NC}"
    fi

    if [ -f "$CLAUDE_CONFIG" ]; then
        if ! jq empty "$CLAUDE_CONFIG" 2>/dev/null; then
            echo -e "${RED}❌ Invalid JSON in Claude Desktop configuration${NC}"
            ISSUES=$((ISSUES + 1))
        else
            echo -e "${GREEN}✅ Claude Desktop JSON syntax is valid${NC}"
        fi
    fi
    echo ""

    # Count servers
    SERVER_COUNT=$(jq '.mcpServers | length' "$MCP_CONFIG")
    echo -e "${BLUE}📊 Server Count: ${GREEN}$SERVER_COUNT servers configured${NC}"
    echo ""

    # List servers
    echo -e "${BLUE}📋 Configured MCP Servers:${NC}"
    jq -r '.mcpServers | keys[]' "$MCP_CONFIG" | while read server; do
        echo "  • $server"
    done
    echo ""

    # Check for expected servers
    echo -e "${BLUE}🔍 Checking Expected Servers...${NC}"
    EXPECTED_SERVERS=(
        "agent-coordination-mcp"
    )

    for server in "${EXPECTED_SERVERS[@]}"; do
        if jq -e ".mcpServers.\"$server\"" "$MCP_CONFIG" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✅ $server${NC}"
        else
            echo -e "  ${YELLOW}⚠️  $server (missing)${NC}"
        fi
    done
    echo ""

    # Check for environment variable syntax errors
    echo -e "${BLUE}🔍 Checking Environment Variables...${NC}"
    if jq -r '.mcpServers | to_entries[] | .value.env | to_entries[] | select(.key | contains("=")) | .key' "$MCP_CONFIG" 2>/dev/null | grep -q "="; then
        echo -e "${RED}❌ Found environment variables with syntax errors (key contains '=')${NC}"
        jq -r '.mcpServers | to_entries[] | "\(.key): \(.value.env | to_entries[] | select(.key | contains("=")) | .key)"' "$MCP_CONFIG" 2>/dev/null
        ISSUES=$((ISSUES + 1))
    else
        echo -e "${GREEN}✅ Environment variable syntax is correct${NC}"
    fi
    echo ""
fi

# Check custom MCP server builds
echo -e "${BLUE}🔨 Checking Custom MCP Server Builds...${NC}"

MAIN_SERVER="$PROJECT_ROOT/mcp-server/dist/index.js"
COORD_SERVER="$PROJECT_ROOT/mcp-server/dist/agent-coordination.js"
PLAYWRIGHT_SERVER="$PROJECT_ROOT/mcp-server/playwright/dist/index.js"
FRONTEND_DIAG_SERVER="$PROJECT_ROOT/mcp-server/frontend-diagnostics/dist/index.js"

if [ -f "$MAIN_SERVER" ]; then
    echo -e "${GREEN}✅ antigravity server built${NC}"
else
    echo -e "${RED}❌ antigravity server not built${NC}"
    echo -e "${YELLOW}   Run: cd mcp-server && npm install && npm run build${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ -f "$COORD_SERVER" ]; then
    echo -e "${GREEN}✅ agent-coordination-mcp server built${NC}"
else
    echo -e "${RED}❌ agent-coordination-mcp server not built${NC}"
    echo -e "${YELLOW}   Run: cd mcp-server && npm install && npm run build${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ -f "$PLAYWRIGHT_SERVER" ]; then
    echo -e "${GREEN}✅ antigravity-playwright server built${NC}"
else
    echo -e "${RED}❌ antigravity-playwright server not built${NC}"
    echo -e "${YELLOW}   Run: cd mcp-server/playwright && npm install && npm run build${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ -f "$FRONTEND_DIAG_SERVER" ]; then
    echo -e "${GREEN}✅ antigravity-frontend-diagnostics server built${NC}"
else
    echo -e "${RED}❌ antigravity-frontend-diagnostics server not built${NC}"
    echo -e "${YELLOW}   Run: cd mcp-server/frontend-diagnostics && npm install && npm run build${NC}"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# Check services
echo -e "${BLUE}🔍 Checking Required Services...${NC}"

# Check PostgreSQL service
if command -v pg_isready > /dev/null 2>&1; then
    if pg_isready -h localhost -p 5432 -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is running and accepting connections${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL is not accessible${NC}"
        echo -e "${YELLOW}   Note: postgres MCP server requires PostgreSQL${NC}"
        ISSUES=$((ISSUES + 1))
    fi
else
    echo -e "${YELLOW}⚠️  pg_isready command not found, skipping PostgreSQL check${NC}"
fi

# Check Redis service
if command -v redis-cli > /dev/null 2>&1; then
    if redis-cli -h localhost -p 6379 -a redis_pass ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis is not accessible${NC}"
        echo -e "${YELLOW}   Note: redis and agent-coordination-mcp servers require Redis${NC}"
        ISSUES=$((ISSUES + 1))
    fi
else
    echo -e "${YELLOW}⚠️  redis-cli command not found, skipping Redis check${NC}"
fi

# Check Prometheus service
if curl -s -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Prometheus is running and healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Prometheus is not accessible at http://localhost:9090${NC}"
    echo -e "${YELLOW}   Note: prometheus MCP server requires Prometheus${NC}"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# Check if configurations match
if [ -f "$MCP_CONFIG" ] && [ -f "$CLAUDE_CONFIG" ]; then
    echo -e "${BLUE}🔍 Checking Configuration Consistency...${NC}"

    CURSOR_SERVERS=$(jq -r '.mcpServers | keys | sort | @json' "$MCP_CONFIG")
    CLAUDE_SERVERS=$(jq -r '.mcpServers | keys | sort | @json' "$CLAUDE_CONFIG")

    if [ "$CURSOR_SERVERS" == "$CLAUDE_SERVERS" ]; then
        echo -e "${GREEN}✅ Both configurations have the same servers${NC}"
    else
        echo -e "${YELLOW}⚠️  Cursor and Claude Desktop configurations differ${NC}"
        echo -e "${YELLOW}   This may be intentional if you use different tools in each${NC}"
    fi
    echo ""
fi

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Verification Summary                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ All critical checks passed!${NC}"
    echo ""
    echo -e "${GREEN}🚀 MCP servers are properly configured and ready to use${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "  1. Restart Cursor IDE to load the updated configuration"
    echo "  2. Verify servers are working by checking IDE logs"
    echo "  3. Test MCP tools in your development workflow"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Found $ISSUES critical issue(s) that need attention${NC}"
    echo ""
    echo -e "${YELLOW}Please fix the issues listed above before using MCP servers${NC}"
    echo ""
    echo -e "${BLUE}Common Fixes:${NC}"
    echo "  • Build MCP servers: cd mcp-server && npm run build"
    echo "  • Start services: docker-compose up -d"
    echo "  • Check configuration: cat .cursor/mcp.json | jq"
    echo ""
    exit 1
fi
