#!/bin/bash
# ============================================================================
# QUICK INSTALL: MCP SERVER (All-in-One)
# ============================================================================
# This script installs Node.js (if needed) and sets up the MCP server
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "============================================================================"
echo "QUICK INSTALL: MCP SERVER"
echo "============================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Check/Install Node.js
echo -e "${BLUE}[Step 1/3] Checking Node.js installation...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v\([0-9]*\).*/\1/')
    
    if [ "$NODE_MAJOR" -ge 18 ]; then
        echo -e "${GREEN}✅ Node.js is installed: $NODE_VERSION (version 18+)${NC}"
    else
        echo -e "${YELLOW}⚠️  Node.js version is less than 18 (found: $NODE_VERSION)${NC}"
        echo -e "${BLUE}Installing Node.js 18+ via Homebrew...${NC}"
        
        if command -v brew &> /dev/null; then
            brew install node
            echo -e "${GREEN}✅ Node.js installed${NC}"
        else
            echo -e "${RED}❌ Homebrew not found. Please install Node.js manually from nodejs.org${NC}"
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Node.js is not installed${NC}"
    echo -e "${BLUE}Installing Node.js via Homebrew...${NC}"
    
    if command -v brew &> /dev/null; then
        brew install node
        echo -e "${GREEN}✅ Node.js installed${NC}"
    else
        echo -e "${RED}❌ Homebrew not found. Please install Node.js manually from nodejs.org${NC}"
        exit 1
    fi
fi

# Verify installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"
echo ""

# Step 2: Setup MCP Server
echo -e "${BLUE}[Step 2/3] Setting up MCP server...${NC}"
if [ ! -f "$PROJECT_ROOT/scripts/setup-mcp-server.sh" ]; then
    echo -e "${RED}❌ MCP setup script not found${NC}"
    exit 1
fi

# Run setup script
"$PROJECT_ROOT/scripts/setup-mcp-server.sh"
echo ""

# Step 3: Verify Installation
echo -e "${BLUE}[Step 3/3] Verifying installation...${NC}"
cd "$PROJECT_ROOT/mcp-server"

if [ -f "dist/index.js" ]; then
    echo -e "${GREEN}✅ MCP server compiled successfully${NC}"
else
    echo -e "${RED}❌ MCP server build not found${NC}"
    exit 1
fi

if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Environment file exists${NC}"
    echo -e "${YELLOW}⚠️  Please review .env file and update values if needed${NC}"
else
    echo -e "${YELLOW}⚠️  .env file not found, creating from template...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env from .env.example${NC}"
    else
        echo -e "${RED}❌ .env.example not found${NC}"
    fi
fi

echo ""
echo "============================================================================"
echo "MCP SERVER INSTALLATION COMPLETE"
echo "============================================================================"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo ""
echo "1. Review and update .env file (if needed):"
echo "   cd $PROJECT_ROOT/mcp-server"
echo "   nano .env  # or your preferred editor"
echo ""
echo "2. Test MCP server:"
echo "   cd $PROJECT_ROOT/mcp-server"
echo "   npm start"
echo "   # Press Ctrl+C to stop"
echo ""
echo "3. Configure your AI assistant:"
echo "   See: $PROJECT_ROOT/MCP_INSTALLATION_GUIDE.md"
echo "   or: $PROJECT_ROOT/QUICK_START_MCP.md"
echo ""
echo -e "${GREEN}✅ Ready to use!${NC}"
echo ""

