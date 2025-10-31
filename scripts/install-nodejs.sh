#!/bin/bash
# ============================================================================
# NODE.JS INSTALLATION HELPER
# ============================================================================
# This script helps install Node.js 18+ for MCP server setup
# ============================================================================

set -euo pipefail

echo "============================================================================"
echo "NODE.JS INSTALLATION HELPER"
echo "============================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detect OS
OS="$(uname -s)"
ARCH="$(uname -m)"

echo "Detected OS: $OS"
echo "Detected Architecture: $ARCH"
echo ""

# Check if Node.js is already installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js is already installed: $NODE_VERSION${NC}"
    
    NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v\([0-9]*\).*/\1/')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        echo -e "${GREEN}✅ Node.js version is 18 or higher - ready for MCP server${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Node.js version is less than 18 (found: $NODE_VERSION)${NC}"
        echo "Please upgrade Node.js to version 18 or higher"
    fi
else
    echo -e "${RED}❌ Node.js is not installed${NC}"
fi

echo ""
echo "============================================================================"
echo "INSTALLATION OPTIONS"
echo "============================================================================"
echo ""

# macOS
if [ "$OS" = "Darwin" ]; then
    echo -e "${BLUE}Option 1: Install via Homebrew (Recommended)${NC}"
    echo "  brew install node"
    echo ""
    
    echo -e "${BLUE}Option 2: Install via nvm (Node Version Manager)${NC}"
    echo "  # Install nvm first:"
    echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "  # Then install Node.js 18:"
    echo "  nvm install 18"
    echo "  nvm use 18"
    echo ""
    
    echo -e "${BLUE}Option 3: Download from nodejs.org${NC}"
    echo "  https://nodejs.org/en/download/"
    echo "  Download macOS installer (.pkg file)"
    echo ""
    
    # Check for Homebrew
    if command -v brew &> /dev/null; then
        echo -e "${GREEN}✅ Homebrew is installed${NC}"
        echo ""
        read -p "Would you like to install Node.js via Homebrew now? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Installing Node.js via Homebrew..."
            brew install node
            echo -e "${GREEN}✅ Node.js installed${NC}"
            node --version
            npm --version
        fi
    else
        echo -e "${YELLOW}⚠️  Homebrew is not installed${NC}"
        echo "Install Homebrew: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    fi
fi

# Linux
if [ "$OS" = "Linux" ]; then
    echo -e "${BLUE}Option 1: Install via NodeSource repository (Recommended)${NC}"
    echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    echo ""
    
    echo -e "${BLUE}Option 2: Install via nvm (Node Version Manager)${NC}"
    echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "  nvm install 18"
    echo "  nvm use 18"
    echo ""
    
    echo -e "${BLUE}Option 3: Download from nodejs.org${NC}"
    echo "  https://nodejs.org/en/download/"
    echo "  Download Linux binary (.tar.xz file)"
    echo ""
fi

# Windows (via WSL or Git Bash)
if [[ "$OS" == *"MINGW"* ]] || [[ "$OS" == *"MSYS"* ]]; then
    echo -e "${BLUE}Option 1: Install via nvm-windows${NC}"
    echo "  Download from: https://github.com/coreybutler/nvm-windows/releases"
    echo "  Install nvm-windows, then run: nvm install 18"
    echo ""
    
    echo -e "${BLUE}Option 2: Download installer from nodejs.org${NC}"
    echo "  https://nodejs.org/en/download/"
    echo "  Download Windows installer (.msi file)"
    echo ""
fi

echo ""
echo "============================================================================"
echo "VERIFICATION"
echo "============================================================================"
echo "After installation, verify with:"
echo "  node --version  # Should show v18.x.x or higher"
echo "  npm --version   # Should show 9.x.x or higher"
echo ""
echo "Then run the MCP server setup:"
echo "  ./scripts/setup-mcp-server.sh"
echo ""

