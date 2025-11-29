#!/bin/bash
# ==============================================================================
# Docker Desktop & IDE Agent Synchronization Script
# ==============================================================================
# Synchronizes Docker Desktop settings with IDE agent configurations
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_COMPOSE_FILE="${DOCKER_COMPOSE_FILE:-docker-compose.yml}"
CURSOR_CONFIG_DIR="$PROJECT_ROOT/.cursor"
ENV_FILE="$PROJECT_ROOT/.env"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "Docker Desktop & IDE Agent Synchronization"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ==============================================================================
# STEP 1: Verify Docker Desktop
# ==============================================================================
log_info "Step 1: Verifying Docker Desktop..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

if ! docker info &> /dev/null; then
    log_error "Docker daemon is not running"
    log_info "Please start Docker Desktop and try again"
    exit 1
fi

log_success "Docker Desktop is running"

# Get Docker configuration
DOCKER_VERSION=$(docker --version | awk '{print $3}' | tr -d ',')
DOCKER_COMPOSE_VERSION=$(docker compose version 2>/dev/null | awk '{print $4}' || echo "unknown")
DOCKER_NETWORK=$(docker network ls | grep reconciliation-network | awk '{print $1}' || echo "")

log_info "Docker Version: $DOCKER_VERSION"
log_info "Docker Compose Version: $DOCKER_COMPOSE_VERSION"
log_info "Network Status: ${DOCKER_NETWORK:-Not found}"

echo ""

# ==============================================================================
# STEP 2: Verify Docker Network
# ==============================================================================
log_info "Step 2: Verifying Docker network..."

if [ -z "$DOCKER_NETWORK" ]; then
    log_warning "reconciliation-network not found, creating..."
    if docker network create reconciliation-network; then
        log_success "Network created"
    else
        log_error "Failed to create network"
        exit 1
    fi
else
    log_success "Network exists"
fi

echo ""

# ==============================================================================
# STEP 3: Extract Docker Configuration
# ==============================================================================
log_info "Step 3: Extracting Docker configuration..."

# Extract service ports from docker-compose.yml
if [ -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" ]; then
    BACKEND_PORT=$(grep -A 1 "BACKEND_PORT" "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" | grep -oE '[0-9]+' | head -1 || echo "2000")
    FRONTEND_PORT=$(grep -A 1 "FRONTEND_PORT" "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" | grep -oE '[0-9]+' | head -1 || echo "1000")
    POSTGRES_PORT=$(grep -A 1 "POSTGRES_PORT" "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" | grep -oE '[0-9]+' | head -1 || echo "5432")
    REDIS_PORT=$(grep -A 1 "REDIS_PORT" "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" | grep -oE '[0-9]+' | head -1 || echo "6379")
    
    log_success "Extracted ports: Backend=$BACKEND_PORT, Frontend=$FRONTEND_PORT, Postgres=$POSTGRES_PORT, Redis=$REDIS_PORT"
else
    log_error "docker-compose.yml not found"
    exit 1
fi

echo ""

# ==============================================================================
# STEP 4: Update Environment Variables
# ==============================================================================
log_info "Step 4: Synchronizing environment variables..."

if [ ! -f "$ENV_FILE" ]; then
    log_warning ".env file not found, creating from .env.example..."
    if [ -f "$PROJECT_ROOT/.env.example" ]; then
        cp "$PROJECT_ROOT/.env.example" "$ENV_FILE"
        log_success ".env file created"
    else
        log_warning "No .env.example found, creating minimal .env"
        touch "$ENV_FILE"
    fi
fi

# Update or add Docker-related environment variables
update_env_var() {
    local key=$1
    local value=$2
    
    if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
        # Update existing
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
        else
            sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
        fi
    else
        # Add new
        echo "${key}=${value}" >> "$ENV_FILE"
    fi
}

update_env_var "BACKEND_PORT" "$BACKEND_PORT"
update_env_var "FRONTEND_PORT" "$FRONTEND_PORT"
update_env_var "POSTGRES_PORT" "$POSTGRES_PORT"
update_env_var "REDIS_PORT" "$REDIS_PORT"
update_env_var "DOCKER_NETWORK" "reconciliation-network"

log_success "Environment variables synchronized"

echo ""

# ==============================================================================
# STEP 5: Create IDE Agent Configuration
# ==============================================================================
log_info "Step 5: Creating IDE agent configuration..."

mkdir -p "$CURSOR_CONFIG_DIR"

# Create Docker service URLs configuration
cat > "$CURSOR_CONFIG_DIR/docker-services.json" <<EOF
{
  "services": {
    "backend": {
      "url": "http://localhost:${BACKEND_PORT}",
      "health": "http://localhost:${BACKEND_PORT}/api/health",
      "container": "reconciliation-backend"
    },
    "frontend": {
      "url": "http://localhost:${FRONTEND_PORT}",
      "health": "http://localhost:${FRONTEND_PORT}/health",
      "container": "reconciliation-frontend"
    },
    "postgres": {
      "host": "localhost",
      "port": ${POSTGRES_PORT},
      "container": "reconciliation-postgres"
    },
    "redis": {
      "host": "localhost",
      "port": ${REDIS_PORT},
      "container": "reconciliation-redis"
    },
    "grafana": {
      "url": "http://localhost:3001",
      "container": "reconciliation-grafana"
    },
    "prometheus": {
      "url": "http://localhost:9090",
      "container": "reconciliation-prometheus"
    },
    "kibana": {
      "url": "http://localhost:5601",
      "container": "reconciliation-kibana"
    }
  },
  "network": "reconciliation-network",
  "compose_file": "${DOCKER_COMPOSE_FILE}",
  "last_sync": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

log_success "IDE agent configuration created"

echo ""

# ==============================================================================
# STEP 6: Verify Service Accessibility
# ==============================================================================
log_info "Step 6: Verifying service accessibility..."

check_service() {
    local name=$1
    local url=$2
    
    if curl -s -f "$url" >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅${NC} $name: Accessible"
        return 0
    else
        echo -e "  ${YELLOW}⏳${NC} $name: Not ready yet"
        return 1
    fi
}

SERVICES_READY=0
TOTAL_SERVICES=0

# Check backend
TOTAL_SERVICES=$((TOTAL_SERVICES + 1))
if check_service "Backend" "http://localhost:${BACKEND_PORT}/api/health"; then
    SERVICES_READY=$((SERVICES_READY + 1))
fi

# Check frontend
TOTAL_SERVICES=$((TOTAL_SERVICES + 1))
if check_service "Frontend" "http://localhost:${FRONTEND_PORT}/health"; then
    SERVICES_READY=$((SERVICES_READY + 1))
fi

# Check Grafana
TOTAL_SERVICES=$((TOTAL_SERVICES + 1))
if check_service "Grafana" "http://localhost:3001/api/health"; then
    SERVICES_READY=$((SERVICES_READY + 1))
fi

echo ""
log_info "Services ready: $SERVICES_READY / $TOTAL_SERVICES"

echo ""

# ==============================================================================
# STEP 7: Create Agent Coordination Status
# ==============================================================================
log_info "Step 7: Creating agent coordination status..."

cat > "$CURSOR_CONFIG_DIR/docker-sync-status.json" <<EOF
{
  "docker": {
    "version": "${DOCKER_VERSION}",
    "compose_version": "${DOCKER_COMPOSE_VERSION}",
    "network": "reconciliation-network",
    "network_exists": true
  },
  "services": {
    "backend_port": ${BACKEND_PORT},
    "frontend_port": ${FRONTEND_PORT},
    "postgres_port": ${POSTGRES_PORT},
    "redis_port": ${REDIS_PORT}
  },
  "sync_status": {
    "environment_synced": true,
    "ide_config_created": true,
    "services_accessible": ${SERVICES_READY},
    "last_sync": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  }
}
EOF

log_success "Sync status saved"

echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "SYNCHRONIZATION COMPLETE"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log_info "Configuration Files:"
echo "  ✅ .env - Environment variables synchronized"
echo "  ✅ .cursor/docker-services.json - Service URLs for IDE agents"
echo "  ✅ .cursor/docker-sync-status.json - Sync status"
echo ""

log_info "Service URLs:"
echo "  Backend:    http://localhost:${BACKEND_PORT}"
echo "  Frontend:   http://localhost:${FRONTEND_PORT}"
echo "  Grafana:    http://localhost:3001"
echo "  Prometheus: http://localhost:9090"
echo ""

log_success "Docker Desktop and IDE agents are now synchronized!"

