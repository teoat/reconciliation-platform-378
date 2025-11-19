#!/bin/bash
# ============================================================================
# DIAGNOSTIC AREA 13: Docker & Container Analysis
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

RESULTS_FILE="${RESULTS_FILE:-/tmp/diagnostic-13-results.json}"

log_info "Starting Docker & Container Analysis..."

echo '{"checks": []}' > "$RESULTS_FILE"

add_check() {
    jq --arg name "$1" --arg status "$2" --arg msg "$3" --arg details "$4" \
        '.checks += [{"name": $name, "status": $status, "message": $msg, "details": $details}]' \
        "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
}

# 1. Docker containers
log_info "Checking Docker containers..."
if command -v docker &> /dev/null; then
    RUNNING=$(docker ps --format "{{.Names}}" 2>/dev/null | wc -l | tr -d ' ')
    RECONCILIATION_CONTAINERS=$(docker ps --format "{{.Names}}" 2>/dev/null | grep -c "reconciliation-" || echo "0")
    log_success "Found $RUNNING running containers ($RECONCILIATION_CONTAINERS reconciliation)"
    add_check "containers" "success" "$RUNNING containers running" "Reconciliation: $RECONCILIATION_CONTAINERS"
else
    log_warning "Docker not available"
    add_check "containers" "warning" "Docker not available" ""
fi

# 2. Docker Compose
log_info "Checking Docker Compose..."
if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
    SERVICES=$(grep -E "^\s+[a-z]" docker-compose*.yml docker-compose*.yaml 2>/dev/null | wc -l | tr -d ' ')
    log_success "Found Docker Compose with $SERVICES services"
    add_check "docker_compose" "success" "$SERVICES services" ""
else
    log_info "No Docker Compose file"
    add_check "docker_compose" "info" "No compose file" ""
fi

# 3. Container health
log_info "Checking container health..."
if command -v docker &> /dev/null; then
    UNHEALTHY=$(docker ps --format "{{.Status}}" 2>/dev/null | grep -c "unhealthy" || echo "0")
    if [ "$UNHEALTHY" -gt 0 ]; then
        log_warning "Found $UNHEALTHY unhealthy containers"
        add_check "container_health" "warning" "$UNHEALTHY unhealthy" ""
    else
        log_success "All containers healthy"
        add_check "container_health" "success" "All healthy" ""
    fi
fi

# 4. Docker images
log_info "Checking Docker images..."
if command -v docker &> /dev/null; then
    IMAGES=$(docker images --format "{{.Repository}}" 2>/dev/null | wc -l | tr -d ' ')
    log_info "Found $IMAGES Docker images"
    add_check "docker_images" "success" "$IMAGES images" ""
fi

log_success "Docker & Container Analysis complete"
cat "$RESULTS_FILE" | jq '.'

