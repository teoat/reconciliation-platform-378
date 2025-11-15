#!/bin/bash

# MCP Server Validation Script
# Tests all configured MCP servers to verify they're working correctly

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MCP_CONFIG="$PROJECT_ROOT/.cursor/mcp.json"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 MCP Server Validation"
echo "========================"
echo ""

# Check if MCP config exists
if [ ! -f "$MCP_CONFIG" ]; then
    echo -e "${RED}❌ MCP config not found: $MCP_CONFIG${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} MCP config found: $MCP_CONFIG"
echo ""

# Function to check if command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}❌ $1 is not installed${NC}"
        return 1
    fi
}

# Function to test npx package
test_npx_package() {
    local package=$1
    local name=$2
    
    echo -n "Testing $name... "
    if npx -y "$package" --help &> /dev/null 2>&1 || timeout 5 npx -y "$package" &> /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠${NC}  Package may not exist or may need configuration"
        return 1
    fi
}

# Check prerequisites
echo "📋 Prerequisites Check:"
check_command "npx" || {
    echo -e "${RED}❌ npx is required but not installed${NC}"
    exit 1
}
echo ""

# Check Docker
echo "🐳 Docker Status:"
if docker ps &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker daemon is running"
    if docker ps | grep -q postgres; then
        echo -e "${GREEN}✓${NC} PostgreSQL container is running"
    else
        echo -e "${YELLOW}⚠${NC}  PostgreSQL container is not running"
        echo "   Run: docker-compose up -d postgres"
    fi
    if docker ps | grep -q prometheus; then
        echo -e "${GREEN}✓${NC} Prometheus container is running"
    else
        echo -e "${YELLOW}⚠${NC}  Prometheus container is not running"
    fi
else
    echo -e "${YELLOW}⚠${NC}  Docker daemon is not running"
fi
echo ""

# Check Git
echo "📂 Git Status:"
if command -v git &> /dev/null; then
    echo -e "${GREEN}✓${NC} Git is installed"
    if [ -d "$PROJECT_ROOT/.git" ]; then
        echo -e "${GREEN}✓${NC} Git repository initialized"
        CURRENT_BRANCH=$(git -C "$PROJECT_ROOT" branch --show-current 2>/dev/null || echo "unknown")
        echo -e "${BLUE}ℹ${NC}  Current branch: $CURRENT_BRANCH"
    else
        echo -e "${YELLOW}⚠${NC}  Not a git repository"
    fi
else
    echo -e "${RED}❌ Git is not installed${NC}"
fi
echo ""

# Test MCP Server Packages
echo "🧪 Testing MCP Server Packages:"
echo ""

test_npx_package "@modelcontextprotocol/server-filesystem" "Filesystem MCP"
test_npx_package "@modelcontextprotocol/server-postgres" "PostgreSQL MCP"
test_npx_package "@modelcontextprotocol/server-git" "Git MCP"
test_npx_package "@modelcontextprotocol/server-docker" "Docker MCP"
test_npx_package "@modelcontextprotocol/server-github" "GitHub MCP"
test_npx_package "@modelcontextprotocol/server-brave-search" "Brave Search MCP"
test_npx_package "@modelcontextprotocol/server-prometheus" "Prometheus MCP"

echo ""
echo "📊 Validation Summary:"
echo "======================"
echo ""
echo "✅ Core servers that should work immediately:"
echo "   - Filesystem MCP (no credentials needed)"
echo "   - Git MCP (uses current repository)"
echo "   - Docker MCP (if Docker daemon is running)"
echo "   - Prometheus MCP (if Prometheus is running at localhost:9090)"
echo ""
echo "⚠️  Servers that need configuration:"
echo "   - PostgreSQL MCP (connection string configured, but container may not be running)"
echo "   - GitHub MCP (requires personal access token)"
echo "   - Brave Search MCP (requires API key)"
echo ""
echo "📝 Next Steps:"
echo "1. Start PostgreSQL container: docker-compose up -d postgres"
echo "2. Get GitHub token from: https://github.com/settings/tokens"
echo "3. Get Brave API key from: https://brave.com/search/api/"
echo "4. Update .cursor/mcp.json with actual tokens/keys"
echo "5. Restart IDE to load MCP servers"
echo ""

