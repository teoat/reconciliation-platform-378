#!/bin/bash
# Comprehensive Deployment Verification Script
# Checks all services, endpoints, and configurations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

cd "$SCRIPT_DIR/.."

echo "🔍 Comprehensive Deployment Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PASSED=0
FAILED=0
WARNINGS=0

# Function to check and report
check_service() {
    local name=$1
    local command=$2
    local expected=$3
    
    if eval "$command" > /dev/null 2>&1; then
        echo "✅ $name: OK"
        ((PASSED++))
        return 0
    else
        if [ "$expected" = "required" ]; then
            echo "❌ $name: FAILED (Required)"
            ((FAILED++))
            return 1
        else
            echo "⚠️  $name: WARNING (Optional)"
            ((WARNINGS++))
            return 0
        fi
    fi
}

# 1. Docker Services
echo "1️⃣  Docker Services:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_service "Docker daemon" "docker info" "required"
check_service "Backend container" "docker-compose ps backend | grep -q 'Up'" "required"
check_service "PostgreSQL container" "docker-compose ps postgres | grep -q 'Up'" "required"
check_service "Redis container" "docker-compose ps redis | grep -q 'Up'" "required"
echo ""

# 2. Backend API
echo "2️⃣  Backend API:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_service "Health endpoint" "curl -k -s http://localhost:2000/api/health > /dev/null 2>&1" "required"
check_service "API responding" "curl -k -s http://localhost:2000/api/health > /dev/null 2>&1" "required"
echo ""

# 3. Database
echo "3️⃣  Database:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_service "PostgreSQL connection" "docker-compose exec -T postgres psql -U postgres -c 'SELECT 1;' > /dev/null 2>&1" "required"
check_service "Database accessible" "docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1" "required"
echo ""

# 4. Redis
echo "4️⃣  Redis Cache:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
REDIS_PASS=$(grep REDIS_PASSWORD .env 2>/dev/null | cut -d'=' -f2 | tr -d '\r' || echo "")
if [ -n "$REDIS_PASS" ]; then
    check_service "Redis connection" "docker-compose exec -T redis redis-cli -a \"$REDIS_PASS\" ping 2>&1 | grep -q PONG" "required"
else
    check_service "Redis connection" "docker-compose exec -T redis redis-cli ping 2>&1 | grep -qE 'PONG|NOAUTH'" "required"
fi
echo ""

# 5. Webhooks
echo "5️⃣  Webhook Configuration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_service "Beeceptor endpoint" "curl -f -s https://378to492.free.beeceptor.com > /dev/null" "optional"
if grep -q "WEBHOOK_URL.*378to492" .env 2>/dev/null; then
    echo "✅ Beeceptor URL configured in .env"
    ((PASSED++))
else
    echo "⚠️  Beeceptor URL not found in .env"
    ((WARNINGS++))
fi
echo ""

# 6. Frontend
echo "6️⃣  Frontend:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_service "Frontend container" "docker-compose ps frontend | grep -q 'Up'" "optional"
check_service "Frontend serving" "curl -k -f -s http://localhost:1000 > /dev/null" "optional"
echo ""

# 7. Logs Check
echo "7️⃣  Service Health (Logs):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if docker-compose logs backend --tail 50 2>&1 | grep -q "ERROR\|FATAL\|panic"; then
    echo "⚠️  Backend logs contain errors (check with: docker-compose logs backend)"
    ((WARNINGS++))
else
    echo "✅ No critical errors in backend logs"
    ((PASSED++))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Verification Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "⚠️  Warnings: $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        log_success "🎉 All checks passed! System is fully operational."
        exit 0
    else
        log_warning "⚠️  All required checks passed, but some optional services have warnings."
        exit 0
    fi
else
    log_error "❌ Some required checks failed. Please review the errors above."
    exit 1
fi

