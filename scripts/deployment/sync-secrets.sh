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
# VALIDATE SECRET CONSISTENCY
# ============================================================================

validate_secret_consistency() {
    log_info "Validating secret consistency..."
    
    local errors=0
    
    # Get values
    local postgres_user=$(get_secret_value "POSTGRES_USER")
    local postgres_password=$(get_secret_value "POSTGRES_PASSWORD")
    local postgres_db=$(get_secret_value "POSTGRES_DB")
    local database_url=$(get_secret_value "DATABASE_URL")
    
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
        local expected_url=$(derive_database_url)
        if [[ "$database_url" != "$expected_url" ]]; then
            log_warning "DATABASE_URL doesn't match derived value"
            log_info "Current: ${database_url:0:50}..."
            log_info "Expected: ${expected_url:0:50}..."
            errors=$((errors + 1))
        fi
    fi
    
    if [[ $errors -eq 0 ]]; then
        log_success "Secret consistency validation passed"
        return 0
    else
        log_error "Found $errors consistency issue(s)"
        return 1
    fi
}

# ============================================================================
# SYNCHRONIZE SECRETS
# ============================================================================

synchronize_secrets() {
    log_info "Synchronizing secrets..."
    
    # Derive DATABASE_URL
    local database_url=$(derive_database_url)
    if [[ -z "$database_url" ]]; then
        log_error "Failed to derive DATABASE_URL"
        return 1
    fi
    
    # Update DATABASE_URL
    if set_secret_value "DATABASE_URL" "$database_url"; then
        log_success "DATABASE_URL synchronized"
    else
        log_error "Failed to synchronize DATABASE_URL"
        return 1
    fi
    
    return 0
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

