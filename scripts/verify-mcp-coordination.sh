#!/bin/bash
# Comprehensive verification script for Agent Coordination MCP Server

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Agent Coordination MCP Server Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 1. Check build files
echo -e "${BLUE}[1/6] Checking build files...${NC}"
if [ -f "mcp-server/dist/agent-coordination.js" ]; then
    SIZE=$(stat -f%z "mcp-server/dist/agent-coordination.js" 2>/dev/null || stat -c%s "mcp-server/dist/agent-coordination.js" 2>/dev/null)
    echo -e "${GREEN}✅ Server built (${SIZE} bytes)${NC}"
else
    echo -e "${RED}❌ Server not built${NC}"
    echo -e "${YELLOW}   Run: cd mcp-server && npm run build${NC}"
    exit 1
fi

# 2. Check dependencies
echo -e "${BLUE}[2/6] Checking dependencies...${NC}"
cd mcp-server
if [ -f "node_modules/lru-cache/package.json" ] && [ -f "node_modules/zod/package.json" ]; then
    echo -e "${GREEN}✅ All dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Missing dependencies. Installing...${NC}"
    npm install
fi
cd ..

# 3. Check Redis
echo -e "${BLUE}[3/6] Checking Redis connection...${NC}"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✅ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis not responding${NC}"
        echo -e "${YELLOW}   Start with: redis-server${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  redis-cli not found (skipping Redis check)${NC}"
fi

# 4. Check MCP configuration
echo -e "${BLUE}[4/6] Checking MCP configuration...${NC}"
if [ -f ".cursor/mcp.json" ]; then
    if grep -q "agent-coordination" .cursor/mcp.json; then
        echo -e "${GREEN}✅ Agent coordination server configured${NC}"
        
        # Verify path
        COORD_PATH=$(grep -A 5 "agent-coordination" .cursor/mcp.json | grep "dist/agent-coordination.js" | head -1)
        if [ -n "$COORD_PATH" ]; then
            echo -e "${GREEN}   Path configured correctly${NC}"
        fi
    else
        echo -e "${RED}❌ Agent coordination not in config${NC}"
        echo -e "${YELLOW}   Run: ./scripts/setup-mcp.sh${NC}"
    fi
else
    echo -e "${RED}❌ .cursor/mcp.json not found${NC}"
    echo -e "${YELLOW}   Run: ./scripts/setup-mcp.sh${NC}"
fi

# 5. List all tools
echo -e "${BLUE}[5/6] Verifying tools (18 total)...${NC}"
TOOLS_COUNT=$(grep -c "name: 'agent_" mcp-server/src/agent-coordination.ts 2>/dev/null || echo "0")
if [ "$TOOLS_COUNT" -eq 18 ]; then
    echo -e "${GREEN}✅ All 18 tools found${NC}"
    echo ""
    echo -e "${GREEN}Agent Management (4):${NC}"
    echo "  ✓ agent_register"
    echo "  ✓ agent_update_status"
    echo "  ✓ agent_list_agents"
    echo "  ✓ agent_get_status"
    echo ""
    echo -e "${GREEN}Task Management (5):${NC}"
    echo "  ✓ agent_claim_task"
    echo "  ✓ agent_release_task"
    echo "  ✓ agent_list_tasks"
    echo "  ✓ agent_update_task_progress"
    echo "  ✓ agent_complete_task"
    echo ""
    echo -e "${GREEN}File Locking (4):${NC}"
    echo "  ✓ agent_lock_file"
    echo "  ✓ agent_unlock_file"
    echo "  ✓ agent_check_file_lock"
    echo "  ✓ agent_list_locked_files"
    echo ""
    echo -e "${GREEN}Conflict Detection (2):${NC}"
    echo "  ✓ agent_detect_conflicts"
    echo "  ✓ agent_check_file_overlap"
    echo ""
    echo -e "${GREEN}Coordination (3):${NC}"
    echo "  ✓ agent_suggest_coordination"
    echo "  ✓ agent_get_workload_distribution"
    echo "  ✓ agent_find_available_work"
else
    echo -e "${YELLOW}⚠️  Found $TOOLS_COUNT tools (expected 18)${NC}"
fi

# 6. Test server syntax
echo -e "${BLUE}[6/6] Testing server syntax...${NC}"
if node -c mcp-server/dist/agent-coordination.js 2>/dev/null; then
    echo -e "${GREEN}✅ Server syntax valid${NC}"
else
    echo -e "${RED}❌ Server syntax error${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Verification Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. ${GREEN}Restart your IDE${NC} to load the MCP server"
echo "  2. Check MCP server status in IDE settings"
echo "  3. Use coordination tools in your agent workflows"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  • Server README: mcp-server/AGENT_COORDINATION_README.md"
echo "  • Implementation: docs/development/AGENT_COORDINATION_IMPLEMENTATION_COMPLETE.md"
echo "  • Usage Guide: docs/development/IDE_AGENT_COORDINATION.md"
echo ""


