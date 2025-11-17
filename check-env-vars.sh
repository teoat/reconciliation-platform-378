#!/bin/bash

# Environment Variable Validation Script
# Validates Google OAuth environment variables

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/backend"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Google OAuth Environment Variables Check"
echo "==========================================="
echo ""

ERRORS=0

# Check frontend .env.local
if [ -f "$FRONTEND_DIR/.env.local" ]; then
    echo "📁 Frontend: $FRONTEND_DIR/.env.local"
    
    if grep -q "VITE_GOOGLE_CLIENT_ID=" "$FRONTEND_DIR/.env.local"; then
        CLIENT_ID=$(grep "VITE_GOOGLE_CLIENT_ID=" "$FRONTEND_DIR/.env.local" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
        
        if [ -z "$CLIENT_ID" ] || [ "$CLIENT_ID" = "" ]; then
            echo -e "${RED}❌ VITE_GOOGLE_CLIENT_ID is empty${NC}"
            ((ERRORS++))
        elif [[ "$CLIENT_ID" =~ ^[0-9]+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$ ]]; then
            echo -e "${GREEN}✅ VITE_GOOGLE_CLIENT_ID is set correctly${NC}"
            echo "   Value: ${CLIENT_ID:0:20}..."
        else
            echo -e "${YELLOW}⚠️  VITE_GOOGLE_CLIENT_ID format may be incorrect${NC}"
            echo "   Expected format: [number]-[string].apps.googleusercontent.com"
            echo "   Current value: $CLIENT_ID"
        fi
    else
        echo -e "${RED}❌ VITE_GOOGLE_CLIENT_ID not found${NC}"
        ((ERRORS++))
    fi
else
    echo -e "${RED}❌ Frontend .env.local file not found${NC}"
    echo "   Expected: $FRONTEND_DIR/.env.local"
    ((ERRORS++))
fi

echo ""

# Check backend .env.local
if [ -f "$BACKEND_DIR/.env.local" ]; then
    echo "📁 Backend: $BACKEND_DIR/.env.local"
    
    if grep -q "GOOGLE_CLIENT_ID=" "$BACKEND_DIR/.env.local"; then
        CLIENT_ID=$(grep "GOOGLE_CLIENT_ID=" "$BACKEND_DIR/.env.local" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
        
        if [ -z "$CLIENT_ID" ] || [ "$CLIENT_ID" = "" ]; then
            echo -e "${YELLOW}⚠️  GOOGLE_CLIENT_ID is empty (optional for token validation)${NC}"
        elif [[ "$CLIENT_ID" =~ ^[0-9]+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$ ]]; then
            echo -e "${GREEN}✅ GOOGLE_CLIENT_ID is set correctly${NC}"
            echo "   Value: ${CLIENT_ID:0:20}..."
        else
            echo -e "${YELLOW}⚠️  GOOGLE_CLIENT_ID format may be incorrect${NC}"
            echo "   Expected format: [number]-[string].apps.googleusercontent.com"
        fi
    else
        echo -e "${YELLOW}⚠️  GOOGLE_CLIENT_ID not found (optional)${NC}"
    fi
    
    if grep -q "GOOGLE_CLIENT_SECRET=" "$BACKEND_DIR/.env.local"; then
        CLIENT_SECRET=$(grep "GOOGLE_CLIENT_SECRET=" "$BACKEND_DIR/.env.local" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
        
        if [ -z "$CLIENT_SECRET" ] || [ "$CLIENT_SECRET" = "" ]; then
            echo -e "${YELLOW}⚠️  GOOGLE_CLIENT_SECRET is empty (not currently used)${NC}"
        else
            echo -e "${GREEN}✅ GOOGLE_CLIENT_SECRET is set${NC}"
            echo "   Value: ${CLIENT_SECRET:0:10}... (hidden)"
        fi
    else
        echo -e "${YELLOW}⚠️  GOOGLE_CLIENT_SECRET not found (not currently used)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Backend .env.local file not found (optional)${NC}"
    echo "   Expected: $BACKEND_DIR/.env.local"
fi

echo ""

# Summary
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All required environment variables are configured!${NC}"
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS error(s)${NC}"
    echo ""
    echo "To fix:"
    echo "  1. Create or edit frontend/.env.local"
    echo "  2. Add: VITE_GOOGLE_CLIENT_ID=your-client-id-here"
    echo "  3. Restart frontend server"
    exit 1
fi

