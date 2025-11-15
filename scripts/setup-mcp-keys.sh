#!/bin/bash

# MCP Server Configuration Setup Script
# This script helps configure MCP server API keys and connection strings

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MCP_CONFIG="$PROJECT_ROOT/.cursor/mcp.json"

echo "🔧 MCP Server Configuration Setup"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${GREEN}✓${NC} Found .env file"
    source "$PROJECT_ROOT/.env"
else
    echo -e "${YELLOW}⚠${NC}  No .env file found"
fi

# Function to update MCP config
update_mcp_config() {
    local key=$1
    local value=$2
    local description=$3
    
    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠${NC}  $description not set"
        return 1
    fi
    
    # Use sed to update the JSON file (simple approach)
    # Note: This is a basic implementation - for production, use jq
    echo -e "${GREEN}✓${NC} $description found"
    return 0
}

# Check PostgreSQL connection
echo "📊 Checking PostgreSQL Connection..."
if docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
    POSTGRES_USER=${POSTGRES_USER:-postgres}
    POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres_pass}
    POSTGRES_DB=${POSTGRES_DB:-reconciliation_app}
    POSTGRES_HOST=${POSTGRES_HOST:-localhost}
    POSTGRES_PORT=${POSTGRES_PORT:-5432}
    
    POSTGRES_CONNECTION="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
    echo -e "${GREEN}✓${NC} PostgreSQL connection string:"
    echo "   $POSTGRES_CONNECTION"
else
    echo -e "${YELLOW}⚠${NC}  PostgreSQL container not running"
    echo "   Run: docker-compose up -d postgres"
fi

echo ""
echo "🔑 API Keys Check..."
echo ""

# Check GitHub token
if [ -n "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]; then
    echo -e "${GREEN}✓${NC} GitHub token found"
else
    echo -e "${YELLOW}⚠${NC}  GitHub token not set"
    echo "   Get from: https://github.com/settings/tokens"
fi

# Check Brave API key
if [ -n "${BRAVE_API_KEY:-}" ]; then
    echo -e "${GREEN}✓${NC} Brave Search API key found"
else
    echo -e "${YELLOW}⚠${NC}  Brave Search API key not set"
    echo "   Get from: https://brave.com/search/api/"
fi

echo ""
echo "📝 Next Steps:"
echo "1. Update .cursor/mcp.json with the values above"
echo "2. For GitHub token: https://github.com/settings/tokens"
echo "3. For Brave API key: https://brave.com/search/api/"
echo "4. Restart IDE after configuration"
echo ""

# Generate connection string for easy copy-paste
if [ -n "${POSTGRES_CONNECTION:-}" ]; then
    echo "💡 PostgreSQL Connection String (copy to .cursor/mcp.json):"
    echo "   \"POSTGRES_CONNECTION_STRING\": \"$POSTGRES_CONNECTION\""
    echo ""
fi

