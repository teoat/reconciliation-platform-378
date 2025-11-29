#!/bin/bash
# ============================================================================
# Docker SSOT Validation Script
# ============================================================================
# Purpose: Validate Docker and deployment configurations follow SSOT principles
# ============================================================================
# Usage:
#   ./scripts/validate-docker-ssot.sh [--fix]
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

FIX_MODE="${1:-}"

cd "$PROJECT_ROOT"

VIOLATIONS=0
FIXES=0

# ============================================================================
# SSOT Definitions
# ============================================================================

SSOT_DOCKER_COMPOSE="docker-compose.yml"
SSOT_ENV=".env"
SSOT_ENV_EXAMPLE="config/dev.env.example"
SSOT_DEPLOYMENT_SCRIPT="scripts/deploy-docker.sh"

# ============================================================================
# Validation Functions
# ============================================================================

check_docker_compose_ssot() {
    log_info "Checking docker-compose.yml SSOT compliance..."
    
    # Check if docker-compose.yml exists
    if [ ! -f "$SSOT_DOCKER_COMPOSE" ]; then
        log_error "SSOT docker-compose.yml not found!"
        ((VIOLATIONS++))
        return 1
    fi
    
    # Check for archived docker-compose files (should be in archive/)
    ARCHIVED_FILES=$(find . -maxdepth 1 -name "docker-compose.*.yml" ! -name "docker-compose.yml" 2>/dev/null | wc -l)
    if [ "$ARCHIVED_FILES" -gt 0 ]; then
        log_warning "Found $ARCHIVED_FILES docker-compose files at root (should be archived)"
        if [ "$FIX_MODE" = "--fix" ]; then
            log_info "Moving to archive/docker-compose/..."
            mkdir -p archive/docker-compose
            find . -maxdepth 1 -name "docker-compose.*.yml" ! -name "docker-compose.yml" -exec mv {} archive/docker-compose/ \;
            log_success "Moved to archive"
            ((FIXES++))
        else
            ((VIOLATIONS++))
        fi
    fi
    
    # Check if docker-compose.yml references .env (SSOT)
    if ! grep -q "\.env\|env_file" "$SSOT_DOCKER_COMPOSE" 2>/dev/null; then
        log_warning "docker-compose.yml may not reference .env file"
        # Note: docker-compose automatically reads .env, so this is just a warning
    fi
    
    log_success "docker-compose.yml SSOT check passed"
    return 0
}

check_env_ssot() {
    log_info "Checking .env SSOT compliance..."
    
    # Check if .env.example exists (SSOT template)
    if [ ! -f "$SSOT_ENV_EXAMPLE" ]; then
        log_error "SSOT env example not found: $SSOT_ENV_EXAMPLE"
        ((VIOLATIONS++))
        return 1
    fi
    
    # Check for duplicate env files at root
    DUPLICATE_ENV=$(find . -maxdepth 1 -name "*.env" ! -name ".env" ! -name ".env.example" 2>/dev/null | wc -l)
    if [ "$DUPLICATE_ENV" -gt 0 ]; then
        log_warning "Found $DUPLICATE_ENV env files at root (should use config/ directory)"
        if [ "$FIX_MODE" = "--fix" ]; then
            log_info "Moving to config/..."
            find . -maxdepth 1 -name "*.env" ! -name ".env" ! -name ".env.example" -exec mv {} config/ \;
            log_success "Moved to config/"
            ((FIXES++))
        else
            ((VIOLATIONS++))
        fi
    fi
    
    # Check if docker-compose.yml uses environment variables correctly
    if grep -q "POSTGRES_PASSWORD.*postgres_pass" "$SSOT_DOCKER_COMPOSE" 2>/dev/null; then
        if ! grep -q "\${POSTGRES_PASSWORD:-postgres_pass}" "$SSOT_DOCKER_COMPOSE" 2>/dev/null; then
            log_warning "docker-compose.yml should use \${POSTGRES_PASSWORD:-postgres_pass} pattern"
            ((VIOLATIONS++))
        fi
    fi
    
    log_success ".env SSOT check passed"
    return 0
}

check_deployment_script_ssot() {
    log_info "Checking deployment script SSOT compliance..."
    
    # Check if deployment script exists
    if [ ! -f "$SSOT_DEPLOYMENT_SCRIPT" ]; then
        log_error "SSOT deployment script not found: $SSOT_DEPLOYMENT_SCRIPT"
        ((VIOLATIONS++))
        return 1
    fi
    
    # Check if script uses SSOT docker-compose.yml
    if ! grep -q "$SSOT_DOCKER_COMPOSE" "$SSOT_DEPLOYMENT_SCRIPT" 2>/dev/null; then
        log_warning "Deployment script should reference $SSOT_DOCKER_COMPOSE"
        ((VIOLATIONS++))
    fi
    
    # Check if script sources common-functions.sh (SSOT)
    if ! grep -q "common-functions.sh" "$SSOT_DEPLOYMENT_SCRIPT" 2>/dev/null; then
        log_warning "Deployment script should source scripts/lib/common-functions.sh"
        ((VIOLATIONS++))
    fi
    
    log_success "Deployment script SSOT check passed"
    return 0
}

check_config_consistency() {
    log_info "Checking configuration consistency..."
    
    # Check if docker-compose.yml defaults match .env.example
    if [ -f "$SSOT_ENV_EXAMPLE" ] && [ -f "$SSOT_DOCKER_COMPOSE" ]; then
        # Extract POSTGRES_PASSWORD default from docker-compose
        COMPOSE_PASSWORD=$(grep -oP 'POSTGRES_PASSWORD.*?:\K[^}]+' "$SSOT_DOCKER_COMPOSE" 2>/dev/null | head -1 | tr -d ' ' || echo "")
        ENV_PASSWORD=$(grep "^POSTGRES_PASSWORD=" "$SSOT_ENV_EXAMPLE" 2>/dev/null | cut -d'=' -f2 || echo "")
        
        if [ -n "$COMPOSE_PASSWORD" ] && [ -n "$ENV_PASSWORD" ]; then
            if [ "$COMPOSE_PASSWORD" != "$ENV_PASSWORD" ]; then
                log_warning "POSTGRES_PASSWORD default mismatch between docker-compose.yml and .env.example"
                log_info "  docker-compose.yml: ${COMPOSE_PASSWORD:-not found}"
                log_info "  .env.example: ${ENV_PASSWORD:-not found}"
                ((VIOLATIONS++))
            fi
        fi
    fi
    
    log_success "Configuration consistency check passed"
    return 0
}

check_duplicate_configs() {
    log_info "Checking for duplicate configurations..."
    
    # Check for duplicate docker-compose files
    DOCKER_FILES=$(find . -name "docker-compose*.yml" ! -path "./archive/*" ! -path "./node_modules/*" 2>/dev/null | wc -l)
    if [ "$DOCKER_FILES" -gt 1 ]; then
        log_warning "Found $DOCKER_FILES docker-compose files (should be 1 at root + archived)"
        find . -name "docker-compose*.yml" ! -path "./archive/*" ! -path "./node_modules/*" -exec echo "  {}" \;
        ((VIOLATIONS++))
    fi
    
    # Check for duplicate env example files at root (frontend/.env.example is OK)
    ROOT_ENV_EXAMPLES=$(find . -maxdepth 1 -name "*.env.example" ! -path "./node_modules/*" 2>/dev/null | wc -l)
    if [ "$ROOT_ENV_EXAMPLES" -gt 0 ]; then
        log_warning "Found $ROOT_ENV_EXAMPLES env example files at root (should be in config/ directory)"
        find . -maxdepth 1 -name "*.env.example" ! -path "./node_modules/*" -exec echo "  {}" \;
        if [ "$FIX_MODE" = "--fix" ]; then
            log_info "Moving root .env.example files to config/..."
            find . -maxdepth 1 -name "*.env.example" ! -path "./node_modules/*" -exec mv {} config/ \;
            log_success "Moved to config/"
            ((FIXES++))
        else
            ((VIOLATIONS++))
        fi
    fi
    
    # Note: frontend/.env.example is legitimate (frontend-specific vars)
    # config/*.env.example are legitimate (SSOT templates)
    
    log_success "Duplicate config check passed"
    return 0
}

# ============================================================================
# Main Validation
# ============================================================================

main() {
    log_info "Starting Docker SSOT validation..."
    echo ""
    
    check_docker_compose_ssot
    check_env_ssot
    check_deployment_script_ssot
    check_config_consistency
    check_duplicate_configs
    
    echo ""
    if [ $VIOLATIONS -eq 0 ]; then
        log_success "All Docker SSOT validations passed!"
        if [ $FIXES -gt 0 ]; then
            log_info "Fixed $FIXES issues"
        fi
        exit 0
    else
        log_error "Found $VIOLATIONS SSOT violations"
        if [ "$FIX_MODE" != "--fix" ]; then
            log_info "Run with --fix to automatically fix issues"
        fi
        exit 1
    fi
}

main "$@"

