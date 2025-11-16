#!/bin/bash
# scripts/deployment/run-migrations.sh
# Run database migrations in Docker

set -e

ENVIRONMENT=${1:-development}

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

main() {
    log "Running database migrations for $ENVIRONMENT environment..."
    
    local compose_cmd="docker-compose"
    if ! command -v docker-compose &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    local compose_files="-f docker-compose.yml"
    if [ "$ENVIRONMENT" = "production" ] && [ -f "docker-compose.prod.yml" ]; then
        compose_files="-f docker-compose.yml -f docker-compose.prod.yml"
    fi
    
    # Check if backend container is running
    if ! $compose_cmd $compose_files ps backend | grep -q "Up"; then
        error "Backend container is not running. Start services first: docker-compose up -d"
    fi
    
    # Run migrations
    log "Executing migrations..."
    $compose_cmd $compose_files exec -T backend diesel migration run || {
        error "Migration failed"
    }
    
    log "✅ Migrations completed successfully"
    
    # List applied migrations
    log "Applied migrations:"
    $compose_cmd $compose_files exec -T backend diesel migration list || true
}

main "$@"

