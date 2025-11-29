#!/bin/bash
# Interactive Better Auth Setup Script
# Guides you through the setup process step-by-step

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║        Better Auth Interactive Setup                   ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+ first.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm first.${NC}"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  psql not found. Database tests will be skipped.${NC}"
fi

echo -e "${GREEN}✅ Prerequisites met${NC}"
echo ""

# Step 2: Install auth-server dependencies
echo -e "${BLUE}Step 2: Installing auth-server dependencies...${NC}"

cd auth-server

if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

echo ""

# Step 3: Configure environment
echo -e "${BLUE}Step 3: Configuring environment...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    
    # Get DATABASE_URL
    echo ""
    echo "Enter your PostgreSQL DATABASE_URL:"
    echo -e "${YELLOW}Example: postgresql://postgres:postgres@localhost:5432/reconciliation${NC}"
    read -p "DATABASE_URL: " DATABASE_URL
    
    # Get JWT_SECRET
    echo ""
    echo "Enter your JWT_SECRET (must be 32+ characters):"
    echo -e "${YELLOW}Tip: Generate with: openssl rand -base64 32${NC}"
    echo -e "${YELLOW}IMPORTANT: Must match your backend JWT_SECRET!${NC}"
    read -p "JWT_SECRET: " JWT_SECRET
    
    # Get GOOGLE_CLIENT_SECRET
    echo ""
    echo "Enter your GOOGLE_CLIENT_SECRET:"
    echo -e "${YELLOW}Get from: https://console.cloud.google.com/apis/credentials${NC}"
    read -p "GOOGLE_CLIENT_SECRET: " GOOGLE_CLIENT_SECRET
    
    # Create .env file
    cat > .env << EOF
# Better Auth Server Configuration

# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=$DATABASE_URL

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION_SECONDS=1800

# Google OAuth
GOOGLE_CLIENT_ID=600300535059-8jtb47bloe0jmj8b6ff4gpg2t5q5mg8n.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback/google

# Password Configuration
BCRYPT_COST=12
PASSWORD_MIN_LENGTH=8
PASSWORD_EXPIRATION_DAYS=90

# Session Configuration
SESSION_EXPIRY_SECONDS=1800
REFRESH_TOKEN_EXPIRY_SECONDS=604800

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:2000

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_MS=900000

# Logging
LOG_LEVEL=info
EOF

    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

echo ""

# Step 4: Test database connection
echo -e "${BLUE}Step 4: Testing database connection...${NC}"

if command -v psql &> /dev/null; then
    source .env
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        echo -e "${YELLOW}Make sure PostgreSQL is running and DATABASE_URL is correct${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Skipping database test (psql not available)${NC}"
fi

echo ""

# Step 5: Run database migrations
echo -e "${BLUE}Step 5: Running database migrations...${NC}"

npm run db:migrate || {
    echo -e "${RED}❌ Migrations failed${NC}"
    echo -e "${YELLOW}Check the error above and fix your DATABASE_URL${NC}"
    exit 1
}

echo -e "${GREEN}✅ Migrations completed${NC}"
echo ""

# Step 6: Update frontend .env
echo -e "${BLUE}Step 6: Updating frontend configuration...${NC}"

cd ../frontend

if [ -f ".env" ]; then
    if ! grep -q "VITE_AUTH_SERVER_URL" .env; then
        echo "" >> .env
        echo "# Better Auth Server" >> .env
        echo "VITE_AUTH_SERVER_URL=http://localhost:4000" >> .env
        echo -e "${GREEN}✅ Frontend .env updated${NC}"
    else
        echo -e "${GREEN}✅ Frontend already configured${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Frontend .env not found. Creating...${NC}"
    cp env.example .env 2>/dev/null || {
        cat > .env << EOF
VITE_AUTH_SERVER_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=600300535059-8jtb47bloe0jmj8b6ff4gpg2t5q5mg8n.apps.googleusercontent.com
VITE_API_BASE_URL=http://localhost:2000
VITE_WS_URL=ws://localhost:2000
EOF
    }
    echo -e "${GREEN}✅ Frontend .env created${NC}"
fi

# Install frontend dependencies if needed
if [ ! -d "node_modules" ] || [ ! -d "node_modules/better-auth" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

echo ""

# Step 7: Instructions to start
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║        ✅ Setup Complete!                              ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "1. Start the auth server:"
echo -e "   ${GREEN}cd auth-server && npm run dev${NC}"
echo ""
echo "2. In a new terminal, start the frontend:"
echo -e "   ${GREEN}cd frontend && npm run dev${NC}"
echo ""
echo "3. Open your browser:"
echo -e "   ${GREEN}http://localhost:3000/login${NC}"
echo ""
echo "4. Test authentication:"
echo -e "   ${GREEN}bash scripts/test-better-auth.sh${NC}"
echo ""
echo -e "${BLUE}Helpful commands:${NC}"
echo "  • Check auth server health: ${GREEN}curl http://localhost:4000/health${NC}"
echo "  • View all docs: ${GREEN}open BETTER_AUTH_INDEX.md${NC}"
echo "  • Get help: ${GREEN}cat NEXT_STEPS_GUIDE.md${NC}"
echo ""
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "  1. Set JWT_SECRET in auth-server/.env (must match backend!)"
echo "  2. Set DATABASE_URL in auth-server/.env"
echo "  3. Set GOOGLE_CLIENT_SECRET in auth-server/.env"
echo ""
echo -e "${GREEN}Happy testing! 🚀${NC}"

