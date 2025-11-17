#!/bin/bash

# Google OAuth Verification Script
# Verifies that Google OAuth is properly configured and servers are running

echo "🔍 Verifying Google OAuth Setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check file exists and has content
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        if [ -s "$file" ]; then
            echo -e "${GREEN}✅${NC} $description: $file"
            return 0
        else
            echo -e "${RED}❌${NC} $description: $file (empty)"
            ((ERRORS++))
            return 1
        fi
    else
        echo -e "${RED}❌${NC} $description: $file (not found)"
        ((ERRORS++))
        return 1
    fi
}

# Function to check environment variable in file
check_env_var() {
    local file=$1
    local var=$2
    local description=$3
    
    if grep -q "$var" "$file" 2>/dev/null; then
        local value=$(grep "$var" "$file" | cut -d'=' -f2 | tr -d ' ' | head -1)
        if [ -n "$value" ] && [ "$value" != "" ]; then
            echo -e "${GREEN}✅${NC} $description: Set"
            return 0
        else
            echo -e "${RED}❌${NC} $description: Empty value"
            ((ERRORS++))
            return 1
        fi
    else
        echo -e "${RED}❌${NC} $description: Not found"
        ((ERRORS++))
        return 1
    fi
}

# Function to check if port is in use
check_port() {
    local port=$1
    local service=$2
    
    if lsof -ti:$port >/dev/null 2>&1; then
        local pid=$(lsof -ti:$port | head -1)
        echo -e "${GREEN}✅${NC} $service: Running on port $port (PID: $pid)"
        return 0
    else
        echo -e "${RED}❌${NC} $service: Not running on port $port"
        ((ERRORS++))
        return 1
    fi
}

# Function to check if URL is accessible
check_url() {
    local url=$1
    local service=$2
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✅${NC} $service: Accessible at $url"
        return 0
    else
        echo -e "${YELLOW}⚠️${NC}  $service: Not accessible at $url (may still be starting)"
        ((WARNINGS++))
        return 1
    fi
}

echo "📁 Checking Configuration Files..."
echo ""

# Check frontend .env.local
check_file "frontend/.env.local" "Frontend config file"
if [ $? -eq 0 ]; then
    check_env_var "frontend/.env.local" "VITE_GOOGLE_CLIENT_ID" "Frontend Google Client ID"
fi

# Check backend .env.local
check_file "backend/.env.local" "Backend config file"
if [ $? -eq 0 ]; then
    check_env_var "backend/.env.local" "GOOGLE_CLIENT_ID" "Backend Google Client ID"
fi

echo ""
echo "🖥️  Checking Servers..."
echo ""

# Check if servers are running
check_port 1000 "Frontend server"
check_port 2000 "Backend server"

echo ""
echo "🌐 Checking Server Accessibility..."
echo ""

# Check if servers are accessible
check_url "http://localhost:1000" "Frontend"
check_url "http://localhost:2000/api/health" "Backend health"

echo ""
echo "📊 Summary..."
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "🎉 Google OAuth is properly configured!"
    echo ""
    echo "Next steps:"
    echo "  1. Visit: http://localhost:1000/login"
    echo "  2. Look for Google Sign-In button"
    echo "  3. Test authentication"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  All critical checks passed, but some warnings${NC}"
    echo ""
    echo "Servers may still be starting. Wait a few seconds and run again."
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS error(s)${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  And $WARNINGS warning(s)${NC}"
    fi
    echo ""
    echo "Please fix the errors above and run this script again."
    echo ""
    echo "Common fixes:"
    echo "  - Run: ./restart-servers.sh (to restart servers)"
    echo "  - Check: frontend/.env.local and backend/.env.local exist"
    echo "  - Verify: Environment variables are set correctly"
    exit 1
fi
