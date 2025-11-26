#!/bin/bash
# scripts/validate-secrets.sh
# Validates that all required secrets are set and not using default values

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if we're in production
ENVIRONMENT=${ENVIRONMENT:-development}
IS_PRODUCTION=false
if [ "$ENVIRONMENT" = "production" ] || [ "$NODE_ENV" = "production" ]; then
    IS_PRODUCTION=true
fi

log_error() {
    echo -e "${RED}❌ ERROR: $1${NC}" >&2
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Default value patterns to detect
DEFAULT_PATTERNS=(
    "change-this"
    "CHANGE_ME"
    "default-"
    "your-"
    "your_"
)

# Required secrets (must be set)
REQUIRED_SECRETS=(
    "JWT_SECRET"
    "DATABASE_URL"
    "CSRF_SECRET"
    "PASSWORD_MASTER_KEY"
)

# Optional secrets (should not use defaults if set)
OPTIONAL_SECRETS=(
    "JWT_REFRESH_SECRET"
    "REDIS_URL"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "SMTP_PASSWORD"
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "API_KEY"
    "SOFTCODE_API_KEY"
    "SENTRY_DSN"
    "BACKUP_ENCRYPTION_KEY"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
)

check_secret() {
    local secret_name=$1
    local is_required=$2
    local value="${!secret_name}"
    
    if [ -z "$value" ]; then
        if [ "$is_required" = "true" ]; then
            log_error "Required secret '$secret_name' is not set"
            return 1
        else
            log_warning "Optional secret '$secret_name' is not set (will use default if available)"
            return 0
        fi
    fi
    
    # Check for default value patterns
    for pattern in "${DEFAULT_PATTERNS[@]}"; do
        if echo "$value" | grep -qi "$pattern"; then
            if [ "$IS_PRODUCTION" = "true" ]; then
                log_error "Secret '$secret_name' appears to use a default value in production: ${value:0:20}..."
                return 1
            else
                log_warning "Secret '$secret_name' appears to use a default value: ${value:0:20}..."
            fi
        fi
    done
    
    # Check minimum length for critical secrets
    if [ "$is_required" = "true" ]; then
        case "$secret_name" in
            JWT_SECRET|CSRF_SECRET|PASSWORD_MASTER_KEY)
                if [ ${#value} -lt 32 ]; then
                    log_error "Secret '$secret_name' is too short (${#value} chars, minimum 32)"
                    return 1
                fi
                ;;
        esac
    fi
    
    log_success "Secret '$secret_name' is set and valid"
    return 0
}

# Main validation
echo "🔍 Validating secrets..."
echo "Environment: $ENVIRONMENT"
echo "Production mode: $IS_PRODUCTION"
echo ""

ERRORS=0
WARNINGS=0

# Check required secrets
echo "📋 Checking required secrets..."
for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! check_secret "$secret" true; then
        ((ERRORS++))
    fi
done

echo ""
echo "📋 Checking optional secrets..."
for secret in "${OPTIONAL_SECRETS[@]}"; do
    if ! check_secret "$secret" false; then
        if [ "$IS_PRODUCTION" = "true" ]; then
            ((ERRORS++))
        else
            ((WARNINGS++))
        fi
    fi
done

echo ""
if [ $ERRORS -gt 0 ]; then
    log_error "Validation failed with $ERRORS error(s)"
    if [ "$IS_PRODUCTION" = "true" ]; then
        echo ""
        echo "❌ Production deployment blocked due to secret validation failures"
        exit 1
    fi
fi

if [ $WARNINGS -gt 0 ]; then
    log_warning "Validation completed with $WARNINGS warning(s)"
else
    log_success "All secrets validated successfully"
fi

exit 0


