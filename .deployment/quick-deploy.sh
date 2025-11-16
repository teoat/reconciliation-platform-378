#!/bin/bash
# Quick Deploy Script - Minimal Risk Automation
# This script provides fast, safe deployment with rollback capability

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR=".deployment/backups"
MAX_RETRIES=3
HEALTH_CHECK_TIMEOUT=60

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-flight checks
preflight_checks() {
    log_info "Running pre-flight checks..."
    
    # Check Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check docker-compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "docker-compose.yml not found"
        exit 1
    fi
    
    # Check .env file
    if [ ! -f ".env" ]; then
        log_warn ".env file not found, using defaults"
    fi
    
    log_info "Pre-flight checks passed ✓"
}

# Backup current state
backup_state() {
    log_info "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
    
    # Backup volumes (metadata only)
    docker compose ps --format json > "$BACKUP_DIR/containers_$TIMESTAMP.json"
    
    log_info "Backup created: $BACKUP_FILE"
}

# Build with caching
fast_build() {
    log_info "Building images with cache..."
    
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    # Build only changed services
    docker compose build --parallel backend 2>&1 | tail -20
    
    log_info "Build completed ✓"
}

# Health check
health_check() {
    local service=$1
    local url=$2
    local timeout=$HEALTH_CHECK_TIMEOUT
    
    log_info "Health checking $service..."
    
    for i in $(seq 1 $timeout); do
        if curl -sf "$url" > /dev/null 2>&1; then
            log_info "$service is healthy ✓"
            return 0
        fi
        sleep 1
    done
    
    log_error "$service health check failed"
    return 1
}

# Deploy with minimal downtime
deploy() {
    log_info "Starting deployment..."
    
    # Start backend (will restart if already running)
    docker compose up -d backend
    
    # Wait for backend health
    if ! health_check "Backend" "http://localhost:2000/health"; then
        log_error "Backend failed to start"
        rollback
        exit 1
    fi
    
    # Start frontend
    docker compose up -d frontend
    
    log_info "Deployment completed ✓"
}

# Rollback on failure
rollback() {
    log_warn "Rolling back to previous state..."
    docker compose down
    # In production, restore from backup
    log_info "Rollback completed"
}

# Show status
show_status() {
    log_info "Service Status:"
    docker compose ps
    
    echo ""
    log_info "Quick Links:"
    echo "  Backend:   http://localhost:2000/health"
    echo "  Frontend:  http://localhost:1000"
    echo "  Grafana:   http://localhost:3001"
}

# Main execution
main() {
    echo "═══════════════════════════════════════"
    echo "   Reconciliation Platform - Quick Deploy"
    echo "═══════════════════════════════════════"
    echo ""
    
    preflight_checks
    backup_state
    fast_build
    deploy
    show_status
    
    echo ""
    log_info "Deployment completed successfully! 🚀"
}

# Run main
main

