#!/bin/bash
# ============================================================================
# VERIFY MCP SETUP
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_DIR="$PROJECT_ROOT/mcp-server"
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "============================================================================"
echo "MCP SETUP VERIFICATION"
echo "============================================================================"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

# Check 1: Node.js
echo -e "${YELLOW}[1/7] Checking Node.js...${NC}"
if [ -f "/usr/local/Cellar/node/25.1.0/bin/node" ]; then
    NODE_VERSION=$(/usr/local/Cellar/node/25.1.0/bin/node --version)
    echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌ Node.js not found${NC}"
    ((CHECKS_FAILED++))
fi

# Check 2: MCP Server Build
echo -e "${YELLOW}[2/7] Checking MCP server build...${NC}"
if [ -f "$MCP_DIR/dist/index.js" ]; then
    echo -e "${GREEN}✅ MCP server built: $MCP_DIR/dist/index.js${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌ MCP server not built${NC}"
    ((CHECKS_FAILED++))
fi

# Check 3: Environment File
echo -e "${YELLOW}[3/7] Checking .env file...${NC}"
if [ -f "$MCP_DIR/.env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌ .env file not found${NC}"
    ((CHECKS_FAILED++))
fi

# Check 4: Claude Desktop Config
echo -e "${YELLOW}[4/7] Checking Claude Desktop config...${NC}"
if [ -f "$CLAUDE_CONFIG" ]; then
    echo -e "${GREEN}✅ Claude Desktop config installed${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Claude Desktop config not found${NC}"
    echo "   Run: cp claude-desktop-config.json \"$CLAUDE_CONFIG\""
fi

# Check 5: Dependencies
echo -e "${YELLOW}[5/7] Checking dependencies...${NC}"
if [ -d "$MCP_DIR/node_modules" ]; then
    PACKAGE_COUNT=$(find "$MCP_DIR/node_modules" -maxdepth 1 -type d | wc -l | tr -d ' ')
    echo -e "${GREEN}✅ Dependencies installed ($PACKAGE_COUNT packages)${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌ Dependencies not installed${NC}"
    ((CHECKS_FAILED++))
fi

# Check 6: Docker
echo -e "${YELLOW}[6/7] Checking Docker...${NC}"
if docker ps >/dev/null 2>&1; then
    CONTAINER_COUNT=$(docker ps --format "{{.Names}}" | grep -c "reconciliation-" || echo "0")
    echo -e "${GREEN}✅ Docker running ($CONTAINER_COUNT reconciliation containers)${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Docker not accessible${NC}"
fi

# Check 7: Backend Health
echo -e "${YELLOW}[7/7] Checking backend health...${NC}"
if curl -s -f http://localhost:2000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Backend not accessible${NC}"
fi

echo ""
echo "============================================================================"
echo "VERIFICATION SUMMARY"
echo "============================================================================"
echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
if [ $CHECKS_FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $CHECKS_FAILED${NC}"
fi
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ MCP setup is complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Restart Claude Desktop to load the MCP server"
    echo "2. Test MCP tools by asking Claude:"
    echo "   - 'Check Docker container status'"
    echo "   - 'Show backend health'"
    echo "   - 'List Redis keys'"
else
    echo -e "${YELLOW}⚠️  Some checks failed. Please review above.${NC}"
fi

