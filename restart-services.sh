#!/bin/bash

# Script to restart backend and frontend services
# Usage: ./restart-services.sh

set -e

echo "🔄 Restarting Services for Authentication Fix"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if backend is running
echo -e "\n${YELLOW}Step 1: Checking backend...${NC}"
if lsof -Pi :2000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Backend is running on port 2000"
    echo "   Please stop it manually (Ctrl+C) and run: cd backend && cargo run"
else
    echo "✅ Backend is not running - ready to start"
    echo "   To start: cd backend && cargo run"
fi

# Step 2: Check if frontend is running
echo -e "\n${YELLOW}Step 2: Checking frontend...${NC}"
if lsof -Pi :1000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Frontend is running on port 1000"
    echo "   Please stop it manually (Ctrl+C)"
    echo "   Then run: cd frontend && rm -rf node_modules/.vite dist && npm run dev"
else
    echo "✅ Frontend is not running - ready to start"
    echo "   To start: cd frontend && rm -rf node_modules/.vite dist && npm run dev"
fi

# Step 3: Instructions
echo -e "\n${GREEN}📋 Next Steps:${NC}"
echo ""
echo "1. Open Terminal 1 (Backend):"
echo "   cd backend && cargo run"
echo "   Wait for: '🚀 Backend starting...' and 'Server running on http://0.0.0.0:2000'"
echo ""
echo "2. Open Terminal 2 (Frontend):"
echo "   cd frontend && rm -rf node_modules/.vite dist && npm run dev"
echo "   Wait for: 'Local: http://localhost:1000/'"
echo ""
echo "3. Test in Browser:"
echo "   Open http://localhost:1000/login"
echo "   Try login with: admin@example.com / password123"
echo ""
echo "4. Verify Backend:"
echo "   curl http://localhost:2000/api/health"
echo ""
echo "5. Test Login Endpoint:"
echo "   curl -X POST http://localhost:2000/api/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"test@example.com\",\"password\":\"test123\"}'"
