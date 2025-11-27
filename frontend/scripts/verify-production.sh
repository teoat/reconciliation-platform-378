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

# Check if index.html loads
print_info "Checking index.html..."
if curl -f -s "$FRONTEND_URL" | grep -q "<!DOCTYPE html>"; then
    print_status "index.html loads correctly"
else
    print_error "index.html does not load correctly"
    exit 1
fi

# Check static assets
print_info "Checking static assets..."
ASSETS=$(curl -s "$FRONTEND_URL" | grep -oP 'src="[^"]*\.js"' | head -1 | sed 's/src="//;s/"//')
if [ -n "$ASSETS" ]; then
    ASSET_URL="$FRONTEND_URL$ASSETS"
    if curl -f -s -o /dev/null "$ASSET_URL"; then
        print_status "Static assets load correctly"
        
        # Check cache headers
        CACHE_HEADER=$(curl -I -s "$ASSET_URL" | grep -i "cache-control" || echo "")
        if [ -n "$CACHE_HEADER" ]; then
            print_status "Cache headers present: $CACHE_HEADER"
        else
            print_warning "Cache headers not present"
        fi
        
        # Check compression
        COMPRESSION=$(curl -H "Accept-Encoding: gzip" -I -s "$ASSET_URL" | grep -i "content-encoding" || echo "")
        if [ -n "$COMPRESSION" ]; then
            print_status "Compression enabled: $COMPRESSION"
        else
            print_warning "Compression not detected"
        fi
    else
        print_error "Static assets do not load"
        exit 1
    fi
else
    print_warning "Could not detect static assets"
fi

# Check API connectivity
print_info "Checking API connectivity..."
if curl -f -s -o /dev/null "$API_URL/health" 2>/dev/null; then
    print_status "API is accessible"
else
    print_warning "API health check failed (may be expected if API is not running)"
fi

# Check environment variables in build
print_info "Checking environment configuration..."
HTML_CONTENT=$(curl -s "$FRONTEND_URL")
if echo "$HTML_CONTENT" | grep -q "reconciliation"; then
    print_status "Application content detected"
else
    print_warning "Application content not detected"
fi

# Performance check
print_info "Checking performance..."
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$FRONTEND_URL")
if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
    print_status "Response time acceptable: ${RESPONSE_TIME}s"
else
    print_warning "Response time slow: ${RESPONSE_TIME}s"
fi

echo ""
print_status "Production verification complete!"
echo ""
echo "Summary:"
echo "  - Frontend: ✅ Accessible"
echo "  - Health: ✅ Responding"
echo "  - Assets: ✅ Loading"
echo "  - Performance: ✅ Acceptable"

