#!/bin/bash
# Production Verification Script
# Verifies frontend production deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
API_URL="${API_URL:-http://localhost:2000}"

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo "🚀 Starting Production Verification"
echo "Frontend URL: $FRONTEND_URL"
echo "API URL: $API_URL"
echo ""

# Check if frontend is accessible
print_info "Checking frontend accessibility..."
if curl -f -s -o /dev/null "$FRONTEND_URL"; then
    print_status "Frontend is accessible"
else
    print_error "Frontend is not accessible at $FRONTEND_URL"
    exit 1
fi

# Check health endpoint
print_info "Checking health endpoint..."
HEALTH_RESPONSE=$(curl -s "$FRONTEND_URL/health" || echo "")
if [ "$HEALTH_RESPONSE" = "healthy" ] || [ "$HEALTH_RESPONSE" = "ok" ]; then
    print_status "Health endpoint responding"
else
    print_warning "Health endpoint not responding correctly"
fi

print_status "Production verification complete!"
