#!/bin/bash
# ==============================================================================
# Comprehensive Service Diagnosis and Deployment Script
# ==============================================================================
# Diagnoses deployed services, analyzes undeployed services, and deploys all
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

# Configuration
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
MODE="${1:-production}"
TIMEOUT=300  # 5 minutes timeout for health checks

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Determine compose command
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# ==============================================================================
# FUNCTIONS
# ==============================================================================

check_docker() {
    log_info "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        log_info "Please start Docker Desktop and try again"
        exit 1
    fi
    log_success "Docker is running"
}

get_defined_services() {
    log_info "Extracting defined services from $COMPOSE_FILE..."
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    # Extract service names from docker-compose file
    $COMPOSE_CMD -f "$COMPOSE_FILE" config --services 2>/dev/null || \
        grep -E "^\s+[a-zA-Z0-9_-]+:" "$COMPOSE_FILE" | \
        sed 's/^[[:space:]]*//' | sed 's/:$//' | grep -v "^#" | sort -u
}

get_running_containers() {
    log_info "Checking running containers..."
    docker ps --format "{{.Names}}" 2>/dev/null | grep -E "reconciliation|^postgres|^redis|^prometheus|^grafana|^elasticsearch|^logstash|^kibana|^apm" || true
}

get_stopped_containers() {
    log_info "Checking stopped containers..."
    docker ps -a --format "{{.Names}}\t{{.Status}}" 2>/dev/null | \
        grep -E "reconciliation|^postgres|^redis|^prometheus|^grafana|^elasticsearch|^logstash|^kibana|^apm" | \
        grep -v "Up" || true
}

check_service_health() {
    local service=$1
    local port=$2
    local path=${3:-/health}
    
    if curl -f -s "http://localhost:${port}${path}" > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

check_database_health() {
    if docker exec reconciliation-postgres pg_isready -U postgres > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

check_redis_health() {
    if docker exec reconciliation-redis redis-cli -a "${REDIS_PASSWORD:-redis_pass}" ping > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

diagnose_services() {
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "SERVICE DIAGNOSIS REPORT"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Get defined services
    DEFINED_SERVICES=($(get_defined_services))
    log_info "📋 Defined Services (${#DEFINED_SERVICES[@]}):"
    for service in "${DEFINED_SERVICES[@]}"; do
        echo "  - $service"
    done
    echo ""
    
    # Get running containers
    RUNNING_CONTAINERS=($(get_running_containers))
    log_info "✅ Running Containers (${#RUNNING_CONTAINERS[@]}):"
    if [ ${#RUNNING_CONTAINERS[@]} -eq 0 ]; then
        echo "  (none)"
    else
        for container in "${RUNNING_CONTAINERS[@]}"; do
            STATUS=$(docker ps --filter "name=$container" --format "{{.Status}}" 2>/dev/null || echo "unknown")
            echo "  - $container ($STATUS)"
        done
    fi
    echo ""
    
    # Get stopped containers
    STOPPED_CONTAINERS=($(get_stopped_containers | cut -f1))
    log_info "⏸️  Stopped Containers (${#STOPPED_CONTAINERS[@]}):"
    if [ ${#STOPPED_CONTAINERS[@]} -eq 0 ]; then
        echo "  (none)"
    else
        for container in "${STOPPED_CONTAINERS[@]}"; do
            STATUS=$(docker ps -a --filter "name=$container" --format "{{.Status}}" 2>/dev/null || echo "unknown")
            echo "  - $container ($STATUS)"
        done
    fi
    echo ""
    
    # Identify undeployed services
    log_info "🔍 Analyzing Undeployed Services..."
    UNDEPLOYED=()
    for service in "${DEFINED_SERVICES[@]}"; do
        CONTAINER_NAME="reconciliation-${service}"
        if ! docker ps --format "{{.Names}}" 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
            UNDEPLOYED+=("$service")
        fi
    done
    
    if [ ${#UNDEPLOYED[@]} -eq 0 ]; then
        log_success "All defined services are deployed!"
    else
        log_warning "Undeployed Services (${#UNDEPLOYED[@]}):"
        for service in "${UNDEPLOYED[@]}"; do
            echo "  - $service"
        done
    fi
    echo ""
    
    # Health checks for running services
    log_info "🏥 Health Check Results:"
    
    # Database
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "reconciliation-postgres"; then
        if check_database_health; then
            echo -e "  ${GREEN}✅ PostgreSQL: Healthy${NC}"
        else
            echo -e "  ${RED}❌ PostgreSQL: Unhealthy${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠️  PostgreSQL: Not running${NC}"
    fi
    
    # Redis
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "reconciliation-redis"; then
        if check_redis_health; then
            echo -e "  ${GREEN}✅ Redis: Healthy${NC}"
        else
            echo -e "  ${RED}❌ Redis: Unhealthy${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠️  Redis: Not running${NC}"
    fi
    
    # Backend
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "reconciliation-backend"; then
        if check_service_health "backend" "2000" "/api/health"; then
            echo -e "  ${GREEN}✅ Backend: Healthy${NC}"
        else
            echo -e "  ${RED}❌ Backend: Unhealthy${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠️  Backend: Not running${NC}"
    fi
    
    # Frontend
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "reconciliation-frontend"; then
        if check_service_health "frontend" "1000" "/health"; then
            echo -e "  ${GREEN}✅ Frontend: Healthy${NC}"
        else
            echo -e "  ${YELLOW}⚠️  Frontend: Starting or unhealthy${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠️  Frontend: Not running${NC}"
    fi
    
    # Monitoring services
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "reconciliation-prometheus"; then
        if check_service_health "prometheus" "9090" "/-/healthy"; then
            echo -e "  ${GREEN}✅ Prometheus: Healthy${NC}"
        else
            echo -e "  ${YELLOW}⚠️  Prometheus: Starting${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠️  Prometheus: Not running${NC}"
    fi
    
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "reconciliation-grafana"; then
        if check_service_health "grafana" "3001" "/api/health"; then
            echo -e "  ${GREEN}✅ Grafana: Healthy${NC}"
        else
            echo -e "  ${YELLOW}⚠️  Grafana: Starting${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠️  Grafana: Not running${NC}"
    fi
    
    # Elastic Stack
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "reconciliation-elasticsearch"; then
        if check_service_health "elasticsearch" "9200" "/_cluster/health"; then
            echo -e "  ${GREEN}✅ Elasticsearch: Healthy${NC}"
        else
            echo -e "  ${YELLOW}⚠️  Elasticsearch: Starting${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠️  Elasticsearch: Not running${NC}"
    fi
    
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "reconciliation-logstash"; then
        if check_service_health "logstash" "9600" "/_node/stats"; then
            echo -e "  ${GREEN}✅ Logstash: Healthy${NC}"
        else
            echo -e "  ${YELLOW}⚠️  Logstash: Starting${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠️  Logstash: Not running${NC}"
    fi
    
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "reconciliation-kibana"; then
        if check_service_health "kibana" "5601" "/api/status"; then
            echo -e "  ${GREEN}✅ Kibana: Healthy${NC}"
        else
            echo -e "  ${YELLOW}⚠️  Kibana: Starting${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠️  Kibana: Not running${NC}"
    fi
    
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "reconciliation-apm-server"; then
        if check_service_health "apm-server" "8200" "/"; then
            echo -e "  ${GREEN}✅ APM Server: Healthy${NC}"
        else
            echo -e "  ${YELLOW}⚠️  APM Server: Starting${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠️  APM Server: Not running${NC}"
    fi
    
    echo ""
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

deploy_all_services() {
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "DEPLOYING ALL SERVICES"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Create network if it doesn't exist
    log_info "Ensuring Docker network exists..."
    if ! docker network inspect reconciliation-network > /dev/null 2>&1; then
        docker network create reconciliation-network
        log_success "Network created"
    else
        log_info "Network already exists"
    fi
    echo ""
    
    # Build images
    log_info "Building Docker images..."
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    if $COMPOSE_CMD -f "$COMPOSE_FILE" build --parallel; then
        log_success "Images built successfully"
    else
        log_error "Image build failed"
        exit 1
    fi
    echo ""
    
    # Start services
    log_info "Starting all services..."
    if $COMPOSE_CMD -f "$COMPOSE_FILE" up -d; then
        log_success "Services started"
    else
        log_error "Failed to start services"
        exit 1
    fi
    echo ""
    
    # Wait for services to initialize
    log_info "Waiting for services to initialize (30 seconds)..."
    sleep 30
    echo ""
    
    # Show service status
    log_info "Service Status:"
    $COMPOSE_CMD -f "$COMPOSE_FILE" ps
    echo ""
    
    # Wait for health checks
    log_info "Waiting for services to become healthy..."
    
    # Database
    log_info "Waiting for PostgreSQL..."
    for i in {1..30}; do
        if check_database_health; then
            log_success "PostgreSQL is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            log_warning "PostgreSQL health check timeout"
        else
            sleep 2
        fi
    done
    
    # Redis
    log_info "Waiting for Redis..."
    for i in {1..30}; do
        if check_redis_health; then
            log_success "Redis is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            log_warning "Redis health check timeout"
        else
            sleep 2
        fi
    done
    
    # Elasticsearch (needed for logstash, kibana, apm)
    log_info "Waiting for Elasticsearch..."
    for i in {1..60}; do
        if check_service_health "elasticsearch" "9200" "/_cluster/health"; then
            log_success "Elasticsearch is ready"
            break
        fi
        if [ $i -eq 60 ]; then
            log_warning "Elasticsearch health check timeout"
        else
            sleep 2
        fi
    done
    
    # Backend
    log_info "Waiting for Backend..."
    for i in {1..60}; do
        if check_service_health "backend" "2000" "/api/health"; then
            log_success "Backend is ready"
            break
        fi
        if [ $i -eq 60 ]; then
            log_warning "Backend health check timeout"
            log_info "Backend logs:"
            $COMPOSE_CMD -f "$COMPOSE_FILE" logs --tail=50 backend
        else
            sleep 2
        fi
    done
    
    # Frontend
    log_info "Waiting for Frontend..."
    for i in {1..30}; do
        if check_service_health "frontend" "1000" "/health"; then
            log_success "Frontend is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            log_warning "Frontend health check timeout"
        else
            sleep 2
        fi
    done
    
    echo ""
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "DEPLOYMENT COMPLETE"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Service URLs
    log_info "Service URLs:"
    echo "  Frontend:      http://localhost:1000"
    echo "  Backend API:   http://localhost:2000"
    echo "  PostgreSQL:    localhost:5432"
    echo "  Redis:         localhost:6379"
    echo "  Prometheus:    http://localhost:9090"
    echo "  Grafana:       http://localhost:3001 (admin/${GRAFANA_PASSWORD:-admin})"
    echo "  Elasticsearch: http://localhost:9200"
    echo "  Kibana:        http://localhost:5601"
    echo "  APM Server:    http://localhost:8200"
    echo ""
    
    log_info "View logs:"
    echo "  $COMPOSE_CMD -f $COMPOSE_FILE logs -f [service-name]"
    echo ""
    log_info "Stop services:"
    echo "  $COMPOSE_CMD -f $COMPOSE_FILE down"
    echo ""
}

# ==============================================================================
# MAIN EXECUTION
# ==============================================================================

main() {
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "COMPREHENSIVE SERVICE DIAGNOSIS AND DEPLOYMENT"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    check_docker
    
    # Run diagnosis
    diagnose_services
    
    # Ask for deployment
    echo ""
    read -p "Deploy all services? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_all_services
    else
        log_info "Deployment skipped"
    fi
}

# Run main function
main "$@"

