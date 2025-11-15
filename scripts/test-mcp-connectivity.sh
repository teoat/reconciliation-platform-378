#!/bin/bash

# MCP Server Connectivity Test Script
# Tests system readiness for MCP servers (before IDE restart)

set -e

echo "🧪 MCP Server Connectivity Tests"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

# Test 1: Docker
echo "1️⃣  Testing Docker..."
if command -v docker &> /dev/null; then
    if docker ps &> /dev/null; then
        CONTAINERS=$(docker ps --format "{{.Names}}" 2>/dev/null | wc -l | tr -d ' ')
        echo -e "${GREEN}✅ Docker is running (${CONTAINERS} containers)${NC}"
        PASSED=$((PASSED + 1))
        
        # Check for PostgreSQL
        if docker ps --format "{{.Names}}" 2>/dev/null | grep -q postgres; then
            echo -e "   ${GREEN}✅ PostgreSQL container is running${NC}"
            PASSED=$((PASSED + 1))
        else
            echo -e "   ${YELLOW}⚠️  PostgreSQL container not running (start with: docker-compose up -d postgres)${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${RED}❌ Docker daemon not running${NC}"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${RED}❌ Docker not installed${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 2: Git
echo "2️⃣  Testing Git..."
if command -v git &> /dev/null; then
    if git rev-parse --git-dir &> /dev/null; then
        BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
        LAST_COMMIT=$(git log -1 --oneline 2>/dev/null || echo "no commits")
        echo -e "${GREEN}✅ Git repository initialized${NC}"
        echo -e "   Branch: ${BRANCH}"
        echo -e "   Last commit: ${LAST_COMMIT}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ Not in a git repository${NC}"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${RED}❌ Git not installed${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 3: Node.js/npx
echo "3️⃣  Testing Node.js/npx..."
if command -v npx &> /dev/null; then
    NPX_VERSION=$(npx --version 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✅ npx is available (version: ${NPX_VERSION})${NC}"
    PASSED=$((PASSED + 1))
elif command -v node &> /dev/null; then
    NODE_VERSION=$(node --version 2>/dev/null || echo "unknown")
    echo -e "${YELLOW}⚠️  Node.js installed (${NODE_VERSION}) but npx not in PATH${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${RED}❌ Node.js/npx not installed${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 4: Prometheus
echo "4️⃣  Testing Prometheus..."
if curl -s http://localhost:9090/api/v1/status/config &> /dev/null; then
    echo -e "${GREEN}✅ Prometheus is accessible at localhost:9090${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  Prometheus not accessible at localhost:9090 (may not be running)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Test 5: PostgreSQL Connection
echo "5️⃣  Testing PostgreSQL connection..."
if command -v psql &> /dev/null; then
    if PGPASSWORD=postgres_pass psql -h localhost -p 5432 -U postgres -d reconciliation_app -c "SELECT 1;" &> /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is accessible${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠️  PostgreSQL connection failed (check docker-compose up -d postgres)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  psql not installed (cannot test PostgreSQL connection)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Test 6: MCP Configuration File
echo "6️⃣  Testing MCP configuration..."
if [ -f ".cursor/mcp.json" ]; then
    if command -v jq &> /dev/null; then
        if jq empty .cursor/mcp.json 2>/dev/null; then
            SERVER_COUNT=$(jq '.mcpServers | length' .cursor/mcp.json 2>/dev/null || echo "0")
            echo -e "${GREEN}✅ MCP configuration file is valid (${SERVER_COUNT} servers)${NC}"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}❌ MCP configuration file has invalid JSON${NC}"
            FAILED=$((FAILED + 1))
        fi
    else
        echo -e "${YELLOW}⚠️  MCP configuration file exists (install jq to validate JSON)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}❌ MCP configuration file not found${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 7: Filesystem Access
echo "7️⃣  Testing filesystem access..."
if [ -d "frontend/src" ] && [ -d "backend/src" ]; then
    FILE_COUNT=$(find frontend/src backend/src -type f 2>/dev/null | wc -l | tr -d ' ')
    echo -e "${GREEN}✅ Filesystem access confirmed (${FILE_COUNT} files found)${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ Project structure not found${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

# Summary
echo "================================="
echo "📊 Test Summary:"
echo -e "${GREEN}✅ Passed: ${PASSED}${NC}"
if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warnings: ${WARNINGS}${NC}"
fi
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Failed: ${FAILED}${NC}"
    exit 1
fi

echo ""
if [ $FAILED -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All systems ready! Restart IDE to load MCP servers.${NC}"
elif [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Systems ready with warnings. Review above before restarting IDE.${NC}"
else
    echo -e "${RED}❌ Some systems need attention. Fix issues above before restarting IDE.${NC}"
    exit 1
fi

