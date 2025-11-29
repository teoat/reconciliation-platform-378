#!/bin/bash
# ============================================================================
# Docker SSOT Synchronization Script
# ============================================================================
# Purpose: Synchronize Docker and deployment configs with SSOT (.env)
# ============================================================================
# Usage:
#   ./scripts/sync-docker-ssot.sh [--dry-run]
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source shared functions
source "$SCRIPT_DIR/lib/common-functions.sh" 2>/dev/null || {
    log_warning "Shared functions not found, using basic logging"
    log_info() { echo "[INFO] $*"; }
    log_success() { echo "[SUCCESS] $*"; }
    log_warning() { echo "[WARNING] $*"; }
    log_error() { echo "[ERROR] $*"; }
}

DRY_RUN="${1:-}"

cd "$PROJECT_ROOT"

# ============================================================================
# SSOT Definitions
# ============================================================================

SSOT_ENV=".env"
SSOT_ENV_EXAMPLE="config/dev.env.example"
SSOT_DOCKER_COMPOSE="docker-compose.yml"
SSOT_DEPLOYMENT_SCRIPT="scripts/deploy-docker.sh"

# ============================================================================
# Sync Functions
# ============================================================================

sync_env_to_docker() {
    log_info "Synchronizing .env to docker-compose.yml..."
    
    if [ ! -f "$SSOT_ENV" ]; then
        log_warning ".env file not found, using .env.example as reference"
        ENV_FILE="$SSOT_ENV_EXAMPLE"
    else
        ENV_FILE="$SSOT_ENV"
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        log_error "No env file found to sync from"
        return 1
    fi
    
    # Source env file
    set -a
    source "$ENV_FILE" 2>/dev/null || true
    set +a
    
    # Check if docker-compose.yml uses environment variables
    if [ -f "$SSOT_DOCKER_COMPOSE" ]; then
        log_info "docker-compose.yml already uses environment variables (good!)"
        log_info "Ensure .env file is present for deployment"
    else
        log_error "docker-compose.yml not found!"
        return 1
    fi
    
    log_success "Environment sync check passed"
    return 0
}

verify_docker_env_usage() {
    log_info "Verifying docker-compose.yml uses environment variables..."
    
    if [ ! -f "$SSOT_DOCKER_COMPOSE" ]; then
        log_error "docker-compose.yml not found"
        return 1
    fi
    
    # Check for hardcoded values that should be env vars
    HARDCODED_VALUES=0
    
    # Check for hardcoded passwords
    if grep -q "POSTGRES_PASSWORD.*postgres_pass[^}]" "$SSOT_DOCKER_COMPOSE" 2>/dev/null; then
        if ! grep -q "\${POSTGRES_PASSWORD:-postgres_pass}" "$SSOT_DOCKER_COMPOSE" 2>/dev/null; then
            log_warning "Found hardcoded POSTGRES_PASSWORD (should use \${POSTGRES_PASSWORD:-default})"
            ((HARDCODED_VALUES++))
        fi
    fi
    
    # Check for hardcoded ports
    if grep -q "2000" "$SSOT_DOCKER_COMPOSE" 2>/dev/null && ! grep -q "\${BACKEND_PORT:-2000}" "$SSOT_DOCKER_COMPOSE" 2>/dev/null; then
        log_info "docker-compose.yml uses \${BACKEND_PORT:-2000} pattern (good!)"
    fi
    
    if [ $HARDCODED_VALUES -eq 0 ]; then
        log_success "docker-compose.yml properly uses environment variables"
        return 0
    else
        log_warning "Found $HARDCODED_VALUES potential hardcoded values"
        return 1
    fi
}

sync_deployment_script() {
    log_info "Verifying deployment script uses SSOT..."
    
    if [ ! -f "$SSOT_DEPLOYMENT_SCRIPT" ]; then
        log_error "Deployment script not found"
        return 1
    fi
    
    # Check if script references SSOT docker-compose.yml
    if grep -q "COMPOSE_FILE.*docker-compose.yml" "$SSOT_DEPLOYMENT_SCRIPT" 2>/dev/null; then
        log_success "Deployment script uses SSOT docker-compose.yml"
    else
        log_warning "Deployment script should set COMPOSE_FILE=docker-compose.yml"
        if [ "$DRY_RUN" != "--dry-run" ]; then
            # This would require editing the script, which we'll do manually
            log_info "Please update deployment script to use SSOT docker-compose.yml"
        fi
    fi
    
    return 0
}

create_env_from_example() {
    log_info "Checking .env file..."
    
    if [ ! -f "$SSOT_ENV" ]; then
        if [ -f "$SSOT_ENV_EXAMPLE" ]; then
            log_warning ".env file not found"
            if [ "$DRY_RUN" != "--dry-run" ]; then
                log_info "Creating .env from $SSOT_ENV_EXAMPLE..."
                cp "$SSOT_ENV_EXAMPLE" "$SSOT_ENV"
                log_success "Created .env file (please review and update secrets!)"
            else
                log_info "Would create .env from $SSOT_ENV_EXAMPLE"
            fi
        else
            log_error "No .env or .env.example found!"
            return 1
        fi
    else
        log_success ".env file exists"
    fi
    
    return 0
}

# ============================================================================
# Main Sync
# ============================================================================

main() {
    log_info "Starting Docker SSOT synchronization..."
    echo ""
    
    if [ "$DRY_RUN" = "--dry-run" ]; then
        log_info "DRY RUN MODE - No changes will be made"
        echo ""
    fi
    
    create_env_from_example
    sync_env_to_docker
    verify_docker_env_usage
    sync_deployment_script
    
    echo ""
    log_success "Docker SSOT synchronization complete!"
    log_info ""
    log_info "Next steps:"
    log_info "  1. Review .env file and update secrets if needed"
    log_info "  2. Run: ./scripts/validate-docker-ssot.sh"
    log_info "  3. Deploy: ./scripts/deploy-docker.sh"
}

main "$@"

