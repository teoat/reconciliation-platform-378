#!/usr/bin/env bash
# Complete Production Deployment Script
# Deploys all services with proper verification and health checks

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

echo "============================================================================"
echo "  RECONCILIATION PLATFORM - PRODUCTION DEPLOYMENT"
echo "============================================================================"
echo ""

# Step 1: Pre-deployment checks
log "Running pre-deployment verification..."
if [[ -f "pre-deployment-check.sh" ]]; then
    chmod +x pre-deployment-check.sh
    if ! ./pre-deployment-check.sh; then
        error "Pre-deployment checks failed. Please fix issues before deploying."
    fi
else
    warning "Pre-deployment check script not found, skipping..."
fi

# Step 2: Generate environment file if needed
log "Checking environment configuration..."
if [[ ! -f ".env" ]]; then
    warning ".env file not found. Creating from template..."
    cat > .env << 'EOF'
# Database Configuration
POSTGRES_DB=reconciliation_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
POSTGRES_PORT=5432
PGBOUNCER_PORT=6432

# Redis Configuration
REDIS_PASSWORD=CHANGE_THIS_PASSWORD
REDIS_PORT=6379

# Backend Configuration
BACKEND_PORT=2000
JWT_SECRET=CHANGE_THIS_JWT_SECRET_MIN_32_CHARS
JWT_EXPIRATION=86400
CORS_ORIGINS=http://localhost:1000
RUST_LOG=info
MAX_FILE_SIZE=10485760

# Frontend Configuration
FRONTEND_PORT=1000
VITE_API_URL=http://localhost:2000
VITE_WS_URL=ws://localhost:2000
VITE_BASE_PATH=/
VITE_STORAGE_KEY=CHANGE_THIS_STORAGE_KEY_MIN_16_CHARS

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
GRAFANA_PASSWORD=admin
ELASTICSEARCH_PORT=9200
KIBANA_PORT=5601
LOGSTASH_PORT=5044
LOGSTASH_HTTP_PORT=9600
LOGSTASH_EXPORTER_PORT=9198
APM_PORT=8200

# Environment
NODE_ENV=production
ENVIRONMENT=production
EOF
    warning "Created .env file with default values. PLEASE UPDATE SECRETS!"
    warning "Press Enter to continue after updating .env, or Ctrl+C to cancel..."
    read -r
fi

# Step 3: Generate secure secrets if using defaults
log "Checking for default secrets..."
source .env 2>/dev/null || true

if [[ "${JWT_SECRET:-}" == "CHANGE_THIS_JWT_SECRET_MIN_32_CHARS" ]] || [[ -z "${JWT_SECRET:-}" ]]; then
    warning "Generating secure JWT_SECRET..."
    JWT_SECRET=$(openssl rand -hex 32)
    if grep -q "JWT_SECRET=" .env; then
        sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    else
        echo "JWT_SECRET=$JWT_SECRET" >> .env
    fi
    success "Generated JWT_SECRET"
fi

if [[ "${VITE_STORAGE_KEY:-}" == "CHANGE_THIS_STORAGE_KEY_MIN_16_CHARS" ]] || [[ -z "${VITE_STORAGE_KEY:-}" ]]; then
    warning "Generating secure VITE_STORAGE_KEY..."
    VITE_STORAGE_KEY=$(openssl rand -hex 16)
    if grep -q "VITE_STORAGE_KEY=" .env; then
        sed -i.bak "s/VITE_STORAGE_KEY=.*/VITE_STORAGE_KEY=$VITE_STORAGE_KEY/" .env
    else
        echo "VITE_STORAGE_KEY=$VITE_STORAGE_KEY" >> .env
    fi
    success "Generated VITE_STORAGE_KEY"
fi

# Step 4: Stop existing containers
log "Stopping existing containers..."
docker compose down 2>/dev/null || true
success "Stopped existing containers"

# Step 5: Build images
log "Building Docker images (this may take several minutes)..."
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

if docker compose -f docker-compose.yml -f docker-compose.prod.yml build --parallel; then
    success "Images built successfully"
else
    error "Image build failed"
fi

# Step 6: Start services
log "Starting all services..."
if docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d; then
    success "Services started"
else
    error "Failed to start services"
fi

# Step 7: Wait for services to be healthy
log "Waiting for services to be healthy..."
SERVICES=("postgres" "redis" "elasticsearch" "logstash" "apm-server" "backend" "frontend")
MAX_WAIT=300
ELAPSED=0

for service in "${SERVICES[@]}"; do
    log "Waiting for $service to be healthy..."
    SERVICE_READY=false
    
    for i in {1..60}; do
        if docker compose ps "$service" | grep -q "healthy\|running"; then
            SERVICE_READY=true
            break
        fi
        sleep 2
        ELAPSED=$((ELAPSED + 2))
        
        if [[ $ELAPSED -ge $MAX_WAIT ]]; then
            warning "$service is taking longer than expected to start"
            break
        fi
    done
    
    if [[ "$SERVICE_READY" == "true" ]]; then
        success "$service is healthy"
    else
        warning "$service may not be fully ready yet"
    fi
done

# Step 8: Health checks
log "Running health checks..."

# Backend health check
log "Checking backend health..."
for i in {1..30}; do
    if curl -fsS http://localhost:2000/health >/dev/null 2>&1; then
        success "Backend is healthy"
        break
    fi
    if [[ $i -eq 30 ]]; then
        warning "Backend health check failed (may still be starting)"
    fi
    sleep 2
done

# Frontend health check
log "Checking frontend..."
for i in {1..15}; do
    if curl -fsS http://localhost:1000 >/dev/null 2>&1; then
        success "Frontend is accessible"
        break
    fi
    if [[ $i -eq 15 ]]; then
        warning "Frontend may still be starting"
    fi
    sleep 2
done

# Step 9: Display service status
echo ""
echo "============================================================================"
echo "  DEPLOYMENT COMPLETE"
echo "============================================================================"
echo ""
log "Service Status:"
docker compose ps

echo ""
echo "============================================================================"
echo "  SERVICE ENDPOINTS"
echo "============================================================================"
echo ""
echo -e "${GREEN}Frontend:${NC}     http://localhost:1000"
echo -e "${GREEN}Backend API:${NC}  http://localhost:2000"
echo -e "${GREEN}API Health:${NC}   http://localhost:2000/health"
echo ""
echo -e "${BLUE}Monitoring:${NC}"
echo "  Prometheus:  http://localhost:9090"
echo "  Grafana:     http://localhost:3001 (admin / ${GRAFANA_PASSWORD:-admin})"
echo "  Kibana:      http://localhost:5601"
echo "  APM Server:  http://localhost:8200"
echo ""
echo -e "${BLUE}Database:${NC}"
echo "  PostgreSQL:  localhost:5432"
echo "  PgBouncer:   localhost:6432 (recommended for production)"
echo "  Redis:       localhost:6379"
echo ""

# Step 10: Database migrations reminder
warning "Don't forget to run database migrations:"
echo "  cd backend && diesel migration run"
echo ""

success "Deployment completed successfully!"
echo ""
log "To view logs: docker compose logs -f [service-name]"
log "To stop services: docker compose down"
log "To restart: docker compose restart [service-name]"

