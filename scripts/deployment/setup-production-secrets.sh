#!/bin/bash
# ============================================================================
# PRODUCTION SECRETS SETUP SCRIPT
# ============================================================================
# Creates and manages production secrets for Kubernetes deployment
#
# Usage:
#   ./scripts/deployment/setup-production-secrets.sh [action]
#   ./scripts/deployment/setup-production-secrets.sh create
#   ./scripts/deployment/setup-production-secrets.sh update
#   ./scripts/deployment/setup-production-secrets.sh verify
#
# Actions:
#   create  - Create new secrets (interactive)
#   update  - Update existing secrets
#   verify  - Verify secrets are set correctly
#   generate - Generate secure random values
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

# Configuration
NAMESPACE="reconciliation-platform"
SECRET_NAME="reconciliation-secrets"
ACTION=${1:-create}

# ============================================================================
# GENERATE SECURE SECRETS
# ============================================================================

generate_secret() {
    local length=${1:-48}
    openssl rand -base64 "$length" | tr -d '\n'
}

# ============================================================================
# CREATE SECRETS
# ============================================================================

create_secrets() {
    log_info "Creating production secrets..."
    
    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_info "Creating namespace: $NAMESPACE"
        kubectl create namespace "$NAMESPACE" || {
            log_error "Failed to create namespace"
            exit 1
        }
    fi
    
    # Check if secrets already exist
    if kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &> /dev/null; then
        log_warning "Secrets already exist. Use 'update' action to modify."
        return 1
    fi
    
    echo ""
    log_info "Generating secure secrets..."
    
    # Generate secrets
    local jwt_secret=$(generate_secret 48)
    local jwt_refresh_secret=$(generate_secret 48)
    local postgres_password=$(generate_secret 24)
    local csrf_secret=$(generate_secret 48)
    local password_master_key=$(generate_secret 48)
    
    # Prompt for optional secrets
    echo ""
    read -p "PostgreSQL username [postgres]: " postgres_user
    postgres_user=${postgres_user:-postgres}
    
    read -p "PostgreSQL database name [reconciliation]: " postgres_db
    postgres_db=${postgres_db:-reconciliation}
    
    # Build DATABASE_URL (will be synchronized automatically)
    local database_url="postgresql://${postgres_user}:${postgres_password}@postgres-service:5432/${postgres_db}?sslmode=disable"
    
    read -p "Redis URL [redis://redis-service:6379/0]: " redis_url
    redis_url=${redis_url:-redis://redis-service:6379/0}
    
    read -p "Google OAuth Client ID (optional, press Enter to skip): " google_client_id
    read -p "Google OAuth Client Secret (optional, press Enter to skip): " google_client_secret
    
    echo ""
    log_info "Creating Kubernetes secret..."
    
    # Create secret
    kubectl create secret generic "$SECRET_NAME" \
        --from-literal=JWT_SECRET="$jwt_secret" \
        --from-literal=JWT_REFRESH_SECRET="$jwt_refresh_secret" \
        --from-literal=POSTGRES_USER="$postgres_user" \
        --from-literal=POSTGRES_PASSWORD="$postgres_password" \
        --from-literal=POSTGRES_DB="$postgres_db" \
        --from-literal=DATABASE_URL="$database_url" \
        --from-literal=CSRF_SECRET="$csrf_secret" \
        --from-literal=PASSWORD_MASTER_KEY="$password_master_key" \
        --from-literal=REDIS_URL="$redis_url" \
        -n "$NAMESPACE" || {
        log_error "Failed to create secret"
        exit 1
    }
    
    # Add optional secrets if provided
    if [[ -n "$google_client_id" ]]; then
        kubectl patch secret "$SECRET_NAME" -n "$NAMESPACE" --type='json' \
            -p="[{\"op\": \"add\", \"path\": \"/data/GOOGLE_CLIENT_ID\", \"value\": \"$(echo -n "$google_client_id" | base64)\"}]" || true
    fi
    
    if [[ -n "$google_client_secret" ]]; then
        kubectl patch secret "$SECRET_NAME" -n "$NAMESPACE" --type='json' \
            -p="[{\"op\": \"add\", \"path\": \"/data/GOOGLE_CLIENT_SECRET\", \"value\": \"$(echo -n "$google_client_secret" | base64)\"}]" || true
    fi
    
    log_success "Secrets created successfully"
    
    # Synchronize derived secrets
    log_info "Synchronizing derived secrets..."
    if [[ -f "$SCRIPT_DIR/sync-secrets.sh" ]]; then
        "$SCRIPT_DIR/sync-secrets.sh" "$NAMESPACE" sync || {
            log_warning "Secret synchronization had issues, but secrets were created"
        }
    fi
    
    # Save secrets to secure file (optional)
    echo ""
    read -p "Save secrets to encrypted file? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        local secrets_file="$PROJECT_ROOT/.secrets.production.enc"
        log_info "Saving secrets to: $secrets_file"
        
        cat > /tmp/secrets.txt <<EOF
JWT_SECRET=$jwt_secret
JWT_REFRESH_SECRET=$jwt_refresh_secret
POSTGRES_USER=$postgres_user
POSTGRES_PASSWORD=$postgres_password
POSTGRES_DB=$postgres_db
DATABASE_URL=$database_url
CSRF_SECRET=$csrf_secret
PASSWORD_MASTER_KEY=$password_master_key
REDIS_URL=$redis_url
GOOGLE_CLIENT_ID=$google_client_id
GOOGLE_CLIENT_SECRET=$google_client_secret
EOF
        
        # Encrypt with openssl (requires password)
        openssl enc -aes-256-cbc -salt -in /tmp/secrets.txt -out "$secrets_file" || {
            log_warning "Failed to encrypt secrets file"
        }
        
        rm -f /tmp/secrets.txt
        log_success "Secrets saved to encrypted file"
        log_warning "Keep this file secure and never commit it to version control!"
    fi
}

# ============================================================================
# UPDATE SECRETS
# ============================================================================

update_secrets() {
    log_info "Updating production secrets..."
    
    if ! kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &> /dev/null; then
        log_error "Secret not found. Use 'create' action first."
        exit 1
    fi
    
    echo ""
    log_info "Which secret would you like to update?"
    echo "1. JWT_SECRET"
    echo "2. JWT_REFRESH_SECRET"
    echo "3. POSTGRES_PASSWORD"
    echo "4. CSRF_SECRET"
    echo "5. PASSWORD_MASTER_KEY"
    echo "6. All secrets (regenerate all)"
    echo ""
    read -p "Choice [1-6]: " choice
    
    case "$choice" in
        1)
            local new_value=$(generate_secret 48)
            kubectl patch secret "$SECRET_NAME" -n "$NAMESPACE" --type='json' \
                -p="[{\"op\": \"replace\", \"path\": \"/data/JWT_SECRET\", \"value\": \"$(echo -n "$new_value" | base64)\"}]"
            log_success "JWT_SECRET updated"
            ;;
        2)
            local new_value=$(generate_secret 48)
            kubectl patch secret "$SECRET_NAME" -n "$NAMESPACE" --type='json' \
                -p="[{\"op\": \"replace\", \"path\": \"/data/JWT_REFRESH_SECRET\", \"value\": \"$(echo -n "$new_value" | base64)\"}]"
            log_success "JWT_REFRESH_SECRET updated"
            ;;
        3)
            local new_value=$(generate_secret 24)
            kubectl patch secret "$SECRET_NAME" -n "$NAMESPACE" --type='json' \
                -p="[{\"op\": \"replace\", \"path\": \"/data/POSTGRES_PASSWORD\", \"value\": \"$(echo -n "$new_value" | base64)\"}]"
            log_success "POSTGRES_PASSWORD updated"
            log_info "Synchronizing DATABASE_URL..."
            if [[ -f "$SCRIPT_DIR/sync-secrets.sh" ]]; then
                "$SCRIPT_DIR/sync-secrets.sh" "$NAMESPACE" sync || {
                    log_warning "Failed to synchronize DATABASE_URL automatically"
                    log_warning "Run manually: ./scripts/deployment/sync-secrets.sh $NAMESPACE sync"
                }
            fi
            ;;
        4)
            local new_value=$(generate_secret 48)
            kubectl patch secret "$SECRET_NAME" -n "$NAMESPACE" --type='json' \
                -p="[{\"op\": \"replace\", \"path\": \"/data/CSRF_SECRET\", \"value\": \"$(echo -n "$new_value" | base64)\"}]"
            log_success "CSRF_SECRET updated"
            ;;
        5)
            local new_value=$(generate_secret 48)
            kubectl patch secret "$SECRET_NAME" -n "$NAMESPACE" --type='json' \
                -p="[{\"op\": \"replace\", \"path\": \"/data/PASSWORD_MASTER_KEY\", \"value\": \"$(echo -n "$new_value" | base64)\"}]"
            log_success "PASSWORD_MASTER_KEY updated"
            ;;
        6)
            log_info "Regenerating all secrets..."
            create_secrets
            ;;
        *)
            log_error "Invalid choice"
            exit 1
            ;;
    esac
}

# ============================================================================
# VERIFY SECRETS
# ============================================================================

verify_secrets() {
    log_info "Verifying production secrets..."
    
    if ! kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &> /dev/null; then
        log_error "Secret not found"
        exit 1
    fi
    
    # Check required secrets
    local required_secrets=(
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "POSTGRES_PASSWORD"
        "CSRF_SECRET"
        "PASSWORD_MASTER_KEY"
        "DATABASE_URL"
    )
    
    local all_valid=true
    
    for secret in "${required_secrets[@]}"; do
        local value=$(kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" \
            -o jsonpath="{.data.$secret}" 2>/dev/null | base64 -d 2>/dev/null || echo "")
        
        if [[ -z "$value" ]]; then
            log_error "Missing required secret: $secret"
            all_valid=false
        elif [[ "$value" == *"CHANGE_ME"* ]]; then
            log_warning "Secret $secret contains default value (CHANGE_ME)"
            all_valid=false
        else
            log_success "Secret $secret is set"
        fi
    done
    
    if [[ "$all_valid" == "true" ]]; then
        log_success "All secrets are valid"
    else
        log_error "Some secrets are missing or invalid"
        exit 1
    fi
}

# ============================================================================
# GENERATE VALUES
# ============================================================================

generate_values() {
    log_info "Generating secure random values..."
    echo ""
    echo "JWT_SECRET: $(generate_secret 48)"
    echo "JWT_REFRESH_SECRET: $(generate_secret 48)"
    echo "POSTGRES_PASSWORD: $(generate_secret 24)"
    echo "CSRF_SECRET: $(generate_secret 48)"
    echo "PASSWORD_MASTER_KEY: $(generate_secret 48)"
    echo ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    echo "============================================================================"
    echo "PRODUCTION SECRETS MANAGEMENT"
    echo "============================================================================"
    echo "Action: $ACTION"
    echo "Namespace: $NAMESPACE"
    echo "Secret Name: $SECRET_NAME"
    echo ""
    
    case "$ACTION" in
        create)
            create_secrets
            ;;
        update)
            update_secrets
            ;;
        verify)
            verify_secrets
            ;;
        generate)
            generate_values
            ;;
        *)
            log_error "Unknown action: $ACTION"
            echo "Available actions: create, update, verify, generate"
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

