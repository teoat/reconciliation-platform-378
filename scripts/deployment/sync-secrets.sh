#!/bin/bash
# ============================================================================
# SECRET SYNCHRONIZATION SCRIPT
# ============================================================================
# Automatically synchronizes related secrets to ensure consistency
# - Derives DATABASE_URL from POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
# - Validates secret consistency
# - Updates secrets as needed
#
# Usage:
#   ./scripts/deployment/sync-secrets.sh [namespace]
#   ./scripts/deployment/sync-secrets.sh reconciliation-platform
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

# Configuration
NAMESPACE=${1:-reconciliation-platform}
SECRET_NAME="reconciliation-secrets"

# ============================================================================
# GET SECRET VALUE
# ============================================================================

get_secret_value() {
    local key=$1
    kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" \
        -o jsonpath="{.data.$key}" 2>/dev/null | base64 -d 2>/dev/null || echo ""
}

# ============================================================================
# SET SECRET VALUE
# ============================================================================

set_secret_value() {
    local key=$1
    local value=$2
    
    local encoded_value=$(echo -n "$value" | base64 | tr -d '\n')
    
    # Check if secret exists
    if ! kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &> /dev/null; then
        log_error "Secret $SECRET_NAME not found in namespace $NAMESPACE"
        return 1
    fi
    
    # Check if value already matches
    local current_value=$(get_secret_value "$key")
    if [[ "$current_value" == "$value" ]]; then
        log_info "Secret $key already has correct value"
        return 0
    fi
    
    # Update secret
    kubectl patch secret "$SECRET_NAME" -n "$NAMESPACE" --type='json' \
        -p="[{\"op\": \"replace\", \"path\": \"/data/$key\", \"value\": \"$encoded_value\"}]" || {
        log_error "Failed to update secret $key"
        return 1
    }
    
    log_success "Updated secret: $key"
    return 0
}

# ============================================================================
# DERIVE DATABASE_URL
# ============================================================================

derive_database_url() {
    local postgres_user=$(get_secret_value "POSTGRES_USER")
    local postgres_password=$(get_secret_value "POSTGRES_PASSWORD")
    local postgres_db=$(get_secret_value "POSTGRES_DB")
    local postgres_host="${POSTGRES_HOST:-postgres-service}"
    local postgres_port="${POSTGRES_PORT:-5432}"
    
    # Validate components
    if [[ -z "$postgres_user" ]]; then
        log_error "POSTGRES_USER is not set"
        return 1
    fi
    
    if [[ -z "$postgres_password" ]]; then
        log_error "POSTGRES_PASSWORD is not set"
        return 1
    fi
    
    if [[ -z "$postgres_db" ]]; then
        log_error "POSTGRES_DB is not set"
        return 1
    fi
    
    # Check for placeholder values
    if [[ "$postgres_password" == *"CHANGE_ME"* ]]; then
        log_error "POSTGRES_PASSWORD contains placeholder value (CHANGE_ME)"
        return 1
    fi
    
    # Build DATABASE_URL
    local database_url="postgresql://${postgres_user}:${postgres_password}@${postgres_host}:${postgres_port}/${postgres_db}?sslmode=disable"
    
    echo "$database_url"
}

# ============================================================================
# DERIVE REDIS_URL
# ============================================================================

derive_redis_url() {
    local redis_password=$(get_secret_value "REDIS_PASSWORD")
    local redis_host="${REDIS_HOST:-redis-service}"
    local redis_port="${REDIS_PORT:-6379}"
    local redis_db="${REDIS_DB:-0}"
    
    # If password is set, include it in URL
    if [[ -n "$redis_password" && "$redis_password" != *"CHANGE_ME"* ]]; then
        # Format: redis://:password@host:port/db
        echo "redis://:${redis_password}@${redis_host}:${redis_port}/${redis_db}"
    else
        # Format: redis://host:port/db
        echo "redis://${redis_host}:${redis_port}/${redis_db}"
    fi
}

# ============================================================================
# ENSURE JWT_REFRESH_SECRET
# ============================================================================

ensure_jwt_refresh_secret() {
    local jwt_refresh_secret=$(get_secret_value "JWT_REFRESH_SECRET")
    local jwt_secret=$(get_secret_value "JWT_SECRET")
    
    # If JWT_REFRESH_SECRET is empty or placeholder, use JWT_SECRET
    if [[ -z "$jwt_refresh_secret" || "$jwt_refresh_secret" == *"CHANGE_ME"* ]]; then
        if [[ -n "$jwt_secret" && "$jwt_secret" != *"CHANGE_ME"* ]]; then
            log_info "JWT_REFRESH_SECRET not set, using JWT_SECRET as fallback"
            if set_secret_value "JWT_REFRESH_SECRET" "$jwt_secret"; then
                log_success "JWT_REFRESH_SECRET synchronized with JWT_SECRET"
                return 0
            else
                log_warning "Failed to set JWT_REFRESH_SECRET fallback"
                return 1
            fi
        else
            log_warning "JWT_SECRET is not set, cannot set JWT_REFRESH_SECRET fallback"
            return 1
        fi
    fi
    
    return 0
}

# ============================================================================
# VALIDATE SECRET CONSISTENCY
# ============================================================================

validate_secret_consistency() {
    log_info "Validating secret consistency..."
    
    local errors=0
    local warnings=0
    
    # Get values
    local postgres_user=$(get_secret_value "POSTGRES_USER")
    local postgres_password=$(get_secret_value "POSTGRES_PASSWORD")
    local postgres_db=$(get_secret_value "POSTGRES_DB")
    local database_url=$(get_secret_value "DATABASE_URL")
    local redis_url=$(get_secret_value "REDIS_URL")
    local redis_password=$(get_secret_value "REDIS_PASSWORD")
    local jwt_secret=$(get_secret_value "JWT_SECRET")
    local jwt_refresh_secret=$(get_secret_value "JWT_REFRESH_SECRET")
    
    # Check required secrets exist
    if [[ -z "$postgres_user" ]]; then
        log_error "POSTGRES_USER is missing"
        errors=$((errors + 1))
    fi
    
    if [[ -z "$postgres_password" ]]; then
        log_error "POSTGRES_PASSWORD is missing"
        errors=$((errors + 1))
    fi
    
    if [[ -z "$postgres_db" ]]; then
        log_error "POSTGRES_DB is missing"
        errors=$((errors + 1))
    fi
    
    if [[ -z "$database_url" ]]; then
        log_error "DATABASE_URL is missing"
        errors=$((errors + 1))
    fi
    
    # Check for placeholder values
    if [[ "$postgres_password" == *"CHANGE_ME"* ]]; then
        log_error "POSTGRES_PASSWORD contains placeholder value"
        errors=$((errors + 1))
    fi
    
    if [[ "$database_url" == *"CHANGE_ME"* ]]; then
        log_error "DATABASE_URL contains placeholder value"
        errors=$((errors + 1))
    fi
    
    # Validate DATABASE_URL matches components
    if [[ -n "$database_url" && -n "$postgres_user" && -n "$postgres_password" && -n "$postgres_db" ]]; then
        local expected_url=$(derive_database_url 2>/dev/null)
        if [[ -n "$expected_url" && "$database_url" != "$expected_url" ]]; then
            log_warning "DATABASE_URL doesn't match derived value"
            log_info "Current: ${database_url:0:50}..."
            log_info "Expected: ${expected_url:0:50}..."
            warnings=$((warnings + 1))
        fi
    fi
    
    # Validate REDIS_URL if password is set
    if [[ -n "$redis_password" && "$redis_password" != *"CHANGE_ME"* && -n "$redis_url" ]]; then
        local expected_redis_url=$(derive_redis_url 2>/dev/null)
        if [[ -n "$expected_redis_url" && "$redis_url" != "$expected_redis_url" ]]; then
            log_warning "REDIS_URL doesn't match derived value (password may be missing)"
            warnings=$((warnings + 1))
        fi
    fi
    
    # Validate JWT_REFRESH_SECRET fallback
    if [[ -z "$jwt_refresh_secret" || "$jwt_refresh_secret" == *"CHANGE_ME"* ]]; then
        if [[ -n "$jwt_secret" && "$jwt_secret" != *"CHANGE_ME"* ]]; then
            log_warning "JWT_REFRESH_SECRET not set, should fallback to JWT_SECRET"
            warnings=$((warnings + 1))
        fi
    fi
    
    if [[ $errors -eq 0 && $warnings -eq 0 ]]; then
        log_success "Secret consistency validation passed"
        return 0
    elif [[ $errors -eq 0 ]]; then
        log_warning "Secret consistency validation passed with $warnings warning(s)"
        return 0
    else
        log_error "Found $errors error(s) and $warnings warning(s)"
        return 1
    fi
}

# ============================================================================
# SYNCHRONIZE SECRETS
# ============================================================================

synchronize_secrets() {
    log_info "Synchronizing secrets..."
    
    local sync_errors=0
    
    # 1. Ensure JWT_REFRESH_SECRET (fallback to JWT_SECRET)
    ensure_jwt_refresh_secret || sync_errors=$((sync_errors + 1))
    
    # 2. Derive and sync DATABASE_URL
    local database_url=$(derive_database_url 2>/dev/null)
    if [[ -n "$database_url" ]]; then
        if set_secret_value "DATABASE_URL" "$database_url"; then
            log_success "DATABASE_URL synchronized"
        else
            log_error "Failed to synchronize DATABASE_URL"
            sync_errors=$((sync_errors + 1))
        fi
    else
        log_warning "Cannot derive DATABASE_URL (missing components or placeholder values)"
    fi
    
    # 3. Derive and sync REDIS_URL if password is set
    local redis_password=$(get_secret_value "REDIS_PASSWORD")
    if [[ -n "$redis_password" && "$redis_password" != *"CHANGE_ME"* && "$redis_password" != "" ]]; then
        local redis_url=$(derive_redis_url)
        if [[ -n "$redis_url" ]]; then
            local current_redis_url=$(get_secret_value "REDIS_URL")
            # Only update if current URL doesn't contain password
            if [[ "$current_redis_url" != *":${redis_password}@"* ]]; then
                if set_secret_value "REDIS_URL" "$redis_url"; then
                    log_success "REDIS_URL synchronized with password"
                else
                    log_warning "Failed to synchronize REDIS_URL"
                    sync_errors=$((sync_errors + 1))
                fi
            else
                log_info "REDIS_URL already contains password"
            fi
        fi
    else
        log_info "REDIS_PASSWORD not set, skipping REDIS_URL synchronization"
    fi
    
    if [[ $sync_errors -eq 0 ]]; then
        log_success "All secrets synchronized successfully"
        return 0
    else
        log_warning "Secret synchronization completed with $sync_errors error(s)"
        return 1
    fi
}

# ============================================================================
# VALIDATE ALL SECRETS
# ============================================================================

validate_all_secrets() {
    log_info "Validating all secrets..."
    
    local required_secrets=(
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "POSTGRES_USER"
        "POSTGRES_PASSWORD"
        "POSTGRES_DB"
        "DATABASE_URL"
        "CSRF_SECRET"
        "PASSWORD_MASTER_KEY"
    )
    
    local errors=0
    local warnings=0
    
    for secret in "${required_secrets[@]}"; do
        local value=$(get_secret_value "$secret")
        
        if [[ -z "$value" ]]; then
            log_error "Missing required secret: $secret"
            errors=$((errors + 1))
        elif [[ "$value" == *"CHANGE_ME"* ]]; then
            log_warning "Secret $secret contains placeholder value"
            warnings=$((warnings + 1))
        else
            log_success "Secret $secret is set"
        fi
    done
    
    # Validate lengths
    local jwt_secret=$(get_secret_value "JWT_SECRET")
    if [[ -n "$jwt_secret" && ${#jwt_secret} -lt 32 ]]; then
        log_warning "JWT_SECRET is too short (${#jwt_secret} < 32)"
        warnings=$((warnings + 1))
    fi
    
    local postgres_password=$(get_secret_value "POSTGRES_PASSWORD")
    if [[ -n "$postgres_password" && ${#postgres_password} -lt 16 ]]; then
        log_warning "POSTGRES_PASSWORD is too short (${#postgres_password} < 16)"
        warnings=$((warnings + 1))
    fi
    
    echo ""
    if [[ $errors -eq 0 && $warnings -eq 0 ]]; then
        log_success "All secrets validated successfully"
        return 0
    elif [[ $errors -eq 0 ]]; then
        log_warning "Validation completed with $warnings warning(s)"
        return 0
    else
        log_error "Validation failed with $errors error(s) and $warnings warning(s)"
        return 1
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    local action=${2:-sync}
    
    echo "============================================================================"
    echo "SECRET SYNCHRONIZATION"
    echo "============================================================================"
    echo "Namespace: $NAMESPACE"
    echo "Secret: $SECRET_NAME"
    echo "Action: $action"
    echo ""
    
    # Check if secret exists
    if ! kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &> /dev/null; then
        log_error "Secret $SECRET_NAME not found in namespace $NAMESPACE"
        log_info "Create secrets first: ./scripts/deployment/setup-production-secrets.sh create"
        exit 1
    fi
    
    case "$action" in
        sync)
            validate_all_secrets || {
                log_warning "Some secrets have issues, but continuing with sync..."
            }
            synchronize_secrets
            validate_secret_consistency
            ;;
        validate)
            validate_all_secrets
            validate_secret_consistency
            ;;
        *)
            log_error "Unknown action: $action"
            echo "Available actions: sync, validate"
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

