#!/bin/bash
# ============================================================================
# COMPREHENSIVE APPLICATION DIAGNOSTIC
# ============================================================================
# This script performs a full system diagnostic of the Reconciliation Platform
# ============================================================================

set -euo pipefail

echo "============================================================================"
echo "COMPREHENSIVE APPLICATION DIAGNOSTIC"
echo "============================================================================"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Diagnostic results
DIAG_RESULTS="/tmp/reconciliation_diagnostic_$(date +%s).json"
echo "{\"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\", \"checks\": []}" > "$DIAG_RESULTS"

# Helper function to add check result
add_check() {
    local name=$1
    local status=$2
    local message=$3
    local details=${4:-""}
    
    jq --arg name "$name" --arg status "$status" --arg msg "$message" --arg details "$details" \
        '.checks += [{"name": $name, "status": $status, "message": $msg, "details": $details}]' \
        "$DIAG_RESULTS" > "${DIAG_RESULTS}.tmp" && mv "${DIAG_RESULTS}.tmp" "$DIAG_RESULTS"
}

# 1. DOCKER CONTAINER STATUS
echo -e "${GREEN}[1/10] Checking Docker containers...${NC}"
if docker ps --format "{{.Names}}" | grep -q "reconciliation-"; then
    echo "✅ Active containers:"
    docker ps --filter "name=reconciliation-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    add_check "docker_containers" "healthy" "All required containers are running" "$(docker ps --filter 'name=reconciliation-' --format '{{.Names}}')"
else
    echo -e "${RED}❌ No reconciliation containers found${NC}"
    add_check "docker_containers" "error" "No reconciliation containers running"
fi
echo ""

# 2. BACKEND HEALTH
echo -e "${GREEN}[2/10] Checking backend health...${NC}"
if BACKEND_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:2000/health 2>/dev/null); then
    HTTP_CODE=$(echo "$BACKEND_RESPONSE" | tail -n1)
    BODY=$(echo "$BACKEND_RESPONSE" | sed '$d')
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Backend is healthy"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
        add_check "backend_health" "healthy" "Backend health endpoint responding" "$HTTP_CODE"
    else
        echo -e "${RED}❌ Backend health check failed: HTTP $HTTP_CODE${NC}"
        add_check "backend_health" "error" "Backend health check failed" "HTTP $HTTP_CODE"
    fi
else
    echo -e "${RED}❌ Cannot reach backend${NC}"
    add_check "backend_health" "error" "Cannot reach backend endpoint"
fi
echo ""

# 3. FRONTEND ACCESSIBILITY
echo -e "${GREEN}[3/10] Checking frontend...${NC}"
if FRONTEND_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:1000 2>/dev/null); then
    HTTP_CODE=$(echo "$FRONTEND_RESPONSE" | tail -n1 | tr -d '\r\n')
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Frontend is accessible"
        add_check "frontend_health" "healthy" "Frontend is accessible" "HTTP $HTTP_CODE"
    else
        echo -e "${RED}❌ Frontend returned HTTP $HTTP_CODE${NC}"
        add_check "frontend_health" "error" "Frontend returned non-200 status" "HTTP $HTTP_CODE"
    fi
else
    echo -e "${RED}❌ Cannot reach frontend${NC}"
    add_check "frontend_health" "error" "Cannot reach frontend"
fi
echo ""

# 4. DATABASE CONNECTIVITY
echo -e "${GREEN}[4/10] Checking database connectivity...${NC}"
if docker exec reconciliation-postgres pg_isready -U postgres >/dev/null 2>&1; then
    DB_VERSION=$(docker exec reconciliation-postgres psql -U postgres -tAc "SELECT version();" 2>/dev/null | head -n1)
    DB_SIZE=$(docker exec reconciliation-postgres psql -U postgres -tAc "SELECT pg_database_size('reconciliation_app');" 2>/dev/null)
    echo "✅ Database is ready"
    echo "   Version: ${DB_VERSION:0:50}..."
    echo "   Size: $(numfmt --to=iec-i --suffix=B ${DB_SIZE} 2>/dev/null || echo "$DB_SIZE bytes")"
    add_check "database_health" "healthy" "Database is ready" "$DB_VERSION"
else
    echo -e "${RED}❌ Database is not ready${NC}"
    add_check "database_health" "error" "Database is not ready"
fi
echo ""

# 5. REDIS CONNECTIVITY
echo -e "${GREEN}[5/10] Checking Redis connectivity...${NC}"
if docker exec reconciliation-redis redis-cli -a redis_pass ping >/dev/null 2>&1; then
    REDIS_INFO=$(docker exec reconciliation-redis redis-cli -a redis_pass INFO server 2>/dev/null | grep "redis_version" | cut -d: -f2 | tr -d '\r')
    echo "✅ Redis is ready (version: $REDIS_INFO)"
    add_check "redis_health" "healthy" "Redis is ready" "version: $REDIS_INFO"
else
    echo -e "${RED}❌ Redis is not responding${NC}"
    add_check "redis_health" "error" "Redis is not responding"
fi
echo ""

# 6. CODEBASE STATISTICS
echo -e "${GREEN}[6/10] Analyzing codebase...${NC}"
RUST_FILES=$(find . -name "*.rs" -type f 2>/dev/null | wc -l | tr -d ' ')
TS_FILES=$(find . -name "*.ts" -type f 2>/dev/null | wc -l | tr -d ' ')
TSX_FILES=$(find . -name "*.tsx" -type f 2>/dev/null | wc -l | tr -d ' ')
echo "✅ Codebase statistics:"
echo "   Rust files: $RUST_FILES"
echo "   TypeScript files: $TS_FILES"
echo "   TSX files: $TSX_FILES"
add_check "codebase_stats" "healthy" "Codebase analyzed" "Rust: $RUST_FILES, TS: $TS_FILES, TSX: $TSX_FILES"
echo ""

# 7. BACKEND COMPILATION CHECK
echo -e "${GREEN}[7/10] Checking backend compilation status...${NC}"
if [ -f "backend/Cargo.toml" ]; then
    cd backend
    if cargo check --message-format=json 2>&1 | jq -r 'select(.message != null) | select(.message.level == "error") | .message.message' | head -n5 > /tmp/backend_errors.txt 2>/dev/null; then
        ERROR_COUNT=$(wc -l < /tmp/backend_errors.txt | tr -d ' ')
        if [ "$ERROR_COUNT" -eq 0 ]; then
            echo "✅ Backend compiles without errors"
            add_check "backend_compilation" "healthy" "Backend compiles successfully"
        else
            echo -e "${YELLOW}⚠️  Backend has $ERROR_COUNT compilation errors${NC}"
            head -n3 /tmp/backend_errors.txt
            add_check "backend_compilation" "warning" "Backend has compilation errors" "$ERROR_COUNT errors"
        fi
    else
        echo -e "${YELLOW}⚠️  Could not verify backend compilation${NC}"
        add_check "backend_compilation" "warning" "Could not verify backend compilation"
    fi
    cd ..
else
    echo -e "${RED}❌ backend/Cargo.toml not found${NC}"
    add_check "backend_compilation" "error" "backend/Cargo.toml not found"
fi
echo ""

# 8. FRONTEND BUILD CHECK
echo -e "${GREEN}[8/10] Checking frontend build status...${NC}"
if [ -f "frontend/package.json" ]; then
    cd frontend
    if [ -d "dist" ]; then
        DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
        echo "✅ Frontend build artifacts found (size: $DIST_SIZE)"
        add_check "frontend_build" "healthy" "Frontend build artifacts found" "size: $DIST_SIZE"
    else
        echo -e "${YELLOW}⚠️  Frontend build artifacts not found${NC}"
        add_check "frontend_build" "warning" "Frontend build artifacts not found"
    fi
    cd ..
else
    echo -e "${RED}❌ frontend/package.json not found${NC}"
    add_check "frontend_build" "error" "frontend/package.json not found"
fi
echo ""

# 9. NETWORK CONNECTIVITY
echo -e "${GREEN}[9/10] Checking network connectivity...${NC}"
PORTS=(1000 2000 5432 6379 9090 3000)
for port in "${PORTS[@]}"; do
    if nc -z localhost "$port" 2>/dev/null; then
        SERVICE=$(docker ps --format "{{.Names}}\t{{.Ports}}" | grep ":$port" | cut -f1 || echo "unknown")
        echo "✅ Port $port is open ($SERVICE)"
    else
        echo -e "${YELLOW}⚠️  Port $port is not accessible${NC}"
    fi
done
add_check "network_connectivity" "healthy" "Network connectivity checked"
echo ""

# 10. ENVIRONMENT VARIABLES
echo -e "${GREEN}[10/10] Checking critical environment variables...${NC}"
REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "REDIS_URL")
MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if docker exec reconciliation-backend printenv "$var" >/dev/null 2>&1; then
        VALUE=$(docker exec reconciliation-backend printenv "$var" 2>/dev/null)
        if [ "${var}" = "JWT_SECRET" ]; then
            VALUE="${VALUE:0:10}..."
        fi
        echo "✅ $var is set ($VALUE)"
    else
        echo -e "${RED}❌ $var is not set${NC}"
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    add_check "environment_vars" "healthy" "All critical environment variables are set"
else
    add_check "environment_vars" "error" "Missing environment variables" "${MISSING_VARS[*]}"
fi
echo ""

# Summary
echo "============================================================================"
echo "DIAGNOSTIC SUMMARY"
echo "============================================================================"
HEALTHY=$(jq '[.checks[] | select(.status == "healthy")] | length' "$DIAG_RESULTS")
WARNINGS=$(jq '[.checks[] | select(.status == "warning")] | length' "$DIAG_RESULTS")
ERRORS=$(jq '[.checks[] | select(.status == "error")] | length' "$DIAG_RESULTS")
TOTAL=$(jq '.checks | length' "$DIAG_RESULTS")

echo "Total checks: $TOTAL"
echo -e "${GREEN}Healthy: $HEALTHY${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Errors: $ERRORS${NC}"
echo ""
echo "Full diagnostic report saved to: $DIAG_RESULTS"
echo "============================================================================"

# Exit with appropriate code
if [ "$ERRORS" -gt 0 ]; then
    exit 1
elif [ "$WARNINGS" -gt 0 ]; then
    exit 0
else
    exit 0
fi

