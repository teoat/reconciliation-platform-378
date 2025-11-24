#!/bin/bash
# Comprehensive Secret Management Script for Kubernetes
# Usage: ./manage-secrets.sh [action] [environment]
# Actions: create, update, validate, rotate, list, delete

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
NAMESPACE="reconciliation-platform"
SECRET_NAME="reconciliation-secrets"
ACTION=${1:-help}
ENVIRONMENT=${2:-development}

# Secret definitions with minimum lengths
declare -A SECRET_MIN_LENGTHS=(
    ["JWT_SECRET"]=32
    ["JWT_REFRESH_SECRET"]=32
    ["CSRF_SECRET"]=32
    ["POSTGRES_PASSWORD"]=16
    ["DB_PASSWORD"]=16
    ["REDIS_PASSWORD"]=16
    ["PASSWORD_MASTER_KEY"]=32
    ["BACKUP_ENCRYPTION_KEY"]=32
    ["STRIPE_SECRET_KEY"]=32
    ["STRIPE_WEBHOOK_SECRET"]=32
    ["API_KEY"]=32
    ["GRAFANA_PASSWORD"]=16
    ["AWS_SECRET_ACCESS_KEY"]=32
)

# Required secrets
REQUIRED_SECRETS=(
    "JWT_SECRET"
    "DATABASE_URL"
    "CSRF_SECRET"
    "PASSWORD_MASTER_KEY"
)

# Generate secure secret
generate_secret() {
    local length=${1:-48}
    openssl rand -base64 "$length" | tr -d '\n'
}

# Validate secret length
validate_secret() {
    local name=$1
    local value=$2
    local min_length=${SECRET_MIN_LENGTHS[$name]:-16}
    
    if [ ${#value} -lt $min_length ]; then
        echo -e "${RED}Error: $name must be at least $min_length characters (found ${#value})${NC}"
        return 1
    fi
    return 0
}

# Create secrets
create_secrets() {
    echo -e "${BLUE}Creating Kubernetes secrets...${NC}"
    
    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" &>/dev/null; then
        echo -e "${YELLOW}Creating namespace $NAMESPACE...${NC}"
        kubectl create namespace "$NAMESPACE"
    fi
    
    # Check if secret already exists
    if kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &>/dev/null; then
        echo -e "${YELLOW}Secret $SECRET_NAME already exists. Use 'update' action to modify.${NC}"
        return 1
    fi
    
    # Generate required secrets
    local jwt_secret=$(generate_secret 48)
    local csrf_secret=$(generate_secret 48)
    local db_password=$(generate_secret 24)
    local master_key=$(generate_secret 48)
    
    # Build DATABASE_URL
    local database_url="postgresql://postgres:${db_password}@postgres-service:5432/reconciliation?sslmode=disable"
    
    echo -e "${GREEN}Generating secure secrets...${NC}"
    
    # Create secret
    kubectl create secret generic "$SECRET_NAME" \
        --from-literal=JWT_SECRET="$jwt_secret" \
        --from-literal=JWT_REFRESH_SECRET="" \
        --from-literal=JWT_EXPIRATION="3600" \
        --from-literal=DATABASE_URL="$database_url" \
        --from-literal=POSTGRES_USER="postgres" \
        --from-literal=POSTGRES_PASSWORD="$db_password" \
        --from-literal=CSRF_SECRET="$csrf_secret" \
        --from-literal=PASSWORD_MASTER_KEY="$master_key" \
        --from-literal=REDIS_URL="redis://redis-service:6379/0" \
        --from-literal=REDIS_PASSWORD="" \
        --from-literal=GOOGLE_CLIENT_ID="" \
        --from-literal=GOOGLE_CLIENT_SECRET="" \
        --from-literal=VITE_GOOGLE_CLIENT_ID="" \
        --from-literal=SMTP_PASSWORD="" \
        --from-literal=STRIPE_SECRET_KEY="" \
        --from-literal=STRIPE_WEBHOOK_SECRET="" \
        --from-literal=API_KEY="" \
        --from-literal=GRAFANA_PASSWORD="" \
        --from-literal=SENTRY_DSN="" \
        --from-literal=BACKUP_ENCRYPTION_KEY="" \
        --from-literal=AWS_ACCESS_KEY_ID="" \
        --from-literal=AWS_SECRET_ACCESS_KEY="" \
        -n "$NAMESPACE"
    
    echo -e "${GREEN}✓ Secrets created successfully${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANT: Save the generated secrets securely!${NC}"
}

# Update a specific secret
update_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -z "$secret_name" ] || [ -z "$secret_value" ]; then
        echo -e "${RED}Usage: update <secret-name> <secret-value>${NC}"
        return 1
    fi
    
    # Validate secret if we have a minimum length
    if [ -n "${SECRET_MIN_LENGTHS[$secret_name]}" ]; then
        if ! validate_secret "$secret_name" "$secret_value"; then
            return 1
        fi
    fi
    
    echo -e "${BLUE}Updating secret: $secret_name${NC}"
    
    # Base64 encode the value
    local encoded_value=$(echo -n "$secret_value" | base64)
    
    # Patch the secret
    kubectl patch secret "$SECRET_NAME" -n "$NAMESPACE" \
        -p="{\"data\":{\"$secret_name\":\"$encoded_value\"}}"
    
    echo -e "${GREEN}✓ Secret updated${NC}"
    echo -e "${YELLOW}⚠️  Restart pods to pick up the new secret:${NC}"
    echo "   kubectl rollout restart deployment/backend -n $NAMESPACE"
    echo "   kubectl rollout restart deployment/frontend -n $NAMESPACE"
}

# Validate all secrets
validate_secrets() {
    echo -e "${BLUE}Validating secrets...${NC}"
    
    if ! kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &>/dev/null; then
        echo -e "${RED}Error: Secret $SECRET_NAME not found${NC}"
        return 1
    fi
    
    local errors=0
    local warnings=0
    
    # Check required secrets
    for secret in "${REQUIRED_SECRETS[@]}"; do
        local value=$(kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" \
            -o jsonpath="{.data.$secret}" 2>/dev/null | base64 -d 2>/dev/null || echo "")
        
        if [ -z "$value" ] || [ "$value" == "CHANGE_ME"* ]; then
            echo -e "${RED}✗ Missing or default: $secret${NC}"
            ((errors++))
        elif [ -n "${SECRET_MIN_LENGTHS[$secret]}" ]; then
            if ! validate_secret "$secret" "$value"; then
                ((errors++))
            else
                echo -e "${GREEN}✓ Valid: $secret${NC}"
            fi
        else
            echo -e "${GREEN}✓ Present: $secret${NC}"
        fi
    done
    
    # Check optional secrets
    for secret in "${!SECRET_MIN_LENGTHS[@]}"; do
        if [[ ! " ${REQUIRED_SECRETS[@]} " =~ " ${secret} " ]]; then
            local value=$(kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" \
                -o jsonpath="{.data.$secret}" 2>/dev/null | base64 -d 2>/dev/null || echo "")
            
            if [ -n "$value" ] && [ "$value" != "CHANGE_ME"* ] && [ -z "$value" ]; then
                if [ -n "${SECRET_MIN_LENGTHS[$secret]}" ]; then
                    if ! validate_secret "$secret" "$value"; then
                        ((warnings++))
                    fi
                fi
            fi
        fi
    done
    
    if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
        echo -e "${GREEN}✓ All secrets validated successfully${NC}"
        return 0
    elif [ $errors -eq 0 ]; then
        echo -e "${YELLOW}⚠️  Validation completed with $warnings warning(s)${NC}"
        return 0
    else
        echo -e "${RED}✗ Validation failed with $errors error(s)${NC}"
        return 1
    fi
}

# Rotate a secret
rotate_secret() {
    local secret_name=$1
    
    if [ -z "$secret_name" ]; then
        echo -e "${RED}Usage: rotate <secret-name>${NC}"
        echo -e "${YELLOW}Available secrets:${NC}"
        for secret in "${!SECRET_MIN_LENGTHS[@]}"; do
            echo "  - $secret"
        done
        return 1
    fi
    
    if [ -z "${SECRET_MIN_LENGTHS[$secret_name]}" ]; then
        echo -e "${RED}Error: Unknown secret name: $secret_name${NC}"
        return 1
    fi
    
    local min_length=${SECRET_MIN_LENGTHS[$secret_name]}
    local new_secret=$(generate_secret $((min_length * 2)))
    
    echo -e "${BLUE}Rotating secret: $secret_name${NC}"
    echo -e "${YELLOW}⚠️  This will update the secret. Make sure to:${NC}"
    echo "   1. Update any external systems using this secret"
    echo "   2. Restart pods after rotation"
    echo ""
    read -p "Continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cancelled${NC}"
        return 1
    fi
    
    update_secret "$secret_name" "$new_secret"
    
    echo -e "${GREEN}✓ Secret rotated${NC}"
    echo -e "${YELLOW}⚠️  Restart pods to apply changes${NC}"
}

# List secrets (masked)
list_secrets() {
    echo -e "${BLUE}Listing secrets (values masked)...${NC}"
    
    if ! kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &>/dev/null; then
        echo -e "${RED}Error: Secret $SECRET_NAME not found${NC}"
        return 1
    fi
    
    local data=$(kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" -o jsonpath='{.data}')
    local keys=$(echo "$data" | jq -r 'keys[]' 2>/dev/null || echo "")
    
    if [ -z "$keys" ]; then
        echo -e "${YELLOW}No secrets found${NC}"
        return 1
    fi
    
    echo ""
    printf "%-30s %-10s %s\n" "SECRET NAME" "STATUS" "VALUE (MASKED)"
    echo "─────────────────────────────────────────────────────────────────"
    
    for key in $keys; do
        local value=$(kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" \
            -o jsonpath="{.data.$key}" 2>/dev/null | base64 -d 2>/dev/null || echo "")
        
        local status=""
        local masked=""
        
        if [ -z "$value" ] || [ "$value" == "CHANGE_ME"* ]; then
            status="${RED}DEFAULT${NC}"
            masked="*** NOT SET ***"
        elif [ ${#value} -ge 8 ]; then
            status="${GREEN}SET${NC}"
            masked="${value:0:4}...${value: -4}"
        else
            status="${GREEN}SET${NC}"
            masked="***"
        fi
        
        printf "%-30s %-10s %s\n" "$key" "$status" "$masked"
    done
    
    echo ""
}

# Delete secrets
delete_secrets() {
    echo -e "${YELLOW}⚠️  WARNING: This will delete all secrets!${NC}"
    read -p "Are you sure? Type 'DELETE' to confirm: " -r
    echo
    
    if [ "$REPLY" != "DELETE" ]; then
        echo -e "${YELLOW}Cancelled${NC}"
        return 1
    fi
    
    kubectl delete secret "$SECRET_NAME" -n "$NAMESPACE"
    echo -e "${GREEN}✓ Secrets deleted${NC}"
}

# Show help
show_help() {
    cat << EOF
${BLUE}Kubernetes Secret Management Script${NC}

${GREEN}Usage:${NC}
  $0 [action] [options]

${GREEN}Actions:${NC}
  create              Create new secrets with generated values
  update <name> <val> Update a specific secret
  validate            Validate all secrets
  rotate <name>       Rotate (regenerate) a specific secret
  list                List all secrets (values masked)
  delete              Delete all secrets (requires confirmation)
  help                Show this help message

${GREEN}Examples:${NC}
  $0 create
  $0 validate
  $0 rotate JWT_SECRET
  $0 update GOOGLE_CLIENT_ID "your-client-id"
  $0 list

${GREEN}Required Secrets:${NC}
$(printf "  - %s\n" "${REQUIRED_SECRETS[@]}")

${GREEN}Secret Minimum Lengths:${NC}
$(for secret in "${!SECRET_MIN_LENGTHS[@]}"; do
    printf "  - %s: %s characters\n" "$secret" "${SECRET_MIN_LENGTHS[$secret]}"
done)

EOF
}

# Main execution
main() {
    case $ACTION in
        create)
            create_secrets
            ;;
        update)
            update_secret "$2" "$3"
            ;;
        validate)
            validate_secrets
            ;;
        rotate)
            rotate_secret "$2"
            ;;
        list)
            list_secrets
            ;;
        delete)
            delete_secrets
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}Error: Unknown action: $ACTION${NC}"
            show_help
            exit 1
            ;;
    esac
}

main "$@"


