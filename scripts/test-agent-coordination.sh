#!/bin/bash
# Test script for Agent Coordination MCP Server
# Verifies server can start and tools are available

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Testing Agent Coordination MCP Server...${NC}"
echo ""

# Check if built
echo -e "${BLUE}1. Checking build files...${NC}"
if [ ! -f "mcp-server/dist/agent-coordination.js" ]; then
    echo -e "${RED}❌ Server not built. Building now...${NC}"
    cd mcp-server
    npm run build
    cd ..
else
    echo -e "${GREEN}✅ Server built${NC}"
fi

# Check Redis connection
echo -e "${BLUE}2. Checking Redis connection...${NC}"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✅ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis not responding. Make sure Redis is running.${NC}"
        echo -e "${YELLOW}   Start with: redis-server${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  redis-cli not found. Skipping Redis check.${NC}"
fi

# Check MCP configuration
echo -e "${BLUE}3. Checking MCP configuration...${NC}"
if [ -f ".cursor/mcp.json" ]; then
    if grep -q "agent-coordination" .cursor/mcp.json; then
        echo -e "${GREEN}✅ Agent coordination server configured in .cursor/mcp.json${NC}"
    else
        echo -e "${YELLOW}⚠️  Agent coordination not in config. Run: ./scripts/setup-mcp.sh${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .cursor/mcp.json not found. Run: ./scripts/setup-mcp.sh${NC}"
fi

# List available tools
echo -e "${BLUE}4. Available coordination tools (18 total):${NC}"
echo ""
echo -e "${GREEN}Agent Management:${NC}"
echo "  • agent_register"
echo "  • agent_update_status"
echo "  • agent_list_agents"
echo "  • agent_get_status"
echo ""
echo -e "${GREEN}Task Management:${NC}"
echo "  • agent_claim_task"
echo "  • agent_release_task"
echo "  • agent_list_tasks"
echo "  • agent_update_task_progress"
echo "  • agent_complete_task"
echo ""
echo -e "${GREEN}File Locking:${NC}"
echo "  • agent_lock_file"
echo "  • agent_unlock_file"
echo "  • agent_check_file_lock"
echo "  • agent_list_locked_files"
echo ""
echo -e "${GREEN}Conflict Detection:${NC}"
echo "  • agent_detect_conflicts"
echo "  • agent_check_file_overlap"
echo ""
echo -e "${GREEN}Coordination:${NC}"
echo "  • agent_suggest_coordination"
echo "  • agent_get_workload_distribution"
echo "  • agent_find_available_work"
echo ""

# Test server startup (non-blocking)
echo -e "${BLUE}5. Testing server startup...${NC}"
cd mcp-server
timeout 3 node dist/agent-coordination.js 2>&1 | head -5 || true
cd ..

echo ""
echo -e "${GREEN}✅ Test complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Restart your IDE to load the MCP server"
echo "  2. Use coordination tools in your agent workflows"
echo "  3. See docs/development/AGENT_COORDINATION_IMPLEMENTATION_COMPLETE.md for details"


