#!/bin/bash
# ==============================================================================
# Verify Service Cooperation Optimizations
# ==============================================================================
# Verifies that all optimizations have been applied correctly
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
ERRORS=0
WARNINGS=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info "Verifying service cooperation optimizations..."
echo ""

# ==============================================================================
# CHECK 1: Dependency Conditions
# ==============================================================================
log_info "Checking dependency conditions..."

# Check for service_started (should be minimal)
STARTED_COUNT=$(grep -c "condition: service_started" "$COMPOSE_FILE" 2>/dev/null || echo "0")
STARTED_COUNT=${STARTED_COUNT:-0}
if [ "$STARTED_COUNT" -gt 0 ]; then
    log_warning "Found $STARTED_COUNT instances of 'service_started' (should be minimal)"
    WARNINGS=$((WARNINGS + 1))
    grep -n "condition: service_started" "$COMPOSE_FILE" || true
else
    log_success "No 'service_started' conditions found (all use service_healthy)"
fi

# Check for service_healthy (should be present)
HEALTHY_COUNT=$(grep -c "condition: service_healthy" "$COMPOSE_FILE" || echo "0")
if [ "$HEALTHY_COUNT" -ge 6 ]; then
    log_success "Found $HEALTHY_COUNT instances of 'service_healthy' (expected: 6+)"
else
    log_error "Found only $HEALTHY_COUNT instances of 'service_healthy' (expected: 6+)"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ==============================================================================
# CHECK 2: Backend Database Connection via PgBouncer
# ==============================================================================
log_info "Checking backend database connection..."

if grep -q "DATABASE_URL.*@pgbouncer:5432" "$COMPOSE_FILE"; then
    log_success "Backend uses PgBouncer for database connection"
else
    log_error "Backend does NOT use PgBouncer (still connects directly to postgres)"
    ERRORS=$((ERRORS + 1))
fi

# Check if backend depends on pgbouncer
if grep -A 5 "depends_on:" "$COMPOSE_FILE" | grep -q "pgbouncer:"; then
    log_success "Backend depends on PgBouncer"
else
    log_warning "Backend may not depend on PgBouncer"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ==============================================================================
# CHECK 3: Database Pool Size
# ==============================================================================
log_info "Checking database pool size..."

if grep -q "DATABASE_POOL_SIZE.*50" "$COMPOSE_FILE"; then
    log_success "DATABASE_POOL_SIZE set to 50 (optimized for PgBouncer)"
elif grep -q "DATABASE_POOL_SIZE.*20" "$COMPOSE_FILE"; then
    log_warning "DATABASE_POOL_SIZE is 20 (should be 50 for PgBouncer optimization)"
    WARNINGS=$((WARNINGS + 1))
else
    log_warning "DATABASE_POOL_SIZE not found or not set"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ==============================================================================
# CHECK 4: Health Checks
# ==============================================================================
log_info "Checking health checks..."

SERVICES_WITH_HEALTHCHECKS=(
    "postgres"
    "redis"
    "pgbouncer"
    "backend"
    "frontend"
    "prometheus"
    "grafana"
    "elasticsearch"
    "logstash"
    "kibana"
    "apm-server"
)

MISSING_HEALTHCHECKS=0
for service in "${SERVICES_WITH_HEALTHCHECKS[@]}"; do
    # Check for healthcheck - look for the service name and then healthcheck within reasonable distance
    # Use a more flexible approach: find service, then check if healthcheck exists in that section
    SERVICE_START=$(grep -n "^  $service:" "$COMPOSE_FILE" | cut -d: -f1)
    if [ -n "$SERVICE_START" ]; then
        # Get next service start or end of file
        NEXT_SERVICE=$(awk -v start="$SERVICE_START" 'NR > start && /^  [a-z]/ {print NR; exit}' "$COMPOSE_FILE")
        if [ -z "$NEXT_SERVICE" ]; then
            # No next service, check to end of file
            if sed -n "${SERVICE_START},\$p" "$COMPOSE_FILE" | grep -q "healthcheck:"; then
                echo -e "  ${GREEN}✅${NC} $service has health check"
            else
                echo -e "  ${RED}❌${NC} $service missing health check"
                MISSING_HEALTHCHECKS=$((MISSING_HEALTHCHECKS + 1))
                ERRORS=$((ERRORS + 1))
            fi
        else
            # Check between current service and next
            if sed -n "${SERVICE_START},${NEXT_SERVICE}p" "$COMPOSE_FILE" | grep -q "healthcheck:"; then
                echo -e "  ${GREEN}✅${NC} $service has health check"
            else
                echo -e "  ${RED}❌${NC} $service missing health check"
                MISSING_HEALTHCHECKS=$((MISSING_HEALTHCHECKS + 1))
                ERRORS=$((ERRORS + 1))
            fi
        fi
    else
        echo -e "  ${YELLOW}⚠️${NC}  $service not found in compose file"
        WARNINGS=$((WARNINGS + 1))
    fi
done

if [ $MISSING_HEALTHCHECKS -eq 0 ]; then
    log_success "All services have health checks"
else
    log_error "$MISSING_HEALTHCHECKS service(s) missing health checks"
fi

echo ""

# ==============================================================================
# CHECK 5: Critical Dependencies
# ==============================================================================
log_info "Checking critical dependencies..."

# Backend should depend on pgbouncer, postgres, redis, logstash, apm-server
BACKEND_START=$(grep -n "^  backend:" "$COMPOSE_FILE" | cut -d: -f1)
if [ -n "$BACKEND_START" ]; then
    BACKEND_END=$(awk -v start="$BACKEND_START" 'NR > start && /^  [a-z]/ {print NR; exit}' "$COMPOSE_FILE")
    if [ -z "$BACKEND_END" ]; then
        BACKEND_SECTION=$(sed -n "${BACKEND_START},\$p" "$COMPOSE_FILE")
    else
        BACKEND_SECTION=$(sed -n "${BACKEND_START},$((BACKEND_END-1))p" "$COMPOSE_FILE")
    fi
    if echo "$BACKEND_SECTION" | grep -A 10 "depends_on:" | grep -q "pgbouncer:"; then
        log_success "Backend depends on PgBouncer"
    else
        log_error "Backend does NOT depend on PgBouncer"
        ERRORS=$((ERRORS + 1))
    fi
else
    log_error "Backend service not found"
    ERRORS=$((ERRORS + 1))
fi

# Frontend should depend on backend with service_healthy
FRONTEND_START=$(grep -n "^  frontend:" "$COMPOSE_FILE" | cut -d: -f1)
if [ -n "$FRONTEND_START" ]; then
    FRONTEND_END=$(awk -v start="$FRONTEND_START" 'NR > start && /^  [a-z]/ {print NR; exit}' "$COMPOSE_FILE")
    if [ -z "$FRONTEND_END" ]; then
        FRONTEND_SECTION=$(sed -n "${FRONTEND_START},\$p" "$COMPOSE_FILE")
    else
        FRONTEND_SECTION=$(sed -n "${FRONTEND_START},$((FRONTEND_END-1))p" "$COMPOSE_FILE")
    fi
    if echo "$FRONTEND_SECTION" | grep -A 10 "depends_on:" | grep -A 3 "backend:" | grep -q "condition: service_healthy"; then
        log_success "Frontend depends on backend with service_healthy"
    else
        log_error "Frontend does NOT depend on backend with service_healthy"
        ERRORS=$((ERRORS + 1))
    fi
else
    log_error "Frontend service not found"
    ERRORS=$((ERRORS + 1))
fi

# APM Server should depend on kibana with service_healthy
if grep -A 20 "^  apm-server:" "$COMPOSE_FILE" | grep -A 10 "depends_on:" | grep -A 3 "kibana:" | grep -q "condition: service_healthy"; then
    log_success "APM Server depends on Kibana with service_healthy"
else
    log_error "APM Server does NOT depend on Kibana with service_healthy"
    ERRORS=$((ERRORS + 1))
fi

# Grafana should depend on prometheus with service_healthy
if grep -A 20 "^  grafana:" "$COMPOSE_FILE" | grep -A 10 "depends_on:" | grep -A 3 "prometheus:" | grep -q "condition: service_healthy"; then
    log_success "Grafana depends on Prometheus with service_healthy"
else
    log_error "Grafana does NOT depend on Prometheus with service_healthy"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "VERIFICATION SUMMARY"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All optimizations verified successfully!${NC}"
    echo ""
    log_success "Service cooperation optimizations are correctly applied"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Optimizations applied with $WARNINGS warning(s)${NC}"
    echo ""
    log_warning "Some optimizations may need attention"
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    log_error "Optimizations are not correctly applied"
    exit 1
fi

