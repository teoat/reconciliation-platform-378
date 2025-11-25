#!/bin/bash
# ============================================================================
# DOCKER COMPOSE PRODUCTION DEPLOYMENT
# ============================================================================
# Deploys all services using Docker Compose for production
#
# Usage:
#   ./scripts/deployment/deploy-docker-production.sh [action]
#   ./scripts/deployment/deploy-docker-production.sh up
#   ./scripts/deployment/deploy-docker-production.sh down
#
# Actions:
#   up      - Start all services
#   down    - Stop all services
#   restart - Restart all services
#   logs    - View logs
#   status  - Show status
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

# Configuration
ACTION=${1:-up}
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
ENV_FILE="${ENV_FILE:-$PROJECT_ROOT/.env.production}"

# ============================================================================
# PREREQUISITES
# ============================================================================

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check compose file
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# ============================================================================
# CREATE NETWORK
# ============================================================================

create_network() {
    log_info "Creating Docker network..."
    
    if docker network inspect reconciliation-network &> /dev/null; then
        log_info "Network already exists"
    else
        docker network create reconciliation-network || {
            log_error "Failed to create network"
            exit 1
        }
        log_success "Network created"
    fi
}

# ============================================================================
# BUILD IMAGES
# ============================================================================

build_images() {
    log_info "Building Docker images..."
    
    # Use docker-compose or docker compose
    local compose_cmd
    if command -v docker-compose &> /dev/null; then
        compose_cmd="docker-compose"
    else
        compose_cmd="docker compose"
    fi
    
    # Build with production optimizations
    $compose_cmd -f "$COMPOSE_FILE" build \
        --build-arg BUILD_MODE=release \
        --build-arg NODE_ENV=production \
        --no-cache || {
        log_error "Failed to build images"
        exit 1
    }
    
    log_success "Images built successfully"
}

# ============================================================================
# START SERVICES
# ============================================================================

start_services() {
    log_info "Starting all services..."
    
    local compose_cmd
    if command -v docker-compose &> /dev/null; then
        compose_cmd="docker-compose"
    else
        compose_cmd="docker compose"
    fi
    
    # Start services in detached mode
    $compose_cmd -f "$COMPOSE_FILE" up -d || {
        log_error "Failed to start services"
        exit 1
    }
    
    log_success "Services started"
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check service status
    $compose_cmd -f "$COMPOSE_FILE" ps
}

# ============================================================================
# STOP SERVICES
# ============================================================================

stop_services() {
    log_info "Stopping all services..."
    
    local compose_cmd
    if command -v docker-compose &> /dev/null; then
        compose_cmd="docker-compose"
    else
        compose_cmd="docker compose"
    fi
    
    $compose_cmd -f "$COMPOSE_FILE" down || {
        log_error "Failed to stop services"
        exit 1
    }
    
    log_success "Services stopped"
}

# ============================================================================
# RESTART SERVICES
# ============================================================================

restart_services() {
    log_info "Restarting all services..."
    
    stop_services
    sleep 5
    start_services
}

# ============================================================================
# VIEW LOGS
# ============================================================================

view_logs() {
    local compose_cmd
    if command -v docker-compose &> /dev/null; then
        compose_cmd="docker-compose"
    else
        compose_cmd="docker compose"
    fi
    
    $compose_cmd -f "$COMPOSE_FILE" logs -f
}

# ============================================================================
# SHOW STATUS
# ============================================================================

show_status() {
    log_info "Service status:"
    
    local compose_cmd
    if command -v docker-compose &> /dev/null; then
        compose_cmd="docker-compose"
    else
        compose_cmd="docker compose"
    fi
    
    $compose_cmd -f "$COMPOSE_FILE" ps
    
    echo ""
    log_info "Service URLs:"
    echo "  Frontend: http://localhost:${FRONTEND_PORT:-1000}"
    echo "  Backend:  http://localhost:${BACKEND_PORT:-2000}"
    echo "  Grafana:  http://localhost:${GRAFANA_PORT:-3001}"
    echo "  Prometheus: http://localhost:${PROMETHEUS_PORT:-9090}"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    echo "============================================================================"
    echo "DOCKER COMPOSE PRODUCTION DEPLOYMENT"
    echo "============================================================================"
    echo "Action: $ACTION"
    echo "Compose File: $COMPOSE_FILE"
    echo "Started: $(date)"
    echo ""
    
    check_prerequisites
    create_network
    
    case "$ACTION" in
        up)
            build_images
            start_services
            show_status
            ;;
        down)
            stop_services
            ;;
        restart)
            restart_services
            show_status
            ;;
        logs)
            view_logs
            ;;
        status)
            show_status
            ;;
        build)
            build_images
            ;;
        *)
            log_error "Unknown action: $ACTION"
            echo "Available actions: up, down, restart, logs, status, build"
            exit 1
            ;;
    esac
    
    echo ""
    echo "============================================================================"
    log_success "Operation completed successfully!"
    echo "============================================================================"
}

# Run main function
main "$@"

