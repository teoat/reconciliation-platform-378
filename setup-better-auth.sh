#!/bin/bash
# Better Auth Quick Setup Script

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "╔═══════════════════════════════════════════════════════╗"
echo "║  Better Auth - Quick Setup                           ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Get DATABASE_URL from backend/.env
if [ -f "backend/.env" ]; then
    DB_URL=$(grep "^DATABASE_URL" backend/.env | cut -d= -f2- || echo "")
    if [ -n "$DB_URL" ]; then
        echo -e "${GREEN}✓${NC} Found DATABASE_URL from backend/.env"
        export DATABASE_URL="$DB_URL"
    else
        echo -e "${YELLOW}⚠${NC} DATABASE_URL not found in backend/.env"
        echo "Please set DATABASE_URL manually"
    fi
fi

# Generate JWT secret
JWT_SECRET=$(openssl rand -hex 32)
echo -e "${GREEN}✓${NC} Generated JWT_SECRET: ${JWT_SECRET:0:16}..."

# Step 1: Auth Server
echo ""
echo -e "${BLUE}[1/4] Setting up Auth Server...${NC}"
cd auth-server/

cat > .env << EOF
DATABASE_URL=$DATABASE_URL
PORT=3001
NODE_ENV=development
JWT_SECRET=$JWT_SECRET
BCRYPT_COST=12
SESSION_TIMEOUT_MINUTES=30
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/callback/google
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@yourdomain.com
FRONTEND_URL=http://localhost:5173
ENABLE_EMAIL_VERIFICATION=false
ENABLE_PASSWORD_RESET=false
ENABLE_OAUTH=false
LOG_LEVEL=info
EOF

echo -e "${GREEN}✓${NC} Auth server .env created"

# Step 2: Backend
echo ""
echo -e "${BLUE}[2/4] Updating Backend configuration...${NC}"
cd ../backend/

# Check if Better Auth config already exists
if ! grep -q "BETTER_AUTH_JWT_SECRET" .env 2>/dev/null; then
    cat >> .env << EOF

# Better Auth Configuration
AUTH_SERVER_URL=http://localhost:3001
BETTER_AUTH_JWT_SECRET=$JWT_SECRET
PREFER_BETTER_AUTH=true
ENABLE_DUAL_AUTH=true
ENABLE_BETTER_AUTH=true
TOKEN_CACHE_TTL=300
EOF
    echo -e "${GREEN}✓${NC} Backend .env updated"
else
    echo -e "${YELLOW}⚠${NC} Better Auth config already in backend/.env"
fi

# Step 3: Frontend
echo ""
echo -e "${BLUE}[3/4] Setting up Frontend configuration...${NC}"
cd ../frontend/

cat > .env.local << 'EOF'
VITE_API_BASE_URL=http://localhost:2000
VITE_WS_URL=ws://localhost:2000
VITE_AUTH_SERVER_URL=http://localhost:3001
VITE_ENABLE_BETTER_AUTH=true
VITE_ENABLE_DUAL_AUTH=true
VITE_ENABLE_OAUTH=false
VITE_SHOW_MIGRATION_BANNER=true
VITE_ENVIRONMENT=development
EOF

echo -e "${GREEN}✓${NC} Frontend .env.local created"

# Step 4: Database Migration
echo ""
echo -e "${BLUE}[4/4] Database Migrations...${NC}"
cd ../backend/

if [ -n "$DATABASE_URL" ]; then
    echo "Database URL: $DATABASE_URL"
    echo ""
    echo -e "${YELLOW}This will create Better Auth tables.${NC}"
    echo "Continue? (y/n)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        # Backup first
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        echo "Creating backup: $BACKUP_FILE"
        pg_dump $DATABASE_URL > "$BACKUP_FILE" || echo "Backup failed (continuing anyway)"
        
        # Run migration
        if psql $DATABASE_URL -f migrations/better_auth_compat.sql; then
            echo -e "${GREEN}✓${NC} Migration completed"
        else
            echo -e "${YELLOW}⚠${NC} Migration had warnings (might be okay if tables exist)"
        fi
    else
        echo "Skipped migration. Run manually:"
        echo "  psql \$DATABASE_URL -f backend/migrations/better_auth_compat.sql"
    fi
else
    echo -e "${YELLOW}⚠${NC} DATABASE_URL not set. Skipping migration."
    echo "Run manually: psql \$DATABASE_URL -f backend/migrations/better_auth_compat.sql"
fi

# Summary
cd ..
echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "  ${GREEN}Setup Complete!${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Next: Start services in 3 terminals:"
echo ""
echo -e "${BLUE}Terminal 1:${NC}"
echo "  cd auth-server/ && npm run dev"
echo ""
echo -e "${BLUE}Terminal 2:${NC}"  
echo "  cd backend/ && cargo run"
echo ""
echo -e "${BLUE}Terminal 3:${NC}"
echo "  cd frontend/ && npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
