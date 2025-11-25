#!/bin/bash
# Verify MCP configuration and server status
# This script checks if MCP servers are properly configured

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_CONFIG="$PROJECT_ROOT/.cursor/mcp.json"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verifying MCP Configuration...${NC}"
echo ""

# Check if config file exists
if [ ! -f "$MCP_CONFIG" ]; then
    echo -e "${RED}❌ MCP configuration file not found: $MCP_CONFIG${NC}"
    exit 1
fi

echo -e "${GREEN}✅ MCP configuration file exists${NC}"

# Check JSON validity
if ! jq empty "$MCP_CONFIG" 2>/dev/null; then
    echo -e "${RED}❌ Invalid JSON in MCP configuration${NC}"
    exit 1
fi

echo -e "${GREEN}✅ JSON syntax is valid${NC}"

# Count servers
SERVER_COUNT=$(jq '.mcpServers | length' "$MCP_CONFIG")
echo -e "${GREEN}✅ Found $SERVER_COUNT MCP servers${NC}"
echo ""

# List servers
echo -e "${BLUE}📋 Configured MCP Servers:${NC}"
jq -r '.mcpServers | keys[]' "$MCP_CONFIG" | while read server; do
    echo "  ✅ $server"
done
echo ""

# Check Prometheus service
echo -e "${BLUE}🔍 Checking Prometheus Service...${NC}"
if curl -s -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Prometheus is running and healthy${NC}"
    PROMETHEUS_STATUS="healthy"
else
    echo -e "${YELLOW}⚠️  Prometheus is not accessible at http://localhost:9090${NC}"
    echo -e "${YELLOW}   Note: Prometheus MCP server will fail if Prometheus is not running${NC}"
    PROMETHEUS_STATUS="not_running"
fi
echo ""

# Check PostgreSQL service
echo -e "${BLUE}🔍 Checking PostgreSQL Service...${NC}"
if pg_isready -h localhost -p 5432 -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is running and accepting connections${NC}"
    POSTGRES_STATUS="healthy"
else
    echo -e "${YELLOW}⚠️  PostgreSQL is not accessible${NC}"
    echo -e "${YELLOW}   Note: PostgreSQL MCP server will fail if PostgreSQL is not running${NC}"
    POSTGRES_STATUS="not_running"
fi
echo ""

# Check Redis service (for agent-coordination)
echo -e "${BLUE}🔍 Checking Redis Service...${NC}"
if redis-cli -h localhost -p 6379 ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is running${NC}"
    REDIS_STATUS="healthy"
else
    echo -e "${YELLOW}⚠️  Redis is not accessible${NC}"
    echo -e "${YELLOW}   Note: Agent-coordination MCP server requires Redis${NC}"
    REDIS_STATUS="not_running"
fi
echo ""

# Check custom MCP server build
echo -e "${BLUE}🔍 Checking Custom MCP Servers...${NC}"
CUSTOM_SERVER="$PROJECT_ROOT/mcp-server/dist/index.js"
AGENT_COORD_SERVER="$PROJECT_ROOT/mcp-server/dist/agent-coordination.js"

if [ -f "$CUSTOM_SERVER" ]; then
    echo -e "${GREEN}✅ reconciliation-platform server built${NC}"
else
    echo -e "${RED}❌ reconciliation-platform server not built${NC}"
    echo -e "${YELLOW}   Run: cd mcp-server && npm install && npm run build${NC}"
fi

if [ -f "$AGENT_COORD_SERVER" ]; then
    echo -e "${GREEN}✅ agent-coordination server built${NC}"
else
    echo -e "${RED}❌ agent-coordination server not built${NC}"
    echo -e "${YELLOW}   Run: cd mcp-server && npm install && npm run build${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Verification Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ISSUES=0

if [ "$PROMETHEUS_STATUS" != "healthy" ]; then
    echo -e "${YELLOW}⚠️  Prometheus service not running${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ "$POSTGRES_STATUS" != "healthy" ]; then
    echo -e "${YELLOW}⚠️  PostgreSQL service not running${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ "$REDIS_STATUS" != "healthy" ]; then
    echo -e "${YELLOW}⚠️  Redis service not running${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ ! -f "$CUSTOM_SERVER" ] || [ ! -f "$AGENT_COORD_SERVER" ]; then
    echo -e "${YELLOW}⚠️  Custom MCP servers not built${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo -e "${GREEN}🚀 Ready to use MCP servers in Cursor IDE${NC}"
    echo -e "${BLUE}   Restart Cursor IDE to apply the configuration${NC}"
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠️  Found $ISSUES issue(s) that need attention${NC}"
    echo -e "${BLUE}   Fix the issues above before using MCP servers${NC}"
    exit 1
fi

