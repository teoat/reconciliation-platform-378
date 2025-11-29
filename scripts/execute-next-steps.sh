#!/bin/bash
#
# Interactive Better Auth Deployment Helper
#
# This script walks you through deploying Better Auth step-by-step

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Function to pause and wait for user
pause() {
    echo ""
    echo -e "${CYAN}Press Enter to continue (Ctrl+C to exit)...${NC}"
    read
}

# Function to ask yes/no question
ask_yes_no() {
    local question=$1
    echo -e "${YELLOW}$question (y/n)?${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Header
clear
echo "═══════════════════════════════════════════════════════"
echo "  Better Auth - Interactive Deployment Helper"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "This script will help you deploy Better Auth step-by-step."
echo ""
pause

# ============================================================================
# STEP 1: Pre-Flight Validation
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 1: Pre-Flight Validation${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${CYAN}Checking prerequisites...${NC}"
echo ""

# Check Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} npm installed: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check Rust/Cargo
if command -v cargo >/dev/null 2>&1; then
    CARGO_VERSION=$(cargo --version | cut -d' ' -f2)
    echo -e "${GREEN}✓${NC} Cargo installed: $CARGO_VERSION"
else
    echo -e "${YELLOW}⚠${NC} Cargo not found. Rust backend won't be built."
fi

# Check psql
if command -v psql >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} PostgreSQL client (psql) installed"
else
    echo -e "${YELLOW}⚠${NC} psql not found. Database operations will need manual execution."
fi

echo ""
if ask_yes_no "Run full validation script"; then
    "$SCRIPT_DIR/validate-better-auth-implementation.sh"
    echo ""
    pause
fi

# ============================================================================
# STEP 2: Auth Server Setup
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 2: Auth Server Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$PROJECT_ROOT/auth-server"

# Check if .env exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠${NC} .env file already exists"
    if ask_yes_no "Backup and recreate .env"; then
        cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${GREEN}✓${NC} Backed up existing .env"
    else
        echo "Using existing .env file"
    fi
else
    echo -e "${CYAN}Creating .env file...${NC}"
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -hex 32)
    
    cat > .env << EOF
# Database
DATABASE_URL=postgresql://localhost:5432/reconciliation_db

# Server
PORT=3001
NODE_ENV=development

# Security
JWT_SECRET=$JWT_SECRET
BCRYPT_COST=12

# Session
SESSION_TIMEOUT_MINUTES=30

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/callback/google

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@yourdomain.com
EOF
    
    echo -e "${GREEN}✓${NC} Created .env with generated JWT_SECRET"
fi

echo ""
echo -e "${CYAN}Installing dependencies...${NC}"
if npm install; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${RED}✗${NC} Failed to install dependencies"
    exit 1
fi

echo ""
echo -e "${GREEN}Auth server ready!${NC}"
echo ""
echo "To start auth server, run in a separate terminal:"
echo -e "${CYAN}  cd $PROJECT_ROOT/auth-server${NC}"
echo -e "${CYAN}  npm run dev${NC}"
echo ""
pause

# ============================================================================
# STEP 3: Database Migrations
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 3: Database Migrations${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$PROJECT_ROOT/backend"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠${NC} DATABASE_URL not set in environment"
    echo "Please set it: export DATABASE_URL=postgresql://..."
    echo ""
    if ask_yes_no "Skip database migration for now"; then
        echo "Skipping migration. Run manually later:"
        echo -e "${CYAN}  psql \$DATABASE_URL -f backend/migrations/better_auth_compat.sql${NC}"
    else
        exit 1
    fi
else
    echo -e "${CYAN}Database URL: $DATABASE_URL${NC}"
    echo ""
    
    if ask_yes_no "Backup database before migration"; then
        BACKUP_FILE="backup_before_better_auth_$(date +%Y%m%d_%H%M%S).sql"
        echo "Creating backup: $BACKUP_FILE"
        if pg_dump $DATABASE_URL > "$BACKUP_FILE"; then
            echo -e "${GREEN}✓${NC} Database backed up"
        else
            echo -e "${RED}✗${NC} Backup failed"
            if ! ask_yes_no "Continue without backup"; then
                exit 1
            fi
        fi
    fi
    
    echo ""
    echo "Migration will create:"
    echo "  - better_auth_sessions table"
    echo "  - better_auth_accounts table"
    echo "  - better_auth_verification_tokens table"
    echo "  - auth_audit_log table"
    echo "  - User table extensions"
    echo ""
    
    if ask_yes_no "Run database migration now"; then
        if psql $DATABASE_URL -f migrations/better_auth_compat.sql; then
            echo -e "${GREEN}✓${NC} Migration completed successfully"
            
            # Verify tables
            echo ""
            echo "Verifying tables created..."
            psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%better_auth%' OR table_name = 'auth_audit_log' ORDER BY table_name;"
        else
            echo -e "${RED}✗${NC} Migration failed"
            exit 1
        fi
    else
        echo "Skipping migration. Run manually later."
    fi
fi

pause

# ============================================================================
# STEP 4: Backend Configuration
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 4: Backend Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$PROJECT_ROOT/backend"

# Get JWT_SECRET from auth-server
if [ -f "../auth-server/.env" ]; then
    JWT_SECRET=$(grep "^JWT_SECRET=" ../auth-server/.env | cut -d= -f2)
    echo -e "${GREEN}✓${NC} Found JWT_SECRET from auth-server"
else
    echo -e "${YELLOW}⚠${NC} Could not find auth-server .env"
    JWT_SECRET=""
fi

if [ -f ".env" ]; then
    # Check if Better Auth config already exists
    if grep -q "BETTER_AUTH_JWT_SECRET" .env; then
        echo -e "${YELLOW}⚠${NC} Better Auth config already exists in .env"
    else
        echo -e "${CYAN}Adding Better Auth configuration to .env...${NC}"
        cat >> .env << EOF

# ============================================================================
# Better Auth Configuration (Added $(date +%Y-%m-%d))
# ============================================================================

# Auth Server URL
AUTH_SERVER_URL=http://localhost:3001

# JWT Secret (MUST match auth-server JWT_SECRET!)
BETTER_AUTH_JWT_SECRET=$JWT_SECRET

# Feature Flags
PREFER_BETTER_AUTH=true
ENABLE_DUAL_AUTH=true
ENABLE_BETTER_AUTH=true

# Token Cache
TOKEN_CACHE_TTL=300
EOF
        echo -e "${GREEN}✓${NC} Backend .env updated"
    fi
else
    echo -e "${RED}✗${NC} Backend .env not found"
    echo "Please create backend/.env with Better Auth configuration"
fi

pause

# ============================================================================
# STEP 5: Frontend Configuration
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 5: Frontend Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$PROJECT_ROOT/frontend"

if [ -f ".env.local" ]; then
    echo -e "${YELLOW}⚠${NC} .env.local already exists"
    if ! ask_yes_no "Keep existing .env.local"; then
        cp .env.local ".env.local.backup.$(date +%Y%m%d_%H%M%S)"
    else
        echo "Using existing .env.local"
        pause
        cd "$PROJECT_ROOT"
        echo ""
        echo -e "${GREEN}Setup complete!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Start auth server in Terminal 1:"
        echo -e "   ${CYAN}cd auth-server/ && npm run dev${NC}"
        echo ""
        echo "2. Start backend in Terminal 2:"
        echo -e "   ${CYAN}cd backend/ && cargo run${NC}"
        echo ""
        echo "3. Start frontend in Terminal 3:"
        echo -e "   ${CYAN}cd frontend/ && npm run dev${NC}"
        echo ""
        echo "4. Open browser to: http://localhost:5173"
        echo ""
        echo "5. Test registration and login"
        echo ""
        exit 0
    fi
fi

echo -e "${CYAN}Creating .env.local for development...${NC}"
cat > .env.local << 'EOF'
# API Configuration
VITE_API_BASE_URL=http://localhost:2000
VITE_WS_URL=ws://localhost:2000

# Better Auth Configuration
VITE_AUTH_SERVER_URL=http://localhost:3001

# Feature Flags - Start with Better Auth ENABLED for testing
VITE_ENABLE_BETTER_AUTH=true
VITE_ENABLE_DUAL_AUTH=true
VITE_ENABLE_OAUTH=true
VITE_ENABLE_EMAIL_VERIFICATION=true
VITE_ENABLE_PASSWORD_RESET=true
VITE_SHOW_MIGRATION_BANNER=true

# OAuth (optional)
VITE_GOOGLE_CLIENT_ID=

# Environment
VITE_ENVIRONMENT=development
EOF

echo -e "${GREEN}✓${NC} Frontend .env.local created"

pause

# ============================================================================
# SUMMARY
# ============================================================================
cd "$PROJECT_ROOT"

echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "  ${GREEN}Setup Complete!${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "✓ Auth server configured"
echo "✓ Database migrations ready"
echo "✓ Backend configured"
echo "✓ Frontend configured"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Start auth server in Terminal 1:"
echo -e "   ${CYAN}cd auth-server/${NC}"
echo -e "   ${CYAN}npm run dev${NC}"
echo ""
echo "2. Start backend in Terminal 2:"
echo -e "   ${CYAN}cd backend/${NC}"
echo -e "   ${CYAN}cargo run${NC}"
echo ""
echo "3. Start frontend in Terminal 3:"
echo -e "   ${CYAN}cd frontend/${NC}"
echo -e "   ${CYAN}npm run dev${NC}"
echo ""
echo "4. Open browser to: ${CYAN}http://localhost:5173${NC}"
echo ""
echo "5. Test the following:"
echo "   - Register new account"
echo "   - Login with credentials"
echo "   - Check localStorage for 'better-auth-token'"
echo "   - Reload page (should stay logged in)"
echo "   - Logout"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "   - Quick Start: BETTER_AUTH_QUICK_START.md"
echo "   - Detailed Steps: NEXT_STEPS_EXECUTION.md"
echo "   - Rollout Guide: docs/deployment/BETTER_AUTH_ROLLOUT_GUIDE.md"
echo ""
echo -e "${GREEN}Good luck with deployment! 🚀${NC}"
echo ""

