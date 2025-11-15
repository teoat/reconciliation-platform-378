#!/bin/bash

# MCP Server Quick Test Script
# Provides simple commands to test each MCP server from the IDE

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🧪 MCP Server Test Commands"
echo "==========================="
echo ""
echo "After restarting your IDE, try these commands to test each MCP server:"
echo ""

echo -e "${BLUE}1. Filesystem MCP${NC}"
echo "   Command: \"List all TypeScript files in frontend/src\""
echo "   Expected: Directory listing of TypeScript files"
echo ""

echo -e "${BLUE}2. Git MCP${NC}"
echo "   Command: \"Show current git branch and last commit\""
echo "   Expected: Current branch name and commit information"
echo ""

echo -e "${BLUE}3. Docker MCP${NC}"
echo "   Command: \"List all running Docker containers\""
echo "   Expected: List of running containers"
echo ""

echo -e "${BLUE}4. Prometheus MCP${NC}"
echo "   Command: \"Query Prometheus for HTTP request duration metrics\""
echo "   Expected: Metrics data from Prometheus"
echo ""

echo -e "${BLUE}5. PostgreSQL MCP${NC}"
echo "   Command: \"Show all tables in the database\""
echo "   Expected: List of database tables"
echo "   Note: Requires PostgreSQL container to be running"
echo ""

echo -e "${BLUE}6. GitHub MCP${NC}"
echo "   Command: \"List open issues in the repository\""
echo "   Expected: List of open GitHub issues"
echo "   Note: Requires GitHub personal access token"
echo ""

echo -e "${BLUE}7. Brave Search MCP${NC}"
echo "   Command: \"Search for Actix-Web 4.4 best practices\""
echo "   Expected: Search results from Brave Search"
echo "   Note: Requires Brave Search API key"
echo ""

echo -e "${GREEN}✅ Test Checklist:${NC}"
echo "[ ] Filesystem MCP - List files"
echo "[ ] Git MCP - Show branch"
echo "[ ] Docker MCP - List containers"
echo "[ ] Prometheus MCP - Query metrics"
echo "[ ] PostgreSQL MCP - List tables"
echo "[ ] GitHub MCP - List issues"
echo "[ ] Brave Search MCP - Search query"
echo ""

echo "💡 Tip: Start with the servers that don't require credentials (1-4),"
echo "   then configure and test the others (5-7)."
echo ""

