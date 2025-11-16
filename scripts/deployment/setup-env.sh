#!/bin/bash
# scripts/deployment/setup-env.sh
# Setup environment variables for deployment

set -e

ENVIRONMENT=${1:-development}
ENV_FILE=".env.$ENVIRONMENT"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Generate secure random string
generate_secret() {
    openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | base64 | tr -d '\n'
}

# Create .env file from template
create_env_file() {
    log "Creating .env file for $ENVIRONMENT environment..."
    
    if [ -f ".env" ] && [ "$ENVIRONMENT" != "development" ]; then
        warning ".env file already exists. Backing up to .env.backup"
        cp .env .env.backup
    fi
    
    cat > .env << EOF
# ============================================================================
# Reconciliation Platform - Environment Configuration
# Environment: $ENVIRONMENT
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# ============================================================================

# Database Configuration
POSTGRES_DB=reconciliation_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(generate_secret)
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}

# Redis Configuration
REDIS_PASSWORD=$(generate_secret)
REDIS_PORT=6379
REDIS_URL=redis://:\${REDIS_PASSWORD}@redis:6379

# JWT Configuration
JWT_SECRET=$(generate_secret)
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGINS=http://localhost:1000
CORS_ORIGIN=http://localhost:1000

# Application Configuration
ENVIRONMENT=$ENVIRONMENT
NODE_ENV=$([ "$ENVIRONMENT" = "production" ] && echo "production" || echo "development")
RUST_LOG=$([ "$ENVIRONMENT" = "production" ] && echo "warn,reconciliation_backend=info" || echo "debug")

# Ports
BACKEND_PORT=2000
FRONTEND_PORT=1000

# Frontend Configuration
VITE_API_URL=http://localhost:2000/api/v1
VITE_WS_URL=ws://localhost:2000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
GRAFANA_PASSWORD=$(generate_secret)

# Elastic Stack (if using)
ELASTICSEARCH_PORT=9200
KIBANA_PORT=5601
APM_PORT=8200
LOGSTASH_PORT=5044

# ============================================================================
# Production-specific overrides (uncomment for production)
# ============================================================================
# CORS_ORIGINS=https://yourdomain.com
# VITE_API_URL=https://api.yourdomain.com/api/v1
# VITE_WS_URL=wss://api.yourdomain.com
EOF

    log ".env file created successfully"
    warning "⚠️  IMPORTANT: Review and update the .env file with production values before deploying to production!"
}

# Validate required variables
validate_env() {
    log "Validating environment variables..."
    
    local required_vars=(
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "CORS_ORIGIN"
    )
    
    local missing=0
    
    if [ ! -f ".env" ]; then
        error ".env file not found. Run: ./scripts/deployment/setup-env.sh $ENVIRONMENT"
    fi
    
    source .env 2>/dev/null || true
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            warning "Missing environment variable: $var"
            missing=$((missing + 1))
        fi
    done
    
    if [ $missing -eq 0 ]; then
        log "All required environment variables are set"
    else
        warning "$missing required environment variable(s) are missing"
    fi
}

main() {
    if [ "$1" = "validate" ]; then
        validate_env
    else
        create_env_file
        validate_env
        log "Environment setup complete!"
        log "Next steps:"
        log "  1. Review .env file"
        log "  2. Update production values if needed"
        log "  3. Run: ./scripts/deployment/deploy-docker.sh $ENVIRONMENT"
    fi
}

main "$@"

