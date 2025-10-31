#!/bin/bash
# ============================================================================
# MCP SERVER SETUP SCRIPT
# ============================================================================
# This script sets up the Model Context Protocol server for enhanced AI controls
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_DIR="$PROJECT_ROOT/mcp-server"

echo "============================================================================"
echo "MCP SERVER SETUP"
echo "============================================================================"
echo "Project Root: $PROJECT_ROOT"
echo "MCP Server Dir: $MCP_DIR"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Node.js
echo -e "${GREEN}[1/5] Checking Node.js installation...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js found: $NODE_VERSION"
    
    # Check version (need 18+)
    NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v\([0-9]*\).*/\1/')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo -e "${RED}❌ Node.js version must be 18 or higher (found: $NODE_VERSION)${NC}"
        echo "Please upgrade Node.js to version 18 or higher"
        exit 1
    fi
else
    echo -e "${RED}❌ Node.js not found${NC}"
    echo ""
    echo "Please install Node.js 18 or higher:"
    echo "  macOS: brew install node"
    echo "  Or download from: https://nodejs.org/"
    exit 1
fi

# Check npm
echo -e "${GREEN}[2/5] Checking npm installation...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm found: $NPM_VERSION"
else
    echo -e "${RED}❌ npm not found${NC}"
    echo "npm should come with Node.js. Please reinstall Node.js"
    exit 1
fi

# Navigate to MCP directory
echo -e "${GREEN}[3/5] Setting up MCP server directory...${NC}"
if [ ! -d "$MCP_DIR" ]; then
    echo -e "${RED}❌ MCP server directory not found at $MCP_DIR${NC}"
    exit 1
fi

cd "$MCP_DIR"
echo "✅ MCP server directory: $(pwd)"

# Install dependencies
echo -e "${GREEN}[4/5] Installing dependencies...${NC}"
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

if [ -d "node_modules" ]; then
    echo "⚠️  node_modules already exists, reinstalling..."
    rm -rf node_modules package-lock.json
fi

npm install --no-audit --no-fund
echo "✅ Dependencies installed"

# Build TypeScript
echo -e "${GREEN}[5/5] Building TypeScript...${NC}"
if [ ! -f "tsconfig.json" ]; then
    echo -e "${RED}❌ tsconfig.json not found${NC}"
    exit 1
fi

npm run build
echo "✅ TypeScript compiled"

# Setup environment file
echo ""
echo -e "${GREEN}[Bonus] Setting up environment configuration...${NC}"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
        echo ""
        echo -e "${YELLOW}⚠️  Please edit .env with your actual values:${NC}"
        echo "   DATABASE_URL=postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app"
        echo "   REDIS_URL=redis://:redis_pass@localhost:6379"
        echo "   PROJECT_ROOT=$PROJECT_ROOT"
    else
        echo -e "${YELLOW}⚠️  .env.example not found, creating .env template...${NC}"
        cat > .env <<EOF
DATABASE_URL=postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app
REDIS_URL=redis://:redis_pass@localhost:6379
PROJECT_ROOT=$PROJECT_ROOT
BACKEND_URL=http://localhost:2000
EOF
        echo "✅ Created .env template"
    fi
else
    echo "✅ .env file already exists"
fi

# Test server
echo ""
echo -e "${GREEN}[Test] Testing MCP server build...${NC}"
if [ -f "dist/index.js" ]; then
    echo "✅ Server binary found at dist/index.js"
    echo ""
    echo "To test the server, run:"
    echo "  cd $MCP_DIR && npm start"
else
    echo -e "${RED}❌ Server binary not found after build${NC}"
    exit 1
fi

echo ""
echo "============================================================================"
echo "MCP SERVER SETUP COMPLETE"
echo "============================================================================"
echo ""
echo "Next steps:"
echo "1. Edit $MCP_DIR/.env with your actual credentials"
echo "2. Configure your AI assistant (Claude Desktop/Cursor):"
echo "   See: $PROJECT_ROOT/MCP_INSTALLATION_GUIDE.md"
echo "3. Test the server: cd $MCP_DIR && npm start"
echo ""

